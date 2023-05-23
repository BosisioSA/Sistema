/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, alert, Image*/
/*global panzer_filelist*/
/*global _, nixps, namespace */
/*global jQuaery */

(function( $ ) {

    $.widget("nixps-patchplanner.editor_sheet", {

        options: {
            /**
             * @brief boolean that indicates to show the leading edge
             */
            showLeadingEdge: true,

            /**
             * @brief width of the sheet in pt
             */
            width: 2160,

            /**
             * @brief height of the sheet in pt
             */
            height: 3168,

            /**
             * @brief margins on the sheet
             */
            margins: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
            },

            /** 
             * @brief the zoom factor on the sheet
             */
            zoom: 1.0,

            /**
             * @brief shows the snap grid on the sheet
             */
            snapgrid: false,

            /**
             * @brief the elements the sheet will accept for drop
             */
            acceptElement: '#layout .filelist .element',

            /**
             * @brief the background url to display
             */
            backgroundURL: undefined,

            /** 
             * @brief the display unit
             */
            unit: (new nixps.cloudflow.UnitPreferences()).getDefinition('length')
        },

        _create: function() {
            this.element.addClass('sheet');

            var backgroundLayer = $("<img>");
            backgroundLayer.addClass('background');
            backgroundLayer.appendTo(this.element);

            var decorationLayer = $('<div>');
            decorationLayer.addClass('decorations');
            decorationLayer.css({
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                background: 'transparent'
            });
            decorationLayer.appendTo(this.element);

            if (typeof this.options.backgroundURL === 'string') {
                backgroundLayer.attr('src', this.options.backgroundURL);
            }

            var gridLayer = $("<canvas class='gridlayer'></canvas>");
            gridLayer.attr('height', this.element.height());
            gridLayer.attr('width', this.element.width());
            gridLayer.css({
                position: 'absolute'
            });
            gridLayer.appendTo(this.element);

            var labelLayer = $("<div class='labellayer'>");
            labelLayer.css({
                'position': 'absolute',
                'background-color': 'rgba(255,255,255,0)'
            });
            labelLayer.appendTo(this.element);

            var constraintLayer = $("<div>").addClass('constraintLayer');
            constraintLayer.css({
                'position': 'absolute',
                'background-color': 'rgba(255,255,255,0)',
                'left': 0,
                'right': 0,
                'top': 0,
                'bottom': 0
            });
            constraintLayer.appendTo(labelLayer);

            this.element.droppable({ 
                accept: this.options.acceptElement
            });

            this._draw();

            this._on(this.element, {
                'dropover': this._dropoverHandler,
                'dropout': this._dropoutHandler,
                'drop': this._dropHandler
            });
        },


        _dropoverHandler: function() {
            this.element.find('.labellayer').css({
                'background-color': 'rgba(0,0,255,0.5)',
                'z-index': 1000
            });
        },


        _dropoutHandler: function() {
            this.element.find('.labellayer').css({
                'background-color': 'rgba(0,0,255,0.0)',
                'z-index': 'auto'
            });
        },


        _dropHandler: function(pEvent, pUI) {
            this.element.find('.labellayer').css({
                'background-color': 'rgba(0,0,255,0.0)',
                'z-index': 'auto'
            });

            this._trigger('drop', pEvent, {
                droppable: pUI
            });
        },


        _getSheetViewSize: function() {
            return {
                width: this.options.width * this.options.zoom,
                height: this.options.height * this.options.zoom
            };
        },

        redraw: function() {
            this._draw();
            this._trigger('redraw');
        },


        _setOption: function(pKey, pValue) {
            this._super(pKey, pValue);

            if (pKey === 'unitname') {
                this._draw();
            }

            if (pKey === 'zoom') {
                this._draw();
            }

            if ((pKey === 'width') || (pKey === 'height')) {
                this._draw();
            }

            if (pKey === 'margins') {
                this._draw();
            }
        },

        setBackgroundImageURL: function(pURL) {
            this.element.find('.background').attr('src', pURL);
            this.element.find('.gridlayer').hide();
            this._draw();
        },


        getDecorationLayer: function() {
            return this.element.find('.decorations');
        },


        _draw: function() {
            var zoom = this.options.zoom;
            var pt_unit = new nixps.cloudflow.Unit({ unit: 'pt'});
            var viewSize = this._getSheetViewSize();
            var unit = new nixps.cloudflow.Unit({ unit: 'cm'});
            if (this.options.unit.isImperial() === true) {
                unit = new nixps.cloudflow.Unit({ unit: 'in'});
            }

            this.element.width(viewSize.width);
            this.element.height(viewSize.height);
            this.element.find('.gridlayer').width(viewSize.width);
            this.element.find('.gridlayer').height(viewSize.height);
            this.element.find('.gridlayer').attr('width', viewSize.width);
            this.element.find('.gridlayer').attr('height', viewSize.height);
            this.element.find('.labellayer').width(viewSize.width);
            this.element.find('.labellayer').height(viewSize.height);
            if (this.element.find('.background').attr('src') !== undefined) {
                this.element.find('.background').attr('width', viewSize.width);
                this.element.find('.background').attr('height', viewSize.height);
                // Don't draw the grid if we show a background image
                return;
            }

            // Adapt the constraint layer
            var margins = this.options.margins;
            var left = margins.left * zoom;
            var right = margins.right * zoom; 
            var top = margins.top * zoom;
            var bottom = margins.bottom * zoom;
            this.element.find('.constraintLayer').css({
                top: top,
                bottom: bottom,
                left: left,
                right: right
            });

            // Draw the grid
            var gridLayer = this.element.find('.gridlayer');

            // Return if we can't get a drawing context
            if (! gridLayer[0].getContext) {
                return;
            }

            var width = viewSize.width;
            var height = viewSize.height;

            // use getContext to use the canvas for drawing
            var ctx = gridLayer[0].getContext('2d');            
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.fillRect(0, 0, width, height); 

            var cur_x = 0;
            var r_cur_x = 0;
            var index = 0;
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#f7f7ff';

            while (cur_x < width) {
                cur_x = unit.convert(index / 10.0, pt_unit) * zoom;

                r_cur_x = Math.floor(cur_x) + 0.5;

                // small one
                ctx.beginPath();
                ctx.moveTo(r_cur_x, 0);
                ctx.lineTo(r_cur_x, height);
                ctx.stroke();
                index += 1;
            }

            index = 0;
            cur_x = 0;
            r_cur_x = 0;
            
            while (cur_x < height) {
                cur_x = unit.convert(index / 10.0, pt_unit) * zoom;

                r_cur_x = Math.floor(cur_x) + 0.5;

                // small one
                ctx.beginPath();
                ctx.moveTo(0, r_cur_x);
                ctx.lineTo(width, r_cur_x);
                ctx.stroke();

                index += 1;
            }

            if (! this.options.snapgrid) {
                ctx.strokeStyle = '#eef';
                index = 0;
                r_cur_x = 0;
                cur_x = 0;
                
                while(cur_x < Math.max(width, height)) {
                    cur_x = unit.convert(index / 10.0, pt_unit) * zoom;

                    r_cur_x = Math.floor(cur_x) + 0.5;

                    if ((index % 10) === 0) {
                        // big one
                        ctx.beginPath();
                        ctx.moveTo(r_cur_x, 0);
                        ctx.lineTo(r_cur_x, height);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(0, r_cur_x);
                        ctx.lineTo(width, r_cur_x);
                        ctx.stroke();
                    }

                    index += 1;
                }
            }

            ctx.strokeStyle = '#eef';
            ctx.moveTo(0, height - 0.5);
            ctx.lineTo(width, height - 0.5);
            ctx.stroke();

            ctx.strokeStyle = '#eef';
            ctx.moveTo(width - 0.5, 0);
            ctx.lineTo(width - 0.5, height);
            ctx.stroke();

            // gray out unusable borders
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(left, 0, width - left - right, top); 
            ctx.fillRect(left, height - bottom, width - left - right, bottom); 
            ctx.fillRect(0, 0, left, height); 
            ctx.fillRect(width - right, 0, right, height); 

            // reset the fill color
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        }
    });

} (jQuery));
