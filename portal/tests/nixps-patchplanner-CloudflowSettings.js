/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, $, document, lang_es, lang_en, _*/
/*global namespace, nixps, api, cloudflow_path */
/*global panzer_filelist*/
/*global it, describe */

describe("nixps.patchplanner.CloudflowSettings", function() {

	describe('construction', function() {

		it('should construct the cloudflow settings', function() {
			var settings = new nixps.patchplanner.CloudflowSettings();
			settings.should.instanceof(nixps.patchplanner.CloudflowSettings);
		});

	});

	describe('Member functions', function() {

		var settings = new nixps.patchplanner.CloudflowSettings();


		describe('getApplicationPath', function() {

			it('should return the application path', function() {
				var path = settings.getApplicationPath();
				path.should.instanceof(nixps.cloudflow.URLPath);
			});

		});

		describe('getFontPath', function() {

			it('should return the font path', function() {
				var path = settings.getFontPath();
				path.should.instanceof(nixps.cloudflow.URLPath);
			});

		});

		describe('getMarksPath', function() {

			it('should return the application path', function() {
				var path = settings.getMarksPath();
				path.should.instanceof(nixps.cloudflow.URLPath);
			});

		});

		describe('getMOMOutputPath', function() {

			it('should return the MOM output path', function() {
				var path = settings.getMOMOutputPath();
				path.should.instanceof(nixps.cloudflow.URLPath);
			});

		});

		describe('getJobsPath', function() {

			it('should return the application path', function() {
				var path = settings.getJobsPath();
				path.should.instanceof(nixps.cloudflow.URLPath);
			});

		});

		describe('getPatchSheetsPath', function() {

			it('should return the patch sheets path', function() {
				var path = settings.getPatchSheetsPath();
				path.should.instanceof(nixps.cloudflow.URLPath);
			});

		});

		describe('getPDFOutputPath', function() {

			it('should return the PDF output path', function() {
				var path = settings.getPDFOutputPath();
				path.should.instanceof(nixps.cloudflow.URLPath);
			});

		});

		describe('getOutputFormat', function() {

			it('should return the output format', function() {
				var output = settings.getOutputFormat();
				output.should.be.type('string');
				output.length.should.above(0);
			});

		});

		describe('getSheetSettings', function() {

			it('should return the sheet settings', function() {
				var sheetSettings = settings.getSheetSettings();
				sheetSettings.should.be.instanceof(nixps.patchplanner.SheetSettings);
			});

		});


		describe('getMOMSettings', function() {

			it('should return the MOM settings', function() {
				var momSettings = settings.getMOMSettings();
				momSettings.should.be.instanceof(nixps.patchplanner.MOMSettings);
			});

		});

	});

});


