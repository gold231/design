Drupal.behaviors.googleAnalyticsET = function (context) {
  // make sure that the google analytics event tracking object exists
  // if not then exit and don't track
  if (typeof dataLayer == 'undefined' && typeof _gaq == 'undefined') {
    return;
  }

  var settings = Drupal.settings.googleAnalyticsETSettings;

  var s = new Array();
  for(var i = 0; i < settings.selectors.length; i++) {
    s[i] = settings.selectors[i].selector;
  }

  $.each(s,
    function(i, val) {
      $(settings.selectors[i].selector).bind(settings.selectors[i].event,
        function(event) {
          trackEvent($(this), $(this).parent(), settings.selectors[i].category, settings.selectors[i].action, settings.selectors[i].label, settings.selectors[i].value, settings.selectors[i].noninteraction)
        }
      );
    }
  );
};

/**
 * trackEvent does the actual call to dataLayer.push or _gaq.push.
 *
 * trackEvent calls the push method from the preferred object. It also preforms
 * any token replacements on the category, action, and opt_label parameters.
 *
 * @param $obj
 *   The jQuery object that the DOM event was trggered on.
 * @param $parent
 *   The jQuery parent of $obj.
 * @param category
 *   The name you supply for the group of objects you want to track.
 * @param action
 *   A string that is uniquely paired with each category, and commonly used
 *   to define the type of user interaction for the web object.
 * @param opt_label
 *   An optional string to provide additional dimensions to the event data.
 * @param opt_value
 *   An integer that you can use to provide numerical data about the user
 *   event.
 * @param opt_oninteraction
 *   A boolean that when set to true, indicates that the event hit will not
 *   be used in bounce-rate calculation.
 */
function trackEvent($obj, $parent, category, action, opt_label, opt_value, opt_noninteraction) {
  var href = $obj.attr('href') == undefined ? false : String($obj.attr('href'));
  var text = String($obj.attr('value') != undefined ? $obj.val() : $obj.text());

  $tokens = {'!id': String($obj.attr('id').replace(/edit-submitted(-group-\d+-)?/g, '').replace(/-/g, ' ').capitalize()), '!text': text, '!href': href, '!currentPage': String(window.location.href), '!nid': String(Drupal.settings.nid), '!language_name': String(Drupal.settings.language_name), '!label': String($parent.text().replace('*', '').trim())};
  //include additional settings
  for (var token in Drupal.settings.additional_et_settings) {
    $tokens['!' + token] = Drupal.settings.additional_et_settings[token];
  }

  category = Drupal.t(category, $tokens);
  action = Drupal.t(action, $tokens);
  opt_label = Drupal.t(opt_label, $tokens);
  if (!category || !action) {
    return;
  }

  if (opt_label.endsWith('!test')) {
    debugEvent($obj, category, action, opt_label.replace('!test', '').trim(), opt_value, opt_noninteraction);
  }
  else {
    if (typeof dataLayer != 'undefined') {
      var gEvent = {
        'eventCategory': String(category),
        'eventAction': String(action),
        'eventLabel': String(opt_label),
        'eventValue': Number(opt_value),
        'eventNonInteraction': Boolean(opt_noninteraction),
        'event': 'GAEvent'
      };
      console.log(gEvent);
      dataLayer.push(gEvent);
    }
    else {
      _gaq.push(['_trackEvent', String(category), String(action), String(opt_label), Number(opt_value), Boolean(opt_noninteraction)]);
    }
  }
}

/**
 * A simple debug function that matches the trackEvent function.
 */
function debugEvent($obj, category, action, opt_label, opt_value, opt_noninteraction) {
  console.log(category + ' ' + action  + ' ' + opt_label + ' ' + opt_value);
}

/**
 * Implementation of endsWith() function.
 */
if (typeof String.prototype.endsWith == 'undefined') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

/**
 * Implementation of capitalize()
 */
if (typeof String.prototype.capitalize == 'undefined') {
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };
}