var labelOpen = false;

$(document).ready(function(){
	
	
	
	measureLabelWidth();
	initializeLabel();
	
	$(window).resize(function() {
		measureLabelWidth();
	});
	
	function measureLabelWidth(){
		var windowWidth = $(window).width() ;
		var siteWidth = (parseFloat($('.container').css('width')) - 62); //62 padding inside container

		var restWidth = Number(windowWidth-siteWidth);
		var restSingleSideWidth = (restWidth/2)
				
		$('.label-image').css('paddingLeft', restSingleSideWidth);
		
		//if label closed, recalculate the position
		if(!labelOpen){
			$('.labelanim').css('left', '-' + (parseFloat($('.labelanim').css('width')) - 90) + 'px' );
			
			//$('.label').css('min-width', (parseFloat($('.label').css('width'))-90) + 'px' );
		}else{
			//$('.label').css('min-width', (parseFloat($('.label').css('width'))) + 'px' );
		}
		
	}

	$(".label-end").click(function() {
		if(!labelOpen){
			openLabel();	
		}
	});
	
	$(".labelClose").click(function() {
		if(labelOpen){
			closeLabel();	
		}
	});
	
	
});

function initializeLabel(){
	//totally hide label at start
	$('.labelanim').css('left', '-' + parseFloat($('.labelanim').css('width')) + 'px' );
	
	
	//after 1sec, show label-tip
	setTimeout(function() {
		$('.labelanim').animate({
		 left: '-' + (parseFloat($('.labelanim').css('width')) - 90) + 'px'
			},  800, 'easeOutBounce');
		}, 1000);	
}

function openLabel(){
	$('.variableLabel').fadeIn('fast');
	$('#btn_starthere').fadeOut('fast');
	$('.labelanim').animate({
	 left: 0
		}, 500, 'swing', function() {
			labelOpen = true;
			$('.label-end').css('cursor','default');
			dataLayer.push({event: 'label open'});
	});
}


function closeLabel(){
	$('.labelanim').animate({
		left: '-' + (parseFloat($('.labelanim').css('width')) - 90) + 'px'
		}, 500, 'swing', function() {
			labelOpen = false;
			$('.label-end').css('cursor','pointer');
			$('.variableLabel').fadeOut();
			 $('#btn_starthere').fadeIn();
	});
}