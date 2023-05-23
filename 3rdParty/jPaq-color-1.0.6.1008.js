/**@preserve jPaq - A fully customizable JavaScript/JScript library
 * http://jpaq.org/
 *
 * Copyright (c) 2011 Christopher West
 * Licensed under the MIT license.
 * http://jpaq.org/license/
 *
 * Version: 1.0.6.1008
 * Revised: April 6, 2011
 */
(function() {
// The object used to retrieve private data.
var jPaqKey = {};
// The function responsible for making private data accessible to internal
// functions.
function _(obj, privateData) {
	obj._ = function(aKey) {
		if(jPaqKey === aKey)
			return privateData;
	};
}
jPaq = {
	toString : function() {
		/// <summary>
		///   Get a brief description of this library.
		/// </summary>
		/// <returns type="String">
		///   Returns a brief description of this library.
		/// </returns>
		return "jPaq - A fully customizable JavaScript/JScript library created by Christopher West.";
	}
};
// A class to represent a color.
(Color = function(rValue, gValue, bValue) {
	/// <summary>Creates mutable 24-bit color object.</summary>
	/// <param name="rValue" type="Object" optional="true">
	///   Optional.  This may either be a number or a string.  If this is a string
	///   it must be a three or six digit hexadecimal code, or a CSS
	///   representation of a RGB parameters.  If this is a string and the
	///   "gValue" or "bValue" parameters are set, this parameter will default to
	///   0.  If this is a number, it must be an integer representing how much red
	///   will be in the color.  If this is a number, it must be greater than or
	///   equal to zero and less than or equal to 255.  Otherwise, this value will
	///   default to 0.
	/// </param>
	/// <param name="gValue" type="Number" optional="true">
	///   Optional.  The amount of green that will compose the color.  This value
	///   must be an integer greater than or equal to 0 and less than or equal to
	///   255.  If omitted, this value will be inferred from the "rValue".
	///   value.
	/// </param>
	/// <param name="bValue" type="Number" optional="true">
	///   Optional.  The amount of blue that will compose the color.  This value
	///   must be an integer greater than or equal to 0 and less than or equal to
	///   255.  If omitted, this value will be inferred from "rValue".
	/// </param>
	// Initialize the color.
	_(this, {r : 0, g : 0, b : 0});
	this.setTo.apply(this, arguments);
}).prototype = {
	setTo : function(rValue, gValue, bValue) {
		/// <summary>Creates mutable 24-bit color object.</summary>
		/// <param name="rValue" type="Object" optional="true">
		///   Optional.  This may either be a number or a string.  If this is a
		///   string, it must be a three or six digit hexadecimal code, or a CSS
		///   representation of a RGB parameters.  If this is a string and the
		///   "gValue" or "bValue" parameters are set, this parameter will default
		///   to 0. If this is a number, it must be an integer representing how much
		///   red will be in the color.  If this is a number, it must be greater
		///   than or equal to zero and less than or equal to 255.  Otherwise, this
		///   value will default to 0.
		/// </param>
		/// <param name="gValue" type="Number" optional="true">
		///   Optional.  The amount of green that will compose the color.  This
		///   value must be an integer greater than or equal to 0 and less than or
		///   equal to 255.  If omitted, this value will be inferred from "rValue".
		/// </param>
		/// <param name="bValue" type="Number" optional="true">
		///   Optional.  The amount of blue that will compose the color.  This value
		///   must be an integer greater than or equal to 0 and less than or equal
		///   to 255.  If omitted, this value will be inferred from "rValue".
		/// </param>
		var me = this;
		if(arguments.length == 1) {
			var m = /^#?(([\dA-F]{3}){1,2})$/i.exec(rValue + "");
			if(m) {
				var hexCode = m[1];
				if(hexCode.length == 3)
					hexCode = hexCode.replace(/(.)/g, "$1$1");
				me.r(parseInt(hexCode.substring(0, 2), 16))
					.g(parseInt(hexCode.substring(2, 4), 16))
					.b(parseInt(hexCode.substring(4, 6), 16));
			}
			else if(m = /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(rValue + ""))
				me.r(m[1]).g(m[2]).b(m[3]);
			else
				me.r(rValue);
		}
		else
			me.r(rValue).g(gValue).b(bValue);
		return me;
	},
	getHexCode : function() {
		/// <summary>
		///   Gives the six digit hexadecimal code for the color that this object
		///   represents.
		/// </summary>
		/// <returns type="String">
		///   Returns the six digit hexadecimal code for the color that this object
		///   represents.  This string will start with the "#" characters.
		/// </returns>
		return "#" + [
			this.r().toString(16),
			this.g().toString(16),
			this.b().toString(16)
		].join(",").replace(/\b(\w)\b/gi, "0$1").toUpperCase().replace(/,/g, "");
	},
	combine : function(secondColor, strength) {
		/// <summary>Merges this color the the specified color.</summary>
		/// <param name="secondColor" type="Color">
		///   The color that will be merged or combined with this one.
		/// </param>
		/// <param name="strength" type="Number" optional="true">
		///   Optional.  A number inclusively ranging from 0 to 100 which represents
		///   how much of "secondColor" will appear in the new color.  If this is
		///   omitted, this will default to 50.
		/// </param>
		/// <returns type="Color">
		///   Returns a new color object which represents the merging of this color
		///   with "secondColor".
		/// </returns>
		if(isNaN(strength = +strength))
			strength = 50;
		var percent2 = Math.max(Math.min(strength, 100), 0) / 100;
		var percent1 = 1 - percent2;
		return new Color((this.r() * percent1 + secondColor.r() * percent2),
			this.g() * percent1 + secondColor.g() * percent2,
			this.b() * percent1 + secondColor.b() * percent2);
	},
	// Returns a color that can be displayed well on the specified color.
	getSafeColor : function() {
		/// <summary>
		///   Produces a new color object representing black or white.  If this
		///   color is closer to white, black will be returned.  If this color is
		///   closer to black, white will be returned.
		/// </summary>
		/// <returns type="Color">
		///   Returns a new color object which represents black or white.
		/// </returns>
		var i = this.getLuminance() < 128 ? 255 : 0;
		return new Color(i, i, i);
	},
	getLuminance : function() {
		/// <summary>Gets the luminance of the color.</summary>
		/// <returns type="Number">
		///   Returns a number inclusively ranging from 0 to 255 which represents
		///   the luminance of the color.
		/// </returns>
		with(this){return .299 * r() + .587 * g() + .114 * b();}
	},
	// Gets an approximation of the grayscale version of the color.
	toGrayscale : function() {
		/// <summary>
		///   Gets an approximation of the grayscale version of the color.
		/// </summary>
		/// <returns type="Color">
		///   Returns an approximation of the grayscale version of this color as a
		///   new color object.
		/// </returns>
		var i = Math.round(this.getLuminance());
		return new Color(i, i, i);
	},
	// Gets the opposite color.
	getOpposite : function() {
		/// <summary>Gets the opposite color.</summary>
		/// <returns type="Color">
		///   Returns a new color object that represents the opposite of this color.
		/// </returns>
		with(this){return new Color(255 - r(), 255 - g(), 255 - b());}
	},
	// Gives the user the ability to get a lighter version of a color.
	getLighter : function(strength) {
		/// <summary>
		///   Gets a lighter version of this color by mixing it with white.
		/// </summary>
		/// <param name="strength" type="Number" optional="true">
		///   Optional.  A number inclusively ranging from 0 to 100 which represents
		///   how much white will appear in the new color.  If this is omitted, this
		///   will default to 30.
		/// </param>
		/// <returns type="Color">
		///   Returns a lighter version of this color as a new color object.
		/// </returns>
		return this.combine(white, strength != null ? strength >>> 0 : 30);
	},
	// Gives the user the ability to get a darker version of a color.
	getDarker : function(strength) {
		/// <summary>
		///   Gets a darker version of this color by mixing it with white.
		/// </summary>
		/// <param name="strength" type="Number" optional="true">
		///   Optional.  A number inclusively ranging from 0 to 100 which represents
		///   how much black will appear in the new color.  If this is omitted, this
		///   will default to 30.
		/// </param>
		/// <returns type="Color">
		///   Returns a darker version of this color as a new color object.
		/// </returns>
		return this.combine(black, strength != null ? strength >>> 0 : 30);
	}
};
// Create the jQuery-like getter/setter functions for the RGB values.
for(var arr = ["r","g","b"], i = 0; i < 3; i++) {
	(function(name) {
		Color.prototype[name] = function(value) {
			var privateData = this._(jPaqKey);
			if(!arguments.length)
				return privateData[name];
			privateData[name] = Math.min(Math.max(value >>> 0, 0), 255);
			return this;
		};
	})(arr[i]);
}
// Shortcuts for black and white.
var black = new Color(), white = new Color(255, 255, 255);
// Gives the user the ability to see the color in the form of a string.
// This is an alias for getHexCode().
Color.prototype.toString = Color.prototype.getHexCode;
Color.random = function(r, g, b) {
	/// <summary>
	///   Produces a random color based on the specified criteria.  Each of the
	///   parameters may be a number or an array of numbers.  To specify a
	///   specific value, the numeric value must be in an array by itself.  To
	///   specify a range, the values must be given in an array where the first
	///   element is the minimum value and the second element is the maximum
	///   value.  To produce an independently random value, 0 or null should be
	///   specified.  To produce a random value that must be greater than one or
	///   both of the other two non-zero parameters, you must enter a larger
	///   number.  To produce a random value that is smaller than one or both of
	///   the other two non-zero parameters, you must enter a smaller number.
	/// </summary>
	/// <param name="r" type="Object" optional="true">
	///   Optional.  Used to specify the amount of red that may appear in the
	///   color.
	/// </param>
	/// <param name="g" type="Object" optional="true">
	///   Optional.  Used to specify the amount of green that may appear in the
	///   color.
	/// </param>
	/// <param name="b" type="Object" optional="true">
	///   Optional.  Used to specify the amount of blue that may appear in the
	///   color.
	/// </param>
	/// <returns type="Color">
	///   A color object based on the specified parameters.
	/// </returns>
	for(var c = [[r || 0, 0], [g || 0, 1], [b || 0, 2]].sort(function(a, b) {
		return a[0] <= b[0] ? a[0] < b[0] ? -1 : 0 : 1;
	}), ret = [], lastIndex, lastVal, i = 0; i < 3; i++) {
		if(c[i][0] instanceof Array)
			ret[c[i][1]] = c[i][0].length == 1
				? c[i][0][0]
				: Math.randomIn.apply(null, c[i][0]);
		else {
			if(c[i][0] != lastIndex || lastIndex == 0)
				lastVal = Math.round(Math.randomIn(lastIndex > 0 ? lastVal : 0, 255));
			lastIndex = c[i][0];
			ret[c[i][1]] = lastVal;
		}
	}
	return new Color(ret[0], ret[1], ret[2]);
};
Math.randomIn = function(min, max) {
	/// <summary>Generates a random number.</summary>
	/// <param name="min" type="Number" optional="true">
	///   Optional.  The minimum number that can be returned.  The default value
	///   is zero.
	/// </param>
	/// <param name="max" type="Number" optional="true">
	///   Optional.  The returned random number will always be less than this
	///   number.  The default value is one.
	/// </param>
	/// <returns type="Number">
	///   Returns a number that is greater than or equal to "min" and less than
	///   "max".
	/// </returns>
	min = min == null ? 0 : min;
	return Math.random() * ((max == null ? 1 : max) - min) + min;
};
})();