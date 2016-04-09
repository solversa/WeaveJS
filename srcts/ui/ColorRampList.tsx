import * as React from "react";
import * as ReactDOM from "react-dom";
import * as _ from "lodash";
import FixedDataTable from "../tools/FixedDataTable";
import {IRow, IColumnTitles} from "../tools/FixedDataTable";
import {HBox, VBox} from "../react-ui/FlexBox";
import ColorRamp from "../react-ui/ColorRamp";

import StandardLib = weavejs.util.StandardLib;

export interface ColorRampListProps extends React.Props<ColorRampList>
{
	allColorRamps:{name:string, tags:string, colors:number[]}[];
	selectedColors?:number[];
	onChange?:(selectedRamp:number[]) => void;
}

export interface ColorRampListState
{
	selectedColors?:number[];
}

export default class ColorRampList extends React.Component<ColorRampListProps, ColorRampListState>
{
	columnTitles:IColumnTitles = {};
	tableContainer:VBox;
	tableContainerElement:HTMLElement;

	constructor(props:ColorRampListProps)
	{
		super(props);
		this.columnTitles["id"] = "Key";
		this.columnTitles["value"] = Weave.lang("Color scale presets");
		this.state = {
			selectedColors: props.selectedColors
		}
	}
	
	static defaultProps:ColorRampListProps = {
		allColorRamps: []
	}
	
	private getRampNameFromRamp(selectedColors:number[])
	{
		if(selectedColors)
		{
			var selectedRampConfig = this.props.allColorRamps.find(v => _.isEqual(v.colors, selectedColors));
			if(selectedRampConfig)
				return selectedRampConfig.name;
			return "";
		}
	}
	
	componentDidMount()
	{
		this.forceUpdate(); // force update to get the correct size for the table
	}
	
	componentWillReceiveProps(nextProps:ColorRampListProps)
	{
		if(nextProps.selectedColors)
		{
			this.setState({
				selectedColors: nextProps.selectedColors
			});
		}
	}
	
	componentWillUpdate()
	{
		this.tableContainerElement = ReactDOM.findDOMNode(this.tableContainer) as HTMLElement;
	}
	
	
	handleTableSelection = (id:string[]) =>
	{
		if(id.length)
		{
			var selectedRampConfig = this.props.allColorRamps.find(v => v.name == id[0]);
			if(selectedRampConfig)
				this.props.onChange && this.props.onChange(selectedRampConfig.colors);
		}
	}
	
	render():JSX.Element
	{
		
		var selectedId = this.getRampNameFromRamp(this.state.selectedColors);
		var rows:IRow[] = this.props.allColorRamps.map((colorRampConfig) => {
			var row:IRow = {};
			var rampRow = (
				<HBox style={{flex: 1}}>
					<ColorRamp style={{flex: 1}} ramp={colorRampConfig.colors.map(StandardLib.getHexColor)}/>
					<HBox style={{flex: 1, paddingLeft: 10}}>{colorRampConfig.name}</HBox>
				</HBox>
			);
			row["id"] = colorRampConfig.name;
			row["value"] = rampRow;
			return row;
		});

		return (
			<VBox style={{flex: 1}} ref={(c:VBox) => this.tableContainer = c}>
				{
					this.tableContainerElement && 
					<FixedDataTable columnIds={["id", "value"]} 
									idProperty="id" rows={rows} 
									columnTitles={this.columnTitles} 
									showIdColumn={false}
									selectedIds={[selectedId]}
									initialColumnWidth={this.tableContainerElement.clientWidth}
									onSelection={this.handleTableSelection}/>
				}
			</VBox>
		);
	}
}
