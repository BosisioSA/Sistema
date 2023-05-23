/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, window, jQuery, cloudflow_path */

/*global panzer_layout_edition_sheet, _*/
/*global nixps, namespace, Spinner */

(function( $ ) {

    $.widget("nixps-patchplanner.freeze_panel", {

        options: {
        	/**
        	 * @brief the waiting text
        	 */
        	text: null
        },

        /**
         * @brief constructor
         */
        _create: function() {
            // Create if not present
            this.element.css({
                left: 0,
                top: 0,
                bottom: 0,
                right: 0,
                position: 'fixed',
                zIndex: 50000,
                'background-color': 'rgba(0,0,0, 0.5)'
            });

            if ((typeof this.options.text === "string") && (this.options.text.length !== 0)) {
                var textDiv = $('<div>');
                textDiv.css({
                    position: 'absolute',
                    'font-family': 'Futura, Arial, sans',
                    'font-size': 14,
                    color: 'white',
                    'max-width': 100,
                    'text-align': 'center',
                    'text-shadow': '1px 1px 0 #555, 1px -1px 0 #555, -1px 1px 0 #555, -1px -1px 0 #555'
                });
                textDiv.text(this.options.text);
                this.element.append(textDiv);
                textDiv.position({
                    my: 'center',
                    at: 'center',
                    of: this.element
                });
            }

            // create the spinner on the freeze panel
            var options = {
                lines: 17, // The number of lines to draw
                length: 0, // The length of each line
                width: 16, // The line thickness
                radius: 60, // The radius of the inner circle
                corners: 1, // Corner roundness (0..1)
                rotate: 0, // The rotation offset
                direction: 1, // 1: clockwise, -1: counterclockwise
                color: '#fff', // #rgb or #rrggbb
                speed: 1.2, // Rounds per second
                trail: 32, // Afterglow percentage
                shadow: false, // Whether to render a shadow
                hwaccel: false, // Whether to use hardware acceleration
                className: 'spinner', // The CSS class to assign to the spinner
                zIndex: 2e9, // The z-index (defaults to 2000000000)
                top: 'auto', // Top position relative to parent in px
                left: 'auto' // Left position relative to parent in px
            };

            this.spinner = new Spinner(options).spin(this.element[0]);
        }

    });

}(jQuery));