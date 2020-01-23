// Get the current node id to use for whatever.
// var nodeId = getCurrentNodeId();
// var viewportWidth = $(document).width();

var $body = $('body');

module.exports = {

  isEmpty: function(obj) {

    // null and undefined are "empty"
    if (obj == null) {
      return true;
    }
    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0) {
      return false;
    }
    else if (obj.length === 0) {
      return true;
    }

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
      if (hasOwnProperty.call(obj, key)) {
        return false;
      }
    }

    return true;
  },

  // Random function if we need to check for a Node ID
  getCurrentNodeId: function() {
    var $bodyNode = $('body.page-node');
    if (!$bodyNode.length)
      return false;
    var bodyClasses = $bodyNode.attr('class').split(/\s+/);
    for (i in bodyClasses) {
      var c = bodyClasses[i];
      if (c.length > 10 && c.substring(0, 10) === "page-node-")
        return parseInt(c.substring(10), 10);
    }
    return false;
  },

  progressBar: function() {
    // init progress bar

    var progress_total = 5;
    var progress_step = 100 / progress_total;
    $('.form-progress .step-total').text(progress_total); // number step

    if(Drupal.settings.webform['page_num'] === 1) {
      $('.form-progress .step-value').text(1); // default is 1 at start
      // animate current progess postion on load
      $('.form-progress-bar').animate({width: '20%'}, 'fast' );
    }
    else if(Drupal.settings.webform['page_num'] === 'confirmation') {
      $('.form-progress .step-value').text(progress_total);
      $('.form-progress-bar').animate({width: progress_total * progress_step + '%'}, 'fast' );
    }
    else {
      current_page = Drupal.settings.webform['page_num'] + 1;
      Drupal.settings.webform['page_num']
      $('.form-progress .step-value').text(current_page);
      $('.form-progress-bar').animate({width: current_page * progress_step + '%'}, 'fast' );
    };
  },

  fieldsetHeight: function() {
    // reset custom paging first page height
    $('.webform-paging').each(function() {
      fieldsetFirst = $(this).find('fieldset').eq(0);
      $(this).height(fieldsetFirst.outerHeight() + customDOB.height());
    });
  },

  fancyForm: function() {
    var radioButtons = $('input[type="radio"]');

    // custom radio-buttons and checkboxes
    // Add class to toggle custom styles
    $('.form-radios, .form-checkboxes').addClass('fancy-form');

    //Radio button and check boxes add remove checked class
    $('.form-radios .form-item').mousedown(function(){
      $(this).addClass('checked').siblings('.form-item').removeClass('checked');
    });

    $('.form-checkboxes .form-item').mousedown(function() {
      var $this = $(this);
      if ($this.hasClass('checked')) {
        $this.removeClass('checked');
      }
      else {
        $this.addClass('checked');
      }
    });

    $('.option').click(function() {
      radioButtons.each(function() {
        $(this).parent().toggleClass('selected', this.checked);
        $(this).parents('.webform-component:first').addClass('valid');
      });
    });

    // Wrap Button on Partner Page in a div:
    if ($body.hasClass('webform-page-number-2')) {
      $('#edit-continue').wrap('<div class="btn-wrapper"></div>');
    }
  },

  genderClass: function() {
    // Check if body has class of male/female, get users age from classname and match it to display the correct personalisation div
    // which is defined in the partner node

    if ($body.hasClass('gender-male') || $body.hasClass('gender-female')) {

      var classArray = $('body').attr('class').split(' ');
      var prefix = 'user-age-';
      var age;

      if ($body.hasClass('gender-male')) {
        var ageGroup = $('div.age-group p.male');
      }
      else if ($body.hasClass('gender-female')) {
        var ageGroup = $('div.age-group p.female');
      }

      $.each(classArray, function(a, b) {

        if (b.indexOf(prefix) != -1) {
          var i = b.split(prefix);
          age = i[1];
        }
      });

      $.each(ageGroup, function() {

        var dataVal = $(this).attr('data-range');
        var dataArray = dataVal.split('-');

        if (age >= parseInt(dataArray[0]) && age <= parseInt(dataArray[1])) {
          $(this).show();
        }
      });
    };
  },

  formCycle: function() {
    // init paging cycle
    $('.webform-paging').cycle({
      fx: 'scrollLeft',
      prev: '.prev-slide-btn',
      timeout: 0,
      speed: 300
    });
  },

  divCycle: function() {
    // testimonials slider
    $('#slider').cycle({
      fx: 'scrollHorz',
      timeout: 0,
      next: '#next',
      prev: '#prev',
      speed: 500
    });
  }
}