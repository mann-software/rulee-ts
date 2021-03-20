import { builderAndRuleEngineFactory } from "./utils/test-utils";
import { Builder } from "../engine/builder/builder";
import { C } from "../value-converter/common-value-converters";

let builder: Builder;

beforeEach(() => {
    [builder] = builderAndRuleEngineFactory();
});

test('list of group properties with sum-property', () => {
    const template = builder.group.template((idFcn, index) => {
        const propA = builder.scalar.stringProperty(idFcn('PROP_A'));
        const propB = builder.scalar.derived.async(idFcn('PROP_B'), propA)(C.number.default, {
            deriveAsync: (propA) => Promise.resolve(propA.getNonNullValue().length)
        });
        return { propA, propB }
    });
    const propList = builder.list.create('PROP_LIST', template);
    builder.scalar.derived.sync('SUM', propList)(C.number.default, {
        derive: (propList) => propList.list.reduce((res, item) => res + item.properties.propB.getNonNullValue(), 0)
    });

    propList.addProperties(2);

    const graphData = builder.asVisJsData();
    expect(graphData.nodes.filter(node => node.group === 'scalar')).toHaveLength(3);
    expect(graphData.nodes.filter(node => node.group === 'scalar-async')).toHaveLength(2);
    expect(graphData.nodes.filter(node => node.group === 'group-async')).toHaveLength(2);
    expect(graphData.nodes.filter(node => node.group === 'list')).toHaveLength(1);

    const htmlString = builder.generateNetworkGraphHtmlPage();
    // console.log(htmlString);
    expect(htmlString.includes('<html>') && htmlString.includes('</html>')).toBe(true);
});
