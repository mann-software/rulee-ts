import { ValidationMessage } from "../../validators/validation-message";
import { BackpressureConfig } from "../../properties/backpressure/backpressure-config";
import { TextInterpreterFcn } from "../../util/text-interpreter/text-interpreter";
import { PropertyScalar } from "../../properties/property-scalar";
import { DataMigrator } from "../data/data-migrator";
import { RulesVersion } from "../data/rules-version";

export interface BuilderOptions {
    /**
     * Used for validation: Property is empty according its emptyValueFcn but required
     */
    emptyButRequiredMessage: ((property: PropertyScalar<unknown>) => ValidationMessage) | ValidationMessage
    version: RulesVersion;
    dataMigrators?: DataMigrator[];
    /**
     * The default empty choice will be
     * emptyChoice = { value: null, displayValue: defaultEmptyChoiceDisplayValue }
     */
    defaultEmptyChoiceDisplayValue?: string;
    /**
     * Used as BackpressureConfig for every property that has no
     * explicit BackpressureConfig defined. If no custom default is provided,
     * the RuleEngine defaut is applied.
     */
    defaultBackpressureConfig?: BackpressureConfig;
    /**
     * 
     */
    textInterpreterHtml?:  TextInterpreterFcn;
    /**
     * 
     */
    textInterpreterMarkdown?:  TextInterpreterFcn;
    /**
     * 
     */
    textInterpreterCustom?:  TextInterpreterFcn;
}

export interface PropertyConfig {
    label?: string;
}
