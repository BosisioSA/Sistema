/*jslint white:true, nomen:true, sloppy:true, vars:true*/
/*global panzer, $, document, window*/

var approvalchain_editor = {
    /** The approval chain id */
    chainid: null,

    /** The chain json object */
    json: null,

    steps: [],

    id_key : 'id',
    name_key : 'input_name',


    /**
     * Creates a viewer for that approval chain and attaches it to $element
     */
    view_chain: function(chainjson, $element) {
        approvalchain_editor._initialize($element);

        $('#chain_editor').position({
            my: "center",
            at: "center",
            of: $element
        });

        approvalchain_editor.loadjson(chainjson);
        approvalchain_editor.enable_handlers();
        this._adjust_size();
    },

    /**
     * Creates an editor for that approval chain and attaches it to $element
     */
    edit_chain: function(chainjson, $element) {
        approvalchain_editor._initialize($element);

        $('#chain_editor').position({
            my: "center",
            at: "center",
            of: $element
        }).addClass('approval_by_quantum');

        approvalchain_editor.loadjson(chainjson);
        approvalchain_editor.enable_handlers();
        this._adjust_size();
    },

    /**
     * @brief adapts the size of the view
     */
    _adjust_size: function() {
        var steps = $('#chain_editor .step');
        var step_count = steps.length;
        var step_width = steps.outerWidth(true);

        // Adapt the size of the column
        $('#chain_editor').find('.column').css("min-width", step_count * step_width);
    },

    /**
     * The editor event handlers
     */
    enable_handlers: function() {
        $('#addstepbutton').bind('click', function() {
            if ($('#chain_editor .step').length < 3) { 
                approvalchain_editor._addStep();
            }
        });

        $('#closebutton').bind('click', function() {
            approvalchain_editor._saveChain(function() {
                $('#chain_editor').hide();
                $('#chain_editor').remove();
                $('#nixps_mask').hide();
                $('body').trigger('chaineditorclosed');
            });
        });

        $('#chain_editor .ruleselector').live('change', function() {
            approvalchain_editor._saveChain();
        });

        // The remove button for the users
        $('#chain_editor .user .remove').live('click', function() {
            $(this).parents('.user').remove();
        });
    },

    /**
     * Loads the chain json object
     */
    loadjson: function(json) {
        approvalchain_editor.json = json;
        approvalchain_editor.chainid = json[approvalchain_editor.id_key];
        $('#chainname').html(json[approvalchain_editor.name_key]);
        var cols = [];
        for(var i in json.steps) {
            cols.push([json.steps[i]]);
        }

        for(var i in cols) {
            var $newcol = $("#chain_editor .editor .column");
            for(var j in cols[i]) {
                var stepjson = cols[i][j];
                var attributes = [];
                for(var index in stepjson.participant_attributes) {
                    attributes.push($.grep(sAttributes, function(e){ return e.name == stepjson.participant_attributes[index]; }));
                }

                var $step = approvalchain_editor._createNewStep(false, attributes);
                $newcol.find('.dropzone').append($step);
                $step.find('.ruleselector').val(stepjson.policy);
                for(index in stepjson.participants) {
                    $step.find('.userlist').prepend(approvalchain_editor._newUser( api.users.get_user_by_username(stepjson.participants[index]) ) );
                }
                for(index in stepjson.participant_emails) {
                    $step.find('.userlist').prepend(approvalchain_editor._newUser( api.users.get_contact_by_email(stepjson.participant_emails[index]) ) );
                }
            }
        }
    },

    /**
     * Serializes the chain to a json object
     */
    tojson: function() {
        var chainjson = {};

        chainjson[approvalchain_editor.id_key] = approvalchain_editor.json[approvalchain_editor.id_key];
        chainjson['steps'] = [];

        var cols = [];
        var steps = [];
        $('#chain_editor .column').each(function(i,v) {
            var $col = $(v);
            cols.push([]);

            if ($col != approvalchain_editor.$newcol) {
                $col.find('.step').each(function(j,s) {
                    var $step = $(s);
                    var $userlist = $step.find('.userlist');
                    var policy = $step.find('.ruleselector').val();
                    var participants = [];
                    var participant_emails = [];
                    $userlist.children('.user:not(.addbutton)').each(function(i,u) {
                        var userjson = api.users.get_contact_by_id($(u).attr('user'));
                        if (userjson.username != undefined) {
                            participants.push(userjson.username);
                        } else if (userjson.email != undefined) {
                            participant_emails.push(userjson.email);
                        }
                    });
                    var attributes = [];
                    $step.find('.attributes .attribute').each(function(i, u) {
                        var matchedAttribute = $.grep(sAttributes, function(e){ return e._id == $(u).attr('attributeid'); });
                        if (matchedAttribute.length === 1) {
                            attributes.push(matchedAttribute[0].name);
                        }
                    });

                    var stepjson = {
                        policy: policy,
                        participants: participants,
                        participant_emails : participant_emails,
                        participant_attributes: attributes
                    };

                    steps.push(stepjson);
                    cols[i].push(stepjson);
                });
            }
        });

        chainjson.steps = steps;
        return chainjson.steps;
    },

    /**
     * Initializes the editor
     */
    _initialize: function($element) {
        $element.append("<div id='chain_editor'></div>");

        $('#chain_editor').append("<div style='float: right;'><a id='closebutton' class='green-button'>" + $.i18n._('nixps-cloudflow-manage.approvalchains-editor-close') + "</a></div>");
        $('#chain_editor').append("<div class='toolbar'>" +
            "<label id='chainname'></label>" +
            "<a id='addstepbutton' class='green-button'>" + $.i18n._('nixps-cloudflow-manage.approvalchains-editor-add_step') + "</a>" +
        "</div>");
        $('#chain_editor').append('<div class="editor"></div><div id="attribute-popup"><ul id="attr-list" class="unselectable"></ul></div>');

        var $newcol = $(
            '<div class="column">' +
                '<div class="dropzone">' +
                '</div>' +
            '</div>');
        $('#chain_editor .editor').append($newcol);

        approvalchain_editor._updateDropzones();
        
        $('#chain_editor').bind('keypressed keyup', function(event) {
            event.stopPropagation();
        });

        approvalchain_editor.id_key = 'id';
        approvalchain_editor.name_key = 'input_name';
    },

    /**
     * Creates a new step in the chain
     * edit: true if the step is in edit mode
     */
    _createNewStep: function(edit, attributes) {
        var $newstep = $(
            '<div class="step shadow">' +
                '<div class="closebutton">' +
                    '<img src="/portal/images/close.gif"/>' +
                '</div>' +
                '<div class="row rule">' + 
                    '<label>' + $.i18n._('nixps-cloudflow-manage.approvalchains-editor-rule_type') + ':</label>' +
                    '<select class="ruleselector">' +
                        '<option value="Any">' + $.i18n._('nixps-cloudflow-manage.approvalchains-editor-rule_type-any') + '</option>' +
                        '<option value="All">' + $.i18n._('nixps-cloudflow-manage.approvalchains-editor-rule_type-all') + '</option>' +
                    '</select>' +
                '</div>' +
                '<div class="row">' + 
                    '<label>' + $.i18n._('nixps-cloudflow-manage.approvalchains-editor-users') + ':</label>' +
                    '<div class="userlist">' +
                        '<div class="user addbutton">' +
                            '<input class="approver_selector"/><img class="query" src="/portal/images/search_gray.png"/>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="row attributerow">' + 
                    '<label>' + $.i18n._('nixps-cloudflow-manage.approvalchains-editor-attributes') + ':</label>' +
                '</div>' +
            '</div>');
        new attribute_list($newstep.find('.attributerow'), {editable: true, attributes: attributes});

        var that = this;
        $newstep.find(".closebutton").click(function() {
            // Cannot remove last step in the editor
            if ($(".step").length === 1) {
                return;
            }

            if ($newstep.parent().children().length === 1) {
                // Remove the parent column if it is the last step in there
                $newstep.parents('.column').remove();
            }
            else {
                // Just remove the step in other cases
                $newstep.remove();
            }

            that._adjust_size();
        });

        $newstep.find(".approver_selector").autocomplete({
            source: function(request, response) {
                response(api.users.query_user({ term: request.term }));
            },
            minLength: 1,
            focus: function( event, ui ) {
                $(this).val(ui.item.username);
                return false;
            },
            select: function( event, ui ) {
                var userjson = ui.item;
                $(this).parents('.userlist').prepend(approvalchain_editor._newUser(userjson));
                $(this).val('');
                return false;
            }
        })
        .data("autocomplete")._renderItem = function( ul, item ) {
            var fullname = '&lt;' + $.i18n._('nixps-cloudflow-manage.approvalchains-editor-users-no_full_name') + '&gt;';
            if (('fullname' in item) && (item['fullname'].length > 0)) {
                fullname = item['fullname'];
            }
            var username = '';
            if (('username' in item) && (item['username'].length > 0)) {
                username = item['username'];
            }
            else if (('email' in item) && (item['email'].length > 0)) {
                username = item['item'];
            }

            return $( "<li>" )
                .data( "item.autocomplete", item)
                .append( "<a class='useritem'><span class='username'>" + item.username + "</span><span class='fullname'>" + fullname + "</span></a>" )
                .appendTo( ul );
        };


        return $newstep;
    },

    _newUser: function(userjson) {
        if (userjson == undefined)
          return $();
        if (userjson._id === undefined)
          return $();
        var username = '';
        if (userjson.username != undefined)
           username = userjson.username;
        else if (userjson.email != undefined)
            username = userjson.email;
        return $("<div class='user' user='" + userjson._id + "'><img class='remove' src='/portal/images/close.gif'/>" + username + "</div>");
    },

    /**
     * Updates the step dropzones
     */
    _updateDropzones: function() {
        $(".dropzone").sortable({
            connectWith: ".dropzone",
            placeholder: "dropshadow",
            revert: true,
            delay: 150,
            stop: function(event, ui) {
                // Find the empty columns
                $('.column').each(function(i,v) {
                    var $v = $(v);
                    if ($v.find('.step').length === 0) {
                        $v.remove();
                    }
                });

                approvalchain_editor._saveChain();
            }
        });
    },

    /**
     * Saves the approval chain
     * Calls the callback when it is done
     */
    _saveChain: function(callback) {
        // Save the chain
        var chainjson = approvalchain_editor.tojson();
        approvalchain_editor.json.steps = chainjson;
        if (callback) {
            callback();
        }           
    },

    /**
     * Adds a new step in a new column
     */
    _addStep: function() {
        // Create a new step
        var $step = approvalchain_editor._createNewStep(true, []);
        var $newcol = $("#chain_editor .editor .column");
        $newcol.find('.dropzone').append($step);

        this._adjust_size();

        approvalchain_editor._saveChain();
    }
}