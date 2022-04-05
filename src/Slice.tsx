import * as React from "react";
import { State } from 'interface/interface';
import SliderSlice from "./SliderSlice";

 const initialState: State = {}

 class Slice extends React.Component<{}>{

    private static updateCallback: (data: object) => void = null;

    static update = (newState: State)=>{
        if (typeof Slice.updateCallback === 'function') {
            Slice.updateCallback(newState);
        }
    }

    public state: State = initialState;

    public componentWillMount() {
        Slice.updateCallback = (newState: State): void => { this.setState(newState); };
    }

    public componentWillUnmount() {
        Slice.updateCallback = null;
    }

    render() {
        const { cotrOptions, updateOptions, settings, dataSource } = this.state;
        return (
            <>
                {updateOptions ? <SliderSlice {...this.state} /> : null}
            </>
        )
    }
}

export default Slice;