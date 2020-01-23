module.exports = {

  validatePostcode: function() {

  var postcode = $('input[id*=zippostcode]'),
      lang     = $('html').attr('lang');

    if (postcode.length > 0) {
      var filter = false;

      switch (lang) {
        case 'en':
          filter = /^(([gG][iI][rR] {0,}0[aA]{2})|((([a-pr-uwyzA-PR-UWYZ][a-hk-yA-HK-Y]?[0-9][0-9]?)|(([a-pr-uwyzA-PR-UWYZ][0-9][a-hjkstuwA-HJKSTUW])|([a-pr-uwyzA-PR-UWYZ][a-hk-yA-HK-Y][0-9][abehmnprv-yABEHMNPRV-Y]))) {0,}[0-9][abd-hjlnp-uw-zABD-HJLNP-UW-Z]{2}))$/;
          break;

        case 'en-us':
          filter = /^\d{5}([\-]?\d{4})?$/;
          break;

        case 'nl':
          filter = /^\d{4}\s?[A-z]{2}$/;
          break;

        case 'sv':
        case 'fi':
        case 'fr':
        case 'ko':
          filter = /^\d{5}$/;
          break;

        case 'nb':
        case 'da':
        case 'fr-ch':
        case 'en-za':
          filter = /^\d{4}$/;
          break;

        case 'fr-ca':
          filter = /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]( )?\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i; // Postcode format in Canada: A8A8A8
          break;
      }

      if (postcode.val() == '') {
        valid = false;
      }
      else if (filter == false && postcode.val() !== '') {
        valid = true;
      }
      else if (filter == false && postcode.val() == '' || !filter.test(postcode.val())) {
        valid = false;
        module.exports.insertPostcodeMessage();
      }
      else {
        valid = true;
      }
    }
  },

  insertPostcodeMessage: function() {
    var postcodeComp = $('div[id*=zippostcode].webform-component');

    if (postcodeComp.find('.custom-error').length == 0) {
      $('<div class="custom-error postcode-error"></div>').appendTo(postcodeComp).text(Drupal.t('Please enter a valid postcode'));
    }
  }
}