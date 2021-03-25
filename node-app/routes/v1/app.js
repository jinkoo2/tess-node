const express = require("express");
const router = express.Router();
const authorizedUserOnly = require('../../security/authorizedUserOnly')

const ERROR_CODE = require('../../error_code')
const { err, scc } = require('../../utils/helper');

const fs = require('fs')
const path = require('path')

const jwt = require('jsonwebtoken');
const secret = fs.readFileSync(path.join(__dirname, '../../security/jwt.key'));

const emailer = require('../../providers/emailer')

const email_template_loader = require('../../providers/email_template_loader')
const new_app_template_loader = email_template_loader.get_loader("new_app")

const App = require('../../models/app');
const mongoose = require('mongoose');
const { Exception } = require("handlebars");

router.post("/register", authorizedUserOnly, (req, res, next) => {

    //////////////////////////////
    // input parameters
    // app_name
    // user_token --> authorizedUserOnly converts user_token to req.user object 

    // app_name
    const { app_name } = req.body;

    const user = req.user; // from user_token 

    // console.log('========= req.body ========')
    // console.log(req.body)

    // console.log('========= req.user ========')
    // console.log(req.user)

    //////////////////////////////////////////////////////
    // the user object should be valid (just double check)
    if (!user) {
        err(ERROR_CODE.APP.INVALID_TOKEN, "Invalid token", res, req)
        return;
    }

    //////////////
    // app name
    if (!app_name || app_name.length < 5 || app_name.length > 50) {
        err(ERROR_CODE.APP.INVALID_NAME, "Invalid app name - the length should be between 5 and 50", res, req)
        return;
    }

    ///////////////////////////////////////////////
    // check if the app name is already registered
    console.log('============== user.apps ==================')
    console.log(user.apps)
    console.log('============== user.apps ==================')

    const matched = user.apps.filter(app => app.name.trim().toLowerCase() === app_name.trim().toLowerCase())
    if (matched.length > 0) {
        err(ERROR_CODE.APP.ALREADY_EXISTS, "App already registered", res, req)
        return;
    }

    const email = user.email;

    // token
    const app_token = jwt.sign({ email, app_name }, secret);

    const app = new App({
        _id: new mongoose.Types.ObjectId(),
        name: app_name,
        user: user._id,
        token: app_token,
    })

    // save app
    app.save()
        .then(app_ret => {

            // console.log('======================')
            // console.log('app saved successfully')
            // console.log('app_ret', app_ret)

            // update user
            user.apps.push(app._id)
            user.save()
        })
        .then(user_ret => {
            // console.log('======================')
            // console.log('user updated successfully')
            // console.log('user_ret', user_ret)

            try {
                //email the token to the user
                emailer.send_template(email, new_app_template_loader, {
                    user_name: user.name,
                    app_name,
                    app_token
                })
            }
            catch (error) {
                throw new Exception("Email failed");
            }

            // log & response back to the user
            const data_to_user = { app_token }
            const data_to_logger = { app_name, email: user.email }
            scc("app registered successfully", res, req, data_to_user, data_to_logger, true)
        })
        .catch(error => {
            err(ERROR_CODE.APP.REGISTER_FAILED,
                `App registration failed - ${error.message}`,
                res, req, true, error)
            return;
        })


    // // add the app name to the user
    // user.apps.push({ app_name: app_name.trim() })
    // user.save()
    //     .then(user => {

    //         //email the token to the user
    //         emailer.send_template(email, new_app_template_loader, {
    //             user_name: user.name,
    //             app_name,
    //             app_token
    //         })

    //     })
    //     .catch(error => {
    //     });

})

router.post("/toggle_status", authorizedUserOnly, (req, res, next) => {

    //////////////////////////////
    // input parameters
    // app_name
    // user_token --> authorizedUserOnly converts user_token to req.user object 


    // app_name
    const { app_name } = req.body;

    const user = req.user; // from user_token 

    // console.log('========= req.body ========')
    // console.log(req.body)

    // console.log('========= req.user ========')
    // console.log(req.user)

    //////////////////////////////////////////////////////
    // the user object should be valid (just double check)
    if (!user) {
        err(ERROR_CODE.APP.INVALID_TOKEN, "Invalid user token", res, req)
        return;
    }

    //////////////
    // app name
    if (!app_name || app_name.length < 5 || app_name.length > 50) {
        err(ERROR_CODE.APP.INVALID_NAME, "Invalid app name - the length should be between 5 and 50", res, req)
        return;
    }

    ////////////////
    // find the app
    App.findOne({ name: app_name })
        .then(app => {
            if (app) {
                app.active = !app.active;
                return app.save();
            }
            else {
                // app not found
                err(ERROR_CODE.APP.DB_ERROR_APP_NOT_FOUND, "App not found in DB", res, req)
                return;
            }
        })
        .then(app_ret => {
            scc("app status changed successfully", res, req, {}, {}, false)
        })
        .catch(error => {
            err(ERROR_CODE.APP.ERROR, "Error - " + error.message, res, req)
            return;
        })
})

module.exports = router;
