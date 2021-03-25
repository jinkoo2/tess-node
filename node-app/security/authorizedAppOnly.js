const jwt = require('jsonwebtoken');
const fs = require('fs')
const path = require('path');
const secret = fs.readFileSync(path.join(__dirname, 'jwt.key'));
const App = require('../models/app');
const ERROR_CODE = require('../error_code')
const { err } = require('../utils/helper')

const authorizedAppOnly = function (req, res, next) {
    //const token = req.cookies.token;

    // console.log('authorizedAppOnly: req.cookies', req.cookies);
    // console.log('authorizedAppOnly: req.body.token', req.body.app_token);
    // console.log('req.headers.orgin', req.headers.orgin)
    // console.log('req.body=>', req.body)
    // console.log('req.query=>', req.query)

    // if service user type='service'

    const token =
        req.body.app_token ||
        req.query.app_token;
    //req.headers['x-access-token'] ||
    //req.cookies.app_token;

    if (!token) {
        console.log('no token!')
        //res.status(401);
        err(ERROR_CODE.APP_AUTH.NO_TOKEN, "missing app_token parameter", res, req)
        return;
    }
    else {
        jwt.verify(token, secret, function (error, decoded) {
            if (error) {
                //res.status(401);
                err(ERROR_CODE.APP_AUTH.UNAUTHORIZED_TOKEN, "the app of the given app_token is not authorized", res, req, false, error)
            }
            else { // valid token

                // if the token is app token decoded ==> {email, app_name}
                const { email, app_name } = decoded;

                req.session.email = email;
                req.session.app_name = app_name;

                // get the app from db 
                App.findOne({ token: token, name: app_name })
                    .populate('user')
                    .then(app => {
                        if (app) {

                            if (!app.active) { // user not active
                                //res.status(401);
                                err(ERROR_CODE.APP_AUTH.APP_DISABLED, "App disabled", res, req)
                            }
                            else {
                                req.app = app; // set app
                                next()
                            }
                        }
                        else {
                            // user not found in DB
                            //console.log(`authorizedAppOnly - App of the given token is not found - app_token=${token}`)
                            //res.status(401).send('Unauthorized: Invalid token');
                            err(ERROR_CODE.APP_AUTH.APP_NOT_FOUND, "App not found. Please check if your app_token is correct", res, req)
                        }
                    })
                    .catch(error => {
                        err(ERROR_CODE.APP_AUTH.DB_ERROR, "App authentication failed", res, req, true, error)
                    })
            }
        }); // jwt.verify
    }
}

module.exports = authorizedAppOnly;