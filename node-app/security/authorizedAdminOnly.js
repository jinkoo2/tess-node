const ERROR_CODE = require('../error_code')
const { err } = require('../utils/helper')


// this module needs to used after authorizedUserOnly
const authorizedAminOnly = function (req, res, next) {

    const token =
        req.body.user_token ||
        req.query.user_token ||
        //req.headers['x-access-token'] ||
        req.cookies.user_token;

    const session_id = req.uuid;
    const session = {
        session_id,
        token
    }


    if (req.user && req.user.type === "admin") {
        next()
    }
    else {
        err(ERROR_CODE.USER.UNAUTHORIZED,
            "/users/list failed - Unauthorized",
            session, res, req)
    }
}

module.exports = authorizedAminOnly