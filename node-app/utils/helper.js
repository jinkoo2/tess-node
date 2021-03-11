const emailer = require('../providers/emailer');
const logger = require('../providers/logger')

function err(error_code, error_msg, session, res, req, notify_admin = false, error = null) {
    res.send({
        session_id: session.session_id,
        success: false,
        error_code,
        message: error_msg,
    });
    const meta = { error_code, session, error, url: req.url, success: false };

    // do not log sensitive data (like token, processed user data, etc)
    logger.error(error_msg, { metadata: meta })
    if (notify_admin)
        emailer.notifyAdmins(error_msg, JSON.stringify(meta))
}

function scc(msg, session, res, req, data_to_user, data_to_logger, notify_admin = false) {
    res.send({
        session_id: session.session_id,
        success: true,
        message: msg,
        data: data_to_user,
    });

    // do not log sensitive data (like token, processed user data, etc)
    const meta = { session, url: req.url, data: data_to_logger, success: true };
    logger.info(msg, { metadata: meta })
    if (notify_admin)
        emailer.notifyAdmins(msg, JSON.stringify(meta))
}


function is_validate_email(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}



module.exports = { err, scc, is_validate_email };