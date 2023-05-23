/*jslint white:true, nomen:true, sloppy:true, vars:true, regexp:true*/
/*global panzer, $, document, lang_es, lang_en, _*/
/*global namespace, nixps, api, cloudflow_path */
/*global panzer_filelist*/
/*global it, describe */


describe("nixps.patchplanner.layout_document", function() {
	describe('construction', function() {
		it("should throw when invalid parameters are supplied", function() {
			(function() {
				new nixps.patchplanner.layout_document(null);
			}).should.throw();

			(function() {
				new nixps.patchplanner.layout_document(5);
			}).should.throw();

			(function() {
				new nixps.patchplanner.layout_document("");
			}).should.throw();

			(function() {
				new nixps.patchplanner.layout_document(undefined);
			}).should.throw();
		});

		it("should construct an empty document when sheet width and height are supplied", function() {
			var doc = new nixps.patchplanner.layout_document(10, 10);
			doc.get_sheet(0).should.be.an.instanceof(nixps.layout.sheet);
		});

		// it("should construct when supplying a valid layout document", function() {
		// 	throw new Error('to implement');
		// });
	});

	describe('functions', function() {
		describe('add_file', function() {
			var layout_document;

			beforeEach(function() {
				layout_document = new nixps.patchplanner.layout_document(10,10);
			});

			it('should not accept invalid parameters', function() {
				(function() {
					layout_document.add_file(null);
				}).should.throw();

				(function() {
					layout_document.add_file('');
				}).should.throw();

				(function() {
					layout_document.add_file(undefined);
				}).should.throw();

				(function() {
					layout_document.add_file(new cloudflow_path('cloudflow://PP_FILE_STORE/i_am_a_path/'));
				}).should.throw();
			});

			it('should not allow to re-add the same file', function() {
				layout_document.add_file(new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf'));
				(function() {
					layout_document.add_file(new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf'));
				}).should.throw();
			});

			it('should accept cloudflow file references and add the marks resources', function() {
				layout_document.add_file(new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf'));
				layout_document.add_file(new cloudflow_path('cloudflow://PP_FILE_STORE/b.pdf'));
				layout_document.add_file(new cloudflow_path('cloudflow://PP_FILE_STORE/c.pdf'));
				var markidA = layout_document.get_job_decorator(new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf')).get_mark_ids()[0];
				var markidB = layout_document.get_job_decorator(new cloudflow_path('cloudflow://PP_FILE_STORE/b.pdf')).get_mark_ids()[0];
				var markidC = layout_document.get_job_decorator(new cloudflow_path('cloudflow://PP_FILE_STORE/c.pdf')).get_mark_ids()[0];

				console.log(JSON.stringify(layout_document.to_json()));
				layout_document.to_json().should.eql({
					"resources": {
						"slugfont": [
							{ "font": "cloudflow://PP_FILE_STORE/Fonts/SourceCodePro-Regular.otf" }
						],
						"white": [
							{ "cmyk": [0, 0, 0, 0] }
						],
						"files": [
							{ "url":"cloudflow://PP_FILE_STORE/a.pdf" },
							{ "url":"cloudflow://PP_FILE_STORE/b.pdf" },
							{ "url":"cloudflow://PP_FILE_STORE/c.pdf" }
						],
					    "mark_cf4fc4627af08acb606cb2b46b251f18": [
					      {
					        "url": "cloudflow://PP_FILE_STORE/Marks/Default.pdf"
					      }
					    ],
					    "job_mark_cf4fc4627af08acb606cb2b46b251f18": [
					      {
					        "url": "cloudflow://PP_FILE_STORE/JobMarks/Default.pdf"
					      }
					    ],
					    "job_decorator_cf4fc4627af08acb606cb2b46b251f18": [
					      {
					        "objects": []
					      }
					    ],
					    "job_file_cf4fc4627af08acb606cb2b46b251f18": [
					      {
					        "url": "cloudflow://PP_FILE_STORE/a.pdf",
					        "decorator": "job_decorator_cf4fc4627af08acb606cb2b46b251f18"
					      }
					    ],
					    "mark_b9f0b0bf73046cf4638fa5a87f80d7ac": [
					      {
					        "url": "cloudflow://PP_FILE_STORE/Marks/Default.pdf"
					      }
					    ],
					    "job_mark_b9f0b0bf73046cf4638fa5a87f80d7ac": [
					      {
					        "url": "cloudflow://PP_FILE_STORE/JobMarks/Default.pdf"
					      }
					    ],
					    "job_decorator_b9f0b0bf73046cf4638fa5a87f80d7ac": [
					      {
					        "objects": []
					      }
					    ],
					    "job_file_b9f0b0bf73046cf4638fa5a87f80d7ac": [
					      {
					        "url": "cloudflow://PP_FILE_STORE/b.pdf",
					        "decorator": "job_decorator_b9f0b0bf73046cf4638fa5a87f80d7ac"
					      }
					    ],
					    "mark_45fb9927ad7ac39da2ce9651e107ff16": [
					      {
					        "url": "cloudflow://PP_FILE_STORE/Marks/Default.pdf"
					      }
					    ],
					    "job_mark_45fb9927ad7ac39da2ce9651e107ff16": [
					      {
					        "url": "cloudflow://PP_FILE_STORE/JobMarks/Default.pdf"
					      }
					    ],
					    "job_decorator_45fb9927ad7ac39da2ce9651e107ff16": [
					      {
					        "objects": [ ]
					      }
					    ],
					    "job_file_45fb9927ad7ac39da2ce9651e107ff16": [
					      {
					        "url": "cloudflow://PP_FILE_STORE/c.pdf",
					        "decorator": "job_decorator_45fb9927ad7ac39da2ce9651e107ff16"
					      }
					    ]
						},
					"data": {},
					"sheets": [ { 
						"width": 10, 
						"height": 10, 
						"objects": []
					} ] 
				});
			});
		});

		describe('has_file', function() {
			var layout_document;
			var path1;
			var path2;
			var path3;

			beforeEach(function() {
				layout_document = new nixps.patchplanner.layout_document(10, 10);
				path1 = new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf');
				layout_document.add_file(path1);
				path2 = new cloudflow_path('cloudflow://PP_FILE_STORE/b.pdf');
				layout_document.add_file(path2);
				path3 = new cloudflow_path('cloudflow://PP_FILE_STORE/c.pdf');
				layout_document.add_file(path3);
			});

			it('should not accept invalid parameters', function() {
				(function() {
					layout_document.has_file(null);
				}).should.throw();

				(function() {
					layout_document.has_file('');
				}).should.throw();

				(function() {
					layout_document.has_file(undefined);
				}).should.throw();

				(function() {
					layout_document.has_file(new cloudflow_path('cloudflow://PP_FILE_STORE/i_am_a_path/'));
				}).should.throw();
			});

			it('should return true if the file is present in the layout', function() {
				layout_document.has_file(path1).should.eql(true);
				layout_document.has_file(new cloudflow_path('cloudflow://PP_FILE_STORE/d.pdf')).should.eql(false);
			});
		});

		describe('remove_file', function() {
			var layout_document;
			var path1;
			var path2;
			var path3;

			beforeEach(function() {
				layout_document = new nixps.patchplanner.layout_document(10, 10);
				path1 = new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf');
				layout_document.add_file(path1);
				path2 = new cloudflow_path('cloudflow://PP_FILE_STORE/b.pdf');
				layout_document.add_file(path2);
				path3 = new cloudflow_path('cloudflow://PP_FILE_STORE/c.pdf');
				layout_document.add_file(path3);
			});

			it('should not accept invalid parameters', function() {
				(function() {
					layout_document.remove_file(null);
				}).should.throw();

				(function() {
					layout_document.remove_file('');
				}).should.throw();

				(function() {
					layout_document.remove_file(undefined);
				}).should.throw();

				(function() {
					layout_document.remove_file(new cloudflow_path('cloudflow://PP_FILE_STORE/i_am_a_path/'));
				}).should.throw();
			});

			it('should not throw if path is not present', function() {
				layout_document.remove_file(new cloudflow_path('cloudflow://PP_FILE_STORE/d.pdf'));
			});

			it('remove the file from the layout document', function() {
				layout_document.has_file(path1).should.eql(true);
				layout_document.remove_file(path1);
				layout_document.has_file(path1).should.eql(false);
				console.log(layout_document.to_json());
			});

			it('should remove all related patches and decorators', function() {
				throw new Error('to implement');
			});
		});

		describe('get_filelist', function() {
			var layout_document;
			var path1;
			var path2;
			var path3;

			beforeEach(function() {
				layout_document = new nixps.patchplanner.layout_document(10, 10);
				path1 = new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf');
				layout_document.add_file(path1);
				path2 = new cloudflow_path('cloudflow://PP_FILE_STORE/b.pdf');
				layout_document.add_file(path2);
				path3 = new cloudflow_path('cloudflow://PP_FILE_STORE/c.pdf');
				layout_document.add_file(path3);
			});

			it('should return the filelist', function() {
				layout_document.get_filelist().should.eql([path1, path2, path3]);
			});
		});

		describe('set_mark', function() {
			var layout_document;
			var jobpath;
			var markidA;

			beforeEach(function() {
				layout_document = new nixps.patchplanner.layout_document(10, 10);
				jobpath = new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf');
				layout_document.add_file(jobpath);
				markidA = layout_document.get_job_decorator(jobpath).get_mark_ids()[0];
			});

			it('should not accept invalid parameters', function() {
				(function() {
					layout_document.set_mark(jobpath, null);
				}).should.throw();
				(function() {
					layout_document.set_mark(jobpath, new cloudflow_path("cloudflow://PP_FILE_STORE/hello/"));
				}).should.throw();
				(function() {
					layout_document.set_mark(jobpath, 5);
				}).should.throw();
				(function() {
					layout_document.set_mark(jobpath, undefined);
				}).should.throw();
				(function() {
					layout_document.set_mark(jobpath, "hello");
				}).should.throw();
			});

			it('should set the mark', function() {
				layout_document.set_mark(jobpath, new cloudflow_path("cloudflow://PP_FILE_STORE/hello/mark.pdf"));
				layout_document.to_json().should.eql({
				   "resources": {
				      "slugfont": [
				         {
				            "font": "cloudflow://PP_FILE_STORE/Fonts/SourceCodePro-Regular.otf"
				         }
				      ],
					  "white": [
						 { "cmyk": [0, 0, 0, 0] }
					  ],
				      "files": [
				         {
				            "url": "cloudflow://PP_FILE_STORE/a.pdf"
				         }
				      ],
				      "mark_cf4fc4627af08acb606cb2b46b251f18": [
				         {
				            "url": "cloudflow://PP_FILE_STORE/hello/mark.pdf"
				         }
				      ],
					  "job_mark_cf4fc4627af08acb606cb2b46b251f18": [
					    {
					      "url": "cloudflow://PP_FILE_STORE/JobMarks/Default.pdf"
					    }
					  ],
					  "job_decorator_cf4fc4627af08acb606cb2b46b251f18": [
					    {
					      "objects": [ ]
					    }
					  ],
					  "job_file_cf4fc4627af08acb606cb2b46b251f18": [
					    {
					      "url": "cloudflow://PP_FILE_STORE/a.pdf",
					      "decorator": "job_decorator_cf4fc4627af08acb606cb2b46b251f18"
					    }
					  ]
				   },
				   "data": {},
					"sheets": [ { 
						"width": 10, 
						"height": 10, 
						"objects": []
					} ] 
				});

				layout_document.set_mark(jobpath, new cloudflow_path("cloudflow://PP_FILE_STORE/hello/mark2.pdf"));
				layout_document.to_json().should.eql({
				   "resources": {
				      "slugfont": [
				         {
				            "font": "cloudflow://PP_FILE_STORE/Fonts/SourceCodePro-Regular.otf"
				         }
				      ],
					  "white": [
						 { "cmyk": [0, 0, 0, 0] }
					  ],
				      "files": [
				         {
				            "url": "cloudflow://PP_FILE_STORE/a.pdf"
				         }
				      ],
				      "mark_cf4fc4627af08acb606cb2b46b251f18": [
				         {
				            "url": "cloudflow://PP_FILE_STORE/hello/mark2.pdf"
				         }
				      ],
					  "job_mark_cf4fc4627af08acb606cb2b46b251f18": [
					    {
					      "url": "cloudflow://PP_FILE_STORE/JobMarks/Default.pdf"
					    }
					  ],
					  "job_decorator_cf4fc4627af08acb606cb2b46b251f18": [
					    {
					      "objects": []
					    }
					  ],
					  "job_file_cf4fc4627af08acb606cb2b46b251f18": [
					    {
					      "url": "cloudflow://PP_FILE_STORE/a.pdf",
					      "decorator": "job_decorator_cf4fc4627af08acb606cb2b46b251f18"
					    }
					  ]
				   },
				   "data": {},
					"sheets": [ { 
						"width": 10, 
						"height": 10, 
						"objects": []
					} ] 							   
				});
			});
		});

		describe('get_mark', function() {
			var layout_document;
			var jobpath;
			var mark;

			beforeEach(function() {
				layout_document = new nixps.patchplanner.layout_document(10,10);
				jobpath = new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf');
				layout_document.add_file(jobpath);
				mark = new cloudflow_path('cloudflow://PP_FILE_STORE/Marks/mark.pdf');
				layout_document.set_mark(jobpath, mark);
			});

			it('should not accept wrong parameters', function() {
				(function() {
					layout_document.get_mark(null);
				}).should.throw();
				(function() {
					layout_document.get_mark(new cloudflow_path("cloudflow://PP_FILE_STORE/hello/"));
				}).should.throw();
				(function() {
					layout_document.get_mark(5);
				}).should.throw();
				(function() {
					layout_document.get_mark(undefined);
				}).should.throw();
				(function() {
					layout_document.get_mark("hello");
				}).should.throw();

			});

			it('should throw if the job does no exist', function() {
				(function() {
					layout_document.get_mark(new cloudflow_path("cloudflow://PP_FILE_STORE/hello/test.pdf"));
				}).should.throw();
			});

			it('should return the mark for the job', function() {
				layout_document.get_mark(jobpath).should.eql(mark);
			});
		});

		describe('get_decorator', function() {
			var layout_document;
			var patchid;
			var path;

			beforeEach(function() {
				layout_document = new nixps.patchplanner.layout_document(10, 10);
				path = new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf');
				layout_document.add_file(path);
				patchid = layout_document.add_patch("1", path, 0, "cyan", 1, 2, 3 ,4);
			});

			it('should not accept invalid parameters', function() {
				(function() {
					layout_document.get_decorator("");
				}).should.throw();

				(function() {
					layout_document.get_decorator(null);
				}).should.throw();

				(function() {
					layout_document.get_decorator(undefined);
				}).should.throw();

				(function() {
					layout_document.get_decorator(5);
				}).should.throw();
			});

			it('should return a decorator given a patch id', function() {
				var decorator = layout_document.get_decorator(patchid);

				// Check the created decorator has the default values
				var markids = decorator.get_mark_ids();
				markids.length.should.eql(1);
				var distances = decorator.get_distances(markids[0]);
				distances.left.should.eql(23);
				distances.right.should.eql(23);
			});

			it('should throw an error if there is no such patch id', function() {
				(function() {
					layout_document.get_decorator("42");
				}).should.throw();
			});
		});

		describe('set_decorator', function() {
			var layout_document;
			var patchid;
			var path;

			beforeEach(function() {
				layout_document = new nixps.patchplanner.layout_document(10, 10);
				path = new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf');
				layout_document.add_file(path);
				patchid = layout_document.add_patch("1", path, 0, "cyan", 1, 2, 3 ,4);
			});

			it('should not accept invalid parameters', function() {
				(function() {
					layout_document.set_decorator("");
				}).should.throw();

				(function() {
					layout_document.set_decorator(null);
				}).should.throw();

				(function() {
					layout_document.set_decorator(undefined);
				}).should.throw();

				(function() {
					layout_document.set_decorator(5);
				}).should.throw();

				(function() {
					layout_document.set_decorator(patchid, "");
				}).should.throw();

				(function() {
					layout_document.set_decorator(patchid, null);
				}).should.throw();

				(function() {
					layout_document.set_decorator(patchid, undefined);
				}).should.throw();

				(function() {
					layout_document.set_decorator(patchid, 5);
				}).should.throw();
			});

			it('should set a new decorator given a patch id', function() {
				var decorator = layout_document.get_decorator(patchid);
				var markid = decorator.get_mark_ids()[0];

				decorator.set_distances(markid, {
					left: 2,
					right: 3,
					middle: 4
				});

				layout_document.set_decorator(patchid, decorator);

				var newdeco = layout_document.get_decorator(patchid);
				var newdistances = newdeco.get_distances(markid);
				newdistances.should.eql({
					left: 2,
					right: 3,
					middle: 4
				});
			});

			it('should throw an error if there is no such patch id', function() {
				var decorator = layout_document.get_decorator(patchid);
				var markid = decorator.get_mark_ids()[0];

				decorator.set_distances(markid, {
					left: 2,
					right: 3,
					middle: 4
				});

				(function() {
					layout_document.set_decorator("42", decorator);
				}).should.throw();
			});
		});

		describe('get_job_decorator', function() {
			var layout_document;
			var path;

			beforeEach(function() {
				layout_document = new nixps.patchplanner.layout_document(10, 10);
				path = new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf');
				layout_document.add_file(path);
			});

			it('should not accept invalid parameters', function() {
				(function() {
					layout_document.get_decorator("");
				}).should.throw();

				(function() {
					layout_document.get_decorator(null);
				}).should.throw();

				(function() {
					layout_document.get_decorator(undefined);
				}).should.throw();

				(function() {
					layout_document.get_decorator(5);
				}).should.throw();
			});

			it('should return a decorator given the job path', function() {
				var decorator = layout_document.get_job_decorator(path);

				// Check the created decorator has the default values
				var markids = decorator.get_mark_ids();
				markids.length.should.eql(0);
			});

			it('should throw an error if there is no such job', function() {
				(function() {
					layout_document.get_decorator(new cloudflow_path('cloudflow://PP_FILE_STORE/b.pdf'));
				}).should.throw();
			});
		});

		describe('set_job_decorator', function() {
			var layout_document;
			var path;

			beforeEach(function() {
				layout_document = new nixps.patchplanner.layout_document(10, 10);
				path = new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf');
				layout_document.add_file(path);
			});

			it('should not accept invalid parameters', function() {
				(function() {
					layout_document.set_job_decorator("");
				}).should.throw();

				(function() {
					layout_document.set_job_decorator(null);
				}).should.throw();

				(function() {
					layout_document.set_job_decorator(undefined);
				}).should.throw();

				(function() {
					layout_document.set_job_decorator(5);
				}).should.throw();

				(function() {
					layout_document.set_job_decorator(path, "");
				}).should.throw();

				(function() {
					layout_document.set_job_decorator(path, null);
				}).should.throw();

				(function() {
					layout_document.set_job_decorator(path, undefined);
				}).should.throw();

				(function() {
					layout_document.set_job_decorator(path, 5);
				}).should.throw();
			});

			it('should set a new decorator given a path', function() {
				var decorator = layout_document.get_job_decorator(path);

				var markid = decorator.add_mark(2,3,4);
				layout_document.set_job_decorator(path, decorator);

				var newdeco = layout_document.get_job_decorator(path);
				var newdistances = newdeco.get_distances(markid);
				newdistances.should.eql({
					left: 2,
					right: 3,
					middle: 4
				});
			});

			it('should throw an error if there is no such path', function() {
				var decorator = layout_document.get_job_decorator(path);
				decorator.get_mark_ids().length.should.eql(0);

				(function() {
					layout_document.set_job_decorator(new cloudflow_path('cloudflow://PP_FILE_STORE/b.pdf'), decorator);
				}).should.throw();
			});
		});

		describe('add_patch', function() {
			var layout_document;
			var path1;
			var path2;
			var path3;

			beforeEach(function() {
				layout_document = new nixps.patchplanner.layout_document(10, 10);
				path1 = new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf');
				layout_document.add_file(path1);
				path2 = new cloudflow_path('cloudflow://PP_FILE_STORE/b.pdf');
				layout_document.add_file(path2);
				path3 = new cloudflow_path('cloudflow://PP_FILE_STORE/c.pdf');
				layout_document.add_file(path3);
			});

			it('should not accept wrong parameters', function() {
				(function() {
					layout_document.add_patch(new cloudflow_path('cloudflow://PP_FILE_STORE/'), "0", "cyan", 1, 2, 3 ,4);
				}).should.throw();

				(function() {
					layout_document.add_patch(new cloudflow_path('cloudflow://PP_FILE_STORE/c.pdf'), "0", "cyan", 1, 2, 3 ,4);
				}).should.throw();

				(function() {
					layout_document.add_patch(new cloudflow_path('cloudflow://PP_FILE_STORE/c.pdf'), "0", "", 1, 2, 3 ,4);
				}).should.throw();

				(function() {
					layout_document.add_patch(new cloudflow_path('cloudflow://PP_FILE_STORE/c.pdf'), "0", "cyan", 'brol', 2, 3 ,4);
				}).should.throw();
			});

			it('should not add a patch with an already existing id', function() {
				var id1 = layout_document.add_patch("1", path1, 0, "cyan", 1, 2, 3 ,4);
				(function() {
					var id11 = layout_document.add_patch("1", path1, 0, "cyan", 1, 2, 3 ,4);
				}).should.throw();
			});

			it('should add patches on the correct files', function() {
				var id1 = layout_document.add_patch("1", path1, 0, "cyan", 1, 2, 3 ,4);
				var id2 = layout_document.add_patch("2", path1, 1, "magenta", 5, 6, 7 ,8);
				var id3 = layout_document.add_patch("3", path2, 0, "cyan", 1, 2, 3 ,4);
				var id4 = layout_document.add_patch("4", path2, 1, "cyan", 1, 2, 3 ,4);
				var id5 = layout_document.add_patch("5", path3, 0, "cyan", 1, 2, 3 ,4);
				var id6 = layout_document.add_patch("6", path3, 1, "cyan", 1, 2, 3 ,4);

				layout_document.get_patchids(path1).should.eql([id1, id2]);
				layout_document.get_patchids(path2).should.eql([id3, id4]);
				layout_document.get_patchids(path3).should.eql([id5, id6]);

				// TODO: improve test
				// layout_document.to_json().should.eql({"resources":{"files":[{"url":"cloudflow://PP_FILE_STORE/a.pdf"},{"url":"cloudflow://PP_FILE_STORE/b.pdf"},{"url":"cloudflow://PP_FILE_STORE/c.pdf"}],id1:[{"url":"cloudflow://PP_FILE_STORE/a.pdf","page":0,"separation":"cyan","box":"cropbox","x":1,"y":2,"width":3,"height":4}], id2: {"url":"cloudflow://PP_FILE_STORE/a.pdf","page":1,"separation":"magenta","box":"cropbox","x":5,"y":6,"width":7,"height":8},{"url":"cloudflow://PP_FILE_STORE/b.pdf","page":0,"separation":"cyan","box":"cropbox","x":1,"y":2,"width":3,"height":4},{"url":"cloudflow://PP_FILE_STORE/b.pdf","page":1,"separation":"cyan","box":"cropbox","x":1,"y":2,"width":3,"height":4},{"url":"cloudflow://PP_FILE_STORE/c.pdf","page":0,"separation":"cyan","box":"cropbox","x":1,"y":2,"width":3,"height":4},{"url":"cloudflow://PP_FILE_STORE/c.pdf","page":1,"separation":"cyan","box":"cropbox","x":1,"y":2,"width":3,"height":4}]}});
			});

			it('should create associated decorators and refer to them', function() {
				var id1 = layout_document.add_patch("1", path1, 0, "cyan", 1, 2, 3, 4);
				var decorator = layout_document.get_decorator(id1);

				// Check the created decorator has the default values
				var markids = decorator.get_mark_ids();
				markids.length.should.eql(1);
				var distances = decorator.get_distances(markids[0]);
				distances.left.should.eql(23);
				distances.right.should.eql(23);

				decorator.has_layer().should.be.true;
				decorator.get_layer_name().should.eql('mark');
				var ids = decorator.get_mark_ids();
				for(var i = 0; i < ids.length; i++) {
					decorator.get_layer_name(ids[i]).should.eql('mark');
				}
			});

			it('should not add patches for files not present in the filelist', function() {
				var notinlist = new cloudflow_path("cloudflow://PP_FILE_STORE/d.pdf");
				(function() {
					var id = layout_document.add_patch("7", notinlist, 0, "cyan", 1, 2, 3 ,4);
				}).should.throw();
			});
		});

		describe('remove_patch', function() {
			var layout_document;
			var path1;
			var path2;
			var path3;

			beforeEach(function() {
				layout_document = new nixps.patchplanner.layout_document(10, 10);
				path1 = new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf');
				layout_document.add_file(path1);
				path2 = new cloudflow_path('cloudflow://PP_FILE_STORE/b.pdf');
				layout_document.add_file(path2);
				path3 = new cloudflow_path('cloudflow://PP_FILE_STORE/c.pdf');
				layout_document.add_file(path3);

				layout_document.add_patch("1", path1, 0, "cyan", 1, 2, 3 ,4);
				layout_document.add_patch("2", path1, 1, "magenta", 5, 6, 7 ,8);
				layout_document.add_patch("3", path2, 0, "cyan", 1, 2, 3 ,4);
				layout_document.add_patch("4", path2, 1, "cyan", 1, 2, 3 ,4);
				layout_document.add_patch("5", path3, 0, "cyan", 1, 2, 3 ,4);
				layout_document.add_patch("6", path3, 1, "cyan", 1, 2, 3 ,4);
			});

			it('should not accept wrong parameters', function() {
				(function() {
					layout_document.remove_patch("");
				}).should.throw();

				(function() {
					layout_document.remove_patch(undefined);
				}).should.throw();

				(function() {
					layout_document.remove_patch();
				}).should.throw();

				(function() {
					layout_document.remove_patch(null);
				}).should.throw();

				(function() {
					layout_document.remove_patch(5);
				}).should.throw();
			});

			it('should not throw if the patch does not exist', function() {
				layout_document.remove_patch("42");
			});

			it('should remove the patch and the decorator', function() {
				layout_document.remove_patch("1");
				(function() {
					layout_document.get_decorator("1");
				}).should.throw();
				layout_document.has_patch("1").should.eql(false);
			});
		});

		describe('remove_patches', function() {
			var layout_document;
			var path1;
			var path2;
			var path3;

			beforeEach(function() {
				layout_document = new nixps.patchplanner.layout_document(10, 10);
				path1 = new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf');
				layout_document.add_file(path1);
				path2 = new cloudflow_path('cloudflow://PP_FILE_STORE/b.pdf');
				layout_document.add_file(path2);
				path3 = new cloudflow_path('cloudflow://PP_FILE_STORE/c.pdf');
				layout_document.add_file(path3);

				layout_document.add_patch("1", path1, 0, "cyan", 1, 2, 3 ,4);
				layout_document.add_patch("2", path1, 1, "magenta", 5, 6, 7 ,8);
				layout_document.add_patch("3", path2, 0, "cyan", 1, 2, 3 ,4);
				layout_document.add_patch("4", path2, 1, "cyan", 1, 2, 3 ,4);
				layout_document.add_patch("5", path3, 0, "cyan", 1, 2, 3 ,4);
				layout_document.add_patch("6", path3, 1, "cyan", 1, 2, 3 ,4);
			});

			it('should not accept wrong parameters', function() {
				(function() {
					layout_document.remove_patches(new cloudflow_path('cloudflow://PP_FILE_STORE/'));
				}).should.throw();

				(function() {
					layout_document.remove_patches(undefined);
				}).should.throw();

				(function() {
					layout_document.remove_patches();
				}).should.throw();
			});

			it('should not throw if the file is not in the document, leaving the document untouched', function() {
				 layout_document.remove_patches(new cloudflow_path('cloudflow://PP_FILE_STORE/not_present.pdf'));
			});

			it('should remove the patches for a file, leave the others untouched', function() {
				layout_document.remove_patches(path1);
				(function() {
					layout_document.get_decorator("1");
				}).should.throw();
				(function() {
					layout_document.get_decorator("2");
				}).should.throw();
				layout_document.get_patchids(path1).length.should.eql(0);
				layout_document.get_patchids(path2).length.should.eql(2);
				layout_document.get_patchids(path3).length.should.eql(2);
			});
		});

		describe('get_patchids', function() {
			var layout_document;
			var path1;
			var path2;
			var path3;

			beforeEach(function() {
				layout_document = new nixps.patchplanner.layout_document(10, 10);
				path1 = new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf');
				layout_document.add_file(path1);
				path2 = new cloudflow_path('cloudflow://PP_FILE_STORE/b.pdf');
				layout_document.add_file(path2);
				path3 = new cloudflow_path('cloudflow://PP_FILE_STORE/c.pdf');
				layout_document.add_file(path3);

				layout_document.add_patch("1", path1, 0, "cyan", 1, 2, 3 ,4);
				layout_document.add_patch("2", path1, 1, "magenta", 5, 6, 7 ,8);
				layout_document.add_patch("3", path2, 0, "cyan", 1, 2, 3 ,4);
				layout_document.add_patch("4", path2, 1, "cyan", 1, 2, 3 ,4);
				layout_document.add_patch("5", path3, 0, "cyan", 1, 2, 3 ,4);
				layout_document.add_patch("6", path3, 1, "cyan", 1, 2, 3 ,4);
			});

			it('should return the list of patch ids for a file', function() {
				var patches = layout_document.get_patchids(path1);
				patches.length.should.eql(2);
				patches.should.eql(["1", "2"]);
			});
		});

		describe('get_patch', function() {
			var layout_document;
			var path1;
			var path2;
			var path3;

			beforeEach(function() {
				layout_document = new nixps.patchplanner.layout_document(10, 10);
				path1 = new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf');
				layout_document.add_file(path1);
				path2 = new cloudflow_path('cloudflow://PP_FILE_STORE/b.pdf');
				layout_document.add_file(path2);
				path3 = new cloudflow_path('cloudflow://PP_FILE_STORE/c.pdf');
				layout_document.add_file(path3);

				layout_document.add_patch("1", path1, 0, "cyan", 1, 2, 3 ,4);
				layout_document.add_patch("2", path1, 1, "magenta", 5, 6, 7 ,8);
				layout_document.add_patch("3", path2, 0, "cyan", 1, 2, 3 ,4);
				layout_document.add_patch("4", path2, 1, "cyan", 1, 2, 3 ,4);
				layout_document.add_patch("5", path3, 0, "cyan", 1, 2, 3 ,4);
				layout_document.add_patch("6", path3, 1, "cyan", 1, 2, 3 ,4);
			});

			it('should return the list of resource_elements (patches) for a file', function() {
				var patchids = layout_document.get_patchids(path1);
				patchids.length.should.eql(2);
				_.each(patchids, function(p_id) {
					var patch = layout_document.get_patch(p_id);
					patch.should.be.an.instanceof(nixps.layout.file_resource_element);
					patch.get_file().get_full_path().should.eql(path1.get_full_path());
				});

			});
		});

		describe('has_patch', function() {
			var layout_document;
			var path1;

			it('should check if a patch id is present', function() {
				layout_document = new nixps.patchplanner.layout_document(10, 10);
				path1 = new cloudflow_path('cloudflow://PP_FILE_STORE/a.pdf');
				layout_document.add_file(path1);

				layout_document.add_patch("1", path1, 0, "cyan", 1, 2, 3 ,4);
				layout_document.add_patch("2", path1, 1, "magenta", 5, 6, 7 ,8);

				layout_document.has_patch("42").should.eql(false);
				layout_document.has_patch("2").should.eql(true);
			});
		});
	});
});
