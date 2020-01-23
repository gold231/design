var miscWebformImgFadeSpeed = 1500;

// jQuery for call to action link and instructions
jQuery.fn.topLink = function(settings) {
  settings = jQuery.extend({
	min: 1,
	fadeSpeed: 200
  }, settings);
  return this.each(function() {
	//listen for scroll
	var el = $(this);
	el.hide(); //in case the user forgot
	$(window).scroll(function() {
		if($('.webform-client-form').length > 0) {
		  if($(window).scrollTop() >= settings.min)
		  {
			el.fadeIn(settings.fadeSpeed);
			$('#start-here').fadeOut(settings.fadeSpeed);
		  }
		  else
		  {
			el.fadeOut(settings.fadeSpeed);
			$('#start-here').fadeIn(miscWebformImgFadeSpeed);
		  }
	  	}
	});
  });
};

//usage w/ smoothscroll
$(document).ready(function() {
  // Only show call to action on page-1
  if($(".webform-client-form.webform-page-number-1").length == 0) {
	$("#return-to-top-link").remove();
  }
  $('#start-here').fadeIn(miscWebformImgFadeSpeed);
  //set the link
  $('#return-to-top-link').topLink({
	min: 250,
	fadeSpeed: 500
  });
  //smoothscroll
  $('#return-to-top-link').click(function(e) {
	e.preventDefault();
	$.scrollTo(0,300);
  });
});
