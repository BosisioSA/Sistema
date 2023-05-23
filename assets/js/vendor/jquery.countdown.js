/*! jQuery Countdown Plugin
* Copyright Tom Ellis http://www.webmuse.co.uk
* Licensed under MIT License
* See http://www.webmuse.co.uk/license/
			htmlTemplate: "%{d}<span class=\"small\">days</span> %{h}<span class=\"small\">hrs</span> %{m}<span class=\"small\">mins</span> %{s}<span class=\"small\">sec</span>",	
*/

(function($) {

	jQuery.fn.countdown = function( options ) {  
		var defaults = {
			date: (new Date()),
			updateTime: 1000,
			htmlTemplate: " <span class='days countdown-number'>%{d}</span><sup class='countdown-text'> days</sup><span class='hours countdown-number'>%{h}</span><sup class='countdown-text'> hrs</sup> <span class='min countdown-number'> %{m}</span><sup class='countdown-text'> min</sup> <span class='sec countdown-number'>%{s}</span><sup class='countdown-text'> sec</sup>",
			minus: false
		};

		var opts = $.extend( {}, defaults, options ),
			cancel = false,
			template = opts.htmlTemplate;

		return this.each(function() {
			var intval = window.setInterval(function(){

				var TodaysDate = new Date(),
					CountdownDate = new Date( opts.date ),
					msPerDay = 24 * 60 * 60 * 1000,
					timeLeft = (CountdownDate.getTime() - TodaysDate.getTime()),
					e_daysLeft = timeLeft / msPerDay,
					daysLeft = Math.floor(e_daysLeft),
					e_hrsLeft = (e_daysLeft - daysLeft)*24, //Gets remainder and * 24
					hrsLeft = Math.floor(e_hrsLeft),
					minsLeft = Math.floor((e_hrsLeft - hrsLeft)*60),					
					e_minsleft = (e_hrsLeft - hrsLeft)*60, //Gets remainder and * 60
					secLeft = Math.floor((e_minsleft - minsLeft)*60),
					time = "";



				if ( TodaysDate <= CountdownDate || opts.minus ){
				   	time = template.replace(/%{d}/, daysLeft).replace(/%{h}/, hrsLeft).replace(/%{m}/, minsLeft).replace(/%{s}/, secLeft);
				} else {
					time = template.replace(/(%{d}|%{h}|%{m}|%{s})/g, "00");
					cancel = true;
				}
				
				$(".countdownTimer").html( time );

				if ( cancel ){
					cancel = false;
					clearInterval( intval );
				}       		

			}, opts.updateTime);
		});

	};

})(jQuery);