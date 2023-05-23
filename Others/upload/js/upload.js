/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global $*/

var upload = {};


/*! \brief Configures a jQuery div as an asset chooser.
 *  \param {jQuery} p_$div     The div to configure.
 *  \param {Object} p_options  The configuration options.
 *  \result the controller
 *
 *  \a p_options is an object with the following keys (all of which are optional):
 *  - url: Portal URL where to put the files, default null. It should *not* end with a slash. If missing, no location is specified to portal.cgi.
 *  - multiple: If it should be possible to upload multiple files at once. Default: false. Not that this has no effect on drag-and-drop.
 *  - check_file_cb: Function called to check if a file may be uploaded. It's parameters are p_filename, p_size and p_type.
 *                   It should return true if acceptable; false if not. Default simply returns true.
 *  - fail_cb: Function called if a file upload failed. It's parameter is p_filename.
 *  - process_cb: Function called when the file has been uploaded and indexed, but before it's flagged as completed. It's parameters are p_asset and p_callback.
 *                It allows postprocessing of the file (like waiting for metadata). When done, it should call p_callback with a boolean parameter indicating if
 *                the postprocessing was successful. Default simply calls p_callback(true).
 *  - done_cb: Function called when the file upload, indexing and postprocessing is done. It's parameter is p_asset.
 *  - got_files_cb: Function called when the file upload is done. It's parameters are the file name and the asset URL.
 *
 *  Examples for pre-upload validation:
 *
 *  Check file size:
 *    check_file_cb: function (p_filename, p_size, p_type)
 *    {
 *        if (p_size > 10000000)
 *        {
 *            l_uploader.add_failed_entry(p_filename, 'Too large');
 *            return false;
 *        }
 *        return true;
 *    }
 *
 *  Maximum one file:
 *    check_file_cb: function (p_filename, p_size, p_type)
 *    {
 *        // get_files() returns an array of file names that have either been uploaded or are in progress; it excludes failed and rejected files.
 *        // l_upload is the upload controller (returned by setup_ui)
 *        return l_upload.get_files().length < 1;
 *    }
 *
 *  Only PDF files:
 *    check_file_cb: function (p_filename, p_size, p_type)
 *    {
 *        if (p_type !== "application/pdf")
 *        {
 *            l_uploader.add_failed_entry(p_filename, 'Not a PDF file');
 *            return false;
 *        }
 *        return true;
 *    }
 *
 *  You can use the function get_uploaded_assets() to retrieve an array of uploaded assets.
 *  The function reset() resets the component. It takes an optional p_options object to reconfigure the component.
 */
upload.setup_ui = function (p_$div, p_options)
{
    var l_controller = new upload.controller(p_options);
    l_controller.setup_ui(p_$div);
    return l_controller;
};


