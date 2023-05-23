/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, namespace, nixps */
/*global jQuery */

(function() {

	namespace('nixps.patchplanner');

	nixps.patchplanner.orientation = {
		horizontal: 'horizontal',
		vertical: 'vertical'
	};

}());


(function( $ ) {

	$.widget("nixps-patchplanner.editor_ruler", {

		options: {
			/**
			 * @brief the orientation of the ruler
			 */
			orientation: nixps.patchplanner.orientation.horizontal,

			/**
			 * @brief the zoom level of the ruler
			 */
			zoom: 1.0,

			/**
			 * @brief the origin of the ruler in pixels
			 */
			origin: 0.0,

			/**
			 * @brief the name of the unit
			 */
			unit: (new nixps.cloudflow.UnitPreferences()).getDefinition('length')

		},


		/**
		 * @brief creates the element
		 */
		_create: function() {
			if (this.options.orientation === nixps.patchplanner.orientation.horizontal) {
				this.element.addClass('horizontalruler');
			}
			else {
				this.element.addClass('verticalruler');
			}

			var canvas = $('<canvas>');
			canvas.appendTo(this.element);

			this._draw();
		},


		/** 
		 * @brief shows cursors at given positions
		 */
		setCursor: function(pPositionA, pPositionB) {
			if (arguments.length === 1) {
				pPositionB = pPositionA;
			}

			var cursor = this.element.find('.cursor');
			if (cursor.length === 0) {
				cursor = $("<div>");
				cursor.css('position', 'absolute');
				cursor.addClass('rangecursor');
				cursor.addClass('cursor');
				cursor.appendTo(this.element);
			}
			cursor.show();

			if (this.options.orientation === nixps.patchplanner.orientation.vertical)
			{
				cursor.css('top', pPositionA + this.options.origin);
				cursor.css('height', pPositionB - pPositionA);
			}
			else
			{
				cursor.css('left', pPositionA - 1 + this.options.origin);
				cursor.css('width', pPositionB - pPositionA);
			}
		},


		/**
		 * @brief redraws the ruler
		 */
		redraw: function() {
			this._draw();
		},


		/**
		 * @brief draw function of the ruler
		 */
		_draw: function() {
			var zoom = this.options.zoom;
			var pt_unit = new nixps.cloudflow.Unit({ unit: 'pt' });
			var unit = new nixps.cloudflow.Unit({ unit: 'cm'});
			if (this.options.unit.isImperial() === true) {
				unit = new nixps.cloudflow.Unit({ unit: 'in' });
			}

			// The width and height of the ruler
			var width = this.element.width();
			var height = this.element.height();

			// Update canvas size
			var canvas = this.element.find('canvas');
			canvas.attr('width', width);
			canvas.attr('height', height);

			// Colors
			var background_color = this.element.css('background-color');
			if (! background_color) {
				background_color = '#ebebeb';
			}

			var draw_color = this.element.css('color');
			if (! draw_color) {
				draw_color = '#000';
			}
			
			// Return if we cannot get a drawing context
			if (! canvas[0].getContext) {
				return;
			}

			// Draw
			var ctx = canvas[0].getContext('2d');
			ctx.save();

			if (this.options.orientation === nixps.patchplanner.orientation.vertical) {
				ctx.scale(1, -1);
				ctx.rotate(-Math.PI/2);
				var temp = width;
				width = height;
				height = temp;
			}
			else {
				ctx.scale(1, 1);
			}

			ctx.fillStyle = background_color;
			ctx.fillRect(0, 0, width, height); 

			ctx.strokeStyle = draw_color;
			ctx.beginPath();
			ctx.moveTo(0, height - 0.5);
			ctx.lineTo(width, height - 0.5);
			ctx.closePath();
			ctx.stroke();

			ctx.lineWidth = 1;
			ctx.fillStyle = draw_color;

			var index = - Math.ceil(pt_unit.convert(this.options.origin / zoom, unit) * 10);
			var curx = this.options.origin + unit.convert(index / 10, pt_unit) * zoom;
			var rcurx = 0;
			var step = unit.convert(0.1, pt_unit) * zoom;

			var mindistance_ones = 25;
			var mindistance_halves = mindistance_ones / 2.0;
			var mindistance_tenths = mindistance_ones / 10.0;

			var showtenths = step > mindistance_tenths;
			var showhalves = (step * 5.0) > mindistance_halves;
			var showonesevery = 10;

			while (showonesevery * step < mindistance_ones) {
				showonesevery = showonesevery * 2;
			}

			while (curx < width) {
				curx = this.options.origin + unit.convert(index / 10.0, pt_unit) * zoom;
				rcurx = Math.floor(curx) + 0.5;

				ctx.beginPath();
				if ((index % showonesevery) === 0) {
					// big one
					ctx.moveTo(rcurx, 0);
					ctx.lineTo(rcurx, height);

					ctx.save();
					if (this.options.orientation === nixps.patchplanner.orientation.vertical) {
						var text_width = ctx.measureText((index / 10).toString()).width;
						ctx.translate(rcurx + text_width + 1, height - 10 - 1);
						ctx.scale(1,-1);
						ctx.rotate(Math.PI);
					}
					else
					{
						ctx.translate(rcurx + 1, height - 10 - 1);
					}
					
					ctx.fillText((index / 10).toString(), 0, 0);
					ctx.restore();
				}
				else if (((index % 5) === 0) && showhalves) {
					// medium one
					ctx.moveTo(rcurx, height / 2);
					ctx.lineTo(rcurx, height);
				}
				else if (showtenths) {
					// small one
					ctx.moveTo(rcurx, height - height / 3);
					ctx.lineTo(rcurx, height);
				}
				
				ctx.closePath();
				ctx.stroke();

				index += 1;
			}

			ctx.restore();
		},


		/** 
		 * @brief sets one option
		 */
		_setOption: function(pKey, pValue) {
			this._super(pKey, pValue);

			if (pKey === 'zoom') {
				this._draw();
			}

			if (pKey === 'origin') {
				this._draw();
			}
		},


		/**
		 * @brief sets several options at once
		 */
		_setOptions: function(pOptions) {
			var that = this;
			var redraw = false;

			$.each(pOptions, function(pKey, pValue) {
				if ((pKey === "zoom") || pKey === "origin" || pKey === "unitname") {
					redraw = true;
					that.options[pKey] = pValue;
				}
				else {
					that._setOption(pKey, pValue);
				}
			});

			if (redraw) {
				this._draw();
			}			
		}

	});

} (jQuery));

