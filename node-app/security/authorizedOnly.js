const jwt = require('jsonwebtoken');
const fs = require('fs')
const path = require('path');
const secret = fs.readFileSync( path.join(__dirname, 'jwt.key'));
const User = require('../models/user.js');

//const secret = 'shhh'

const authorizedOnly = function(req, res, next) {
  //const token = req.cookies.token;
  
//   console.log('authorizedOnly: req.cookies', req.cookies);
//   console.log('authorizedOnly: req.body.token', req.body.token);
//   console.log('req.headers.orgin', req.headers.orgin)
//   console.log('req.body=>', req.body)
//   console.log('req.query=>', req.query)

  // if service user type='service'
  const type = req.body.type || req.query.token;
  
  const token = 
  req.body.token ||
  req.query.token ||
  req.headers['x-access-token'] ||
  req.cookies.token;

  if (!token) {
    console.log('no token!')
    res.status(401).send('Unauthorized: No token provided');
  } 
  else {
    jwt.verify(token, secret, function(err, decoded) {
      if (err) {
        console.log('authorizedOnly - Unauthorized: Invalid token')
        res.status(401).send('Unauthorized: Invalid token');
      } 
      else { // valid token
        
        const email = decoded; // email from token

        // get the user from db 
        User.findOne({email:email})
        .then(user=>{
            if(user){
                console.log('User found in DB')
                console.log(user)
                
                if(!user.active) { // user not active
                    console.log('authorizedOnly - user is not active')
                    res.status(401).send('Unauthorized: User deactived');
                }
                else{
                    req.user = user; // save the user to req
                    next()
                }
            }
            else{
                // user not found in DB
                console.log('authorizedOnly - token is valid, but the user is not found in DB')
                res.status(401).send('Unauthorized: User not found');
            }
        })
        .catch(err=>{
            console.err(err)
        })
        

      }
    }); // jwt.verify
  }
}

module.exports = authorizedOnly;