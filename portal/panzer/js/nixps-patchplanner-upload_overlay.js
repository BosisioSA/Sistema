/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, document, lang_en, window, gVariables, upload */
/*global nixps, namespace */


(function() {

	namespace("nixps.patchplanner");

	var selectMountingMethod = $('<div>')
		.css({
			'position': 'absolute'
		})
		.append($('<label>').text('Mounting method:').css({
			marginRight: 3
		}))
		.append($('<select>')
			.attr('name', 'method')
			.append($('<option>').attr('value', 'mom').text('Automatic (MOM)'))
			.append($('<option>').attr('value', 'mirror').text('Mirror'))
			.append($('<option>').attr('value', 'drillmount').text('Drill Mount'))
			.append($('<option>').attr('value', 'mirrormom').text('Mirror and Automatic (MOM)'))
			.append($('<option>').attr('value', 'heaford').text('Heaford (CSV)')));


	/**
	 * Creates an overlay which contains an upload component
	 */
	nixps.patchplanner.upload_overlay = function(p_parent, p_file_uploaded_cb) 
	{
		this.m_parent = p_parent;
		this.m_file_uploaded_cb = p_file_uploaded_cb;
		this.m_upload_component = null;
		this.m_overlay_div = null;

		this.setup_ui();
	};

	nixps.patchplanner.upload_overlay.prototype = {

		setup_ui: function() 
		{
			// Remove the current_url cookie
			$.cookie("current_url", "", { expires: 0 });

			var l_this = this;

			var l_overlay_div = $('<div>');
			l_overlay_div.addClass('overlay');
			l_overlay_div.appendTo(this.m_parent);
			this.m_overlay_div = l_overlay_div;

			var l_upload_overlay = $('<div>');
			l_upload_overlay.addClass('upload_overlay');
			l_upload_overlay.appendTo(l_overlay_div);

			var l_upload_overlay_title = $('<div>');
			l_upload_overlay_title.addClass('title');
			l_upload_overlay_title.text('Upload PDF file');
			l_upload_overlay_title.appendTo(l_upload_overlay);

			l_upload_overlay_title.append(selectMountingMethod.css({
				top: 0,
				right: 10
			}));

			var cloudflowSettings = new nixps.patchplanner.CloudflowSettings();
			var mountMethod = cloudflowSettings.getDefaultMountMethod();
			selectMountingMethod.find('[name=method]').val(mountMethod);

			var l_upload_overlay_contents = $('<div>');
			l_upload_overlay_contents.addClass('contents');
			l_upload_overlay_contents.appendTo(l_upload_overlay);

		    this.m_upload_component = upload.setup_ui(
		        l_upload_overlay_contents,
		        {
		            multiple: true,
		            // done_cb: l_this.m_file_uploaded_cb,
		            got_files_cb: function(p_filename, p_asset_url) {
		            	var mountingMethod = l_this.m_overlay_div.find('[name=method]').val();
		            	l_this.m_file_uploaded_cb(p_filename, p_asset_url, mountingMethod);
		            }
		        }
			);

		    var l_close_button = $('<button>');
		    l_close_button.text('close');
		    l_close_button.addClass('close_button');
		    l_close_button.appendTo($('.upload_div', l_upload_overlay_contents));
		    l_close_button.on('click', function() {
		    	l_this.destroy();
		    });
		},

		show: function() 
		{
			this.m_overlay_div.show();
		},

		destroy: function() 
		{
			this.m_overlay_div.remove();
		}
		
	};

}());
