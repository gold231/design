module.exports = {

  dateTransfer: {

    dateFields: function() {

      // check if client support touch events
      // var isTouch =  'ontouchstart' in window || 'onmsgesturechange' in window;
      var isTouch =  'ontouchstart' in window;

      // Custom date picker builder
      // Get all form fieldset in the page
      $('.webform-page-number-1 fieldset:first-of-type').each(function() {
        // add custom css hook class  for namespacing
        $(this).addClass('webform-custom-form');
        // find the date of birth components
        var dobModule = $(this).find('.webform-component-date');
        var dobLabel = dobModule.find('label').html();
        var dobFields = dobModule.find('select');
        var errorMessage = dobModule.next();
        // create new webform component
        var component = $('<div class="webform-component webform-component-date webform-component-date-custom"></div>');
        var componentTitle = $('<div class="question-text"><strong>'+ dobLabel +'</strong></div>').appendTo(component);
        var dobWrapper = $('<div class="dob-wrapper"></div>').appendTo(component);

        // duplicate dob selects as form-text selects
        dobFields.each(function(index) {
          // extract current $this
          el = $(this);
          // extract unique class name, day, month, year, tabindex
          var $className = el.attr('class').split(' ')[1];
          var $defaultValue = el.find('option:first').text();
          var $elemId = el.attr('id');
          var tabIndex = el.attr('tabindex');
          // reset old element tab index
          el.attr({tabindex: '-1'});

          // create form-item  wrapper
          var formItem = $('<div class="form-item"></div>');
          formItem.addClass('form-item-' + $className);
          // create form-text label and input
          $('<label>').html($defaultValue + '').attr({for: "form-text-" + $className}).appendTo(formItem);
          newInput = $('<input type="tel" inputmode="numeric" pattern="[0-9]*" maxlength="128">').attr({ 'data-target': $elemId, 'class': 'form-text form-text-' + $className, 'name': "form-text-" + $className, 'id': "form-text-" + $className, 'tabindex': tabIndex}).appendTo(formItem);
          // identify first input in list to help with focus()
          if (index == 0) {
            newInput.addClass('first-index');
          }
          // append to new component
          formItem.appendTo(dobWrapper);
        });

        // append new component to current form fieldset
        component.appendTo($(this));
        // move DOB error message into the new DOB module
        errorMessage.insertAfter(component);

        // add respective placeholder dd/mm/yyyy
        $('#form-text-day').attr({placeholder: Drupal.t('dd'), min: '1', max: '31', maxlength: '2'});
        $('#form-text-month').attr({placeholder: Drupal.t('mm'), min: '1', max: '12', maxlength: '2'});
        // set year min max values
        var dateYear = dobModule.find('[id$="date-of-birth-year"]');
        var minYear  = dateYear.children(':last-child').text();
        var maxYear  = dateYear.children(':nth-child(2)').text();
        $('#form-text-year').attr({placeholder: Drupal.t('yyyy'), min: minYear, max: maxYear, maxlength: '4'});

        var currentDay   = null;
        var currentMonth = null;
        var currentYear  = null;

        // validation for the gender selection
        $('div[id*=sex] input:radio').change(function() {
          if ($(this).is(':checked')) {
            // focus the first input in the list
            // depending on laguages it can start with day or year
            $('.first-index').focus();
            $('#disabled').show();
          }
        });

        $formText = $('.dob-wrapper .form-text');
        $formText.not('.form-text-year').blur(function() {
          var el = $(this);
          // add leading zero to match input value to visual placeholder clue
          el.val(module.exports.dateTransfer.pad(el.val()));
        });

        // restrict to input to numbers
        $formText.bind('keydown',function (e) {
          el = $(this);
          if (!isTouch) {
            // Allow: backspace, delete, tab, escape, enter, space.
            allowedKeys = [46, 8, 9, 13, 27, 110, 190];
            // Allow: Ctrl+A, Command+A || Allow: home, end, left, right, down, up
            if ($.inArray(e.keyCode, allowedKeys ) !== -1 || (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) || (e.keyCode >= 35 && e.keyCode <= 40)) {
              // let it happen, don't do anything
              return;
            }
            // Ensure that it is a number and stop the keypress
            if((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
              e.preventDefault();
            }
          };
        });

        $formText.bind('keyup', function(e) {

          var el = $(this);
          var valid;
          var submitTarget = '#' + el.attr('data-target');
          var isNextInput = el.parent().next().find('.form-text');
          var nextInput = isNextInput.length > 0 ? isNextInput : $('#edit-continue');
          var maxChar = el.attr('maxlength');

          if (el.hasClass('.form-text-day')) {
            // validate data and trim leading number for submission
            valid = module.exports.dateTransfer.validateDay(el.val());

            if (valid) {
              $(submitTarget).val(module.exports.dateTransfer.trim(el.val()))
              if (currentDay !== el.val() && module.exports.dateTransfer.isCorrectLength(el.val(), maxChar)) {
                nextInput.focus();
              }
            }
            else {
              $(submitTarget).val('');
            }
            // reset current value, disable jump back to next field when the input is focused again
            currentDay = $(this).val();
          }

          if (el.hasClass('.form-text-month')) {
            valid = module.exports.dateTransfer.validateMonth(el.val());

            if (valid) {
              $(submitTarget).val(module.exports.dateTransfer.trim(el.val()))

              if (currentMonth !== el.val() && module.exports.dateTransfer.isCorrectLength(el.val(),maxChar)) {
                nextInput.focus();
              }
            }
            else {
              $(submitTarget).val('');
            }
            currentMonth = $(this).val();
          }

          if (el.hasClass('.form-text-year')) {
            valid = module.exports.dateTransfer.validateYear(el.val(), el.attr('min'), el.attr('max'), maxChar);

            if (valid) {
              $(submitTarget).val(module.exports.dateTransfer.trim(el.val()))

              if (currentYear !== el.val()) {
                nextInput.focus();
              }
            }
            else {
              $(submitTarget).val('');
            }
            currentYear = $(this).val();
          }

          if (valid) {
            el.parent('.form-item').removeClass('error').addClass('valid');

            // check if all fields are valid
            if ($('.dob-wrapper .form-item.valid').length == $('.dob-wrapper .form-item').length) {
              $('.webform-component-date-custom').removeClass('error');
            }
          }
          else {
            if(el.val() !== "" && el.val().length === el.attr('maxlength')) {
              el.parent('.form-item').removeClass('valid').addClass('error');
            }
          }
          if (el.val() === "") {
            el.parent('.form-item').removeClass('valid');
          }
        });

        $formText.bind('blur', function() {
          el = $(this);
          // This is mostly to catch if the date field value is < yyyy
          // when the date year field is focused back and the value doesn't match yyyy pattern
          // the keyup event doesn't catch the error
          if (parseInt(el.val()) === 0 || (el.hasClass('.form-text-year') && el.val() !== "" && el.val().length !== el.attr('maxlength'))) {
            el.parent('.form-item').removeClass('valid').addClass('error');
          }
        });
      });
    },

    trim: function(val) {
      return parseInt(val, 10);
    },

    pad: function(n) {
      if(n > 0 && n.length < 2) {
        return (n < 10) ? ('0' + n) : n;
      }
    },

    isInt: function(n) {
      return n % 1 === 0;
    },

    isInRange: function(val, min, max) {
      return val >= min && val <= max;
    },

    isCorrectLength: function(value, length) {
      return value.toString().length === length;
    },

    validateDay: function(day) {
      return module.exports.dateTransfer.isInt(day) && module.exports.dateTransfer.isInRange(day, 1, 31);
    },

    validateMonth: function(month) {
      return module.exports.dateTransfer.isInt(month) && module.exports.dateTransfer.isInRange(month, 1, 12);
    },

    validateYear: function(year, minYear, maxYear, maxChar) {
      return module.exports.dateTransfer.isInt(year) && module.exports.dateTransfer.isInRange(year, minYear, maxYear) && module.exports.dateTransfer.isCorrectLength(year, maxChar);
    }
  }
};
