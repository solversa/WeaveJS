// <reference path="../../typings/d3/d3.d.ts"/>
/// <reference path="../../typings/lodash/lodash.d.ts"/>
///<reference path="../../typings/react/react.d.ts"/>
///<reference path="../../typings/weave/weavejs.d.ts"/>
///<reference path="../react-ui/ui.tsx"/>
///<reference path="../../typings/react/react-dom.d.ts"/>

import {IVisTool, IVisToolProps, IVisToolState} from "./IVisTool";

import * as _ from "lodash";
import * as d3 from "d3";
import * as React from "react";
import ui from "../react-ui/ui";
import StandardLib from "../utils/StandardLib";
import * as ReactDOM from "react-dom";
import {CSSProperties} from "react";
import * as Prefixer from "react-vendor-prefix";

import WeavePath = weavejs.path.WeavePath;
import WeavePathUI = weavejs.path.WeavePathUI;
import IAttributeColumn = weavejs.api.data.IAttributeColumn;

const SHAPE_TYPE_CIRCLE:string = "circle";
const SHAPE_TYPE_SQUARE:string = "square";
const SHAPE_TYPE_LINE:string = "line";

export default class WeaveC3BarChartLegend extends React.Component<IVisToolProps, IVisToolState> implements IVisTool {

    private plotterPath:WeavePath;
    private colorRampPath:WeavePath;
    private columnsPath:WeavePath;
    private maxColumnsPath:WeavePath;
    private filteredKeySet:WeavePath;
    private toolPath:WeavePath;
    private spanStyle:CSSProperties;
    private numberOfLabels:number;

    constructor(props:IVisToolProps) {
        super(props);
        this.toolPath = props.toolPath;
        this.plotterPath = (this.toolPath as WeavePathUI).pushPlotter("plot");
        this.colorRampPath = this.plotterPath.push("chartColors");
        this.columnsPath = this.plotterPath.push("columns");
        this.maxColumnsPath = this.plotterPath.push("maxColumns");
        this.filteredKeySet = this.plotterPath.push("filteredKeySet");
        this.state = {selected:[], probed:[]};
        this.spanStyle = {textAlign:"left",verticalAlign:"middle", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", paddingLeft:5, userSelect:"none"};
    }

	get deprecatedStateMapping()
	{
		return {};
	}

    get title():string {
       return (this.toolPath.getType('panelTitle') ? this.toolPath.getState('panelTitle') : '') || this.toolPath.getPath().pop();
    }

    private setupCallbacks() {
        this.maxColumnsPath.addCallback(this, this.forceUpdate);
        this.filteredKeySet.addCallback(this, this.forceUpdate);
        this.plotterPath.push("shapeSize").addCallback(this, this.forceUpdate);
    }

    //getSelectedBins():number[] {
    //
    //}

    //getProbedBins():number[] {
    //
    //}

    handleClick(label:number,temp:any):void {

    }

    handleProbe(bin:number, mouseOver:boolean):void {

    }

    componentDidMount() {
        this.setupCallbacks();
    }

    componentDidUpdate() {
    }

    drawContinuousPlot() {

    }

    selectionKeysChanged() {

    }

    probeKeysChanged() {

    }

    visualizationChanged() {

    }

    componentWillUnmount() {
    }

    getInteractionStyle(bin:number):CSSProperties {
        var selectedStyle:CSSProperties = {
            width:"100%",
            flex:1.0,
            borderWidth:0,
            borderColor:"black",
            borderStyle:"solid",
            opacity: 1.0
        };
        return selectedStyle;
    }

    render() {
        var width:number = this.props.style.width as number;
        var height:number = this.props.style.height as number;
        var shapeSize:number = this.plotterPath.getState("shapeSize") as number;
        this.numberOfLabels = this.columnsPath.getNames().length;
        var maxColumns:number = 1;//TODO: This should really be "this.maxColumnsPath.getState();" but only supporting 1 column for now
        var columnFlex:number = 1.0/maxColumns;
        var extraBins:number = this.numberOfLabels%maxColumns == 0 ? 0 : maxColumns-(this.numberOfLabels%maxColumns);
        var ramp:any[] = this.colorRampPath.getState() as any[];

        var labels:string[] = (this.columnsPath.getState() as any[]).map( (item:any):string => {
            var columnName:string = item.objectName;
            return (this.columnsPath.push(columnName).getObject() as IAttributeColumn).getMetadata('title');
        });
        var finalElements:any[] = [];
        var prefixerStyle:{} = Prefixer.prefix({styles: this.spanStyle}).styles;
        for(var j:number = 0; j<maxColumns; j++) {

            var element:JSX.Element[] = [];
            var elements:JSX.Element[] = [];
            for(var i=0; i<this.numberOfLabels+extraBins; i++) {
                if(i%maxColumns == j) {

                    if(i<this.numberOfLabels){
                        element.push(
                            <ui.HBox key={i} style={this.getInteractionStyle(i)} onClick={this.handleClick.bind(this, i)} onMouseOver={this.handleProbe.bind(this, i, true)} onMouseOut={this.handleProbe.bind(this, i, false)}>
                                <ui.HBox style={{width:shapeSize, position:"relative", padding:"0px 0px 0px 0px"}}>
                                    <svg style={{position:"absolute"}} width="100%" height="100%">
                                        <rect x={0} y={10} height="80%" width={shapeSize} style={{fill:"#" + StandardLib.decimalToHex(StandardLib.interpolateColor(StandardLib.normalize(i, 0, this.numberOfLabels - 1), ramp)), stroke:"black", strokeOpacity:0.5}}></rect>
                                    </svg>
                                </ui.HBox>
                                <ui.HBox style={{width:"100%", flex:0.8, alignItems:"center"}}>
                                    <span style={prefixerStyle}>{labels[i]}</span>
                                </ui.HBox>
                            </ui.HBox>
                        );
                    }else{
                        element.push(
                            <ui.HBox key={i} style={{width:"100%", flex:1.0}}/>
                        );
                    }
                }
            }
            {
                this.props.style.width > this.props.style.height * 2 ?
                    elements.push(
                        <ui.HBox key={i} style={{width:"100%", flex: columnFlex}}>
                            {
                                element
                                }
                        </ui.HBox>
                    )
                    :
                    elements.push(
                        <ui.VBox key={i} style={{height:"100%", flex: columnFlex}}>
                            {
                                element
                                }
                        </ui.VBox>
                    );

            }

            finalElements[j] = elements;
        }

        return (<div style={{width:"100%", height:"100%", padding:"0px 5px 0px 5px"}}>
            <ui.VBox style={{height:"100%",flex: 1.0, overflow:"hidden"}}>
                <ui.HBox style={{width:"100%", flex: 0.1, alignItems:"center"}}>
                    <span style={prefixerStyle}>Bar color</span>
                </ui.HBox>
                {
                    this.props.style.width > this.props.style.height * 2 ?
                    <ui.HBox style={{width:"100%", flex: 0.9}}> {
                        finalElements
                        }
                    </ui.HBox>
                        :
                    <ui.VBox style={{height:"100%", flex: 0.9}}> {
                        finalElements
                        }
                    </ui.VBox>

                    }
            </ui.VBox>
        </div>);
    }
}

weavejs.util.BackwardsCompatibility.forceDeprecatedState(WeaveC3BarChartLegend); // TEMPORARY HACK - remove when class is refactored

Weave.registerClass("weavejs.tool.BarChartLegend", WeaveC3BarChartLegend, [weavejs.api.ui.IVisTool, weavejs.api.core.ILinkableObjectWithNewProperties]);
Weave.registerClass("weave.visualization.tools::BarChartLegendTool", WeaveC3BarChartLegend);
