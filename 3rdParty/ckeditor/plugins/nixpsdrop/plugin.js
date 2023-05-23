CKEDITOR.plugins.add('nixpsdrop',
        {
        init: function (editor) {

            function onDragStart(event) {                 
                console.log("onDragStart");
            };

            function onDrop(event) {                 
                console.log("onDrop");
            };

            function onPaste(event) {                 
                console.log("onPast");
            };

            editor.on('contentDom', function (e) {                
                editor.document.on('dragstart', onDragStart);
                editor.document.on('drop', onDrop);
                editor.document.on('paste', onPaste);
                // etc.
            });
            
            var loadingImage = 'data:image/gif;base64,R0lGODlhDgAOAIAAAAAAAP///yH5BAAAAAAALAAAAAAOAA4AAAIMhI+py+0Po5y02qsKADs=';
            var fileTools = CKEDITOR.fileTools;
            // Handle images which are available in the dataTransfer.
			fileTools.addUploadWidget( editor, 'uploadimage', {
				supportedTypes: /image\/(jpeg|png|gif|bmp)/,

				uploadUrl: "/portal.cgi?",

				fileToElement: function() {
					var img = new CKEDITOR.dom.element( 'img' );
					img.setAttribute( 'src', loadingImage );
					return img;
				},

				parts: {
					img: 'img'
				},

				onUploading: function( upload ) {
					// Show the image during the upload.
					this.parts.img.setAttribute( 'src', upload.data );
				},

				onUploaded: function( upload ) {
					// Width and height could be returned by server (https://dev.ckeditor.com/ticket/13519).
					var $img = this.parts.img.$,
						width = upload.responseData.width || $img.naturalWidth,
						height = upload.responseData.height || $img.naturalHeight;

					// Set width and height to prevent blinking.
					this.replaceWith( '<img src="' + upload.url + '" ' +
						'width="' + width + '" ' +
						'height="' + height + '">' );
				}
			} );
        }
});

