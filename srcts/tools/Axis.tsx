import * as React from "react";
import * as ReactDOM from "react-dom";
import * as d3 from "d3";

import LinkableHashMap = weavejs.core.LinkableHashMap;
import IAttributeColumn = weavejs.api.data.IAttributeColumn;
import DynamicColumn = weavejs.data.column.DynamicColumn;

const BOTTOM = "bottom";
const LEFT = "left";
const RIGHT = "right";
const TOP = "top";

export interface AxisProps extends React.Props<AbstractAxis>
{
	y:number;
	x:number
	range:[number, number];
	domain:[number, number];
	// will be used later for now we are going to use 'linear'
	scalingMethod?:string;
}

export interface AxisState
{
	scale:Function;
}

export class AbstractAxis extends React.Component<AxisProps, AxisState>
{
	element:SVGElement;
	scale:Function; // TODO, get the right signature for this function
	axis:any; // TODO, get the right signature for this function
	orient:string;

	constructor(props:AxisProps)
	{
		super(props)
		this.state = {
			scale: d3.scale.linear().range(props.range).domain(props.domain)
		}
	}
	
	componentDidMount()
	{
		this.axis = d3.svg.axis().scale(this.state.scale).orient(this.orient);
		d3.select(this.element).call(this.axis);
	}
}

export class XAxis extends AbstractAxis
{
	constructor(props:AxisProps)
	{
		super(props);
		this.orient = BOTTOM;
	}

	render()
	{
		return (
			<g transform={"translate(" + this.props.x + "," + this.props.y + ")"} ref={(c) => {this.element = c}} className="axis"></g>
		);
	}
}

export class YAxis extends AbstractAxis
{
	constructor(props:AxisProps)
	{
		super(props);
		this.orient = weavejs.WeaveAPI.Locale.reverseLayout ? RIGHT : LEFT;
	}

	render()
	{
		return (
			<g transform={"translate(" + this.props.x + "," + this.props.y + ")"} ref={(c) => {this.element = c}} className="axis"></g>
		);
	}
}
