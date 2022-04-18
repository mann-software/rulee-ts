import { PropertyScalar } from "./property-scalar";
import { ValueProvider } from "../provider/value-provider/value-provider";
import { ValueConverter } from "../value-converter/value-converter";
import { Attribute } from "../attributes/attribute";
import { PropertyId } from "./property-id";
import { RuleEngineUpdateHandler } from "../engine/rule-engine-update-handler-impl";
import { Logger } from "../util/logger/logger";
import { AbstractPropertyImpl } from "./abstract-property-impl";
import { EmptyValueFcn } from "../provider/empty-value-fcn";
import { BackpressureConfig } from "./backpressure/backpressure-config";
import { assertThat } from "../util/assertions/assertions";

export class PropertyScalarImpl<T> extends AbstractPropertyImpl<T> implements PropertyScalar<T> {

    private currentValue?: T | null; // undefined if synchonous and not cached
    protected initialValue?: T | null;

    private placeholder?: string;
    private infoText?: string;
    protected required?: Attribute<boolean>;

    constructor(
        readonly id: PropertyId,
        private readonly valueProvider: ValueProvider<T>,
        private readonly emptyValueFcn: EmptyValueFcn<T>,
        private readonly valueConverter: ValueConverter<T>,
        updateHandler: RuleEngineUpdateHandler,
        backpressureConfig?: BackpressureConfig,
    ) {
        super(updateHandler, backpressureConfig);
    }

    protected internallySyncUpdate(): void {
        if (this.valueProvider.shouldBeCached()) {
            this.currentValue = this.valueProvider.getValue() as (T | null);
        }
    }

    protected internallyAsyncUpdate(): { asyncPromise: Promise<any>; resolve: (value: any) => void } {
        const asyncPromise = this.valueProvider.getValue();
        assertThat(
            () => asyncPromise instanceof Promise, 
            () => `${this.id}: Expect the value provider to return a promise since it is declared as asynchronous`
        );
        return {
            asyncPromise: asyncPromise as Promise<T | null>,
            resolve: value => {
                this.currentValue = value;
            }
        }
    }

    private getCurrentValue(): T | null {
        return this.currentValue !== undefined ? this.currentValue : this.valueProvider.getValue() as (T | null);
    }

    setDataToInitialState() {
        this.valueProvider.setDataToInitialState();
        const initialValue = this.initialValue !== undefined ? this.initialValue : null;
        if (this.valueProvider.shouldBeCached() || this.isAsynchronous()) {
            this.currentValue = initialValue;
        }
        if (!this.isReadOnly()) {
            this.setValue(initialValue);
        }
        Logger.trace(() => `PropertyScalarImpl.setToInitialState ${this.id}: ${initialValue}`);
    }

    getInitialValue() {
        return this.initialValue ?? null;
    }

    // ------------------
    // -- bindings (RuleBindingPropertyScalar)
    // ------------------

    defineInitialValue(value: T | null) {
        this.initialValue = value;
    }

    definePlaceholder(placeholder: string) {
        this.placeholder = placeholder;
    }

    defineInfoText(infoText: string) {
        this.infoText = infoText;
    }

    defineRequiredIfVisible(mandatoriness?: Attribute<boolean>) {
        this.required = mandatoriness;
    }

    // ------------------
    // -- bindings end --
    // ------------------

    getDisplayValue(): string {
        const current = this.getValue();
        return this.valueConverter.asDisplayValue(current);
    }

    setDisplayValue(value: string | null): void {
        this.setValue(this.valueConverter.fromDisplayValue(value));
    }

    async awaitDisplayValue(): Promise<string> {
        const current = await this.awaitValue();
        return this.valueConverter.asDisplayValue(current);
    }

    getNonNullValue() {
        return this.getValue() ?? this.valueConverter.getNullFallbackValue();
    }

    getValue(): T | null {
        this.syncUpdateIfNeeded();
        return this.getCurrentValue();
    }

    setValue(value: T | null) {
        if (value !== this.getCurrentValue()) {
            const setFeedback = this.valueProvider.setValue(value);
            if (setFeedback !== undefined) {
                setFeedback.then(() => {
                    this.needsAnUpdate();
                }, err => {
                    this.tellValueChangeListeners(listener => listener.updateFailed?.(err));
                });
            } else {
                this.needsAnUpdate();
                if (this.hasValueChangeListeners()) {
                    this.syncUpdateIfNeeded();
                }
            }
        }
    }

    async awaitValue(): Promise<T | null> {
        await this.awaitAsyncUpdate();
        return this.getCurrentValue();
    }

    isRequired(): boolean {
        return !!this.required && this.required.getValue() && this.isVisible();
    }

    isEmpty() {
        return this.emptyValueFcn(this.getValue());
    }

    getInfoText(): string {
        return this.infoText ?? '';
    }

    getPlaceholder(): string {
        return this.placeholder ?? '';
    }

    isAsynchronous(): boolean {
        return this.valueProvider.isAsynchronous();
    }

    isProcessing(): boolean {
        return this.valueProvider.isProcessing();
    }

    isReadOnly(): boolean {
        return this.valueProvider.isReadOnly();
    }

    // ------------------
    // -- data relevant -
    // ------------------

    exportData(): T | null {
        return this.getValue();
    }

    importData(data: T | null): void {
        this.setValue(data);
    }
    
    // ------------------
    // -- data relevant: end
    // ------------------
}
