Drupal.gdpr = new Object();

Drupal.behaviors.gdpr = function (context) {
    if (Drupal.gdpr.sid > 0) {
        // handle opt-out on thank-you page
        $('#gdpr-opt-out').click(function () {
            $.post('/gdpr/opt-out', { sid: Drupal.gdpr.sid });
            $(this).attr('disabled', 'disabled');
        });
    } else {
        if (Drupal.gdpr.consented_legal_statement_hash) {
            $('#edit-gdpr-consented-legal-statement-hash').val(Drupal.gdpr.consented_legal_statement_hash);
        }
        if (Drupal.gdpr.opt_out_seen) {
            $('#edit-gdpr-opt-out').val(0);
            $('#gdpr-opt-out').click(function () {
                $('#edit-gdpr-opt-out').val($(this).attr('checked') ? 1 : 0);
            });
        }
    }
}
