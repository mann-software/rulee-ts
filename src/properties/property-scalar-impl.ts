import { PropertyScalar } from "./property-scalar";
import { ValueProvider } from "../provider/value-provider/value-provider";
import { ValueConverter } from "../value-converter/value-converter";
import { AttributeId } from "../attributes/attribute-id";
import { Attribute } from "../attributes/attribute";
import { PropertyId } from "./property-id";
import { ScalarValidator } from "../validators/validator";
import { ValidationMessage } from "../validators/validation-message";
import { RuleEngineUpdateHandler } from "../engine/rule-engine-update-handler";
import { Logger } from "../util/logger/logger";
import { AbstractPropertyImpl } from "./abstract-property-internals";
import { EmptyValueFcn } from "../provider/value-provider/empty-value-fcn";

export class PropertyScalarImpl<T> extends AbstractPropertyImpl<T> implements PropertyScalar<T> {

    private currentValue?: T | null; // undefined if synchonous and not cached

    protected initialValue?: T;
    private placeholder?: string;
    private infoText?: string;
    private label?: string;

    protected scalarValidators: ScalarValidator<T>[] = [];
    
    protected attributeMap?: Map<AttributeId<any>, Attribute<any>>;
    protected visible?: Attribute<boolean>;
    protected mandatory?: Attribute<boolean>;

    constructor(
        readonly id: PropertyId,
        private valueProvider: ValueProvider<T>,
        private emptyValueFcn: EmptyValueFcn<T>,
        private valueConverter: ValueConverter<T>,
        updateHandler: RuleEngineUpdateHandler<T>
    ) {
        super(updateHandler);
    }

    internallyInit() {
        this.setToInitialValue();
    }

    protected internallySyncUpdate(): void {
        if (this.valueProvider.shouldBeCached()) {
            this.currentValue = this.valueProvider.getValue() as (T | null);
        }
    }

    protected internallyAsyncUpdate(): { asyncPromise: Promise<any>, resolve: (value: any) => void } {
        return {
            asyncPromise: this.valueProvider.getValue() as Promise<T | null>,
            resolve: value => this.currentValue = value
        }
    }

    private getCurrentValue(): T | null {
        return this.currentValue !== undefined ? this.currentValue : this.valueProvider.getValue() as (T | null);
    }

    setToInitialValue() {
        const initialValue = this.initialValue !== undefined ? this.initialValue : null;
        if (this.valueProvider.shouldBeCached() || this.isAsynchronous()) {
            this.currentValue = initialValue;
        }
        if (!this.isReadOnly()) {
            this.valueProvider.setValue(initialValue);
        }
        Logger.trace(() => `PropertyScalarImpl.setToInitialValue ${this.id}`);
    }

    protected getSpecialisedValidationResult() {
        return this.scalarValidators.reduce((res, sv) => {
            const msg = sv.validate(this);
            if (msg) {
                res.push(msg);
            }
            return res;
        }, [] as ValidationMessage[]);
    }

    // ------------------
    // -- bindings (RuleBindingPropertyScalar)
    // ------------------

    addScalarValidator(validator: ScalarValidator<T>) {
        this.scalarValidators.push(validator);
    }

    defineInitialValue(value: T) {
        this.initialValue = value;
    }

    defineLabel(label: string) {
        this.label = label;
    }

    definePlaceholder(placeholder: string) {
        this.placeholder = placeholder;
    }

    defineVisibility(visibility: Attribute<boolean>) {
        this.visible = visibility;
    }

    defineMandatoryIfVisible(mandatoriness: Attribute<boolean>) {
        this.mandatory = mandatoriness;
    }

    defineAttribute(attribute: Attribute<any>) {
        if (!this.attributeMap) {
            this.attributeMap = new Map();
        }
        this.attributeMap.set(attribute.id, attribute);
    }

    // ------------------
    // -- bindings end --
    // ------------------

    getDisplayValue(): string {
        const current = this.getCurrentValue();
        return this.valueConverter.asDisplayValue(current);
    }

    setDisplayValue(value: string | null): void {
        this.setValue(this.valueConverter.fromDisplayValue(value));
    }

    awaitDisplayValue(): Promise<string> {
        return this.awaitValue().then(current => {
            return this.valueConverter.asDisplayValue(current);
        });
    }

    getValue(): T | null {
        this.checkUpdate();
        return this.getCurrentValue();
    }

    setValue(value: T | null) {
        if (value !== this.getCurrentValue()) {
            this.valueProvider.setValue(value);
            this.needsAnUpdate();
        }
    }

    awaitValue(): Promise<T | null> {
        return this.awaitAsyncUpdate().then(() => this.getCurrentValue());
    }

    get<A>(id: AttributeId<A>): A | undefined {
        return this.attributeMap?.get(id)?.getValue();
    }

    isMandatory(): boolean {
        return !!this.mandatory && this.mandatory.getValue() && this.isVisible();
    }

    isVisible(): boolean {
        return this.visible?.getValue() ?? true;
    }

    isEmpty() {
        return this.emptyValueFcn(this.getCurrentValue());
    }

    getLabel(): string {
        return this.label ?? '';
    }

    getInfoText(): string {
        return this.infoText ?? '';
    }

    getPlaceholder(): string {
        return this.placeholder ?? '';
    }

    isAsynchronous(): boolean {
        return this.valueProvider.isAsynchronous() || super.isAsynchronous();
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
        return this.getCurrentValue();
    }

    importData(data: T | null): void {
        this.setValue(data);
    }

    compareData(a: T | null, b: T | null): boolean {
        return a === b;
    }
    
    // ------------------
    // -- data relevant: end
    // ------------------
}
