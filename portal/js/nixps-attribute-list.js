/*********************************************************************/
/* NiXPS Attribute List JavaScript                                   */
/*                                                                   */
/* Copyright 2012, NiXPS (www.nixps.com)                             */
/*********************************************************************/

/***************************************************************************************************************************************
 * The attribute popup
 */
function attribute_popup(parent, options) {
    var default_options = {
        /**
         * The callback called when an attribute in the popup has been clicked
         */
        onselect: function(attribute) {},
        /**
         * The callback used to filter out attribute from the popup
         */
        filter: function(attribute) {},
        allowedit: true
    }

    var options = $.extend(default_options, options);

    this.m_parent = parent;
    this.m_onselect = $.proxy(options.onselect, this);
    this.m_filter = $.proxy(options.filter, this);
    this.m_allowedit = options.allowedit;
    this.m_plusbutton = null;
    this.setup_ui();
    this.enable_handlers();
}

attribute_popup.prototype.setup_ui = function() {
    if ($('#attribute-popup-new').length == 0) {
        $('body').append("<div id='attribute-popup-new'>"
                            + "<ul class='attr-list unselectable'></ul>"
                         + "</div>");
    }
    this.m_plusbutton = $('<a class="attribute add">+</a>');
    this.m_parent.append(this.m_plusbutton);
};

attribute_popup.prototype.enable_handlers = function() {
    //this.m_plusbutton.bind('click', $.proxy(this.show_popup, this));
    this.m_plusbutton.on('click', $.proxy(this.show_popup, this));
};

attribute_popup.prototype.show_popup = function(pEvent, pData) {
    pEvent.stopPropagation();
    this.refresh();
    $('#attribute-popup-new').show();
    $('#attribute-popup-new').position({
        my: "left top",
        at: "left bottom",
        of: this.m_plusbutton,
        offset: "0 5",
        collision: 'fit'
    });

    var $popupmask = $("<div id='attribute-popup-mask'>");
    $popupmask.bind('click', function() {
        $('#attribute-popup-new').hide();
        $('#attribute-popup-mask').remove();
    });
    $('body').append($popupmask);
};


attribute_popup.prototype.refresh = function() 
{
    var $attributelist = $('#attribute-popup-new .attr-list');
    $attributelist.empty();
    var filtered = [];
    for(var i in sAttributes) 
    {
        if (this.m_filter(sAttributes[i])) 
        {
            filtered.push(sAttributes[i]);
        }
    }

    $.tmpl("<li class='attr_li' attributeid='${_id}' attributename='${name}'>${name}</li>", filtered)
     .appendTo($attributelist);

    if (this.m_allowedit) 
    {
        $attributelist.append("<li><input type='text' size='20' id='add_new_entry'></li>");    
    }

    // Set the onclick handler for the popup
    var myproto = this;
    $('#attribute-popup-new .attr_li').click(function()  {
        var id = $(this).attr('attributeid');
        var name = $(this).attr('attributename');
        myproto.m_onselect({ _id: id, name: name });
        $('#attribute-popup-new').hide();
        $('#attribute-popup-mask').remove();
        $('html').unbind('click.attributepopup');
    });
    
    // Stop Propagation when clicked inside the input field
    $('#attribute-popup-new input').click(function(event) 
    {
        event.stopPropagation();
    });
    
    // Textfield 
    $('#add_new_entry').bind("enterKey",function(e)
    {
        $('#attribute-popup-new').hide();
        $('html').unbind('click.attributepopup');
        if (!($(this).val() === ""))
        {
            var l_data = api.attributes.add($(this).val());
            if (l_data) {
                var l_new_attribute = {_id: l_data.attribute_id, name: $(this).val() };
                sAttributes.push(l_new_attribute);
                myproto.m_onselect(l_new_attribute);
            }
        }
    });
    
    $('#add_new_entry').keyup(function(e)
    {
        if (e.keyCode == 13)
        {
            $(this).trigger("enterKey");
            e.stopPropagation();
        }
    });
};

/***************************************************************************************************************************************
 * The attribute list
 */
function attribute_list(parent, options) 
{
    var attrlist = this;

    var default_options = {
        onselect: function(selected) {
            attrlist.add_attribute(selected);
        },
        filter: function(attribute) {
            return attrlist.has_attribute(attribute._id);
        },
        /**
         * The list of attributes to restore
         */
        attributes: [],
        editable: false,
    }
    var options = $.extend(default_options, options);

    this.m_parent = parent;
    this.m_attributelist = null;
    this.setup_ui(options);
    this.enable_handlers();
}

attribute_list.prototype.setup_ui = function(p_options) 
{
    this.m_attributelist = $("<div class='attributes'></div>");
    this.m_parent.append(this.m_attributelist);
    new attribute_popup(this.m_attributelist, p_options);
    for(i in p_options.attributes) {
        this.add_attribute(p_options.attributes[i]);
    }
    this.set_editable(p_options.editable);
}

attribute_list.prototype.add_attribute = function(p_attribute) {
    // Find the attribute
    var attribute = p_attribute;

    // Create a new attribute html element
    var $attributeitem = $.tmpl("<a class='attribute' attributeid='${_id}'>${name}<span class='delete'>x</span></a>", attribute)
    $attributeitem.prependTo($(this.m_parent).find('.attributes'));
    $attributeitem.find('.delete').bind('click', function() {
        $(this).parent('.attribute').remove();
    });
}

attribute_list.prototype.set_editable = function(p_editable) {
    if (p_editable) {
        this.m_attributelist.addClass('editable');
    }
    else {
        this.m_attributelist.removeClass('editable');
    }
}

attribute_list.prototype.has_attribute = function(p_attributeid) {
    return this.m_parent.find('.attributes [attributeid=' + p_attributeid + ']').length == 0;
}

attribute_list.prototype.enable_handlers = function() 
{
}

