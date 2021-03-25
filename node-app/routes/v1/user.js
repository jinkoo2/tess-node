const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

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
  const session_id = req.uuid;
  const session = { session_id, user_ip: req.user_ip, url: req.url, email }

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

// router.post("/send_me_my_token", (req, res, next) => {

//   const { email } = req.body;
//   const session_id = req.uuid;
//   const session = { session_id, user_ip: req.userIp, email }

//   //logger.info('/send_me_my_token', { metadata: { email, session_id } })

//   //////////////////////
//   // validate inputs
//   // email
//   if (!is_validate_email(email)) {
//     logger.info("Invalid email", { metadata: { email, session } })
//     res.send(`Invalid email! email=${email}, session_id=${session_id}`)
//     return;
//   }

//   // check if the email has been registered already
//   User.findOne({ email })
//     .then(user => {
//       if (user) { // a registered user found
//         logger.info('A registered user found in DB', { metadata: { email, session } })

//         // generate a token - this token should be the same as the one in DB
//         const token = jwt.sign(email, secret);

//         if (token !== user.token) {
//           // this should not happen. this differemt, log and notify the admin via email
//           logger.warn('User requested a token discovery, but the newly generate token is different from the one in DB. So, updating the DB with the new token.', { metadata: { session } });

//           // update the token to DB
//           user.token = token;
//           user.save()
//             .then(data => {
//               logger.info('Success - updated the token in DB', { metadata: { email, token, data, session } });
//             })
//             .catch(error => {
//               err(ERROR_CODE.USER.DB_ERROR_EXCEPTION,
//                 "/send_me_my_token failed - Server error - DB exception - failed saving to DB",
//                 session, res, req, true, error)
//               return;
//             });
//         }

//         // send the token via email
//         logger.info('sending a recovered token', { metadata: { session } });
//         emailer.send(email, "Your recovered access token included", token)
//         res.send({ msg: 'Your token has been sent to to your email', success: true, session_id, email })
//         emailer.notifyAdmins("A token recovery was successful", JSON.stringify({ email, session }))
//       }
//       else { // no user found of the email address
//         res.send({ msg: 'Your account not found. Please register first.', success: false, session_id, email })
//       }
//     })
//     .catch(error => {
//       err(ERROR_CODE.USER.DB_ERROR_EXCEPTION,
//         "/regiser failed - Server error - DB exception",
//         session, res, req, true, error)
//       return;
//     });
// })

// my info
router.post("/my_info", authorizedUserOnly, (req, res, next) => {

  const { name, email, apps } = req.user;
  const session = { session_id: req.uuid, user_ip: req.userIp, email: email }


  const data_to_user = { name, email, apps };
  const data_to_logger = { name, email, apps };
  scc('/my_info success', res, req, data_to_user, data_to_logger, false)

})

// // user list
// router.post("/list",
//   authorizedUserOnly,
//   authorizedAdminOnly,
//   (req, res, next) => {

//     const session_id = req.uuid;
//     const session = { session_id, user_ip: req.userIp }
//     const { name, email, apps, type } = req.user;

//     //////////////////////
//     // validate inputs
//     User.find()
//       .populate('apps')
//       .then(users => {
//         console.log('users', users)
//       })
//       .catch(error => {
//         console.log('error', error)
//       })
//   })


module.exports = router;
