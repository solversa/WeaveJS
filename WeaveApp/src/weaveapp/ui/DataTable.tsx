import * as React from "react";
import * as _ from "lodash";
import * as FixedDataTable from "fixed-data-table";
import * as weavejs from "weavejs";

import HBox = weavejs.ui.flexbox.HBox;
import VBox = weavejs.ui.flexbox.VBox;
import Label = weavejs.ui.flexbox.Label;
import Cell = FixedDataTable.Cell;
import Column = FixedDataTable.Column;
import Table = FixedDataTable.Table;
import SmartComponent = weavejs.ui.SmartComponent;
import ResizingDiv = weavejs.ui.ResizingDiv;
import ResizingDivState = weavejs.ui.ResizingDivState;

export declare type SortDirection = "ASC"|"DESC"|"NONE";

export interface ISortHeaderProps extends React.Props<SortHeaderCell>
{
	onSortChange?: (columnKey:string, sortDirection:SortDirection) => void;
	sortDirection?: SortDirection;
	disableSort?: boolean;
	columnKey?: string;
}

export const SortTypes = {
	ASC: 'ASC' as 'ASC',
	DESC: 'DESC' as 'DESC',
};

export class SortHeaderCell extends SmartComponent<ISortHeaderProps, Object>
{
	defaultProps:ISortHeaderProps = {
		disableSort: false
	};

	constructor(props:ISortHeaderProps) {
		super(props);
	}
	static UpArrow(props:{})
	{
		return (
			<span style={{alignSelf: "stretch", display: "flex", cursor: "pointer"}}>
				<i className="fa fa-play fa-fw fa-rotate-270" style={{alignSelf: "center",fontSize: "60%", paddingRight: 2}}/>
			</span>
		);
	}

	static DownArrow(props:{})
	{
		return (
			<span style={{alignSelf: "stretch", display: "flex", cursor: "pointer"}}>
				<i className="fa fa-play fa-fw fa-rotate-90" style={{alignSelf: "center",fontSize: "60%", paddingRight: 2}}/>
			</span>
		);
	}

	render():JSX.Element
	{
		var sortArrow:React.ReactChild = "";
		if (this.props.sortDirection == SortTypes.DESC)
			sortArrow = <SortHeaderCell.DownArrow/>;
		if (this.props.sortDirection == SortTypes.ASC)
			sortArrow = <SortHeaderCell.UpArrow/>;

		return (
			<Cell {...this.props}>
				<HBox padded onClick={this.onSortChange}>
					{sortArrow}
					<Label
						style={{
							paddingLeft: sortArrow ? 4 : null,
							flex: 1
						}}
						children={this.props.children}
					/>
				</HBox>
			</Cell>
		);
	}

	onSortChange=(e:React.MouseEvent) =>
	{
		e.preventDefault();

		if (this.props.onSortChange && !this.props.disableSort) {
			this.props.onSortChange(
				this.props.columnKey,
				(this.props.sortDirection ?
					this.reverseSortDirection(this.props.sortDirection) :
					SortTypes.DESC) as SortDirection
			);
		}
	};

	reverseSortDirection=(sortDirection:SortDirection) =>
	{
		return sortDirection === SortTypes.DESC ? SortTypes.ASC : SortTypes.DESC;
	}
}

export interface IDataTableProps<RowDatum> extends React.Props<DataTable<RowDatum>>
{
	idProperty:string|((row:RowDatum)=>string);
	rows:RowDatum[];
	getCellValue?: (row: RowDatum, columnKey: string) => React.ReactChild;
	columnIds:string[];
	columnTitles?: { [columnId: string]: React.ReactChild } | ((columnId:string) => React.ReactChild);
	enableHover?:boolean;
	enableSelection?:boolean;
	disableSort?:boolean;
	probedIds?:string[];
	selectedIds?:string[];
	onHover?:(id:string[]) => void;
	onSelection?:(id:string[]) => void;
	onCellDoubleClick?: (rowId: string, columnId: string) => void;
	rowHeight?:number;
	headerHeight?:number;
	initialColumnWidth?:number;
	evenlyExpandRows?:boolean;
	allowResizing?:boolean;
	width?:number;
	height?:number;
	showBottomBorder?:boolean;
	allowClear?: boolean;
	multiple?: boolean;
	sortId?:string;
	sortDirection?: SortDirection;

	/**
	 *	a callback function that will be called if you want to sort the data
	 *  manually. if this function is provided, the sortFunction will not be used
	 **/
	onSortCallback?: (columnKey:string, sortDirection:SortDirection) => void;

	/**
	 *  a sort function that will be called if you want to sort the data
	 *  manually, otherwise the table will be sorted by default using plain value
	 *  comparison
	 **/
	sortFunction?: (rowIndexA:number, rowIndexB:number, columnKey:string) => number;
}

export interface IDataTableState
{
	columnWidths?: { [columnId: string]: number };
	sortId?:string;
	sortDirection?:SortDirection;
	width?:number;
	height?:number;
	orderOfRows?:number[]; // this holds the current order of props.rows and based on the each cell is rendered , altered by UI event move selected to top
	probedIds?:string[];
	selectedIds?:string[];
}


export class DataTable<RowDatum> extends SmartComponent<IDataTableProps<RowDatum>, IDataTableState>
{
	private keyDown:boolean;
	private shiftDown:boolean;
	private firstIndex:number;
	private secondIndex:number;
	private lastClicked:number;
	private container:HTMLElement;
	static defaultProps:IDataTableProps<any> = {
		idProperty: "",
		rows: [],
		getCellValue: DataTable.defaultGetCellValue,
		columnTitles:{},
		columnIds:[],
		enableHover:true,
		enableSelection:true,
		disableSort:false,
		rowHeight:30,
		headerHeight:30,
		initialColumnWidth: 85,
		allowResizing: true,
		evenlyExpandRows: true,
		showBottomBorder: true,
		allowClear:true,
		multiple:true,
		sortFunction: function(indexA:number, indexB:number, columnKey:string):number {
			var valueA = this.getValue(indexA, columnKey);
			var valueB = this.getValue(indexB, columnKey);
			valueA = typeof valueA == "string" ? valueA : valueA && (valueA as any).value;
			valueB = typeof valueB == "string" ? valueB : valueA && (valueB as any).value;
			var sortVal = 0;
			if (valueA > valueB)
				sortVal = 1;
			if (valueA < valueB)
				sortVal = -1;
			return sortVal;
		}
	};

	static defaultGetCellValue(row:any, columnKey: string):React.ReactChild
	{
		return row && row[columnKey];
	}

	private idPropertyGetter: (row: RowDatum) => string;

	constructor(props:IDataTableProps<RowDatum>)
	{
		super(props);
		var orderOfRows:number[] = this.props.rows.map((row, index) => index);
		var headerIndices:number[] = [];

		if (props.selectedIds && props.probedIds)
			this.lastClicked = props.selectedIds.length - 1;

		this.state = {
			columnWidths: {},
			orderOfRows,
			selectedIds: props.selectedIds || [],
			probedIds: props.probedIds || [],
			sortId: props.sortId,
			sortDirection: props.sortDirection,
			width: props.width,
			height: props.height
		};

		this.setIdPropertyGetter(props);
	}

	componentWillReceiveProps(nextProps:IDataTableProps<RowDatum>)
	{
		var newState:IDataTableState = {};

		this.setIdPropertyGetter(nextProps);

		// update sort indices if there is change in row size or sort direction
		if (nextProps.rows.length !== this.state.orderOfRows.length || this.props.sortDirection !== nextProps.sortDirection)
			newState.orderOfRows = nextProps.rows.map((row, index) => index);

		if (nextProps.probedIds)
			newState.probedIds = nextProps.probedIds.concat([]);

		if (nextProps.selectedIds)
			newState.selectedIds = nextProps.selectedIds.concat([]);

		if (nextProps.sortId)
		{
			newState.sortId = nextProps.sortId;
		}

		if (this.props.sortDirection !== nextProps.sortDirection )
		{
			newState.sortDirection = nextProps.sortDirection;
		}
		this.setState(newState);
	}

	setIdPropertyGetter(props:IDataTableProps<RowDatum>)
	{
		if (props.idProperty instanceof Function)
		{
			this.idPropertyGetter = props.idProperty as (row:RowDatum)=>string;
		}
		else
		{
			let idProperty = props.idProperty as string;
			this.idPropertyGetter = (row:RowDatum) =>
			{
				return props.getCellValue(row, idProperty) as string;
			}
		}
	}

	moveSelectedToTop():void
	{
		//get ids of each row
		var rowIds = this.props.rows.map(this.idPropertyGetter);
		//get current order of rows
		var orderOfRows:number[] = this.state.orderOfRows;

		let selectedRowIdsIndices:number[] = []; // collection of row index for respective selectedIds
		this.state.selectedIds.map( (id:string,index:number) =>
		{
			let idIndex:number = _.indexOf(rowIds, id); // get id's index of a row from props.rows
			selectedRowIdsIndices.push(idIndex); // store them as they have to come in the top
			// alter the row order now
			let rowIndex:number = orderOfRows.indexOf(idIndex);
			orderOfRows.splice(rowIndex, 1,NaN); // replace with NaN, till we extract all the row index inside this loop
		});

		// now remove all the NaN from row order
		orderOfRows = orderOfRows.filter((id:number)=>
		{
			if(isNaN(id))
			{
				return false;
			}
			return true;
		});

		// concat the selected row index with filtered row order
		this.setState({
			orderOfRows :selectedRowIdsIndices.concat(orderOfRows)
		});

		if (this.props.onSelection)
			this.props.onSelection(this.state.selectedIds);

		this.forceUpdate();
	}

	getValue(index:number, columnKey:string):React.ReactChild
	{
		if (columnKey === null)
		{
			return this.getId(index);
		}
		var row = this.props.rows[this.state.orderOfRows[index]];
		return row && this.props.getCellValue(row, columnKey);
	}

	getId(index:number):string
	{
		var row = this.props.rows[this.state.orderOfRows[index]];
		return row && this.idPropertyGetter(row);
	}

	getRowClass=(index: number):string =>
	{
		var id:string = this.getId(index);

		if (!id || !this.props.enableHover || !this.props.enableSelection)
			return "";

		if (this.props.enableHover && this.props.enableSelection && _.includes(this.state.probedIds, id) && _.includes(this.state.selectedIds, id))
		{
			return "table-row-probed-selected"
		}
		else if (this.props.enableHover && _.includes(this.state.probedIds, id))
		{
			//item needs probed class
			return "table-row-probed";
		}
		else if (this.props.enableSelection && _.includes(this.state.selectedIds, id))
		{
			//item needs selected class
			return "table-row-selected";
		}
	};

	onColumnResizeEndCallback=(newColumnWidth:number, columnKey:string):void =>
	{
		var columnWidths = _.cloneDeep(this.state.columnWidths);
		columnWidths[columnKey] = newColumnWidth;
		this.setState({
			columnWidths
		});
	};

	onMouseEnter=(event:React.MouseEvent, index:number):void =>
	{
		//mouse entering, so set the keys
		var id:string = this.getId(index);
		var probedIds:string[] = id ? [id] : [];

		if (this.props.onHover)
		{
			this.props.onHover(probedIds);
		}
		else
		{
			this.setState({
				probedIds
			});
		}
	};

	onMouseLeave=(event:React.MouseEvent, index:number):void =>
	{
		//console.log("Leave",event,index);
		if (this.props.onHover)
		{
			this.props.onHover([]);
		}
		else
		{
			this.setState({
				probedIds: []
			});
		}
	};

	onMouseDown=(event:React.MouseEvent, index:number):void =>
	{
		//console.log("Down",event,index);
		if (event.button !== 0)
			return; // only perform selection on left click

		var selectedIds:string[] = this.state.selectedIds;
		var id:string = this.getId(index);

		if (!id)
			return;

		// in single selection mode,
		// or ctrl/cmd selcection mode
		// already selected keys get unselected

		// find the selected record location
		var keyLocation:number = selectedIds.indexOf(id);

		// multiple selection
		if ((event.ctrlKey || event.metaKey) && this.props.multiple)
		{
			// if the record is already in the selection
			// we remove it
			if (_.includes(selectedIds,id))
			{
				selectedIds.splice(keyLocation, 1);
			}
			else
			{
				selectedIds.push(id)
			}
			this.lastClicked = index;
		}

		// shift selection
		else if (event.shiftKey && this.props.multiple)
		{
			selectedIds = [];
			if (this.lastClicked != null)
			{
				var start:number = this.lastClicked;

				var end:number = index;

				if (start > end)
				{
					let temp:number = start;
					start = end;
					end = temp;
				}

				for (var i:number = start; i <= end; i++)
				{
					id = this.getId(i);
					if (id)
						selectedIds.push(id);
				}
			}
		}

		// single selection
		else
		{
			// if there was only one record selected
			// and we are clicking on it again, then we want to
			// clear the selection.
			if (selectedIds.length == 1 && selectedIds[0] == id && this.props.allowClear)
			{
				selectedIds = [];
				this.lastClicked = null;
			}
			else
			{
				selectedIds = [id];
				this.lastClicked = index;
			}
		}

		this.setState({
			selectedIds
		});
		if (this.props.onSelection)
			this.props.onSelection(selectedIds);

		this.forceUpdate();
	};

	updateSortDirection=(columnKey:string, sortDirection:SortDirection) =>
	{
		var orderOfRows:number[] = this.state.orderOfRows;
		this.sortColumnIndices(columnKey,sortDirection,orderOfRows);
		this.setState({
			sortId: columnKey,
			sortDirection,
			orderOfRows
		})
	};

	sortColumnIndices=(columnKey:string, sortDirection:SortDirection, orderOfRows:number[]) =>
	{
		if (this.props.onSortCallback)
		{
			this.props.onSortCallback(columnKey, sortDirection);
		}
		else
		{
			orderOfRows.sort((indexA:number, indexB:number) => {
				//use sortFunction.call() because the default sortFunction is not bound but requires 'this' to be a this DataTable
				var sortVal = this.props.sortFunction.call(this, indexA, indexB, columnKey);
				if (sortVal !== 0 && sortDirection === SortTypes.ASC)
					sortVal = sortVal * -1;
				return sortVal;
			});
		}
	};



	handleResize=(newSize:ResizingDivState) =>
	{
		this.setState({
			width: newSize.width,
			height: newSize.height
		});
	};

	renderCell=(props: {rowIndex: number, columnKey: string, height: number, width: number}):JSX.Element=>
	{
		let value = this.getValue(props.rowIndex, props.columnKey);
		let rowId = this.getId(props.rowIndex);

		let handleDoubleClick = (event:React.MouseEvent)=>{
			if (this.props.onCellDoubleClick)
				this.props.onCellDoubleClick(rowId, props.columnKey);
		}
		/* Inline style here is hack to make div actually fill whole cell for dblclick purposes since we can't attach event handlers to the Cell itself. */
		return (
			<Cell key={props.rowIndex+"#"+props.columnKey} {...props}>
				<div style={{ marginLeft: -4, paddingLeft: 4, marginTop: -4, paddingTop: 4, width: props.width, height: props.height}} onDoubleClick={handleDoubleClick}>{value}</div>
			</Cell>
		);
	}

	getColumnTitle(columnId:string)
	{
		if (!this.props.columnTitles)
			return "";
		if (typeof this.props.columnTitles === 'function')
		{
			return (this.props.columnTitles as ((columnKey: string) => React.ReactChild))(columnId);
		}
		else
		{
			return (this.props.columnTitles as {[k: string]: string})[columnId];
		}
	}

	render():JSX.Element
	{
		var tableContainer:React.CSSProperties = {
			flex: 1,
			whiteSpace: "nowrap"
		};
		var evenWidth:number;
		let columnIds: string[] = this.props.columnIds.concat([]);

		if (this.props.evenlyExpandRows && this.state.width > 0)
			evenWidth = Math.max((this.state.width / columnIds.length), this.props.initialColumnWidth);

		let columns = columnIds.map((id: string, index: number) => {
			return (
				<Column
					allowCellsRecycling={true}
					key={index}
					columnKey={id}
					header={
						<SortHeaderCell
							onSortChange={this.updateSortDirection}
							sortDirection={id == this.state.sortId ? this.state.sortDirection : "NONE"}
							disableSort={this.props.disableSort}
							columnKey={id}
							>
							{this.getColumnTitle(id)}
						</SortHeaderCell>
					}
					cell={this.renderCell}
					width={this.state.columnWidths[id] || (this.props.evenlyExpandRows ? (evenWidth || this.props.initialColumnWidth) : this.props.initialColumnWidth) }
					isResizable={this.props.allowResizing}
				/>
			);
		});

		return (
			<ResizingDiv className={this.props.showBottomBorder ? null : "weave-disableBottomBorder"} style={tableContainer} onResize={this.handleResize}>
				{this.state.width && this.state.height ?
					<Table
						rowsCount={this.props.rows.length}
						width={this.state.width}
						height={this.state.height}
						headerHeight={this.props.headerHeight}
						rowHeight={this.props.rowHeight}
						onRowMouseDown={this.onMouseDown}
						onRowMouseEnter={this.onMouseEnter}
						onRowMouseLeave={this.onMouseLeave}
						rowClassNameGetter={this.getRowClass}
						onColumnResizeEndCallback={this.onColumnResizeEndCallback}
						isColumnResizing={false}
					>
						{
							columns
						}
					</Table>:""
				}
			</ResizingDiv>
		);
	}
}

export default class ObjectDataTable extends DataTable<IRow> { }
export interface IRow {
	[columnKey: string]: React.ReactChild;
}
