var jsonserver_files = "/fcgi-bin/WebDispatcher ";

function debug_log(info)
{
    //console.log(info);
}

function test123()
{
 	$("#upload").trigger('click');
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
				"Upload": {
					text:	"Upload",
					id:		"filebrowseruploadbutton",
					click:	function(event) { 
					event.preventDefault();
					$("#selectfilebutton2").trigger('click');
					}
				},
                 "Select": function() { 
                    if ( filelist.current_file.length ) $(this).trigger("nixps_file_selected", filelist.current_file);
                    $(this).dialog("close");
                },
                "Cancel": function() { 
                    $(this).dialog("close"); 
                }
            },
            modal: true
        });
		
		$("#filebrowseruploadbutton").css("margin-right", "100px");
        
        var btnpane = $("#filebrowser").dialog("widget").find(".ui-dialog-buttonpane");

        btnpane.append('<div id="ui_viewmode" style="margin-top: 5px; margin-left: 5px;">' +
                       '<input type="radio" id="listview" name="viewmode" checked="checked" /><label for="listview">List</label>' +
                       '<input type="radio" id="thumbview" name="viewmode" /><label for="thumbview">Thumbs</label>' +
                       '</div>');


		btnpane.append('<form id="fileuploadform2" method="post" action="' + jsonserver_files + '" name="submit" enctype="multipart/form-data">' +
						'<input type="file" id="selectfilebutton2" name="fileField" style="position:fixed; left:-100px; width:0px; height:0px;"/>' +
						'</form>' );
					   
					   
		$('#fileuploadform2').ajaxForm({
	
			success:function()
			{
				$("#browserwait").hide();

				$("form#fileuploadform2").show();	
				$(':input','#fileuploadform')
					.not(':button, :submit, :reset, :hidden')
					.val('')
					.removeAttr('checked')
					.removeAttr('selected');

				filelist.updateURL(filelist.current_url);
			},
		
			beforeSubmit:function(arr,$form,options)
			{
				$("#browserwait").show();
				$("form#fileuploadform2").hide();	
				
			},
			
			setRequestHeader: 
			{
				Connection: "close"
			}
		});

		$("#selectfilebutton2").change(function(event) 
		{
			event.preventDefault();
			$(':input','#fileuploadform2').attr('name',mUserID);
			$("form#fileuploadform2").submit();
		});

					   
		$('#mybutton').click( function(event) {
				event.preventDefault();
				$("#selectfilebutton2").trigger('click');
		} );
		
        $('#ui_viewmode').buttonset({
            text: false,
            icons: {primary: "ui-icon-list-view", secondary: "ui-icon-list-view"}
        });
        
        $("#listview").button({
            text: false,
            icons: {primary: "ui-icon-list-view"}
        });

        $("#thumbview").button({
            text: false,
            icons: {primary: "ui-icon-thumb-view"}
        });
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
    
	//
	// specific methods
	//
    show: function(title, url)
    {
        $('#filebrowser').dialog('open');
        $('#filebrowser').dialog('option', 'title', title);
        filelist.updateURL(url);
    },
    
    hide: function()
    {
	 	 $('#filebrowser').dialog('close');
//        $(this).dialog("close");
    }
}

var filebrowser_pane =
{
	//
	// general methods
	//	
    setup_ui: function()
	{
		$('body').append("<div id='filebrowser' class='ui-widget ui-widget-content ui-corner-all smallfont'></div>");
        
        $('#filebrowser').append('<div id="ui_viewmode" style="margin-top: 5px; margin-left: 5px;">' +
                       '<input type="radio" id="listview" name="viewmode" checked="checked" /><label for="listview">List</label>' +
                       '<input type="radio" id="thumbview" name="viewmode" /><label for="thumbview">Thumbs</label>' +
                       '</div>');
        
        $('#ui_viewmode').buttonset({
                                    icons: {primary: "ui-icon-list-view", secondary: "ui-icon-list-view"}
                                    });
        
        $("#listview").button({
                              icons: {primary: "ui-icon-list-view"}
                              });
        
        $("#thumbview").button({
                               icons: {primary: "ui-icon-thumb-view"}
                               });
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
    }
}

var filelist = 
{
    viewmode: 1,
    current_url: './',
    current_file: '',
    
	//
	// general methods
	//	
    setup_ui: function()
	{
        $('#filebrowser').append("<div id=\"filelistbrowser\" style='left:5px; right: 0px; overflow:auto; top: 40px; bottom:0px; position:absolute'></div>");
    },

    enable_handlers: function()
	{
	},
                                 
    //
    // specific methods
    //
	
//	fileentry: [ <str: display file name>, <str: file path>, <str: file type>, <str: UUID for preview> ]

    send: function(data)
    {
		debug_log("update");
		$('#filelistbrowser').empty();
		
		var count=0;
		
        if (this.viewmode == 1)
        {
            debug_log("list-view");		
			
			
            for (i in data)
            {
				count++;
//				var theSrc = "sticky.png";
				var theSrc = "/" + data[i][3] + "/composite/p0_1_0_0.png";
				var theStyle = "position:relative;";
                $('#filelistbrowser').append('<div style="' + theStyle + '" class="filetype" id="blist'+(count)+'" val="'+data[i][1]+'"><img style="position:relative; width:24px; height:24px; margin-right:10px; margin-left:5px; margin-bottom:3px;margin-top:-3px; top:5px; border: 1px solid #000000 " src="'+theSrc+'">' + data[i][0] + '</div>');

                if (data[i][2]=="d")
                {
                    $('#blist'+count).dblclick(function(){
                        filelist.updateURL(filelist.current_url + $(this).attr('val'));
                    });
                }
                else
                {
                    $('#blist'+count).dblclick(function(){
                        $(this).trigger("nixps_file_selected", $(this).attr('val'));
						filebrowser_dialog.hide();
                    });
                    $('#blist'+count).click(function(){
//						for ( var c in $('#filelistbrowser').children() )
						{
//							var test = $('#filelistbrowser').children()[1];
//							var test.style.display='none';
							$('#filelistbrowser').children().css('background', 'transparent');

						}
						filelist.current_file = $(this).attr('val');
						$(this).css("background", "silver");
                    });
                }
            }
        }
        else
        {
            debug_log("thumb-view");		
            for (i in data)
            {
				count++;

				var theSrc = "/" + data[i][3] + "/composite/p0_1_0_0.png";
                $('#filelistbrowser').append('<div style="margin-bottom:50px;" class="filethumb" id="blist'+(count)+'" val="'+data[i][1]+'"><center><img style="width:200px; height:200px; border: 1px solid #000000 "src="'+theSrc+'"><br/><span style="margin-top:50px;">'+data[i][0]+'</span></center></div>');
				if (data[i][2]=="d")
				{
					$('#blist'+count).dblclick(function(){
						filelist.updateURL(filelist.current_url + $(this).attr('val'));
					});
				}
				else
				{
					$('#blist'+count).dblclick(function(){
						$(this).trigger("nixps_file_selected", $(this).attr('val'));
						filebrowser_dialog.hide();
					});
					$('#blist'+count).click(function(){
						$('#filelistbrowser').children().css('background', 'transparent');
						filelist.current_file = $(this).attr('val');						
						$(this).css("background", "silver");
					});
				}
            }
        }
    },

    updateURL: function (url)
    {
	
		var lCommand = [ "imagelist" , mUserName, url ];
		debug_log(lCommand);
        this.current_url = url;
        $('#filelistbrowser').empty();
        $('#filelistbrowser').append('<div id="browserwait" style="margin-top: 120px; z-index:8000"><center><img src="portal/images/ajax-loader.gif"><br /><br />Retrieving Files</center></div>');
		ProofscopeEditLog( "sending = " + lCommand );
		$.post(jsonserver_files, JSON.stringify(lCommand), function(data) 
        {
			ProofscopeEditLog( "receiving = " + data );

			if ( data && data.length>1 )
			{
				$("#browserwait").hide();
				filelist.send(data[1]);
			}
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

function showFileBrowserDialog(title, url)
{
    filebrowser_dialog.show(title, url);
    return false;
}

function initFileBrowserPane(title, url)
{
    modules = [ filebrowser_pane, filelist ];
    for(i in modules)
    {
        modules[i].setup_ui();
        modules[i].enable_handlers();
    }
    filelist.updateURL(url);
    return filebrowser_pane;
}

