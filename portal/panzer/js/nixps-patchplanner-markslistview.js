/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, _, api, jQuery, cloudflow_path*/
/*global panzer_filelist, nixps*/
/*global panzer_layout_edition_sheet*/
/*global console, clearTimeout*/


(function( $ ) {

	/**
	 * @brief function returns true if the asset has a thumb
	 */
	function hasThumb(pAsset) {
		return pAsset.thumb !== undefined;
	}


	/**
	 * @brief function returns the thumb url
	 */
	function thumbURL(pAsset) {
		return pAsset.thumb;
	}


	/**
	 * A jQueryUI plugin to show the list of marks
	 */
	$.widget("nixps-patchplanner.markslistview", {

		options: {

			/**
			 * @brief the folder where the marks are located
			 */
			marksFolder: (new nixps.patchplanner.CloudflowSettings()).getMarksPath(),


			/**
			 * @brief refreshes the view, true/false
			 */
			refresh: true,


			/**
			 * @brief the readonly flag
			 */
			readonly: false
			
		},


		/**
		 * @brief constructor
		 */
		_create: function() {
			// Set the css class
			this.element.addClass(this.widgetFullName);

			// The current marks displayed in the list
			this.currentMarks = [];
			this.currentTimer = -1;

			this._timedUpdate();

			this._on(this.element, {
				'click .item': this._clickItemHandler
			});
		},


		/**
		 * @brief creates a new item in the list view
		 */
		_createItem: function(pAsset) {
			var thumburl = pAsset.thumb;
			var filename = (new nixps.cloudflow.URLPath(pAsset.cloudflow.file)).getName();

			var item = $('<div>');
			item.addClass('item');
			item.css({
				'margin-top': 5,
				'margin-bottom': 5,
				'padding': 5
			});
			item.attr('markpath', (new nixps.cloudflow.URLPath(pAsset.cloudflow.file)).getFullPath());

			var thumbnail = $('<img>').attr('src', thumburl).attr('width', 16);
			thumbnail.css({
				'vertical-align': 'middle',
				'margin-right': 10
			});
			thumbnail.appendTo(item);

			var name = $('<label>');
			name.text(filename);
			name.appendTo(item);

			return item;
		},


		/**
		 * @brief updates the view each 5 seconds
		 */
		_timedUpdate: function() {
			this.redraw();

			if (this.options.refresh) {
				this.currentTimer = this._delay(this._timedUpdate, 5000);
			}
		},


		/**
		 * @brief returns true if updates were found
		 */
		_update: function() {
			var currentThumbails = _.map(_.filter(this.currentMarks, hasThumb), thumbURL);

			var newMarks = nixps.patchplanner.util.get_folder_contents_list(this.options.marksFolder);
			var newThumbnails = _.map(_.filter(newMarks, hasThumb), thumbURL);

			var intersection = _.intersection(newThumbnails, currentThumbails);
			if ((intersection.length !== currentThumbails.length) || 
				(intersection.length !== newThumbnails.length))
			{
				newMarks.sort(function(a, b) {
					return a.cloudflow.file > b.cloudflow.file;
				});

				this.currentMarks = newMarks;
				_.each(this.currentMarks, function(pMarkPath) {
		            api_async.proofscope.render(pMarkPath);
				});

				return true;
			}

			return false;
		},


		/**
		 * @brief updates the view
		 */
		redraw: function() {
			if (this._update()) {
				this._draw();
			}
		},


		/**
		 * @brief draws the marks list widget
		 */
		_draw: function() {
			var that = this;
			this.element.children().remove();

			if (this.currentMarks.length === 0) {
				// A special case for empty
			}
			else {
				_.each(this.currentMarks, function(pAsset) {
					that.element.append(that._createItem(pAsset));
				});
			}
            
            this.element.toggleClass('readonlyMode', this.options.readonly);
		},


		/**
		 * @brief sets the current selection
		 */
		setSelected: function(pMarkPath) {
			if (! (pMarkPath instanceof nixps.cloudflow.URLPath)) {
				throw new Error('invalid parameter');
			}

			this.element.children().removeClass('selected');
			this.element.children('.item[markpath="' + pMarkPath.getFullPath() + '"]').addClass('selected');
		},


		/**
		 * @brief returns the current selected path
		 */
		getSelected: function() {
			return new nixps.cloudflow.URLPath(this.element.children('.item.selected').attr('markpath'));
		},


		/**
		 * @brief handles item clicks
		 */
		_clickItemHandler: function(pEvent) {
			if (this.options.readonly === true) {
				return;
			}

			var target = $(pEvent.target);
			if (! target.hasClass('item')) {
				target = target.parents('.item');
			}
			this.setSelected(new nixps.cloudflow.URLPath(target.attr('markpath')));
			this._trigger('selectionchanged');
		},


		/**
		 * @brief sets a widget option
		 */
		_setOption: function(p_key, p_value) {
            if (p_key === "readonly" && typeof p_value === "boolean") {
                this.element.toggleClass('readonlyMode', p_value);
            }
			return this._superApply(arguments);
		},

		/**
		 * @brief destructor
		 */
		_destroy: function() {
			this._super();
			clearTimeout(this.currentTimer);
		}

	});

}(jQuery));
