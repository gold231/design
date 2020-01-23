Drupal.behaviors.faq = function(context) {
    $('.accordian-faq > div.title').each(function() {
        var title = $(this).find('h4').text();
        if (title && typeof dataLayer != 'undefined') {
            $(this).click(function() {
                dataLayer.push({
                  'eventCategory': 'FAQ',
                  'eventAction': 'click',
                  'eventLabel': title,
                  'eventValue': 0,
                  'eventNonInteraction': true,
                  'event': 'GAEvent'
                });
            })
        }
    })
}