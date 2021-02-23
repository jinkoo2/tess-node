const {createLogger, transports, format} = require('winston')
const path = require('path')
require('winston-mongodb')

const DB_USER_ID = process.env.DB_USER_ID || "dbuser";
const DB_USER_PW = process.env.DB_USER_PW || "dbpw";
const DB_SERVER = process.env.DB_SERVER || "localhost";
const DB_NAME = process.env.DB_NAME || "mydb";
const DB_PORT = process.env.DB_PORT || 27017;

const MONGODB_LOGS_URL = `mongodb://${DB_USER_ID}:${DB_USER_PW}@${DB_SERVER}:${DB_PORT}/${DB_NAME}`

const logger = createLogger({
    transports:[
        new transports.Console({
            format: format.combine(format.timestamp(), format.json())
        }),
        new transports.MongoDB({
            db: MONGODB_LOGS_URL,
            collection:'logs',
            options:{ useUnifiedTopology: true },
            format: format.combine(format.timestamp(), format.json())
        })
    ],
    // // unhandled exception log
    // exceptionHandlers: [
    //     new transports.File({ 
    //         filename: path.join(__dirname, '../logs/exceptions.log')
    //     })
    //   ],
    // // unhandled promise rejection log
    // rejectionHandlers: [
    //     new transports.File({ 
    //         filename: path.join(__dirname, '../logs/rejections.log')
    //     })
    //   ]
})

logger.exitOnError = false;

module.exports = logger;
