const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

const logger = require('../../providers/logger')

const email_template_loader = require('../../providers/email_template_loader')
const new_user_template_loader = email_template_loader.get_loader("new_user")


const ERROR_CODE = require('../../error_code')

const User = require('../../models/user.js');
const jwt = require('jsonwebtoken');
const secret = fs.readFileSync(path.join(__dirname, '../../security/jwt.key'));

const emailer = require('../../providers/emailer')

const { err, scc, is_validate_email } = require('../../utils/helper');
const config = require('../../config');
const authorizedUserOnly = require("../../security/authorizedUserOnly");

router.post("/register", (req, res, next) => {

  const { name, email } = req.body;

  //logger.info('/register', { metadata: { name, email, session } })

  //////////////////////
  // validate inputs
  // name
  if (!name || name.length < 2 || name.length > 100) {
    err(ERROR_CODE.USER.INVALID_NAME,
      "/register failed - Invalid name (Name must have 2-100 characters!",
      res, req)
    return;
  }

  // email
  if (!is_validate_email(email)) {
    err(ERROR_CODE.USER.INVALID_EMAIL,
      "/regiser failed - Invalid email",
      res, req)
    return;
  }

  // check if the email has been registered already
  User.findOne({ email })
    .then(data => {
      if (data) {
        err(ERROR_CODE.USER.EMAIL_ALREADY_REGISTERED,
          "/regiser failed - Email already registered",
          res, req, false, null, { name, email })
        return;
      }
      else { // a new user

        // generate a token
        const token = jwt.sign(email, secret);

        // registger a new user
        const user = new User({
          name: name,
          email: email,
          token: token,
        })

        //logger.info("Saving a new user", { metadata: { name, email, session } })

        user.save()
          .then(user => {

            // send the token via email
            //emailer.send(email, "Your access token included", token)
            emailer.send_template(email, new_user_template_loader, {
              name,
              user_token: token,
              home_url: `${config.server}/my_home`
            })

            // send the token to the user via email.
            scc(`/register success - please check your email to get your access token.`, res, req, null, { name, email }, true)
          })
          .catch(error => {
            err(ERROR_CODE.USER.DB_ERROR_USER_CREATE_FAILED,
              "/regiser failed - Server error - Could not create a user in DB",
              res, req, true, error)
            return;
          });
      }
    })
    .catch(error => {

      console.log("=================2")
      console.log(ERROR_CODE)
      console.log("=================2")

      err(ERROR_CODE.USER.DB_ERROR_EXCEPTION,
        "/regiser failed - Server error - DB exception",
        res, req, true, error)
      return;
    });

})

// my info
router.post("/my_info", authorizedUserOnly, (req, res, next) => {
  const { name, email, apps } = req.user;
  const data_to_user = { name, email, apps };
  const data_to_logger = { name, email, apps };
  scc('/my_info success', res, req, data_to_user, data_to_logger, false)
})


router.post("/contact-us", (req, res, next) => {

  const { name, email, msg } = req.body;

  logger.info('/contact-us', { metadata: { ...req.body, session: req.session } })

  //////////////////////
  // validate inputs
  // name
  if (!name || name.length < 2 || name.length > 100) {
    err(ERROR_CODE.USER.INVALID_NAME,
      "/contact-us failed - Invalid name (Name must have 2-100 characters!",
      res, req)
    return;
  }

  // email
  if (!is_validate_email(email)) {
    err(ERROR_CODE.USER.INVALID_EMAIL,
      "/contact-us failed - Invalid email",
      res, req)
    return;
  }

  // msg
  if (!msg || msg.length < 2) {
    err(ERROR_CODE.USER.INVALID_CONTACTUS_MSG,
      "/contact-us failed - Message is too short!",
      res, req)
    return;
  }

  emailer.notifyAdmins("Incoming Contact Us Form", JSON.stringify(req.body))

  scc('/contact-us success', res, req, {}, {}, false)
})

module.exports = router;
