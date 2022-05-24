import powerbi from "powerbi-visuals-api";
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import * as models from "powerbi-models";
import {
    BasicFilter,
    IFilterColumnTarget,
    IAdvancedFilter,
    Filter,
    IBasicFilter
} from "powerbi-models";
import powerbiVisualsApi from "powerbi-visuals-api";
import VisualObjectInstancesToPersist = powerbiVisualsApi.VisualObjectInstancesToPersist;
import FilterAction = powerbiVisualsApi.FilterAction;
import { valueFormatter as valueFormatter, textMeasurementService as tms } from "powerbi-visuals-utils-formattingutils";
import IValueFormatter = valueFormatter.IValueFormatter;
import { State } from 'interface/interface';

export function getSliceData(options: VisualUpdateOptions) {
    let returnValue = [];
    const categories = options.dataViews[0].categorical.categories;
    categories.forEach(ele => {
        let roles = Object.keys(ele.source.roles);
        if (roles.indexOf("slice") != -1) {
            returnValue.push(ele);
        }
    })
    return returnValue;
}

export function rangeFilter(props: State, start: any, end: any) {
    const categories = props.updateOptions.dataViews[0].categorical.categories[0];
    const source = categories.source;
    const filter = new models.AdvancedFilter(
        {
            table: source.queryName.substr(0, source.queryName.indexOf(".")),
            column: source.displayName
        },
        "And",
        {
            operator: "GreaterThanOrEqual",
            value: start
        },
        {
            operator: "LessThanOrEqual",
            value: end
        }
    );
    props.cotrOptions.host.applyJsonFilter(filter, "general", "filter",
        (start && end) ? FilterAction.merge : FilterAction.remove
    );
}

export function inFilter(props: State, values: any = []) {
    const categories = props.updateOptions.dataViews[0].categorical.categories[0];
    let target: IFilterColumnTarget = {
        table: categories.source.queryName.substr(0, categories.source.queryName.indexOf('.')),
        column: categories.source.displayName
    };

    let filter: any = new models.BasicFilter(target, "In", values);

    props.cotrOptions.host.applyJsonFilter(filter, "general", "filter",
        values.length>0 ? FilterAction.merge : FilterAction.remove);
}

export function customPersist(props: State, objectName: string, properties: any) {
    let objects: VisualObjectInstancesToPersist = {
        merge: [
            {
                objectName: objectName,
                selector: null,
                properties: properties
                // properties: { selectData: records }
            }
        ]
    };
    props.cotrOptions.host.persistProperties(objects);
}



export function formatterValue(source: DataViewMetadataColumn, value: any) {

  const categoriesFormatter: IValueFormatter = valueFormatter.create({
      format: valueFormatter.getFormatStringByColumn(source)
  });
  return categoriesFormatter.format(value);

}


