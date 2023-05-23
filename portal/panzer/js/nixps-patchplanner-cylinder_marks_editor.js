/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*globals jQuery, api, nixps */

(function( $ ) {
	
	$.widget("nixps-patchplanner.cylinder_marks_editor", $["nixps-patchplanner"].marks_editor, {

		options: {
			/**
			 * @brief the path of the file to edit cylinder marks
			 */
			file: null,

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

			var asset = nixps.patchplanner.util.getAsset(this.options.file);

			var width = asset.metadata.page_boxes.crop.size.width;
			var height = asset.metadata.page_boxes.crop.size.height;

			// Set the viewer options
			this.setSize(width, height);
			this._delay(function() {
				this.setBackgroundImageURL(this._getPatchURL(false, 1));
			});

			// Bind the handlers
			this._on(this.element, {
				"cylinder_marks_editorzoomchanged": this._zoomHandler
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
	            var middle = mark_distances.middle;

				$('<div>').appendTo(this.element.find('.labellayer')).editor_left_mark({
					id: nixps.patchplanner.util.guid(),
					refid: markid,
					mark_path: markpath,
					distance_left: left,
					distance_middle: middle,
					scaling: this.options.zoom,
					parentName: 'nixps-patchplanner-cylinder_marks_editor',
					free_horizontal_move: true
				});

				$('<div>').appendTo(this.element.find('.labellayer')).editor_right_mark({
					id: nixps.patchplanner.util.guid(),
					refid: markid,
					mark_path: markpath,
					distance_right: right,
					distance_middle: middle,
					scaling: this.options.zoom,
					parentName: 'nixps-patchplanner-cylinder_marks_editor',
					free_horizontal_move: true
				});
            }
		},


		/**
		 * @brief adds a mark to the patch
		 */
		addMark: function(pLeftDistance, pRightDistance, pMiddleDistance) {
			var decorator = this._getDecorator();
			var markid = decorator.add_mark(pLeftDistance, pRightDistance, pMiddleDistance);
			var markpath = this._getMarkPath();

			$('<div>').appendTo(this.element.find('.labellayer')).editor_left_mark({
				id: nixps.patchplanner.util.guid(),
				refid: markid,
				mark_path: markpath,
				distance_left: pLeftDistance,
				distance_middle: pMiddleDistance,
				scaling: this.options.zoom,
				parentName: 'nixps-patchplanner-cylinder_marks_editor',
				free_horizontal_move: true
			});

			$('<div>').appendTo(this.element.find('.labellayer')).editor_right_mark({
				id: nixps.patchplanner.util.guid(),
				refid: markid,
				mark_path: markpath,
				distance_right: pRightDistance,
				distance_middle: pMiddleDistance,
				scaling: this.options.zoom,
				parentName: 'nixps-patchplanner-cylinder_marks_editor',
				free_horizontal_move: true
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

			this.doc.set_job_decorator(this.options.file, this.decorator);
			this.session.saveLayoutDocument(this.doc);
		},


		/** 
	 	 * @brief this function constructs an image url representing a patch
	 	 */
		_getPatchURL: function(pSeparated, pZoom) {
			var asset = nixps.patchplanner.util.getAsset(this.options.file);
			var proofscope_id = asset.proofscope.uuid;
			var page_number = 0;
			var crop_box = asset.metadata.page_boxes.crop;
			// var separation = p_resource_element.get_separation();
			// var clip_box = p_resource_element.get_clip_box();

			var base_url = '/cgi-bin/proofscope.cgi?' 
					+ 'file=' + proofscope_id
					+ "&page=" + page_number 
					+ '&top=' + (crop_box.size.height)
					+ '&bottom=' + 0
					+ '&left=' + 0
					+ '&right=' + (crop_box.size.width)
					+ '&zoom=' + 2;

			// base_url += '&zoom=' + pZoom;

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

			if (! (this.decorator instanceof nixps.patchplanner.mark_decorator)) {
				this.decorator = this.doc.get_job_decorator(this.options.file);
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
