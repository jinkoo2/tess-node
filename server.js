'use strict';

const express = require('express');
//const tesseract = require("node-tesseract-ocr")
//const cookieParser = require('cookie-parser')
const {exec} = require('child_process')


const v1Rounter = require('./routes/v1')

// Constants
const PORT = 3333;
const HOST = '0.0.0.0';

// App
const app = express();

app.use(express.json())
app.use(express.urlencoded({extended:false}))
//app.use(cookieParser())

app.use('/api/v1', v1Rounter)

app.get('/', (req, res) => {

  res.send('Hello World');
});


//require('./utils/hocr2json')('./data/img-0fba5d31-dd54-41d9-87ce-d3421dba7a53.tif.hocr')


app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);