// $Id: webform.js,v 1.3.2.1 2008/11/19 22:24:39 quicksketch Exp $

/**
 * Webform paging functions
 */
Drupal.webform_paging = new Object();

/* Other modules can define continue_callbacks,
 * submit_callbacks and validation_callbacks in
 * Drupal.settings.webform_paging_continue_callbacks,
 * Drupal.settings.webform_paging_submit_callbacks,
 * Drupal.settings.webform_paging_validation_callbacks respectively.
 * e.g.
 * Drupal.settings.webform_paging_continue_callbacks.push( function(page, validationErrors) {
 *   return validationErrors;
 * });
*/

var continue_callbacks = new Array();
var submit_callbacks = new Array();
var validation_callbacks = new Array();

Drupal.behaviors.webform_paging = function(context) {

  // Reduce form resubmission issues.
  $('form.webform-client-form').submit(function() {
    if ($('#disabled').length > 0) {
      $('#disabled').css('display', 'block');
    }
    Drupal.webform_paging.submit_handler = function() { return false; }
    return true;
  });

  // Allow modules to attach custom callbacks for continue/submit button clicks
  // and form validation.
  if(typeof(Drupal.settings.webform_paging_continue_callbacks) == 'object') {
    continue_callbacks = Drupal.settings.webform_paging_continue_callbacks;
  }
  if(typeof(Drupal.settings.webform_paging_submit_callbacks) == 'object') {
    submit_callbacks = Drupal.settings.webform_paging_submit_callbacks;
  }
  if(typeof(Drupal.settings.webform_paging_validation_callbacks) == 'object') {
    validation_callbacks = Drupal.settings.webform_paging_validation_callbacks;
  }

  $('.form-submit[id*=-continue]').click(function() {
    var continueOk = true;
    // Perform continue_callbacks if available.
    // Allow continue callbacks to return false and cancel the continue event.
    for (var i = 0; i < continue_callbacks.length; i++) {
      if (typeof(continue_callbacks[i]) === 'function') {
        continueOk &= continue_callbacks[i](Drupal.settings.webform['page_num']);
      }
    }
    if (continueOk) {
      return Drupal.webform_paging.validate();
    }
    return false;
  });

  $('.form-submit[id*=-submit]').click(function() {
    var submitOk = true;
    // Perform submit_callbacks if available.
    // Allow submit callbacks to return false and cancel the submit event.
    for (var i = 0; i < submit_callbacks.length; i++) {
      if (typeof(submit_callbacks[i]) === 'function') {
        submitOk &= submit_callbacks[i](Drupal.settings.webform['page_num']);
      }
    }
    if (submitOk) {
      return Drupal.webform_paging.validate();
    }
    return false;
  });

  // handle watermarked textfields
  $('#webform-survey input.webform-component-watermarked').each(function() {
    var i = $('#' + this.id);
    if (i.val() != $('#webform-survey input.' + this.id).val()) {
      i.addClass('webform-component-watermarked-complete');
    }
  });
  $('#webform-survey input.webform-component-watermarked').focus(function() {
    var i = $('#' + this.id);
    if (i.val() == $('#webform-survey input.' + this.id).val()) {
      i.val('');
      i.addClass('webform-component-watermarked-complete');
    }
  });
  $('#webform-survey input.webform-component-watermarked').blur(function() {
    var i = $('#' + this.id);
    if (i.val() == '') {
      i.val($('#webform-survey input.' + this.id).val());
      i.removeClass('webform-component-watermarked-complete');
    }
  });
}

function validationError(ele, msg) {
  this.ele = ele;
  this.msg = msg;
}

/*
 * Validate the elements on the current page
 */
Drupal.webform_paging.validate = function() {

  // Validation is now handled by registered callbacks
  // see webform_validation.js
  var validationErrors = new Array();
  if (typeof(Drupal.webform_validation) == 'object') {
    Drupal.webform_validation.custom_message = Drupal.webform_validation.NOMESSAGE;
  }
  $('.validation-help').each( function() { $(this).remove(); });

  // Perform validation provided by validation_callbacks if available
  for (var i = 0; i < validation_callbacks.length; i++) {
    if(typeof(validation_callbacks[i]) === 'function') {
      validationErrors = validation_callbacks[i](Drupal.settings.webform['page_num'], validationErrors);
    }
  }

  // Display or hide validation messages.
  if (validationErrors.length > 0) {
    if (Drupal.webform_validation.custom_message != Drupal.webform_validation.NOMESSAGE) {
      $('#webform-validation-messages').html(Drupal.webform_validation.custom_message == '' ? Drupal.t('Please complete the highlighted fields.') : Drupal.webform_validation.custom_message);
      $('#webform-validation-messages').show();
    }
    error = true;
  } else {
    $('#webform-validation-messages').hide();
    error = false;
  }

  return !error;
}