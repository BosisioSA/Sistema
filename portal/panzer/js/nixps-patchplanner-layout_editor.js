/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, $, alert, setTimeout, namespace, nixps */
/*global jQuery*/

(function( $ ) {

    $.widget("nixps-patchplanner.editor", {

        options: {
            /**
             * @brief the zoom level
             */
            zoom: 1.0,


            /** 
             * @brief show the toolbar yes/no
             */
            showToolbar: true,


            /**
             * @brief the unit name to use in the editor
             */
            unit: (new nixps.cloudflow.UnitPreferences()).getDefinition('length'),


            /**
             * @brief function that creates a label from a 
             */
            createLabelFromDroppable: function(pDroppable) {
                var draggedElement = pDroppable.droppable.draggable;
                var patchID = draggedElement.filelist_patch('option', 'id');

                var layoutDocument = (new nixps.patchplanner.Session()).load_layout_document();
                var assetPath = layoutDocument.get_patch(patchID).get_file();
                var jobSettings = new nixps.patchplanner.job_settings(assetPath, layoutDocument.get_file_data(assetPath));
                var distortion = jobSettings.get_distortion();
                var patch = layoutDocument.get_patch(patchID);
                var patchMargins = jobSettings.get_patch_margins();
                var patchClipBox = patch.get_clip_box();
                var label = $('<div>').editor_label({
                    id: nixps.patchplanner.util.guid(),
                    refid: patchID,
                    url: nixps.patchplanner.util.get_rendered_patch_url,
                    ptleft: 0,
                    pttop: 0,
                    ptwidth: patchClipBox.width,
                    ptheight: patchClipBox.height,
                    ptleftmargin: patchMargins.left,
                    ptrightmargin: patchMargins.right,
                    pttopmargin: patchMargins.top,
                    ptbottommargin: patchMargins.bottom,
                    distortion: distortion,
                    snap: function() {
                        return $('#patchplanner-snap').is(":checked");
                    }
                });

                return label;
            },

            tools: [ 'remove', 'rotate', 'marks', 'snap', 'clear' ]
        },


        /** 
         * @brief creates the editor component
         */
        _create: function() {
            this.element.addClass('editionpane');

            if (this.options.showToolbar) {
                this.m_toolbar = new nixps.patchplanner.layout_editor_toolbar([
                    new panzer.tool_group([ new panzer.tool_button_group([ new nixps.patchplanner.tool_remove_selection(), new nixps.patchplanner.tool_rotate_selection(), new nixps.patchplanner.tool_edit_marks() ]) ]),
                    new panzer.tool_group([ new panzer.tool_button_group([ new nixps.patchplanner.tool_snap() ]) ]),
                    new panzer.tool_group([ new panzer.tool_button_group([ new nixps.patchplanner.tool_clear_sheet() ]) ]),
                    new panzer.tool_group([ new panzer.tool_button_group([ new nixps.patchplanner.tool_zoom_level() ])], true)
                ]);
                this.m_toolbar.setup_ui(this.element, this.element);
            }

            var editorview = $("<div>");
            editorview.addClass('editorview');
            editorview.attr('tabindex', '1');
            editorview.appendTo(this.element);

            var editorSheet = $('<div>').editor_sheet({
                acceptElement: '#layout .filelist .element',
                unit: this.options.unit
            });
            editorSheet.appendTo(editorview);

            // Create the rulers            
            var horizontalRuler = $('<div>').editor_ruler({
                unit: this.options.unit
            });
            horizontalRuler.appendTo(this.element);

            var verticalRuler = $('<div>').editor_ruler({
                orientation: nixps.patchplanner.orientation.vertical,
                unit: this.options.unit
            });
            verticalRuler.appendTo(this.element);

            // Redraw
            this._draw();

            // Register the events
            this._on(this.element, {
                'editor_labelclick :nixps-patchplanner-editor_label': this._labelClickedHandler,
                'editor_labelselectionchanged :nixps-patchplanner-editor_label': function(pEvent) {
                    this._updateRulerCursors(pEvent.pageX, pEvent.pageY);
                },
                'editor_labelpositionchanged :nixps-patchplanner-editor_label': function(pEvent) {
                    this._updateRulerCursors(pEvent.pageX, pEvent.pageY);
                },
                'editor_labelchanged :nixps-patchplanner-editor_label': function(pEvent) {
                    this._trigger('layoutchanged');
                },
                'editor_labeldragstart :nixps-patchplanner-editor_label': this._labelDragstartHandler,
                'editor_labeldrag :nixps-patchplanner-editor_label': this._labelDragHandler,
                'editor_labeldragstop :nixps-patchplanner-editor_label': this._labelDragstopHandler,
                'editorzoomchanged': this._zoomHandler
            });

            this._on(this.element.find('.editorview'), {
                'mousemove': function(pEvent) {
                    this._updateRulerCursors(pEvent.pageX, pEvent.pageY);
                },
                'scroll': this._scrollHandler,
                'click': function(pEvent) {
                    this.clearSelection();
                    this._updateRulerCursors(pEvent.pageX, pEvent.pageY);
                }
            });

            this._on(editorSheet, {
                'editor_sheetdrop': this._dropHandler
            });

            this._on(this.window, {
                'resize': this._draw
            });
        },


        /**
         * @brief the scroll handler
         */
        _scrollHandler: function() {
            var editorView = this.element.find('.editorview')[0];
            var scrollLeft = editorView.scrollLeft;
            var scrollTop = editorView.scrollTop;

            var horizontalRuler = this.element.find(':nixps-patchplanner-editor_ruler.horizontalruler');
            horizontalRuler.css({
                left: - scrollLeft + 20
            });

            var verticalRuler = this.element.find(':nixps-patchplanner-editor_ruler.verticalruler');
            verticalRuler.css({
                top: - scrollTop + 51
            });
        },


        /**
         * @brief the editor sheet drop handler
         */
        _dropHandler: function(pEvent, pDroppable) {
            var label = this.options.createLabelFromDroppable(pDroppable);
            this.addLabel(label);
            label.editor_label('setScaling', this.options.zoom);

            // Get the correct position for the dropped element
            var viewLeft = pDroppable.droppable.position.left - this.element.find('.labellayer').offset().left;
            var viewTop = pDroppable.droppable.position.top - this.element.find('.labellayer').offset().top;
            label.editor_label("setViewPosition", viewLeft, viewTop);

            this._trigger('layoutchanged');
        },


        /**
         * @brief handles the label clicks
         */
        _labelClickedHandler: function(pEvent) {
            var isSelected = $(pEvent.currentTarget).editor_label('isSelected');
            if (! pEvent.shiftKey) {
                this.element.find(':nixps-patchplanner-editor_label').editor_label('setSelected', false);
            }
            $(pEvent.currentTarget).editor_label('setSelected', ! isSelected);
            return false;
        },


        /**
         * @brief handles the label drag start
         */
        _labelDragstartHandler: function(pEvent, pUI) {
            if (! pEvent.shiftKey) {
                this.element.find(':nixps-patchplanner-editor_label').editor_label('setSelected', false);
            }
            $(pEvent.currentTarget).editor_label('setSelected', true);

            this.startDragX = pUI.position.left;
            this.startDragY = pUI.position.top;
        },


        /**
         * @brief the label drag handler
         */
        _labelDragHandler: function(pEvent, pUI) {
            var deltaX = pUI.position.left - this.startDragX;
            var deltaY = pUI.position.top - this.startDragY;

            this.element.find('.labellayer').find(':nixps-patchplanner-editor_label.selected').not(this.currentTarget).editor_label('moveViewWithDelta', deltaX, deltaY);

            this.startDragX = pUI.position.left;
            this.startDragY = pUI.position.top;
        },


        /**
         * @brief the label drag stop handler
         */
        _labelDragstopHandler: function() {
            this._trigger('layoutchanged');
        },


        /**
         * @brief returns the reference ids of the selected labels
         */
        getSelectionReferences: function() {
            return _.uniq(this.element.find(':nixps-patchplanner-editor_label.selected').map(function(pIndex, pLabel) {
                return $(pLabel).editor_label('option', 'refid');
            }).toArray());
        },


        /**
         * @brief rotates the label
         */
        getSelection: function() {
            return this.element.find(':nixps-patchplanner-editor_label.selected');
        },


        /**
         * @brief clears the selection
         */
        clearSelection: function() {
            this.element.find(':nixps-patchplanner-editor_label').editor_label('setSelected', false);
            return false;
        },


        /**
         * @brief removes all of the labels
         */
        removeAll: function() {
            this.element.find(':nixps-patchplanner-editor_label').remove();
            this._trigger('layoutchanged');
        },


        /**
         * @brief removes the selected labels
         */
        removeSelection: function() {
            this.element.find(':nixps-patchplanner-editor_label.selected').remove();
            this._trigger('layoutchanged');
        },


        /**
         * @brief remove the label with ref id
         */
        removeWithRefID: function(pRefID, pTriggerChange)
        {
            this.getWithRefID(pRefID).remove();

            if (pTriggerChange === false) {
            }
            else {
                this._trigger('layoutchanged');
            }
        },


        /**
         * @brief remove the label with ref id
         */
        getWithRefID: function(pRefID)
        {
            return this.element.find(':nixps-patchplanner-editor_label[refid=' + pRefID + ']');
        },


        /**
         * @brief sets the size in pt of the sheet
         */
        setSize: function(pWidth, pHeight) {
            this.element.find(':nixps-patchplanner-editor_sheet').editor_sheet('option', {
                'width': pWidth,
                'height': pHeight
            });

            this._draw();
        },


        /**
         * @brief returns the width in pt of the sheet
         */
        getWidth: function() {
            return this.element.find(':nixps-patchplanner-editor_sheet').editor_sheet('option', 'width');
        },


        /** 
         * @brief returns the height in pt of the sheet
         */
        getHeight: function() {
            return this.element.find(':nixps-patchplanner-editor_sheet').editor_sheet('option', 'height');
        },


        /**
         * @brief returns the margins in pt of the sheet
         */
        getMargins: function() {
            var sheet = this.element.find(':nixps-patchplanner-editor_sheet');
            return sheet.editor_sheet('option', 'margins');
        },


        /** 
         * @brief sets the margins in pt of the sheet
         */
        setMargins: function(pMargins) {
            var sheet = this.element.find(':nixps-patchplanner-editor_sheet');
            sheet.editor_sheet('option', 'margins', pMargins);
        },


        /**
         * @brief adds a label
         */
        addLabel: function(pEditorLabel) {
            pEditorLabel.appendTo(this.element.find('.labellayer'));
            pEditorLabel.editor_label('setScaling', this.options.zoom);
            if (this.options.readonly === true) {
                pEditorLabel.editor_label('disable');
            }

            this._trigger('layoutchanged');
        },


        /** 
         * @brief returns the label positions
         */
        getLabelPositions: function() {
            var labelPositions = this.element.find(':nixps-patchplanner-editor_label').map(function(pIndex, pLabel) {
                var label = $(pLabel);
                return {
                    id: label.editor_label('option', 'id'),
                    refid: label.editor_label('option', 'refid'),
                    rotation: label.editor_label('option', 'rotation'),
                    left: label.editor_label('option', 'ptleft'),
                    top: label.editor_label('option', 'pttop'),
                    width: label.editor_label('option', 'ptwidth'),
                    height: label.editor_label('option', 'ptheight')
                };
            });

            return labelPositions.toArray();
        },


        /**
         * @brief removes all the labels on the sheet
         */
        clear: function() {
            $(':nixps-patchplanner-editor_label').remove();
        },


        /**
         * @brief redraws the component
         */
        redraw: function() {
            this._draw();
        },


        /**
         * @brief repositions all the child elements
         */
        _draw: function() {
            // Add deocration?
            var addDecoration = true;

            // Remove the width decoration
            this.element.find(':nixps-patchplanner-editor_sheet_decorator_width').remove();
            this.element.find(':nixps-patchplanner-editor_sheet_decorator_height').remove();


            var sheet = this.element.find(':nixps-patchplanner-editor_sheet');

            if ($('.editorview').height() > sheet.height()) {
                sheet.css('top', (this.element.find('.editorview').height() - sheet.height()) / 2.0);
            }
            else {
                sheet.css('top', 0);
                addDecoration = false;
            }

            if ($('.editorview').width() > sheet.width()) {
                sheet.css('left', (this.element.find('.editorview').width() - sheet.width()) / 2.0);
            }
            else {
                sheet.css('left', 0);
                addDecoration = false;
            }
            
            // adapt the rulers
            var horizontalRuler = this.element.find(':nixps-patchplanner-editor_ruler.horizontalruler');
            horizontalRuler.css({
                width: this.element.find('.editorview')[0].scrollWidth + 20,
                height: 20
            });
            horizontalRuler.editor_ruler('option', {
                'zoom': this.options.zoom,
                'origin': sheet.position().left +  this.element.find('.editorview')[0].scrollLeft
            });
            var verticalRuler = this.element.find(':nixps-patchplanner-editor_ruler.verticalruler');
            verticalRuler.css({
                height: this.element.find('.editorview')[0].scrollHeight + 20,
                width: 20
            });
            verticalRuler.editor_ruler('option', {
                'zoom': this.options.zoom,
                'origin': sheet.position().top +  this.element.find('.editorview')[0].scrollTop
            });

            // Add the decorations
            if (addDecoration) {
                $('<div>').appendTo(this.element.find('.editorview')).editor_sheet_decorator_width({ 
                    sheet: sheet,
                    unit: this.options.unit
                });
                $('<div>').appendTo(this.element.find('.editorview')).editor_sheet_decorator_height({
                    sheet: sheet,
                    unit: this.options.unit
                });
            }
        },


        /**
         * @brief updates the ruler cursors
         */
        _updateRulerCursors: function(pMouseX, pMouseY) {
            // Selection
            var selectedLabels = this.element.find(':nixps-patchplanner-editor_label.selected');
            var horizontalRuler = this.element.find(':nixps-patchplanner-editor_ruler.horizontalruler');
            var verticalRuler = this.element.find(':nixps-patchplanner-editor_ruler.verticalruler');

            if (selectedLabels.length > 0)
            {
                var boundingBox = this._getBoundingBox(selectedLabels);
                horizontalRuler.editor_ruler('setCursor', boundingBox.left + 1, boundingBox.right + 1);
                verticalRuler.editor_ruler('setCursor', boundingBox.top, boundingBox.bottom);
            }
            else
            {
                pMouseX = pMouseX - this.element.find(':nixps-patchplanner-editor_sheet').offset().left;
                pMouseY = pMouseY - this.element.find(':nixps-patchplanner-editor_sheet').offset().top;
                horizontalRuler.editor_ruler('setCursor', pMouseX);
                verticalRuler.editor_ruler('setCursor', pMouseY);
            }
        },


        /**
         * @brief utility function that returns the bounding box of the jquery selection
         */
        _getBoundingBox: function(pSelection)
        {
            var leftMost = Number.MAX_VALUE;
            var rightMost = Number.MIN_VALUE;
            var topMost = Number.MAX_VALUE;
            var bottomMost = Number.MIN_VALUE;

            pSelection.each(function(pIndex, pElement)
            {
                var elementLeft = $(pElement).position().left;
                var elementTop = $(pElement).position().top;
                var elementBottom = elementTop + $(pElement).height();
                var elementRight = elementLeft + $(pElement).width();

                if (elementLeft < leftMost) {
                    leftMost = elementLeft;
                }

                if (elementRight > rightMost) {
                    rightMost = elementRight;
                }

                if (elementTop < topMost) {
                    topMost = elementTop;
                }

                if (elementBottom > bottomMost) {
                    bottomMost = elementBottom;
                }
            });

            return {
                left: leftMost,
                bottom: bottomMost,
                top: topMost,
                right: rightMost
            };
        },


        /**
         * @brief sets the zoom level on the relevant child elements
         */
        _setZoom: function(pZoom) {            
            this.element.find(':nixps-patchplanner-editor_sheet').editor_sheet('option', 'zoom', pZoom);
            this.element.find(':nixps-patchplanner-editor_ruler').editor_ruler('option', 'zoom', pZoom);
            this._trigger('zoomchanged', null, {
                zoom: parseFloat(pZoom)
            });
            this._draw();
        },


        /** 
         * @brief the zoom handler
         */
        _zoomHandler: function(pEvent, pZoom) {
            this.element.find(':nixps-patchplanner-editor_label').editor_label('setScaling', pZoom.zoom);
        },


        /**
         * @brief sets the background image for the sheet
         */
        setBackgroundImageURL: function(pURL) {
            if (typeof pURL !== 'string') {
                return;
            }

            this.element.find(':nixps-patchplanner-editor_sheet').editor_sheet('setBackgroundImageURL', pURL);
        },


        /**
         * @brief returns the decoration layer
         */
        getDecorationLayer: function() {
            return this.element.find(':nixps-patchplanner-editor_sheet').editor_sheet('getDecorationLayer');
        },


        /**
         * @brief sets the sheet to read only
         */
        _setReadOnly: function(pReadOnly) {
            if (pReadOnly === true) {
                this.element.find(':nixps-patchplanner-editor_label').editor_label('disable');
            }
            else {
                this.element.find(':nixps-patchplanner-editor_label').editor_label('enable');
            }
        },


        /** 
         * @brief sets the option
         */
        _setOption: function(pKey, pValue) {
            this._super(pKey, pValue);

            if (pKey === "readonly") {
                this._setReadOnly(pValue);
            }

            if (pKey === 'zoom') {
                this._setZoom(pValue);
            }

            if (pKey === 'unit') {
                this.element.find(":nixps-patchplanner-editor_sheet").editor_sheet('option', 'unit', pValue);
                this.element.find(":nixps-patchplanner-editor_ruler").editor_ruler('option', 'unit', pValue);
                this.element.find(":nixps-patchplanner-editor_sheet_decorator_width").editor_sheet_decorator_width('option', 'unit', pValue);
                this.element.find(":nixps-patchplanner-editor_sheet_decorator_height").editor_sheet_decorator_height('option', 'unit', pValue);
            }

            if (pKey === "tools") {
                if ($.isArray(pValue) === false) {
                    pValue = [ 'remove', 'rotate', 'marks', 'snap', 'clear' ];
                }

                this._super(pKey, pValue);
                this.m_toolbar.destroy();

                var tools = this.options.tools;

                var firstGroup = [];
                if (tools.indexOf("remove") >= 0) {
                    firstGroup.push(new nixps.patchplanner.tool_remove_selection());
                }
                if (tools.indexOf("rotate") >= 0) {
                    firstGroup.push(new nixps.patchplanner.tool_rotate_selection());
                }
                if (tools.indexOf("marks") >= 0) {
                    firstGroup.push(new nixps.patchplanner.tool_edit_marks());
                } 

                var secondGroup = [];
                if (tools.indexOf('snap') >= 0) {
                    secondGroup.push(new nixps.patchplanner.tool_snap());
                }

                var thirdGroup = [];
                if (tools.indexOf('clear') >= 0) {
                    thirdGroup.push(new nixps.patchplanner.tool_clear_sheet());
                }

                var groups = [];
                if (firstGroup.length > 0) {
                    groups.push(new panzer.tool_button_group([ new panzer.tool_group(firstGroup) ]));
                }                    
                if (secondGroup.length > 0) {
                    groups.push(new panzer.tool_button_group([ new panzer.tool_group(secondGroup) ]));
                }                    
                if (thirdGroup.length > 0) {
                    groups.push(new panzer.tool_button_group([ new panzer.tool_group(thirdGroup) ]));
                }

                groups.push(new panzer.tool_group([ new panzer.tool_button_group([ new nixps.patchplanner.tool_zoom_level() ])], true));

                this.m_toolbar = new nixps.patchplanner.layout_editor_toolbar(groups);
                this.m_toolbar.setup_ui(this.element, this.element);
            }
        }
    });
}(jQuery));


