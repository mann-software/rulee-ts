import { ruleBuilderAndEngineFactory } from "./utils/test-utils";
import { RuleBuilder } from "../engine/builder/rule-builder";
import { C } from "../value-converter/common-value-converters";

let ruleBuilder: RuleBuilder;

beforeEach(() => {
    [ruleBuilder] = ruleBuilderAndEngineFactory();
});

test('list of group properties with sum-property', () => {
    const template = ruleBuilder.group.template((idFcn, index) => {
        const propA = ruleBuilder.scalar.stringProperty(idFcn('PROP_A'));
        const propB = ruleBuilder.scalar.derived.async1(idFcn('PROP_B'), C.number.default, propA, {
            deriveAsync: (propA) => Promise.resolve(propA.getNonNullValue().length)
        });
        return { propA, propB }
    });
    const propList = ruleBuilder.list.createList('PROP_LIST', template);
    ruleBuilder.scalar.derived.sync1('SUM', C.number.default, propList, {
        derive: (propList) => propList.list.reduce((res, item) => res + item.properties.propB.getNonNullValue(), 0)
    });

    propList.addProperties(2);

    const graphData = ruleBuilder.asVisJsData();
    expect(graphData.nodes.filter(node => node.group === 'scalar')).toHaveLength(3);
    expect(graphData.nodes.filter(node => node.group === 'scalar-async')).toHaveLength(2);
    expect(graphData.nodes.filter(node => node.group === 'group-async')).toHaveLength(2);
    expect(graphData.nodes.filter(node => node.group === 'list')).toHaveLength(1);

    const htmlString = ruleBuilder.generateNetworkGraphHtmlPage();
    console.log(htmlString);
    expect(htmlString.includes('<html>') && htmlString.includes('</html>')).toBe(true);
});
