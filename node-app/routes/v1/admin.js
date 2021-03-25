const express = require("express");
const router = express.Router();
const ERROR_CODE = require('../../error_code')

const User = require('../../models/user.js');

const { err, scc, is_validate_email } = require('../../utils/helper');
const authorizedUserOnly = require("../../security/authorizedUserOnly");
const authorizedAdminOnly = require("../../security/authorizedAdminOnly");

// user list
router.post("/users",
    authorizedUserOnly,
    authorizedAdminOnly,
    (req, res, next) => {

        //////////////////////
        // validate inputs
        User.find()
            .populate('apps')
            .then(users => {
                console.log('users', users)
                res.send(users)
            })
            .catch(error => {
                console.log('error', error)
            })
    })

// token user status
router.post("/toggle_user_status", authorizedUserOnly, authorizedAdminOnly, (req, res, next) => {

    //////////////////////////////
    // input parameters
    // user_email
    // user_token --> authorizedUserOnly converts user_token to req.user object 

    // user_email
    const { user_email } = req.body;

    const user = req.user; // the requesting user

    //////////////////////////////////////////////////////
    // the user object should be valid (just double check)
    if (!user) {
        err(ERROR_CODE.ADMIN.INVALID_TOKEN, "Invalid user token", res, req)
        return;
    }

    /////////////
    // user email
    // email
    if (!is_validate_email(user_email)) {
        err(ERROR_CODE.ADMIN.INVALID_EMAIL,
            "/toggle_user_status failed - Invalid email",
            res, req)
        return;
    }
    ////////////////
    // find the app
    User.findOne({ email: user_email })
        .then(user => {
            if (user) {
                user.active = !user.active;
                return user.save();
            }
            else {
                // app not found
                err(ERROR_CODE.ADMIN.DB_ERROR_USER_NOT_FOUND,
                    "User not found in DB", res, req)
                return;
            }
        })
        .then(user_ret => {
            scc("user status changed successfully", session, res, req, {}, {}, false)
        })
        .catch(error => {
            err(ERROR_CODE.ADMIN.ERROR_TOGGLE_USER_STATUS,
                "Error - " + error.message, res, req)
            return;
        })
})


module.exports = router;
