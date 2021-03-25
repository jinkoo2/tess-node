const ERROR_CODE = require('../error_code')
const { err } = require('../utils/helper')


// this module needs to used after authorizedUserOnly
const authorizedAminOnly = function (req, res, next) {

    if (req.user && req.user.type === "admin") {
        next()
    }
    else {
        err(ERROR_CODE.USER.UNAUTHORIZED,
            "/users/list failed - Unauthorized",
            res, req)
    }
}

module.exports = authorizedAminOnly