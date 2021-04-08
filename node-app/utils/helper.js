const emailer = require('../providers/emailer');
const Log = require('../models/log');

function err(error_code, error_msg, res, req, notify_admin = false, error = null, data_to_log = null) {

    const session = req.session;

    res.send({
        session_id: session.session_id,
        success: false,
        error_code,
        message: error_msg,
    });
    const meta = { error_code, error, url: req.url, success: false, data: data_to_log };

    // do not log sensitive data (like token, processed user data, etc)
    //logger.error(error_msg, { metadata: meta })
    const log = new Log(
        {
            level: 'error',
            message: error_msg,
            // email: (session.email) ? (session.email) : "",
            // user_ip: (session.user_ip) ? (session.user_ip) : "",
            ...session,
            meta,
        })
    log.save()

    if (notify_admin)
        emailer.notifyAdmins(error_msg, JSON.stringify(meta))
}

function scc(msg, res, req, data_to_user, data_to_logger, notify_admin = false) {

    const session = req.session;

    console.log('data_to_user', data_to_user)
    res.send({
        session_id: session.session_id,
        success: true,
        message: msg,
        data: data_to_user,
    });

    // do not log sensitive data (like token, processed user data, etc)
    const meta = { data: data_to_logger, success: true };
    const log = new Log({
        level: 'info',
        message: msg,
        ...session,
        meta
    })
    log.save();

    // notify
    if (notify_admin)
        emailer.notifyAdmins(msg, JSON.stringify(meta))
}

function log_info(msg, session = null) {
    const log = new Log({
        level: 'info',
        message: msg,
        ...session,
    });

    console.log(log)

    return log.save();
}

function log_error(msg, error, session = null) {
    const log = new Log({
        level: 'error',
        message: msg,
        error,
        ...session
    });

    console.error(log)
    return log.save();
}

function log_obj(obj) {

    console.log(obj)

    return new Log(obj).save();
}


function is_validate_email(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}



module.exports = { err, scc, is_validate_email, log_info, log_error, log_obj };