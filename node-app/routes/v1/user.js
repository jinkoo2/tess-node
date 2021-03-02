const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

const User = require('../../models/user.js');
const jwt = require('jsonwebtoken');
const secret = fs.readFileSync( path.join(__dirname, '../../security/jwt.key'));

const emailer = require('../../providers/emailer')
const logger = require('../../providers/logger')

function is_validate_email(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

router.post("/register", (req, res, next)=>{
    
  const {name, email } = req.body;
  const session_id = req.uuid;
  const session = {session_id, user_ip: req.userIp, email}

  logger.info('/register', {metadata:{name, email, session}})

  //////////////////////
  // validate inputs
  
  // name
  if(!name || name.length <2 || name.length> 100){
    logger.error("Invalid name", {metadata:{name, session}})
    res.send("Invalid name (Name must have 2-100 characters!");
    return;    
  }

  // email
  if(!is_validate_email(email)) {
    logger.error("Invalid email", {metadata:{email, session}})
    res.send("Invalid email!")
    return;
  }  

  // check if the email has been registered already
  User.findOne({email})
  .then(data=>{
      if(data){
        res.send('the given email has been registered already')
        logger.error("Email already registered", {metadata:{email, session}})
        emailer.notifyAdmins('an existing user attempted to register again', email)
        return;
      }
      else{ // a new user

        // generate a token
        const token = jwt.sign(email, secret);

        // registger a new user
        const user = new User({
          name: name,
          email: email,
          token: token,
        })

        logger.info("Saving a new user", {metadata:{user, session}})

        user.save()
        .then(user =>{
          
          // send the token via email
          emailer.send(email, "Your access token included", token)

          // send the token to the user via email.
          res.json({
            msg: `Your token has been sent to your email - ${email}`
          })

          // log & notify
          logger.info("A new user registered", {metadata:{ session, token}})

          // notify admin
          emailer.notifyAdmins("myocr - new user registered and a email sent to the user!", JSON.stringify({email, token}))
        })
        .catch(error => {
          res.status(500)
          res.send('Could not create a user in DB')
              logger.error('error adding a user in DB...', {metadata:{error, session}});
        });
      }
  })
  .catch(error => {
      logger.error('User.findOne failed', {metadata: {error, session}})
      emailer.notifyAdmins('User.findOne() failed', JSON.stringify({email, err}))
  });

})

router.post("/send_me_my_token", (req, res, next)=>{
  
  const {email } = req.body;
  const session_id = req.uuid;
  const session = {session_id, user_ip: req.userIp, email}

  logger.info('/send_me_my_token', {metadata:{ email, session_id }})

  //////////////////////
  // validate inputs
  // email
  if(!is_validate_email(email)) {
    logger.info("Invalid email", {metadata:{email, session}})
    res.status(500)
    res.send(`Invalid email! email=${email}, session_id=${session_id}`)
    return;
  }  

  // check if the email has been registered already
  User.findOne({email})
  .then(user=>{
      if(user){ // a registered user found
        logger.info('A registered user found in DB', {metadata:{email, session}})
        
        // generate a token - this token should be the same as the one in DB
        const token = jwt.sign(email, secret);

        if(token !== user.token){
          // this should not happen. this differemt, log and notify the admin via email
          logger.warn('User requested a token discovery, but the newly generate token is different from the one in DB. So, updating the DB with the new token', {metadata:{session}});
          // update the token to DB
          user.token = token;
          user.save()
          .then(data =>{
            logger.info('Success - updated the token in DB', {metadata:{email, token, data, session}});
          })
          .catch(error => {
            res.status(500)
            res.send('Failed trieving the token (db save failed). The issue has been reported to the dev team. Please try again later.')
            logger.error('error - the generated token is different from the one in DB and failed saving the token back to DB.', {metadata: {error, session}});
          });
        }

        // send the token via email
        logger.info('sending a recovered token', {metadata:{session}});
        emailer.send(email, "Your recovered access token included", token)
        res.send('Your token has been sent to to your email')
        emailer.notifyAdmins("A token recovery was successful", JSON.stringify({email, session}))
      }
      else{ // no user found of the email address
        res.send({msg: 'Your account not found. Please register first.'})
      }
  })
  .catch(error => {
    res.status(500) 
    res.send(`Server error - DB query failed. email=${email}, session_id=${session_id}`)
    logger.error("DB query failed",{metadata: {error, session}})
    emailer.notifyAdmins("DB query failed", JSON.stringify({email, session, error}))
  });
  
})

module.exports = router;
