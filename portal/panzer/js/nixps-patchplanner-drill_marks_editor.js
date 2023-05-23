/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*globals jQuery, api, nixps */

(function( $ ) {

    $.widget("nixps-patchplanner.drill_marks_editor", $["nixps-patchplanner"].marks_editor, {

        options: {
            /**
             * @brief the path of the file to edit drill marks
             */
            patchid: null,

            marginRight: 0,

            marginLeft: 0,

            marginTop: 0,

            marginBottom: 0
        },


        _create: function() {
            $["nixps-patchplanner"].editor.prototype._create.apply(this);

            // The member variables
            this.session = null;
            this.doc = null;
            this.decorator = null;

            var patch = this._getPatch();
            var clipbox = patch.get_clip_box();
            this.setSize(clipbox.width + this.options.marginLeft + this.options.marginRight, clipbox.height + this.options.marginTop + this.options.marginBottom);

            this._delay(function() {
                this.setBackgroundImageURL(this._getPatchURL(true, 8));
                var decorationLayer = this.getDecorationLayer();

                var tMarginLeft = this.options.marginLeft * this.options.zoom;
                var tMarginRight = this.options.marginRight * this.options.zoom;
                var tMarginTop = this.options.marginTop * this.options.zoom;
                var tMarginBottom = this.options.marginBottom * this.options.zoom;

                var marginBorder = $('<div>');
                marginBorder.css({
                    position: 'absolute',
                    left: tMarginLeft,
                    right: tMarginRight,
                    top: tMarginTop,
                    bottom: tMarginBottom
                });
                marginBorder.addClass('margin');
                decorationLayer.append(marginBorder);
            });

            // Bind the handlers
            this._on(this.element, {
                "drill_marks_editorzoomchanged": this._zoomHandler
            });

            // Load the marks
            this.loadMarks();
        },


        /**
         * @brief loads the marks and puts them in the editor
         */
        loadMarks: function() {
            // First remove all the curret marks
            this.element.find(':nixps-patchplanner-editor_left_mark').remove();
            this.element.find(':nixps-patchplanner-editor_right_mark').remove();

            var decorator = this._getDecorator();
            var markpath = this._getMarkPath();

            var markids = decorator.get_mark_ids();
            var i = 0;
            var length = markids.length;
            for(i = 0; i < length; i++) {
                var markid = markids[i];
                var mark_distances = decorator.get_distances(markid);
                var left = mark_distances.left;
                var right = mark_distances.right;
                var left_middle = mark_distances.left_middle;
                var right_middle = mark_distances.right_middle;
                console.log(left_middle + "  -- " + right_middle );

                $('<div>').appendTo(this.element.find('.labellayer')).editor_left_mark({
                    id: nixps.patchplanner.util.guid(),
                    refid: markid,
                    mark_path: markpath,
                    distance_left: left,
                    distance_middle: left_middle,
                    scaling: this.options.zoom,
                    parentName: 'nixps-patchplanner-drill_marks_editor',
                    free_horizontal_move: true,
                    free_vertical_move: true
                });

                $('<div>').appendTo(this.element.find('.labellayer')).editor_right_mark({
                    id: nixps.patchplanner.util.guid(),
                    refid: markid,
                    mark_path: markpath,
                    distance_right: right,
                    distance_middle: right_middle,
                    scaling: this.options.zoom,
                    parentName: 'nixps-patchplanner-drill_marks_editor',
                    free_horizontal_move: true,
                    free_vertical_move: true
                });
            }
        },


        /**
         * @brief adds a mark to the patch
         */
        addMark: function(pLeftDistance, pRightDistance, pMiddleDistance) {
            var decorator = this._getDecorator();
            decorator['mLayerSpecified'] = true;
            decorator['mLayerName'] = "Drill Marks";
            var markid = decorator.add_mark(pLeftDistance, pRightDistance, pMiddleDistance,true);
            var markpath = this._getMarkPath();

            $('<div>').appendTo(this.element.find('.labellayer')).editor_left_mark({
                id: nixps.patchplanner.util.guid(),
                refid: markid,
                mark_path: markpath,
                distance_left: pLeftDistance,
                distance_middle: pMiddleDistance,
                scaling: this.options.zoom,
                parentName: 'nixps-patchplanner-drill_marks_editor',
                free_horizontal_move: true,
                free_vertical_move: true
            });

            $('<div>').appendTo(this.element.find('.labellayer')).editor_right_mark({
                id: nixps.patchplanner.util.guid(),
                refid: markid,
                mark_path: markpath,
                distance_right: pRightDistance,
                distance_middle: pMiddleDistance,
                scaling: this.options.zoom,
                parentName: 'nixps-patchplanner-drill_marks_editor',
                free_horizontal_move: true,
                free_vertical_move: true
            });
        },


        /**
         * @brief saves the mark distances in the layout document
         */
        saveMarks: function() {
            var marks = this.element.find(':nixps-patchplanner-editor_left_mark').map(function(pIndex, pMark) {
                var mark = $(pMark);
                var reference = mark.editor_left_mark('option', 'refid');
                var distances = mark.editor_left_mark('getDistances');

                return {
                    refid: reference,
                    distances: distances
                };
            }).toArray();

            for(var i = 0; i < marks.length; i++) {
                var mark = marks[i];
                this._getDecorator().set_distances(mark.refid, mark.distances);
            }

            this.doc.set_decorator(this.options.patchid, this.decorator);
            this.session.saveLayoutDocument(this.doc);
        },


        /**
         * @brief this function constructs an image url representing a patch
         */
        _getPatchURL: function(pSeparated, pZoom) {

            var p_resource_element = this._getPatch();
            var asset = nixps.patchplanner.util.getAsset(p_resource_element.get_file());

            var proofscope_id = asset.proofscope.uuid;
            var page_number = p_resource_element.get_page();
            var separation = p_resource_element.get_separation();
            var clip_box = p_resource_element.get_clip_box();

            var base_url = '/cgi-bin/proofscope.cgi?'
                + 'file=' + proofscope_id
                + "&page=" + page_number
                + '&top=' + (clip_box.y + clip_box.height + this.options.marginTop)
                + '&bottom=' + (clip_box.y - this.options.marginBottom)
                + '&left=' + (clip_box.x - this.options.marginLeft)
                + '&right=' + (clip_box.x + clip_box.width + this.options.marginRight);

            if (pSeparated) {
                base_url += '&sepname=' + encodeURI(separation);
            }

            base_url += '&zoom=' + pZoom;

            return base_url;
        },


        /**
         * @brief returns the mark path
         */
        _getMarkPath: function() {
            return (new nixps.patchplanner.CloudflowSettings()).getDefaultJobMarkPath();
        },



        /**
         * @brief gets the mark info
         */
        _getMarkInfo: function(pURL) {
            var asset = nixps.patchplanner.util.getAsset(pURL);

            return {
                url: asset.thumb,
                width: asset.metadata.page_boxes.crop.size.width,
                height: asset.metadata.page_boxes.crop.size.height
            };
        },


        /**
         * @brief returns the document
         */
        _getDocument: function() {
            this._cacheData();

            return this.doc;
        },


        /**
         * @brief returns the decorator
         */
        _getDecorator: function() {
            this._cacheData();

            return this.decorator;
        },


        /**
         * @brief caches the patch and the decorator
         */
        _cacheData: function() {
            if (! (this.session instanceof nixps.patchplanner.Session)) {
                this.session  = new nixps.patchplanner.Session();
            }

            if (! (this.doc instanceof nixps.patchplanner.layout_document)) {
                this.doc = this.session.load_layout_document();
            }

            if (! (this.patch instanceof nixps.layout.file_resource_element)) {
                this.patch = this.doc.get_patch(this.options.patchid);
            }

            if (! (this.decorator instanceof nixps.patchplanner.patch_decorator)) {
                this.decorator = this.doc.get_decorator(this.options.patchid);
            }
        },


        /**
         * @brief the zoom handler
         */
        _zoomHandler: function(pEvent, pZoom) {
            this.element.find(':nixps-patchplanner-editor_left_mark').editor_left_mark('option', 'scaling', pZoom.zoom);
            this.element.find(':nixps-patchplanner-editor_right_mark').editor_right_mark('option', 'scaling', pZoom.zoom);
        }
    });

}) (jQuery);
