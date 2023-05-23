/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, $, document, lang_es, lang_en, _*/
/*global namespace, nixps, api, cloudflow_path */
/*global panzer_filelist*/
/*global it, describe */


describe("nixps.patchplanner.patch_decorator", function() {

	describe('construction', function() {

		it('should throw when passing wrong parameters', function() {
			var mark_reference = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/hello.pdf"));

			(function() {
				new nixps.patchplanner.patch_decorator(mark_reference, null);
			}).should.throw();

			(function() {
				new nixps.patchplanner.patch_decorator(mark_reference, 5);
			}).should.throw();

			(function() {
				new nixps.patchplanner.patch_decorator(mark_reference, "");
			}).should.throw();

			(function() {
				new nixps.patchplanner.patch_decorator(mark_reference, undefined, "");
			}).should.throw();

			(function() {
				new nixps.patchplanner.patch_decorator(mark_reference, undefined, null);
			}).should.throw();

			(function() {
				new nixps.patchplanner.patch_decorator(mark_reference, undefined, 5);
			}).should.throw();
		});

		it('should construct a decorator object', function() {
			var markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/hello.pdf"));
			var decorator = new nixps.patchplanner.patch_decorator(markref);
			decorator.has_layer().should.be.false;
		});
			
		it('should construct a decorator object based on a decorator json', function() {
			var markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/hello.pdf"));
			var decorator = new nixps.patchplanner.patch_decorator(markref);
		});

		it('should construct a decorator object based on a decorator json and restore the layer name if there is one', function() {
			var markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/hello.pdf"));
			var decorator = new nixps.patchplanner.patch_decorator(markref);
		});

		it('should construct a decorator with a layer name', function() {
			var markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/hello.pdf"));
			var decorator = new nixps.patchplanner.patch_decorator(markref, undefined, "layer");
			decorator.has_layer().should.be.true;
			decorator.get_layer_name().should.eql("layer");
		});

		it('should not allow construction when some marks have an other resource reference than the one supplied', function() {
			var markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/hello.pdf"));
			var decorator = new nixps.patchplanner.patch_decorator(markref);

			var json = decorator.to_json();

			var markrefother = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/hello2.pdf"));

			(function() {
				var invalidDecorator = new nixps.patchplanner.patch_decorator(markref2, json);
			}).should.throw();
		});
	});

	describe('add_mark', function() {
		var markref;
		var decorator;
		var decoratorLayer;

		beforeEach(function() {
			markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/mark.pdf"));
			decorator = new nixps.patchplanner.patch_decorator(markref);
			decoratorLayer = new nixps.patchplanner.patch_decorator(markref, undefined, "layer");
		});

		it('should not accept wrong parameters', function() {
			(function() {
				decorator.add_mark();
			}).should.throw();
			(function() {
				decorator.add_mark(5);
			}).should.throw();
			(function() {
				decorator.add_mark(undefined, 5);
			}).should.throw();
			(function() {
				decorator.add_mark("4", "5");
			}).should.throw();
			(function() {
				decorator.add_mark(null, null);
			}).should.throw();
		});

		it('should add a mark and return its uuid, not set the layer', function() {
			var uuid = decorator.add_mark(4, 5, 0);
			var uuid2 = decorator.add_mark(7, 8, 0);

			uuid.should.be.a.String;
			uuid2.should.be.a.String;

			decorator.get_mark_ids().should.contain(uuid);
			decorator.get_mark_ids().should.contain(uuid2);

			// 2 main marks
			_.filter(decorator.mJSON[0].objects, function(pObject) {
				return pObject.tags !== undefined && pObject.layer === undefined
			}).length.should.eql(2);

			// 4 other marks
			_.filter(decorator.mJSON[0].objects, function(pObject) {
				return (pObject.tags === undefined) 
					&& (pObject.resource !== undefined) 
					&& (pObject.resource.indexOf("mark_") === 0)
					&& (pObject.layer === undefined)
			}).length.should.eql(4);

			console.log(decorator);
		});

		it('should add a mark and return its uuid, set the layer', function() {
			var uuid = decoratorLayer.add_mark(4, 5, 0);
			var uuid2 = decoratorLayer.add_mark(7, 8, 0);

			uuid.should.be.a.String;
			uuid2.should.be.a.String;

			decoratorLayer.get_mark_ids().should.contain(uuid);
			decoratorLayer.get_mark_ids().should.contain(uuid2);

			// 2 main marks
			_.filter(decoratorLayer.mJSON[0].objects, function(pObject) {
				return pObject.tags !== undefined && pObject.layer === "layer"
			}).length.should.eql(2);

			// 4 other marks
			_.filter(decoratorLayer.mJSON[0].objects, function(pObject) {
				return (pObject.tags === undefined) 
					&& (pObject.resource !== undefined) 
					&& (pObject.resource.indexOf("mark_") === 0)
					&& (pObject.layer === "layer")
			}).length.should.eql(4);

			console.log(decoratorLayer);
		});

	});

	describe('remove_mark', function() {
		var markref;
		var decorator;
		var uuid1, uuid2, uuid3;

		beforeEach(function() {
			markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/mark.pdf"));
			decorator = new nixps.patchplanner.patch_decorator(markref);

			uuid1 = decorator.add_mark(1, 2, 7);
			uuid2 = decorator.add_mark(3, 4, 8);
			uuid3 = decorator.add_mark(5, 6, 9);
		});

		it('should not accept invalid parameters', function() {
			(function() {
				decorator.remove_mark(5);
			}).should.throw();
			(function() {
				decorator.remove_mark('');
			}).should.throw();
			(function() {
				decorator.remove_mark(undefined);
			}).should.throw();
			(function() {
				decorator.remove_mark(null);
			}).should.throw();
			(function() {
				decorator.remove_mark();
			}).should.throw();
		});

		it('should remove a mark', function() {
			decorator.remove_mark(uuid2);
			decorator.get_mark_ids().should.not.contain(uuid2);
		});

		it('should not throw when mark id is not found in decorator', function() {
			decorator.remove_mark('kaka');
			decorator.get_mark_ids().length.should.eql(4);
		});

	});


	describe('has_layer', function() {
		var markref;
		var decorator;
		var decoratorLayer;

		beforeEach(function() {
			markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/mark.pdf"));
			decorator = new nixps.patchplanner.patch_decorator(markref);
			decoratorLayer = new nixps.patchplanner.patch_decorator(markref, undefined, "layer");
		});

		it('should return true if the decorator has a layer', function() {
			decorator.has_layer().should.be.false;
			decoratorLayer.has_layer().should.be.true;
		});
	});


	describe('get_layer_name', function() {
		var markref;
		var decorator;
		var decoratorLayer;

		beforeEach(function() {
			markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/mark.pdf"));
			decorator = new nixps.patchplanner.patch_decorator(markref);
			decoratorLayer = new nixps.patchplanner.patch_decorator(markref, undefined, "layer");
		});


		it('should throw if the decorator has a no layer', function() {
			(function() {
				decorator.get_layer_name();
			}).should.throw();
		});


		it('should return the layer name if the decorator has a layer', function() {
			decoratorLayer.get_layer_name().should.eql('layer');
		});
	});


	describe('get_mark_ids', function() {
		var markref;
		var decorator;
		var uuid1, uuid2, uuid3;

		beforeEach(function() {
			markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/mark.pdf"));
			decorator = new nixps.patchplanner.patch_decorator(markref);

			uuid1 = decorator.add_mark(1, 2, 7);
			uuid2 = decorator.add_mark(3, 4, 8);
			uuid3 = decorator.add_mark(5, 6, 9);
		});

		it('should return the mark ids', function() {
			decorator.get_mark_ids().should.contain(uuid1);
			decorator.get_mark_ids().should.contain(uuid2);
			decorator.get_mark_ids().should.contain(uuid3);
		});
	});

	describe('get_distances', function() {
		var markref;
		var decorator;
		var uuid1, uuid2, uuid3;

		beforeEach(function() {
			markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/mark.pdf"));
			decorator = new nixps.patchplanner.patch_decorator(markref);

			uuid1 = decorator.add_mark(1, 2, 7);
			uuid2 = decorator.add_mark(3, 4, 8);
			uuid3 = decorator.add_mark(5, 6, 9);
		});

		it('should throw invalid parameters are passed', function() {
			(function() {
				decorator.get_distances(5);
			}).should.throw();
			(function() {
				decorator.get_distances('');
			}).should.throw();
			(function() {
				decorator.get_distances(undefined);
			}).should.throw();
			(function() {
				decorator.get_distances(null);
			}).should.throw();
			(function() {
				decorator.get_distances();
			}).should.throw();

		});

		it('should throw when there is no mark with such id', function() {
			(function() {
				decorator.get_distances('jklfdjsklf');
			}).should.throw();
		});

		it('should return the mark distances', function() {
			decorator.get_distances(uuid1).should.eql({
				left: 1,
				right: 2,
				middle: 7
			});
			decorator.get_distances(uuid2).should.eql({
				left: 3,
				right: 4,
				middle: 8
			});
			decorator.get_distances(uuid3).should.eql({
				left: 5,
				right: 6,
				middle: 9
			});

		});
	});

	describe('set_distances', function() {
		var markref;
		var decorator;
		var uuid1, uuid2, uuid3;

		beforeEach(function() {
			markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/mark.pdf"));
			decorator = new nixps.patchplanner.patch_decorator(markref);

			uuid1 = decorator.add_mark(1, 2, 7);
			uuid2 = decorator.add_mark(3, 4, 8);
			uuid3 = decorator.add_mark(5, 6, 9);
		});

		it('should throw invalid parameters are passed', function() {
			(function() {
				decorator.set_distances(5);
			}).should.throw();
			(function() {
				decorator.set_distances('');
			}).should.throw();
			(function() {
				decorator.set_distances(undefined);
			}).should.throw();
			(function() {
				decorator.set_distances(null);
			}).should.throw();
			(function() {
				decorator.set_distances();
			}).should.throw();
			(function() {
				decorator.set_distances(uuid1, {
					left: 4
				});
			}).should.throw();
			(function() {
				decorator.set_distances(uuid1, {
				});
			}).should.throw();
			(function() {
				decorator.set_distances(uuid1);
			}).should.throw();
			(function() {
				decorator.set_distances(uuid1, {
					left: 4
				});
			}).should.throw();

		});

		it('should throw when there is no mark with such id', function() {
			(function() {
				decorator.set_distances('jklfdjsklf', {
					left: 5,
					right: 5,
					middle: 7,
				});
			}).should.throw();
		});

		it('should set the mark distances', function() {
			decorator.set_distances(uuid1, {
				left: 7,
				right: 8,
				middle: 1
			});
			decorator.get_distances(uuid1).should.eql({
				left: 7,
				right: 8,
				middle: 1
			});
			decorator.get_distances(uuid2).should.eql({
				left: 3,
				right: 4,
				middle: 8
			});
			decorator.get_distances(uuid3).should.eql({
				left: 5,
				right: 6,
				middle: 9
			});
		});
	});

	describe('to_json', function() {

		it('should return the json representation', function() {
			var markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/mark.pdf"));
			var decorator = new nixps.patchplanner.patch_decorator(markref);
			var json = decorator.to_json();
			json[0].objects.length.should.eql(7);
		});

	});

});
