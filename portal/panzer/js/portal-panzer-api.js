/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true, bitwise:true*/
/*global panzer, $, calcMD5, api_async*/

// Concrete API for Panzer in Portal
//
panzer.portal.api = function ()
{
	// nothing to do
};

panzer.portal.api.prototype = new panzer.abstract_api();


//// PREFERENCES API


// Loads the preferences.
//
// Parameters:
//   - p_success_callback(p_id, p_preferences) : Callback if successful
//   - p_error_callback()                      : Callback if failed
//
panzer.portal.api.prototype.list_preferences = function (p_success_callback, p_error_callback)
{
	api_async.panzer.preference.list(
		function (p_data)
		{
			if ((p_data === undefined) || (p_data.records === undefined) || (p_data.records === '0') || (p_data.rows === undefined) || (p_data.rows[0] === undefined))
			{
				if (p_error_callback)
				{
				    p_error_callback();
				}
			}
			else
			{
				if (p_success_callback)
				{
				    p_success_callback(1, p_data.rows[0]);
				}
			}
		},
		function ()
		{
				if (p_error_callback)
				{
				    p_error_callback();
				}
		});
};


// Saves the preferences.
//
// Parameters:
//   - p_id                 : ID of the preferences
//   - p_preferences        : The preferences
//   - p_success_callback() : Callback if successful
//   - p_error_callback()   : Callback if failed
//
panzer.portal.api.prototype.save_preferences = function (p_id, p_preferences, p_success_callback, p_error_callback)
{
	var l_record = { preferences: p_preferences };
	if (p_id)
		l_record.id = p_id.toString();

	api_async.panzer.preference.save(
		l_record,
		function (p_data)
		{
			if (p_success_callback)
			{
				p_success_callback();
			}
		},
		function ()
		{
			if (p_error_callback)
			{
				p_error_callback();
			}
		});
};


//// LAYOUT API


// Creates a layout
//
// Parameters:
//   - p_precut_data                  : The precut data (may be undefined)
//   - p_media_width                  : The media width
//   - p_max_height                   : The maximum height
//   - p_min_height                   : The minimum height
//   - p_orders                       : The job orders
//   - p_margins                      : The margins (may be undefined)
//   - p_eyemarks                     : The eyemarks
//   - p_fill_blanks                  : true if blank space has to be filled
//   - p_success_callback(p_job_data) : Callback if successful
//   - p_error_callback()             : Callback if failed
//
panzer.portal.api.prototype.create_layout = function (p_precut_data, p_media_width, p_max_height, p_min_height, p_orders, p_margins, p_eyemarks, p_fill_blanks,
				                                      p_success_callback, p_error_callback)
{
	var l_parameters = {
		mediawidth: p_media_width,
		maxheight:  p_max_height, 
		minheight:  p_min_height, 
		orders:     p_orders, 
		eyemarks:   p_eyemarks,
		fillblanks: p_fill_blanks
	};
	
	if (p_precut_data !== undefined)
	{
		l_parameters.precutdata = p_precut_data;
	}
	
	if (p_margins !== undefined)
	{
		l_parameters.margins = p_margins;
	}

	api_async.panzer.layout.createlayout(
		l_parameters,
		function (p_data)
		{
			if (p_success_callback)
			{
				p_success_callback(p_data);
			}
		},
		function ()
		{
			if (p_error_callback)
			{
				p_error_callback();
			}
		});
};


// Updates the eyemarks of the layout
//
// Parameters:
//   - p_layout                          : The current layout
//   - p_eyemarks                        : The eyemarks
//   - p_success_callback(p_layout_data) : Callback if successful
//   - p_error_callback()                : Callback if failed
//
panzer.portal.api.prototype.update_eyemarks = function (p_layout, p_eyemarks, p_success_callback, p_error_callback)
{
	api_async.panzer.layout.updateeyemarks(
		p_layout, p_eyemarks,
		function (p_data)
		{
			if (p_success_callback)
			{
				p_success_callback(p_data);
			}
		},
		function ()
		{
			if (p_error_callback)
			{
				p_error_callback();
			}
		});
};


// Applies margins to the layout
//
// Parameters:
//   - p_layout                          : The current layout
//   - p_margins                         : The margins
//   - p_success_callback(p_layout_data) : Callback if successful
//   - p_error_callback()                : Callback if failed
//  
panzer.portal.api.prototype.apply_margins = function (p_layout, p_margins, p_success_callback, p_error_callback)
{
	api_async.panzer.layout.applymargins(
		p_layout, p_margins, panzer.MIN_SHEET_HEIGHT,
		function (p_data)
		{
			// This should be returned by the backend, fixing in the frontend for the moment
			if (p_data.sheets[0].contents === undefined)
			{
				p_data.sheets[0].contents = [];
			}
			
			if (p_success_callback)
			{
				p_success_callback(p_data);
			}
 		},
		function ()
		{
			if (p_error_callback)
			{
				p_error_callback();
			}
		});
};


// Saves a layout as a PDF file
//
// Parameters:
//   - p_layout             : The layout
//   - p_success_callback() : Callback if successful
//   - p_error_callback()   : Callback if failed
//
panzer.portal.api.prototype.save_layout_as_pdf = function (p_layout, p_success_callback, p_error_callback)
{
	api_async.panzer.layout.savelayout(
		p_layout,
		function (p_data)
		{
			if (p_success_callback)
			{
				p_success_callback();
			}
		},
		function ()
		{
			if (p_error_callback)
			{
				p_error_callback();
			}
		});
};


// Saves a layout as in DB
//
// Parameters:
//   - p_layout             : The layout
//   - p_success_callback() : Callback if successful
//   - p_error_callback()   : Callback if failed
//
panzer.portal.api.prototype.save_layout_db = function (p_layout, p_success_callback, p_error_callback)
{
	api_async.panzer.layout.savelayoutdb(
		p_layout,
		function (p_data)
		{
			if (p_success_callback)
			{
				p_success_callback();
			}
		},
		function ()
		{
			if (p_error_callback)
			{
				p_error_callback();
			}
		});
};


//// LAYOUT DOCUMENT


// Retrieves a layout document from the database
//
// A layout document is the combination of layout, orders, settingsdialog [sic] and thumbnail. 
//
// Parameters:
//   - p_id                                  : The ID of the layout document
//   - p_success_callback(p_layout_document) : Callback if successful
//   - p_error_callback()                    : Callback if failed
//
panzer.portal.api.prototype.get_layout_document = function (p_id, p_success_callback, p_error_callback)
{
	api_async.panzer.layoutdb.get(
		p_id,
		function (p_data)
		{
			if (p_success_callback)
			{
				p_success_callback(p_data.layout);
			}
		},
		function ()
		{
			if (p_error_callback)
			{
				p_error_callback();
			}
		});
};


// Deletes a layout document from the database
//
// Parameters:
//   - p_id                 : The ID of the layout document
//   - p_success_callback() : Callback if successful
//   - p_error_callback()   : Callback if failed
//
panzer.portal.api.prototype.delete_layout_document = function (p_id, p_success_callback, p_error_callback)
{
	api_async.panzer.layoutdb.remove(
		p_id,
		function (p_data)
		{
			if (p_success_callback)
			{
				p_success_callback();
			}
		},
		function ()
		{
			if (p_error_callback)
			{
				p_error_callback();
			}
		});
};


// Saves a layout document to the database
//
// Parameters:
//   - p_id                     : The ID of the layout document (optional)
//   - p_layout_document        : The contents the layout document
//   - p_success_callback(p_id) : Callback if successful
//   - p_error_callback()       : Callback if failed
//
panzer.portal.api.prototype.save_layout_document = function (p_id, p_layout_document, p_success_callback, p_error_callback)
{
	api_async.panzer.layoutdb.save(
		{ id: p_id, layout: { thumbnail: p_layout_document.thumbnail, layout: p_layout_document.layout, orders: p_layout_document.orders } },
		function (p_layout_id)
		{
			if (p_success_callback)
			{
				p_success_callback(p_layout_id);
			}
		},
		function ()
		{
			if (p_error_callback)
			{
				p_error_callback();
			}
		});
};


//// DEVICE


// Returns the device data with a specific device id.
//
// Parameters:
//   - p_id                              : Device ID
//   - p_success_callback(p_device_data) : Callback if successful
//   - p_error_callback()                : Callback if failed
//
panzer.portal.api.prototype.get_device  = function (p_id, p_success_callback, p_error_callback)
{
	api_async.panzer.device.get(
		p_id,
		function (p_data)
		{
			if (p_success_callback)
			{
				p_success_callback(p_data);
			}
		},
		function ()
		{
			if (p_error_callback)
			{
				p_error_callback();
			}
		});
};


//// MEDIA


// Requests the user to select a PDF file and returns the meta daa.
//
// Parameters:
//   - p_id                             : Media ID
//   - p_success_callback(p_media_data) : Callback if successful
//   - p_error_callback()               : Callback if failed
//
panzer.portal.api.prototype.get_media = function (p_id, p_success_callback, p_error_callback)
{
	var jobid = panzer.get_application().get_job_info_panel().get_selected_job_id();
	api_async.panzer.jobinfo.getdatablob(jobid, function(p_datablob) {
		api_async.panzer.media.get(
			p_id,
			p_datablob.media_size.toString(),
			function (p_data)
			{
				if (p_success_callback)
				{
					p_success_callback(p_data);
				}
			},
			function ()
			{
				if (p_error_callback)
				{
					p_error_callback();
				}
			}
		);
	});
};


//// JOB INFO


// Retrieves the job info for a particular job.
//
// Parameters:
//   - p_id                           : Job ID
//   - p_success_callback(p_job_data) : Callback if successful
//   - p_error_callback()             : Callback if failed
// 
panzer.portal.api.prototype.get_job_info = function (p_id, p_success_callback, p_error_callback)
{
	api_async.panzer.jobinfo.get(
		p_id,
		function (p_data)
		{
			if (p_success_callback)
			{
				p_success_callback(p_data);
			}
		},
		function ()
		{
			if (p_error_callback)
			{
				p_error_callback();
			}
		});
};


// Deletes a job.
//
// Parameters:
//   - p_id                 : Job ID
//   - p_success_callback() : Callback if successful
//   - p_error_callback()   : Callback if failed
// 
panzer.portal.api.prototype.delete_job_info = function (p_id, p_success_callback, p_error_callback)
{
	api_async.panzer.jobinfo.remove(
		p_id,
		function ()
		{
			if (p_success_callback)
			{
				p_success_callback();
			}
		},
		function ()
		{
			if (p_error_callback)
			{
				p_error_callback();
			}
		});
};


// Saves a job.
//
// Parameters:
//   - p_job_info           : Job info
//   - p_success_callback() : Callback if successful
//   - p_error_callback()   : Callback if failed
// 
panzer.portal.api.prototype.save_job_info = function (p_job_info, p_success_callback, p_error_callback)
{
	api_async.panzer.jobinfo.save(
		p_job_info,
		function (p_data)
		{
			if (p_success_callback)
			{
				p_success_callback(p_data);
			}
		},
		function (p_data)
		{
			if (p_error_callback)
			{
				p_error_callback(p_data);
			}
		});
};


//// MISC


// Returns the url for a thumbnail
//
// Parameters:
//   - p_filepath   : the path of the file
//   - p_size       : the size of the thumbnail [OPTIONAL, 1600 default]
//   - p_pagenumber : the page number of the file [OPTIONAL, 0 default]
//
panzer.portal.api.prototype.get_thumb_url = function(p_filepath, p_size, p_pagenumber)
{
	var l_asset = api_sync.assets.get(p_filepath);
	return l_asset.thumb;
};


// Requests the user to select a PDF file and returns the meta daa.
//
// Parameters:
//   - p_success_callback(p_metadata) : Callback if successful
//   - p_error_callback()             : Callback if failed
//
panzer.portal.api.prototype.request_pdf_file = function (p_success_callback, p_error_callback)
{
};


// Requests the system language.
//
// Parameters:
//   - p_success_callback(p_data) : Callback if successful (p_data is an object with a language field)
//   - p_error_callback()         : Callback if failed
//
panzer.portal.api.prototype.get_system_language = function (p_success_callback, p_error_callback)
{
	if (p_success_callback)
	{
		p_success_callback({language: 'en'});
	}
};
