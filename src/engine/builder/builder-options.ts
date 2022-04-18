import { ValidationMessage } from "../../validators/validation-message";
import { BackpressureConfig } from "../../properties/backpressure/backpressure-config";
import { TextInterpreterFcn, TextInterpreter } from "../../util/text-interpreter/text-interpreter";
import { PropertyScalar } from "../../properties/property-scalar";
import { DataMigrator, SemanticVersionDataMigrator } from "../data/data-migrator";
import { RulesVersion, SemanticRulesVersion } from "../data/rules-version";
import { RuleEngine } from "../rule-engine";

export interface BuilderOptions {
    /**
     * Used for validation: Property is empty according its emptyValueFcn but required
     */
    emptyButRequiredMessage: ((property: PropertyScalar<unknown>) => ValidationMessage) | ValidationMessage;
    /**
     * See: {@link RulesVersion}.
     * 
     * You may use {@link SemanticRulesVersion} as a standard implementation.
     */
    version: RulesVersion;
    /**
     * Register the data migrators that will be used by the rule engine on {@link RuleEngine.importData}.
     * The rule engine will iterate over the list once and applies every {@link DataMigrator} if it is {@link DataMigrator.acceptsVersion} returns true.
     * Note that, the migrators can be chained: meaning if one migrator was applied then the result may be applicable to the next one.
     * 
     * If you use {@link SemanticRulesVersion} for the {@link RulesVersion}, then you can use {@link SemanticVersionDataMigrator}
     * as implementation for {@link DataMigrator}.
     */
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
     * Injects the text interpreter for html, see: {@link TextInterpreter} and {@link TextInterpreterFcn}
     */
    textInterpreterHtml?:  TextInterpreterFcn;
    /**
     * Injects the text interpreter for markdown, see: {@link TextInterpreter} and {@link TextInterpreterFcn}
     */
    textInterpreterMarkdown?:  TextInterpreterFcn;
    /**
     * Injects a custom text interpreter, see: {@link TextInterpreter} and {@link TextInterpreterFcn}
     */
    textInterpreterCustom?:  TextInterpreterFcn;
}

export interface PropertyConfig {
    label?: string;
}
