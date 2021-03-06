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

namespace weavejs.api.data
{
	/**
	 * A primitive attribute column is one defined by primitive data and has both numeric and string
	 * representations of its data values.
	 */
	@Weave.classInfo({id: "weavejs.api.data.IPrimitiveColumn"})
	export class IPrimitiveColumn extends IAttributeColumn
	{
		/**
		 * Derives a String from a Number using this column's conversion method.
		 * @param number The numeric value to convert to a String.
		 * @return The String representation of the given number using this column's conversion method.
		 */
		deriveStringFromNumber:(value:number)=>string;
	}
}
