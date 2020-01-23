var functions = require('./functions');
var ajaxInit  = require('./ajax');

module.exports = {

  emailValidation: {

    emailVerified: false,
    emailError: Drupal.t('Oops, is your email correct?'),
    // emailExcellent: Drupal.t('Excellent'),
    EmailSuggestion: Drupal.t('Did you mean'),
    mid: 0,
    sEmail: '',
    sPEmail: '',

    renderEmailSuccess: function() {
      $('input[type="email"]').parents('div[class*=webform-component-email]:first').removeClass('error invalid ignore-validation');
      if ($('.email-error').length == 1) {
        $('.email-error').hide();
      }
      return true;
    },

    renderEmailFail: function(message) {
      var container = $('input[type="email"]').parents('div[class*=webform-component-email]:first');
      container.addClass('invalid error ignore-validation');
      if ($('.email-error').length == 0) {
        $('<div class="custom-error email-error"></div>').text(module.exports.emailValidation.emailError).appendTo(container);
      } else {
        $('.email-error').show();
      }
      return false;
    },

    checkAddress: function () {
      // Add email verification if applicable
      var $emailField = $('input[type="email"]');
      if ($emailField.val() == '') {
        module.exports.emailValidation.renderEmailFail();
      } else {
        module.exports.emailValidation.sEmail = $emailField.val();

        if ($emailField.val().match(/(yopmail.com|t-online.de|mail.ru|btinternet.com|FORCE)$/)) {
          $emailField.val($emailField.val().replace('FORCE', ''));
          valid = true;
          module.exports.emailValidation.emailVerified = true;
          module.exports.emailValidation.renderEmailSuccess();
          return true;
        }

        // Store the email address we're looking up and only perform the
        // lookup if this changes - reduces unnecessary, expensive lookup calls.
        if (module.exports.emailValidation.sEmail != module.exports.emailValidation.sPEmail) {
          var provider = 'kickbox';
          module.exports.emailValidation.sPEmail = module.exports.emailValidation.sEmail;
          module.exports.emailValidation.emailVerified = false;
          module.exports.emailValidation.emailVerified = module.exports.emailValidation.verifyEmail(provider);
        }
      }
    },

    verifyEmail: function(provider) {

      $('body').addClass('validation-progress');
      var verified = false;
      var url = '/misc/verify_email_address';
      var requestData = {address: module.exports.emailValidation.sEmail, pmid: module.exports.emailValidation.mid, provider: provider};

      var callback = function(data) {

        if (typeof data['statusText'] != 'undefined' && data['statusText'] == 'OK') {
          var response = Drupal.parseJson(data['response']);
          $('body').removeClass('validation-progress');

          if (response.status.match(/^deliver/)) {
            verified = true;
            valid = true;
            module.exports.emailValidation.emailVerified = true;
            module.exports.emailValidation.renderEmailSuccess();
            $('.webform-page-number-1 #edit-continue').trigger('click');
          }
        }
        if (!verified) {
          valid = false;
          module.exports.emailValidation.renderEmailFail();
        }
        module.exports.emailValidation.mid = response.mid;
      };

      $.ajax({
        type: 'POST',
        url: url,
        data: requestData,
        complete: function (data) {
          if (functions.isEmpty(data)) {
            // callback triggered if the data object is completely empty (IE jQuery bug)
            ajaxInit.ajax.post(url, requestData, function (data) {
              var data = {response: data, statusText: 'OK'};
              callback(data);
            }, false);
          }
          else {
            callback(data);
          }
        },
        dataType: 'json',
        async: true
      });
      return verified;
    }
  }
};
