/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, $, document, lang_es, lang_en, _*/
/*global namespace, nixps, api, cloudflow_path */
/*global panzer_filelist*/
/*global it, describe */


describe("nixps.patchplanner.mark_reference", function() {

	describe('construction', function() {

		it('should throw when invalid parameters are supplied', function() {
			(function() {
				new nixps.patchplanner.mark_reference(null);
			}).should.throw();

			(function() {
				new nixps.patchplanner.mark_reference(5);
			}).should.throw();

			(function() {
				new nixps.patchplanner.mark_reference("");
			}).should.throw();

			(function() {
				new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/hello/"));
			}).should.throw();
		});

		it('should construct a mark reference when valid path is supplied', function() {
			new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/hello/world.pdf"));

			new nixps.patchplanner.mark_reference(undefined);
		});

	});

	describe('toString', function() {

		it('should generate a unique id for the mark', function() {
			var ref1 = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/hello/world1.pdf"));
			ref1.toString().should.eql("mark_759f2898e4e3b49571f262a648310d45");
			var ref2 = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/hello/world2.pdf"));
			ref2.toString().should.eql("mark_f759ee0f51e91113c9f2f12442e9e394");
		});

	});

});


