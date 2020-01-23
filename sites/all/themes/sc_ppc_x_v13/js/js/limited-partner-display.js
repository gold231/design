module.exports = {

  settings: {
    partners: document.getElementsByClassName('partner-form-element'),
  },

  limitedPartnerDisplay: function() {

    if (Drupal.settings.offer_page.page_size !== undefined) {
      var initialDisplayedPartners = Drupal.settings.offer_page.page_size - 1;
      var totalDisplayedPartners = Drupal.settings.offer_page.total -1;

      for (var i = initialDisplayedPartners + 1; i < module.exports.settings.partners.length; i += 1) {
        module.exports.settings.partners[i].classList.add('partner-hidden');
      };
    }
    else if (Drupal.settings.offer_page.total !== undefined) {
      for (var i = totalDisplayedPartners + 1; i < module.exports.settings.partners.length; i += 1) {
        module.exports.settings.partners[i].classList.add('partner-hidden');
      };
    }
  },

  createPartnerDisplayButton: function() {

    var showMorePartnersButton = document.createElement('button');
    var partnerElements = document.getElementById('partner-elements');
    var totalDisplayedPartners = Drupal.settings.offer_page.total;
    var initialDisplayedPartners = Drupal.settings.offer_page.page_size;   

    if (module.exports.settings.partners.length > initialDisplayedPartners && initialDisplayedPartners != totalDisplayedPartners) {
      showMorePartnersButton.innerHTML = Drupal.t('Show More Partners');
      showMorePartnersButton.classList.add('show-more-partners');
      showMorePartnersButton.onclick = module.exports.displayRemainingPartners;
      partnerElements.appendChild(showMorePartnersButton);
      partnerElements.classList.add('partner-elements-adjustment');
    }
  },

  removeHiddenClassname: function(list, element) {
    for (var i = 0; i < list; i += 1) {
      if (element[i] !== undefined) {
        element[i].classList.remove('partner-hidden');
      }
    };
  },

  displayRemainingPartners: function(event) {
    event.preventDefault();

    var totalDisplayedPartners = Drupal.settings.offer_page.total;
    var partnerElements = document.getElementById('partner-elements');

    this.remove();

    if (totalDisplayedPartners !== undefined) {
      module.exports.removeHiddenClassname(totalDisplayedPartners, module.exports.settings.partners);
    }
    else {
      module.exports.removeHiddenClassname(module.exports.settings.partners.length, module.exports.settings.partners);
    }

    partnerElements.classList.remove('partner-elements-adjustment');
  }
}
