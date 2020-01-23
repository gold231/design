var ajaxInit           = require('./ajax');
var init               = require('./functions');
var formSliderInit     = require('./form-slider');
var dateOffset         = require('./picker-date-offset');
var customForm         = require('./custom-form');
var partnerFormInit    = require('./partner-form');
var limitedPartnerinit = require('./limited-partner-display');

Drupal.behaviors.sc_ppc_x_v13 = function() {
  init.fancyForm();
  init.progressBar();
  init.fieldsetHeight();
  init.divCycle();
  init.genderClass();
  customForm.dateTransfer.dateFields();
  formSliderInit.formSlider();
  partnerFormInit.partnerForm();
  if(Drupal.settings.offer_page) {
    limitedPartnerinit.limitedPartnerDisplay();
    limitedPartnerinit.createPartnerDisplayButton();
  }
};

$(function() {
  var valid;
  formSliderInit.formSubmit();
});