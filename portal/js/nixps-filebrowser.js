var jsonserver_files = "/files.cgi";

function debug_log(info)
{
//    console.log(info);
}

var filebrowser_dialog =
{
    callback_function: function(url) {},
    
	//
	// general methods
	//	
    setup_ui: function()
	{
		$('body').append("<div id='filebrowser'></div>");
        
        // Dialog			
        $('#filebrowser').dialog({
            autoOpen: false,
            width: 600,
            height: 400,
            buttons: {
                "Select": function() { 
                    $(this).dialog("close");
                },
                "Cancel": function() { 
                    $(this).dialog("close"); 
                }
            },
            modal: true
        });
        
        var btnpane = $("div.ui-dialog-buttonpane");
        btnpane.append('<div id="ui_viewmode" style="margin-top: 5px; margin-left: 5px;">' +
                       '<input type="radio" id="listview" name="viewmode" checked="checked" /><label for="listview">List</label>' +
                       '<input type="radio" id="thumbview" name="viewmode" /><label for="thumbview">Thumbs</label>' +
                       '</div>');
        
        $('#ui_viewmode').buttonset({
            text: false,
            icons: {primary: "list-button-edit", secondary: "thumb-button-edit"}
        });
        
        $("#listview").button({
            text: false,
            icons: {primary: "list-button-edit"}
        });

        $("#thumbview").button({
            text: false,
            icons: {primary: "thumb-button-edit"}
        });

	update_expiry_warning();
    },
    
    enable_handlers: function()
	{
        $("#listview").click(function(event)
        {
            event.preventDefault();
            filelist.setViewMode(1);
            $.cookie("filelistmode", 1, {path: '/'});
        });

        $("#thumbview").click(function(event)
        {
            event.preventDefault();
            filelist.setViewMode(2);
            $.cookie("filelistmode", 2, {path: '/'});
        });
    },
    
	//
	// specific methods
	//
    show: function(title, url)
    {
        $('#filebrowser').dialog('open');
        $('#filebrowser').dialog('option', 'title', title);
        filelist.updateURL(url);
        if ($.cookie("filelistmode", {path: '/'}) !== undefined)
        {
            filelist.setViewMode($.cookie("filelistmode", {path: '/'}));
        }
    },
    
    hide: function()
    {
        $(this).dialog("close");
    }
}

var filebrowser_pane =
{
	//
	// general methods
	//	
    setup_ui: function()
	{
		$('body').append("<div id='global-msgs'></div><div id='filebrowser' class='filebrowser-pane'></div>");
        
/*
        $('#filebrowser').append('<div id="ui_viewmode" style="margin-top: 5px; margin-left: 5px;">' +
                       '<input type="radio" id="listview" name="viewmode" checked="checked" /><label for="listview">List</label>' +
                       '<input type="radio" id="thumbview" name="viewmode" /><label for="thumbview">Thumbs</label>' +
                       '</div>');
        
        $('#ui_viewmode').buttonset({
                                    icons: {primary: "list-button-edit", secondary: "thumb-button-edit"}
                                    });
        
        $("#listview").button({
                              icons: {primary: "list-button-edit"}
                              });
        
        $("#thumbview").button({
                               icons: {primary: "thumb-button-edit"}
                               });
*/
    },
    
    enable_handlers: function()
	{
        $("#listview").click(function(event)
                             {
                             event.preventDefault();
                             filelist.setViewMode(1);
                             });
        
        $("#thumbview").click(function(event)
                              {
                              event.preventDefault();
                              filelist.setViewMode(2);
                              });
    },

	show: function()
	{
		$('.filebrowser-pane').show();
	},

	hide: function()
	{
		$('.filebrowser-pane').hide();
	},

}

var filelist = 
{
    viewmode: 0,
    current_url: './',
    
	//
	// general methods
	//	
    setup_ui: function()
	{
        $('#filebrowser').append("<div id=\"filelist\" style='left:5px; right: 0px; overflow:auto; top: 40px; bottom:0px; position:absolute'></div>");
    },

    enable_handlers: function()
	{
	},
                                 
    //
    // specific methods
    //
    send: function(data)
    {
		debug_log("update");
		$('#filelist').empty();
        if (this.viewmode == 1)
        {
            debug_log("list-view");		
            for (i in data)
            {
                $('#filelist').append('<div class="filetype" id="'+data[i]._id+'" val="'+data[i].name+'"><img src="portal/images/'+data[i].type+'.png"> '+data[i].name+'</div>');
                if (data[i].type == "folder")
                {
                    $('#'+data[i]._id).dblclick(function(){
                        filelist.updateURL(filelist.current_url + $(this).attr('val'));
                    });
                }
                else
                {
                    $('#'+data[i]._id).dblclick(function(){
                        $(this).trigger("nixps_file_selected", filelist.current_url + $(this).attr('val'));
                    });
                }
            }
        }
        else
        {
            debug_log("thumb-view");		
            for (i in data)
            {
                if (data[i].type == "folder")
                {
                    $('#filelist').append('<a href="portal.cgi?files='+filelist.current_url+data[i].name+'"><div class="filethumb" id="'+data[i]._id+'" val="'+data[i].name+'"><center><img src="portal/images/'+data[i].type+'_big.png" style="width: 64px; height: 64px;"><br/><span style="margin-top:20px;">'+data[i].name+'</span></center></div></a>');
                    $('#'+data[i]._id).click(function(){
                        filelist.updateURL(filelist.current_url + $(this).attr('val'));
                    });
                }
                else
                {
                    $('#filelist').append('<a href="portal.cgi?url='+filelist.current_url+data[i].name+'"><div class="filethumb" id="'+data[i]._id+'" val="'+data[i].name+'"><center><img src="portal/images/file_big.png" style="width: 64px; height: 64px;"><br/><span style="margin-top:20px;">'+data[i].name+'</span></center></div></a>');
                }
            }
        }
    },

    updateURL: function (url)
    {
        top_pane.set_title(url);
		var lCommand = { "location" : url };
		debug_log(lCommand);
        if (url.charAt(url.length-1) != '/')
        {
            url += '/';
        }
        debug_log(url);
        this.current_url = url;
        $('#filelist').empty();
        $('#filelist').append('<div style="margin-top: 120px; "><center><img src="portal/images/loading10.gif"></center></div>');
		$.post(jsonserver_files, JSON.stringify(lCommand), function(data) 
        {
            debug_log(data);
            filelist.send(data);
        });
    },
    
    setViewMode: function(mode)
    {
        if (this.viewmode != mode)
        {
            this.viewmode = mode;
            this.updateURL(this.current_url);
        }
    }
}

function initFileBrowserDialog()
{
    modules = [ filebrowser_dialog, filelist ];
    for(i in modules)
    {
        modules[i].setup_ui();
        modules[i].enable_handlers();
    }
}

function show_FileBrowserDialog(title, url)
{
    filebrowser_dialog.show(title, url);
    return false;
}

function init_filebrowser_pane(title, url)
{
    modules = [ filebrowser_pane, filelist ];
    for(i in modules)
    {
        modules[i].setup_ui();
        modules[i].enable_handlers();
    }
    filelist.updateURL(url);
    $("#filebrowser").hide();
}

function show_filebrowser_pane(url)
{
    if (url != undefined)
    {
        filelist.updateURL(url);
    }
	$("#filebrowser").show();
}
