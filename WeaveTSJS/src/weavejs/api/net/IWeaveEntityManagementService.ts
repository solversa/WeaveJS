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

namespace weavejs.api.net
{
	import EntityMetadata = weavejs.api.net.beans.EntityMetadata;
	import WeavePromise = weavejs.util.WeavePromise;
	import IWeaveEntityService = weavejs.api.net.IWeaveEntityService;
	
	/**
	 * Interface for a service which provides RPC functions for retrieving and manipulating Weave Entity information.
	 * @author adufilie
	 */
	@Weave.classInfo({id: "weavejs.api.net.IWeaveEntityManagementService"})
	export class IWeaveEntityManagementService extends IWeaveEntityService
	{
		/**
		 * Creates a new entity.
		 * @param metadata Metadata for the new entity.
		 * @param parentId The parent entity ID, or -1 for no parent.
		 * @param insertAtIndex Specifies insertion index for sort order.
		 * @return RPC token for an entity ID.
		 */
		 newEntity:(metadata:EntityMetadata, parentId:int, insertAtIndex:int)=>WeavePromise<number>;
		
		/**
		 * Updates the metadata for an existing entity.
		 * @param entityId An entity ID.
		 * @param diff Specifies the changes to make to the metadata.
		 * @return RPC token.
		 */
		updateEntity:(entityId:int, diff:EntityMetadata)=>WeavePromise<void>;
		
		/**
		 * Removes entities and their children recursively.
		 * @param entityIds A list of entity IDs to remove.
		 * @return RPC token for an Array of entity IDs that were removed.
		 */
		removeEntities:(entityIds:number[])=>WeavePromise<number[]>;
		
		/**
		 * Adds a parent-child relationship to the server-side entity hierarchy table.
		 * @param parentId The ID of the parent entity.
		 * @param childId The ID of the child entity.
		 * @param insertAtIndex Specifies insertion index for sort order.
		 * @return RPC token for an Array of entity IDs whose relationships have changed as a result of adding the parent-child relationship.
		 */
		addChild:(parentId:number, childId:number, insertAtIndex:number)=>WeavePromise<number[]>;
		
		/**
		 * Removes a parent-child relationship from the server-side entity hierarchy table.
		 * @param parentId The ID of the parent entity.
		 * @param childId The ID of the child entity.
		 * @return RPC token.
		 */
		removeChild:(parentId:number, childId:number)=>WeavePromise<void>;
	}
}
