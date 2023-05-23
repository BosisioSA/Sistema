/*********************************************************************/
/* NiXPS Tooltip Plugin for jQuery                                   */
/*                                                                   */
/* Copyright 2012, NiXPS (www.nixps.com)                             */
/*********************************************************************/

(function($) {
    $.fn.tooltip = function(tooltipEl) {
        var $tooltipEl = $(tooltipEl);
        return this.each(function() {
            var $this = $(this);            
            var hide = function () {
                var timeout = setTimeout(function () {
                    $tooltipEl.hide();
                }, 500);

                $this.data("tooltip.timeout", timeout);
            };

            /* Bind an event handler to 'hover' (mouseover/mouseout): */
            $this.hover(function () {
                clearTimeout($this.data("tooltip.timeout"));
                $tooltipEl.show();
            }, hide);

            /* If the user is hovering over the tooltip div, cancel the timeout: */
            $tooltipEl.hover(function () {
                clearTimeout($this.data("tooltip.timeout"));
            }, hide);            
        });
    };
})(jQuery);