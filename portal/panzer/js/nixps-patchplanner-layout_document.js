/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, _, namespace, nixps, cloudflow_path, hex_md5 */

(function() {
	
	namespace("nixps.patchplanner");

	var patchDecoratorDefaults = {
		slugline_font_size: 6,
		slugline_text: '${index} - ${pdfname} - ${sepname}',
		cutmark_line_width: 0.5,
		cutmark_stroke_color: 'black',
		distortion_text: '${distortion}',
		distortion_font_size: 6,
		distortion_distance_cutmark_left: 4,
		distortion_distance_cutmark_center: -4,
		mark_distance_left: 23,
		mark_distance_right: 23,
		mark_vertical_offset: 0,
		mark_snap: "middle",
		min_tall_patch_height: 3 * 72,
		tall_patch_proportion: 2.5		
	};

	/**
	 * @brief a reference key to a mark
	 * @param pFilePath the cloudflow path of the job
	 */
	nixps.patchplanner.mark_reference = function(pFilePath) {
		if (pFilePath !== undefined) {
			if ((! (pFilePath instanceof cloudflow_path)) && (! (pFilePath instanceof nixps.cloudflow.URLPath))) {
				throw new Error('invalid parameter');
			}

			if (! pFilePath.is_file()) {
				throw new Error('invalid parameter');
			}
		}


		this.mFilePath = pFilePath;
		this.mUniqueId = undefined; 
	};

	nixps.patchplanner.mark_reference.prototype = {

		constructor: nixps.patchplanner.mark_reference,

		/** 
		 * @brief returns the unique name for the mark resource
		 */
		toString: function() {
			if (this.mUniqueId === undefined) {
				this.mUniqueId = hex_md5(this.mFilePath.get_full_path());
			}

			return "mark_" + this.mUniqueId;
		}

	};


	/**
	 * @brief a reference key to a mark
	 * @param pFilePath the cloudflow path of the job
	 */
	nixps.patchplanner.job_mark_reference = function(pFilePath) {
		if ((! (pFilePath instanceof cloudflow_path)) && (! (pFilePath instanceof nixps.cloudflow.URLPath))) {
			throw new Error('invalid parameter');
		}

		if (! pFilePath.is_file()) {
			throw new Error('invalid parameter');
		}

		this.mFilePath = pFilePath;
	};

	nixps.patchplanner.job_mark_reference.prototype = new nixps.patchplanner.mark_reference();

	nixps.patchplanner.job_mark_reference.prototype = $.extend(nixps.patchplanner.job_mark_reference.prototype, {

		constructor: nixps.patchplanner.job_mark_reference,

		/** 
		 * @brief returns the unique name for the mark resource
		 */
		toString: function() {
			if (this.mUniqueId === undefined) {
				this.mUniqueId = hex_md5(this.mFilePath.get_full_path());
			}

			return "job_mark_" + this.mUniqueId;
		}

	});


	nixps.patchplanner.mark_decorator = function(pMarkReference, pDecoratorJSON) {
		if (pMarkReference !== undefined) {
			if (! (pMarkReference instanceof nixps.patchplanner.mark_reference)) {
				throw new Error('invalid parameter');
			}

			this.mMarkReference = pMarkReference;
		}

		if (pDecoratorJSON !== undefined) {
			if (! $.isArray(pDecoratorJSON)) {
				throw new Error('invalid parameter');
			}

			this.mJSON = pDecoratorJSON;

			// Check if the json is consistent with the passed mark reference
			var invalidMarkCount = _.size(_.filter(this.mJSON[0].objects, function(pElement) {
				return ((pElement.id.indexOf("left_mark") === 0) 
					|| (pElement.id.indexOf("right_mark") === 0))
					&& (pElement.resource !== pMarkReference.toString());
			}));

			if (invalidMarkCount > 0) {
				throw new Error('invalid mark reference for decorator');
			}
		}
		else {
			this.mJSON = [ { 
				"objects": []
			} ];
		}
	};

	nixps.patchplanner.mark_decorator.prototype = {

		constructor: nixps.patchplanner.mark_decorator,

		/**
		 * @brief adds a mark
		 * @param pLeftDistance the distance of the left mark from the patch
		 * @param pRightDistance the distance of the right mark from the patch
		 * @return the id of the mark added
		 */
		add_mark: function(pLeftDistance, pRightDistance, pMiddleDistance, pMainMark) {
			if ((typeof pLeftDistance !== 'number') 
				|| (typeof pRightDistance !== 'number') 
				|| (typeof pMiddleDistance !== 'number')) {
				throw new Error('invalid parameter');
			}

			var isMainMark = false;
			if (pMainMark === true) {
				isMainMark = true;
			}

			var markid = nixps.patchplanner.util.guid();

			var leftMark = {
				"id": "left_mark_" + markid, 
				"type": "resource", 
				"resource": this.mMarkReference.toString(),
				"x_center": { 
					"object": "bounds", 
					"position": "left",
					"distance": -pLeftDistance
				}, 
				"y_center": { 
					"object": "bounds", 
					"position": "center",
					"distance": pMiddleDistance
				}
			};
			if (isMainMark) {
				leftMark.tags = [ "com.nixps.mark" ];
			}

			var rightMark = {
				"id": "right_mark_" + markid, 
				"type": "resource", 
				"resource": this.mMarkReference.toString(),
				"x_center": { 
					"object": "bounds", 
					"position": "right",
					"distance": -pRightDistance
				}, 
				"y_center": {
					"object": "bounds", 
					"position": "center",
					"distance": pMiddleDistance
				}
			};
			if (isMainMark) {
				rightMark.tags = [ "com.nixps.mark" ];
			}
			if (this.mLayerSpecified) {
				rightMark.layer = this.mLayerName;
			}

			this.mJSON[0].objects.push(leftMark);
			this.mJSON[0].objects.push(rightMark);

			return markid;
		},


		/**
		 * @brief removes the mark with that id
		 */
		remove_mark: function(pID) {
			if ((typeof pID !== 'string') || (pID.length === 0)) {
				throw new Error('invalid parameter');
			}

			this.mJSON[0].objects = _.filter(this.mJSON[0].objects, function(pElement) {
				return (pElement.id !== "left_mark_" + pID)
					&& (pElement.id !== "right_mark_" + pID)
					&& (pElement.id !== "left_number_" + pID)
					&& (pElement.id !== "left_number_background_" + pID);
			});
		},


		/**
		 * @brief returns all the mark ids for that decorator
		 */
		get_mark_ids: function() {
			return _.filter(this.mJSON[0].objects, function(pElement) {
				return (pElement.id.indexOf("left_mark") === 0);
			}).map(function(pLeftMark) {
				return pLeftMark.id.substring(10);
			});
		},


		/**
		 * @brief returns the distances for the mark with that id
		 */
		get_distances: function(pID) {
			if ((typeof pID !== 'string') || (pID.length === 0)) {
				throw new Error('invalid parameter');
			}

			var left_mark = _.filter(this.mJSON[0].objects, function(pElement) {
				return pElement.id === 'left_mark_' + pID;
			});	

			var right_mark = _.filter(this.mJSON[0].objects, function(pElement) {
				return pElement.id === 'right_mark_' + pID;
			});

			if ((_.size(left_mark) === 1) && (_.size(right_mark) === 1)) {
				return {
					right: - _.first(right_mark).x_center.distance,
					left: - _.first(left_mark).x_center.distance,
					middle: _.first(left_mark).y_center.distance,
					left_middle:_.first(left_mark).y_center.distance,
					right_middle:_.first(right_mark).y_center.distance
				};
			}

			throw new Error('no such mark');
		},


		/**
		 * @brief sets the mark distances
		 */
		set_distances: function(pID, pDistances) {
			if ((typeof pID !== 'string') || (pID.length === 0)) {
				throw new Error('invalid parameter');
			}
	
			if (! $.isPlainObject(pDistances)) {
				throw new Error('invalid parameter');
			}

			if ((typeof pDistances.left !== 'number')
				|| (typeof pDistances.right !== 'number')
				|| (typeof pDistances.middle !== 'number')) { 
				throw new Error('invalid distances dictionary');
			}

			var left_mark = _.filter(this.mJSON[0].objects, function(pElement) {
				return pElement.id === 'left_mark_' + pID;
			});	

			var right_mark = _.filter(this.mJSON[0].objects, function(pElement) {
				return pElement.id === 'right_mark_' + pID;
			});

			if ((_.size(left_mark) === 1) && (_.size(right_mark) === 1)) {

				var left_middle = pDistances.middle;
				if(pDistances.left_middle){
					left_middle = pDistances.left_middle;
				}

				var right_middle = pDistances.middle;
				if(pDistances.right_middle){
					right_middle = pDistances.right_middle;
				}
				_.first(left_mark).x_center.distance = -pDistances.left;
				_.first(left_mark).y_center.distance = left_middle;
				_.first(right_mark).x_center.distance = -pDistances.right;
				_.first(right_mark).y_center.distance = right_middle;
				return;
			}

			throw new Error('no such mark');
		},


		/**
		 * @brief returns true if the mark has a layer
		 */
		has_layer: function(pID) {
			if ((typeof pID !== "string") || (pID.length === 0)) {
				throw new Error("invalid id");
			}

			var left_mark = _.filter(this.mJSON[0].objects, function(pElement) {
				return pElement.id === 'left_mark_' + pID;
			});	

			if (_.size(left_mark) === 1) {
				var leftlayer = _.first(left_mark).layer;
				return (typeof leftlayer === "string") 
						&& (leftlayer.length > 0);
			}

			throw new Error('no such mark');
		},


		/**
		 * @brief gets the mark layer
		 */
		get_layer_name: function(pID) {
			if ((typeof pID !== "string") || (pID.length === 0)) {
				throw new Error("invalid id");
			}

			var left_mark = _.filter(this.mJSON[0].objects, function(pElement) {
				return pElement.id === 'left_mark_' + pID;
			});	

			if (_.size(left_mark) === 1) {
				if (_.first(left_mark).layer === undefined) {
					throw new Error('no layer');
				}

				return _.first(left_mark).layer;
			}

			throw new Error('no such mark');
		},


		/**
		 * @brief sets the mark layer
		 */
		set_layer_name: function(pID, pLayerName) {
			if ((typeof pID !== 'string') || (pID.length === 0)) {
				throw new Error('invalid parameter');
			}

			if ((typeof pLayerName !== 'string') || (pLayerName.length === 0)) {
				throw new Error('invalid parameter');
			}
	
			var left_mark = _.filter(this.mJSON[0].objects, function(pElement) {
				return pElement.id === 'left_mark_' + pID;
			});	

			var right_mark = _.filter(this.mJSON[0].objects, function(pElement) {
				return pElement.id === 'right_mark_' + pID;
			});

			if ((_.size(left_mark) === 1) && (_.size(right_mark) === 1)) {
				_.first(left_mark).layer = pLayerName;
				_.first(right_mark).layer = pLayerName;
				return;
			}

			throw new Error('no such mark');
		},


		/**
		 * @brief returns true if the mark is a main mark
		 */
		is_main_mark: function(pID) {
			if ((typeof pID !== 'string') || (pID.length === 0)) {
				throw new Error('invalid parameter');
			}

			var left_mark = _.first(_.filter(this.mJSON[0].objects, function(pElement) {
				return pElement.id === 'left_mark_' + pID;
			}));	

			return ($.isArray(left_mark.tags) && (left_mark.tags.indexOf("com.nixps.mark") >= 0));
		},


		/**
		 * @brief returns true if the decorator has a main mark
		 */
		has_main_mark: function() {
			var left_mark = _.first(_.filter(this.mJSON[0].objects, function(pElement) {
				return $.isArray(pElement.tags) && (pElement.tags.indexOf("com.nixps.mark") >= 0);
			}));	

			return _.size(left_mark) > 0;
		},


		/**
		 * @brief returns the json representation of the patch decorator
		 */
		to_json: function() {
			return this.mJSON;
		}
	};


	/**
	 * @brief a patch decorator
	 * @param pMarkReference the reference to the mark to use
	 * @param pDecoratorJSON the json to intialize with [optional], if none supplied a default decorator is created
	 */
	nixps.patchplanner.patch_decorator = function(pMarkReference, pDecoratorJSON, pLayerName, pSettings) {
		var settings = pSettings || {};

		this.mSettings = $.extend({}, patchDecoratorDefaults, settings);

		if (! (pMarkReference instanceof nixps.patchplanner.mark_reference)) {
			throw new Error('invalid parameter');
		}

		this.mMarkReference = pMarkReference;

		if (pDecoratorJSON !== undefined) {
			if (! $.isArray(pDecoratorJSON)) {
				throw new Error('invalid parameter');
			}

			this.mJSON = pDecoratorJSON;

			// Check if the json is consistent with the passed mark reference
			var invalidMarkCount = _.size(_.filter(this.mJSON[0].objects, function(pElement) {
				return ((pElement.id.indexOf("left_mark") === 0) 
					|| (pElement.id.indexOf("right_mark") === 0))
					&& (pElement.resource !== pMarkReference.toString());
			}));

			if (invalidMarkCount > 0) {
				throw new Error('invalid mark reference for decorator');
			}

			var cutmark = _.find(this.mJSON[0].objects, function(pObject) {
				return (pObject.id === "cutmark");
			});

			if (cutmark === undefined) {
				throw new Error('no cutmark in the layout document');
			}

			if ((typeof cutmark.layer === "string") && (cutmark.layer.length > 0)) {
				this.mHasLayer = true;
				this.mLayerName = cutmark.layer;
			}
			else {
				this.mHasLayer = false;
			}
		}
		else {
			if (pLayerName !== undefined) {
				if ((typeof pLayerName !== "string") || (pLayerName.length === 0)) {
					throw new Error("invalid parameter");
				}

				this.mHasLayer = true;
				this.mLayerName = pLayerName;
			}
			else {
				this.mHasLayer = false;
			}

			this.mJSON = [ { 
				"objects": [
					{
						"id": "cutmark",
						"type": "rectangle",
						"bottom": { "object": "bounds", "position": "bottom", "distance": -45 },
						"right": { "object": "bounds", "position": "right", "distance": -45 },
						"top": { "object": "bounds", "position": "top", "distance": -45 },
						"left": { "object": "bounds", "position": "left", "distance": -45 },
						"line_width": this.mSettings.cutmark_line_width,
						"stroke_color": this.mSettings.cutmark_stroke_color
					},
					{ 
						"id": "slugline", 
						"type": "text", 
						"text": this.mSettings.slugline_text, 
						"font": "slugfont", 
						"font_size": this.mSettings.slugline_font_size, 
						"mirror": "horizontal",
						"bottom": { 
							"object": "cutmark", 
							"position": "bottom", 
							"distance": 9 
						}, 
						"left": { 
							"object": "cutmark", 
							"position": "left", 
							"distance": 9 
						}, 
						"right": {
							"object": "cutmark",
							"position": "right",
							"distance": 9
						},
						"height": 7 
					},
					{
						"id": "distortion",
						"type": "text",
						"text": this.mSettings.distortion_text,
						"font": "slugfont",
						"font_size" : this.mSettings.distortion_font_size,
						"mirror": "horizontal",
						"bottom": {
							"object": "cutmark",
							"position": "left", 
							"distance": this.mSettings.distortion_distance_cutmark_left 
						},
						"left": {
							"object": "cutmark",
							"position": "center", 
							"distance": -this.mSettings.distortion_distance_cutmark_center 
						},
						"height": 7,
						"rotation": 270
					}
				]
			} ];

			/// TODO: PATCH FOR ZUND - remove
			var cloudflowSettings = new nixps.patchplanner.CloudflowSettings();
            this.mJSON[0].objects[0].layer = "Thru-cut";
			if (cloudflowSettings.getOutputFormat() === "zund") {
				// this.mJSON[0].objects[0].stroke_color = "white";
			}
			else if (this.mHasLayer) {
				this.mJSON[0].objects[1].layer = this.mLayerName;
				this.mJSON[0].objects[2].layer = this.mLayerName;
			}
			///
		}
	};

	nixps.patchplanner.patch_decorator.prototype = new nixps.patchplanner.mark_decorator();

	nixps.patchplanner.patch_decorator.prototype = $.extend(nixps.patchplanner.patch_decorator.prototype, {

		constructor: nixps.patchplanner.patch_decorator,

		/**
		 * @brief returns true if the patch decorator has a layer
		 */
		has_layer: function() {
			return this.mHasLayer;
		},

		set_object_layer_name : function(object_index,layer_name) {
			this.mJSON[0].objects[object_index]['layer'] = layer_name;
			console.log(this.mJSON[0].objects[object_index]);
		},

		/**
		 * @brief returns the layer name
		 */
		get_layer_name: function() {
			if (! this.has_layer()) {
				throw new Error("invalid parameter");
			}

			return this.mLayerName;
		},


		/** 
		 * @brief adds marks
		 */
		add_mark: function(pLeftDistance, pRightDistance, pMiddleDistance, pMainMark) {
			var markid = nixps.patchplanner.mark_decorator.prototype.add_mark.call(this, pLeftDistance, pRightDistance, pMiddleDistance, pMainMark);
			if (this.mHasLayer) {
				nixps.patchplanner.mark_decorator.prototype.set_layer_name.call(this, markid, this.mLayerName);				
			}

			if (pMainMark === true) {
				var markNumberBackground = {
					"id": "left_number_background_" + markid, 
					"type": "rectangle", 
					"mirror": "both",
					"left": { 
						"object": "left_mark_" + markid, 
						"position": "center",
						"distance": 2
					}, 
					"top": { 
						"object": "left_mark_" + markid, 
						"position": "center",
						"distance": 2
					}, 
					"height": 6,
					"width": 8,
					"fill_color": "white"
				};

				var markNumber = {
					"id": "left_number_" + markid, 
					"type": "text", 
					"text": "${index}", 
					"font": "slugfont", 
					"font_size": 6, 
					"mirror": "vertical",
					"left": { 
						"object": "left_mark_" + markid, 
						"position": "center",
						"distance": -8
					}, 
					"top": { 
						"object": "left_mark_" + markid, 
						"position": "center",
						"distance": 2
					}, 
					"height": 6
				};

				if (this.mHasLayer) {
					markNumberBackground.layer = this.mLayerName;
					markNumber.layer = this.mLayerName;
				}

				this.mJSON[0].objects.push(markNumberBackground);
				this.mJSON[0].objects.push(markNumber);
			}


			return markid;
		},

		/**
		 * @brief returns the margins
		 */
		get_margins: function() {
			var cutline = _.filter(this.mJSON[0].objects, function(pElement) {
				return pElement.id === 'cutmark';
			});

			return {
				left: - _.first(cutline).left.distance,
				right: - _.first(cutline).right.distance,
				top: - _.first(cutline).top.distance,
				bottom: - _.first(cutline).bottom.distance
			};
		},


		/**
		 * @brief sets the margins
		 */
		set_margins: function(p_margins) {
			var cutline = _.filter(this.mJSON[0].objects, function(pElement) {
				return pElement.id === 'cutmark';
			});

			_.first(cutline).left.distance = - p_margins.left;
			_.first(cutline).right.distance = - p_margins.right;
			_.first(cutline).top.distance = - p_margins.top;
			_.first(cutline).bottom.distance = - p_margins.bottom;
		}
	});


	/**
	 * @brief represents a patchplanner layout document
	 */
	nixps.patchplanner.layout_document = function(p_arg_1, p_arg_2) {
		this.m_has_layers = true;

		// Signature with sheet width and height passed
		if (arguments.length === 2)
		{
			if ((typeof p_arg_1 !== 'number') || (typeof p_arg_2 !== 'number')) {
				throw new Error('invalid width and height');
			}

			this.cloudflowSettings = new nixps.patchplanner.CloudflowSettings();

			var template = {
				"resources": {
					"slugfont": [ { "font": this.cloudflowSettings.getSluglineFontPath().getFullPath() } ],
					"white": [ { "cmyk": [0, 0, 0, 0] } ]
				},
				"data": {}
			};

			/// TODO: PATCH FOR ZUND - remove
			var cloudflowSettings = new nixps.patchplanner.CloudflowSettings();
			if (cloudflowSettings.getOutputFormat() === "zund") {
				template.data.cutting = "ZUND";
				this.m_has_layers = false;
			}
			///

			this.m_document = new nixps.layout.document(template);
			this.m_document.add_sheet(new nixps.layout.sheet(parseFloat(p_arg_1), parseFloat(p_arg_2)));

			// Add the production mark
			var production_mark_reference = new nixps.patchplanner.mark_reference(this.cloudflowSettings.getDefaultMarkPath());
			if (! this.m_document.has_resource(production_mark_reference.toString())) {

			}
		}
		else if (arguments.length === 1)
		{
			this.cloudflowSettings = new nixps.patchplanner.CloudflowSettings();

			this.m_document = new nixps.layout.document(p_arg_1);

			var filelist = this.get_filelist();
			if (filelist.length > 0) {
				var that = this;
				var allIds = _.flatten(_.map(filelist, function(pPath) {
				return that.get_patchids(pPath);
				}));

				if (allIds.length > 0) {
					if (this.has_decorator(allIds[0]) === true) {
						this.m_has_layers = this.get_decorator(allIds[0]).has_layer();
					}
				}
			}

		}
		else 
		{
			throw new Error('invalid parameter');
		}

	};

	nixps.patchplanner.layout_document.prototype = {

		constructor: nixps.patchplanner.layout_document,

		/**
		 * @brief validates a filepath
		 */
		_validate_filepath: function(p_unknown)
		{
			if ((! (p_unknown instanceof cloudflow_path)) && (!(p_unknown instanceof nixps.cloudflow.URLPath)))
			{
				throw new Error("invalid parameter");
			}

			if (! p_unknown.is_file()) 
			{
				throw new Error("path is not a file");
			}
		},


		/**
		 * @brief validates a patchid
		 */
		_validate_patchid: function(p_unknown) {
			if ((typeof p_unknown !== 'string') || p_unknown.length === 0) 
			{
				throw new Error('invalid patch id');
			}
		},


		/**
		 * @brief sets the path of the mark
		 */
		set_mark: function(p_jobpath, p_markpath) {
			this._validate_filepath(p_jobpath);
			this._validate_filepath(p_markpath);

			var mark_reference = new nixps.patchplanner.mark_reference(p_jobpath);
			var mark_resource = this.m_document.get_resource(mark_reference.toString());
			var mark_resource_element = mark_resource.get_resource_element(0);

			mark_resource_element.set_file(p_markpath);
		},


		/**
		 * @brief returns the path of the mark
		 */
		get_mark: function(p_jobpath) {
			this._validate_filepath(p_jobpath);

			var mark_reference = new nixps.patchplanner.mark_reference(p_jobpath);
			var mark_resource = this.m_document.get_resource(mark_reference.toString());
			var mark_resource_element = mark_resource.get_resource_element(0);

			return mark_resource_element.get_file();
		},

		set_object_layer_name : function(object_index,layer_name) {
			this.mJSON[0].objects[object_index]['layer'] = layer_name;
			console.log(this.mJSON[0].objects[object_index]);
		},

		/**
		 * @brief returns true if the patch has a decorator
		 */
		has_decorator: function(p_patchid) {
			this._validate_patchid(p_patchid);
			return this.m_document.has_resource("add_two_marks_and_slugline_" + p_patchid);
		},


		/** 
		 * @brief returns the decorator
		 */
		get_decorator: function(p_patchid) {
			this._validate_patchid(p_patchid);

			var patch = this.get_patch(p_patchid);
			var file = patch.get_file();
			var filedata = this.get_file_data(file);

			var mark_reference = new nixps.patchplanner.mark_reference(file);

			var decorator_resource = this.m_document.get_resource("add_two_marks_and_slugline_" + p_patchid);

			var extendedFileData = $.extend({}, patchDecoratorDefaults, filedata);

			var decorator = new nixps.patchplanner.patch_decorator(mark_reference, decorator_resource.to_json(), undefined, {
				slugline_font_size: parseFloat(extendedFileData.slugline_font_size),
				slugline_text: extendedFileData.slugline_text,
				cutmark_line_width: parseFloat(extendedFileData.cutmark_line_width),
				cutmark_stroke_color: extendedFileData.cutmark_stroke_color,
				distortion_text: extendedFileData.distortion_text,
				distortion_font_size: parseFloat(extendedFileData.distortion_font_size),
				distortion_distance_cutmark_left: parseFloat(extendedFileData.distortion_distance_cutmark_left),
				distortion_distance_cutmark_center: parseFloat(extendedFileData.distortion_distance_cutmark_center),
				mark_distance_left: parseFloat(extendedFileData.mark_distance_left),
				mark_distance_right: parseFloat(extendedFileData.mark_distance_right),
				mark_vertical_offset: parseFloat(extendedFileData.mark_vertical_offset),
				mark_snap: extendedFileData.mark_snap
			});

			return decorator;
		},


		/** 
		 * @brief sets the decorator for a patch id
		 */
		set_decorator: function(p_patchid, p_decorator) {
			this._validate_patchid(p_patchid);
			if (! this.has_patch(p_patchid)) {
				throw new Error('invalid parameter');
			}
			if (!(p_decorator instanceof nixps.patchplanner.patch_decorator)) {
				throw new Error('invalid parameter');
			}

			var decorator_resource = new nixps.layout.resource();
			var decorator_json = p_decorator.to_json();
			for(var i = 0; i < decorator_json.length; i++) {
				decorator_resource.add_resource_element(new nixps.layout.generic_resource_element(decorator_json[i]));
			}
			this.m_document.remove_resource("add_two_marks_and_slugline_" + p_patchid);
			this.m_document.add_resource("add_two_marks_and_slugline_" + p_patchid, decorator_resource);
		},


		/**
		 * @brief returns the job decorator
		 */
		get_job_decorator: function(p_jobpath) {
			this._validate_filepath(p_jobpath);
			if (! this.has_file(p_jobpath)) {
				throw new Error('no such file in layout document');
			}

			var id = hex_md5(p_jobpath.get_full_path());
			var decoratorid = "job_decorator_" + id;
			var job_mark_reference = new nixps.patchplanner.job_mark_reference(p_jobpath);
			return new nixps.patchplanner.mark_decorator(job_mark_reference, this.m_document.get_resource(decoratorid).to_json());
		},


		/**
		 * @brief sets the job decorator
		 */
		set_job_decorator: function(p_jobpath, p_decorator) {
			this._validate_filepath(p_jobpath);
			if (! this.has_file(p_jobpath)) {
				throw new Error('no such file in layout document');
			}

			if (! (p_decorator instanceof nixps.patchplanner.mark_decorator)) {
				throw new Error('invalid parameter');
			}

			var decorator_resource = new nixps.layout.resource();
			var decorator_json = p_decorator.to_json();
			for(var i = 0; i < decorator_json.length; i++) {
				decorator_resource.add_resource_element(new nixps.layout.generic_resource_element(decorator_json[i]));
			}

			var id = hex_md5(p_jobpath.get_full_path());
			var decoratorid = "job_decorator_" + id;

			this.m_document.remove_resource(decoratorid);
			this.m_document.add_resource(decoratorid, decorator_resource);
		},


		/**
		 * @brief sets the layout sheet
		 */
		set_sheet: function(p_sheet)
		{
			if (! (p_sheet instanceof nixps.layout.sheet))
			{
				throw new Error('invalid parameter');
			}

			this.m_document.clear_sheets();
			this.m_document.add_sheet(p_sheet);
		},


		/**
		 * @brief returns the layout sheet
		 */
		get_sheet: function() 
		{
			return this.m_document.get_sheet(0);
		},


		/**
		 * @brief returns the sheet element of the placed patch
		 */
		get_sheet_element: function(p_elementid) {
			var found = _.find(this.get_sheet().objects, function(pPlaced) {
				return pPlaced.id === p_elementid;
			});

			if (found.length === 1) {
				return found[0];
			}
			else if (found.length === 0) {
				throw new Error('no such element');
			}
			else {
				throw new Error('more than one element found');	
			}
		},


		/**
		 * @brief returns the file data
		 */
		get_file_data: function(p_filepath) 
		{
			this._validate_filepath(p_filepath);
			if (! this.has_file(p_filepath)) 
			{
				throw new Error("no such file");
			}

			var file_resource = this.get_file(p_filepath);
			return file_resource.get_data();
		},


		/**
		 * @brief sets the file data
		 */
		set_file_data: function(p_filepath, p_data) 
		{	
			this._validate_filepath(p_filepath);
			if (! this.has_file(p_filepath)) 
			{
				throw new Error("no such file");
			}

			var distortion = parseFloat(p_data.distortion);

			var file_resource = this.get_file(p_filepath);
			file_resource.set_data(p_data);

			// Distorition string
			var distortionString = (Math.floor(distortion * 100000) / 1000) + ' %';

			// set the marks for the file
			this.set_mark(p_filepath, new nixps.cloudflow.URLPath(p_data.mark));

			// Keep the patch resources consistent with the job info
			var patchIDs = this.get_patchids(p_filepath);
			var that = this;
			_.each(patchIDs, function(pID) {
				var patch = that.get_patch(pID);
				var decorator = that.get_decorator(pID);
				decorator.set_margins({
					left: parseFloat(p_data.patch_margin_left),
					right: parseFloat(p_data.patch_margin_right),
					top: parseFloat(p_data.patch_margin_top),
					bottom: parseFloat(p_data.patch_margin_bottom)
				});
				that.set_decorator(pID, decorator);
				patch.get_data().pdfname = p_data.slugline_base_name;
				patch.get_data().distortion = distortionString;
			});

			// Keep the layout consistent and change the scale_v of placed labels
			var placedLabels = this.get_sheet().get_resource_objects();
			var labelsToAdapt = _.filter(placedLabels, function(pLabel) {
				return _.contains(patchIDs, pLabel.resource);
			});
			_.each(labelsToAdapt, function(pLabel) {
				pLabel.scale_v = distortion;
			});
		},


		/**
		 * @brief returns the file element
		 */
		get_file: function(p_filepath) 
		{
			this._validate_filepath(p_filepath);

			if (! this.has_file(p_filepath)) 
			{
				throw new Error("no such file");
			}

			var files = this.m_document.get_resource("files");
			var i = 0;
			for(i = 0; i < files.count(); i += 1) 
			{
				if (files.get_resource_element(i).get_file().get_full_path() === p_filepath.get_full_path())
				{
					return files.get_resource_element(i);
				}
			}
		},


		/**
		 * @brief adds a file
		 */
		add_file: function(p_filepath) 
		{
			this._validate_filepath(p_filepath);

			if (this.has_file(p_filepath)) 
			{
				throw new Error("file already present");
			}

			var file_resource = new nixps.layout.file_resource_element(p_filepath);
			var mark_reference = new nixps.patchplanner.mark_reference(p_filepath);
			var mark_resource = new nixps.layout.resource();
			var default_mark = this.cloudflowSettings.getDefaultMarkPath();
			mark_resource.add_resource_element(new nixps.layout.file_resource_element(default_mark));
			if (! this.m_document.has_resource("files")) 
			{
				var files = new nixps.layout.resource();
				files.add_resource_element(file_resource);
				this.m_document.add_resource("files", files);
				this.m_document.add_resource(mark_reference.toString(), mark_resource);
			}
			else 
			{
				this.m_document.get_resource("files").add_resource_element(file_resource);
				this.m_document.add_resource(mark_reference.toString(), mark_resource);
			}

			// Create the production file resource (for cylinder marks)
			// Create the job mark resource
			var job_mark_reference = new nixps.patchplanner.job_mark_reference(p_filepath);
			var job_mark_resource = new nixps.layout.resource();
			var default_job_mark = this.cloudflowSettings.getDefaultJobMarkPath();
			job_mark_resource.add_resource_element(new nixps.layout.file_resource_element(default_job_mark));
			this.m_document.add_resource(job_mark_reference.toString(), job_mark_resource);

			// Create the job decorator
			var job_file_id = hex_md5(p_filepath.get_full_path());
			var job_decorator = new nixps.patchplanner.mark_decorator(job_mark_reference);

			var job_decorator_resource = new nixps.layout.resource();
			var job_decorator_json = job_decorator.to_json();
			for(var i = 0; i < job_decorator_json.length; i++) {
				job_decorator_resource.add_resource_element(new nixps.layout.generic_resource_element(job_decorator_json[i]));
			}
			this.m_document.add_resource("job_decorator_" + job_file_id, job_decorator_resource);

			// Create the job patch
			var job_resource_element = new nixps.layout.file_resource_element(p_filepath);
			job_resource_element.set_decorator("job_decorator_" + job_file_id);

			var job_resource = new nixps.layout.resource();
			job_resource.add_resource_element(job_resource_element);
			this.m_document.add_resource("job_file_" + job_file_id, job_resource);

			this._update_patchdata();
		},

		/**
		 * @brief checks if if has a file
		 */
		has_file: function(p_filepath)
		{
			this._validate_filepath(p_filepath);

			if (! this.m_document.has_resource("files"))
			{
				return false;
			}

			var files = this.m_document.get_resource("files");
			var i = 0;
			for(i = 0; i < files.count(); i += 1) 
			{
				if (files.get_resource_element(i).get_file().get_full_path() === p_filepath.get_full_path())
				{
					return true;
				}
			}

			return false;
		},

		/**
		 * @brief removes a file, and therefore the patches
		 */
		remove_file: function(p_filepath)
		{
			this._validate_filepath(p_filepath);

			if (! this.has_file(p_filepath))
			{
				return;
			}

			// Remove the patches for that file
			this.remove_patches(p_filepath);

			var files = this.m_document.get_resource("files");
			var i = 0;
			for(i = 0; i < files.count(); i += 1) 
			{
				if (files.get_resource_element(i).get_file().get_full_path() === p_filepath.get_full_path())
				{
					var markid = new nixps.patchplanner.mark_reference(p_filepath).toString();
					this.m_document.remove_resource(markid);
					files.remove_resource_element(i);
					var jobmarkid = new nixps.patchplanner.job_mark_reference(p_filepath).toString();
					this.m_document.remove_resource(jobmarkid);
					this.m_document.remove_resource("job_decorator_" + hex_md5(p_filepath.get_full_path()))
					this.m_document.remove_resource("job_file_" + hex_md5(p_filepath.get_full_path()))
					break;
				}
			}

			this._update_patchdata();
		},

		/**
		 * @brief returns the filepath list in the layout document
		 */
		get_filelist: function()
		{
			var filelist = [];

			if (! this.m_document.has_resource("files"))
			{
				return [];
			}

			var files = this.m_document.get_resource("files");
			var i = 0;
			for(i = 0; i < files.count(); i += 1) 
			{
				filelist.push(files.get_resource_element(i).get_file());
			}

			return filelist;
		},

		/**
		 * @brief adds a patch
		 * @warn coordinates relative to cropbox left/bottom
		 */
		add_patch: function(p_id, p_filepath, p_pagenumber, p_sepname, p_x, p_y, p_width, p_height)
		{
			this._validate_filepath(p_filepath);
			if (! this.has_file(p_filepath)) {
				throw new Error('no such parent file: ' + p_filepath.get_full_path());
			}

			var filedata = this.get_file_data(p_filepath);
			var margin_top = 45; 
			var margin_bottom = 45;
			var margin_left = 45;
			var margin_right = 45;
			if (typeof filedata.patch_margin_top === "string") {
				margin_top = parseFloat(filedata.patch_margin_top);
			}
			if (typeof filedata.patch_margin_bottom === "string") {
				margin_bottom = parseFloat(filedata.patch_margin_bottom);
			}
			if (typeof filedata.patch_margin_left === "string") {
				margin_left = parseFloat(filedata.patch_margin_left);
			}
			if (typeof filedata.patch_margin_right === "string") {
				margin_right = parseFloat(filedata.patch_margin_right);
			}


			var patch_id = p_id;

			var mark_reference = new nixps.patchplanner.mark_reference(p_filepath);


			var settings = this.get_settings();
			var markname = "mark";
			//if drill mount then "drill mark"
			if(settings.mounting_method === "drillmount"){
				markname = "Drill Marks";
			}

			var extendedFileData = $.extend({}, patchDecoratorDefaults, filedata);

			var decoratorSettings = {
				slugline_font_size: parseFloat(extendedFileData.slugline_font_size),
				slugline_text: extendedFileData.slugline_text,
				cutmark_line_width: parseFloat(extendedFileData.cutmark_line_width),
				cutmark_stroke_color: extendedFileData.cutmark_stroke_color,
				distortion_text: extendedFileData.distortion_text,
				distortion_font_size: parseFloat(extendedFileData.distortion_font_size),
				distortion_distance_cutmark_left: parseFloat(extendedFileData.distortion_distance_cutmark_left),
				distortion_distance_cutmark_center: parseFloat(extendedFileData.distortion_distance_cutmark_center),
				mark_distance_left: parseFloat(extendedFileData.mark_distance_left),
				mark_distance_right: parseFloat(extendedFileData.mark_distance_right),
				mark_vertical_offset: parseFloat(extendedFileData.mark_vertical_offset),
				mark_snap: extendedFileData.mark_snap,
				min_tall_patch_height: parseFloat(extendedFileData.mark_vertical_offset),
				tall_patch_proportion: parseFloat(extendedFileData.tall_patch_proportion)
			};

			var decorator = new nixps.patchplanner.patch_decorator(mark_reference, undefined, markname, decoratorSettings);
			if (! this.m_has_layers) {
				decorator = new nixps.patchplanner.patch_decorator(mark_reference, undefined, undefined, decoratorSettings);
			}
			decorator.set_margins({
				left: margin_left,
				right: margin_right,
				top: margin_top,
				bottom: margin_bottom
			});

			var distLeft = decoratorSettings.mark_distance_left;
			var distRight = decoratorSettings.mark_distance_right;
			var middle = decoratorSettings.mark_vertical_offset;
			switch(decoratorSettings.mark_snap) {
			case 'top':
				middle += p_height / 2;
				break;

			case 'bottom':
				middle += -p_height / 2;
				break;
			}
			decorator.add_mark(distLeft, distRight, middle, true);

			// Add the marks for tall patches
			var min_height = decoratorSettings.min_tall_patch_height;
			if ((p_height >= min_height) && (p_height >= (decoratorSettings.tall_patch_proportion * p_width))) {
				var middle = p_height * 1/3;
				decorator.add_mark(distLeft, distRight, middle);
				decorator.add_mark(distLeft, distRight, -middle);
			}

			var decorator_resource = new nixps.layout.resource();
			var decorator_json = decorator.to_json();
			for(var i = 0; i < decorator_json.length; i++) {
				decorator_resource.add_resource_element(new nixps.layout.generic_resource_element(decorator_json[i]));
			}
			this.m_document.add_resource("add_two_marks_and_slugline_" + patch_id, decorator_resource);

			var resource_element = new nixps.layout.file_resource_element(p_filepath);
			resource_element.set_page(p_pagenumber);
			resource_element.set_separation(p_sepname);
			resource_element.set_clip_box("cropbox", p_x, p_y, p_width, p_height);
			resource_element.set_decorator("add_two_marks_and_slugline_" + patch_id);

			var patch = new nixps.layout.resource();
			patch.add_resource_element(resource_element);
			this.m_document.add_resource(patch_id, patch);

			this._update_patchdata();

			return patch_id;
		},

		/**
		 * @brief removes the patches for a file
		 */
		remove_patches: function(p_filepath)
		{
			this._validate_filepath(p_filepath);

			var that = this;
			var ids = this.get_patchids(p_filepath);
			_.each(ids, function(pID) {
				that.remove_patch(pID);
			});

			this._update_patchdata();
		},


		/**
		 * @brief returns the patch ids for a file
		 */
		get_patchids: function(p_filepath)
		{
			if (p_filepath === undefined) {
				var patchids = [];

				var l_this = this;
				var resource_ids = this.m_document.get_resources();
				_.each(resource_ids, function(p_id) {
					var patch = l_this.m_document.get_resource(p_id);
					if ((patch.count() === 1) 
						&& (patch.get_resource_element(0) instanceof nixps.layout.file_resource_element)
						&& (patch.get_resource_element(0).has_clip_box())) {
						var resource_element = patch.get_resource_element(0);
						patchids.push(p_id);
					}
				});

				return patchids;
			}

			this._validate_filepath(p_filepath);

			var patchids = [];

			var l_this = this;
			var resource_ids = this.m_document.get_resources();
			_.each(resource_ids, function(p_id) {
				var patch = l_this.m_document.get_resource(p_id);
				if ((patch.count() === 1) 
					&& (patch.get_resource_element(0) instanceof nixps.layout.file_resource_element)
					&& (patch.get_resource_element(0).has_clip_box())) {
					var resource_element = patch.get_resource_element(0);
					if (resource_element.get_file().get_full_path() === p_filepath.get_full_path())
					{
						patchids.push(p_id);
					}
				}
			});

			return patchids;
		},


		/**
		 * @brief returns the placed patchids
		 */
		get_placed_patchids: function(p_filepath) 
		{
			var sheet = this.get_sheet();
			var placed_resource_ids = _.uniq(_.map(sheet.get_resource_objects(), function(object) {
				return object.resource;
			}));

			if (p_filepath === undefined) {
				return placed_resource_ids;
			}

			this._validate_filepath(p_filepath);

			var that = this;
			placed_resource_ids = _.filter(placed_resource_ids, function(p_id) {
				var patch = that.m_document.get_resource(p_id);
				if ((patch.count() === 1) 
					&& (patch.get_resource_element(0) instanceof nixps.layout.file_resource_element)
					&& (patch.get_resource_element(0).has_clip_box())) {
					var resource_element = patch.get_resource_element(0);
					if (resource_element.get_file().get_full_path() === p_filepath.get_full_path())
					{
						return true;
					}
				}
			});

			return placed_resource_ids;
		},
		/**
		 * Like remove_patch but does not update index for separated resources
		 * @param p_id
		 */
		hide_patch: function(p_id)
		{
			this._validate_patchid(p_id);
			this.m_document.remove_resource(p_id);
			this.get_sheet().remove_resource_ids([ p_id ]);
			this.m_document.remove_resource('add_two_marks_and_slugline_' + p_id);
		},

		/**
		 * @brief removes a patch
		 */
		remove_patch: function(p_id)
		{
			this._validate_patchid(p_id);

			this.m_document.remove_resource(p_id);
			this.get_sheet().remove_resource_ids([ p_id ]);
			this.m_document.remove_resource('add_two_marks_and_slugline_' + p_id);
			this._update_patchdata();
		},

		/**
		 *  @brief returns the resource element associated with id
		 */
		get_patch: function(p_id)
		{
			this._validate_patchid(p_id);

			return this.m_document.get_resource(p_id).get_resource_element(0);
		},


		/**
		 * @brief returns true if there is a patch with such an id
		 */
		has_patch: function(p_id) {
			this._validate_patchid(p_id);

			return this.m_document.has_resource(p_id);
		},


		/**
		 * @brief [private] updates the patch data for all the patches
		 */
		_update_patchdata: function() {
			var filelist = this.get_filelist();
			var that = this;

			_.each(filelist, function(p_file) {
				var filedata = that.get_file_data(p_file);
				var patchIDs = that.get_patchids(p_file);
				var patches = _.map(patchIDs, function(pID) {
					return that.get_patch(pID);
				});
				patches = _.sortBy(patches, function(pPatch) {
					return pPatch.get_separation();
				});

				var distortion = (Math.floor(filedata.distortion * 100000) / 1000) + ' %';				

				var index = 1;

				_.each(patches, function(pPatch) {
					var sepname = pPatch.get_separation();
					pPatch.set_data({
						index: (new Number(index)).toString(),
						pdfname: filedata.slugline_base_name,
						sepname: sepname,
						distortion: distortion
					});

					index++;
				});
			});
		},


		/** 
		 * @brief sets the settings for patchplanner
		 */
		set_settings: function(p_settings) {

			if (! $.isPlainObject(p_settings))
			{
				throw new Error('invalid settings object');	
			}

			/// TODO: PATCH FOR ZUND - remove
			var cloudflowSettings = new nixps.patchplanner.CloudflowSettings(this.get_overrides());
			if (cloudflowSettings.getOutputFormat() === "zund") {
				p_settings.cutting = "ZUND";
			}
			///

			this.m_document.m_json.data = p_settings;
		},


		/**
		 * @brief returns the settings for the layout document
		 */
		get_settings: function() {
			if (typeof this.m_document.m_json.data !== "object") {
				this.m_document.m_json.data = {};
			}

			var settings = this.m_document.m_json.data;
			if (settings.mounting_method !== 'drillmount' && settings.mounting_method !== 'mom' && settings.mounting_method !== 'mirror' && settings.mounting_method !== 'mirrormom' && settings.mounting_method !== 'heaford') {
				settings.mounting_method = 'mom';	
			}

			return settings;
		},
		/** 
		 * @brief sets the overrides for default settings
		 */
		set_overrides: function(p_settings) {
			this.m_document.m_json['overrides'] = p_settings;
		},
		/**
		 * @brief returns the overrides for default settings
		 */
		get_overrides: function() {
			if(this.m_document){
				if (typeof this.m_document.m_json['overrides'] !== "object") {
					this.m_document.m_json['overrides'] = {};
				}
				return this.m_document.m_json['overrides'];
			}
			return {};
		},

		/**
		 * @brief returns the json
		 */
		to_json: function() 
		{
			return this.m_document.to_json();
		}
	};

}());
