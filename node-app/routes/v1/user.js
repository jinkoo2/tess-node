const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
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
  
  const session_id = uuidv4();
  const {name, email } = req.body;

  logger.info({message:'Regiser request', name, email, session_id })
  //////////////////////
  // validate inputs
  
  // name
  if(!name || name.length <2 || name.length> 100){
    logger.error({message:"Invalid name", name, email, session_id})
    res.send("Invalid name (Name must have 2-100 characters!");
    return;    
  }

  // email
  if(!is_validate_email(email)) {
    logger.error({message:"Invalid email", name, email, session_id})
    res.send("Invalid email!")
    return;
  }  

  // check if the email has been registered already
  User.findOne({email:email})
  .then(data=>{
      if(data){
        logger.error({message:"Email already registered", name, email, session_id})
        console.log(`email already registered - (${email})`)
        res.send('the given email has been registered already')
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

        logger.error({message:"Saving a new user", user, session_id})

        user.save()
        .then(data =>{
          console.log('save to db success', data);
          
          logger.info({message:"Saved a new user successfully", user: user.email, session_id})

          // send the token via email
          logger.info({message:"Sending the token to the user via email", user: user.email, session_id})
          emailer.send(email, "Your access token included", token)

          // send the token to the user via email.
          res.json({
            msg: `Your token has been sent to your email - ${email}`
          })
    
          // notify admin
          emailer.notifyAdmins("myocr - new user registered!", email)
        })
        .catch(err => {
          console.error('error adding a user case...', err);
          res.status(500)
          res.send('Could not create a user')
        });
      }
  })
  .catch(err => {
      logger.error({message:'User.findOne failed', err})
      emailer.notifyAdmins('User.findOne() failed', JSON.stringify({email, err}))
  });
  
})

router.post("/send_me_my_token", (req, res, next)=>{
  
  const session_id = uuidv4();
  const {email } = req.body;

  logger.info({message:'Token recovery request', email, session_id })

  //////////////////////
  // validate inputs
  // email
  if(!is_validate_email(email)) {
    logger.info({message:"Invalid email", email})
    res.send("Invalid email!")
    return;
  }  

  // check if the email has been registered already
  User.findOne({email:email})
  .then(user=>{
      if(user){ // a registered user found
        logger.info({message:'a registered user found in DB', user:user.email})
        
        // generate a token - this token should be the same as the one in DB
        const token = jwt.sign(email, secret);

        if(token !== user.token){
          // this should not happen. this differemt, log and notify the admin via email
          logger.info('User requested a token discovery, but the newly generate token is different from the one in DB. So, updating the DB with the new token');
          // update the token to DB
          user.token = token;
          user.save()
          .then(data =>{
            logger.info({message:'success - updated the token in DB', data});
          })
          .catch(err => {
            logger.error({message:'error - the generated token is different from the one in DB, but failed saving the token back to DB.', err});
            res.status(500)
            res.send('Failed trieving the token (db save failed). The issue has been reported to the dev team. Please try again later.')
          });
        }

        // send the token via email
        logger.info('sending a recovered token to '+email);
        emailer.send(email, "Your recovered access token included", token)
        res.send('Your token has been sent to to your email')

        emailer.notifyAdmins("A token recovery was successful", email)
        
        return;
      }
      else{ // no user found of the email address
        res.send({msg: 'Your account not found. Please register first.'})
      }
  })
  .catch(err => {
      console.log(err)
  });
  
})

module.exports = router;
