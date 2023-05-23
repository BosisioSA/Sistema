var nixps_dialog =
{
    //
    // General Methods
    //
    setup_ui: function()
    {
        $('body').append("<div id='nixps_dialog' class='window'></div>");
        $('body').append("<div id='nixps_mask'></div>");
    },
    
    enable_handlers: function()
    {
    },

    show: function()
    {
        //Get the screen height and width
        var maskHeight = $(document).height();
        var maskWidth = $(window).width();
     
        //transition effect     
        $('#nixps_mask').fadeIn(450);    
     
        //Get the window height and width
        var winH = $(window).height();
        var winW = $(window).width();
               
        //Set the popup window to center
        $("#nixps_dialog").css('top',  winH/2-$("#nixps_dialog").height()/2);
        $("#nixps_dialog").css('left', winW/2-$("#nixps_dialog").width()/2);
     
        //transition effect
        $("#nixps_dialog").fadeIn(450); 
    },

    hide: function()
    {
        $('#nixps_mask, #nixps_dialog').fadeOut(200);
    },
    
    show_yes_no: function(title, sub_title, user_var, yes_function, no_function)
    {
        $("#nixps_dialog").empty();
        $("#nixps_dialog").css("width", "330px");

        // CREATE THE CONFIRMATION
        $("#nixps_dialog").append("<table id='new_user_table' class='manage-table tsw-table'>");
        $("#new_user_table").append("<tr><td class='header'>"+title+"</td></tr>");
        $("#new_user_table").append("<tr><td class='double-gradient' style='padding:5px'>"+sub_title+"</td></tr>");
        $("#nixps_dialog").append("<br/><center><a class='green-button delete_dlg_no' user_var='"+user_var+"'>" + $.i18n._('nixps-cloudflow-dialog.no') + "</a> "+
									"<a class='green-button delete_dlg_yes' user_var='"+user_var+"'>" + $.i18n._('nixps-cloudflow-dialog.yes') + "</a></center>");
        $('.delete_dlg_no').click(function(){ nixps_dialog.hide(); if (no_function) no_function($(this).attr("user_var")); });
        $('.delete_dlg_no').css("cursor", "pointer");
        $('.delete_dlg_yes').click(function(){ nixps_dialog.hide(); if (yes_function) yes_function($(this).attr("user_var")); });
        $('.delete_dlg_yes').css("cursor", "pointer");
        nixps_dialog.show();
    }
}

///////////////////////////////////////////////////////////////////////////////////////
// INITIALIZATION WRAPPER
///////////////////////////////////////////////////////////////////////////////////////

function init_dialog()
{
    modules = [ nixps_dialog ];
    for(i in modules)
    {
        modules[i].setup_ui();
        modules[i].enable_handlers();
    }
}
