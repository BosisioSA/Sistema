/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, $, document, lang_es, lang_en, _, cloudflow_path */
/*global namespace, nixps, api_sync*/
/*global panzer_filelist*/

(function() {

	namespace("nixps.patchplanner");

	/**
	 * @brief creates the job settings
	 * @param pFile the cloudflow path of the file to which the settings apply
	 * @param pJSON the json parameters saved in the job, optional.  
	 *				If not provided the job settings are initialized with the default values.
	 */
	nixps.patchplanner.job_settings = function(pFile, pJSON) {
		if ((! (pFile instanceof cloudflow_path)) && (! (pFile instanceof nixps.cloudflow.URLPath))) {
			throw new Error('invalid parameter');
		}

		var cloudflowSettings = new nixps.patchplanner.CloudflowSettings();

		this.mFile = pFile;

		var default_base_name = decodeURI(pFile.get_name().substr(0, pFile.get_name().indexOf('.')));

		this.mJSON = {
			margin_left: 144,
			margin_top: 144,
			distortion: 1.0,
			cilinder_circumference: 5472,
			cilinder_width: 8496,
			slugline_base_name: default_base_name,
			thickness_paper: 0.288,
			thickness_mylar: 0,
			thickness_tape: 0.288,
			thickness_plate: 0,
			mark: cloudflowSettings.getDefaultMarkPath().get_full_path(),
			patch_margin_left: 63,
			patch_margin_right: 63,
			patch_margin_top: 45,
			patch_margin_bottom: 45,
			mirror_mount_distortion: 1.0,
			mirror_mount_separation: '',
			drill_mount_die_separation:'',
			drill_mount_carrier_box:'artbox'
		};

		this.mJSON = $.extend(this.mJSON, {
			// Patch rendering settings
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
			mark_snap: "middle"
		}, cloudflowSettings.getPatchDecoratorPreferences())

		if (pJSON !== undefined) {
			if (! $.isPlainObject(pJSON)) {
				throw new Error('invalid json');
			}

			var that = this;
			_.each(_.pairs(pJSON), function(pPair) {
				if ((pPair[0] === 'margin_left')
					|| (pPair[0] === 'margin_top')
					|| (pPair[0] === 'distortion')
					|| (pPair[0] === 'mirror_mount_distortion')
					|| (pPair[0] === 'cilinder_circumference')
					|| (pPair[0] === 'cilinder_width')
					|| (pPair[0] === 'thickness_paper')
					|| (pPair[0] === 'thickness_mylar')
					|| (pPair[0] === 'thickness_tape')
					|| (pPair[0] === 'thickness_plate')
					|| (pPair[0] === 'patch_margin_top')
					|| (pPair[0] === 'patch_margin_bottom')
					|| (pPair[0] === 'patch_margin_left')	
					|| (pPair[0] === 'patch_margin_right')) {

					if ((typeof pPair[1] !== 'string') || (pPair[1].length === 0)) {
						throw new Error('invalid parameter: ' + pPair[0]);
					}

					if (pPair[0] === 'distortion') {
						var checkValue = parseFloat(pPair[1]);
						if ((checkValue > 1) || (checkValue < 0)) {
							throw new Error('invalid distortion: ' + checkValue);
						}
					}

					if (pPair[0] === 'mirror_mount_distortion') {
						var checkValue = parseFloat(pPair[1]);
						if ((checkValue > 1) || (checkValue < 0)) {
							throw new Error('invalid mirror mount distortion: ' + checkValue);
						}
					}

					that.mJSON[pPair[0]] = parseFloat(pPair[1]);
				}

				if (pPair[0] === 'reference_box' || pPair[0] === 'drill_mount_carrier_box') {

					if ((typeof pPair[1] !== 'string') && (pPair[1].length === 0)) {
						throw new Error('invalid parameter: ' + pPair[0]);
					}	

					if ((pPair[1] !== 'artbox') 
						&& (pPair[1] !== 'cropbox') 
						&& (pPair[1] !== 'mediabox') 
						&& (pPair[1] !== 'bleedbox') 
						&& (pPair[1] !== 'trimbox'))
					{
						throw new Error('invalid parameter: ' + pPair[1]);
					}

					that.mJSON[pPair[0]] = pPair[1];
				}

				if (pPair[0] === 'slugline_base_name') {
					if ((typeof pPair[1] !== 'string') && (pPair[1].length === 0)) {
						throw new Error('invalid parameter: ' + pPair[0]);
					}

					that.mJSON[pPair[0]] = pPair[1];	
				}

				if (pPair[0] === 'mark') {
					if ((typeof pPair[1] !== 'string') && (pPair[1].length === 0)) {
						throw new Error('invalid parameter: ' + pPair[0]);
					}

					var mark_path = new nixps.cloudflow.URLPath(pPair[1]);

					if (! mark_path.is_file()) {
						throw new Error('invalid parameter: ' + pPair[0]);
					}

					that.mJSON[pPair[0]] = mark_path.get_full_path();
				}

				if (pPair[0] === 'mirror_mount_separation' || pPair[0] === 'drill_mount_die_separation') {
					if (typeof pPair[1] !== 'string') {
						throw new Error('invalid parameter: ' + pPair[0]);
					}

					that.mJSON[pPair[0]] = pPair[1];
				}

				var patchSettingKeys = [
					'slugline_font_size',
					'slugline_text',
					'cutmark_line_width',
					'cutmark_stroke_color',
					'distortion_text',
					'distortion_font_size',
					'distortion_distance_cutmark_left',
					'distortion_distance_cutmark_center',
					'mark_distance_left',
					'mark_distance_right', 
					'mark_vertical_offset', 
					'mark_snap'
				];

				if (patchSettingKeys.indexOf(pPair[0]) > -1) {
					that.mJSON[pPair[0]] = pPair[1];
				}
			});
		}
	};

	nixps.patchplanner.job_settings.prototype = {

		/** 
		 * @brief returns the left margin
		 */
		get_margin_left: function() {

			return this.mJSON.margin_left;
		},


		/**
		 * @brief returns the right margin
		 */
		get_margin_top: function() {
			return this.mJSON.margin_top;
		},


		/**
		 * @brief sets the margins
		 */
		set_margins: function(p_margin_left, p_margin_top) {
			if ((typeof p_margin_left !== 'number') 
				|| (typeof p_margin_top !== 'number')) {
				throw new Error('invalid parameter');
			}

			this.mJSON.margin_left = p_margin_left;
			this.mJSON.margin_top = p_margin_top;
		},


		/**
		 * @brief sets the patch margins
		 */
		set_patch_margins: function(p_margins) {
			if ((typeof p_margins.top !== "number")
				|| (typeof p_margins.left !== "number")
				|| (typeof p_margins.right !== "number")
				|| (typeof p_margins.bottom !== "number")) {
				throw new Error("invalid margins object supplied");
			}

			this.mJSON.patch_margin_top = p_margins.top;
			this.mJSON.patch_margin_left = p_margins.left;
			this.mJSON.patch_margin_right = p_margins.right;
			this.mJSON.patch_margin_bottom = p_margins.bottom;
		},


		/**
		 * @brief returns the patch margins
		 */
		get_patch_margins: function() {
			return {
				left: this.mJSON.patch_margin_left,
				right: this.mJSON.patch_margin_right,
				top: this.mJSON.patch_margin_top,
				bottom: this.mJSON.patch_margin_bottom
			};
		},


		/** 
		 * @brief returns the distortion
		 */
		get_distortion: function() {
			return this.mJSON.distortion;
		},


		/**
		 * @brief sets the distortion
		 */
		set_distortion: function(p_distortion) {
			if (typeof p_distortion !== 'number') {
				throw new Error('invalid parameter');
			}

			if ((p_distortion < 0) || (p_distortion > 1)) {
				throw new Error('invalid distortion');
			}

			var unit = (new nixps.cloudflow.UnitPreferences()).getDefinition('distortion');
			var accuracy = unit.getAccuracy() + 2;
			var factor = Math.pow(10, accuracy);

            this.mJSON.distortion = (Math.floor(p_distortion * factor) / factor).toFixed(accuracy);
		},


		/** 
		 * @brief returns the cilinder circumference
		 */
		get_cilinder_circumference: function() {
			return this.mJSON.cilinder_circumference;
		},


		/**
		 * @brief sets the cilinder circumference
		 */
		set_cilinder_circumference: function(p_circumference) {
			if (typeof p_circumference !== 'number') {
				throw new Error('invalid parameter');
			}

			this.mJSON.cilinder_circumference = p_circumference;
		},


		/**
		 * @brief returns the cilinder width
		 */
		get_cilinder_width: function() {
			return this.mJSON.cilinder_width;
		},


		/**
		 * @brief sets the cilinder width
		 */
		set_cilinder_width: function(p_width) {
			if (typeof p_width !== 'number') {
				throw new Error('invalid parameter');
			}

			this.mJSON.cilinder_width = p_width;
		},


		/**
		 * @brief returns the reference box
		 */
		get_reference_box: function() {
			return this.mJSON.reference_box;
		},


		/**
		 * @brief sets the cilinder box
		 */
		set_reference_box: function(p_box) {
			if ((p_box !== 'artbox') 
				&& (p_box !== 'cropbox') 
				&& (p_box !== 'mediabox') 
				&& (p_box !== 'bleedbox') 
				&& (p_box !== 'trimbox'))
			{
				throw new Error('invalid parameter: ' + p_box);
			}

			this.mJSON.reference_box = p_box;
		},


		/**
		 * @brief returns the base name
		 */
		get_slugline_base_name: function() {
			return this.mJSON.slugline_base_name;
		},


		/**
		 * @brief sets the base name
		 */
		set_slugline_base_name: function(p_base_name) {
			if ((typeof p_base_name !== 'string')
				|| (p_base_name.length === 0)) {
				throw new Error('invalid parameter');
			}

			this.mJSON.slugline_base_name = p_base_name;
		},


		/**
		 * @brief returns the paper thickness
		 */
		get_paper_thickness: function() {
			return this.mJSON.thickness_paper;
		},


		/**
		 * @brief sets the paper thickness
		 */
		set_paper_thickness: function(p_thickness) {
			if (typeof p_thickness !== 'number') {
				throw new Error('invalid parameter');
			}

			this.mJSON.thickness_paper = p_thickness;
		},


		/**
		 * @brief returns the paper thickness
		 */
		get_mylar_thickness: function() {
			return this.mJSON.thickness_mylar;
		},


		/**
		 * @brief sets the mylar thickness
		 */
		set_mylar_thickness: function(p_thickness) {
			if (typeof p_thickness !== 'number') {
				throw new Error('invalid parameter');
			}

			this.mJSON.thickness_mylar = p_thickness;
		},


		/**
		 * @brief returns the paper thickness
		 */
		get_tape_thickness: function() {
			return this.mJSON.thickness_tape;
		},


		/**
		 * @brief sets the tape thickness
		 */
		set_tape_thickness: function(p_thickness) {
			if (typeof p_thickness !== 'number') {
				throw new Error('invalid parameter');
			}

			this.mJSON.thickness_tape = p_thickness;
		},


		/**
		 * @brief returns the paper thickness
		 */
		get_plate_thickness: function() {
			return this.mJSON.thickness_plate;
		},


		/**
		 * @brief sets the plate thickness
		 */
		set_plate_thickness: function(p_thickness) {
			if (typeof p_thickness !== 'number') {
				throw new Error('invalid parameter');
			}

			this.mJSON.thickness_plate = p_thickness;
		},


		/**
		 * @brief returns the mark for this job
		 */
		get_mark: function() {
			return this.mJSON.mark;
		},


		/**
		 * @brief sets the mark for the job
		 */
		set_mark: function(p_mark_path) {
			if ((! (p_mark_path instanceof cloudflow_path)) && (! (p_mark_path instanceof nixps.cloudflow.URLPath))) {
				throw new Error('invalid parameter');
			}

			if (! (p_mark_path.is_file())) {
				throw new Error('invalid parameter');
			}

			this.mJSON.mark = p_mark_path.get_full_path();
		},


		/**
		 * @brief returns the mirror distortion
		 */
		get_mirror_mount_distortion: function() {
			var distortion = this.mJSON.mirror_mount_distortion;

			if (typeof distortion === "number") {
				return distortion;
			}
			return 1.0;
		},


		/**
		 * @brief sets the mirror mount distortion
		 */
		set_mirror_mount_distortion: function(distortion) {
			if (typeof distortion !== "number") {
				throw new Error('invalid parameter');
			}

			this.mJSON.mirror_mount_distortion = distortion;
		},


		/**
		 * @brief returns the mirror mount separation
		 */
		get_mirror_mount_separation: function() {
			var separation = this.mJSON.mirror_mount_separation;

			if (typeof separation !== 'string') {
				return '';
			}

			return separation;
		},


		/**
		 * @brief sets the mirror mount separation
		 */
		set_mirror_mount_separation: function(separation) {
			if (typeof separation !== 'string') {
				throw new Error('invalid parameter');
			}

			this.mJSON.mirror_mount_separation = separation;	
		},
		/**
		 * @brief returns the drill mount die separation
		 */
		get_drill_mount_die_separation: function() {
			var separation = this.mJSON.drill_mount_die_separation;

			if (typeof separation !== 'string') {
				return '';
			}

			return separation;
		},


		/**
		 * @brief sets the drill mount die  separation
		 */
		set_drill_mount_die_separation: function(separation) {
			if (typeof separation !== 'string') {
				throw new Error('invalid parameter');
			}

			this.mJSON.drill_mount_die_separation = separation;	
		},
		/**
		 * @brief returns the drill_mount_carrier_box
		 */
		get_drill_mount_carrier_box: function() {
			var carrier_box = this.mJSON.drill_mount_carrier_box;

			if (typeof carrier_box !== 'string') {
				return '';
			}

			return carrier_box;
		},


		/**
		 * @brief sets the drill_mount_carrier_box
		 */
		set_drill_mount_carrier_box: function(carrier_box) {
			if (typeof carrier_box !== 'string') {
				throw new Error('invalid parameter');
			}
			this.mJSON.drill_mount_carrier_box = carrier_box;	
		},
		/**
		 * @brief returns the json representation of the job settings
		 */
		to_json: function() {
            var metadata = api_sync.asset.list(['cloudflow.part', 'equal to', this.mFile.get_full_path()]);
            metadata = metadata.results[0];
            var artbox = metadata.metadata.page_boxes.art;
            var cropbox = metadata.metadata.page_boxes.crop;
            var left_artbox = artbox[0] - cropbox[0];
            var bottom_artbox = artbox[1] - cropbox[1];

            var job_settings = {};
            job_settings.margin_left = this.mJSON.margin_left.toString();
            job_settings.margin_top = this.mJSON.margin_top.toString();
            job_settings.distortion = this.mJSON.distortion.toString();
            job_settings.cilinder_circumference = this.mJSON.cilinder_circumference.toString();
            job_settings.cilinder_width = this.mJSON.cilinder_width.toString();
            job_settings.reference_box = "artbox";
            job_settings.carrier_box_width = this.mJSON.cilinder_width.toString(); 
            job_settings.carrier_box_height = this.mJSON.cilinder_circumference.toString();
            job_settings.carrier_box_x = (left_artbox - this.mJSON.margin_left).toString();
            job_settings.carrier_box_y = (bottom_artbox + this.mJSON.margin_top).toString();
            job_settings.slugline_base_name = this.mJSON.slugline_base_name;
            job_settings.thickness_plate = (this.mJSON.thickness_plate).toString();
            job_settings.thickness_tape = (this.mJSON.thickness_tape).toString();
            job_settings.thickness_mylar = (this.mJSON.thickness_mylar).toString();
            job_settings.thickness_paper = (this.mJSON.thickness_paper).toString();
            job_settings.patch_margin_top = (this.mJSON.patch_margin_top).toString();
            job_settings.patch_margin_bottom = (this.mJSON.patch_margin_bottom).toString();
            job_settings.patch_margin_left = (this.mJSON.patch_margin_left).toString();
            job_settings.patch_margin_right = (this.mJSON.patch_margin_right).toString();
            job_settings.mirror_mount_separation = this.get_mirror_mount_separation().toString();
            job_settings.mirror_mount_distortion = this.get_mirror_mount_distortion().toString();
            job_settings.mark = this.mJSON.mark;
            job_settings.drill_mount_die_separation = this.get_drill_mount_die_separation().toString();
			job_settings.drill_mount_carrier_box =this.get_drill_mount_carrier_box().toString();

			// Patch rendering settings
			job_settings.slugline_font_size = this.mJSON.slugline_font_size.toString();
			job_settings.slugline_text = this.mJSON.slugline_text.toString();
			job_settings.cutmark_line_width = this.mJSON.cutmark_line_width.toString();
			job_settings.cutmark_stroke_color = this.mJSON.cutmark_stroke_color.toString();
			job_settings.distortion_text = this.mJSON.distortion_text.toString();
			job_settings.distortion_font_size = this.mJSON.distortion_font_size.toString();
			job_settings.distortion_distance_cutmark_left = this.mJSON.distortion_distance_cutmark_left.toString();
			job_settings.distortion_distance_cutmark_center = this.mJSON.distortion_distance_cutmark_center.toString();
			job_settings.mark_distance_left = this.mJSON.mark_distance_left.toString();
			job_settings.mark_distance_right = this.mJSON.mark_distance_right.toString();
			job_settings.mark_vertical_offset = this.mJSON.mark_vertical_offset.toString();
			job_settings.mark_snap = this.mJSON.mark_snap.toString();
			
            return job_settings;
		}		

	};

}());