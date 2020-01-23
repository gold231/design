module.exports = {

  partnerForm: function() {

    var $partnerForm  = $('.partner-form-element'),
        viewportWidth = $(document).width();

    $partnerForm.click(function() {

      var $this  = $(this),
          $btn   = $this.find('.checkbox'),
          myId   = $this.attr('id'),
          idNum  = myId.replace('partner-form-element-', '');

      var $checkBox = $('#edit-submitted-partners-partner-selected-' + idNum),
          $wrappers = $('#partner-form-element-' + idNum);

      $checkBox.attr('checked', !$checkBox.attr('checked'));
      $this.add($btn).toggleClass('on').toggleClass('off');

      if ($this.hasClass('on')) {
        $btn.text(Drupal.t('Joined'));
        $this.find('.featured-ribbon').hide();

        // find next unchecked item
        var nextOffItem = $(this).nextAll('.off');
        var scrollTarget = nextOffItem.offset().top;

        if($partnerForm.length === $('.partner-form-element.on').length) {
          scrollTarget = $('.btn-wrapper').offset().top;
        }

        $('html, body').animate({
          scrollTop: $this.offset().top
        }, 500);
      }
      else if ($this.hasClass('off')) {
        var th = $this.find('.partner-details').attr('data-panel-height');
        $btn.text(Drupal.t('Join Now'));

        $this.find('.partner-details').stop().animate({
          height: th
        }, 500);
        $this.stop().animate({
          paddingTop: 2 + 'em',
          paddingBottom: 2 + 'em'
        }, 200);
      }
    });

    //setTimeout(function() {
    //  $partnerForm.each(function() {
    //    var $this = $(this);
    //    if ($this.hasClass('on')) {
    //      $this.stop().animate({
    //        paddingTop: 5,
    //        paddingBottom: 5
    //      }, 200);
    //    }
    //  });
    //}, 1500);
  }
}