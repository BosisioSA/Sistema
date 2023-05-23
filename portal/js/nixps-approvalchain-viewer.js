var approvalchain_viewer = {
	/**
	 * Creates a viewer for that approval chain and attaches it to $element
	 */
	view_chain: function(chainjson, $element) {
		approvalchain_viewer._initialize($element);
		approvalchain_viewer.loadjson(chainjson);
		approvalchain_viewer.enable_handlers();
	},

	/**
	 * The editor event handlers
	 */
	enable_handlers: function() {
		$('#closebutton').bind('click', function() {
			$('#chain_viewer').hide();
			$('#chain_viewer').remove();
			$('body').trigger('chainviewerclosed');
		});
	},

	/**
	 * Loads the chain json object
	 */
	loadjson: function(json) {
		/*json = {"name":"superchain",
				"_id":"4A9EE449-176B-4D3C-A05C-DDB1DEA64769",
				"active": [3],
				"steps":[ 
					{"state":"APPROVED","rule":"ALL","prev":[],"next":[1,2],"approvers":{"797097FF-D7A8-4D13-AA84-9E70501BF255":"APPROVED"}},
					{"state":"APPROVED","rule":"ANY","prev":[0],"next":[3],"approvers":{"DEBB0282-194A-4C12-AB45-59EC83488CDF":"APPROVED","4935F9EF-4D4E-45FF-AF81-0297ED83D146":"REJECTED"}},
					{"state":"APPROVED","rule":"ALL","prev":[0],"next":[3],"approvers":{"2AF34308-2687-41F5-A6B5-603207DE995E":"APPROVED"}},
					{"state":"WAITING","rule":"ANY","prev":[1,2],"next":[4],"approvers":{"A3C086BA-F979-495C-BBB0-96BA05D8CF44":"WAITING"}},
					{"state":"WAITING","rule":"ALL","prev":[3],"next":[],"approvers":{"8C908663-B099-4020-BB34-2FDE99395839":"WAITING"}}
				]};*/

		approvalchain_editor.json = json;
		approvalchain_editor.chainid = json._id;
		$('#chain_viewer .chainname').html(json.name);

		// Find the active states
		for(var i in json.steps) {
			json.steps[i]['active'] = false;
		}
		for(var i in json.active) {
			json.steps[json.active[i]]['active'] = true;
		}

		// Find all the steps with no predecessor -> first column
		var cols = [];
		cols.push([]);
		for(var i in json.steps) {
			if (json.steps[i].prev.length === 0) {
				cols[0].push(json.steps[i]);
			}
		}

		// Resconstruct other columns
		var col = [];
		do {
			col = [];
			for(var i in cols[cols.length-1]) {
				var next = cols[cols.length-1][i].next;
				for(var j in next) {
					var step = json.steps[next[j]];
					if ($.inArray(step, col) < 0) {
						col.push(step);
					}
				}
			}
			if (col.length > 0) {
				cols.push(col);
			}
		} while(col.length > 0);

		// Restore
		for(var i in cols) {
			var $newcol = approvalchain_viewer._createColumn();
			for(var j in cols[i]) {
				// Setup the step
				var stepjson = cols[i][j];
				var $step = approvalchain_viewer._createStep();
				if (stepjson.active) {
					$step.addClass('active');
				} 
				else {
					$step.addClass(stepjson.state.toLowerCase());
				}
				$step.find('.rulename').text(stepjson.rule.toLowerCase());
				for(key in stepjson.approvers) {
					// Setup the user
					var userjson = api.users.get_contact_by_id(key);
					var userapprovalstate = stepjson.approvers[key].toLowerCase();
					var $user = approvalchain_viewer._createUser(userjson);
					$user.children('.approvalstate').hide();
					$user.children('.approvalstate.' + userapprovalstate).show();

					$step.find('.userlist').prepend($user);
				}

				$newcol.append($step);
			}
			$('#chain_viewer .viewer').append($newcol);
		}
	},

	/**
	 * Initializes the viewer
	 * Creates an empty viewer
	 */
	_initialize: function($element) {
		var $chainviewer = $("<div id='chain_viewer'></div>");
/*		$chainviewer.append("<div class='toolbar'>" +
								"<label class='chainname'>Press Chain</label>" +
							"</div>");*/
		$chainviewer.append('<div class="viewer"></div>');
		$element.append($chainviewer);
	},

	/**
	 * Creates one step in the chain
	 */
	_createStep: function() {
		return $(
			'<div class="step shadow">' +
	        	'<div class="row rule">' + 
	            	'<label>Rule:</label>' +
	            	'<div class="rulename">Any</div>' +
	        	'</div>' +
	        	'<div class="row">' + 
	            	'<label>Users:</label>' +
	            	'<div class="userlist">' +
	            	'</div>' +
	        	'</div>' +
	        '</div>');
	},

	/**
	 * Creates one user
	 */
	_createUser: function(userjson) {
		return $(
			"<div class='user' user='" + userjson._id + "'>" +
				"<img class='approvalstate approved' src='/portal/images/yes.png'/>" + 
				"<img class='approvalstate waiting' src='/portal/images/undecided.png'/>" + 
				"<img class='approvalstate rejected' src='/portal/images/rejected.png'/>" + 
				userjson.fullname + 
			"</div>");
	},

	/**
	 * Creates one column
	 */
	_createColumn: function() {
    	return $(
    		'<div class="column">' +
            '</div>');
	}
}