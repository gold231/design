module.exports = {

  datePickOffset : function() {

    // Date Picker calendar Offset
    // update year date picker with non gregorian calendar offset
    var selectYearPicker = $('[id$="date-of-birth-year"]');
    var calendarOffset = 0;

    switch ($('html').attr('lang')) {
      case "th" :
        var calendarOffset = 543;
        break;
      default:
        // do nothing
    }

    $('[id$="date-of-birth-year"]').children('option').each(function(index) {
      // index 0 is the question default label
      if(index > 0) {
        $(this).text(parseInt($(this).text()) + calendarOffset);
      }
    });
  }
};
