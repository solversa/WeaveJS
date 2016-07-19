/* ***** BEGIN LICENSE BLOCK *****
 *
 * This file is part of Weave.
 *
 * The Initial Developer of Weave is the Institute for Visualization
 * and Perception Research at the University of Massachusetts Lowell.
 * Portions created by the Initial Developer are Copyright (C) 2008-2015
 * the Initial Developer. All Rights Reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 * 
 * ***** END LICENSE BLOCK ***** */

package weave.utils
{
	import Point = flash.geom.Point;
	import Dictionary = flash.utils.Dictionary;
	import getTimer = flash.utils.getTimer;
	
	import Weave = weave.Weave;
	import ICallbackCollection = weave.api.core.ICallbackCollection;
	import ILinkableObject = weave.api.core.ILinkableObject;
	import IQualifiedKey = weave.api.data.IQualifiedKey;
	import ISimpleGeometry = weave.api.data.ISimpleGeometry;
	import getCallbackCollection = weave.api.getCallbackCollection;
	import IBounds2D = weave.api.primitives.IBounds2D;
	import registerDisposableChild = weave.api.registerDisposableChild;
	import IPlotter = weave.api.ui.IPlotter;
	import IPlotterWithGeometries = weave.api.ui.IPlotterWithGeometries;
	import StageUtils = weave.core.StageUtils;
	import BLGNode = weave.primitives.BLGNode;
	import Bounds2D = weave.primitives.Bounds2D;
	import GeneralizedGeometry = weave.primitives.GeneralizedGeometry;
	import KDTree = weave.primitives.KDTree;
	import SimpleGeometry = weave.primitives.SimpleGeometry;

	import ICallbackCollection = weavejs.api.core.ICallbackCollection;

	import ILinkableObject = weavejs.api.core.ILinkableObject;
	import IQualifiedKey = weavejs.api.data.IQualifiedKey;
	import ISimpleGeometry = weavejs.api.data.ISimpleGeometry;
	import BLGNode = weavejs.geom.BLGNode;
	import Bounds2D = weavejs.geom.Bounds2D;
	import GeneralizedGeometry = weavejs.geom.GeneralizedGeometry;
	import KDTree = weavejs.geom.KDTree;
	import Point = weavejs.geom.Point;
	import SimpleGeometry = weavejs.geom.SimpleGeometry;

	/**
	 * This class provides an interface to a collection of spatially indexed IShape objects.
	 * This class will not detect changes to the shapes you add to the index.
	 * If you change the bounds of the shapes, you will need to call SpatialIndex.createIndex().
	 */
	export class SpatialIndex implements ILinkableObject
	{
		public debug:boolean = false;
		
		public constructor()
		{
			this.callbacks = getCallbackCollection(this);
		}
		
		private callbacks:ICallbackCollection;
		
		private _kdTree:KDTree = registerDisposableChild(this, new KDTree(5));
		private _keysArray:Array = []; // of IQualifiedKey
		private _keyToBoundsMap:Dictionary = new Dictionary(); // IQualifiedKey -> Array of IBounds2D
		private _keyToGeometriesMap:Dictionary = new Dictionary(); // IQualifiedKey -> Array of GeneralizedGeometry or ISimpleGeometry
		
		private _restarted:boolean = false; // used by async code
		private _queryMissingBounds:boolean; // used by async code
		private _keysArrayIndex:int; // used by async code
		private _keysIndex:int; // used by async code
		private _plotter:IPlotter;//used by async code
		private _boundsArrayIndex:int; // used by async code
		private _boundsArray:Array; // used by async code
		
		/**
		 * These constants define indices in a KDKey corresponding to xmin,ymin,xmax,ymax,importance values.
		 */
		private XMIN_INDEX:int = 0, YMIN_INDEX:int = 1;
		private XMAX_INDEX:int = 2, YMAX_INDEX:int = 3;
		private IMPORTANCE_INDEX:int = 4;
		
		/**
		 * These KDKey arrays are created once and reused to avoid unnecessary creation of objects.
		 * The only values that change are the ones that are undefined here.
		 */
		private minKDKey:Array = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, NaN, NaN, 0];
		private maxKDKey:Array = [NaN, NaN, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
		
		// reusable temporary objects
		private _tempBoundsPolygon:Array = [new Point(), new Point(), new Point(), new Point(), new Point()]; // used by setTempBounds and getKeysGeometryOverlap

		/**
		 * This bounds represents the full extent of the shape index.
		 */
		public collectiveBounds:IBounds2D = new Bounds2D();
		
		/**
		 * This function gets a list of Bounds2D objects associated with a key.
		 * @param key A record key.
		 * @result An Array of Bounds2D objects associated with the key, or null if there are none.
		 */
		public getBoundsFromKey(key:IQualifiedKey):Array
		{
			return _keyToBoundsMap[key] as Array;
		}
		
		/**
		 * The list of all the IQualifiedKey objects (record identifiers) referenced in this index.
		 */
		public get keys():Array
		{
			return _keysArray;
		}
		
		/**
		 * This function fills the spatial index with the data bounds of each record in a plotter.
		 * 
		 * @param plotter An IPlotter object to index.
		 */
		public createIndex(plotter:IPlotter, queryMissingBounds:boolean = false):void
		{
			if (debug)
				debugTrace(plotter,this,'createIndex');
			
			_plotter = plotter;
			_queryMissingBounds = queryMissingBounds;
			_restarted = true;
			
			_iterateAll(-1); // restart from first task
			// normal priority because some things can be done without having a fully populated spatial index (?)
			WeaveAPI.StageUtils.startTask(this, _iterateAll, WeaveAPI.TASK_PRIORITY_NORMAL, callbacks.triggerCallbacks, lang("Creating spatial index for {0}", debugId(plotter)));
		}
		
		private _iterateAll:Function = StageUtils.generateCompoundIterativeTask(_iterate0, _iterate1, _iterate2);

		private _iterate0():number
		{
			_restarted = false;
			
			var key:IQualifiedKey;
			var bounds:IBounds2D;
			var i:int;
			
			if (_plotter is IPlotterWithGeometries)
				_keyToGeometriesMap = new Dictionary();
			else 
				_keyToGeometriesMap = null;
			
			_keysArray.length = 0; // hack to prevent callbacks
			clear();
			
			// make a copy of the keys vector
			if (_plotter)
				ArrayUtils.copy(_plotter.filteredKeySet.keys, _keysArray);
			
			// randomize the order of the shapes to avoid a possibly poorly-performing
			// KDTree structure due to the given ordering of the records
			ArrayUtils.randomSort(_keysArray);
			if (debug)
				debugTrace(_plotter,this,'keys',_keysArray.length);
			
			return 1;
		}
		
		private _iterate1(stopTime:int):number
		{
			for (; _keysIndex < _keysArray.length; _keysIndex++)
			{
				if (_restarted)
					return 0;
				if (getTimer() > stopTime)
					return _keysIndex / _keysArray.length;
				
				var key:IQualifiedKey = _keysArray[_keysIndex] as IQualifiedKey;
				var boundsArray:Array = _keyToBoundsMap[key] as Array;
				if (!boundsArray)
					_keyToBoundsMap[key] = boundsArray = [];
				
				// this may trigger callbacks, which would cause us to skip the new key
				// at index 0 if we did not have _iterate0 as part of the async task
				_plotter.getDataBoundsFromRecordKey(key, boundsArray);
				
				if (_keyToGeometriesMap != null)
				{
					var geoms:Array = (_plotter as IPlotterWithGeometries).getGeometriesFromRecordKey(key);
					_keyToGeometriesMap[key] = geoms;
				}
			}
			
			return _restarted ? 0 : 1;
		}
			
		private _iterate2(stopTime:int):number
		{
			for (; _keysArrayIndex < _keysArray.length; _keysArrayIndex++)
			{
				var key:IQualifiedKey = _keysArray[_keysArrayIndex] as IQualifiedKey;
				if (!_boundsArray) // is there an existing nested array?
				{
					//trace(key.keyType,key.localName,'(',_keysArrayIndex,'/',_keysArray.length,')');
					// begin outer loop iteration
					_boundsArray = _keyToBoundsMap[key];
					
					if (!_boundsArray)
						continue;
					
					_boundsArrayIndex = 0;
				}
				for (; _boundsArrayIndex < _boundsArray.length; _boundsArrayIndex++) // iterate on nested array
				{
					if (_restarted)
						return 0;
					if (getTimer() > stopTime)
						return _keysArrayIndex / _keysArray.length;
					
					//trace('bounds(',_boundsArrayIndex,'/',_boundsArray.length,')');
					var bounds:IBounds2D = _boundsArray[_boundsArrayIndex] as IBounds2D;
					// do not index shapes with undefined bounds
					//TODO: index shapes with missing bounds values into a different index
					// TEMPORARY SOLUTION: store missing bounds if queryMissingBounds == true
					if (!bounds.isUndefined() || _queryMissingBounds)
						_kdTree.insert([bounds.getXNumericMin(), bounds.getYNumericMin(), bounds.getXNumericMax(), bounds.getYNumericMax(), bounds.getArea()], key);
					// always include bounds because it may have some coords defined while others aren't
					collectiveBounds.includeBounds(bounds);
				}
				// all done with nested array
				_boundsArray = null;
			}
			
			return _restarted ? 0 : 1;
		}
		
		/**
		 * This function empties the spatial index.
		 */
		public clear():void
		{
			callbacks.delayCallbacks();
			if (debug)
				debugTrace(_plotter,this,'clear');
			
			if (_keysArray.length > 0)
				callbacks.triggerCallbacks();
			
			_boundsArray = null;
			_keysArrayIndex = 0;
			_keysIndex = 0;
			_keysArray.length = 0;
			_kdTree.clear();
			collectiveBounds.reset();
			
			callbacks.resumeCallbacks();
		}
		
		private static polygonOverlapsPolyLine(polygon:Array, line:Object):boolean
		{
			for (var i:int = 0; i < line.length - 1; ++i)
			{
				if (GeometryUtils.polygonOverlapsLine(polygon, line[i].x, line[i].y, line[i + 1].x, line[i + 1].y))
				{
					return true;
				}
			}
			
			return false;		
		}
		private static polygonOverlapsPolyPoint(polygon:Array, points:Object):boolean
		{
			for (var i:int = 0; i < points.length; ++i)
			{
				if (GeometryUtils.polygonOverlapsPoint(polygon, points[i].x, points[i].y))
					return true;
			}
			
			return false;
		}
		private static getMinimumUnscaledDistanceFromPolyLine(line:Object, x:number, y:number):number
		{
			var min:number = Number.POSITIVE_INFINITY;
			for (var i:int = 0; i < line.length - 1; ++i)
			{
				var distance:number = GeometryUtils.getUnscaledDistanceFromLine(line[i].x, line[i].y, line[i + 1].x, line[i + 1].y, x, y, true);
				min = Math.min(distance, min);
			}			
			return min;
		}
		private static getMinimumUnscaledDistanceFromPolyPoint(points:Object, x:number, y:number):number
		{
			var min:number = Number.POSITIVE_INFINITY;
			for (var i:int = 0; i < points.length; ++i)
			{
				var distance:number = GeometryUtils.getDistanceFromPointSq(points[i].x, points[i].y, x, y);
				min = Math.min(distance, min);
			}
			return min;
		}
		/**
		 * This function will get the keys whose bounding boxes intersect with the given bounds.
		 * 
		 * @param bounds A bounds used to query the spatial index.
		 * @param minImportance The minimum importance value imposed on the resulting keys. 
		 * @return An array of keys.
		 */
		public getKeysBoundingBoxOverlap(bounds:IBounds2D, minImportance:number = 0):Array
		{
			// This is a filter for bounding boxes and should be used for getting fast results
			// during panning and zooming.
			
			// set the minimum query values for shape.bounds.xMax, shape.bounds.yMax
			minKDKey[XMAX_INDEX] = bounds.getXNumericMin(); // enforce result.XMAX >= query.xNumericMin
			minKDKey[YMAX_INDEX] = bounds.getYNumericMin(); // enforce result.YMAX >= query.yNumericMin
			minKDKey[IMPORTANCE_INDEX] = minImportance; // enforce result.IMPORTANCE >= minImportance
			// set the maximum query values for shape.bounds.xMin, shape.bounds.yMin
			maxKDKey[XMIN_INDEX] = bounds.getXNumericMax(); // enforce result.XMIN <= query.xNumericMax
			maxKDKey[YMIN_INDEX] = bounds.getYNumericMax(); // enforce result.YMIN <= query.yNumericMax
			
			//return _kdTree.queryRange(minKDKey, maxKDKey, true, IMPORTANCE_INDEX, KDTree.DESCENDING);
			return _kdTree.queryRange(minKDKey, maxKDKey);
		}
		
		/**
		 * used by getKeysGeometryOverlap.
		 */
		private setTempBounds(bounds:IBounds2D):void
		{
			var b:Bounds2D = bounds as Bounds2D;
			var xMin:number = b.xMin;
			var yMin:number = b.yMin;
			var xMax:number = b.xMax;
			var yMax:number = b.yMax;
			_tempBoundsPolygon[0].x = xMin; _tempBoundsPolygon[0].y = yMin;
			_tempBoundsPolygon[1].x = xMin; _tempBoundsPolygon[1].y = yMax;
			_tempBoundsPolygon[2].x = xMax; _tempBoundsPolygon[2].y = yMax;
			_tempBoundsPolygon[3].x = xMax; _tempBoundsPolygon[3].y = yMin;
			_tempBoundsPolygon[4].x = xMin; _tempBoundsPolygon[4].y = yMin;
		}
		
		/**
		 * This function will get the keys whose geometries intersect with the given bounds.
		 * 
		 * @param bounds A bounds used to query the spatial index.
		 * @param minImportance The minimum importance value to use when determining geometry overlap.
		 * @param filterBoundingBoxesByImportance If true, bounding boxes will be pre-filtered by importance before checking geometry overlap.
		 * @return An array of keys.
		 */
		public getKeysGeometryOverlap(queryBounds:IBounds2D, minImportance:number = 0, filterBoundingBoxesByImportance:boolean = false, dataBounds:IBounds2D = null):Array
		{
			var keys:Array = getKeysBoundingBoxOverlap(queryBounds, filterBoundingBoxesByImportance ? minImportance : 0);
			
			// if this index isn't for an IPlotterWithGeometries OR the user wants legacy probing
			if (_keyToGeometriesMap == null || !Weave.properties.enableGeometryProbing.value)
				return keys;
			
			// if there are 0 keys
			if (keys.length == 0)
				return keys;
			
			// define the bounds as a polygon
			setTempBounds(queryBounds);
			
			var test:uint;
			var result:Array = [];
			
			// for each key, look up its geometries 
			keyLoop: for (var i:int = keys.length; i--;)
			{
				var key:IQualifiedKey = keys[i];
				var geoms:Array = _keyToGeometriesMap[key];
				
				if (!geoms || geoms.length == 0) // geoms may be null if async task hasn't completed yet
				{
					result.push(key);
					continue keyLoop;
				}
				
				// for each geometry, get vertices, check type, and do proper geometric overlap
				for (var iGeom:int = 0; iGeom < geoms.length; ++iGeom)
				{
					var overlapCount:int = 0;
					var geom:Object = geoms[iGeom];
					if (geom is GeneralizedGeometry)
					{
						var genGeom:GeneralizedGeometry = geom as GeneralizedGeometry;
						var genGeomIsPoly:boolean = genGeom.isPolygon();
						var genGeomIsLine:boolean = genGeom.isLine();
						var genGeomIsPoint:boolean = genGeom.isPoint();
						var simplifiedGeom:Vector.<Vector.<BLGNode>> = genGeom.getSimplifiedGeometry(minImportance, dataBounds);
						
						if (simplifiedGeom.length == 0 && genGeom.bounds.overlaps(queryBounds))
						{
							result.push(key);
							continue keyLoop;
						}
						
						// for each part, build the vertices polygon and check for the overlap
						for each (var part:Vector.<BLGNode> in simplifiedGeom)
						{
							if (part.length == 0) // if no points, continue
								continue;
							
							// if a polygon, check for polygon overlap
							if (genGeomIsPoly)
							{
								test = GeometryUtils.polygonOverlapsPolygon(_tempBoundsPolygon, part);
								if (test == GeometryUtils.CONTAINED_IN)
								{
									overlapCount++;
								}
								else if (test != GeometryUtils.NO_OVERLAP)
								{
									result.push(key);
									continue keyLoop;
								}
							}
							else if (genGeomIsLine)
							{
								if (polygonOverlapsPolyLine(_tempBoundsPolygon, part))
								{
									result.push(key);
									continue keyLoop;
								}
							}
							else // point
							{
								if (polygonOverlapsPolyPoint(_tempBoundsPolygon, part))
								{
									result.push(key);
									continue keyLoop;
								}
							}
						}
					}
					else // NOT a generalized geometry
					{
						var simpleGeom:ISimpleGeometry = geom as ISimpleGeometry;
						var simpleGeomIsPoly:boolean = simpleGeom.isPolygon();
						var simpleGeomIsLine:boolean = simpleGeom.isLine();
						var simpleGeomIsPoint:boolean = simpleGeom.isPoint();
						// get its vertices
						var vertices:Array = simpleGeom.getVertices();
						
						if (simpleGeomIsPoly)// a polygon, check for polygon overlap
						{
							if (GeometryUtils.polygonOverlapsPolygon(_tempBoundsPolygon, vertices))
							{
								result.push(key);
								continue keyLoop;
							}
						}
						else if (simpleGeomIsLine) // if a line, check for bounds intersect line
						{
							if (polygonOverlapsPolyLine(_tempBoundsPolygon, vertices))
							{
								result.push(key);
								continue keyLoop;
							}
						}
						else
						{
							if (polygonOverlapsPolyPoint(_tempBoundsPolygon, vertices))
							{
								result.push(key);
								continue keyLoop;
							}
						}
					}
					
					if (overlapCount % 2)
					{
						result.push(key);
						continue keyLoop;
					}
				} // end for each (var geom...
			} // end for each (var key...
			
			return result; 
		} // end function
		
		/**
		 * This function will get the keys closest the center of the bounds object. Generally this function will
		 * return an array of at most one key. Sometimes, it may return more than one key if there are multiple keys
		 * with equivalent distance to the center of the bounds object.
		 * 
		 * @param bounds A bounds used to query the spatial index. It will be modified by constraining it to within the dataBounds.
		 * @param xPrecision If specified, X distance values will be divided by this and truncated before comparing.
		 * @param yPrecision If specified, Y distance values will be divided by this and truncated before comparing.
		 * @return An array of IQualifiedKey objects. 
		 */		
		public getClosestOverlappingKeys(queryBounds:IBounds2D, xPrecision:number, yPrecision:number, dataBounds:IBounds2D):Array
		{
			var xQueryCenter:number = queryBounds.getXCenter();
			var yQueryCenter:number = queryBounds.getYCenter();
			dataBounds.constrainBounds(queryBounds, false);
			var importance:number = xPrecision * yPrecision;
			var keys:Array = getKeysGeometryOverlap(queryBounds, importance, false, dataBounds);
			
			// init local vars
			var closestDistanceSq:number = Infinity;
			var xDistance:number;
			var yDistance:number;
			var distanceSq:number;
			var xRecordCenter:number;
			var yRecordCenter:number;
			var recordBounds:IBounds2D;
			var foundQueryCenterOverlap:boolean = false; // true when we found a key that overlaps the center of the given bounds
			var tempDistance:number;
			// begin with a result of zero shapes
			var result:Array = [];
			var resultCount:int = 0;
			for (var iKey:int = 0; iKey < keys.length; ++iKey)
			{
				var key:IQualifiedKey = keys[iKey];
				var overlapsQueryCenter:boolean = false;
				var geoms:Array = null;
				if (_keyToGeometriesMap && Weave.properties.enableGeometryProbing.value)
					geoms = _keyToGeometriesMap[key] as Array; // may be null if async task hasn't completed
				
				if (geoms) // the plotter is an IPlotterWithGeometries and the user wants geometry probing
				{
					for (var iGeom:int = 0; iGeom < geoms.length; ++iGeom)
					{
						var geom:Object = geoms[iGeom];
						xDistance = geom.bounds.getXCenter() - xQueryCenter;
						yDistance = geom.bounds.getYCenter() - yQueryCenter;
						if (!isNaN(xPrecision) && xPrecision != 0)
							xDistance = int(xDistance / xPrecision);
						if (!isNaN(yPrecision) && yPrecision != 0)
							yDistance = int(yDistance / yPrecision);
						var geomDistance:number = xDistance * xDistance + yDistance * yDistance; 
						
						if (geom is GeneralizedGeometry)
						{
							var genGeom:GeneralizedGeometry = geom as GeneralizedGeometry;
							var genGeomIsPoly:boolean = genGeom.isPolygon();
							var genGeomIsLine:boolean = genGeom.isLine();
							var genGeomIsPoint:boolean = genGeom.isPoint();
							var genGeomBounds:IBounds2D = genGeom.bounds;
							var simplifiedGeom:Vector.<Vector.<BLGNode>> = (geom as GeneralizedGeometry).getSimplifiedGeometry(importance, dataBounds);
							var overlapCount:int = 0;
							
							for each (var part:Vector.<BLGNode> in simplifiedGeom)
							{
								if (genGeomIsPoly)
								{
									distanceSq = geomDistance;
									// if the polygon contains the point, this key is probably what we want
									if (GeometryUtils.polygonOverlapsPoint(part, xQueryCenter, yQueryCenter))
										overlapCount++;
								}
								else if (genGeomIsLine)
								{
									distanceSq = getMinimumUnscaledDistanceFromPolyLine(part, xQueryCenter, yQueryCenter);
									if (distanceSq <= Number.MIN_VALUE)
									{
										overlapsQueryCenter = true;
										break;
									}
								}
								else if (genGeomIsPoint)
								{
									distanceSq = getMinimumUnscaledDistanceFromPolyPoint(part, xQueryCenter, yQueryCenter);
									// give points priority since it's unlikely they will be exactly at the center of the query bounds
									overlapsQueryCenter = true;
									break;
								}
							}
							if (overlapCount % 2)
							{
								distanceSq = 0;
								overlapsQueryCenter = true;
							}
							
							// Consider all keys until we have found one that overlaps the query center.
							// Consider lines and points because although they may not overlap, it's very likely that no points or lines
							// will overlap. If we consider all of them, we can still find the closest.
							// After that, only consider keys that overlap query center.
							if (!foundQueryCenterOverlap || overlapsQueryCenter || genGeomIsLine || genGeomIsPoint)
							{
								// if this is the first record that overlaps the query center, reset the list of keys
								if (!foundQueryCenterOverlap && overlapsQueryCenter)
								{
									resultCount = 0;
									closestDistanceSq = Infinity;
									foundQueryCenterOverlap = true;
								}
								// if this distance is closer than any previous distance, clear all previous keys
								if (distanceSq < closestDistanceSq)
								{
									// clear previous result and update closest distance
									resultCount = 0;
									closestDistanceSq = distanceSq;
								}
								// add keys to the result if they are the closest so far
								if (distanceSq == closestDistanceSq && (resultCount == 0 || result[resultCount - 1] != key))
									result[resultCount++] = key;
							}
						}
						else  
						{
							var simpleGeom:ISimpleGeometry = geom as ISimpleGeometry;
							var simpleGeomIsPoly:boolean = simpleGeom.isPolygon();
							var simpleGeomIsLine:boolean = simpleGeom.isLine();
							var simpleGeomIsPoint:boolean = simpleGeom.isPoint();
							var vertices:Array = simpleGeom.getVertices();
							
							// calculate the distanceSq and overlapsQueryCenter
							if (simpleGeomIsPoly)
							{
								if (GeometryUtils.polygonOverlapsPoint(vertices, xQueryCenter, yQueryCenter))
								{
									distanceSq = 0;
									overlapsQueryCenter = true;
								}
								else 
								{
									distanceSq = geomDistance;
									overlapsQueryCenter = false;
								}
							}
							else if (simpleGeomIsLine)
							{
								distanceSq = getMinimumUnscaledDistanceFromPolyLine(vertices, xQueryCenter, yQueryCenter);
								if (distanceSq <= Number.MIN_VALUE)
									overlapsQueryCenter = true;
								else
									overlapsQueryCenter = false;
							}
							else if (simpleGeomIsPoint)
							{
								distanceSq = getMinimumUnscaledDistanceFromPolyPoint(vertices, xQueryCenter, yQueryCenter);
								// give points priority since it's unlikely they will be exactly at the center of the query bounds
								overlapsQueryCenter = true;
							}
							
							// Consider all keys until we have found one that overlaps the query center.
							// Consider lines and points because although they may not overlap, it's very likely that no points or lines
							// will overlap. If we consider all of them, we can still find the closest.
							// After that, only consider keys that overlap query center.
							if (!foundQueryCenterOverlap || overlapsQueryCenter || simpleGeomIsLine || simpleGeomIsPoint)
							{
								// if this is the first record that overlaps the query center, reset the list of keys
								if (!foundQueryCenterOverlap && overlapsQueryCenter)
								{
									resultCount = 0;
									closestDistanceSq = Infinity;
									foundQueryCenterOverlap = true;
								}
								// if this distance is closer than any previous distance, clear all previous keys
								if (distanceSq < closestDistanceSq)
								{
									// clear previous result and update closest distance
									resultCount = 0;
									closestDistanceSq = distanceSq;
								}
								// add keys to the result if they are the closest so far
								if (distanceSq == closestDistanceSq && (resultCount == 0 || result[resultCount - 1] != key))
									result[resultCount++] = key;
							}
						}
					} // geomLoop
				}
				else // if the plotter wasn't an IPlotterWithGeometries or if the user wants the old probing
				{
					for each (recordBounds in _keyToBoundsMap[key])
					{
						// find the distance squared from the query point to the center of the shape
						xDistance = recordBounds.getXCenter() - xQueryCenter;
						yDistance = recordBounds.getYCenter() - yQueryCenter;
						if (!isNaN(xPrecision) && xPrecision != 0)
							xDistance = int(xDistance / xPrecision);
						if (!isNaN(yPrecision) && yPrecision != 0)
							yDistance = int(yDistance / yPrecision);
						distanceSq = xDistance * xDistance + yDistance * yDistance;
						
						overlapsQueryCenter = recordBounds.contains(xQueryCenter, yQueryCenter);
						
						// Consider all keys until we have found one that overlaps the query center.
						// After that, only consider keys that overlap query center.
						if (!foundQueryCenterOverlap || overlapsQueryCenter || recordBounds.isEmpty())
						{
							// if this is the first record that overlaps the query center, reset the list of keys
							if (!foundQueryCenterOverlap && overlapsQueryCenter)
							{
								resultCount = 0;
								closestDistanceSq = Infinity;
								foundQueryCenterOverlap = true;
							}
							// if this distance is closer than any previous distance, clear all previous keys
							if (distanceSq < closestDistanceSq)
							{
								// clear previous result and update closest distance
								resultCount = 0;
								closestDistanceSq = distanceSq;
							}
							// add keys to the result if they are the closest so far
							if (distanceSq == closestDistanceSq && (resultCount == 0 || result[resultCount - 1] != key))
								result[resultCount++] = key;
						}
					}
				} // if else
			} // keyLoop
			
			result.length = resultCount;
			return result;
		}

		/**
		 * This function will get the keys whose geometries intersect with the given array of geometries.
		 * This function call getKeysOverlapGeometry below for each element in the array.
		 * @param geometries an Array of ISimpleGeometry objects used to query the spatial index.
		 * @param minImportance The minimum importance value to use when determining geometry overlap.
		 * @param filterBoundingBoxesByImportance If true, bounding boxes will be pre-filtered by importance before checking geometry overlap.
		 * @return An array of IQualifiedKey objects.
		 **/		
	

		public getKeysGeometryOverlapGeometries(geometries:Array, minImportance:number = 0, filterBoundingBoxesByImportance:boolean = false):Array
		{
			var queriedKeys:Array = [];
			var keys:Dictionary = new Dictionary();

			for each ( var geometry:ISimpleGeometry in geometries )
			{
				queriedKeys = getKeysGeometryOverlapGeometry(geometry, minImportance, filterBoundingBoxesByImportance);					
				
				for each (var key:IQualifiedKey in queriedKeys)
				{
					keys[key] = true;
				}
			}
		
			var result:Array = [];
			for (var keyObj:* in keys)
				result.push(keyObj as IQualifiedKey);
			
			return result;
		}
		
		/**
		 * This function will get the keys whose geometries intersect with the given geometry.
		 * 
		 * @param geometry An ISimpleGeometry object used to query the spatial index.
		 * @param minImportance The minimum importance value to use when determining geometry overlap.
		 * @param filterBoundingBoxesByImportance If true, bounding boxes will be pre-filtered by importance before checking geometry overlap.
		 * @return An array of IQualifiedKey objects.
		 */
		public getKeysGeometryOverlapGeometry(geometry:ISimpleGeometry, minImportance:number = 0, filterBoundingBoxesByImportance:boolean = false):Array
		{
			// first filter by bounds
			var point:Object;
			var queryGeomVertices:Array = geometry.getVertices();
			var keys:Array = getKeysBoundingBoxOverlap((geometry as SimpleGeometry).bounds, filterBoundingBoxesByImportance ? minImportance : 0);
			
			var geomEnabled:boolean = _keyToGeometriesMap && Weave.properties.enableGeometryProbing.value;
			
			var result:Array = [];
			var test:uint;
			
			// for each key, look up its geometries 
			keyLoop: for (var i:int = keys.length; i--;)
			{
				var key:IQualifiedKey = keys[i];
				var overlapCount:int = 0;
				
				var geoms:Array = geomEnabled ? _keyToGeometriesMap[key] : null;
				if (!geoms || geoms.length == 0)
				{
					var keyBounds:Array = _keyToBoundsMap[key];
					for (var j:int = 0; j < keyBounds.length; j++)
					{
						setTempBounds(keyBounds[j]);
						test = GeometryUtils.polygonOverlapsPolygon(queryGeomVertices,_tempBoundsPolygon);
						if (test == GeometryUtils.CONTAINED_IN)
						{
							overlapCount++;
						}
						else if (test != GeometryUtils.NO_OVERLAP)
						{
							result.push(key);
							continue keyLoop;
						}
					}
					if (overlapCount % 2)
						result.push(key);
					//iterate over bounds from key and check if they intersect lasso polygon
					continue;
				}
				
				// for each geometry, get vertices, check type, and do proper geometric overlap
				for (var iGeom:int = 0; iGeom < geoms.length; ++iGeom)
				{
					var geom:Object = geoms[iGeom];
					
					if (geom is GeneralizedGeometry)
					{
						var genGeom:GeneralizedGeometry = geom as GeneralizedGeometry;
						var genGeomIsPoly:boolean = genGeom.isPolygon();
						var genGeomIsLine:boolean = genGeom.isLine();
						var genGeomIsPoint:boolean = genGeom.isPoint();
						var simplifiedGeom:Vector.<Vector.<BLGNode>> = genGeom.getSimplifiedGeometry(minImportance/*, dataBounds*/);
						
						if (simplifiedGeom.length == 0)
						{
							//make the polygon
							setTempBounds((geom as GeneralizedGeometry).bounds);
							//check if the lasso polygon overlaps the geometry bounds
							if (GeometryUtils.polygonOverlapsPolygon(queryGeomVertices, _tempBoundsPolygon))
							{
								result.push(key);
								continue keyLoop;
							}
						}
						
						// for each part, build the vertices polygon and check for the overlap
						for (var iPart:int = 0; iPart < simplifiedGeom.length; ++iPart)
						{
							// get the part
							var part:Vector.<BLGNode> = simplifiedGeom[iPart];
							if (part.length == 0) // if no points, continue
								continue;
							
							// if a polygon, check for polygon overlap
							if (genGeomIsPoly)
							{
								test = GeometryUtils.polygonOverlapsPolygon(queryGeomVertices, part);
								if (test == GeometryUtils.CONTAINED_IN)
								{
									overlapCount++;
								}
								else if (test != GeometryUtils.NO_OVERLAP)
								{
									result.push(key);
									continue keyLoop;
								}
							}
							else if (genGeomIsLine)
							{
								if (polygonOverlapsPolyLine(queryGeomVertices, part))
								{
									result.push(key);
									continue keyLoop;
								}
							}
							else // point
							{
								if (polygonOverlapsPolyPoint(queryGeomVertices, part))
								{
									result.push(key);
									continue keyLoop;
								}
							}
						}
					}
					else // NOT a generalized geometry
					{
						var simpleGeom:ISimpleGeometry = geom as ISimpleGeometry;
						var simpleGeomIsPoly:boolean = simpleGeom.isPolygon();
						var simpleGeomIsLine:boolean = simpleGeom.isLine();
						var simpleGeomIsPoint:boolean = simpleGeom.isPoint();
						// get its vertices
						var vertices:Array = simpleGeom.getVertices();
						
						if (simpleGeomIsPoly)// a polygon, check for polygon overlap
						{
							if (GeometryUtils.polygonOverlapsPolygon(queryGeomVertices, vertices))
							{
								result.push(key);
								continue keyLoop;
							}
						}
						else if (simpleGeomIsLine) // if a line, check for bounds intersect line
						{
							if (polygonOverlapsPolyLine(queryGeomVertices, vertices))
							{
								result.push(key);
								continue keyLoop;
							}
						}
						else
						{
							if (polygonOverlapsPolyPoint(queryGeomVertices, vertices))
							{
								result.push(key);
								continue keyLoop;
							}
						}
					}
					if (overlapCount % 2)
					{
						result.push(key);
						continue keyLoop;
					}
				} // end for each (var geom...
			} // end for each (var key...
			
			return result; 
		}
	}
}