import { PropertyScalar } from "./property-scalar";
import { ValueProvider } from "../provider/value-provider/value-provider";
import { ValueConverter } from "../value-converter/value-converter";
import { AttributeId } from "../attributes/attribute-id";
import { Attribute } from "../attributes/attribute";
import { PropertyId } from "./property-id";
import { ScalarValidator } from "../validators/scalar-validator";
import { ValidationMessage } from "../validators/validation-message";
import { RuleEngineUpdateHandler } from "../engine/rule-engine-update-handler-impl";
import { Logger } from "../util/logger/logger";
import { AbstractPropertyImpl } from "./abstract-property-impl";
import { EmptyValueFcn } from "../provider/value-provider/empty-value-fcn";
import { BackpressureConfig } from "./backpressure/backpressure-config";
import { assertThat } from "../util/assertions/assertions";

export class PropertyScalarImpl<T> extends AbstractPropertyImpl<T> implements PropertyScalar<T> {

    private currentValue?: T | null; // undefined if synchonous and not cached

    protected initialValue?: T | null;
    private placeholder?: string;
    private infoText?: string;
    private label?: string;

    protected scalarValidators: ScalarValidator<T>[] = [];
    
    protected attributeMap?: Map<AttributeId<unknown>, Attribute<any>>;
    protected visible?: Attribute<boolean>;
    protected required?: Attribute<boolean>;

    constructor(
        readonly id: PropertyId,
        private readonly valueProvider: ValueProvider<T>,
        private readonly emptyValueFcn: EmptyValueFcn<T>,
        private readonly valueConverter: ValueConverter<T>,
        updateHandler: RuleEngineUpdateHandler<T>,
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

    setToInitialValue() {
        const initialValue = this.initialValue !== undefined ? this.initialValue : null;
        if (this.valueProvider.shouldBeCached() || this.isAsynchronous()) {
            this.currentValue = initialValue;
        }
        if (!this.isReadOnly()) {
            this.valueProvider.setValue(initialValue);
        }
        Logger.trace(() => `PropertyScalarImpl.setToInitialValue ${this.id}: ${initialValue}`);
    }

    getInitialValue() {
        return this.initialValue ?? null;
    }

    protected getSpecialisedValidationResult() {
        return this.scalarValidators.reduce((res, sv) => {
            const msg = sv(this);
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

    defineInitialValue(value: T | null) {
        this.initialValue = value;
    }

    defineLabel(label: string) {
        this.label = label;
    }

    definePlaceholder(placeholder: string) {
        this.placeholder = placeholder;
    }

    defineInfoText(infoText: string) {
        this.infoText = infoText;
    }

    defineVisibility(visibility?: Attribute<boolean>) {
        this.visible = visibility;
    }

    defineRequiredIfVisible(mandatoriness?: Attribute<boolean>) {
        this.required = mandatoriness;
    }

    defineAttribute(attribute: Attribute<unknown>) {
        if (!this.attributeMap) {
            this.attributeMap = new Map();
        }
        this.attributeMap.set(attribute.id, attribute);
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
        if (!this.isAsynchronous()) {
            this.checkAndTriggerUpdate();
        }
        return this.getCurrentValue();
    }

    setValue(value: T | null) {
        if (value !== this.getCurrentValue()) {
            this.valueProvider.setValue(value);
            this.needsAnUpdate();
        }
    }

    async awaitValue(): Promise<T | null> {
        await this.awaitAsyncUpdate();
        return this.getCurrentValue();
    }

    get<A>(id: AttributeId<A>): A | undefined {
        return this.attributeMap?.get(id)?.getValue();
    }

    isRequired(): boolean {
        return !!this.required && this.required.getValue() && this.isVisible();
    }

    isVisible(): boolean {
        return this.visible?.getValue() ?? true;
    }

    isEmpty() {
        return this.emptyValueFcn(this.getValue());
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

    compareData(a: T | null, b: T | null): boolean {
        return a === b;
    }
    
    // ------------------
    // -- data relevant: end
    // ------------------
}
