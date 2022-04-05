/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
    public general: generalSettings = new generalSettings();
    public loop: loopSettings = new loopSettings();
    public selection: selectionSettings = new selectionSettings();
    public item: itemSettings = new itemSettings();
    public titleItem: titleItemSettings = new titleItemSettings();
    
    
}


export class titleItemSettings {
  public title: string =  "";
  public titleFontFamily: string =  "Arial";
  public titleSize: number = 14;
  public titleColor: string = "#000"; 
}

export class itemSettings {
  public dropDownContainer: number = 18;
  public dropDownFontSize: number =  18;
  public fontSize: number = 18;
  public fontFamily: string = "Arial";
  public selectedFontColor: string ="#000";
  public background: string = "#000";
  public fontColor: string = "#000";
  public selectedBackground: string = "#000";
  public selectHeight: string = "12";
  public selectbackground: string = "#000";
  public listShowBackground: string = "#000";
}

export class selectionSettings {
  public switchRadio: boolean =  false;
  public displayMode: string =  "List";
  public condition: string = "";
  public isRadio: boolean = false;
  public showAll: boolean = false;
  public delimiter: string = "";
  public columns: number = 15;
  public SearchInput: boolean = false;
  public FuzzySearchInput: boolean = false;
  public Icon: string = "NoIcon";
  public IgnoreDefaultValues: boolean = false;
}

export class generalSettings {
    public columns: number = 0;
    public rows: number = 0;
    public rangeSelectionStart: string = "";
    public multiselect: boolean = null;
    public selection: string = null;
    public filter: any = null;
}

export class loopSettings {
    // public show: boolean = true;
    public defaultValue: string = '';
}

