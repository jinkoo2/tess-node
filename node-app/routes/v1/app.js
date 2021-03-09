const express = require("express");
const router = express.Router();
const authorizedOnly = require('../../security/authorizedUserOnly')


const ERROR_CODE = require('../../error_code')
const { err, scc } = require('../../utils/helper');

const fs = require('fs')
const path = require('path')

const jwt = require('jsonwebtoken');
const secret = fs.readFileSync(path.join(__dirname, '../../security/jwt.key'));

const emailer = require('../../providers/emailer')
const logger = require('../../providers/logger')

const email_template_loader = require('../../providers/email_template_loader')
const new_app_template_loader = email_template_loader.get_loader("new_app")

router.post("/register", authorizedOnly, (req, res, next) => {
    
    const { app_name } = req.body;
    const session_id = req.uuid;
    const user = req.user;
    const session = { session_id, user_ip: req.userIp, user }

    console.log(req.body)
    console.log(req.user)

    ////////////////////////////////////
    // check if user is valid
    // it should not reach this point, if the user variable is not set by authorizedOnly middleware
    // but check it just in case
    if (!user) {
        err(ERROR_CODE.APP.INVALID_TOKEN, "Invalid token", session, res, req)
        return;
    }

    //////////////
    // app name
    if (!app_name || app_name.length < 5 || app_name.length > 50) {
        err(ERROR_CODE.APP.INVALID_NAME, "Invalid app name - the length should be between 5 and 50", session, res, req)
        return;
    }

    ///////////////////////////////////////////////
    // check if the app name is already registered
    const matched = user.apps.filter(app => app.app_name.trim().toLowerCase() === app_name.trim().toLowerCase())
    if (matched.length > 0) {
        err(ERROR_CODE.APP.ALREADY_EXISTS, "App already registered", session, res, req)
        return;
    }

    const email = user.email;

    // add the app name to the user
    user.apps.push({ app_name: app_name.trim() })
    user.save()
        .then(user => {

            // token
            const app_token = jwt.sign({ email, app_name }, secret);

            //email the token to the user
            emailer.send_template(email, new_app_template_loader, {
                user_name: user.name,
                app_name,
                app_token
            })

            // THIS SHOULD BE DONE WHEN THE EMAIL SENT SUCCESSFULLY!
            // log & response back to the user
            const data_to_user = { app_token }
            const data_to_logger = { app_name, user }
            scc("app registered successfully", session, res, req, data_to_user, data_to_logger, true)
        })
        .catch(error => {
            err(ERROR_CODE.APP.DB_ERROR_USER_SAVE_FAILED,
                "app registration failed - Server error - Could not save the token to DB",
                session, res, req, true, error)
            return;
        });

})

module.exports = router;
