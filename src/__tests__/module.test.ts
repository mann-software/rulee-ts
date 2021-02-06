import { Builder } from "../engine/builder/builder";
import { builderAndRuleEngineFactory } from "./utils/test-utils";

test('load a module lazy', () => {
    const [builder, engine] = builderAndRuleEngineFactory();

    const init = (builder: Builder) => {
        const propA = builder.scalar.booleanProperty('PROP_A');
        const propB = builder.scalar.stringProperty('PROP_B');

        return { propA, propB };
    }

    const initSpy = jest.fn(init);
    const module = engine.defineModule(initSpy);

    const props = module.getProperties();
    
    expect(engine.getPropertyById('PROP_A')).not.toBe(undefined);
    expect(props.propA).toBe(engine.getPropertyById('PROP_A'));

    expect(engine.getPropertyById('PROP_B')).not.toBe(undefined);
    expect(props.propB).toBe(engine.getPropertyById('PROP_B'));

    expect(initSpy).toHaveBeenCalledTimes(1);
    module.getProperties();
    expect(initSpy).toHaveBeenCalledTimes(1);
});
