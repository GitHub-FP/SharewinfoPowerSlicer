import * as React from "react";
import {useEffect,useState} from "react";
import { Checkbox } from 'antd';
import { State } from 'interface/interface';
import { inFilter,formatterValue } from './utils/utils';
import powerbi from "powerbi-visuals-api";

const SliderSlice: React.FunctionComponent<State> = (props: State) => {

  let init:powerbi.DataViewCategoryColumn = {
    values: [],
    source: undefined
  };

  // const [formatterdata,setFormatterdata] = useState(init);
  const [data,setData] = useState(init);
  const [checked,setChecked] = useState([]);


  useEffect(()=>{
    props.updateOptions.jsonFilters.map<any>(
      (filter: { $schema: any, conditions: any, operator: string, values: any[] }, index: number) => {
        let {operator,values} = filter;
        debugger
          if(operator=="In" && ((values||"").toString()!=(checked||"").toString())){
            setChecked(values||[])
          }
      });
  },[props.updateOptions.jsonFilters])

  useEffect(()=>{
    if(props.updateOptions.dataViews[0] && props.updateOptions.dataViews[0]?.categorical?.categories?.length>0){
      const values= props.updateOptions.dataViews[0]?.categorical?.categories[0];
      setData(values);
    }
  },[props.updateOptions])

  useEffect(()=>{
    if(props.updateOptions.dataViews[0] && props.updateOptions.dataViews[0]?.categorical?.categories?.length>0){
      const datavalues= props.updateOptions.dataViews[0]?.categorical?.categories[0];
      let formatterdata = datavalues.values.map(d=>{
        return datavalues.source
          ?formatterValue(datavalues.source,d)
          :d
      })
      let defaultValueArr = props.settings.loop.defaultValue.split(',');
      let defaultCheckedArr=[];
      defaultValueArr.map(da=>{
        let index = formatterdata.indexOf(da)
        if(index >=0 && datavalues.values[index]){
          defaultCheckedArr.push(datavalues.values[index])
        }
      })
      if(defaultCheckedArr.length>0){
        setChecked(defaultCheckedArr);
      }
    }
  },[])

  useEffect(()=>{
    debugger
    inFilterFn(checked)
  },[checked])

  function onChange(e) {
    setChecked(e||[])
  }

  function inFilterFn(filterValue) {
    inFilter(props,filterValue);
  }

  return (
    <>
      <Checkbox.Group style={{ width: '100%' }} value={checked} onChange={onChange}>
        {
          (data.values||[]).map((d,i)=>{
            return (
              <div>
                <Checkbox 
                  data-index={i} 
                  value={d} 
                  // checked={ checked.indexOf(JSON.stringify({key:i,value:d}))>=0 } 
                > 
                  {
                    data.source
                      ?formatterValue(data.source,d)
                      :d
                  }
                </Checkbox>
              </div>
            )
          })
        }
        
    </Checkbox.Group>
    </>
  )
}

export default SliderSlice;