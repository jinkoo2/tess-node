'use strict';

const express = require('express');
const mongoose = require('mongoose');

const { log_info, log_error, log_obj } = require('./utils/helper')
const emailer = require('./providers/emailer');

// const morgan = require('morgan')
// const rfs = require('rotating-file-stream')
const path = require('path')
const { v4: uuidv4 } = require("uuid");

// // create a rotating write stream
// var accessLogStream = rfs.createStream('log', {
//   interval: '1d', // rotate daily
//   path: path.join(__dirname, 'access-log')
// })

// Constants
const PORT = 3333;
const HOST = '0.0.0.0';

const DB_USER_ID = process.env.DB_USER_ID || "dbuser";
const DB_USER_PW = process.env.DB_USER_PW || "dbpw";
const DB_SERVER = process.env.DB_SERVER || "localhost";
const DB_NAME = process.env.DB_NAME || "mydb";
const DB_PORT = process.env.DB_PORT || 27017;

const MONGODB_USERS_URL = `mongodb://${DB_USER_ID}:${DB_USER_PW}@${DB_SERVER}:${DB_PORT}/${DB_NAME}`
//log_info('MONGODB_USERS_URL=' + MONGODB_USERS_URL.replace(DB_USER_PW, 'xxx'))
log_obj({
  level: 'info',
  message: 'MONGODB_USERS_URL=' + MONGODB_USERS_URL.replace(DB_USER_PW, 'xxx'),
  metadata: { email: 'abc' }
})
// App
const app = express();


app.use((req, res, next) => {
  //
  // Dynamically setting Access-Control-Allow-Origin. This is basically allowing all incoming request
  // this can be used to limit the access.
  // By not setting * always is to allow the requesters to have the cridential in the request
  //
  if (req.headers.origin) {
    //console.log("setting req.headers.origin for cors");
    res.append("Access-Control-Allow-Origin", req.headers.origin);
  }

  res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH");
  res.append("Access-Control-Allow-Credentials", "true");
  res.append("Access-Control-Allow-Headers", "Content-Type,*");
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(preProcessReq)

// for parsing application/json
app.use(express.json())

// for parsing application/xwww-form-urlencoded
app.use(express.urlencoded({ extended: true }))

//app.use(cookieParser())
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
mongoose
  .connect(
    MONGODB_USERS_URL,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => log_info('MongoDB Connected'))
  .catch(err => {
    log_error('MongoDB connection failed', null, { error: err });
    // notify the admin
    emailer.notifyAdmins('MongoDB connection failed', JSON.stringify(err))
  });

app.use('/api/v1/ocr', require('./routes/v1/ocr'))
app.use('/api/v1/users', require('./routes/v1/user'))
app.use('/api/v1/apps', require('./routes/v1/app'))
app.use('/api/v1/admin', require('./routes/v1/admin'))
app.use('/api/v1/logs', require('./routes/v1/log'))

// // setup morgan logger
// app.use(morgan('combined', { stream: accessLogStream }))

app.listen(PORT, HOST);
log_info(`Running on http://${HOST}:${PORT}`);

function getReqIp(req) {
  // get the requester ip address
  var ip;
  if (req.headers['x-forwarded-for']) {
    ip = req.headers['x-forwarded-for'].split(",")[0];
  } else if (req.connection && req.connection.remoteAddress) {
    ip = req.connection.remoteAddress;
  } else {
    ip = req.ip;
  } //console.log("client IP is *********************" + ip);
  return ip;
}

function preProcessReq(req, res, next) {

  // assign uuid for all requests
  req.uuid = uuidv4();

  // get req ip
  req.user_ip = getReqIp(req);

  req.session = {
    session_id: req.uuid,
    user_ip: req.user_ip,
    url: req.url
  }

  next()
}

////////////////////
// start scheduler
var scheduler = require('./scheduler/scheduler');
scheduler.scheduleJobs()

// process.on('uncaughtException', (err) => {
//   console.error('There was an uncaught error', err)
//   process.exit(1) //mandatory (as per the Node docs)
// })


