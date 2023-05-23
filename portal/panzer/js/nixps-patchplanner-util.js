/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, $, document, lang_es, lang_en, _*/
/*global namespace, nixps, api, cloudflow_path, api_async */
/*global panzer_filelist*/


(function() {

	namespace('nixps.patchplanner');

	var METADATA_CACHE = {};
	var ASSET_PATCH_URL_CACHE = {};

	function CMYKVectorToWebRGB (vector) {
		var lC = vector[0] * 255;
		var lM = vector[1] * 255;
		var lY = vector[2] * 255;
		var lK = vector[3] * 255;
		var lR = 255 - (lC + lK);
		var lG = 255 - (lM + lK);
		var lB = 255 - (lY + lK);
		if (lR < 0) {
			lR = 0;
		}
		if (lG < 0) {
			lG = 0;
		}
		if (lB < 0) {
			lB = 0;
		}
		var lResult = (Math.round(lR) << 16) + (Math.round(lG) << 8) + Math.round(lB);
		var lString = lResult.toString(16);
		while (lString.length < 6) {
			lString = "0" + lString;
		}
		return "#" + lString;
	}

	nixps.patchplanner.util = {

		getAsset: function(pURLPath) {
			if ((pURLPath instanceof nixps.cloudflow.URLPath) === false) {
				throw new Error('invalid url path');
			}

			var asset = api.asset.list(['cloudflow.part', 'equal to', pURLPath.getFullPath()]);
			if (($.isArray(asset.results) === false) || (asset.results.length !== 1)) {
				throw new Error('no such asset: ' + pURLPath.getFullPath());
			}

			return asset.results[0];
		},

		has_asset_thumb: function(p_filepath)
		{
			if ((! p_filepath instanceof cloudflow_path) || (! p_filepath.is_file()))
			{
				throw new Error('invalid parameter');
			}

			return $.Deferred(function(pDefer) {
				api_async.asset.list(["cloudflow.part", "equal to", p_filepath.get_full_path()], ["thumb"], function(pResult) {
					if (pResult.results.length === 0) {
						pDefer.resolve(false);
					}
					var asset = pResult.results[0];
					pDefer.resolve(($.isPlainObject(asset) === true) && (typeof asset.thumb === "string") && (asset.thumb.length > 0));
				}, function(pError) {
					pDefer.reject(pError);
				});
			});
		},

		get_asset_thumb_url: function(p_filepath)
		{
			if ((! p_filepath instanceof cloudflow_path) || (! p_filepath.is_file()))
			{
				throw new Error('invalid parameter');
			}

			return $.Deferred(function(pDefer) {
				api_async.asset.list(["cloudflow.part", "equal to", p_filepath.get_full_path()], ["thumb"], function(pResult) {
					if (pResult.results.length === 0) {
						pDefer.reject(new Error('thumb not ready yet'));
					}
					var asset = pResult.results[0];
					pDefer.resolve(asset.thumb);
				}, function(pError) {
					pDefer.reject(pError);
				});
			});
		},


		get_asset_separation_names: function(p_filepath)
		{
			if ((! p_filepath instanceof cloudflow_path) || (! p_filepath.is_file()))
			{
				throw new Error('invalid parameter');
			}

			return $.Deferred(function(pDefer) {
				api_async.asset.list(["cloudflow.part", "equal to", p_filepath.get_full_path()], ["metadata.pages.output_color_space.colorants"], function(pResult) {
					if (pResult.results.length === 0) {
						pDefer.reject(new Error('thumb not ready yet'));
					}
					var asset = pResult.results[0];
					var colorants = asset.metadata.pages[0].output_color_space.colorants;
					var separationNames = _.map(colorants, function(c) {
						return c.name;
					});

					pDefer.resolve(separationNames);
				}, function(pError) {
					pDefer.reject(pError);
				});
			});
		},


		get_asset_patch_url: function(p_resource_element)
		{
			if (p_resource_element instanceof nixps.layout.file_resource_element === false)
			{
				throw new Error('invalid parameter');
			}

			var asset_url = p_resource_element.get_file().get_full_path();
			return $.Deferred(function(pDefer) {
				try {
					if (ASSET_PATCH_URL_CACHE[asset_url] === undefined) {
						var pResult = api.asset.list(["cloudflow.part", "equal to", asset_url], ["proofscope"]);
						if (pResult.results.length === 0) {
							pDefer.reject(new Error('asset not found'));
						}
						ASSET_PATCH_URL_CACHE[asset_url] = pResult;
					}

					var pResult = ASSET_PATCH_URL_CACHE[asset_url];
					var asset = pResult.results[0];
					var proofscope_id = asset.proofscope.uuid;
					var page_number = p_resource_element.get_page();
					var separation = p_resource_element.get_separation();
					var clip_box = p_resource_element.get_clip_box();

					pDefer.resolve('/cgi-bin/proofscope.cgi?zoom=1'
						+ '&file=' + proofscope_id
						+ "&page=" + page_number
						+ '&sepname=' + encodeURI(separation)
						+ '&top=' + (clip_box.y + clip_box.height)
						+ '&bottom=' + clip_box.y
						+ '&left=' + clip_box.x
						+ '&right=' + (clip_box.x + clip_box.width));
				} catch (pError) {
					pDefer.reject(pError);
				}
			});
		},


		get_rendered_patch_url: function(p_label, p_zoom)
		{
			var id = p_label.editor_label('option','id');
			var refid = p_label.editor_label('option','refid');
			var viewsize = p_label.editor_label('getViewSize');
			var leftmargin = p_label.editor_label('option', 'ptleftmargin');
			var rightmargin = p_label.editor_label('option', 'ptrightmargin');
			var topmargin = p_label.editor_label('option', 'pttopmargin') * p_label.editor_label('option', 'distortion');
			var bottommargin = p_label.editor_label('option', 'ptbottommargin') * p_label.editor_label('option', 'distortion');
			var rotation = p_label.editor_label('option','rotation');

			var session = new nixps.patchplanner.Session();
			var layout_doc = session.load_layout_document();
			var layoutdoc_path = session.get_layout_document_path();
			var decorator = layout_doc.get_decorator(refid);
			var marks = decorator.get_mark_ids();
			var markhash = "";
			for(var i = 0; i < marks.length; i++) {
				var distances = decorator.get_distances(marks[i]);
				markhash += ("" + distances.left + distances.right + distances.middle);
			}
			var patch = layout_doc.get_patch(refid);
			var mark_path = layout_doc.get_mark(patch.get_file());
			var slugline_hash = hex_md5(_.reduce(_.values(patch.get_data()), function(pString, pValue) {
				return pString + pValue;
			}, ""));

			if (layout_doc.get_sheet().has_id(id)) {
				return '/portal.cgi?printplanner=preview_layout_object'
						+ '&v_size=' + viewsize.height
						+ "&h_size=" + viewsize.width
						+ '&object_id=' + id
						+ '&layout_url=' + layoutdoc_path.get_full_path()
						+ '&left_margin=' + leftmargin
						+ '&right_margin=' + rightmargin
						+ '&top_margin=' + topmargin
						+ '&bottom_margin=' + bottommargin
						+ '&zoom_level=' + p_zoom
						+ '&mark_hash=' + markhash
						+ '&mark_path=' + mark_path.get_full_path()
						+ '&rotation=' + rotation
						+ '&slugline_hash=' + slugline_hash;
			}
			else {
				return false;
			}
		},


		is_rendered: function(p_filepath) {
			if ((! p_filepath instanceof cloudflow_path) || (! p_filepath.is_file()))
			{
				throw new Error('invalid parameter');
			}

			return $.Deferred(function(pDefer) {
				var l_asset_url = p_filepath.get_full_path();
				api_async.asset.list(["cloudflow.part", "equal to", l_asset_url], ["proofscope"], function(pResult) {
					if (pResult.results.length === 0) {
						pDefer.resolve(false);
					}
					var asset = pResult.results[0];
					pDefer.resolve((asset.proofscope !== undefined)
						&& (asset.proofscope.state !== undefined)
						&& (asset.proofscope.state === 'RENDER_DONE'));
				}, function(pError) {
					pDefer.reject(pError);
				});
			});
		},


		/**
		 * @brief Generates UUIDs
		 */
		guid: function() {
			var S4 = function() {
			   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
			};

		   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
		},


		/**
		 * @brief returns the list of assets that folder
		 */
		get_folder_subfolders: function(p_folder) {
			if (((! (p_folder instanceof cloudflow_path)) && (! (p_folder instanceof nixps.cloudflow.URLPath))) || (p_folder.is_file())) {
				throw new Error('invalid parameter');
			}

			var folderData = api_sync.folder.list(["cloudflow.enclosing_folder", "equal to", p_folder.get_full_path()], ["name"]);

			return _.map(folderData.results, function(pEntry) {
				return pEntry.name;
			});
		},



		/**
		 * @brief returns the list of files in that folder
		 */
		get_folder_files: function(p_folder) {
			if (((! (p_folder instanceof cloudflow_path)) && (! (p_folder instanceof nixps.cloudflow.URLPath))) || (p_folder.is_file())) {
				throw new Error('invalid parameter');
			}

			var assetData = api_sync.asset.list(["sub", "equal to", "", "and", "cloudflow.enclosing_folder", "equal to", p_folder.get_full_path()], ["file_name"]);

			return _.map(assetData.results, function(pEntry) {
				return pEntry.file_name;
			});
		},


		/**
		 * @brief returns the list of assets that folder
		 */
		get_folder_contents_list: function(p_folder) {
			if (((! (p_folder instanceof cloudflow_path)) && (! (p_folder instanceof nixps.cloudflow.URLPath))) || (p_folder.is_file())) {
				throw new Error('invalid parameter');
			}

			var assetData = api_sync.asset.list(["sub", "equal to", "", "and", "cloudflow.enclosing_folder", "equal to", p_folder.get_full_path()], ["url", "cloudflow.file", "thumb"]);

			return assetData.results;
		},


		/**
		 * @brief checks if a file exists
		 */
		fileExists: function(pURL) {
			if (! (pURL instanceof nixps.cloudflow.URLPath)) {
				throw new Error('invalid parameter');
			}

			var result = api_sync.file.fileExists(pURL.getFullPath());
			return result.result === true;
		},


		/**
		 * Returns the metadata for this cloudflow url
		 */
		getMetadata: function (pURL) {
			return $.Deferred(function (pDefer) {
				if (METADATA_CACHE[pURL] !== undefined) {
					pDefer.resolve(METADATA_CACHE[pURL]);
					return;
				}

				try {
					var result = api.metadata.get_from_asset(pURL);
					METADATA_CACHE[pURL] = result;
					pDefer.resolve(result);
				} catch (error) {
					pDefer.reject(error);
				}
			});
		},

		/**
		 * Returns the color of the separation for that file
		 */
		getSeparationDefinition: function (url, page, sepname) {
			return this.getMetadata(url).then(function (metadata) {
				if (page >= metadata.pages.length || page < 0) {
					throw new Error('page out of range');
				}

				var pageMetadata = metadata.pages[page];
				var colors = pageMetadata.output_color_space.colorants;
				var separation = _.find(colors, function (c) {
					return c.name === sepname;
				});

				return $.when(separation);
			});
		},

		/**
		 * Returns the web color given a CMYK vector
		 */
		getWebColorFromCMYK: function (cmyk) {
			return CMYKVectorToWebRGB(cmyk);
		}

	};

}());
