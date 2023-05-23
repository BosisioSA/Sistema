/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, alert, Image*/
/*global panzer_filelist*/
/*global _, nixps, namespace */
/*global jQuery */

(function ( $ ) {
	
	$.widget('nixps-patchplanner.editor_sheet_decorator_width', {

		options: {

			/**
			 * @brief sheet element to attach to
			 */
			sheet: null,

			/**
			 * @brief sets the display unit
			 */
			unit: (new nixps.cloudflow.UnitPreferences()).getDefinition('length')
			
		},

		_create: function() {
			this.element.width(this.options.sheet.width());
			this.element.height(30);
            
            this.element.addClass(this.widgetFullName);
            
			this.element.css({
				position: 'absolute',
				left: this.options.sheet.position().left,
				top: this.options.sheet.position().top - this.element.height()
			});

			var canvas = $('<canvas>');
			canvas.attr('width', this.element.width());
			canvas.attr('height', this.element.height());

			this.element.append(canvas);

			this._draw();
		},


		_draw: function() {
			var canvas = this.element.find('canvas');
			canvas.attr('width', this.element.width());
            var unit = this.options.unit;
            var ptUnit = new nixps.cloudflow.Unit({ unit: 'pt' });

			if (! canvas[0].getContext) {
				return;
			}

            var drawColor = this.element.css('color');
            if (! drawColor) {
                drawColor = '#E6A92B';
            }
			var backgroundColor = this.element.css('background-color');
            if (! backgroundColor) {
                backgroundColor = '#414141';
            }
			var width = canvas.width();
			var height = canvas.height();

			var sheetWidth = this.options.sheet.editor_sheet('option', 'width');
            var widthText = unit.toString(ptUnit.convert(sheetWidth, unit));

            // Get a context
			var ctx = canvas[0].getContext('2d');

            // Set the context style
			ctx.font = "bold 10pt Arial";
            ctx.strokeStyle = drawColor;
            ctx.lineWidth = 2;

            // Clear the rect
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, width, height); 

            // The horizontal line
            ctx.beginPath();
            ctx.moveTo(0, height / 2 - 0.5);
            ctx.lineTo(width, (height / 2) - 0.5);
            ctx.stroke();

            // Left line
            ctx.beginPath();
            ctx.moveTo(ctx.lineWidth / 2.0, (height / 2) - 0.5 - 5);
            ctx.lineTo(ctx.lineWidth / 2.0, (height / 2) - 0.5 + 5);
            ctx.stroke();

            // Right line
            ctx.beginPath();
            ctx.moveTo(width - (ctx.lineWidth / 2.0), (height / 2) - 0.5 - 5);
            ctx.lineTo(width - (ctx.lineWidth / 2.0), (height / 2) - 0.5 + 5);
            ctx.stroke();

            // Draw the text
            var widthMeasureText = ctx.measureText(widthText).width;
            var heightMeasureText = 10;
            if (widthMeasureText < (this.element.width() - 10)) {
				ctx.translate((this.element.width() / 2.0) - (widthMeasureText / 2.0), (this.element.height() / 2.0) + 4);

				// Why do I have to add a correction factor for the y origin of the rect?
				ctx.fillStyle = backgroundColor;
				ctx.strokeStyle = backgroundColor;
				ctx.fillRect(-10, -10, widthMeasureText + 20, heightMeasureText + 10);

				ctx.fillStyle = drawColor;
				ctx.strokeStyle = drawColor;
				ctx.fillText(widthText, 0, 0);
            }
		},

        _setOption: function(pKey, pValue) {
            this._super(pKey, pValue);

            if (pKey === 'unitname') {
                this._draw();
            }
        }

	});

}(jQuery));
