declare const $: any;
declare const _: any;

module powerbi.extensibility.visual {

  export class Visual implements IVisual {
    private target: HTMLElement;
    private selectionManager: ISelectionManager;
    private selectionIds: any = {};
    private host: IVisualHost;
    private isEventUpdate: boolean = false;
    private lastSelectedValue: string;
    private selections: any = {};
    private settings: any;
    private prevDataViewObjects: any = {}; // workaround temp variable because the PBI SDK doesn"t correctly identify style changes. See getSettings method.
    private condition: string = "";
    private isRadio: boolean = false;
    private displayMode: string = "table";
    private categories: Array<any> = [];
    private treeData: any;
    private zTreeObj: any;
    private setting: any;
    private delimiter: string = "";
    private columns: number = 1;
    private fontSize: number = 12;
    private titleSize: number = 12;
    private fontColor: string = "#9A9A9A";
    private titleColor: string = "#9A9A9A";
    private selectedFontColor: string = "#FFFFFF";
    private background: string = "#EAEAEA";
    private selectedBackground: string = "#858585";
    private showAll: boolean = false;
    private width: number;
    private height: number;
    private title: string = "";
    private fontFamily: string = "Arial";
    private titleFontFamily: string = "Arial";
    private showSearchInput: Boolean = false;
    private textInputValue: string = "";
    private searchText: string = "All";
    // private SearchInput:boolean=true;
    private divy: number;
    private dy: string;
    private dVcount: number = 0;
    private dataViewValue: any = [];
    private StartDate: any;
    private EndDate: any;
    private option: VisualUpdateOptions;
    private iconJudge: any = "FirstIcon";
    private IJudge: boolean = true;
    private fuzzyJudge: boolean = true;
    private FJudge: boolean = true;
    private preDisplayMode = "";
    //这里是记录单选上一个选择的数据，为了使单选必须有一个值是被选中的
    // private radioValue=null;
    // private tableRadioValue;
    private input_select: any;
    private dateCategories: any;

    private preStartTime: any;
    private preEndTime: any;

    constructor(options: VisualConstructorOptions) {
      this.target = options.element;
      this.host = options.host;
      this.selectionManager = options.host.createSelectionManager();
      this.target.parentNode["className"] = `${this.target.parentNode["className"]} ${this.target["className"]}`;
      console.log("constructor", options);
    }

    private VisualObjectInstanceForIgnoreDefaultValues() {
      if (!this.settings.IgnoreDefaultValues) {
        let objects: VisualObjectInstancesToPersist = {
          merge: [
            <VisualObjectInstance>{
              objectName: "selection",
              selector: null,
              properties: { IgnoreDefaultValues: !this.settings.IgnoreDefaultValues }
            }]
        };
        this.host.persistProperties(objects);
      }
    }

    public update(options: VisualUpdateOptions) {

      //设置截止日期
      // var time = Date.parse(new Date().toString());
      // var visibleData = Date.parse('2023/4/14 23:59:59');
      // if (time >= visibleData) {
      //   this.target.innerHTML = `
      //         <h2>使用时间已到期，如需继续使用请联系 上北智信 。</h2>
      //         <h2>电话：400-6992010</h2>
      //         <h2>邮箱：public@sharewinfo.com</h2>
      //         <h2>公司官网：http://www.sharewinfo.com/</h2>
      //         `;
      //   return;
      // }

      let THIS = this;
      // 上下文
      document.getElementById("sandbox-host").addEventListener("contextmenu",
      function (event:any) {
        event.preventDefault();
        var catg = options.dataViews[0].categorical.categories[0];
        var index = catg.values.indexOf(event.target.innerText);
        const selectionId = THIS.host.createSelectionIdBuilder()
          .withCategory(catg, index)
          .createSelectionId();
        THIS.host.createSelectionManager().showContextMenu(index >= 0 ? selectionId : {}, {
          x: event.offsetX,
          y: event.offsetY
        });
      })

      watermarkAdaptive(this.host);
      this.dVcount += 1;
      this.option = options;

      let dataView = this.option.dataViews[0];
      this.dateCategories = dataView.categorical.categories;
      this.dataViewValue = dataView.categorical.categories[0].values;

      let settingsChanged = this.getSettings(dataView.metadata.objects); // workaround because of sdk bug that doesn"t notify when only style has changed
      // console.log('settings', JSON.stringify(this.settings, null, " "));
      // console.log('options', options);

      // console.log('this.settings.title',this.settings.title);
      // if(this.settings.isRadio == true){
      //     this.settings.showAll = false;
      // }

      var ValueArray = dataView.categorical.categories[0].values;
      this.divy = this.target.offsetHeight;
      // this.controllerShowAll();
      //tree 切换图标判断，主要是在下面使用 this.IJudge
      if (this.settings.Icon == this.iconJudge) {
        this.IJudge = true;
      } else {
        this.iconJudge = this.settings.Icon;
        this.IJudge = false;
      }

      // 清空多选项.
      if (this.settings.isRadio) {
        // 清空多选项.
        this.selections = {};
      }
      let categories = this.option.dataViews[0].categorical.categories;

      if (this.option.dataViews[0].categorical.categories.length === this.categories.length) {
        let jj = true;
        for (let i in categories) {
          if (categories[i].source.displayName !== this.categories[i].source.displayName
            || categories[i].values.toString() !== this.categories[i].values.toString()) {
            this.categories = categories;
            this.init(options);
            // 清空选项
            this.selections = {};
            this.lastSelectedValue = null;
            // this.selectionManager.clear();
            // this.selectionManager.select(undefined);
            this.setSelect([])
            if (this.settings.displayMode === "select") {
              $(".list-show")[0].innerHTML = "All";
              this.searchText = "All";
            }

            jj = false;
          } else {

            if (this.settings.displayMode == "date" && options.type == 2) {
              if (this.settings.startTime != this.preStartTime || this.settings.endTime != this.preEndTime) {
                this.init(options);
              }
            }
          }
        }
        this.preStartTime = this.settings.startTime;
        this.preEndTime = this.settings.endTime;

        this.categories = categories;
        //通过  jj 判断 上面的for循环的判断来决定是否执下面的语句  （for循环里的判断是清空）
        if (jj == false) {
          try {
            this.applyLastSelections(dataView);
          } catch (e) {
            console.log(e);
          }
        }

      } else {
        this.init(options);
        if (this.categories.length) {
          this.selections = {};
          this.lastSelectedValue = null;
          // this.selectionManager.clear();
          // this.selectionManager.select(undefined);
          this.setSelect([])
          if (this.settings.displayMode === "select") {
            $(".list-show")[0].innerHTML = "All";
            this.searchText = "All";
          }
        } else {
          try {
            this.applyLastSelections(dataView);
          } catch (e) {
            console.log(e);
          }
        }

        this.categories = categories;
      }
      if (this.settings.title !== this.title || this.settings.displayMode !== this.displayMode || this.settings.delimiter !== this.delimiter || this.settings.columns !== this.columns || this.settings.showAll !== this.showAll || this.IJudge == false) {

        if (this.delimiter !== this.settings.delimiter) {
          this.lastSelectedValue = this.lastSelectedValue ? this.lastSelectedValue.split(this.delimiter || ',').join(this.settings.delimiter || ',') : "";
          for (let value in this.selections) {
            let val = value.split(this.delimiter || ',').join(this.settings.delimiter || ',');
            if (!this.selections[val]) {
              this.selections[val] = val;
              delete (this.selections[value]);
            }
          }
        }
        this.init(options);

        this.title = this.settings.title;
        this.delimiter = this.settings.delimiter;
        this.columns = this.settings.columns;
        this.showAll = this.settings.showAll;
        this.displayMode = this.settings.displayMode;
        if (this.lastSelectedValue || this.lastSelectedValue === "") {
          this.initCheckbox();
        }
      }
      if (this.option.viewport.height !== this.height || this.titleSize !== this.settings.titleSize) {
        this.height = this.option.viewport.height;
      }
      let fontColor = this.settings.fontColor ? this.settings.fontColor.solid.color : "";
      let titleColor = this.settings.titleColor ? this.settings.titleColor.solid.color : "";
      let selectedFontColor = this.settings.selectedFontColor ? this.settings.selectedFontColor.solid.color : "";
      let background = this.settings.background ? this.settings.background.solid.color : "";
      let selectedBackground = this.settings.selectedBackground ? this.settings.selectedBackground.solid.color : "";
      if (this.settings.fontSize !== this.fontSize || this.settings.fontFamily !== this.fontFamily || this.settings.titleFontFamily !== this.titleFontFamily || this.settings.titleSize !== this.titleSize || fontColor !== this.fontColor || titleColor !== this.titleColor || selectedFontColor !== this.selectedFontColor || background !== this.background || selectedBackground !== this.selectedBackground) {
        this.fontSize = this.settings.fontSize;
        this.titleSize = this.settings.titleSize;
        this.fontFamily = this.settings.fontFamily;
        this.titleFontFamily = this.settings.titleFontFamily;
        this.fontColor = fontColor;
        this.titleColor = titleColor;
        this.selectedFontColor = selectedFontColor;
        this.background = background;
        this.selectedBackground = selectedBackground;
        this.changeTextStatus(this.settings);
      }
      if (this.option.viewport.width !== this.width) {

        this.width = this.option.viewport.width;
        if (this.settings.displayMode === "table") {
          this.changeTextStatus(this.settings);
        }
      }

      //调整 类型为select的时候 select-tree 的高度
      if (this.settings.displayMode === "select") {
        //这里 类型切换 的时候select类型为打开状态
        if (this.preDisplayMode && this.preDisplayMode != this.settings.displayMode) {
          $("#select-tree").show();
        }
        // let selectHeight = this.settings.title ? this.height - 20 - (parseInt(this.settings.titleSize) * 1.5) : this.height - (parseInt(this.settings.titleSize) * 1.5)

        let selectHeight = this.settings.selectHeight;
        let selectbackground = this.settings.selectbackground.solid.color;
        // selectHeight
        $("#select-tree").css({
          "height": `${selectHeight}px`,
          // "width": "calc(" + 100 + "%" + " - " + "4px)",                 //将滚动条与下拉框对齐
          "background-color": selectbackground
        });

        let listShowBackground = this.settings.listShowBackground.solid.color;
        $(".list-show").css({
          "background-color": listShowBackground
        });


        $(document).unbind("mouseleave");
        $("#select-tree").unbind("mouseleave");
        $("#select-tree").unbind("mouseenter");

        //设置 select-tree 显示还是不显示
        $(document).on("mouseleave", function () {
          $("#select-tree").hide();
        })
      }
      this.preDisplayMode = this.settings.displayMode;


      //判断fuzzySearch开关状态,为了显示模糊搜索时隐藏的内容，主要是在下面使用 this.FJudge == false
      if (this.settings.FuzzySearchInput == this.fuzzyJudge) {
        this.FJudge = true;
      } else {
        this.fuzzyJudge = this.settings.FuzzySearchInput;
        this.FJudge = false;
      }
      if (this.FJudge == false) {
        var fuzzyValueNull = [];
        this.onSearchFuzzy(fuzzyValueNull, '');
      }

      // 在单选的情况没有任何选中的值的情况下，默认选中第一个值

      // if(this.settings.displayMode != 'table' && this.settings.isRadio ==true && this.lastSelectedValue == null){
      //     if(this.zTreeObj.getSelectedNodes().length ==0){
      //         if(this.settings.displayMode != 'tree'){
      //             this.singleSelect(this.zTreeObj.getNodes()[0],this.settings.displayMode,false,false);
      //         }else{
      //             this.singleSelect(this.zTreeObj.getNodes()[0],this.settings.displayMode,true,false);
      //         }
      //         // this.radioValue = this.zTreeObj.getNodes()[0];
      //     }
      // }
      // if(this.settings.displayMode == 'table' && this.settings.isRadio ==true && this.lastSelectedValue == null){
      //     if($(".active").length == 0){
      //         this.singleSelect(this.dataViewValue[0],this.settings.displayMode,false,false);
      //     }
      // }

      //默认值

      let selectionsArr = [];
      if (Object.keys(this.selections).length > 0) {
        Object.keys(this.selections).map(key => {
          selectionsArr.push(this.selections[key]);
        })
      }

      if (THIS.dVcount === 1) {
        
        if (this.option.dataViews[0]
          && this.option.dataViews[0].categorical
          && this.option.dataViews[0].categorical.values
          && this.option.dataViews[0].categorical.values[0]
          && this.option.dataViews[0].categorical.values[0].values
          && this.option.dataViews[0].categorical.values[0].values[0]) {
          if (!this.settings.IgnoreDefaultValues) {
            let filedDefaultValue = String(this.option.dataViews[0].categorical.values[0].values[0]);
            if (selectionsArr.length > 1 || (selectionsArr.length === 1 && String(selectionsArr[0]) !== filedDefaultValue)) {
              this.VisualObjectInstanceForIgnoreDefaultValues();
            } else {
              this.condition = filedDefaultValue;
              this.onConditionChanged(options, null, 'defualtValue');
              this.VisualObjectInstanceForIgnoreDefaultValues();
            }
          }
        } else {
          if (!this.settings.IgnoreDefaultValues) {
            if (this.settings && this.settings.condition && this.settings.condition !== this.condition) {
              if (selectionsArr.length > 1 || (selectionsArr.length === 1 && String(selectionsArr[0]) !== this.settings.condition)) {
                this.VisualObjectInstanceForIgnoreDefaultValues();
              } else {
                this.condition = this.settings.condition;
                this.onConditionChanged(options, null, 'defualtValue');
                this.VisualObjectInstanceForIgnoreDefaultValues();
              }
            }
          }
        }
      }

      if (this.settings && this.settings.isRadio !== undefined && this.settings.isRadio !== this.isRadio) {
        // 单选多选切换
        this.isRadio = this.settings.isRadio;
        this.onIsRadioChanged(this.isRadio);
      }

      this.setSelectSize();

      this.SearchInputSwitch();


      // 日期样式
      if (this.settings.displayMode == "date") {
        this.isShowDateElement();
        var tempcolor = this.settings.fontColor.solid.color;
        var tempNoSelectedBackground = this.settings.background.solid.color;
        var tempSelectedFontColor = this.settings.selectedFontColor.solid.color;
        var tempSelectedBackground = this.settings.selectedBackground.solid.color;
        //设置日期字体大小和表单框
        $("#startDate").css({
          "font-size": this.settings.fontSize + 'px',
          "color": tempcolor
        });
        $("#endDate").css({
          "font-size": this.settings.fontSize + 'px',
          "color": tempcolor
        });
        if (this.settings.fontSize >= 10) {
          $("#startDate").css({
            "height": (Number(this.settings.fontSize) + 3) + 'px',
            "width": (Number(this.settings.fontSize * 0.6) * 10) + 'px'
          });
          $("#endDate").css({
            "height": (Number(this.settings.fontSize) + 3) + 'px',
            "width": (Number(this.settings.fontSize * 0.6) * 10) + 'px'
          });
        }
        //
        $("#startDate").css({ "color": tempcolor, "background-color": tempNoSelectedBackground, "font-family": this.settings.fontFamily });
        $("#endDate").css({ "color": tempcolor, "background-color": tempNoSelectedBackground, "font-family": this.settings.fontFamily });

        //focus
        $("#startDate").focus(function () {
          $("#startDate").css({ "color": tempSelectedFontColor, "background-color": tempSelectedBackground });
        })
        $("#endDate").focus(function () {
          $("#endDate").css({ "color": tempSelectedFontColor, "background-color": tempSelectedBackground });
        })

        //blur
        $("#startDate").blur(function () {
          $("#startDate").css({ "color": tempcolor, "background-color": tempNoSelectedBackground });
        })
        $("#endDate").blur(function () {
          $("#endDate").css({ "color": tempcolor, "background-color": tempNoSelectedBackground });
        })
      }
      //table  自适应
      this.tablecolumn(settingsChanged, ValueArray, dataView);


      $("#radio").remove();
      if (this.settings.switchRadio === false) {
        this.FontInputAdaptive();
        $('#sandbox-host').append(`<div id="radio"><style> li>span:nth-child(2){border:1px solid #AAA !important; } </style></div>`);
      } else {
        $('#sandbox-host').append(`<div id="radio"><style> li>span:nth-child(2){border:0px solid #AAA !important; } </style></div>`);
      }

      //this.OverallBckgroundColor();
      // this.controllerShowAll();
    }

    private setSelectSize() {
      //select 设置边框的大小
      let settings = this.settings;
      if (settings.displayMode == "select") {
        $(".list-container").css({ "height": settings.dropDownContainer * 1.5 });
        $(".list-show").css({
          "line-height": settings.dropDownContainer * 1.5 + "px",
          "font-size": settings.dropDownFontSize + "px"
        });
        $(".list-arrow-btn").css({ "height": settings.dropDownFontSize * 0.3, "width": settings.dropDownFontSize * 0.3 });
      }
    }

    private isShowDateElement() {
      this.settings.isShowInput ? $("#inputDate").show() : $("#inputDate").hide();
      this.settings.isShowslider ? $("#sliderParent").show() : $("#sliderParent").hide();
    }

    //这里的函数是为了控制单选时禁止出现 SelectAll
    private controllerShowAll() {
      try {
        if (this.settings.isRadio) {
          if (this.settings.showAll) {
            if (this.settings.displayMode == "table") {
              if ($("#SelectAll").length)
                $("#SelectAll").hide()
            }
            else {
              if ($("[title='selectAll']").length) {
                $("[title='selectAll']").parent().hide();
              }
            }
          }
        } else {
          if (this.settings.showAll) {
            if (this.settings.displayMode == "table") {
              if ($("#SelectAll").length)
                $("#SelectAll").show();
            }
            else {
              if ($("[title='selectAll']").length) {
                $("[title='selectAll']").parent().show();
              }
            }
          }
        }
      } catch (e) {
        console.log(e);
      }
    }

    // 
    private FontInputAdaptive() {

      // 设置搜索框的自适应 
      $("#textinput").css({ "height": this.settings.fontSize * 1.3, "font-size": this.settings.fontSize });
      $(".textDiv>input").css({ "height": this.settings.fontSize * 1.3, "font-size": this.settings.fontSize });
      var noselectradioCheckboxcolor = this.settings.noselectradioCheckboxcolor;
      var selectedradioCheckboxcolor = this.settings.selectedradioCheckboxcolor;
      //设置radio和checkbox 的初始颜色
      if (this.settings.displayMode == "list" || this.settings.displayMode == "select") {
        $(".button").css({ "background-image": "none" });
        $(".chk").css({ "height": this.settings.fontSize - 2, "width": this.settings.fontSize - 2, "margin-bottom": "4px", "margin-left": "5px" });
        if (noselectradioCheckboxcolor && noselectradioCheckboxcolor.solid && noselectradioCheckboxcolor.solid.color) {
          $(".chk").css({ "background-color": noselectradioCheckboxcolor.solid.color });
        }
        if (selectedradioCheckboxcolor && selectedradioCheckboxcolor.solid && selectedradioCheckboxcolor.solid.color) {
          var arr = document.getElementsByClassName("checkbox_true_full");
          var focus = document.getElementsByClassName("checkbox_true_full_focus");
          for (var i = 0; i < arr.length; i++) {
            $(arr[i]).css({ "background-color": selectedradioCheckboxcolor.solid.color });
          }
          for (var i = 0; i < focus.length; i++) {
            $(focus[i]).css({ "background-color": selectedradioCheckboxcolor.solid.color });
          }
        }
      }

    }

    private SearchInputSwitch() {
      //设置按钮，控制搜索框的显示和隐藏
      // if(this.settings.SearchInput==this.SearchInput){
      //     if(this.settings.displayMode === "select")
      //     {
      //         $("#textinput").show();
      //     }
      //     else{
      //         $("#textinput").show();
      //     }
      // }else{
      //     $("#textinput").hide();
      // }

      if (this.settings.SearchInput) {
        $("#textinput").show();
      } else {
        $("#textinput").hide();
      }

    }

    private tablecolumn(settingsChanged, ValueArray, dataView) {
      //设置 table 的自适应
      this.divy = this.target.offsetHeight;
      if (this.settings.displayMode == "table") {
        var JudgeTd = document.getElementsByTagName("td");
        let len = JudgeTd.length;
        if (this.settings.columns == 0) {
          if (JudgeTd) {
            if (len < 3) {
              if (this.settings.isRadio && this.settings.showAll) {
                len -= 1;
              }
              let Cols = (100 / len).toFixed(1);
              for (var f = 0; f < JudgeTd.length; f++) {
                $(JudgeTd[f]).css("width", "calc(" + Cols + "%" + " - " + "3px)");
                JudgeTd[f].setAttribute("height", (this.divy - 14) + "px");
                JudgeTd[f].style.lineHeight = (this.divy - 14) + "px";
              }
            }
            else {
              for (var f = 0; f < JudgeTd.length; f++) {
                var percent = JudgeTd.length % 3;
                var columns = JudgeTd.length / 3;
                let Cols = (100 / 3).toFixed(1);
                let Length = JudgeTd.length;
                //这里是因为 单选不能出现 selectAll 这个按钮在table中，所以减 1
                if (this.settings.isRadio && this.settings.showAll) {
                  Length -= 1;
                }
                var Vpercent = Length % 3;
                let Index = 0;
                if (Vpercent) {
                  Index = (Length - Vpercent) / 3 + 1;
                } else {
                  Index = Length / 3;
                }
                this.dy = String(this.divy / Index - 14);

                JudgeTd[f].setAttribute("height", this.dy + "px");
                JudgeTd[f].style.lineHeight = this.dy + "px";
                JudgeTd[f].style.width = "calc(" + Cols + "%" + " - " + "3px)";
              }
            }
          }
        }

        if (this.settings.columns != 0) {
          for (var f = 0; f < JudgeTd.length; f++) {
            let Cols = (100 / this.settings.columns).toFixed(1);
            let Length = ValueArray.length;
            var Vpercent = Length % Number(this.settings.columns);
            let Index = 0;
            if (Vpercent) {
              Index = (Length - Vpercent) / this.settings.columns + 1;
            } else {
              Index = Length / this.settings.columns;
            }
            this.dy = String(this.divy / Index - 14);
            JudgeTd[f].setAttribute("height", this.dy + "px");
            JudgeTd[f].style.lineHeight = this.dy + "px";
            JudgeTd[f].style.width = "calc(" + Cols + "%" + " - " + "3px)";
          }
        }
      }
    }

    private applyLastSelections(dataView: DataView) {
      let objects = dataView.metadata.objects;
      let columns = dataView.metadata.columns;
      let categories = dataView.categorical.categories;
      if (!objects || !objects.general) {
        return;
      }
      let filter = new Object(objects.general.filter);
      let selection = null;
      for (let x in filter) {
        if (x === "whereItems") {
          selection = filter[x][0].condition.values;
          break;
        }
      }
      let delimiter = this.settings.delimiter || ',';
      let arr = [];
      for (let i in columns) {
        if (columns[i]) {
          arr.push(columns[i].displayName);
        }
      }
      for (let i in selection) {
        if (selection[i]) {
          let value = "";
          try {                               //这里的try catch 是有用的，因为Ztree 会报一个错（原因是异常少了一个数据  主要是切片器切换时出现的错误）
            for (let j in categories) {
              let index = arr.indexOf(categories[j].source.displayName);
              let itemVal = selection[i][index].value || "";
              if (categories[j].source.type.dateTime) {
                let format = categories[j].source.format.split('"').join('').split('%').join("");
                itemVal = this.dateFtt(format, itemVal)
              }
              value += value ? delimiter + itemVal : itemVal;
            }

            if (this.settings.displayMode === "list" || this.settings.displayMode === "tree" || this.settings.displayMode === "select") {
              let ev = this.zTreeObj.getNodesByParam("name", value)[0] || null;
              this.zTreeObj.checkNode(ev, true, true)
            }

            this.selections[value] = value;
            if (Number(i) === selection.length - 1) {
              this.lastSelectedValue = value;
            }
          } catch (error) {
            console.log(error);
          }
        }
      }
      if (this.settings.displayMode === "table") {
        let html = document.getElementById("tableList");
        //let Ediv = html.getElementsTagByName("ediv");
        let td = html.getElementsByTagName("td");

        for (let i = 0; i < td.length; i++) {
          if (this.selections[td[i].innerHTML] || this.selections[td[i].innerHTML] === "") {

            td[i].className = "active";
          }
        }
      }
      if (this.settings.displayMode === "select" && selection.length) {
        if (selection.length === 1) {
          $(".list-show")[0].innerHTML = this.lastSelectedValue;
          this.searchText = this.lastSelectedValue;
        } else {
          $(".list-show")[0].innerHTML = "(多重选择)";
          this.searchText = "(多重选择)";
        }
      }
    }

    private onIsRadioChanged(isRadio: boolean) {
      if (isRadio) {
        this.singleSelect(this.lastSelectedValue, this.settings.displayMode, false, true);
      } else {
        this.multiSelect(this.lastSelectedValue, this.settings.displayMode, false);
      }
    }

    private initCheckbox() {
      if (this.settings.isRadio) {
        if (this.settings.displayMode === "list" || this.settings.displayMode === "tree" || this.settings.displayMode === "select") {
          let ev: any;
          if (this.lastSelectedValue === "SelectAll") {
            ev = this.zTreeObj.getNodesByParam("all", "all") || null;
          } else {
            ev = this.zTreeObj.getNodesByParam("name", this.lastSelectedValue)[0] || null;
          }
          this.checkNode(ev);
          if (ev && this.settings.displayMode === "select") {
            if (ev instanceof Array) {
              if (ev.length) {
                if (ev.length === 1) {
                  $(".list-show")[0].innerHTML = ev[0].name;
                  this.searchText = ev[0].name;
                } else {
                  $(".list-show")[0].innerHTML = "(多重选择)";
                  this.searchText = "(多重选择)";
                }
              } else {
                $(".list-show")[0].innerHTML = "All";
                this.searchText = "All";
              }
            } else {
              $(".list-show")[0].innerHTML = ev.name;
              this.searchText = ev.name;
            }
          }
        } else if (this.settings.displayMode === "table") {
          let html = document.getElementById("tableList");
          let td = html.getElementsByTagName("td");
          if (this.lastSelectedValue === "SelectAll") {
            for (let i = 0; i < td.length; i++) {
              if (td[i]) {
                td[i].className = "active";
              }
            }
          } else {
            for (let i = 0; i < td.length; i++) {
              if (td[i].innerHTML === this.lastSelectedValue) {
                td[i].className = "active";
                break;
              }
            }
          }
        }
      } else {
        if (this.settings.displayMode === "list" || this.settings.displayMode === "tree" || this.settings.displayMode === "select") {
          let count = 0;
          for (let i in this.selections) {
            if ((this.selections[i] || this.selections[i] === "") && (this.selectionIds[this.selections[i]] || this.selectionIds[this.selections[i]] === "")) {
              let ev = this.zTreeObj.getNodesByParam("name", this.selections[i])[0] || null;
              this.zTreeObj.checkNode(ev, true, true);
              count++;
            }
          }
          if (this.settings.showAll) {
            let uncheckedNodes = this.zTreeObj.getCheckedNodes(false);
            let allChecked = true;
            for (let i in uncheckedNodes) {
              if (uncheckedNodes[i].name !== "SelectAll") {
                allChecked = false;
                break;
              }
            }
            this.zTreeObj.checkNode(this.zTreeObj.getNodesByParam("all", "all")[0], allChecked);
          }
          if (this.settings.displayMode === "select") {
            if (count) {
              if (count == 1) {
                for (let i in this.selections) {
                  if (this.selections[i]) {
                    $(".list-show")[0].innerHTML = this.selections[i];
                    this.searchText = this.selections[i];
                  }
                }
              } else {
                $(".list-show")[0].innerHTML = "(多重选择)";
                this.searchText = "(多重选择)";
              }
            } else {
              $(".list-show")[0].innerHTML = "All";
              this.searchText = "All";
            }
          }
        } else if (this.settings.displayMode === "table") {
          let html = document.getElementById("tableList");
          let td = html.getElementsByTagName("td");
          for (let i = 0; i < td.length; i++) {
            if (this.selections[td[i].innerHTML] || this.selections[td[i].innerHTML] === "") {
              td[i].className = "active";
            } else {
              td[i].className = "";

            }
          }
        }
      }
    }

    private changeTextStatus(config) {
      if (this.settings.displayMode === "list" || this.settings.displayMode === "tree" || this.settings.displayMode === "select" || this.settings.displayMode === "date") {
        let id = this.settings.displayMode === "list" ? "#menu-tree" : this.settings.displayMode === "tree" ? "#tree-menu" : "#select-tree";
        let activeStyle = `${id} .checkbox_true_full + a .node_name,.checkbox_true_full_focus + a .node_name,.checkbox_true_part + a .node_name,.checkbox_true_part_focus + a .node_name {`;
        let sizeStyle = `${id} .node_name {`;
        let lineHeightStyle = `${id} li {`;
        let titleStyle = `.title {`
        let listShowStyle = `.list-show{`

        // listShowStyle += `font-size:${config.dropDownFontSize}px;`;
        if (config.fontSize) {
          sizeStyle += `font-size:${config.fontSize}px;line-height: ${config.fontSize * 0.9}px;height: ${config.fontSize * 0.9}px;`;
          lineHeightStyle += `line-height: ${config.fontSize * 1.2}px;`;

        }
        if (config.fontColor) {
          sizeStyle += `color: ${config.fontColor.solid.color};`;
          listShowStyle += `color: ${config.fontColor.solid.color};`;
        }
        if (config.background) {
          sizeStyle += `background: ${config.background.solid.color};`;
        }
        if (config.selectedFontColor) {
          activeStyle += `color: ${config.selectedFontColor.solid.color} !important;`
        }
        if (config.selectedBackground) {
          activeStyle += `background: ${config.selectedBackground.solid.color} !important;`
        }
        if (config.titleSize) {
          titleStyle += `font-size: ${config.titleSize}px;`;
        }
        if (config.titleColor) {
          titleStyle += `color: ${config.titleColor.solid.color};`;
        }
        if (config.fontFamily) {
          sizeStyle += `font-family: ${config.fontFamily};`;
          listShowStyle += `font-family: ${config.fontFamily};`;
        }
        if (config.titleFontFamily) {
          titleStyle += `font-family: ${config.titleFontFamily};`
        }
        let style = `<style>${activeStyle}}${sizeStyle}}${lineHeightStyle}}${titleStyle}}${listShowStyle}}</style>`
        $(".styleDiv").html(style);
      } else if (this.settings.displayMode === "table") {
        let normalStyle = "#tableList td {";
        let activeStyle = "#tableList .active {";
        let Style = "#tableList table {"
        let titleStyle = `.title {`
        if (config.fontSize) {
          normalStyle += `font-size: ${config.fontSize}px;`;
        }
        if (config.fontColor) {
          normalStyle += `color: ${config.fontColor.solid.color};`;
        }
        if (config.background) {
          normalStyle += `background: ${config.background.solid.color};`;
        }
        if (config.selectedFontColor) {
          activeStyle += `color: ${config.selectedFontColor.solid.color};`;
        }
        if (config.selectedBackground) {
          activeStyle += `background: ${config.selectedBackground.solid.color};`;
        }
        let columns: number = 0;
        if (config.columns) {
          columns = Number(config.columns);
        } else {
          if (this.categories && this.categories[0] && this.categories[0].values) {
            columns = this.categories[0].values.length;
          }
        }
        if (config.titleSize) {
          titleStyle += `font-size: ${config.titleSize}px;`;
        }
        if (config.titleColor) {
          titleStyle += `color: ${config.titleColor.solid.color};`
        }
        if (config.fontFamily) {
          normalStyle += `font-family: ${config.fontFamily};`
        }
        if (config.titleFontFamily) {
          titleStyle += `font-family: ${config.titleFontFamily};`
        }
        let clientWidth = document.getElementById('tableList').clientWidth;
        let width = columns * 150 > clientWidth ? columns * 150 : clientWidth;
        Style += `width: ${width}px;`;
        normalStyle += `width: ${(width - columns * 3) / columns}px;`;
        let style = `<style>${normalStyle}}${activeStyle}}${Style}}${titleStyle}}</style>`
        $(".styleDiv").html(style);
      }
    }

    private onConditionChanged(options: VisualUpdateOptions, select, status) {

      if (this.settings.displayMode === "date") {   /// date 类型不需要执行
        return;
      }
      let searchText: any = this.condition;
      try {
        searchText = eval(searchText).toString();           //执行代码
      } catch (err) {
      }
      // 这里是对input输入框的输入值的判断
      if (select != this.input_select && status == 'search') {
        if (select != "") {
          try {
            select = select.split(" ");
          } catch (error) {
            console.log(error);
          }
        }
        searchText = select;
      }
      this.input_select = select;
      //添加中文月份
      try {
        let yue = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
        let temp = '月';
        let all = options.dataViews[0].categorical.categories[0].values;
        let first = options.dataViews[0].categorical.categories[0].values[0];
        let last = options.dataViews[0].categorical.categories[0].values[all.length - 1];
        if (String(first).indexOf(temp) != -1 && String(last).indexOf(temp) != -1) {
          if (0 <= Number(searchText) && Number(searchText) <= 12) {
            searchText = yue[Number(searchText) - 1]
          }
        }
      } catch (err) {
      }
      //使输入值选中
      if (this.settings.isRadio && searchText != "") {
        if ($.type(searchText) == "array") {
          this.singleSelect(searchText[searchText.length - 1], this.settings.displayMode, false, false);
        } else {
          this.singleSelect(searchText, this.settings.displayMode, false, false);
        }
      } else {
        if ($.type(searchText) == "array") {
          for (let d in searchText) {
            if (!this.selections[searchText[d]] && searchText != "") {
              this.multiSelect(searchText[d], this.settings.displayMode, false);
            }
          }
        } else {
          if (!this.selections[searchText] && searchText != "") {
            this.multiSelect(searchText, this.settings.displayMode, false);
          }
        }

      }
    }

    private getEvValue(ev) {
      if (typeof ev === "string" || typeof ev === "number") {
        return ev
      }
      if (ev && ev.srcElement) {
        return ev.srcElement.value || ev.srcElement.innerHTML;
      }
      if (ev && ev.name) {
        return ev.name || "";
      }
    }

    private resetTable() {

      let html = document.getElementById("tableList");
      let td = html.getElementsByTagName("td");
      for (let i = 0; i < td.length; i++) {
        if (td[i]) {
          td[i].className = "";
        }
      }
    }

    private setSelect(value=[]){
        let fliterFlied = this.option.dataViews[0].categorical.categories[0];
        debugger
        let target: any = {
            table: fliterFlied.source.queryName.substr(0, fliterFlied.source.queryName.indexOf('.')),
            column: fliterFlied.source.displayName
        };
        if(fliterFlied.source.type.numeric){
          value = value.map(v=>Number(v))
        }else if(fliterFlied.source.type.dateTime){
          value = value.map(v=>{
            if(typeof v=='string'){
              return new Date(v)
            }
            return v;
          })
        }
        let filter: any = new window["powerbi-models"].BasicFilter(target, "In", value);
    
        this.host.applyJsonFilter(filter, "general", "filter",value.length>0 ? 0 : 1);

    }

    private singleSelect(ev, type, isAll, ischange) {
      //这个if 是为了去判断在单选的情况，如果已有选中就禁止取消

      // if((this.radioValue == ev && type !='table') || (type =='table' && ((this.tableRadioValue == ev.srcElement) && (this.tableRadioValue != null && ev != null ) )))  // || (this.tableRadioValue == ev.srcElement)
      // {
      //     if(type != 'table')
      //     {
      //         this.checkNode(ev);
      //     }
      // }
      // else{

      let value = this.getEvValue(ev) || "";
      let inputType = typeof ev;
      value == this.lastSelectedValue

      // table 单选的时候必须要有一个被选中   只修改这一处
      if (this.settings.displayMode == "table" && this.settings.isRadio && value == this.lastSelectedValue) {
        return;
      }

      this.isEventUpdate = true; // This is checked in the update method. If true it won"t re-render, this prevents and infinite loop
      this.selectionManager.clear(); // Clean up previous filter before applying another one.

      switch (type) {
        case "tree":
          this.zTreeObj.checkAllNodes(false); // 取消选中全部节点
          break;
        case "list":
          this.zTreeObj.checkAllNodes(false); // 取消选中全部节点
          break;
        case "table":
          this.resetTable();
          break;
        case "select":
          this.zTreeObj.checkAllNodes(false); // 取消选中全部节点
          break;
        default:
          break;
      }
      if (this.lastSelectedValue !== value || typeof ev === "string") {
        if (type === "tree" || type === "list" || type === "select") {
          if (inputType === "string" || inputType === "number") {
            let val = ischange ? "name" : "value";
            ev = this.zTreeObj.getNodesByParam(val, ev)[0] || null;
          } else {
            if (value === "SelectAll") {
              ev = this.zTreeObj.getNodesByParam("all", "all") || null;
            }
          }
          this.checkNode(ev);
          let checkedNodes = this.zTreeObj.getCheckedNodes(true);

          // ------
          if (ev && ev.name) {
            this.lastSelectedValue = ev.name;
          }

          let selectArr = [];
          for (let i = 0; i < checkedNodes.length; i++) {
            if (checkedNodes[i] && checkedNodes[i].check_Child_State === -1) {
              // this.selectionManager.select(this.selectionIds[checkedNodes[i].name], true);
              selectArr.push(checkedNodes[i].name)
            }
          }

          this.setSelect(selectArr)

          if (type === "select") {
            //当select为单选的时候，选中一个后关闭select选择框
            setTimeout(function () {
              $("#select-tree").hide();
            }, 500)

            if (checkedNodes.length) {
              if (checkedNodes.length === 1) {
                $(".list-show")[0].innerHTML = checkedNodes[0].value;
                this.searchText = checkedNodes[0].value;
              } else {
                $(".list-show")[0].innerHTML = "(多重选择)";
                this.searchText = "(多重选择)";
              }
            }
          }
        } else if (type === "table") {

          // if (this.lastSelectedValue == value) {
          //     return;
          // }

          this.lastSelectedValue = value;
          let html = document.getElementById("tableList");
          let td = html.getElementsByTagName("td");


          if (isAll) {
            for (let i = 0; i < td.length; i++) {
              if (td[i]) {
                td[i].className = "active";
              }
            }
          } else {
            for (let i = 0; i < td.length; i++) {
              if (td[i].innerHTML == value) {
                td[i].className = "active";
                // this.tableRadioValue=td[i];
                break;
              }
            }
            // this.selectionManager.select(this.selectionIds[value]);
            this.setSelect([value])
          }
        }
      } else {
        this.lastSelectedValue = null;
        if (type === "select") {
          $(".list-show")[0].innerHTML = 'All';
          this.searchText = "All";
        }
      }
       
      // }
      if (this.settings.displayMode != "table") {
        // this.radioValue=ev;
      }
    }

    private checkNode(ev) {
      if (ev) {
        if (ev instanceof Array) {
          for (let i in ev) {
            if (ev[i]) {
              this.zTreeObj.checkNode(ev[i], true, true);

            }
          }
        } else {
          this.zTreeObj.checkNode(ev, true, true);

        }
      }
    }

    private multiSelect(ev, type, isAll) {

      this.isEventUpdate = true; // This is checked in the update method. If true it won"t re-render, this prevents and infinite loop
      this.selectionManager.clear(); // Clean up previous filter before applying another one.
      let value = this.getEvValue(ev) || "";
      let inputType = typeof ev;
      if (type === "list" || type === "tree" || type === "select") {
        if (inputType === "string" || inputType === "number") {
          // ev是string类型时说明是输入的，需要找出节点。
          ev = this.zTreeObj.getNodesByParam("value", ev) || null;
          this.lastSelectedValue = value;
          this.checkNode(ev);

        } else if (ev.getCheckStatus().checked) {
          if (value === "SelectAll") {
            ev = this.zTreeObj.getNodesByParam("all", "all") || null;

            this.checkNode(ev);
          }
          this.lastSelectedValue = value;
        } else {
          if (value === "SelectAll") {
            ev = null;
            this.zTreeObj.checkAllNodes(false);
            this.lastSelectedValue = null;
          }
        }
        this.selections = {};
        let checkedNodes = this.zTreeObj.getCheckedNodes(true); // 获取所有选中的节点
        if (this.settings.showAll) {
          let uncheckedNodes = this.zTreeObj.getCheckedNodes(false);
          let allChecked = true;
          for (let i in uncheckedNodes) {
            if (uncheckedNodes[i].name !== "SelectAll") {
              allChecked = false;
              break;
            }
          }
          this.zTreeObj.checkNode(this.zTreeObj.getNodesByParam("all", "all")[0], allChecked);
          if (allChecked) {
            this.selections.SelectAll = "SelectAll";
          } else {
            delete (this.selections.SelectAll);
          }
        }
        for (let i in checkedNodes) {
          if (checkedNodes[i] && checkedNodes[i].check_Child_State === -1) {
            this.selections[checkedNodes[i].name] = checkedNodes[i].name;
          }
        }
        if (type === "select") {
          if (checkedNodes.length === 0) {
            $(".list-show")[0].innerHTML = "All";
            this.searchText = "All";
          } else {
            if (checkedNodes.length === 1) {
              $(".list-show")[0].innerHTML = checkedNodes[0].value;
              this.searchText = checkedNodes[0].value;
            } else {
              $(".list-show")[0].innerHTML = "(多重选择)";
              this.searchText = "(多重选择)";
            }
          }
        }
      } else if (type === "table") {
        if ((this.selections[value] || this.selections[value] === "") && inputType != "string") {
          delete (this.selections[value]);
        } else {
          this.lastSelectedValue = value;
          this.selections[value] = value;
        }
        let html = document.getElementById("tableList");
        let td = html.getElementsByTagName("td");
        let isTableAll = true;
        for (let i = 0; i < td.length; i++) {
          if (isAll) {
            if (this.selections.SelectAll) {
              td[i].className = "active";
              this.selections[td[i].innerHTML] = td[i].innerHTML;
            } else {
              td[i].className = "";
              delete (this.selections[td[i].innerHTML]);
            }
          } else {
            if (this.selections[td[i].innerHTML] || this.selections[td[i].innerHTML] === "") {
              td[i].className = "active";
            } else {
              if (i !== 0) {
                isTableAll = false;
              }
              td[i].className = "";
            }
          }
        }
        if (this.settings.showAll) {
          if (isAll) {
            if (this.selections.SelectAll) {
              td[0].className = "active";
              this.selections.SelectAll = "SelectAll";
            } else {
              td[0].className = "";
              delete (this.selections.SelectAll);
            }
          } else {
            if (isTableAll) {
              td[0].className = "active";
              this.selections.SelectAll = "SelectAll";
            } else {
              td[0].className = "";
              delete (this.selections.SelectAll);
            }
          }
        }
      }

      let selectArr = [];
      for (let val in this.selections) {
        if (val === undefined) {
          continue;
        }
        // this.selectionManager.select(this.selectionIds[val], true);
        selectArr.push(val)
      }
      this.setSelect(selectArr)
      if (Object.keys(this.selections).length == 0) {
         
      }
    }

    private createTree(node, arr, index, current, length, source, dateTime) {
      if (arr.length < index + 1) {
        return node;
      }
      let values = arr[index];
      let lastValue = "";
      let nodes = []
      let childNode;
      for (let i = current; i < current + length; i++) {
        if (lastValue !== values[i]) {
          let val = "";
          for (let j = 0; j <= index; j++) {
            let arrValue = arr[j][i] || "";
            if (dateTime.indexOf(j.toString()) > -1) {
              let format = source[j].format.split('"').join('').split('%').join("");
              arrValue = this.dateFtt(format, arr[j][i]);
            }
            if (val) {
              val = `${val}${this.settings.delimiter || ","}${arrValue}`;
            } else {
              val = arrValue;
            }
          }
          let value = "";
          if (source[index].type.dateTime) {
            let format = source[index].format.split('"').join('').split('%').join("");
            value = this.dateFtt(format, values[i]) || "";
          } else {
            value = values[i] || "";
          }
          if (arr.length == 1) {
            childNode = this.createNodeNOIcon(value, val);
          }
          else {
            childNode = this.createNode(value, val);
          }

          nodes.push(childNode);
        }
        childNode.childrenCount++;
        lastValue = values[i];
      }
      let count = current;
      for (let i in nodes) {
        nodes[i] = this.createTree(nodes[i], arr, index + 1, count, nodes[i].childrenCount, source, dateTime);

        count = count + nodes[i].childrenCount;

      }
      if (node instanceof Array) {
        node = nodes;
      } else {
        node.children = nodes;
      }

      try {
        if (node.children.length) {
          //console.log(node);
          let arr = [];
          arr.push(node);
          this.Child(arr);
        }
        else {
          if (this.settings.Icon == "FirstIcon") {
            node.icon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAIAAAC0tAIdAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDY3IDc5LjE1Nzc0NywgMjAxNS8wMy8zMC0yMzo0MDo0MiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjlENDkwNTlCNjRERjExRTk4OEM3Qjk4RjAyQjU0ODVGIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjlENDkwNTlDNjRERjExRTk4OEM3Qjk4RjAyQjU0ODVGIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OUQ0OTA1OTk2NERGMTFFOTg4QzdCOThGMDJCNTQ4NUYiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OUQ0OTA1OUE2NERGMTFFOTg4QzdCOThGMDJCNTQ4NUYiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4L8rpEAAAAHElEQVR42mKcsu8JA9GAiYEUMKp6VDX1VQMEGAAcSgJU83KZcQAAAABJRU5ErkJggg==";
          } else if (this.settings.Icon == "SecondIcon") {
            node.icon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAIAAAC0tAIdAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDY3IDc5LjE1Nzc0NywgMjAxNS8wMy8zMC0yMzo0MDo0MiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkM4NzZCQ0Y3NjREQzExRTlBQ0ZEOTQ3NzY4MTgxQTRFIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkM4NzZCQ0Y4NjREQzExRTlBQ0ZEOTQ3NzY4MTgxQTRFIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6Qzg3NkJDRjU2NERDMTFFOUFDRkQ5NDc3NjgxODFBNEUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6Qzg3NkJDRjY2NERDMTFFOUFDRkQ5NDc3NjgxODFBNEUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5znqeBAAAAHElEQVR42mJkFFdjIBowMZACRlWPqqa+aoAAAwDRmwBcLeZXJAAAAABJRU5ErkJggg==";
          }
          else {
            node.icon = "123";
          }
        }
      }
      catch (e) {
        //console.log(e);
      }

      return node;
    }

    //递归this.treeDate节点，设置自定义的icon
    private Child(node) {
      var nodeArr = [];
      for (let i = 0; i < node.length; i++) {
        if (node[i].children.length) {
          for (let j = 0; j < node[i].children.length; j++) {
            nodeArr.push(node[i].children[j]);
          }
          this.Child(nodeArr);
        }
        else {
          if (this.settings.Icon == "FirstIcon") {
            node[i].icon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAIAAAC0tAIdAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDY3IDc5LjE1Nzc0NywgMjAxNS8wMy8zMC0yMzo0MDo0MiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjlENDkwNTlCNjRERjExRTk4OEM3Qjk4RjAyQjU0ODVGIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjlENDkwNTlDNjRERjExRTk4OEM3Qjk4RjAyQjU0ODVGIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OUQ0OTA1OTk2NERGMTFFOTg4QzdCOThGMDJCNTQ4NUYiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OUQ0OTA1OUE2NERGMTFFOTg4QzdCOThGMDJCNTQ4NUYiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4L8rpEAAAAHElEQVR42mKcsu8JA9GAiYEUMKp6VDX1VQMEGAAcSgJU83KZcQAAAABJRU5ErkJggg==";
          } else if (this.settings.Icon == "SecondIcon") {
            node[i].icon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAIAAAC0tAIdAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDY3IDc5LjE1Nzc0NywgMjAxNS8wMy8zMC0yMzo0MDo0MiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkM4NzZCQ0Y3NjREQzExRTlBQ0ZEOTQ3NzY4MTgxQTRFIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkM4NzZCQ0Y4NjREQzExRTlBQ0ZEOTQ3NzY4MTgxQTRFIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6Qzg3NkJDRjU2NERDMTFFOUFDRkQ5NDc3NjgxODFBNEUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6Qzg3NkJDRjY2NERDMTFFOUFDRkQ5NDc3NjgxODFBNEUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5znqeBAAAAHElEQVR42mJkFFdjIBowMZACRlWPqqa+aoAAAwDRmwBcLeZXJAAAAABJRU5ErkJggg==";
          } else {
            node[i].icon = "123";
          }
        }
      }

    }

    private createNode(value, name) {
      if (this.settings.Icon == "FirstIcon") {
        return {
          "name": name.toString(),
          "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDY3IDc5LjE1Nzc0NywgMjAxNS8wMy8zMC0yMzo0MDo0MiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjFENzcyQjI3NjRERDExRTk4RURGRjFFOEUzODE4RjQxIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjFENzcyQjI4NjRERDExRTk4RURGRjFFOEUzODE4RjQxIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MUQ3NzJCMjU2NEREMTFFOThFREZGMUU4RTM4MThGNDEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MUQ3NzJCMjY2NEREMTFFOThFREZGMUU4RTM4MThGNDEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5a+Q12AAAA0ElEQVR42mI0qNnPgAfUAjEjEDdhk2TCo7GuzEW+SVuUsxHEJkUzSHFjpL0ig6IIJ4iP1QAmXBqxiGMYwESkRqwGMJGgEcMAFhI1IhvAwACMqrqapRf/kwKWHbj3H6jvP8hmxtOPPjPULruEYXxzlB7D8oP3Ga49/Ywifv/NdwaYsxtffv3NsOX6uwYMzUAM0giUw+b0BiYkPzSQ4GeQ2kYmtEBoIFYjtngmZEADcqww4YgGsAHXHn1g+PDtD1aNyPGMNR6jZ19owKURBAACDAALTXGpv+ESfAAAAABJRU5ErkJggg==",
          "childrenCount": 0,
          "children": [],
          "value": value.toString(),
          "all": "all",
        };
      } else if (this.settings.Icon == "SecondIcon") {
        return {
          "name": name.toString(),
          "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAIAAAC0tAIdAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDY3IDc5LjE1Nzc0NywgMjAxNS8wMy8zMC0yMzo0MDo0MiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkJGQ0M0OURDNjREQzExRTlBNjM4Q0REOTI2M0NCRThBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkJGQ0M0OURENjREQzExRTlBNjM4Q0REOTI2M0NCRThBIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6QkZDQzQ5REE2NERDMTFFOUE2MzhDREQ5MjYzQ0JFOEEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6QkZDQzQ5REI2NERDMTFFOUE2MzhDREQ5MjYzQ0JFOEEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6x/9psAAAAWUlEQVR42mJk0bRnwAC/rx2Yt3R1eutUNHEmBlLAUFXN4qirGuHnhilhaqg7szobWeTj5y8MuZXN/4kDl65eZxwNbwzAzCSqgCkqI8B94erNMzfuoYkDBBgA8IZDjVgzcRcAAAAASUVORK5CYII=",
          "childrenCount": 0,
          "children": [],
          "value": value.toString(),
          "all": "all",
        };
      } else {
        return {
          "name": name.toString(),
          "icon": "123",
          "childrenCount": 0,
          "children": [],
          "value": value.toString(),
          "all": "all",
        };
      }

    }
    private createNodeNOIcon(value, name) {
      return {
        "name": name.toString(),
        "icon": "123",
        "childrenCount": 0,
        "children": [],
        "value": value.toString(),
        "all": "all",
      };
    }
    //模糊搜索
    private onSearchFuzzy(fuzzyValue, inputValue) {

      if (this.settings.displayMode === "list" || this.settings.displayMode === "tree" || this.settings.displayMode === "select") {

        var nodes = this.zTreeObj.getNodes();
        if (fuzzyValue.length) {
          for (let i = 0; i < nodes.length; i++) {
            var ID = document.getElementById(nodes[i].tId);
            $(ID).show();
            if (fuzzyValue.indexOf(nodes[i].value) == -1) {
              $(ID).hide();
            }
          }
        } else {
          if (inputValue) {
            for (let i = 0; i < nodes.length; i++) {
              var ID = document.getElementById(nodes[i].tId);
              $(ID).hide();
            }
          } else {
            for (let i = 0; i < nodes.length; i++) {
              var ID = document.getElementById(nodes[i].tId);
              $(ID).show();
            }
          }

        }
      }
      if (this.settings.displayMode === "table") {
        var td = document.getElementsByTagName("td");
        //var arr=fuzzyValue.split(" ");
        if (fuzzyValue.length) {
          for (let i = 0; i < td.length; i++) {

            $(td[i]).show();
            if (fuzzyValue.indexOf(td[i].innerHTML) == -1) {

              $(td[i]).hide();
            }
            //this.arraySearch(arr,td[i].innerHTML);
          }
        }
        else {
          if (inputValue) {
            for (let i = 0; i < td.length; i++) {
              $(td[i]).hide();
            }
          } else {
            for (let i = 0; i < td.length; i++) {
              $(td[i]).show();
            }
          }

        }

      }
    }
    private selectAllIcon(treeData) {
      if (this.settings.Icon == "FirstIcon") {
        if (this.dateCategories.length > 1) {
          treeData.unshift({
            "name": "SelectAll",
            "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDY3IDc5LjE1Nzc0NywgMjAxNS8wMy8zMC0yMzo0MDo0MiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjFENzcyQjI3NjRERDExRTk4RURGRjFFOEUzODE4RjQxIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjFENzcyQjI4NjRERDExRTk4RURGRjFFOEUzODE4RjQxIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MUQ3NzJCMjU2NEREMTFFOThFREZGMUU4RTM4MThGNDEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MUQ3NzJCMjY2NEREMTFFOThFREZGMUU4RTM4MThGNDEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5a+Q12AAAA0ElEQVR42mI0qNnPgAfUAjEjEDdhk2TCo7GuzEW+SVuUsxHEJkUzSHFjpL0ig6IIJ4iP1QAmXBqxiGMYwESkRqwGMJGgEcMAFhI1IhvAwACMqrqapRf/kwKWHbj3H6jvP8hmxtOPPjPULruEYXxzlB7D8oP3Ga49/Ywifv/NdwaYsxtffv3NsOX6uwYMzUAM0giUw+b0BiYkPzSQ4GeQ2kYmtEBoIFYjtngmZEADcqww4YgGsAHXHn1g+PDtD1aNyPGMNR6jZ19owKURBAACDAALTXGpv+ESfAAAAABJRU5ErkJggg==",
            "childrenCount": 0,
            "children": [],
            "value": "selectAll",
            "all": "all",
          });
        } else {
          treeData.unshift({
            "name": "SelectAll",
            "icon": "123",
            "childrenCount": 0,
            "children": [],
            "value": "selectAll",
            "all": "all",
          });
        }
      } else if (this.settings.Icon == "SecondIcon") {
        ///-----
        if (this.dateCategories.length > 1) {
          treeData.unshift({
            "name": "SelectAll",
            "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAIAAAC0tAIdAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDY3IDc5LjE1Nzc0NywgMjAxNS8wMy8zMC0yMzo0MDo0MiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkJGQ0M0OURDNjREQzExRTlBNjM4Q0REOTI2M0NCRThBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkJGQ0M0OURENjREQzExRTlBNjM4Q0REOTI2M0NCRThBIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6QkZDQzQ5REE2NERDMTFFOUE2MzhDREQ5MjYzQ0JFOEEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6QkZDQzQ5REI2NERDMTFFOUE2MzhDREQ5MjYzQ0JFOEEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6x/9psAAAAWUlEQVR42mJk0bRnwAC/rx2Yt3R1eutUNHEmBlLAUFXN4qirGuHnhilhaqg7szobWeTj5y8MuZXN/4kDl65eZxwNbwzAzCSqgCkqI8B94erNMzfuoYkDBBgA8IZDjVgzcRcAAAAASUVORK5CYII=",
            "childrenCount": 0,
            "children": [],
            "value": "selectAll",
            "all": "all",
          });
        } else {
          treeData.unshift({
            "name": "SelectAll",
            "icon": "123",
            "childrenCount": 0,
            "children": [],
            "value": "selectAll",
            "all": "all",
          });
        }
      } else {
        treeData.unshift({
          "name": "SelectAll",
          "icon": "123",
          "childrenCount": 0,
          "children": [],
          "value": "selectAll",
          "all": "all",
        });
      }

    }

    private onSearch(value) {
      if (value) {
        this.selections = {};
        this.lastSelectedValue = null;
        if (this.settings.isRadio == true) {
          // this.selectionManager.clear();
          // this.selectionManager.select(undefined);
          this.setSelect([])
        }
        let val = [];
        if (this.settings.isRadio) {
          val[0] = value.split(" ")[0];
        }
        else {
          val = value.split(" ");
        }

        let index;
        if (this.settings.displayMode === "list" || this.settings.displayMode === "tree" || this.settings.displayMode === "select") {
          let count = 0;
          //判断是”多选“还是“单选”，如果为单选取消选中的节点
          if (this.settings.isRadio == true) {
            this.zTreeObj.checkAllNodes(false);
            // this.zTreeObj.cancelSelectedNode(this.radioValue);
          }

          let selectArr = [];
          for (let i = 0; i < val.length; i++) {
            if (val[i] || val[i] === "") {
              if (val[i] !== "SelectAll") {
                // if (this.selectionIds[val[i]]) {

                let ev = this.zTreeObj.getNodesByParam("name", val[i])[0] || null;
                // console.log('this.radioValue', this.radioValue);
                // this.radioValue=ev;
                this.checkNode(ev);
                this.selections[val[i]] = val[i];
                // this.selectionManager.select(this.selectionIds[val[i]], true);
                selectArr.push(val[i])
              
                // this.singleSelect(val[i],this.settings.displayMode,false,false)
                index = Number(i);
                count = count + 1;

                // }
              }

            }
          }
          this.setSelect(selectArr)
          if (count && this.settings.displayMode === "select") {
            if (count === 1) {
              $(".list-show")[0].innerHTML = val[0];
              this.searchText = val[0];
            } else {
              $(".list-show")[0].innerHTML = "(多重选择)";
              this.searchText = "(多重选择)";
            }
          }

        } else if (this.settings.displayMode === "table") {
          let html = document.getElementById("tableList");
          let td = html.getElementsByTagName("td");
          let selectArr = [];
          for (let i = 0; i < td.length; i++) {
            if (td[i].innerHTML || td[i].innerHTML === "") {
              if (td[i].innerHTML !== "SelectAll") {
                if (val.indexOf(td[i].innerHTML) > -1) {
                  // this.tableRadioValue=td[i];

                  td[i].className = "active";
                  index = val.indexOf(td[i].innerHTML);
                  this.selections[td[i].innerHTML] = td[i].innerHTML;
                  // this.selectionManager.select(this.selectionIds[td[i].innerHTML], true);
                  selectArr.push(td[i].innerHTML);
                  
                }
                else if (this.settings.isRadio == true && val.indexOf(td[i].innerHTML) == -1) {    //判断是否为 单选 且 没有找到匹配的值
                  td[i].className = "";
                }

              }
            }
          }
          this.setSelect(selectArr)
        }
        if (index || index === 0) {
          this.lastSelectedValue = val[index];
        } else {
          this.lastSelectedValue = null;
        }
      }
    }

    private dateFtt(fmt, date) {
      if (!date) {
        return '';
      }
      var o = {
        "M+": date.getMonth() + 1,                 //月份   
        "d+": date.getDate(),                    //日   
        "h+": date.getHours(),                   //小时   
        "m+": date.getMinutes(),                 //分   
        "s+": date.getSeconds(),                 //秒   
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度   
        "S": date.getMilliseconds()             //毫秒   
      };
      if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
      for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
          fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
      return fmt;
    }



    public init(options: VisualUpdateOptions) {

      var _that = this;
      if (!options ||
        !options.dataViews ||
        !options.dataViews[0] ||
        !options.dataViews[0].categorical ||
        !options.dataViews[0].categorical.categories ||
        !options.dataViews[0].categorical.categories[0]) {
        return;
      }

      while (this.target.firstChild) {
        this.target.removeChild(this.target.firstChild);
      }

      let scrollDiv = document.createElement("div");
      scrollDiv.className = "scrollDiv";
      try {
        if (this.settings.displayMode == "select") {
          scrollDiv.className = "hiddens";
        }
        else {
          scrollDiv.className = "scrollDiv";
        }
      } catch (e) {

      }

      this.target.appendChild(scrollDiv);

      //if(this.settings.displayMode != 'date'){
      let title;
      title = document.createElement("span");
      if (this.settings.title) {
        title.className = "title";
        title.innerHTML = this.settings.title;
      }
      scrollDiv.appendChild(title);
      //}

      // let search = document.createElement("span");
      // search.className = "search";
      // search.onclick = function(e) {
      //     let display = $('.textDiv')[0].style.display === "block" ? "none" : "block";            //设置搜索框的显示和隐藏
      //     $('.textDiv')[0].style.display = display;
      //     this.showSearchInput = display;
      // }.bind(this);

      let textDiv = document.createElement("div");
      $(textDiv).attr("id", "textinput");
      textDiv.className = "textDiv";
      // textDiv.style.display = this.showSearchInput ? "none" : "block";
      let textInput = document.createElement("input");
      textInput.setAttribute("autocomplete", "off");
      textInput.type = "text";
      textInput.value = this.textInputValue;
      $(textInput).on('input', _.debounce(function (e) {
        if (this.settings.FuzzySearchInput == true) {
          var fuzzyValue = [];
          if (e.target.value != "") {
            var sRex = '.{0,}' + String(e.target.value) + '.{0,}';
            var reg = new RegExp(sRex, "ig");
            //console.log('reg',reg);
            for (let i = 0; i < this.dataViewValue.length; i++) {
              //console.log('this.dataViewValue[i].toString().match(reg)',this.dataViewValue[i].toString().match(reg));
              if (String(this.dataViewValue[i]).match(reg)) {
                fuzzyValue.push(this.dataViewValue[i].toString());
              }
            }
          }
          this.onSearchFuzzy(fuzzyValue, e.target.value);
        }
        else {
          //1111
          // if(this.settings.displayMode == 'tree'){
          // if(e.target.value){
          _that.onConditionChanged(options, e.target.value, 'search')
          // }
          // }else{
          //     this.onSearch(e.target.value);
          // }
        }
        this.textInputValue = e.target.value;

      }.bind(this), 800, { 'leading': false, 'trailing': true }));
      textDiv.appendChild(textInput);
      $(textDiv).hide();
      if (this.settings.displayMode != "select") {
        scrollDiv.appendChild(textDiv);
      }
      this.selectionIds = {};
      if (this.settings.displayMode === "list") {
        let category = options.dataViews[0].categorical.categories;
        let values = category[0].values;
        this.treeData = [];
        values.forEach((item: any, index: number) => {
          let value: string = "";
          for (let j in category) {
            if (!category[j].source.type.dateTime) {
              if (value) {
                value = `${value}${this.settings.delimiter || ","}${category[j].values[index] || ""}`
              } else {
                value = `${category[j].values[index] || ""}`
              }
            } else {
              let format = category[j].source.format.split('"').join('').split('%').join("");
              if (value) {
                value = `${value}${this.settings.delimiter || ","}${this.dateFtt(format, category[j].values[index]) || ""}`
              } else {
                value = `${this.dateFtt(format, category[j].values[index]) || ""}`
              }
            }
          }

          this.selectionIds[value] = this.host.createSelectionIdBuilder()
            .withCategory(category[0], index)
            .createSelectionId();
          this.treeData.push({
            "name": value,
            "value": value,
            "all": "all"
          })

        })
        if (this.settings.showAll) {
          this.selectAllIcon(this.treeData);
        }
        let container = document.createElement("div");
        container.id = "menu-tree";
        container.className = "ztree";
        scrollDiv.appendChild(container);
        this.setting = {
          view: {
            showLine: false,
            showIcon: false
          },
          data: {
            key: {
              name: "value",
            }
          },
          check: {
            enable: true,
            chkStyle: this.settings.switchRadio ? "radio" : 'checkbox',
          },
          callback: {
            onCheck: (e, treeId, treeNode) => {

              if (this.settings.isRadio) {
                this.singleSelect(treeNode, "list", false, false);
              } else {
                this.multiSelect(treeNode, "list", false);
              }
            },
            onClick: (e, treeId, treeNode) => {
              try {                                                            //设置单选时不能取消已选中的节点,一共有三处 tree list select
                let selectNode = this.zTreeObj.getCheckedNodes(true)[0];
                if (selectNode["value"] == treeNode["value"] && this.settings.isRadio) {
                  return;
                }
              } catch (e) {
                console.log(e);
              }

              let chacked = treeNode.getCheckStatus().checked;
              this.zTreeObj.checkNode(treeNode, !chacked, true);
              if (this.settings.isRadio) {
                this.singleSelect(treeNode, "list", false, false);
              } else {
                this.multiSelect(treeNode, "list", false);
              }

              this.VisualObjectInstanceForIgnoreDefaultValues();
            }
          },
        };
        this.zTreeObj = $.fn.zTree.init($("#menu-tree"), this.setting, this.treeData);

      } else if (this.settings.displayMode === "tree") {
        let category = options.dataViews[0].categorical.categories;
        let values = [];
        let source = [];
        let dateTime = [];
        for (let i in category) {
          if (category[i]) {
            values.push(category[i].values);
            source.push(category[i].source)
          }
        }
        category[0].values.forEach((item: any, index: number) => {
          let value = "";
          for (let j in category) {
            if (!category[j].source.type.dateTime) {
              if (value) {
                value = `${value}${this.settings.delimiter || ","}${category[j].values[index] || ""}`
              } else {
                value = `${category[j].values[index] || ""}`
              }
            } else {
              if (dateTime.indexOf(j) === -1) {
                dateTime.push(j);
              }
              let format = category[j].source.format.split('"').join('').split('%').join("");
              if (value) {
                value = `${value}${this.settings.delimiter || ","}${this.dateFtt(format, category[j].values[index]) || ""}`
              } else {
                value = `${this.dateFtt(format, category[j].values[index]) || ""}`
              }
            }
          }
          this.selectionIds[value] = this.host.createSelectionIdBuilder()
            .withCategory(category[0], index)
            .createSelectionId();
        });

        let container = document.createElement("div");
        container.id = "tree-menu";
        container.className = "ztree";
        scrollDiv.appendChild(container);
        try {
          this.treeData = this.createTree([], values, 0, 0, values[0].length, source, dateTime);
        } catch (e) {
          console.log(e);
        }
        if (this.settings.showAll) {

          this.selectAllIcon(this.treeData);
        }
        this.setting = {
          view: {
            showLine: false,
            showIcon: this.settings.Icon === "noIcon" ? false : true
          },
          data: {
            key: {
              name: "value",
            }
          },
          check: {
            enable: true,
            chkStyle: this.settings.switchRadio ? "radio" : 'checkbox',
          },
          callback: {
            onCheck: (e, treeId, treeNode) => {
              if (this.settings.isRadio) {
                this.singleSelect(treeNode, "tree", false, false);
              } else {
                this.multiSelect(treeNode, "tree", false);
              }
            },
            onClick: (e, treeId, treeNode) => {
              try {                                                               //设置单选时不能取消已选中的节点,一共有三处 tree list select
                let selectNode = this.zTreeObj.getCheckedNodes(true)[0];
                if (selectNode["value"] == treeNode["value"] && this.settings.isRadio) {
                  return;
                }
              } catch (e) {
                console.log(e);
              }

              let chacked = treeNode.getCheckStatus().checked;
              this.zTreeObj.checkNode(treeNode, !chacked, true);

              if (this.settings.isRadio) {
                this.singleSelect(treeNode, "tree", false, false);
              } else {
                this.multiSelect(treeNode, "tree", false);
              }

              this.VisualObjectInstanceForIgnoreDefaultValues();
            }
          },
        };
        try {
          this.zTreeObj = $.fn.zTree.init($("#tree-menu"), this.setting, this.treeData);
        } catch (e) {
          console.log(e)
        }

      } else if (this.settings.displayMode === "table") {
        let category = options.dataViews[0].categorical.categories;
        let values = category[0].values;
        let div: HTMLDivElement = document.createElement("div");
        div.id = "tableList";
        div.setAttribute("style", "display:block;width:100%;height:100%;margin:0 auto;");
        let table: HTMLElement = document.createElement("table");
        table.setAttribute("style", "display: block;width:100%;height:100%;");
        let columns = Number(this.settings.columns);
        values.forEach((item: any, index: number) => {
          let value = "";
          for (let j in category) {
            if (!category[j].source.type.dateTime) {
              if (value) {
                value = `${value}${this.settings.delimiter || ","}${category[j].values[index] || ""}`
              } else {
                value = `${category[j].values[index] || ""}`
              }
            } else {
              let format = category[j].source.format.split('"').join('').split('%').join("");
              if (value) {
                value = `${value}${this.settings.delimiter || ","}${this.dateFtt(format, category[j].values[index]) || ""}`
              } else {
                value = `${this.dateFtt(format, category[j].values[index]) || ""}`
              }
            }
          }
          this.selectionIds[value] = this.host.createSelectionIdBuilder()
            .withCategory(category[0], index)
            .createSelectionId();
          let condition;
          if (this.settings.showAll) {
            if (columns > 2) {
              condition = index % columns === (columns - 2)
            } else if (columns === 2) {
              condition = index % columns === columns - 1;
            } else if (columns === 1) {
              condition = true;
              let tr: HTMLElement = document.createElement("tr");
              tr.setAttribute("style", "display:block;float:left;width:100%;");
              table.appendChild(tr);
              div.appendChild(table);
              scrollDiv.appendChild(div);
            }
          } else {
            condition = index % columns === columns - 1;
          }
          if (index === 0 || condition) {
            let tr: HTMLElement = document.createElement("tr");
            tr.setAttribute("style", "display:block;float:left;width:100%;");
            table.appendChild(tr);
            div.appendChild(table);
            scrollDiv.appendChild(div);
          }
          let ele = document.getElementById("tableList").getElementsByTagName("tr");
          if (index === 0 && this.settings.showAll) {
            let Ediv: HTMLElement = document.createElement("span");
            Ediv.setAttribute("name", "ediv");
            Ediv.setAttribute("style", "display: flex;justify-content:center;align-items:Center;width:20%;height:20%;float:left;background-color:#eaeaea;;margin:0px 4px 0px 2px");
            let td: HTMLElement = document.createElement("td");
            td.setAttribute("style", "display:block;float:left;margin:4px 0px 0px 2px;width:calc(33.3% - 3px);min-width:0px;min-height:0px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;");
            td.setAttribute("height", this.dy + "px");
            td.setAttribute("id", "SelectAll");
            td.style.width = "calc(100%" + " - " + "3px)";
            td.style.lineHeight = this.dy + "px";

            td.innerHTML = "SelectAll";
            td.onclick = function (ev) {
              if (this.settings.isRadio) {
                this.singleSelect(ev, "table", true, false);
                if (this.judge = false) {
                  this.judge = !this.judge;
                  Ediv.style.backgroundColor = "#858585";
                }
                else {
                  this.judge = !this.judge;
                  Ediv.style.backgroundColor = "#9A9A9A";
                }
              } else {
                this.multiSelect(ev, "table", true);
                if (this.judge = false) {
                  this.judge = !this.judge;
                  Ediv.style.backgroundColor = "#858585";
                }
                else {
                  this.judge = !this.judge;
                  Ediv.style.backgroundColor = "#9A9A9A";
                }
              }
              this.VisualObjectInstanceForIgnoreDefaultValues();
            }.bind(this)
            Ediv.appendChild(td);
            ele[0].appendChild(td);
          }
          let a = columns !== 0 ? this.settings.showAll && this.settings.isRadio == false ? Math.floor((index + 1) / columns) : Math.floor(index / columns) : 0;
          let Ediv: HTMLElement = document.createElement("span");
          Ediv.setAttribute("name", "ediv");
          Ediv.setAttribute("style", "display: flex;justify-content:center;align-items:Center;width:20%;height:20%;float:left;background-color:#eaeaea;margin:1px 4px 1px 2px;;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;");
          let td: HTMLElement = document.createElement("td");
          td.setAttribute("style", "display:block;float:left;margin:4px 0px 0px 2px;width:calc(33.3% - 3px);;min-width:0px;min-height:0px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;");
          td.setAttribute("height", this.dy + "px");
          td.style.width = "calc(100%" + " - " + "3px)";
          td.style.lineHeight = this.dy + "px";
          td.innerHTML = value;
          td.onclick = function (ev) {
            if (this.settings.isRadio) {
              this.singleSelect(ev, "table", false, false);
              if (this.judge = false) {
                this.judge = !this.judge;
                Ediv.style.backgroundColor = "#858585";
              }
              else {
                this.judge = !this.judge;
                Ediv.style.backgroundColor = "#9A9A9A";
              }
            } else {
              this.multiSelect(ev, "table", false, false);
              if (this.judge = false) {
                this.judge = !this.judge;
                Ediv.style.backgroundColor = "#858585";
              }
              else {
                this.judge = !this.judge;
                Ediv.style.backgroundColor = "#9A9A9A";
              }
            }
            this.VisualObjectInstanceForIgnoreDefaultValues();
          }.bind(this)
          Ediv.appendChild(td);
          ele[a].appendChild(td);
        })
      } else if (this.settings.displayMode === "select") {
        let category = options.dataViews[0].categorical.categories;
        let values = category[0].values;
        this.treeData = [];
        values.forEach((item: any, index: number) => {
          let value: string = "";
          for (let j in category) {
            if (!category[j].source.type.dateTime) {
              if (value) {
                value = `${value}${this.settings.delimiter || ","}${category[j].values[index] || ""}`
              } else {
                value = `${category[j].values[index] || ""}`
              }
            } else {
              let format = category[j].source.format.split('"').join('').split('%').join("");
              if (value) {
                value = `${value}${this.settings.delimiter || ","}${this.dateFtt(format, category[j].values[index]) || ""}`
              } else {
                value = `${this.dateFtt(format, category[j].values[index]) || ""}`
              }
            }
          }

          this.selectionIds[value] = this.host.createSelectionIdBuilder()
            .withCategory(category[0], index)
            .createSelectionId();
          this.treeData.push({
            "name": value,
            "value": value,
            "all": "all",
          })
        })
        if (this.settings.showAll) {

          this.selectAllIcon(this.treeData);
        }
        let listContainer = document.createElement("div");
        listContainer.className = 'list-container';
        let textContainer = document.createElement('div');
        textContainer.className = 'list-show';

        let listShowBackground = this.settings.listShowBackground.solid.color;
        $(textContainer).css({
          "background-color": listShowBackground
        });


        let arrowBtn = document.createElement('div');
        arrowBtn.className = 'list-arrow-btn';
        let container = document.createElement("div");
        container.id = "select-tree";
        container.className = "ztree list-ztree";
        let selectHeight = this.settings.selectHeight;
        let selectbackground = this.settings.selectbackground.solid.color;
        $(container).css({
          "height": `${selectHeight}px`,
          // "width": "calc(" + 100 + "%" + " - " + "4px)",                 //将滚动条与下拉框对齐
          "background-color": selectbackground
        })

        textContainer.innerText = this.searchText;

        listContainer.appendChild(textContainer);
        listContainer.appendChild(arrowBtn);
        scrollDiv.appendChild(listContainer);
        scrollDiv.appendChild(container);

        this.setting = {
          view: {
            showLine: false,
            showIcon: false
          },
          data: {
            key: {
              name: "value",
            }
          },
          check: {
            enable: true,
            chkStyle: this.settings.switchRadio ? "radio" : 'checkbox',
          },
          callback: {
            onCheck: (e, treeId, treeNode) => {
              if (this.settings.isRadio) {
                this.singleSelect(treeNode, "select", false, false);
              } else {
                this.multiSelect(treeNode, "select", false);
              }
            },
            onClick: (e, treeId, treeNode) => {
              try {                                                            //设置单选时不能取消已选中的节点,一共有三处 tree list select
                let selectNode = this.zTreeObj.getCheckedNodes(true)[0];
                if (selectNode["value"] == treeNode["value"] && this.settings.isRadio) {
                  return;
                }
              } catch (e) {
                console.log(e);
              }

              let chacked = treeNode.getCheckStatus().checked;
              this.zTreeObj.checkNode(treeNode, !chacked, true);

              if (this.settings.isRadio) {
                this.singleSelect(treeNode, "select", false, false);
              } else {
                this.multiSelect(treeNode, "select", false);
              }
              this.VisualObjectInstanceForIgnoreDefaultValues();
            }
          },
        };

        //默认为 select 类型收起来，这是必要的，是为了解决切换页面的select是打开的
        $("#select-tree").hide();

        this.zTreeObj = $.fn.zTree.init($("#select-tree"), this.setting, this.treeData);

        $(container).prepend(textDiv);

        $('.list-show,.list-arrow-btn').click(function (e) {
          //e.stopPropagation();
          //e.preventDefault();

          $('.list-ztree').toggle();

        });
        $(document).click(function (e) {
          let target = $(e.target).is('.node_name') || $(e.target).is('.button') || $(e.target).is('.ztree') ||
            $(e.target).is('.curSelectedNode') || $(e.target).is(".level0");
          if (!target) {
            if ($(e.target).is("#searchDiv") || $(e.target).is(".textDiv") || $(e.target).is("input") || $(e.target).is(".search")) {

            } else {
              // $('.list-ztree').hide();
            }
          }

        })
      }
      if (this.settings.displayMode === "date") {
        // $("#scrollDiv").empty();
        var timer = null;                            //记录时间
        //console.log('911', '')
        let categories1 = _that.option.dataViews[0].categorical.categories[0];
        let type = categories1.source.type;
        var dataValue = _that.option.dataViews[0].categorical.categories[0];
        var values = _that.option.dataViews[0].categorical.categories[0].values
        var dataValueLength = _that.option.dataViews[0].categorical.categories[0].values.length;

        let dataType = null;
        if (type.dateTime) {
          dataType = 'date';
        } else if (type.integer || type.numeric) {
          dataType = 'number';
        }

        if (dataType == 'number' || dataType == 'date') {

          var startDate = $('<input type="text" autocomplete="off" id="startDate">');  //readonly="readonly"
          var endDate = $('<input type="text" autocomplete="off" id="endDate">');
          var Slider = $('<div id="slider"></div>');               //创建slider
          var DivSlider = $('<div id="sliderParent"></div>');      //slider 的上层div
          var inputDate = $('<div id="inputDate"></div>');         //input 表单的上层div
          var InputSwitch = $('<div id="switch"></div>');          //

          $(textDiv).remove();
          $(scrollDiv).append(InputSwitch);
          inputDate.append(startDate);
          inputDate.append(endDate);
          $(scrollDiv).append(inputDate);
          DivSlider.append(Slider);
          $(scrollDiv).append(DivSlider);
          if (dataValue.values[0] == null) {                                   //当日期的第一个字段时空的时候，将dataValue.values[1]  赋值
            var dataValue0 = dataValue.values[1];
          }
          else {
            var dataValue0 = dataValue.values[0];
          }
          if (String(dataValue0).match(/^\d{0,20}$/) != null) {        //全数字的filter
            let numberFirst = dataValue0;
            let numberEnd = dataValue.values[dataValueLength - 1];

            let numberStartValue = dataValue0;
            let numberEndValue = dataValue.values[dataValueLength - 1];

            //numberFirst
            //默认值
            if (this.settings.startTime) {
              numberFirst = Number(eval(this.settings.startTime));
            }
            //取默认字段
            if (options.dataViews[0].categorical.values
              && options.dataViews[0].categorical.values.length > 0
              && options.dataViews[0].categorical.values[0].values[0]) {
              numberFirst = <any>options.dataViews[0].categorical.values[0].values[0];
            }

            //numberEnd
            //默认值
            if (this.settings.endTime) {
              numberEnd = Number(eval(this.settings.endTime));
            }
            //取默认字段
            if (options.dataViews[0].categorical.values
              && options.dataViews[0].categorical.values.length > 0
              && options.dataViews[0].categorical.values[1].values[0]) {
              numberEnd = <any>options.dataViews[0].categorical.values[1].values[0];
            }


            this.StartDate = numberFirst;
            this.EndDate = numberEnd;

            startDate.val(numberFirst);
            endDate.val(numberEnd);

            startDate.on('change', _.debounce(function () {
              _that.StartDate = startDate.val();
              _that.EndDate = endDate.val();
              if (Number(_that.StartDate) <= Number(_that.EndDate)) {
                _that.slider(numberStartValue, numberEndValue, _that.StartDate, _that.EndDate)
                _that.DateFilter();
              }
            }, 800, {
              'leading': false,
              'trailing': true
            }));
            endDate.on('change', _.debounce(function () {
              _that.StartDate = startDate.val();
              _that.EndDate = endDate.val();
              if (Number(_that.StartDate) <= Number(_that.EndDate)) {
                _that.slider(numberStartValue, numberEndValue, _that.StartDate, _that.EndDate)
                _that.DateFilter();
              }

            }, 800, {
              'leading': false,
              'trailing': true
            }));

            //slider 数字 
            _that.slider(numberStartValue, numberEndValue, numberFirst, numberEnd)
            _that.DateFilter();
            $("#slider").bind("mousemove click", function (e) {
              var sliderStart = $("#slider").slider("values", 0);
              var sliderEnd = $("#slider").slider("values", 1);
              startDate.val(sliderStart)                              //将滑块的 值 放在 input 选框上，可以更直观的看出来
              endDate.val(sliderEnd);
              if (e.type == 'click') {
                if (Number(sliderStart) <= Number(sliderEnd)) {
                  _that.DateSliderFilter(sliderStart, sliderEnd);
                }
              } else {
                if (0 < timer && timer < 500) {
                  clearTimeout(timer);
                }
                timer = setTimeout(function () {
                  if (Number(sliderStart) <= Number(sliderEnd)) {
                    _that.DateSliderFilter(sliderStart, sliderEnd);
                  }
                }, 500);
              }
            })
          }
          else {                                                       //日期的filter

            //开始日期格式
            var firstDate = new Date(String(dataValue0));
            var firstDateValue = new Date(String(dataValue0));
            //取默认值
            if (this.settings.startTime) {
              firstDate = new Date(eval(this.settings.startTime));
            }
            //取默认字段
            if (options.dataViews[0].categorical
              && options.dataViews[0].categorical.values.length > 0
              && options.dataViews[0].categorical.values[0].values[0]) {
              firstDate = <any>options.dataViews[0].categorical.values[0].values[0];
            }
            this.StartDate = firstDate;

            //结束日期格式
            var finanlyDate = new Date(String(dataValue.values[dataValueLength - 1]));
            var finanlyDateValue = new Date(String(dataValue.values[dataValueLength - 1]));
            //取默认值
            if (this.settings.endTime) {
              finanlyDate = new Date(eval(this.settings.endTime));
            }
            //取默认字段
            if (options.dataViews[0].categorical
              && options.dataViews[0].categorical.values.length > 0
              && options.dataViews[0].categorical.values[1].values[0]) {
              finanlyDate = <any>options.dataViews[0].categorical.values[1].values[0];
            }
            this.EndDate = finanlyDate;
            //判断date的时间

            if ($.type(new Date(<any>finanlyDate)) == "date") {
              //日期变化监听

              var datestart = firstDateValue.getTime() / 1000;
              var dateend = finanlyDateValue.getTime() / 1000;

              var datestartValue = firstDate.getTime() / 1000;
              var dateendValue = finanlyDate.getTime() / 1000;

              startDate.on('change', function () {
                _that.StartDate = new Date(startDate.val());
                _that.EndDate = new Date(endDate.val());
                if (startDate.val() <= endDate.val()) {
                  var Start = _that.StartDate.getTime() / 1000;
                  var End = _that.EndDate.getTime() / 1000;

                  _that.slider(datestart, dateend, Start, End)
                  _that.DateFilter();

                }
              })
              endDate.on('change', function () {
                _that.StartDate = new Date(startDate.val());
                _that.EndDate = new Date(endDate.val());
                if (startDate.val() <= endDate.val()) {
                  var Start = _that.StartDate.getTime() / 1000;
                  var End = _that.EndDate.getTime() / 1000;

                  _that.slider(datestart, dateend, Start, End)
                  _that.DateFilter();
                }
              })

              // slider  date 
              try {
                $("#startDate").val(_that.StringToDate1(firstDate));      //将滑块的 值 放在 input 选框上，可以更直观的看出来
                $("#endDate").val(_that.StringToDate1(finanlyDate));
              } catch (e) {
                console.log(e);
              }

              _that.slider(datestart, dateend, datestartValue, dateendValue);

              $("#slider").bind("mousemove click", function (e) {
                var sliderStart = $("#slider").slider("values", 0);
                var Start = new Date(sliderStart * 1000)
                var sliderEnd = $("#slider").slider("values", 1);
                var End = new Date(sliderEnd * 1000)
                var StringSliderStart = _that.StringToDate2(Start);
                var StringSliderEnd = _that.StringToDate2(End);
                $("#startDate").val(_that.StringToDate1(new Date(StringSliderStart)));      //将滑块的 值 放在 input 选框上，可以更直观的看出来
                $("#endDate").val(_that.StringToDate1(new Date(StringSliderEnd)));
                if (e.type == 'click') {
                  if (Start <= End) {
                    _that.DateSliderFilter(Start, End);
                  }
                } else {
                  if (0 < timer && timer < 500) {
                    clearTimeout(timer);
                  }
                  timer = setTimeout(function () {
                    if (Start <= End) {
                      _that.DateSliderFilter(Start, End);
                    }
                  }, 500);
                }
              })

              _that.DateFilter();
            }
            //判断string的时间
            // else if ($.type(finanlyDate) == "string") {
            //   //日期变化监听
            //   $("#startDate").val(_that.StringToDate1(new Date(firstDate)));      //将滑块的 值 放在 input 选框上，可以更直观的看出来
            //   $("#endDate").val(_that.StringToDate1(new Date(finanlyDate)));
            //   var datestart = new Date(firstDate).getTime() / 1000;
            //   var dateend = new Date(finanlyDate).getTime() / 1000;
            //   if (String(dataValue0).indexOf("-") != -1) {                 //判断是否有 -
            //     startDate.on('change', function () {
            //       _that.StartDate = startDate.val().replace(/\//g, "-");
            //       _that.EndDate = endDate.val().replace(/\//g, "-");

            //       if (_that.StartDate <= _that.EndDate) {
            //         var datestartrange = new Date(_that.StartDate).getTime() / 1000;
            //         var dateendrange = new Date(_that.EndDate).getTime() / 1000;

            //         _that.slider(datestart, dateend, datestartrange, dateendrange)
            //         _that.DateFilter();
            //       }
            //     })

            //     endDate.on('change', function () {
            //       _that.StartDate = startDate.val().replace(/\//g, "-");
            //       _that.EndDate = endDate.val().replace(/\//g, "-");
            //       if (_that.StartDate <= _that.EndDate) {
            //         var datestartrange = new Date(_that.StartDate).getTime() / 1000;
            //         var dateendrange = new Date(_that.EndDate).getTime() / 1000;

            //         _that.slider(datestart, dateend, datestartrange, dateendrange)
            //         _that.DateFilter();
            //       }
            //     })

            //     //slider  String  -
            //     _that.slider(datestart, dateend, datestart, dateend)
            //     $("#slider").bind("mousemove click", function (e) {
            //       var sliderStart = $("#slider").slider("values", 0);
            //       sliderStart = _that.StringToDate1(new Date(sliderStart * 1000))
            //       var sliderEnd = $("#slider").slider("values", 1);
            //       sliderEnd = _that.StringToDate1(new Date(sliderEnd * 1000));
            //       startDate.val(sliderStart);                              //将滑块的 值 放在 input 选框上，可以更直观的看出来
            //       endDate.val(sliderEnd);
            //       if (e.type == 'click') {
            //         if (sliderStart <= sliderEnd) {
            //           $("#startDate").val(_that.StringToDate1(new Date(sliderStart)));
            //           $("#endDate").val(_that.StringToDate1(new Date(sliderEnd)));
            //           _that.DateSliderFilter(sliderStart, sliderEnd);
            //         }
            //       } else {
            //         if (0 < timer && timer < 500) {
            //           clearTimeout(timer);
            //         }
            //         timer = setTimeout(function () {
            //           if (sliderStart <= sliderEnd) {
            //             $("#startDate").val(_that.StringToDate1(new Date(sliderStart)));
            //             $("#endDate").val(_that.StringToDate1(new Date(sliderEnd)));
            //             _that.DateSliderFilter(sliderStart, sliderEnd);
            //           }
            //         }, 500);
            //       }
            //     })

            //   }
            //   else if (String(dataValue0).indexOf("/") != -1) {           //判断是否有 /
            //     startDate.on('change', function () {
            //       _that.StartDate = startDate.val();
            //       _that.EndDate = endDate.val();
            //       if (_that.StartDate <= _that.EndDate) {
            //         var datestartrange = new Date(_that.StartDate).getTime() / 1000;
            //         var dateendrange = new Date(_that.EndDate).getTime() / 1000;
            //         _that.slider(datestart, dateend, datestartrange, dateendrange)
            //         _that.DateFilter();
            //       }
            //     })
            //     endDate.on('change', function () {
            //       _that.StartDate = startDate.val();
            //       _that.EndDate = endDate.val();
            //       if (_that.StartDate <= _that.EndDate) {
            //         var datestartrange = new Date(_that.StartDate).getTime() / 1000;
            //         var dateendrange = new Date(_that.EndDate).getTime() / 1000;
            //         _that.slider(datestart, dateend, datestartrange, dateendrange);
            //         _that.DateFilter();
            //       }
            //     })


            //     //slider  String  /
            //     $("#startDate").val(_that.StringToDate1(new Date(firstDate)));      //将滑块的 值 放在 input 选框上，可以更直观的看出来
            //     $("#endDate").val(_that.StringToDate1(new Date(finanlyDate)));
            //     _that.slider(datestart, dateend, datestart, dateend);
            //     $("#slider").bind("mousemove click", function (e) {
            //       var sliderStart = $("#slider").slider("values", 0);
            //       sliderStart = _that.StringToDate2(new Date(sliderStart * 1000))
            //       var sliderEnd = $("#slider").slider("values", 1);
            //       sliderEnd = _that.StringToDate2(new Date(sliderEnd * 1000));
            //       if (e.type == 'click') {
            //         if (sliderStart <= sliderEnd) {
            //           $("#startDate").val(_that.StringToDate2(new Date(sliderStart)));
            //           $("#endDate").val(_that.StringToDate2(new Date(sliderEnd)));
            //           _that.DateSliderFilter(sliderStart, sliderEnd);
            //         }
            //       } else {
            //         if (0 < timer && timer < 500) {
            //           clearTimeout(timer);
            //         }
            //         timer = setTimeout(function () {
            //           if (sliderStart <= sliderEnd) {
            //             $("#startDate").val(_that.StringToDate2(new Date(sliderStart)));
            //             $("#endDate").val(_that.StringToDate2(new Date(sliderEnd)));
            //             _that.DateSliderFilter(sliderStart, sliderEnd);
            //           }
            //         }, 500);
            //       }
            //     })
            //   }
            //   else {

            //   }
            // }
          }
        }
        const styleDiv = document.createElement("div");
        styleDiv.className = "styleDiv";
        scrollDiv.appendChild(styleDiv);
        this.changeTextStatus(this.settings);
      }
      const styleDiv = document.createElement("div");
      styleDiv.className = "styleDiv";
      scrollDiv.appendChild(styleDiv);
      this.changeTextStatus(this.settings);
    }
    //Date filter

    public slider(datestart, dateend, datestartrange, dateendrange) {

      $("#slider").slider({
        range: true,
        min: datestart,
        max: dateend,
        values: [datestartrange, dateendrange]
      });
    }
    public DateFilter() {

      var cag = this.option.dataViews[0].categorical.categories[0];
      const filter: IAdvancedFilter = new window["powerbi-models"].AdvancedFilter(
        { table: cag.source.queryName.substr(0, cag.source.queryName.indexOf(".")), column: cag.source.displayName },
        "And",
        {
          operator: "GreaterThanOrEqual",
          value: this.StartDate
        },
        {
          operator: "LessThanOrEqual",
          value: this.EndDate
        });
      this.host.applyJsonFilter(
        filter,
        "general",
        "filter",
        (this.StartDate && this.EndDate)
          ? FilterAction.merge
          : FilterAction.remove
      );
      //FilterAction.merge
    }
    //Date Slider filter
    public DateSliderFilter(StartDate, EndDate) {

      var cag = this.option.dataViews[0].categorical.categories[0];
      const filter: IAdvancedFilter = new window["powerbi-models"].AdvancedFilter(
        { table: cag.source.queryName.substr(0, cag.source.queryName.indexOf(".")), column: cag.source.displayName },
        "And",
        {
          operator: "GreaterThanOrEqual",
          value: StartDate
        },
        {
          operator: "LessThanOrEqual",
          value: EndDate
        });
      this.host.applyJsonFilter(
        filter,
        "general",
        "filter",
        (StartDate && EndDate)
          ? FilterAction.merge
          : FilterAction.remove
      );
      //FilterAction.merge
    }

    private StringToDate1(date) {
      var year = date.getFullYear();
      var month = (date.getMonth() + 1).toString();
      var day = (date.getDate()).toString();
      if (month.length == 1) {
        month = "0" + month;
      }
      if (day.length == 1) {
        day = "0" + day;
      }
      var dateTime = year + "/" + month + "/" + day;
      return dateTime;
    }

    private StringToDate2(date) {
      var year = date.getFullYear();
      var month = (date.getMonth() + 1).toString();
      var day = (date.getDate()).toString();
      if (month.length == 1) {
        month = "0" + month;
      }
      if (day.length == 1) {
        day = "0" + day;
      }
      var dateTime = year + "/" + month + "/" + day;
      return dateTime;
    }


    /**
     * Enumerates through the objects defined in the capabilities and adds the properties to the format pane
     *
     * @function
     * @param {EnumerateVisualObjectInstancesOptions} options - Map of defined objects
     */
    //@logExceptions()
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {

      if (!this.settings) {
        return;
      }
      let objectName = options.objectName;
      let objectEnumeration: VisualObjectInstance[] = [];
      switch (objectName) {
        case "selection":
          let properties = <any>{
            switchRadio: this.settings.switchRadio,
            condition: this.settings.condition,
            displayMode: this.settings.displayMode,
            isRadio: this.settings.isRadio,
            IgnoreDefaultValues: this.settings.IgnoreDefaultValues
            // showAll: this.settings.showAll,
          }
          if (this.settings.isRadio == false) {
            properties["showAll"] = this.settings.showAll;
          }
          // SearchInput: this.settings.SearchInput,
          //     FuzzySearchInput:this.settings.FuzzySearchInput,
          // Icon:this.settings.Icon
          properties.SearchInput = this.settings.SearchInput;
          properties.FuzzySearchInput = this.settings.FuzzySearchInput;
          properties.Icon = this.settings.Icon;
          if (this.settings.displayMode !== "tree") {
            properties["delimiter"] = this.settings.delimiter;
          }
          if (this.settings.displayMode === "table") {
            properties["columns"] = this.settings.columns;
          }
          objectEnumeration.push({
            objectName: objectName,
            properties: properties,
            selector: null
          });
          break;
        case "item":
          objectEnumeration.push({
            objectName: objectName,
            properties: {
              dropDownContainer: this.settings.dropDownContainer,
              dropDownFontSize: this.settings.dropDownFontSize,
              fontSize: this.settings.fontSize,
              fontFamily: this.settings.fontFamily,
              fontColor: this.settings.fontColor,
              selectedFontColor: this.settings.selectedFontColor,
              background: this.settings.background,
              selectedBackground: this.settings.selectedBackground,
              selectHeight: this.settings.selectHeight,
              selectbackground: this.settings.selectbackground,
              listShowBackground: this.settings.listShowBackground
            },
            selector: null
          })
          break;
        case "titleItem":
          objectEnumeration.push({
            objectName: objectName,
            properties: {
              title: this.settings.title,
              titleSize: this.settings.titleSize,
              titleFontFamily: this.settings.titleFontFamily,
              titleColor: this.settings.titleColor

            },
            selector: null
          })
          break;
        case "time":
          objectEnumeration.push({
            objectName: objectName,
            properties: {
              isShowInput: this.settings.isShowInput,
              isShowslider: this.settings.isShowslider,
              startTime: this.settings.startTime,
              endTime: this.settings.endTime,
            },
            selector: null
          })
          break;
      };
      return objectEnumeration;
    }

    public destroy(): void {
      //TODO: Perform any cleanup tasks here
    }

    // Reads in settings values from the DataViewObjects and returns a settings object that the liquidFillGauge library understands
    //@logExceptions()
    private getSettings(objects: DataViewObjects): boolean {
      var settingsChanged = false;
      if (typeof this.settings == "undefined" || (JSON.stringify(objects) !== JSON.stringify(this.prevDataViewObjects))) {
        this.settings = {
          switchRadio: getValue<boolean>(objects, "selection", "switchRadio", true),
          condition: getValue<string>(objects, "selection", "condition", ""),
          displayMode: getValue<string>(objects, "selection", "displayMode", "table"),
          isRadio: getValue<boolean>(objects, "selection", "isRadio", false),
          delimiter: getValue<String>(objects, "selection", "delimiter", ""),
          columns: getValue<Number>(objects, "selection", "columns", 0),
          showAll: getValue<boolean>(objects, "selection", "showAll", false),
          SearchInput: getValue<boolean>(objects, "selection", "SearchInput", false),
          FuzzySearchInput: getValue<boolean>(objects, "selection", "FuzzySearchInput", true),
          IgnoreDefaultValues: getValue<boolean>(objects, "selection", "IgnoreDefaultValues", false),
          Icon: getValue<string>(objects, "selection", "Icon", "noIcon"),
          dropDownContainer: getValue<Number>(objects, "item", "dropDownContainer", 18),
          dropDownFontSize: getValue<Number>(objects, "item", "dropDownFontSize", 18),
          fontSize: getValue<Number>(objects, "item", "fontSize", 12),
          fontFamily: getValue<string>(objects, "item", "fontFamily", "Arial"),
          fontColor: getValue<object>(objects, "item", "fontColor", {
            solid: { color: "#000" }
          }),
          selectedFontColor: getValue<object>(objects, "item", "selectedFontColor", {
            solid: { color: "#000" }
          }),
          background: getValue<object>(objects, "item", "background", {
            solid: { color: "transparent" }
          }),
          selectedBackground: getValue<object>(objects, "item", "selectedBackground", {
            solid: { color: "#666" }
          }),

          selectHeight: getValue<string>(objects, "item", "selectHeight", "120"),
          selectbackground: getValue<object>(objects, "item", "selectbackground", {
            solid: { color: "transparent" }
          }),
          listShowBackground: getValue<object>(objects, "item", "listShowBackground", {
            solid: { color: "#fff" }
          }),

          title: getValue<String>(objects, "titleItem", "title", ""),
          titleSize: getValue<Number>(objects, "titleItem", "titleSize", 12),
          titleFontFamily: getValue<string>(objects, "titleItem", "titleFontFamily", "Arial"),
          titleColor: getValue<object>(objects, "titleItem", "titleColor", {
            solid: { color: "#9A9A9A" }
          }),
          isShowInput: getValue<boolean>(objects, "time", "isShowInput", true),
          isShowslider: getValue<boolean>(objects, "time", "isShowslider", true),
          startTime: getValue<string>(objects, "time", "startTime", ""),
          endTime: getValue<string>(objects, "time", "endTime", ""),
        };
        settingsChanged = true;
      }
      this.prevDataViewObjects = objects;
      return settingsChanged;
    }
  }
  // export function logExceptions(): MethodDecorator {
  //     return function (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<Function>)
  //         : TypedPropertyDescriptor<Function> {

  //         return {
  //             value: function () {
  //                 try {
  //                     return descriptor.value.apply(this, arguments);
  //                 } catch (e) {
  //                     console.error(e);
  //                     throw e;
  //                 }
  //             }
  //         }
  //     }
  // }
}