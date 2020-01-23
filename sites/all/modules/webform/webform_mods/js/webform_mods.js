Drupal.webform_mods = new Object();

Drupal.behaviors.webform_mods = function(context) {
  Drupal.webform_mods.resizeAndReposition();
  Drupal.webform_mods.sync();
}

Drupal.webform_mods.resizeAndReposition = function() {
  var maxwidth = 0;
  var max_form_width = parseInt(($(".webform-client-form").width() / 100) * 30);
  $(".webform-container-inline > div.form-item > label").each(function() {
    width = $(this).width();
    if (width <= max_form_width && width > maxwidth) {
      maxwidth = width;
    }
  });
  $(".webform-container-inline > div.form-item > label").each(function() {
    if ($(this).width() <= maxwidth) {
      $(this).css({'width' : (maxwidth + 1) + 'px'}).addClass('width-processed');
    }
  });
  $('head').append('<style> .validation-help { margin-left: ' + (maxwidth + 20) + 'px; }</style>');
  $('#edit-submit').css({'margin-left' : (maxwidth + 10) + 'px'}).addClass('width-processed');
}

Drupal.webform_mods.sync = function() {
  $('select, input:text, input:email, textarea').change(function() {
    $('[name="' + this.name + '"]').val(this.value);
  });
  // This assumes that the theme will have added the
  // element id as a class to the input
  $('input:radio, input:checkbox').click(function() {
    $('.' + this.id).attr('checked', true);
  });
}