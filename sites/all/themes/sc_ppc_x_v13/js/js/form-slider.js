var emailValidationInit = require('./email-validation');
var postcodeValidation  = require('./postcode-validation');
var functions           = require('./functions.js');

module.exports = {

  formSlider: function() {
    var maxPagingCount;  //store max cutom paging value
    var $pagingWrapper   = $('<div class="webform-paging" />'); // find all webform on page
    var customPagingPage = 0; // reset the custom paging count
    var errorDobField    = $('#webform-component-group-1--date-of-birth > .form-item');
    var customDOB        = $('.webform-component-date-custom');

    // wrap all fieldsets in cycle pager wrapper
    $('.webform-client-form').each(function() {
      var $fieldSets = $(this).find('.webform-component-fieldset');
      maxPagingCount = $fieldSets.length - 1; // index is 0
      $fieldSets.wrapAll($pagingWrapper);
    });
    $('.next-slide-ban').hide();
    functions.formCycle();

    // Page 1 Form Submit
    $('.webform-page-number-1 #edit-continue').click(function(e) {

      // the form doesn't validate the year
      // force check if year is valid before submiting
      selectedYear = $('[id$="date-of-birth-year"] option:selected').val();

      if (selectedYear > 0) {

        if ($(this).prev('.webform-paging').find('.webform-component-fieldset:visible .error').length == 0) {

          if(customPagingPage < maxPagingCount) {
            $('.webform-paging').cycle(customPagingPage + 1);
            $('html,body').animate({scrollTop: 0},'fast');
          }

          valid = true;
          customDOB.addClass('valid').removeClass('error');
          customPagingPage += 1;
          $('.form-email').focus().removeClass('required');

          if (customPagingPage <= maxPagingCount) {
            // for this demo, ensure that progress doesn't update during email validation
            // the validation is slow and it's disturbing to see the progress advance while nothing is happening
            $('.form-progress .step-value').text(customPagingPage + 1 );
            $('.form-progress-bar').animate({width: (customPagingPage + 1) * (100 / 5) + '%'}, 'fast' );
          }
        }
        else {
          // toggle custom DOB elements styles & Add error message
          $('#webform-component-group-1--date-of-birth').find('.validation-help').appendTo(customDOB);

          if (errorDobField.hasClass('error')) {
            customDOB.addClass('error');
          }
        }
      }
      else {
        $('.webform-component-date-custom').addClass('error');
      }
      if (customPagingPage <= maxPagingCount) {
        e.preventDefault();
        valid = false;
      }
      else {
        emailValidationInit.emailValidation.checkAddress();
      }
      if (emailValidationInit.emailValidation.emailVerified == false) {
        e.preventDefault();
        valid = false;
      }
    });
  },

  formSubmit: function(e) {
    $('body.webform-page-number-3 .webform-client-form #edit-submit').click(function(e) {
      postcodeValidation.validatePostcode();

      if (valid !== false) {
        $('.webform-client-form').live('submit', function() {
          return true;
        });
      }
      else {
        return false;
        e.preventDefault();
      }
    });
  },

  validationError: function() {
    if ($('body').hasClass('webform-page-number-1') && $('.gender-error').length < 1) {
      $('<div class="custom-error gender-error"></div>').appendTo('.webform-component-radios').text(Drupal.t('Please select your gender'));
    }
    if ($('body').hasClass('webform-page-number-1') && $('.dob-error').length < 1) {
      $('<div class="custom-error dob-error"></div>').appendTo('.webform-component-date-custom').text(Drupal.t('Please enter your date of birth'));
    }
  },
}