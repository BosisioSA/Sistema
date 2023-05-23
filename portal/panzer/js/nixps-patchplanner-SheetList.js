/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, window, jQuery, cloudflow_path */

/*global panzer_layout_edition_sheet, _*/
/*global nixps, namespace */

(function( $ ) {


    $.widget("nixps-patchplanner.SheetList", {

        options: {

        	patchInfo: null,

        	showDeleteButton: false,

            search: false

        },


        _create: function() {
        	this.element.addClass(this.widgetFullName);

        	if ((this.options.patchInfo instanceof nixps.patchplanner.PatchInfo) === false) {
        		throw new Error('invalid patch info');
        	}

            $('<div>').css({
                width: "100%",
                textAlign: "right"
            }).append($('<input>')
                .addClass('search')
                .attr('placeholder', 'find sheet')
                .css({
                    marginRight: 3,
                    marginTop: 3,
                    height: "1.3em",
                    paddingTop: 4,
                    paddingBottom: 4,
                    paddingLeft: 7,
                    lineHeight: "inherit"
                })
            ).appendTo(this.element);
        	$('<table>').css({
        		width: "100%"
        	}).append($("<tbody>").addClass('sheetlist')).appendTo(this.element);

            if (typeof this.options.search === 'string' && this.options.search.length > 0) {
                this.find('.search').val(search);
            }

        	this._draw();

        	this._on(this.element, {
                'keyup .search': this._filter,
        		'click tr': this._itemClickedHandler,
        		'click .expandButton': this._expandClickedHandler,
        		'click .collapseButton': this._collapseClickedHandler,
        		'click .remove': this._removeClickedHandler
        	});
		},


        _filter: function(pEvent) {
            var input = $(pEvent.target);
            var searchString = input.val();

            clearTimeout(this.timerID);
            this.timerID = this._delay(function() {
                this.option('search', searchString);
            }, 500);
        },


		_removeClickedHandler: function(pEvent) {
			var target = $(pEvent.target);
			target = target.closest('tr');

			this._trigger("remove", null, {
				sheetname: target.data('sheet')
			});
		},


		_itemClickedHandler: function(pEvent) {
			var target = $(pEvent.target);
			target = target.closest('tr');

			this.element.find("tr").removeClass('selected');
			target.addClass('selected');

			this._trigger('selectionchanged', null, {
				sheetname: target.data("sheet")
			});
		},


		_expandClickedHandler: function(pEvent) {
			var target = $(pEvent.target);
			target = target.closest('tr');

			var expandButton = target.find('.expandButton');

			expandButton.removeClass('expandButton');
			expandButton.addClass('collapseButton');
			expandButton.removeClass('ui-icon-triangle-1-e');
			expandButton.addClass('ui-icon-triangle-1-s');


			var info = this.options.patchInfo;
			var sheetPlacement = info.getJobsForSheet(target.data('sheet'));

			var sheetList = $('<ul>');
			_.each(_.pairs(sheetPlacement), function(kvpair) {
				sheetList.append($('<li>').text(kvpair[0] + " (" + kvpair[1] + ")"));
			});


			var infoPanel = $('<div>').addClass('sheetinfo').css({
				width: '100%'
			}).append(sheetList);
			target.append(infoPanel);
		},


		_collapseClickedHandler: function(pEvent) {
			var target = $(pEvent.target);
			target = target.closest('tr');

			var expandButton = target.find('.collapseButton');

			expandButton.addClass('expandButton');
			expandButton.removeClass('collapseButton');
			expandButton.addClass('ui-icon-triangle-1-e');
			expandButton.removeClass('ui-icon-triangle-1-s');

			target.find('.sheetinfo').remove();
		},


		redraw: function() {
			this._draw();
		},


		_draw: function() {
			var sheetList = this.element.find('.sheetlist');
            var doSearch = typeof this.options.search === 'string' && this.options.search.length > 0;
			sheetList.empty();

			var patchInfo = this.options.patchInfo;
			var sheets = patchInfo.getSheets();

			for(var i = 0; i < sheets.length; i++) {
				var sheet = sheets[i],
					placedCount = patchInfo.getPlacedPatchCountForSheet(sheet);

                // Skip jobs that don't match the search string
                if (doSearch === true && sheet.indexOf(this.options.search) < 0) {
                    continue;
                }

				var row = $('<tr>');

				if (placedCount > 0) {
					row.append($('<td>').append($('<div>').addClass('ui-icon ui-icon-triangle-1-e expandButton')))
				}
				else {
					row.append($('<td>').append($('<div>').addClass('ui-icon')))
				}
				row.append($('<td>').text(sheet).css({
					'white-space': 'nowrap'
				})).append($('<td>').text(placedCount).css({
					'text-align': 'right',
					'width': '99%'
				}));

				if (this.options.showDeleteButton === true) {
					row.append($("<td>").addClass('remove').html("&times;").css({
						'font-size': 20
					}));
				}

				row.appendTo(sheetList).data('sheet', sheet);
			}
		},


		hasSelectedSheet: function() {
			return this.element.children('tr.selected').length !== 0;
		},


		getSelectedSheet: function() {
			return this.element.find('tr.selected').data('sheet');
		},


		_setOption: function(pKey, pValue) {
			if (pKey === "patchInfo") {
				this._super(pKey, pValue);
				this._draw();
			}
            else if (pKey === "search") {
                if (typeof pValue !== "string" || pValue.length <= 0) {
                    this._super("search", false);
                }
                else {
                    this._super("search", pValue);
                }
                this._draw();
            }
		}

    });

}(jQuery));
