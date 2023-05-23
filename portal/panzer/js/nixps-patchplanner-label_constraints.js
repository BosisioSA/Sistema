/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, nixps, namespace, _ */

(function() {
	
	namespace("nixps.patchplanner");


	nixps.patchplanner.interval = function(pA, pB, pValue) {
		if ((typeof pA !== "number") || (typeof pB !== "number")) {
			throw new Error("invalid parameter");
		}

		this.mA = pA;
		this.mB = pB;
		this.mValue = pValue;
	};

	nixps.patchplanner.interval.prototype = {

		contains: function(pValue) {
			if (typeof pValue !== "number") {
				throw new Error("invalid parameter");
			}

			return ((pValue > (this.mA + 1)) && (pValue < (this.mB - 1)));
		},

		intersects: function(pMin, pMax) {
			if ((typeof pMin !== "number") || (typeof pMax !== "number")) {
				throw new Error('invalid parameter');
			}

			return (pMax > (this.mA + 1)) && (pMin < (this.mB - 1)); 
		},

		getValue: function() {
			return this.mValue;
		}

	};


	/**
	 * @brief Calculates the label constraints for the label, provided a jQuery object
	 *		  containing the label and a gutter object which contains the gutters around
	 *	      the label.  
	 */
	nixps.patchplanner.label_constraints = function(pLabelSelector, pGutter) {
		this.mLabelSelector = pLabelSelector;
		this.mXRanges = [];
		this.mYRanges = [];
		this.mGutter = 72;

		if ((typeof pGutter === "number") && (pGutter >= 0)) {
			this.mGutter = pGutter;
		}
	};


	nixps.patchplanner.label_constraints.prototype = {

		process: function() {
			var gutter = this.mGutter;

			this.mXRanges = this.mLabelSelector.map(function(pIndex, pValue) {
				var element = $(pValue);
				var boundary = element.editor_label("getBoundaryInPT");
				return new nixps.patchplanner.interval(boundary.left - gutter, boundary.left + boundary.width + gutter, pValue);
			}).toArray();

			this.mYRanges = this.mLabelSelector.map(function(pIndex, pValue) {
				var element = $(pValue);
				var boundary = element.editor_label("getBoundaryInPT");
				return new nixps.patchplanner.interval(boundary.top - gutter, boundary.top + boundary.height + gutter, pValue);
			}).toArray();
		},


		/**
		 * @brief returns all the elements with which that rectangle intersects
		 */
		checkConstraints: function(pRectangle) {
			var boundary = pRectangle.editor_label("getBoundaryInPT"),
				gutter = this.mGutter;

			var minX = boundary.left - gutter;
			var maxX = boundary.left + boundary.width + gutter;
			var minY = boundary.top - gutter;
			var maxY = boundary.top + boundary.height + gutter;


			// var minX = boundary.left;
			// var maxX = boundary.left + boundary.width;
			// var minY = boundary.top;
			// var maxY = boundary.top + boundary.height;


			var toValue = function(pRange) {
				return pRange.getValue();
			};

			var intersects = function(pMin, pMax, pRange) {
				return pRange.intersects(pMin, pMax);
			};

			var getLeft = function(pValue) {
				var boundary = $(pValue).editor_label("getBoundaryInPT");
				return boundary.left;
			};

			var getTop = function(pValue) {
				var boundary = $(pValue).editor_label("getBoundaryInPT");
				return boundary.top;
			};

			var getRight = function(pValue) {
				var boundary = $(pValue).editor_label("getBoundaryInPT");
				return boundary.left + boundary.width;
			};

			var getBottom = function(pValue) {
				var boundary = $(pValue).editor_label("getBoundaryInPT");
				return boundary.top + boundary.height;
			};

			var isLeftOf = function(pX, pRect) {
				var boundary = $(pRect).editor_label("getBoundaryInPT");
				return pX >= (boundary.left + boundary.width);
			};

			var isRightOf = function(pX, pRect) {
				var boundary = $(pRect).editor_label("getBoundaryInPT");
				return pX <= boundary.left;
			};

			var isAbove = function(pY, pRect) {
				var boundary = $(pRect).editor_label("getBoundaryInPT");
				return pY >= (boundary.top + boundary.height);
			};

			var isUnder = function(pY, pRect) {
				var boundary = $(pRect).editor_label("getBoundaryInPT");
				return pY <= boundary.top;
			};


			var intersectX = _.map(_.filter(this.mXRanges, _.partial(intersects, minX, maxX)), toValue);
			var intersectY = _.map(_.filter(this.mYRanges, _.partial(intersects, minY, maxY)), toValue);

			var left = _.max(_.map(_.filter(intersectY, _.partial(isLeftOf, minX + 2)),getRight));
			var right = _.min(_.map(_.filter(intersectY, _.partial(isRightOf, maxX - 2)),getLeft));
			var top = _.max(_.map(_.filter(intersectX, _.partial(isAbove, minY + 2)),getBottom));
			var bottom = _.min(_.map(_.filter(intersectX, _.partial(isUnder, maxY - 2)),getTop));

			return {
				left: left,
				right: right,
				top: top,
				bottom: bottom
			};
		}

	};

})();