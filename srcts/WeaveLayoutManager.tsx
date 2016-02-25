/// <reference path="../typings/react/react.d.ts"/>
/// <reference path="../typings/react/react-dom.d.ts"/>
/// <reference path="../typings/lodash/lodash.d.ts"/>
/// <reference path="../typings/weave/weavejs.d.ts"/>

import WeavePath = weavejs.path.WeavePath;
import StandardLib = weavejs.util.StandardLib;
import LinkableVariable = weavejs.core.LinkableVariable;

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as _ from "lodash";
import Layout from "./react-flexible-layout/Layout";
import {LayoutState} from "./react-flexible-layout/Layout";
import C3BarChart from "./tools/C3BarChart";
import C3ScatterPlot from "./tools/C3ScatterPlot";
import ColorLegend from "./tools/ColorLegend";
import BarChartLegend from "./tools/BarChartLegend"
import C3LineChart from "./tools/C3LineChart";
import C3PieChart from "./tools/C3PieChart";
import C3Histogram from "./tools/C3Histogram";
import SessionStateMenuTool from "./tools/SessionStateMenuTool";
import WeaveOpenLayersMap from "./tools/OpenLayersMapTool";
import TableTool from "./tools/TableTool";
import TextTool from "./tools/TextTool";
import DataFilterTool from "./tools/DataFilterTool/DataFilterTool";

// Temporary solution
// because typescript removes
// unused imports
var v1:any = [
	C3BarChart,
	C3ScatterPlot,
	ColorLegend,
	BarChartLegend,
	C3LineChart,
	C3PieChart,
	C3Histogram,
	SessionStateMenuTool,
	WeaveOpenLayersMap,
	TableTool,
	DataFilterTool,
	TextTool
];
///////////////////////////////

import WeaveTool from "./WeaveTool";
import ToolOverlay from "./ToolOverlay";
import MiscUtils from "./utils/MiscUtils";

const LEFT:string = "left";
const RIGHT:string = "right";
const TOP:string = "top";
const BOTTOM:string = "bottom";
const VERTICAL:string = "vertical";
const HORIZONTAL:string = "horizontal";

const TOOLOVERLAY:string = "tooloverlay";

declare type Point = {
	x?: number;
	y?: number;
	r?: number;
	theta?: number;
};

declare type PolarPoint = {
	x: number;
	y: number;
};

export interface IWeaveLayoutManagerProps extends React.Props<WeaveLayoutManager>
{
	layout: LinkableVariable,
	style?: any
}

export interface IWeaveLayoutManagerState
{
}

export default class WeaveLayoutManager extends React.Component<IWeaveLayoutManagerProps, IWeaveLayoutManagerState>
{
	private element:HTMLElement;
	private weave:Weave;
	private layout:LinkableVariable;
	private reactLayout:Layout;
	private margin:number;
	private dirty:boolean;
	private toolDragged:string[];
	private toolOver:string[];
	private dropZone:string;
	private prevClientWidth:number;
	private prevClientHeight:number;
	private throttledForceUpdate:() => void;
	private throttledForceUpdateTwice:() => void;

	constructor(props:IWeaveLayoutManagerProps)
	{
		super(props);
		this.componentWillReceiveProps(props);
		this.margin = 8;
		this.throttledForceUpdate = _.throttle(() => { this.forceUpdate(); }, 30);
		this.throttledForceUpdateTwice = _.throttle(() => { this.dirty = true; this.forceUpdate(); }, 30);
	}
	
	componentWillReceiveProps(props:IWeaveLayoutManagerProps):void
	{
		if (!props.layout)
			throw new Error("layout is a required prop");
		
		if (this.layout && props.layout != this.layout)
			throw new Error("Can't change layout prop");
		
		this.layout = props.layout;
		this.weave = Weave.getWeave(this.layout);
		
		if (!this.weave)
			throw new Error("layout is not registered with an instance of Weave");
	}

	componentDidMount():void
	{
		this.savePrevClientSize();

		window.addEventListener("resize", this.throttledForceUpdateTwice);
		this.weave.root.childListCallbacks.addGroupedCallback(this, this.throttledForceUpdate, true);
		this.layout.addGroupedCallback(this, this.throttledForceUpdate, true);
		this.layout.state = this.simplifyState(this.layout.state);
		weavejs.WeaveAPI.Scheduler.frameCallbacks.addGroupedCallback(this, this.frameHandler, true);
	}

	componentWillUnmount():void
	{
		window.removeEventListener("resize", this.throttledForceUpdate);
		Weave.dispose(this);
	}

	componentDidUpdate():void
	{
		this.savePrevClientSize();

		if (Weave.detectChange(this, this.layout) || this.dirty)
		{
			// dirty flag to trigger render on window resize
			this.dirty = false;
			this.throttledForceUpdate();
		}
	}

	frameHandler():void
	{
		var node:Element = ReactDOM.findDOMNode(this);
		if (this.prevClientWidth != node.clientWidth || this.prevClientHeight != node.clientHeight)
			this.throttledForceUpdateTwice();
		this.savePrevClientSize();
	}

	savePrevClientSize():void
	{
		var node:Element = ReactDOM.findDOMNode(this);
		this.prevClientWidth = node.clientWidth;
		this.prevClientHeight = node.clientHeight;
	}

	saveState(newState:LayoutState):void
	{
		newState = this.simplifyState(newState);
		newState.flex = 1;
		this.layout.state = newState;
	}

	onDragStart(id:string[], event:React.MouseEvent):void
	{
		this.toolDragged = id;
		var toolRef = id[0]; // toolName as used in the ref for the weave tool.
		var element = ReactDOM.findDOMNode(this.refs[toolRef]);

		// hack because dataTransfer doesn't exist on type event
		(event as any).dataTransfer.setDragImage(element, 0, 0);
		(event as any).dataTransfer.setData('text/html', null);
	}

	hideOverlay():void
	{
		var toolOverlayStyle = _.clone((this.refs[TOOLOVERLAY] as ToolOverlay).state.style);
		toolOverlayStyle.visibility = "hidden";
		toolOverlayStyle.left = toolOverlayStyle.top = toolOverlayStyle.width = toolOverlayStyle.height = 0;
		(this.refs[TOOLOVERLAY] as ToolOverlay).setState({
			style: toolOverlayStyle
		});
	}

	onDragEnd():void
	{
		if (this.toolDragged && this.toolOver)
		{
			this.updateLayout(this.toolDragged, this.toolOver, this.dropZone);
			this.toolDragged = null;
			this.dropZone = null;
			this.hideOverlay();
		}
	}

	onDragOver(toolOver:string[], event:React.MouseEvent):void
	{
		if (!this.toolDragged)
		{
			return;
		}
		if (_.isEqual(this.toolDragged, toolOver))
		{
			// hide the overlay if hovering over the tool being dragged
			this.toolOver = null;
			this.hideOverlay();
			return;
		}

		var toolNode = this.reactLayout.getDOMNodeFromId(toolOver);
		var toolNodePosition = toolNode.getBoundingClientRect();

		var toolOverlayStyle = _.clone((this.refs[TOOLOVERLAY] as ToolOverlay).state.style);
		var dropZone = this.getDropZone(toolOver, event);
		toolOverlayStyle.left = toolNodePosition.left;
		toolOverlayStyle.top = toolNodePosition.top;
		toolOverlayStyle.width = toolNodePosition.width;
		toolOverlayStyle.height = toolNodePosition.height;
		toolOverlayStyle.visibility = "visible";

		if (dropZone === LEFT)
		{
			toolOverlayStyle.width = toolNodePosition.width / 2;
		}
		else if (dropZone === RIGHT)
		{
			toolOverlayStyle.left = toolNodePosition.left + toolNodePosition.width / 2;
			toolOverlayStyle.width = toolNodePosition.width / 2;
		}
		else if (dropZone === BOTTOM)
		{
			toolOverlayStyle.top = toolNodePosition.top + toolNodePosition.height / 2;
			toolOverlayStyle.height = toolNodePosition.height / 2;
		}
		else if (dropZone === TOP)
		{
			toolOverlayStyle.height = toolNodePosition.height / 2;
		}

		if (dropZone !== this.dropZone || !_.isEqual(toolOver, this.toolOver))
		{
			(this.refs[TOOLOVERLAY] as ToolOverlay).setState({
				style: toolOverlayStyle
			});
		}

		this.dropZone = dropZone;
		this.toolOver = toolOver;
	}

	getDropZone(id:string[], event:React.MouseEvent):string
	{
		if (this.toolDragged)
		{
			if (!_.isEqual(this.toolDragged, id))
			{
				var toolNode = this.reactLayout.getDOMNodeFromId(id);
				var toolNodePosition = toolNode.getBoundingClientRect();

				var center:Point = {
					x: (toolNodePosition.right - toolNodePosition.left) / 2,
					y: (toolNodePosition.bottom - toolNodePosition.top) / 2
				};

				var mousePosRelativeToCenter:Point = {
					x: event.clientX - (toolNodePosition.left + center.x),
					y: event.clientY - (toolNodePosition.top + center.y)
				};

				var mouseNorm:Point = {
					x: (mousePosRelativeToCenter.x) / (toolNodePosition.width / 2),
					y: (mousePosRelativeToCenter.y) / (toolNodePosition.height / 2)
				};

				var mousePolarCoord:Point = {
					r: Math.sqrt(mouseNorm.x * mouseNorm.x + mouseNorm.y * mouseNorm.y),
					theta: Math.atan2(mouseNorm.y, mouseNorm.x)
				};

				var zones:string[] = [RIGHT, BOTTOM, LEFT, TOP];

				var zoneIndex:number = Math.round((mousePolarCoord.theta / (2 * Math.PI) * 4) + 4) % 4;

				if (mousePolarCoord.r < 0.34)
					return "center";
				else
					return zones[zoneIndex];
			}
		}
	}

	simplifyState(state:LayoutState):LayoutState
	{
		if (!state)
			return {};
		var children:LayoutState[] = state.children;

		if (!children)
			return state;

		if (children.length === 1)
			return this.simplifyState(children[0]);

		var simpleChildren:LayoutState[] = [];

		for (var i = 0; i < children.length; i++)
		{
			var child:LayoutState = this.simplifyState(children[i]);
			if (child.children && child.direction === state.direction)
			{
				var childChildren:LayoutState[] = child.children;
				for (var ii = 0; ii < childChildren.length; ii++)
				{
					var childChild:LayoutState = childChildren[ii];
					childChild.flex *= child.flex;
					simpleChildren.push(childChild);
				}
			}
			else
			{
				simpleChildren.push(child);
			}
		}
		state.children = simpleChildren;
		var totalSizeChildren:number = _.sum(_.map(state.children, "flex"));

		//Scale flex values between 0 and 1 so they sum to 1, avoiding an apparent
		//flex bug where space is lost if sum of flex values is less than 1.
		for (var i = 0; i < state.children.length; i++)
			state.children[i].flex = StandardLib.normalize(state.children[i].flex, 0, totalSizeChildren);

		return state;
	}

	updateLayout(toolDragged:string[], toolDroppedOn:string[], dropZone:string):void
	{
		if (!this.toolDragged || !this.toolOver || !this.dropZone)
			return;

		var newState:LayoutState = _.cloneDeep(this.layout.state);
		var src:LayoutState = MiscUtils.findDeep(newState, {id: toolDragged});
		var dest:LayoutState = MiscUtils.findDeep(newState, {id: toolDroppedOn});
		if (_.isEqual(src.id, dest.id))
			return;

		if (dropZone === "center")
		{
			var srcId = src.id;
			src.id = dest.id;
			dest.id = srcId;
		}
		else
		{
			if (weavejs.WeaveAPI.Locale.reverseLayout)
			{
				if (dropZone === LEFT)
					dropZone = RIGHT;
				else if (dropZone === RIGHT)
					dropZone = LEFT;
			}

			var srcParentArray:LayoutState[] = MiscUtils.findDeep(newState, (obj:LayoutState) => {
				return Array.isArray(obj) && obj.indexOf(src) >= 0;
			});

			srcParentArray.splice(srcParentArray.indexOf(src), 1);

			delete dest.id;
			dest.direction = (dropZone === TOP || dropZone === BOTTOM) ? VERTICAL : HORIZONTAL;

			dest.children = [
				{
					id: toolDragged,
					flex: 0.5
				},
				{
					id: toolDroppedOn,
					flex: 0.5
				}
			];
			if (dropZone === BOTTOM || dropZone === RIGHT)
			{
				dest.children.reverse();
			}
		}
		this.saveState(newState);
	}

	getIdPaths(state:any, output?:WeavePath[]):WeavePath[]
	{
		if (!output)
			output = [];
		if (state && state.id)
			output.push(this.weave.path(state.id));
		if (state && state.children)
			for (var child of state.children)
				this.getIdPaths(child, output);
		return output;
	}

	generateLayoutState(paths:WeavePath[]):Object
	{
		// temporary solution - needs improvement
		return this.simplifyState({
			flex: 1,
			direction: HORIZONTAL,
			children: paths.map(path => { return {id: path.getPath(), flex: 1} })
		});
	}

	render():JSX.Element
	{
		var newState:LayoutState = this.layout.state;
		var children:LayoutState[] = [];
		var paths:WeavePath[];
		var path:WeavePath;

		if (!newState)
		{
			var filteredChildren:WeavePath[] = this.weave.root.getObjects(weavejs.api.ui.IVisTool, true).map(Weave.getPath);
			newState = this.generateLayoutState(filteredChildren);
			//TODO - generate layout state from
			this.layout.state = newState;
		}

		paths = this.getIdPaths(newState);

		var rect:ClientRect;
		if (this.element)
			rect = this.element.getBoundingClientRect();

		for (var i = 0; i < paths.length; i++)
		{
			path = paths[i];
			var toolName:string = path.getPath()[0];
			var node:Element;
			var toolRect:ClientRect;
			var toolPosition:React.CSSProperties;
			if (this.reactLayout && rect)
			{
				node = this.reactLayout.getDOMNodeFromId(path.getPath());
				if (node)
				{
					toolRect = node.getBoundingClientRect();
					toolPosition = {
						top: toolRect.top - rect.top,
						left: toolRect.left - rect.left,
						width: toolRect.right - toolRect.left,
						height: toolRect.bottom - toolRect.top,
						position: "absolute"
					};
				}
			}
			children.push(
				<WeaveTool
					ref={toolName} key={toolName} toolPath={path} style={toolPosition}
					onDragOver={this.onDragOver.bind(this, path.getPath())}
					onDragStart={this.onDragStart.bind(this, path.getPath())}
					onDragEnd={this.onDragEnd.bind(this)} />
			);
		}

		return (
			<div ref={(elt) => { this.element = elt; }} style={MiscUtils.merge({display: "flex", position: "relative", overflow: "hidden", width: "100%", height: "100%"}, this.props.style)}>
				<Layout ref={(layout:Layout) => { this.reactLayout = layout; }} state={_.cloneDeep(newState)} onStateChange={this.saveState.bind(this)}/>
				{children}
				<ToolOverlay ref={TOOLOVERLAY}/>
			</div>
		);
	}
}
