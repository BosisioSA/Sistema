/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, $, document, lang_es, lang_en, _*/
/*global namespace, nixps, api, cloudflow_path */
/*global panzer_filelist*/
/*global it, describe */


describe("nixps.patchplanner.mark_decorator", function() {

	describe('construction', function() {

		it('should throw when passing wrong parameters', function() {
			var mark_reference = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/hello.pdf"));

			(function() {
				new nixps.patchplanner.mark_decorator(mark_reference, null);
			}).should.throw();

			(function() {
				new nixps.patchplanner.mark_decorator(mark_reference, 5);
			}).should.throw();

			(function() {
				new nixps.patchplanner.mark_decorator(mark_reference, "");
			}).should.throw();
		});

		it('should construct a decorator object', function() {
			var markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/hello.pdf"));
			var decorator = new nixps.patchplanner.mark_decorator(markref);

			var job_markref = new nixps.patchplanner.job_mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/hello.pdf"));
			var job_decorator = new nixps.patchplanner.mark_decorator(job_markref);
		});
			
		it('should construct a decorator object based on a decorator json', function() {
			var markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/hello.pdf"));
			var decorator = new nixps.patchplanner.mark_decorator(markref);
		});

		it('should not allow construction when some marks have an other resource reference than the one supplied', function() {
			var markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/hello.pdf"));
			var decorator = new nixps.patchplanner.mark_decorator(markref);

			var json = decorator.to_json();

			var markrefother = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/hello2.pdf"));

			(function() {
				var invalidDecorator = new nixps.patchplanner.mark_decorator(markref2, json);
			}).should.throw();
		});
	});

	describe('add_mark', function() {
		var markref;
		var decorator;

		beforeEach(function() {
			markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/mark.pdf"));
			decorator = new nixps.patchplanner.mark_decorator(markref);
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

		it('should add a mark and return its uuid', function() {
			var uuid = decorator.add_mark(4, 5, 0);
			var uuid2 = decorator.add_mark(7, 8, 0);

			uuid.should.be.a.String;
			uuid2.should.be.a.String;

			decorator.get_mark_ids().should.contain(uuid);
			decorator.get_mark_ids().should.contain(uuid2);

			// 4 other marks
			_.filter(decorator.mJSON[0].objects, function(pObject) {
				return (pObject.tags === undefined) 
					&& (pObject.resource !== undefined) 
					&& (pObject.resource.indexOf("mark_") === 0);
			}).length.should.eql(4);

			console.log(decorator);
		});
	});

	describe('remove_mark', function() {
		var markref;
		var decorator;
		var uuid1, uuid2, uuid3;

		beforeEach(function() {
			markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/mark.pdf"));
			decorator = new nixps.patchplanner.mark_decorator(markref);

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
			decorator.get_mark_ids().length.should.eql(3);
		});

	});

	describe('get_mark_ids', function() {
		var markref;
		var decorator;
		var uuid1, uuid2, uuid3;

		beforeEach(function() {
			markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/mark.pdf"));
			decorator = new nixps.patchplanner.mark_decorator(markref);

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
			decorator = new nixps.patchplanner.mark_decorator(markref);

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
			decorator = new nixps.patchplanner.mark_decorator(markref);

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


	describe('set_layer_name', function() {
		var markref;
		var decorator;
		var uuid1, uuid2, uuid3;

		beforeEach(function() {
			markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/mark.pdf"));
			decorator = new nixps.patchplanner.mark_decorator(markref);

			uuid1 = decorator.add_mark(1, 2, 7);
			uuid2 = decorator.add_mark(3, 4, 8);
			uuid3 = decorator.add_mark(5, 6, 9);
		});


		it('should throw when invalid parameters are supplied', function() {
			(function() {
				decorator.set_layer_name("", "layer");
			}).should.throw();

			(function() {
				decorator.set_layer_name("hello", "layer");
			}).should.throw();

			(function() {
				decorator.set_layer_name(null, "layer");
			}).should.throw();

			(function() {
				decorator.set_layer_name(undefined, "layer");
			}).should.throw();

			(function() {
				decorator.set_layer_name(uuid1, "");
			}).should.throw();

			(function() {
				decorator.set_layer_name(uuid1, null);
			}).should.throw();

			(function() {
				decorator.set_layer_name(uuid1, undefined);
			}).should.throw();
		});

		it('should set the layer name', function() {
			decorator.set_layer_name(uuid1, "hello");
			decorator.get_layer_name(uuid1).should.eql("hello");
			decorator.has_layer(uuid1).should.be.true;
			decorator.has_layer(uuid2).should.be.false;
			decorator.has_layer(uuid3).should.be.false;
		});

	});


	describe('get_layer_name', function() {
		var markref;
		var decorator;
		var uuid1, uuid2, uuid3;

		beforeEach(function() {
			markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/mark.pdf"));
			decorator = new nixps.patchplanner.mark_decorator(markref);

			uuid1 = decorator.add_mark(1, 2, 7);
			uuid2 = decorator.add_mark(3, 4, 8);
			uuid3 = decorator.add_mark(5, 6, 9);

			decorator.set_layer_name(uuid1, "one");
			decorator.set_layer_name(uuid2, "two");
		});


		it('should throw when invalid parameters are supplied', function() {
			(function() {
				decorator.get_layer_name("");
			}).should.throw();

			(function() {
				decorator.get_layer_name("hello");
			}).should.throw();

			(function() {
				decorator.get_layer_name(null);
			}).should.throw();

			(function() {
				decorator.get_layer_name(undefined);
			}).should.throw();

			(function() {
				decorator.get_layer_name(uuid3);
			}).should.throw();
		});

		it('should get the layer name', function() {
			decorator.get_layer_name(uuid1).should.eql("one");
			decorator.get_layer_name(uuid2).should.eql("two");
		});
		
	});


	describe('has_layer', function() {
		var markref;
		var decorator;
		var uuid1, uuid2, uuid3;

		beforeEach(function() {
			markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/mark.pdf"));
			decorator = new nixps.patchplanner.mark_decorator(markref);

			uuid1 = decorator.add_mark(1, 2, 7);
			uuid2 = decorator.add_mark(3, 4, 8);
			uuid3 = decorator.add_mark(5, 6, 9);

			decorator.set_layer_name(uuid1, "one");
			decorator.set_layer_name(uuid2, "two");
		});


		it('should throw when invalid parameters are supplied', function() {
			(function() {
				decorator.has_layer("");
			}).should.throw();

			(function() {
				decorator.has_layer("hello");
			}).should.throw();

			(function() {
				decorator.has_layer(null);
			}).should.throw();

			(function() {
				decorator.has_layer(undefined);
			}).should.throw();
		});

		it('should check if the mark has a layer', function() {
			decorator.has_layer(uuid1).should.be.true;
			decorator.has_layer(uuid2).should.be.true;
			decorator.has_layer(uuid3).should.be.false;
		});
		
	});


	describe('to_json', function() {

		it('should return the json representation', function() {
			var markref = new nixps.patchplanner.mark_reference(new cloudflow_path("cloudflow://PP_FILE_STORE/mark.pdf"));
			var decorator = new nixps.patchplanner.mark_decorator(markref);
			var json = decorator.to_json();
			json[0].objects.length.should.eql(0);
		});

	});

});

