/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here. For example:
	// config.language = 'fr';
	// config.uiColor = '#AADC6E';
    config.skin = 'moono';
	// disable tooltips
    config.title = false;
    
    config.pasteFromWordRemoveStyles =  true;
    config.pasteFromWordRemoveFontStyles =  true;
    config.forcePasteAsPlainText = true;

    config.startupFocus = true;
    // overwrite the default css rulings
    config.contentsCss = '/3rdParty/ckeditor/css/nixps-ckeditor.css';

	config.toolbarGroups = [
		{ name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
		{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
		{ name: 'forms', groups: [ 'forms' ] },
		{ name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi', 'paragraph' ] },
		{ name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
		{ name: 'editing', groups: [ 'find', 'selection', 'spellchecker', 'editing' ] },
		{ name: 'links', groups: [ 'links' ] },
		{ name: 'insert', groups: [ 'insert' ] },
		{ name: 'styles', groups: [ 'styles' ] },
		{ name: 'colors', groups: [ 'colors' ] },
		{ name: 'tools', groups: [ 'tools' ] },
		{ name: 'others', groups: [ 'others' ] },
		{ name: 'about', groups: [ 'about' ] }
	];

	config.removeButtons = 'Source,Save,NewPage,Preview,Print,Templates,Cut,Copy,Paste,PasteText,PasteFromWord,SelectAll,Scayt,Form,Radio,Checkbox,TextField,Textarea,Select,Button,ImageButton,HiddenField,Strike,CreateDiv,Blockquote,BidiLtr,BidiRtl,Language,Unlink,Anchor,Link,Image,Flash,Table,Smiley,SpecialChar,PageBreak,Iframe,ShowBlocks,Maximize,About,HorizontalRule,Subscript,Superscript,CopyFormatting,RemoveFormat,NumberedList,BulletedList,Outdent,Indent,JustifyLeft,JustifyCenter,JustifyRight,JustifyBlock,Undo,Redo,placeholder,Find,Replace,Styles,TextColor,BGColor,Format,Font,FontSize,CreatePlaceholder';
	
    // try remove bottom bar
    config.removePlugins = 'elementspath';
    config.resize_enabled = false;

	// Dialog windows are also simplified.
	config.removeDialogTabs = 'link:advanced';
    
    //config.extraPlugins = 'placeholder,richcombo,placeholder_select';
    
	//pagebuilder config 
	/*CKEDITOR.editorConfig = function( config ) {
	config.toolbarGroups = [
		{ name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
		{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
		{ name: 'forms', groups: [ 'forms' ] },
		{ name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi', 'paragraph' ] },
		{ name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
		{ name: 'editing', groups: [ 'find', 'selection', 'spellchecker', 'editing' ] },
		'/',
		{ name: 'links', groups: [ 'links' ] },
		{ name: 'insert', groups: [ 'insert' ] },
		'/',
		{ name: 'styles', groups: [ 'styles' ] },
		{ name: 'colors', groups: [ 'colors' ] },
		{ name: 'tools', groups: [ 'tools' ] },
		{ name: 'others', groups: [ 'others' ] },
		{ name: 'about', groups: [ 'about' ] }
	];

	config.removeButtons = 'Source,Save,NewPage,Preview,Print,Templates,Cut,Copy,Paste,PasteText,PasteFromWord,SelectAll,Scayt,Form,Radio,Checkbox,TextField,Textarea,Select,Button,ImageButton,HiddenField,Strike,CreateDiv,Blockquote,BidiLtr,BidiRtl,Language,Unlink,Anchor,Link,Image,Flash,Table,Smiley,SpecialChar,PageBreak,Iframe,ShowBlocks,Maximize,About,HorizontalRule';
	};*/
};
