/*
 * webform_validation.js
 *
 * Allows implementation of any additional validation methods.
 * Integrates with webform paging to validate on page.
 *
 */

Drupal.webform_validation = new Object();
Drupal.webform_validation.id_counter = 0;
Drupal.webform_validation.ajax_counter = 0;
Drupal.webform_validation.errors = new Array();
Drupal.webform_validation.page = 0;
Drupal.webform_validation.skip_validation = false;
Drupal.webform_submit_page = false;
Drupal.webform_validation.skip_blur = 0;

// Register the validation callbacks array, if not set, which is picked up by webform_paging.js
if (typeof(Drupal.settings.webform_paging_validation_callbacks) != 'object') {
    Drupal.settings.webform_paging_validation_callbacks = new Array();
}

Drupal.behaviors.webform_validation = function(context) {
    // Add a class to identify all dependent fields
    var dependentFields = Drupal.settings.webform_validation.dependent_fields;
    if (dependentFields != undefined) {
        for(var i=0; i<dependentFields.length; i++) {
            $('#'+dependentFields[i]).addClass('validation-dependent');
        }
    }
}

// Add inline validation attempts here
$(document).ready( function() {
    var validationErrors = new Array();

    // add on blur validation here
    // Javascript quirk means we need to skip blur handler when hovering on the button
    $('#edit-submit, #edit-continue, #ui-datepicker-div').hover (
        function () { Drupal.webform_validation.skip_blur = 1; },
        function () { Drupal.webform_validation.skip_blur = 0; }
    );

    $('input').blur( function() {
        if (Drupal.webform_validation.skip_blur == 1) {
            return;
        } else {
            Drupal.webform_validation.validate(Drupal.webform_validation.page, validationErrors, $(this).attr('id'));
            if (typeof Drupal.webform_paging.updatePageHeight == 'function') { Drupal.webform_paging.updatePageHeight(Drupal.webform_validation.page) };
        }
    });

    $('input.ajax-validation').change(function (e) {
        $(this).removeClass('ignore-validation');
    });

    $('input.hasDatepicker').change(function (e) {
        $(this).removeClass('valid');
    });


    $('.webform-component-radios:not(.autoadvance) .form-radios input, .form-checkboxes input').click( function() {
        if ($(this).parent().parent().parent().attr('id').length == 0) {
            $(this).parent().parent().parent().attr('id', 'select-validation-container-' + Drupal.webform_validation.id_counter++);
        }
        if ($(this).parent().parent().parent().parent().attr('id').length == 0) {
            $(this).parent().parent().parent().parent().attr('id', 'select-validation-container-' + Drupal.webform_validation.id_counter++);
        }
        Drupal.webform_validation.validate(Drupal.webform_validation.page, validationErrors, $(this).parent().parent().parent().attr('id'));
        if (typeof Drupal.webform_paging.updatePageHeight == 'function') { Drupal.webform_paging.updatePageHeight(Drupal.webform_validation.page) };
    });

    $('.webform-component-select:not(.autoadvance) select').change( function() {
        if ($(this).attr('id').length == 0) {
            $(this).attr('id', 'select-validation-container-' + Drupal.webform_validation.id_counter++);
        }
        if ($(this).parent().attr('id').length == 0) {
            $(this).parent().attr('id', 'select-validation-container-' + Drupal.webform_validation.id_counter++);
        }
        Drupal.webform_validation.validate(Drupal.webform_validation.page, validationErrors, $(this).attr('id'));
        if (typeof Drupal.webform_paging.updatePageHeight == 'function') { Drupal.webform_paging.updatePageHeight(Drupal.webform_validation.page) };
    });

    $('.form-radios.select-or-other-select .form-radio').click( function() {
        if ($(this).val() == 'select_or_other') {
            // Hack to remove unwanted validation-help classes if present...
            $('#'+$(this).parent().parent().parent().parent().attr('id')+' .validation-help').remove();
        }
    });

});

Drupal.webform_validation.validate = function(page, validationErrors, elementid) {

    if (Drupal.webform_validation.skip_validation) {
        Drupal.webform_validation.skip_validation = false;
        return new Array();
    }

    Drupal.webform_submit_page = true;
    if ($('#'+elementid).length > 0) Drupal.webform_submit_page = false;

    Drupal.webform_validation.errors = validationErrors;
    Drupal.webform_validation.page = page;
    $('#edit-submit, #edit-continue, #edit-previous').addClass('loading');
    $('#edit-submit, #edit-continue, #edit-previous').attr('disabled', 'disabled');
    // Remove any validation style classes from this page.
    $('#webform-survey .webform-page-number-' + page + ' .error:not(.ignore-validation)').each( function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            $(this).removeClass('error');
            $('#'+$(this).attr('id')+'-validation-indicator').removeClass('error');
        }
    });

    // Trim inputs
    $('div.webform-page-number-' + parseInt(page) + ' :input.form-text').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            $(this).val($.trim($(this).val()));
        }
    });

    // Check validation dependents here. If dependent is not mandatory we still need to validate it for it's dependencies...
    $('div.webform-page-number-' + parseInt(page) + ' :input.validation-dependent').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            // First we need to test all dependency fields for entered data
            Drupal.webform_validation.test(this,'webformValidationCallbackRequired', '');
        }
    });

    // re-invalidate errors that are ignore-validation to avoid ping
    $('div.webform-page-number-' + parseInt(page) + ' div.form-item :input.ignore-validation.error').each(function() {
        Drupal.webform_validation.test(this,'webformValidationCallbackFalse', '', true, true);
    });

    // Validate a required input (text field)
    $('div.webform-page-number-' + parseInt(page) + ' div.form-item :input.required, div.webform-page-number-' + parseInt(page) + ' div.form-item :input.select-or-other-other').each(function() {

        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this,'webformValidationCallbackRequired', Drupal.t('This field is required.'));
        }
    });

    // Validate a required select field (select list, radios, checkboxes)
    $('div.webform-page-number-' + parseInt(page) + ' div.webform-component-select.required, div.webform-page-number-' + parseInt(page) + ' div.webform-component-radios .form-radios, div.webform-page-number-' + parseInt(page) + ' div.webform-component-checkboxes .form-checkboxes, div.webform-page-number-' + parseInt(page) + ' div.webform-component-select .form-checkboxes, .select-or-other-processed .form-radios').each(function() {
        // TODO: Bit of a hack here
        // Normally we pass an "input" element in this case it is a div wrapper with no id.
        // We must set the id of the element so the validation test can apply styles and messages etc.
        if ($(this).attr('id').length == 0) {
            $(this).attr('id', 'select-validation-container-' + Drupal.webform_validation.id_counter++);
        }
        if ($(this).parent().attr('id').length == 0) {
            $(this).parent().attr('id', 'select-validation-container-' + Drupal.webform_validation.id_counter++);
        }

        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this, 'webformValidationCallbackRequiredSelect', Drupal.t('This field is required.'));
        }
    });

    // Validate firstname + lastname
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-first_last_name').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this,'webformValidationCallbackFirstLastName_Regex', Drupal.t('Please enter first and last name.'));
        }
    });

    // Validate email address
    $('div.webform-page-number-' + parseInt(page) + ' :input.webform-email-validation, div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-email_regex, div.webform-page-number-' + parseInt(page) + ' :input.form-email.required, div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-email:not(.ignore-validation)').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this,'webformValidationCallbackEmail_Regex', Drupal.t('Please enter a valid email address.'));
        }
    });

    // Validate UK Phone number (2012-05-01)
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-ukphone_regex').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this,'webformValidationCallbackUKPhone_Regex', Drupal.t('Please enter a valid UK phone number.'));
        }
    });

    // Validate US Phone number (2014-04-11)
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-usphone_regex').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this,'webformValidationCallbackUSCAPhone_Regex', Drupal.t('Please enter a valid US phone number.'));
        }
    });

    // Validate CA Phone number (2014-04-11)
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-usphone_regex').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this,'webformValidationCallbackUSCAPhone_Regex', Drupal.t('Please enter a valid CA phone number.'));
        }
    });

    // Validate AU Phone number (2014-04-11)
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-auphone_regex').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this,'webformValidationCallbackAUPhone_Regex', Drupal.t('Please enter a valid AU phone number.'));
        }
    });

    // Validate DE Phone number (2014-04-11)
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-dephone_regex').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this,'webformValidationCallbackDEPhone_Regex', Drupal.t('Please enter a valid DE phone number.'));
        }
    });

    // Validate UK Postcode (2012-05-01)
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-ukpostcode').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this,'webformValidationCallbackUKPostcode', Drupal.t('Please enter a valid UK postcode.'));
        }
    });

    // Validate US Postcode (2012-05-01)
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-uspostcode').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this,'webformValidationCallbackUSPostcode', Drupal.t('Please enter a valid US postcode.'));
        }
    });

    // Validate CA Postcode (2012-05-01)
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-capostcode').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this,'webformValidationCallbackCAPostcode', Drupal.t('Please enter a valid CA postcode.'));
        }
    });

    // Validate DE Postcode (2012-05-01)
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-depostcode').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this,'webformValidationCallbackDEPostcode', Drupal.t('Please enter a valid DE postcode.'));
        }
    });

    // Validate AU Postcode (2012-05-01)
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-aupostcode').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this,'webformValidationCallbackUKPostcode', Drupal.t('Please enter a valid AU postcode.'));
        }
    });

    // Validate FR Phone number
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-frphone_regex').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this,'webformValidationCallbackFRPhone_Regex', Drupal.t('Please enter a valid FR phone number eg. 01 23 45 67 89.'));
        }
    });

    // Validate Loose Phone number
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-loosephone_regex').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this,'webformValidationCallbackLoosePhone_Regex', Drupal.t('Please enter a valid phone number.'));
        }
    });

    // Validate Date
    $('div.webform-page-number-' + parseInt(page) + ' div.webform-component-date .container-inline').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            // TODO: Bit of a hack here
            // Normally we pass an "input" element in this case it is a div wrapper with no id.
            // We must set the id of the element so the validation test can apply styles and messages etc.
            if($(this).attr('id').length == 0) {
                $(this).attr('id','select-validation-container-'+Drupal.webform_validation.id_counter++);
            }
            if($(this).parent().attr('id').length == 0) {
                $(this).parent().attr('id','select-validation-container-'+Drupal.webform_validation.id_counter++);
            }
            Drupal.webform_validation.test(this,'webformValidationCallbackDate', Drupal.t('Please enter a valid date.'));
        }
    });

    // Validate Date for date range
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-date_range').each ( function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            $this = $(this);

            // you'll notice that we are using a function for the error message generation
            var errorMessage = webformValidationGetDateRangeErrorMessage($this);

            // now on to the validation
            Drupal.webform_validation.test( this, 'webformValidationCallbackDateMinMax', errorMessage );
        }
    });

    // Validate Date dd/mm/yyyy
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-date_ddmmyyyy').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this,'webformValidationCallbackDate_ddmmyyyy', Drupal.t('Please enter a date in the format dd/mm/yyyy eg 21/03/1971.'));
        }
    });

    // Validate Date mm/dd/yyyy
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-date_mmddyyyy').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            // note we use the same validation callback - just checks for digits...
            Drupal.webform_validation.test(this,'webformValidationCallbackDate_ddmmyyyy', Drupal.t('Please enter a date in the format mm/dd/yyyy eg 03/21/1971.'));
        }
    });

    // Validate custom regex fields
    $('div.webform-page-number-' + parseInt(page) + ' :input[class*=additional-validation-regex]').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            // Get the custom validation callback name based on the class name
            // This function is written to the html by the webform_validation.module
            var reg = /additional-validation-regex-(\S*)/;
            matches = reg.exec(this.className);
            if (matches.length > 1) {
                var customRegexFunction = 'validateCustomRegex_'+matches[1];
                Drupal.webform_validation.test(this,customRegexFunction, Drupal.t('Please enter a valid value.'));
            }
        }
    });

    // Legacy - special case / grids
    $('div.webform-page-number-' + parseInt(page) + ' div[class=webform-component-grid required] tr').each(function() {
        var checked = false, radios = false;
        // check this row to determine if a selection has been made; if not - highlight the row
        $('#' + this.id + ' :radio').each(function() {
            radios = true;
            if(this.checked) checked = true;
        });
        if (!checked && radios) {
            $('#' + this.id + ' span.question-text').addClass('error');
            Drupal.webform_validation.errors.push(new validationError(this.id, Drupal.t('Please select an option for "@element".', { '@element' : rtrim($('#' + this.id + ' span.question-text').text(), ': *') } )));
        } else if (radios) {
            $('#' + this.id + ' span.question-text').removeClass('error');
        }
    });

    // ajax google valdation
    // it's about as generic as it could be. grabs the region from the global Drupal javascript object

    /// Validate Postcode (uses google validation based on global region code)
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-GoogleValidationPostcode:not(.ignore-validation)').each(function() {
        var self = this;
        if ($('#' + elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(self, 'webformValidationCallbackGoogleValidationPostcode', Drupal.t('Please enter a valid {region} postcode'), true, false, true);

        }
    });

    // Validate Phone (uses google validation based on global region code)
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-GoogleValidationPhone:not(.ignore-validation)').each(function() {
        var self = this;
        if ($('#' + elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(self, 'webformValidationCallbackGoogleValidationPhone', Drupal.t('Please enter a valid {region} phone number'), true, false, true);

        }
    });

    // Ajax gb_portal validation
    // We want Ajax validation to occur last in the chain

    // Validate UK Phone number (gb_portal)
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-ukphone:not(.ignore-validation)').each(function() {
        if ($('#' + elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this, 'webformValidationCallbackUKPhone', Drupal.t('Please enter a valid UK phone number.'), true, false, true);
        }
    });

    // Validate UK Mobile number (gb_portal)
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-ukmobile:not(.ignore-validation)').each(function() {
        if ($('#' + elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this, 'webformValidationCallbackUKMobile', Drupal.t('Please enter a valid UK mobile number.'), true, false, true);
        }
    });

    // Validate UK Any Phone number (gb_portal)
    $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-ukanyphone:not(.ignore-validation)').each(function() {
        if ($('#'+elementid).length == 0 || elementid == $(this).attr('id')) {
            Drupal.webform_validation.test(this, 'webformValidationCallbackUKAnyPhone', Drupal.t('Please enter a valid UK phone number.'), true, false, true);
        }
    });

    if(Drupal.webform_validation.ajax_counter < 1) {
        Drupal.webform_validation.testDependencies();
        $('#edit-submit, #edit-continue, #edit-previous').removeClass('loading');
        $('#edit-submit, #edit-continue, #edit-previous').removeAttr('disabled');
    }

    return Drupal.webform_validation.errors;
}

/*
 * Main webform_paging_validation_callback function implementation
 * Loops through items on page and executes implemented validation tests
 * Push this function on to the webform_paging_validation_callbacks Array
 */
Drupal.settings.webform_paging_validation_callbacks.push(Drupal.webform_validation.validate);

Drupal.webform_validation.testDependencies = function() {
    // Now we can test to see if dependency is met.
    $('div.webform-page-number-' + parseInt(Drupal.webform_validation.page) + ' :input.validation-dependency').each(function() {
        var errorCount = Drupal.webform_validation.errors.length;
        var customDependencyFunction = 'validation_dependency_'+$(this).attr('id').replace(/-/g,'_');

        Drupal.webform_validation.test(this,customDependencyFunction, '', false, true);

        // If validation errors is empty here then we need to remove any validation errors for this element as dependency has passed.
        if(errorCount == Drupal.webform_validation.errors.length) {
            Drupal.webform_validation.removeValidationErrors(this);
        }
    });
}

/*
 * Remove all validation errors corresponding to a element id.
 */
Drupal.webform_validation.removeValidationErrors = function(element) {
    var tmpArray = new Array();
    for(var i = 0; i < Drupal.webform_validation.errors.length; i++) {
        if(Drupal.webform_validation.errors[i].ele != $(element).attr('id')) {
            tmpArray.push(Drupal.webform_validation.errors[i]);
        }
    }
    Drupal.webform_validation.errors = tmpArray;
}

/*
 * Main validation test function
 * Various input types define a specific validation test callback and other
 * options which are passed to this function.
 *
 * Executes the validation test and modifies html appropriately.
 *
 * If ignoreNextValidation is true class ignore-validation will be added after successfull validation
 * this class must be manually removed elsewhere and can be used to prevent re-validation
 * from expensive callbacks.
 *
 */
Drupal.webform_validation.test = function(element, validationCallback, validationErrorMsg, ignoreNextValidation, forceValidation, ajaxTest) {
    // Only perform validation if element is defined and visible and not already errored
    if(element != 'undefined' && $(element).is(":visible") && (!$(element).hasClass('error') || forceValidation == true)) {

        var $this = $(element);

        var divName = $this.parent('div').parent('div').attr('id').split("webform-component-").pop();

        if($('#custom-error-message-'+divName).length){
            validationErrorMsg = Drupal.t($('#custom-error-message-' + divName).text());
        }
        // validationCallback is a string. window[validationCallback] should be a function
        validationCallback = window[validationCallback];
        if(typeof(validationCallback) === 'function') {
            // Append a validation indicator div once. eg. use css to display a tick or a cross
            if (!$('#'+element.id+'-validation-indicator').length > 0) {
                    if ($('#'+element.id+'-validation-indicator').length == 0) $(element).parent().append('<div id="'+element.id+'-validation-indicator" class="validation-indicator loading"></div>');
            }
            $('#'+element.id+'-validation-indicator').addClass('loading');
            if($('#'+element.id).hasClass('validation-dependency')) $('#'+element.id+'-validation-indicator').addClass('dependency');
            // Execute the validation callback then set appropriate messages and style classes
            var result = validationCallback(element,validationErrorMsg);

            if(!ajaxTest) {
                if(!result) {
                    $('#'+element.id+'-validation-indicator').removeClass('loading');
                    $('#' + $(element).parent().attr('id') + ' span.question-text').addClass('error');  // Legacy
                    $(element).removeClass('valid'); // Legacy
                    $(element).addClass('error'); // Legacy
                    $($(element).parent()).removeClass('valid');
                    $($(element).parent()).addClass('error');

                    Drupal.webform_validation.errors.push(new validationError(element.id, validationErrorMsg)); // Legacy
                    // error must take precidence if multiple validations
                    $('#'+element.id+'-validation-indicator').removeClass('valid');
                    $('#'+element.id+'-validation-indicator').addClass('error');
                    if ($('#'+element.id+'-help').length == 0) $(element).parent().append('<div id="'+element.id+'-help" class="validation-help">'+validationErrorMsg+'</div>');
                } else {
                    $('#'+element.id+'-validation-indicator').removeClass('loading');
                    $('#' + $(element).parent().attr('id') + ' span.question-text').removeClass('error'); // Legacy
                    $(element).removeClass('error'); // Legacy
                    $($(element).parent()).removeClass('error');
                    $(element).addClass('valid'); // Legacy
                    $($(element).parent()).addClass('valid');
                    $('#'+$(element).parent().attr('id')+' .validation-help').remove();

                    if (!$('#'+element.id+'-validation-indicator').hasClass('error')) $('#'+element.id+'-validation-indicator').addClass('valid');
                }
                if (ignoreNextValidation == true) $(element).addClass('ignore-validation');
            } else {
                Drupal.webform_validation.ajax_counter++;
                Drupal.webform_validation.errors.push(new validationError(element.id, Drupal.t(validationErrorMsg)));
            }
        }
    }
}


/*
 * Handle ajax callbacks
 */
Drupal.webform_validation.ajaxCallback = function(element, response, validationErrorMsg) {
    Drupal.webform_validation.ajax_counter--;

    var $this = $(element);

    var divName = $this.parent('div').parent('div').attr('id').split("webform-component-").pop();
    if($('#custom-error-message-'+divName).length){
        validationErrorMsg = Drupal.t($('#custom-error-message-' + divName).text());
    }

    if(response == true) {
        Drupal.webform_validation.test(element,'webformValidationCallbackTrue', validationErrorMsg, true, true);
        Drupal.webform_validation.removeValidationErrors(element)
    }
    else if (response == -2) {
        Drupal.webform_validation.test(element,'webformValidationCallbackFalse', Drupal.t('Oops! We couldn\'t validate your information this time. Please try again.'), true, true);
    }
    else {
        Drupal.webform_validation.test(element,'webformValidationCallbackFalse', validationErrorMsg, false, true);
    }

    // Resubmit page here if all ajax has completed and no errors - they should be skipped second time around...
    if(Drupal.webform_validation.ajax_counter < 1) {
        Drupal.webform_validation.testDependencies();
        // Remove any loading classes
        $('#edit-submit, #edit-continue, #edit-previous').removeClass('loading');
        $('#edit-submit, #edit-continue, #edit-previous').removeAttr('disabled');
        // Determine whether to continue or submit.
        if(Drupal.webform_validation.errors.length < 1 && Drupal.webform_submit_page == true) {
            if ($('#edit-continue').is(":visible"))  {
                $('#edit-continue').click();
            } else if ($('#edit-submit').is(":visible"))  {
                Drupal.webform_validation.skip_validation = true; // Part of the dependency dick-dance
                $('#edit-submit').click();
                $('#edit-submit').hide(); // Better to hide submit button after click to stop multiple submit
            }
        }
        else if (typeof Drupal.webform_paging.updatePageHeight == 'function')  {
            Drupal.webform_paging.updatePageHeight(Drupal.webform_validation.page);
        }
    }
}

/* Validation Callback Test Implementation
 * Implementation for "required" element
 */
function webformValidationCallbackRequired(element, validationErrorMsg) {
    var valid  = false;
    valid = (element.value != '');
    // Could the question have a watermark
    var classes = $(element).attr('class').split(" ");
    var regex = /^webform-component-watermark-input-(\d+)$/;
    for(var i=0; i < classes.length; i++) {
        if (classes[i].match(regex)) {
            var pieces = classes[i].split("-");
            var cid = pieces[pieces.length - 1];
        }
    }

    if ($(element).attr('id').match('\-submitted\-')) {
        valid = valid && element.value != $('#webform-component-watermark-' + cid).val();
    }

    return (valid);
}


/* Validation Callback Test Implementation
 * Implementation for "required" select element (includes, radios, checkboxes and select listbox)
 */
function webformValidationCallbackRequiredSelect(element, validationErrorMsg) {
    var checked = false;
    $('#' + element.id + ' .form-radio, #' + element.id + ' .form-checkbox').each(function() {
        if(this.checked) checked = true;
    });
    return checked;
}


/* Validation Callback Test Implementation
 * Implementation for "Email (Regex Only)"
 */
function webformValidationCallbackEmail_Regex(element, validationErrorMsg) {
    var reg = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
    return reg.test(element.value);
}

/*
    Validation callback for generic google validation: implemented 14/04/14
*/
function webformValidationCallbackGoogleValidationPostcode( element, validationErrorMsg ) {

    var response = false, thisRegion;

    _showLoadingMessage($(element), Drupal.t('Checking postcode...'));

    thisRegion = Drupal.settings.webform_validation.language;

    if(thisRegion.toUpperCase() == 'EN' || thisRegion.toUpperCase() == 'UK') {
        thisRegion = 'GB';
    }

    if(thisRegion.toUpperCase() === 'US') {
        validationErrorMsg = "Please enter a valid {region} zipcode";
    }

    validationErrorMsg = validationErrorMsg.replace("{region}", thisRegion);

    $.ajax({
        type: "POST",
        url: "/sites/all/modules/webform/webform_validation/extensions/ajax_validator.php",
        //url: '/webform_validation/validate/google',
        data: { value: element.value, region: thisRegion, type: 'postcode' },
        success: function(data) {
            if(thisRegion.toUpperCase() === 'US') {
                _showLoadingMessage($(element), false);
            } else {
                _showLoadingMessage($(element), false);
            }
            response = data.response;
            Drupal.webform_validation.ajaxCallback(element, response, validationErrorMsg);
        },
        error: function(data, textStatus, errorThrown) {
            response = -2;
            Drupal.webform_validation.ajaxCallback(element, response, validationErrorMsg);
        },
        dataType: 'json',
        async: true
    });
    return response;

}

function webformValidationCallbackGoogleValidationPhone( element, validationErrorMsg ) {

    var response = false, thisRegion;
    _showLoadingMessage($(element), Drupal.t('Checking number...'));

    thisRegion = Drupal.settings.webform_validation.language;

    if(thisRegion.toUpperCase() == 'EN' || thisRegion.toUpperCase() == 'UK') {
        thisRegion = 'GB';
    }

    validationErrorMsg = validationErrorMsg.replace("{region}", thisRegion);

    $.ajax({
        type: "POST",
        url: "/sites/all/modules/webform/webform_validation/extensions/ajax_validator.php",
        //url: '/webform_validation/validate/google',
        data: { value: element.value, region: thisRegion, type: 'phone' },
        success: function(data) {
            _showLoadingMessage($(element), false);
            response = data.response;
            Drupal.webform_validation.ajaxCallback(element, response, validationErrorMsg);
        },
        error: function(data, textStatus, errorThrown) {
            response = -2;
            Drupal.webform_validation.ajaxCallback(element, response, validationErrorMsg);
        },
        dataType: 'json',
        async: true
    });
    return response;

}


/* new google validation code 14/04/14 */
/*

function webformValidationCallbackGoogleValidationPostcode( element, validationErrorMsg ) {
    return this.webformValidationCallbackGoogleValidation( element, validationErrorMsg, 'postcode');
}

function webformValidationCallbackGoogleValidationPhone( element, validationErrorMsg ) {
    return this.webformValidationCallbackGoogleValidation( element, validationErrorMsg, 'phone');
}
*/

/* Validation Callback Test Implementation
 * Implementation for "Email"
 */
function webformValidationCallbackEmail(element, validationErrorMsg) {
    var response = false;
    $.ajax({
        url: '/webform_validation/validate/email',
        data: { email: element.value },
        success: function(data) {
            response = data['response'];
            Drupal.webform_validation.ajaxCallback(element, response, validationErrorMsg);
        },
        error: function(data, textStatus, errorThrown) {
            response = -2;
            Drupal.webform_validation.ajaxCallback(element, response, validationErrorMsg);
        },
        dataType: 'json',
        async: true
    });
    return response;
}

/* Validation Callback Test Implementation
 * Implementation for "US and CA Phone (Regex Only)"
 */
function webformValidationCallbackUSCAPhone_Regex(element, validationErrorMsg) {
    // Add exceptions...
    element.value = element.value.replace('(0)','');
    element.value = element.value.replace(/[^\d\+]/g,'');
    var reg = /^(\+1|1|001){0,1}?\d{10}$/;
    return (reg.test(element.value) && element.value.length > 8);
}

/* Validation Callback Test Implementation
 * Implementation for "AU Phone (Regex Only)"
 */
function webformValidationCallbackAUPhone_Regex(element, validationErrorMsg) {
    // Add exceptions...
    element.value = element.value.replace('(0)','');
    element.value = element.value.replace(/[^\d\+]/g,'');
    var reg = /^(?:\+61|0|0061)[2-999](?:[ -]?[0-9]){8}$/;
    return (reg.test(element.value) && element.value.length > 8);
}

/* Validation Callback Test Implementation
 * Implementation for "DE Phone (Regex Only)"
 */
function webformValidationCallbackDEPhone_Regex(element, validationErrorMsg) {
    // Add exceptions...
    element.value = element.value.replace('(0)','');
    element.value = element.value.replace(/[^\d\+]/g,'');
    var reg = /^(((((((00|\+)49[ \-/]?)|0)[1-9][0-9]{1,4})[ \-/]?)|((((00|\+)49\()|\(0)[1-9][0-9]{1,4}\)[ \-/]?))[0-9]{1,7}([ \-/]?[0-9]{1,5})?)$/;
    return (reg.test(element.value) && element.value.length > 8);
}

/* Validation Callback Test Implementation
 * Implementation for "UK Phone (Regex Only)"
 */
function webformValidationCallbackUKPhone_Regex(element, validationErrorMsg) {
    // Add exceptions...
    element.value = element.value.replace('(0)','');
    element.value = element.value.replace(/[^\d\+]/g,'');
    var reg = /^(\+44|0)((1\d\d|800)\d{6,7}|(2[03489]|3[0347]|5[56]|7[04-9]|8[047]|9[018])\d{8}|500\d{6}|8(001111|45464\d))$/;
    return (reg.test(element.value) && element.value.length > 8);
}

function webformValidationCallbackLoosePhone_Regex(element, validationErrorMsg) {
    if (element.value.replace(/[^\d]/,'') == '01234567890') return false;
    var reg = /[^\d\s-\\+()]/;
    return (!reg.test(element.value) && element.value.length > 6);
}

/* Validation Callback Test Implementation
 * Implementation for "FR Phone (Regex Only)"
 */
function webformValidationCallbackFRPhone_Regex(element, validationErrorMsg) {
    var reg = /^((0|\+33|0033)[1-79]{1}?([\s-]?\d{2}){4})$/;
    return (reg.test(element.value) && element.value.length > 9);
}
/* Validation Callback Test Implementation
 * Implementation for "First and Last name (Regex Only)"
 */
function webformValidationCallbackFirstLastName_Regex(element, validationErrorMsg) {
    var reg = /[^]+\s[^]+$/;
    return (reg.test(element.value));
}

/* Validation Callback Test Implementation
 * Part of the async ajax dick-dance
 */
function webformValidationCallbackTrue(element, validationErrorMsg) {
    return true;
}

/* Validation Callback Test Implementation
 * Part of the async ajax dick-dance
 */
function webformValidationCallbackFalse(element, validationErrorMsg) {
    return false;
}

/* Validation Callback Test Implementation
 * Implementation for "UK Phone"
 */
function webformValidationCallbackUKPhone(element, validationErrorMsg) {
    var response = false;
    if (webformValidationCallbackLoosePhone_Regex(element, validationErrorMsg)) {
        $.ajax({
            url: '/webform_validation/validate/landline',
            data: { number: element.value },
            success: function(data) {
                response = data['response'];
                Drupal.webform_validation.ajaxCallback(element, response, validationErrorMsg);
            },
            error: function(data, textStatus, errorThrown) {
                response = -2;
                Drupal.webform_validation.ajaxCallback(element, response, validationErrorMsg);
            },
            dataType: 'json',
            async: true
        });
    } else {
        // Regex fails so don't waste a ping
        response = false;
        Drupal.webform_validation.ajaxCallback(element, response, validationErrorMsg);
    }
    return response;
}


/* Validation Callback Test Implementation
 * Implementation for "UK Mobile"
 */
function webformValidationCallbackUKMobile(element, validationErrorMsg) {
    var response = false;
    if (webformValidationCallbackLoosePhone_Regex(element, validationErrorMsg)) {
        $.ajax({
            url: '/webform_validation/validate/mobile',
            data: { mobile: element.value },
            success: function(data) {
                response = data['response'];
                Drupal.webform_validation.ajaxCallback(element, response, validationErrorMsg);
            },
            error: function(data, textStatus, errorThrown) {
                response = -2;
                Drupal.webform_validation.ajaxCallback(element, response, validationErrorMsg);
            },
            dataType: 'json',
            async: true
        });
    } else {
        // Regex fails so don't waste a ping
        response = false;
        Drupal.webform_validation.ajaxCallback(element, response, validationErrorMsg);
    }
    return response;
}


/* Validation Callback Test Implementation
 * Implementation for "UK Any Phone"
 */
function webformValidationCallbackUKAnyPhone(element, validationErrorMsg) {

    var response = false;
    if (webformValidationCallbackLoosePhone_Regex(element, validationErrorMsg)) {
        // Determine if it is a landline or mobile to ping appropriately
            var phone_type = 'phone';
            _showLoadingMessage($(element), Drupal.t('Checking number...'));
        // Ping UK Telephone
        $.ajax({
            url: '/webform_validation/validate/'+phone_type,
            data: { number: element.value },
            success: function(data) {
                response = data['response'];
                _showLoadingMessage($(element), false);
                Drupal.webform_validation.ajaxCallback(element, response, validationErrorMsg);
            },
            error: function(data, textStatus, errorThrown) {
                response = -2;
                Drupal.webform_validation.ajaxCallback(element, response, validationErrorMsg);
            },
            dataType: 'json',
            async: true
        });
    } else {
        // Regex fails so don't waste a ping
        response = false;
        Drupal.webform_validation.ajaxCallback(element, response, validationErrorMsg);
    }

    return response;
}


/* Validation Callback Test Implementation
 * Implementation for "UK Postcode"
 */
function webformValidationCallbackUKPostcode(element, validationErrorMsg) {
    var reg = /(GIR 0AA)|(((A[BL]|B[ABDHLNRSTX]?|C[ABFHMORTVW]|D[ADEGHLNTY]|E[HNX]?|F[KY]|G[LUY]?|H[ADGPRSUX]|I[GMPV]|JE|K[ATWY]|L[ADELNSU]?|M[EKL]?|N[EGNPRW]?|O[LX]|P[AEHLOR]|R[GHM]|S[AEGKLMNOPRSTY]?|T[ADFNQRSW]|UB|W[ADFNRSV]|YO|ZE)[1-9]?[0-9]|((E|N|NW|SE|SW|W)1|EC[1-4]|WC[12])[A-HJKMNPR-Y]|(SW|W)([2-9]|[1-9][0-9])|EC[1-9][0-9]) ?[0-9][ABD-HJLNP-UW-Z]{2})/;
    return (reg.test(element.value.toUpperCase()));
}

/* Validation Callback Test Implementation
 * Implementation for "US Postcode"
 */
function webformValidationCallbackUSPostcode(element, validationErrorMsg) {
    var reg = /^[0-9]{5}([- /]?[0-9]{4})?$/;
    return (reg.test(element.value.toUpperCase()));
}

/* Validation Callback Test Implementation
 * Implementation for "CA Postcode"
 */
function webformValidationCallbackCAPostcode(element, validationErrorMsg) {
    var reg = /^[a-vx-yA-VX-Y]\d{1}[a-zA-Z](\-| |)\d{1}[a-zA-Z]\d{1}$/;
    return (reg.test(element.value.toUpperCase()));
}

/* Validation Callback Test Implementation
 * Implementation for "DE Postcode"
 */
function webformValidationCallbackDEPostcode(element, validationErrorMsg) {
    var reg = /^(?!01000|99999)(0[1-9]\d{3}|[1-9]\d{4})$/;
    return (reg.test(element.value.toUpperCase()));
}

/* Validation Callback Test Implementation
 * Implementation for "AU Postcode"
 */
function webformValidationCallbackAUPostcode(element, validationErrorMsg) {
    var reg = /^[0-9]{4}$/;
    return (reg.test(element.value.toUpperCase()));
}


/* Validation Callback Test Implementation
 * Implementation for "UK Address"
 * Uses AJAX callback to validate the supplied address / postcode
 * combination using Web Service call to GB point
 */
function webformValidationCallbackUKAddress(element, validationErrorMsg) {
    var response = false;
    $.ajax({
        url: '/webform_validation/validate/address',
        data: { address: element.value, postcode: $('div.webform-page-number-' + parseInt(page) + ' :input.additional-validation-ukpostcode').val() },
        success: function(data) {
            if (data['response'] != false) {
                for(key in data['response']) {
                    if ($('#edit-submitted-' + key).length > 0) {
                        $('#edit-submitted-' + key).val(data['response'][key]);
                    }
                }
                response = true;
            }
            else {
                response = false;
            }
            Drupal.webform_validation.ajaxCallback(element,response, validationErrorMsg);
        },
        error: function(data, textStatus, errorThrown)  {
            response = -2;
            Drupal.webform_validation.ajaxCallback(element,response, validationErrorMsg);
        },
        dataType: 'json',
        async: true
    });
    return response;
}


/* Validation Callback Test Implementation
 * Implementation for "Date"
 */
function webformValidationCallbackDate(element, validationErrorMsg) {
    var day = $('#'+element.id+' .form-select.day option:selected').val();
    var month = $('#'+element.id+' .form-select.month option:selected').val();
    var year = $('#'+element.id+' .form-select.year option:selected').val();
    return (day.length > 0 && month.length > 0 && year.length > 0);
}

/* Validation Callback Test Implementation
 * Implementation for "Date range"
 */
function webformValidationCallbackDateMinMax( element, validationErrorMsg ) {

    var $this = $(element);
    var $thisId = $this.attr('id');

    thisMaxDate = $this.attr('data-attr-maxdate');
    thisMinDate = $this.attr('data-attr-mindate');

    var finalMaxDate =  $('#tempmaxdatepickersettime_' + $thisId).datepicker( "getDate" );
    var finalMinDate =  $('#tempmindatepickersettime_' + $thisId).datepicker( "getDate" );
    var thisDate = $this.datepicker( "getDate" );

    var maxDateValue = new Date(finalMaxDate);
    var minDateValue = new Date(finalMinDate);
    var thisDateValue = new Date(thisDate);

    var reg = /^\d\d\/\d\d\/\d\d\d\d$/;

    setTimeout(function(){
        $('#tempmaxdatepickersettime_' + $thisId).remove();
        $('#tempmindatepickersettime_' + $thisId).remove();
    }, 100);

    if ((Date.parse(minDateValue) - (1000 * 60 * 60 * 24)) > Date.parse(thisDateValue) && thisMinDate != '' ) {
        return false;
    } else if ( Date.parse( thisDateValue ) > (Date.parse(maxDateValue) + (1000 * 60 * 60 * 24)) && thisMaxDate != '' ) {
        return false;
    } else if ( reg.test( $this.attr('value') ) == false ) {
        return false;
    } else {
        return true;
    }

}

/* Generate error message based on min date and max date. Also sets up the past and future datepicker.
 * Implementation for "Date range"
 */
function webformValidationGetDateRangeErrorMessage( element ) {

    var $this = element, $thisId = $this.attr('id');

    thisMaxDate = $this.attr('data-attr-maxdate');
    thisMinDate = $this.attr('data-attr-mindate');

    $this.parent('div').append("<input type='text' id='tempmaxdatepickersettime_" + $thisId + "' style='display:none' />");
    $this.parent('div').append("<input type='text' id='tempmindatepickersettime_" + $thisId + "' style='display:none' />");
    $('#tempmaxdatepickersettime_' + $thisId).datepicker({ minDate: thisMinDate, maxDate: thisMaxDate});
    $('#tempmindatepickersettime_' + $thisId).datepicker({ minDate: thisMinDate, maxDate: thisMaxDate});
    $('#tempmaxdatepickersettime_' + $thisId).datepicker( "setDate", thisMaxDate);
    $('#tempmindatepickersettime_' + $thisId).datepicker( "setDate", thisMinDate);

    var finalMaxDate =  $('#tempmaxdatepickersettime_' + $thisId).datepicker( "getDate" );
    var finalMinDate =  $('#tempmindatepickersettime_' + $thisId).datepicker( "getDate" );

    var maxDateValue = new Date(finalMaxDate);
    var minDateValue = new Date(finalMinDate);

    $thisId = $thisId.split("edit-submitted-").pop()

    var customError = $('#custom-error-message-'+ $thisId).text();

    if(thisMaxDate != '' && thisMinDate != '') {

        var dateMessage = minDateValue.getDate() + "/" + (minDateValue.getMonth() + 1) + "/" + minDateValue.getFullYear() + " - " + maxDateValue.getDate() + "/" + (maxDateValue.getMonth() + 1) + "/" + maxDateValue.getFullYear();

        return Drupal.t('Date must be between ' + dateMessage);

    } else if ( thisMaxDate != '' && thisMinDate == '' ) {

        var dateMessage = maxDateValue.getDate() + "/" + (maxDateValue.getMonth() + 1) + "/" + maxDateValue.getFullYear();

        return Drupal.t('Date must be before ' + dateMessage);

    } else if ( thisMaxDate == '' && thisMinDate != '' ) {

        var dateMessage = minDateValue.getDate() + "/" + (minDateValue.getMonth() + 1) + "/" + minDateValue.getFullYear();

        return Drupal.t('Date must be after ' + dateMessage);

    } else {
        return Drupal.t('Date must be in a valid format');
    }

}

/* Validation Callback Test Implementation
 * Implementation for "Date dd/mm/yyyy"
 */
function webformValidationCallbackDate_ddmmyyyy(element, validationErrorMsg) {
    var reg = /^\d\d\/\d\d\/\d\d\d\d$/;
    return (reg.test(element.value));
}

function _showLoadingMessage($element, showMessage) {
    if (showMessage === false) {
        var $elementSibling = $element.siblings('.validation-help');
        $elementSibling.remove();
    } else{
        var $id = $element.attr('id');
        $element.after('<div id="' + $id + '" class="validation-help">' + showMessage + '</div>');
    }
}