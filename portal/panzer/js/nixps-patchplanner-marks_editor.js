/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*globals jQuery */

(function( $ ) {
	
	$.widget("nixps-patchplanner.marks_editor", $["nixps-patchplanner"]["editor"], {

		options: {
			/**
			 * @brief the left  margin of the patch
			 */
			marginLeft: 46,

			/**
			 * @brief the right margin  of the patch
			 */
			marginRight: 46,

			/** 
			 * @brief the top margin of the patch
			 */
			marginTop: 46,

			/**
			 * @brief the bottom margin of the patch
			 */
			marginBottom: 46,

			/**
			 * @brief the uuid of the patch to edit
			 */
			patchid: null
		},


		_create: function() {
			this._super();

			// The member variables
			this.session = null;
			this.doc = null; 
			this.decorator = null;

			// Set the viewer options
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
				"marks_editorzoomchanged": this._zoomHandler
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

            // Get the mark file patch
			var patch = this._getPatch();
			var markpath = this._getMarkPath();

			var marks = this._getDecorator().get_mark_ids();
			for(var i = 0; i < marks.length; i++) {
				var markid = marks[i];
				var decorator = this._getDecorator();
				var distances = decorator.get_distances(markid);
				var mainMark = decorator.is_main_mark(markid);

				var leftMark = $('<div>').appendTo(this.element.find('.labellayer')).editor_left_mark({
					id: nixps.patchplanner.util.guid(),
					refid: markid,
					mark_path: markpath,
					distance_left: distances.left,
					distance_middle: distances.middle
				});

				if (mainMark) {
					leftMark.editor_left_mark('option', 'mark_number', this._getPatchIndex());
				}

				$('<div>').appendTo(this.element.find('.labellayer')).editor_right_mark({
					id: nixps.patchplanner.util.guid(),
					refid: markid,
					mark_path: markpath,
					distance_right: distances.right,
					distance_middle: distances.middle
				});
			}


            this.element.find(':nixps-patchplanner-editor_left_mark').editor_left_mark('option', 'scaling', this.options.zoom);
            this.element.find(':nixps-patchplanner-editor_right_mark').editor_right_mark('option', 'scaling', this.options.zoom);
		},


		/**
		 * @brief adds a mark to the patch
		 */
		addMark: function(pLeftDistance, pRightDistance, pMiddleDistance, pMainMark) {
			var decorator = this._getDecorator();
			var markid = null;
			if (pMainMark) {
				markid = decorator.add_mark(pLeftDistance, pRightDistance, pMiddleDistance, pMainMark);
			}
			else {
				markid = decorator.add_mark(pLeftDistance, pRightDistance, pMiddleDistance);	
			}
			var markpath = this._getMarkPath();

			var leftMark = $('<div>').appendTo(this.element.find('.labellayer')).editor_left_mark({
				id: nixps.patchplanner.util.guid(),
				refid: markid,
				mark_path: markpath,
				distance_left: pLeftDistance,
				distance_middle: pMiddleDistance,
				scaling: this.options.zoom
			});

			if (pMainMark) {
				leftMark.editor_left_mark('option', 'mark_number', this._getPatchIndex());
			}

			$('<div>').appendTo(this.element.find('.labellayer')).editor_right_mark({
				id: nixps.patchplanner.util.guid(),
				refid: markid,
				mark_path: markpath,
				distance_right: pRightDistance,
				distance_middle: pMiddleDistance,
				scaling: this.options.zoom
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
		 * @brief sets the composite view (true/false), if false separated view is shown
		 */
		setCompositeView: function(pEnable) {
			this._delay(function() {
				this.setBackgroundImageURL(this._getPatchURL(!pEnable, 8));
			});
		},


		/**
		 * @brief removes the selection
		 */
		removeSelection: function() {
			var labels = this.element.find('.labellayer .selected');

			var refids = labels.filter(":nixps-patchplanner-editor_left_mark").map(function(pIndex, pMark) {
				return $(pMark).editor_left_mark('option', 'refid');
			}).toArray();

			labels.remove();
			var decorator = this._getDecorator();
			_.each(refids, function(pID) {
				decorator.remove_mark(pID);
			});
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
			this._cacheData();

			return this._getDocument().get_mark(this._getPatch().get_file());
		},


		/**
		 * @brief returns the document
		 */
		_getDocument: function() {
			this._cacheData();

			return this.doc;
		},


		/**
		 * @brief returns the patch
		 */
		_getPatch: function() {
			this._cacheData();

			return this.patch;
		},


		/**
		 * @brief returns the patch index
		 */
		_getPatchIndex: function() {
			var patch = this._getPatch();
			var data = patch.get_data();
			return parseInt(data.index, 10);
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
            var decorationLayer = this.getDecorationLayer();

            var tMarginLeft = this.options.marginLeft * this.options.zoom;
            var tMarginRight = this.options.marginRight * this.options.zoom;
            var tMarginTop = this.options.marginTop * this.options.zoom;
            var tMarginBottom = this.options.marginBottom * this.options.zoom;

            var marginBorder = decorationLayer.find('.margin');
            marginBorder.css({
            	position: 'absolute',
            	left: tMarginLeft,
            	right: tMarginRight,
            	top: tMarginTop,
            	bottom: tMarginBottom
            });
        },


        /**
         * @brief sets the current tool in the marks editor
         */
        setTool: function(pTool, pParameters) {
        	if (pParameters !== undefined) {
        		new pTool(this, pParameters);
        	}
        	else {
	        	new pTool(this);	        		
        	}
        }
	});
	
}) (jQuery);
