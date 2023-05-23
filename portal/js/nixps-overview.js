function overview_component(p_container, p_id_prefix, p_callback)
	// p_container: the div or body where to put the component (default: $('body') )
	// p_id_prefix: prefix to prepend to all html element ids (default: '' )
	// p_callback:  callback that is called when the user selects a file
	// note: only if p_container is $('body') (or not specified), a notification area is also added to p_container (or undefined to use the old url method)
{
	this.m_container = p_container;
	if (p_id_prefix === undefined) {
		this.m_id_prefix = '';
	} else {
		this.m_id_prefix = p_id_prefix;
	}
    this.m_base_url = 'portal.cgi';
    this.m_discard_results = false;
    this.m_search_active = false;
    this.m_upload_dict = {};
    this.m_root = [];
    this.m_current_folders = [];
    this.m_current_files = [];
	this.m_callback = p_callback;
}

overview_component.prototype.set_callback = function(p_callback)
{
	this.m_callback = p_callback;
}


overview_component.prototype.setup_ui = function()
{
	var l_container = this.m_container;
	if (l_container === undefined) {
		l_container = $('body');
	}
	l_container.append(
		"<div class='overview-pane' id='" + this.m_id_prefix + "overview-pane'><div id='" + this.m_id_prefix + "overview-content'></div>"+
		"<div width='100%' id='" + this.m_id_prefix + "search-div'>"+
//		"<div id='" + this.m_id_prefix + "fileupload-container'>"+
//		"</div>"+
		"<span id='" + this.m_id_prefix + "overview-breadcrumb'></span>"+
		"<span id='" + this.m_id_prefix + "search-string'>"+
			"<div id='" + this.m_id_prefix + "fileupload-container'>"+
			"<input id='" + this.m_id_prefix + "fileupload' type='file' name='files[]' data-url='/portal.cgi' multiple>"+
			"</div>"+
			"<img id='" + this.m_id_prefix + "fileupload_go' src='portal/images/upload_black.png' style='vertical-align: middle; margin-right: 5px' />"+
			"<img src='portal/images/search_black.png' style='vertical-align: middle; margin-right: 5px' />"+
		"<input id='" + this.m_id_prefix + "search-input' size='40' type='search' placeholder='search'></span>"+
		"</div></div>");

	$("#" + this.m_id_prefix + "fileupload_go").click($.proxy(function(){
		$("#" + this.m_id_prefix + "fileupload").click();
	},this));

	l_container.append(
		"<div id='" + this.m_id_prefix + "fileupload-progress'>"+
		"Uploading</div>");

	$("#" + this.m_id_prefix + "fileupload-progress").position({
		my: "center",
		at: "center",
		of: "#nixps_mask" 
	});


	if (l_container == $('body')) {
		l_container.append(
			"<div id='notify-area' style='display:none; pointer-events:none; top:100px; right:0; bottom:0; margin:10px 10px 10px 10px; z-index:9999'>"+
			"<div id='default'>"+
			"<h1>#{title}</h1>"+
			"<p>#{text}</p>"+
			"</div>"+
			"<div id='closeable'>"+
			"<a class='ui-notify-cross ui-notify-close' href='#' style='pointer-events:auto'>x</a>"+
			"<h1>#{title}</h1>"+
			"<p>#{text}</p>"+
			"</div>"+
			"<div id='closeable-error' style='background-color:#700'>"+
			"<a class='ui-notify-cross ui-notify-close' href='#' style='pointer-events:auto'>x</a>"+
			"<h1>#{title}</h1>"+
			"<p>#{text}</p>"+
			"</div>"+
			"</div>");
			
		$('#notify-area').notify();
	}

	$("#" + this.m_id_prefix + "fileupload-progress").hide();

	$("#" + this.m_id_prefix + "fileupload").fileupload({
        pasteZone: null,
		dataType: 'json',
		send: $.proxy(function (e, data) {
			var instance = $('#notify-area').notify("create", "default", { title:'Uploading File', text: data.files[0].name+'<br><div id="' + this.m_id_prefix + 'fileupload-progress"></div>'}, { expires:false }); 
			this.m_upload_dict[data.files[0].name]={'instance':instance};
		},this),
		done: $.proxy(function (e, data) {
			if (this.m_upload_dict[data.files[0].name].instance.length > 0) {
				this.m_upload_dict[data.files[0].name].instance.close();
			}
		},this),
		progress: $.proxy(function (e, data) {
			var progress = parseInt(data.loaded / data.total * 100, 10);
			if (this.m_upload_dict[data.files[0].name].instance.length > 0) {
				this.m_upload_dict[data.files[0].name].instance.element.find("#" + this.m_id_prefix + "fileupload-progress").css('width',progress+'%');
			}
		},this)
	});
};
    	
overview_component.prototype.enable_handlers = function()
{
	$("#" + this.m_id_prefix + "search-input").keyup($.proxy(this.search,this));
	$("#" + this.m_id_prefix + "search-input").change($.proxy(this.search,this));
};

overview_component.prototype.show = function()
{
	$('#' + this.m_id_prefix + 'overview-pane').show();
	$("#" + this.m_id_prefix + "search-string").show();
	top_pane.set_title("ASSETS");
	this.m_search_active=false;
};

overview_component.prototype.set_baseurl = function(baseurl) 
{
	this.m_base_url = baseurl;
};

overview_component.prototype.hide = function()
{
	$('#' + this.m_id_prefix + 'overview-pane').hide();
};

overview_component.prototype.update_ui = function()
{
	$("#" + this.m_id_prefix + "overview-content").empty();
	
	$("#" + this.m_id_prefix + "overview-breadcrumb").empty();
	var lBreadcrumbTree=[];

	var l_url = this.m_base_url + "?tag=[]";
	var l_this = this;
	if (this.m_callback) {
		$("#" + this.m_id_prefix + "overview-breadcrumb").append("<a href='#'>"+"HOME"+"</a>");
		$("#" + this.m_id_prefix + "overview-breadcrumb a:last").click(function (e) { l_this.set_root([]); });
	} else {
		$("#" + this.m_id_prefix + "overview-breadcrumb").append("<a href='"+l_url+"'>"+"HOME"+"</a>");
	}
	if (this.m_root.length > 0)
		$("#" + this.m_id_prefix + "overview-breadcrumb").append("&nbsp;<img width=12 src='/portal/images/chevron.png'>&nbsp;");

	for (var idx in this.m_root)
	{
		lBreadcrumbTree.push(this.m_root[idx]);
		var l_url = this.m_base_url + "?tag="+JSON.stringify(lBreadcrumbTree);
		if (this.m_callback) {
			$("#" + this.m_id_prefix + "overview-breadcrumb").append("<a href='#'>"+this.m_root[idx]+"</a>");
			$("#" + this.m_id_prefix + "overview-breadcrumb a:last").click(function (e) { l_this.set_root(lBreadcrumbTree); });
		} else {
			$("#" + this.m_id_prefix + "overview-breadcrumb").append("<a href='"+l_url+"'>"+this.m_root[idx]+"</a>");
		}
		if (idx < this.m_root.length-1)
			$("#" + this.m_id_prefix + "overview-breadcrumb").append("&nbsp;<img width=12 src='/portal/images/chevron.png'>&nbsp;");
	}

	$("#" + this.m_id_prefix + "overview-content").append("</div>");
	
	
	nixps_thumb.init(150, true, false);
	var l_size = this.m_current_files.length;
	if (l_size > 200)
	{
		$('#' + this.m_id_prefix + 'overview-pane').append("<div width='100%' id='" + this.m_id_prefix + "toomuch-div'><b>Showing only the first 200 of "+l_size+" results</b></div>");
	}
	l_size+=this.m_current_folders.length
	
	// the folders
	if (this.m_search_active===false)
	for (var idx in this.m_current_folders)
	{
		l_extra="";
		var lTree=this.m_root.slice();
		lTree.push(this.m_current_folders[idx]);
		var l_url = this.m_base_url + "?tag="+JSON.stringify(lTree);
//		var l_url = "javascript:overview_pane.set_root("+JSON.stringify(lTree)+");";
		if (this.m_root.length == 0) {
			if (this.m_callback !== undefined) {
				var l_this = this;
				var l_func = function (path) {
					l_this.set_root(path);
				};
				$("#" + this.m_id_prefix + "overview-content").append(nixps_thumb.generate_transparant_fn(lTree, l_func, "/portal/images/silo.png", "<font size=3>"+this.m_current_folders[idx]+"</font>"+l_extra));
			} else {
				$("#" + this.m_id_prefix + "overview-content").append(nixps_thumb.generate_transparant(l_url, "/portal/images/silo.png", "<font size=3>"+this.m_current_folders[idx]+"</font>"+l_extra));
			}
		} else {
			if (this.m_callback !== undefined) {
				var l_this = this;
				var l_func = function (path) {
					l_this.set_root(path);
				};
				$("#" + this.m_id_prefix + "overview-content").append(nixps_thumb.generate_transparant_fn(lTree, l_func, "/portal/images/folder_big.png", "<font size=3>"+this.m_current_folders[idx]+"</font>"+l_extra));
			} else {
				$("#" + this.m_id_prefix + "overview-content").append(nixps_thumb.generate_transparant(l_url, "/portal/images/folder_big.png", "<font size=3>"+this.m_current_folders[idx]+"</font>"+l_extra));
			}
		}
	}
	
	for (idx in this.m_current_files)
	{
		var l_url = this.m_base_url + "?url="+this.m_current_files[idx].url+"&sub="+this.m_current_files[idx].sub;
		var l_extra = "";
		if (this.m_current_files[idx].sub.length > 0)
		{
			if (this.m_current_files[idx].sub.substr(0,2) == "p_")
			{
				var l_page = parseInt(this.m_current_files[idx].sub.substr(2));
				l_page += 1;
				l_extra += "<br/><font size='2'><i>Page "+l_page+"</i></font>";
			}
			else
			{
				l_extra += "<br/><font size='2'><i>Embedded Image</i></font>";
			}
		}
		if (this.m_callback !== undefined) {
			$("#" + this.m_id_prefix + "overview-content").append(nixps_thumb.generate_fn(this.m_current_files[idx], this.m_callback, this.m_current_files[idx].thumb, "<font size=3>"+nixps_utils.get_filename(this.m_current_files[idx].url)+"</font>"+l_extra));
		} else {
			$("#" + this.m_id_prefix + "overview-content").append(nixps_thumb.generate(l_url, this.m_current_files[idx].thumb, "<font size=3>"+nixps_utils.get_filename(this.m_current_files[idx].url)+"</font>"+l_extra));
		}
		if (idx > 200)
			break;
	}
	if (l_size == 0)
	{
		this.no_results();
	}
};
    
overview_component.prototype.no_results = function()
{
	$("#" + this.m_id_prefix + "overview-content").empty();
	$("#" + this.m_id_prefix + "overview-content").append("<center><br/><br/><img src='/portal/images/sad-face.png'/><br/><br/><b>NO RESULTS</b></center>");
};

overview_component.prototype.redraw_pane = function(metadata_doc, metadata_page)
{
};

overview_component.prototype.set_root = function(new_root)
{
	this.m_root = new_root;

	if (l_root[0] === "")
	{
		api_async.folder.list(["depth", "equal to", 0], ["name"], $.proxy(function(data)
		{
			this.m_current_folders = [];
			var rootFolders = data.results;
			for (var rootFolderIndex in rootFolders)
			{
				this.m_current_folders.push(rootFolders[rootFolderIndex].name);
			}
			this.m_current_folders.sort();
			this.m_current_files = [];
			this.refresh_ui();
		},
		this));
	}
	else
	{
		api_async.folder.list(["path", "equal to", l_root], ["subfolders"], $.proxy(function(data)
		{
			this.m_current_folders = [];
			var subFolders = data.results[0].subfolders;
			for (var subFolderKey in subFolders)
			{
				this.m_current_folders.push(subFolders[subFolderKey]);
			}
			this.m_current_folders.sort();
			this.m_search_active=false;
			this.list_files();
		},this));
	}
};

overview_component.prototype.list_files = function(new_root)
{
	api_async.asset.list(["sub", "equal to", "", "and", "path", "equal to", this.m_root], ["url", "sub", "cloudflow", "thumb", "approvals", "modtime", "filetype"], $.proxy(function(data)
	{
		this.m_current_files = data.results;
		this.m_search_active=false;
		this.update_ui();
	},this));
};

overview_component.prototype.search = function()
{
	var l_search_string=$("#" + this.m_id_prefix + "search-input").val();
	if (l_search_string===undefined || l_search_string==="")
		return this.list_files();

	var query = ["sub", "equal to", ""];
	if (this.m_root[0] !== "")
	{
		for (var index in this.m_root)
		{
			query = query.concat(["and", "path." + index, "equal to", this.m_root[index]]);
		}
	}
	query = query.concat(["and", "searchstring", "contains text like", l_search_string]);

	api_async.asset.list(query, ["url", "sub", "cloudflow", "thumb", "approvals", "modtime", "filetype"], $.proxy(function(data)
	{
		this.m_search_active = true;
		this.m_current_files = data.results;
		this.update_ui();
	},this));
/*	
	if (this.m_search_active)
	{
		this.m_discard_results=true;
		return;
	}
	this.m_search_active=true;
	this.m_discard_results=false; 
	
	api_async.assets.search_assets($('#search-input').val(),$.proxy(function(data) 
	{
		this.m_search_active=false;
		if (this.m_discard_results)
			this.search();
		else
		{
			this.m_current_files=data;
			this.update_ui();
		}
	},this));
*/	
};


///////////////////////////////////////////////////////////////////////////////////////
// overview_tree_component, inherits from

function overview_tree_component()
{
}

overview_tree_component.prototype = new overview_component();

///////////////////////////////////////////////////////////////////////////////////////
// INITIALIZATION WRAPPER
///////////////////////////////////////////////////////////////////////////////////////

var overview_pane = new overview_tree_component();

function init_overview_pane()
{
    modules = [ overview_pane ];
    for(i in modules)
    {
        modules[i].setup_ui();
        modules[i].enable_handlers();
    }
}

function show_overview_pane(root)
{
    // Suggestion: add a setup method which takes all parameters as a json dictionary
    //             and sets all different variables (portal <-> nucleus)
    top_pane.set_active("#filesSection");

    // Setup according to the context
    if (sContext === 'portal') 
    {
        overview_pane.set_baseurl('portal.cgi');
    }
    else 
    {
        overview_pane.set_baseurl('portal.cgi');
    }

    overview_pane.show();
//    overview_pane.search("");
	if (root != undefined)
		overview_pane.set_root(root);
	else
		overview_pane.set_root([]);
}
