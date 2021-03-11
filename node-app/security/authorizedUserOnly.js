const jwt = require('jsonwebtoken');
const fs = require('fs')
const path = require('path');
const secret = fs.readFileSync(path.join(__dirname, 'jwt.key'));
const User = require('../models/user');
const ERROR_CODE = require('../error_code')
const { err } = require('../utils/helper')


const authorizedUserOnly = function (req, res, next) {
  //const token = req.cookies.token;

  //   console.log('authorizedOnly: req.cookies', req.cookies);
  //   console.log('authorizedOnly: req.body.token', req.body.token);
  //   console.log('req.headers.orgin', req.headers.orgin)
  //console.log('req.body=>', req.body)
  //   console.log('req.query=>', req.query)

  // if service user type='service'

  const token =
    req.body.user_token ||
    req.query.user_token ||
    //req.headers['x-access-token'] ||
    req.cookies.user_token;

  const session_id = req.uuid;
  const session = {
    session_id,
    token,
  }

  if (!token) {
    //console.log('no token!')
    //res.status(401).send('Unauthorized: No token provided');
    err(ERROR_CODE.USER_AUTH.NO_TOKEN, "missing user_token parameter", session, res, req)
  }
  else {
    jwt.verify(token, secret, function (error, decoded) {
      if (error) {
        //res.status(401).send('Unauthorized: Invalid token');
        err(ERROR_CODE.USER_AUTH.UNAUTHORIZED_TOKEN, "the user of the given app_token is not authorized", session, res, req, false, error)
      }
      else { // valid token

        // if the token is app token decoded ==> {email, app_name}
        const email = decoded;

        // get the user from db 
        User.findOne({ email: email })
          .populate({ path: 'apps' })
          .then(user => {
            if (user) {
              // console.log('User found in DB')
              // console.log(user.email)

              if (!user.active) { // user not active
                //console.log('authorizedOnly - user is not active')
                //res.status(401).send('Unauthorized: User not actived');
                err(ERROR_CODE.USER_AUTH.USER_DISABLED, "User disabled", session, res, req)
              }
              else {
                //  user and app_name to 
                req.user = user; // set user
                next()
              }
            }
            else {
              // user not found in DB
              //res.status(401).send('Unauthorized: User not found');
              err(ERROR_CODE.USER_AUTH.USER_NOT_FOUND, "User not found. Please check if your user_token is correct", session, res, req)
            }
          })
          .catch(error => {
            err(ERROR_CODE.USER_AUTH.DB_ERROR, "User authentication failed", session, res, req, true, error)
          })
      }
    }); // jwt.verify
  }
}

module.exports = authorizedUserOnly;