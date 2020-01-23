Drupal.optimizely = new Object();

Drupal.behaviors.optimizely = function (context) {
    var eventName = 'landingpage';
    switch (Drupal.settings.webform.page_num) {
        case 2:
            eventName = 'partnerspage';
            break;
    
        case 3:
            eventName = 'personaldetails';
            break;

        case 'confirmation':
            if (Drupal.optimizely.confirmation_url != '' && window.location.href.match(Drupal.optimizely.confirmation_url)) {
                eventName = 'emailconfirmation';
            } else {
                eventName = 'thankyoupageconfirmation';
            }
            break;        
    }
    window['optimizely'] = window['optimizely'] || [];
    window['optimizely'].push({
        type: "event",
        eventName: eventName
    });    
}
