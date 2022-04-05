import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import { VisualSettings } from "settings";

export interface VisualOption {
    cotrOptions?: VisualConstructorOptions,
    settings?: VisualSettings,
    updateOptions?: VisualUpdateOptions
}

export interface State extends VisualOption {
    dataSource?: any;
}