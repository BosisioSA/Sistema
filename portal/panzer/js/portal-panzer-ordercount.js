/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, $, window*/

panzer.okilms.order_count = function ()
{
    // nothing to do
};


panzer.okilms.order_count.prototype.setup_ui = function (p_filelist)
{
    p_filelist.add_element_decorator(function (p_$element)
    {
        p_$element.find('.fileicon').append("<div class='orderinfo orderinfoproblem'>100</div>");
    });
    
    this.enable_handlers();
};


panzer.okilms.order_count.prototype.enable_handlers = function ()
{
};
