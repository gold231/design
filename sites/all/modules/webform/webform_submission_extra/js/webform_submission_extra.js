Drupal.webform_submission_extra = new Object();
Drupal.settings.gacid = null;

Drupal.behaviors.webform_submission_extra = function(context) {
  $('#edit-webform-submission-extra-width').val(screen.width);
  $('#edit-webform-submission-extra-height').val(screen.height);
};

//Store GA client ID to datalayer and to webform extra.
$(document).ready(function() {
	if(typeof dataLayer != 'undefined') {
		dataLayer.gacid = getClientID();
		$('#edit-webform-submission-extra-gacid').val(dataLayer.gacid);
	}
});

getClientID = function() {
	  try {
	    var trackers = ga.getAll();
	    var i, len;
	    for (i = 0, len = trackers.length; i < len; i += 1) {
	      if (trackers[i].get('trackingId') === "UA-18566949-2") {
	        return trackers[i].get('clientId');
	      }
	    }
	  } catch(e) {}  
	  return 'false';
}