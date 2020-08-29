import { assertThat } from "../../util/assertions/assertions";
import { PropertyScalar } from "../../properties/property-scalar";
import { ValueChangeListener } from "../../properties/value-change-listener";
import { ValidationMessage } from "../../validators/validation-message";
import { executeAfterTime } from "./timing-utils";

/**
 * InputComponentMock that fits to input components that could be written with 
 * - React Hooks: each attribute like currentValue would be a useState-Hook and registerBinding/unregisterBinding would be done with the useEffect-Hook
 * - Angular's two-way-binding: attributes would be used in html-Template and registerBinding would be called in onInit and unregisterBinding in onDestroy
 * - others that work similar like Vue.js
 */
export class InputComponentMock {

    currentValue = '';
    processing?: boolean;
    visible?: boolean;
    readonly?: boolean;
    label?: string;
    placeholder?: string;
    valid?: boolean;
    validationMsgs?: ValidationMessage[];

    private readonly binding: ValueChangeListener = {
        needsAnUpdate: () => void this.property.awaitValue(),
        startsAsyncUpdate: () => this.processing = true,
        updated: () => {
            this.processing = false;
            this.visible = this.property.isVisible();
            this.currentValue = this.property.getDisplayValue();
        },
        dependencyHasBeenUpdated: (dependency) => {
            if (dependency.options.visible) {
                this.visible = this.property.isVisible();
            }
            this.readonly = this.property.isReadOnly();
            this.label = this.property.getLabel();
            this.placeholder = this.property.getPlaceholder();
        },
        validated: () => {
            this.valid = this.property.isValid();
            this.validationMsgs = this.property.getValidationMessages();
        }
    };

    constructor(private readonly property: PropertyScalar<unknown>) { }

    userTypewrites(...inputKeys: string[]): Promise<void> {
        assertThat(() => inputKeys.length > 0, () => 'InputComponentMock: must typewrite anything');

        for (let i = 0; i < inputKeys.length; i++) {
            const typing = executeAfterTime(() => {
                this.currentValue = this.currentValue + inputKeys[i];
                this.property.setDisplayValue(this.currentValue);
            }, 10 * i);
            if (i === inputKeys.length - 1) {
                return typing;
            }
        }
        return Promise.resolve();
    }

    userBackspace(count = 1): Promise<void> {
        assertThat(() => count > 0, () => 'InputComponentMock: expect at last one backspace');
        while (this.currentValue !== '' && count > 0) {
            this.currentValue = this.currentValue.substr(0, this.currentValue.length - 1);
            this.property.setDisplayValue(this.currentValue);
            count--;
        }
        return Promise.resolve();
    }

    /**
     * Property is existent on current html page -> bind it
     */
    registerBinding(initialize = true) {
        if (initialize) {
            // set initial values
            this.currentValue = this.property.getDisplayValue();
            this.processing = this.property.isProcessing();
            this.visible = this.property.isVisible();
            this.readonly = this.property.isReadOnly();
            this.label = this.property.getLabel();
            this.placeholder = this.property.getPlaceholder();
            this.valid = this.property.isValid();
            this.validationMsgs = this.property.getValidationMessages();
        }
        // binding
        this.property.registerValueChangedListener(this.binding);
    }

    /**
     * E.g. user leaves the page -> unbind it
     */
    unregisterBinding() {
        this.property.deregisterValueChangedListener(this.binding)
    }
}
