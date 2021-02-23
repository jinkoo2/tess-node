'use strict';

const express = require('express');
const mongoose = require('mongoose');
const logger = require('./providers/logger')
// const morgan = require('morgan')
// const rfs = require('rotating-file-stream')
// const path = require('path')
const { v4: uuidv4 } = require("uuid");

// // create a rotating write stream
// var accessLogStream = rfs.createStream('log', {
//   interval: '1d', // rotate daily
//   path: path.join(__dirname, 'access-log')
// })

// Constants
const PORT = 3334;
const HOST = '0.0.0.0';

const DB_USER_ID = process.env.DB_USER_ID || "dbuser";
const DB_USER_PW = process.env.DB_USER_PW || "dbpw";
const DB_SERVER = process.env.DB_SERVER || "localhost";
const DB_NAME = process.env.DB_NAME || "mydb";
const DB_PORT = process.env.DB_PORT || 27017;

const MONGODB_USERS_URL = `mongodb://${DB_USER_ID}:${DB_USER_PW}@${DB_SERVER}:${DB_PORT}/${DB_NAME}`
logger.info('MONGODB_USERS_URL='+MONGODB_USERS_URL.replace(DB_USER_PW, 'xxx'))

// App
const app = express();

app.use(assignId) // assign session uuid
app.use(express.json())
app.use(express.urlencoded({extended:false}))
//app.use(cookieParser())

// Connect to MongoDB
mongoose
  .connect(
    MONGODB_USERS_URL,
    { useNewUrlParser: true,  useUnifiedTopology: true }
  )
  .then(() => logger.info('MongoDB Connected'))
  .catch(err => logger.error(err));

app.use('/api/v1/ocr', require('./routes/v1/ocr'))
app.use('/api/v1/users', require('./routes/v1/user'))

app.get('/', (req, res) => {
  res.send('Hello World');
});

// // setup morgan logger
// app.use(morgan('combined', { stream: accessLogStream }))

app.listen(PORT, HOST);
logger.info(`Running on http://${HOST}:${PORT}`);

// assign uuid for all requests
function assignId (req, res, next) {
  req.uuid = uuidv4();
  next()
}