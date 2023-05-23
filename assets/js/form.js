$(document).ready(function() {

	
$("#registerPersonalDataFormx").on( "submit", function( event ) {
	
	event.preventDefault();	
	submitForm();
	/*
	valid = true;
	msg = "Please fill all required fields.: \n";
	
    var firstname			= $('#firstname').val();
		
	if(firstname == ''){
		msg +=  $('#firstname').attr('placeholder') + '\n';
		valid = false;
	}
	
	
	if(!valid) { 
		alert(msg);
	}else{
		submitForm();
	}
	*/
	
});

 

	function submitForm(){
	

	$.ajax({
	  type: 'POST',
	  url: "http://marketing.xeikon.com/acton/form/2939/000f:d-0001/0/index.htm",
	  data: $("#registerPersonalDataForm").serialize(),
	   success: success
	});
		
		
		
		
	/* Callback function from form */
	function success(data){
		dataLayer.push({event: 'NL - form - send'});
		
		if(data.indexOf("Warning") !== -1){
			$('#contact-form-init').slideUp("fast");
			$('#contact-form-error').slideDown("fast");
		}
	

		if(data.indexOf("successfully") !== -1){	
			dataLayer.push({event: 'Contact Form success'});
					
			$('#contact-form-init').slideUp("fast");
			$('#contact-form-success').slideDown("fast");
		}
	}
	
	$(".contactRetry").click(function(event) {
		event.preventDefault();	
		
		$('#contact-form-success').slideUp("fast");
		$('#contact-form-error').slideUp("fast");
		
		$('#contact-form-init').slideDown("fast");

	});
	
	
		
	}
	
});