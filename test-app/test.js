const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { REPL_MODE_STRICT } = require("repl");

function print_usage() {
  console.log('usage:')
  console.log('  test register - to register an account')
  console.log('  test recover-token - to recover my token')
  console.log('  test ocr-file - to run a test ocr with an input file')
  console.log('  test ocr-url - to run a test oc with an input urlr')
  console.log('  test ocr-base64 - to run a test ocr via encoding image as base64 string')
  console.log('  test lang-list - to get the list of languages supported')
}

const args = process.argv.slice(2);
if (!args || args.length == 0) {
  print_usage()
  return;
}

console.log('args: ', args);

const api_url = "http://localhost:3334/api/v1";

function base64_encode(file) {
  // read binary data
  var bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return new Buffer(bitmap).toString("base64");
}

if (args[0] == 'register')
  register()
else if (args[0] == 'recover-token')
  recover_token()
else if (args[0] == 'ocr-file')
  run_ocr_file()
else if (args[0] == 'ocr-url')
  run_ocr_url()
else if (args[0] == 'ocr-base64')
  run_ocr_base64()
else if (args[0] == 'lang-list')
  get_lang_list()
else {
  print_usage()
  return;
}

/////////////////////
// register

function register() {

  const user = {
    name: 'Jinkoo Gmail',
    email: 'jinkoo2@gmail.com',
  };

  console.log('Register request')
  console.log(user)

  axios
    .post(`${api_url}/users/register`, user)
    .then(function (response) {

      const obj = response.data;
      console.log(obj)
    })
    .catch(function (error) {
      console.log(error.message);
    });
}


function recover_token() {

  const user = {
    name: 'Jinkoo Gmail',
    email: 'jinkoo2@gmail.com',
  };

  console.log('Request token recovery')
  console.log(user)

  axios
    .post(`${api_url}/users/send_me_my_token`, user)
    .then(function (response) {

      const obj = response.data;
      console.log(obj)
    })
    .catch(function (error) {
      console.log(error.message);
    });
}

function get_lang_list() {
  const token_file = path.join(__dirname, "./token.json");
  const token_obj = require(token_file)

  /////////////////
  // get lang list
  axios
    .get(`${api_url}/ocr/lang_list?token=${token_obj.token}`)
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (error) {
      console.log(error.message);
    });
}

/////////////
// run ocr-file
function run_ocr_file() {

  const img_file = path.join(__dirname, "./phototest.tif");
  const token_file = path.join(__dirname, "./token.json");
  const token_obj = require(token_file)

  const obj = {
    img_base64: base64_encode(img_file),
    img_ext: 'tif',
    lang: "eng",
    token: token_obj.token
  };

  console.log('OCR request:')
  //console.log(obj)

  axios
    .post(`${api_url}/ocr`, obj)
    .then(function (response) {
      console.log(response.data);
      if (!fs.existsSync("./out")) fs.mkdirSync("./out");
      fs.writeFileSync("./out/out.json", JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error.message);
    });
}

function run_ocr_base64() {

  const img_file = path.join(__dirname, "./phototest.tif");
  const token_file = path.join(__dirname, "./token.json");
  const token_obj = require(token_file)

  const obj = {
    img_base64: base64_encode(img_file),
    img_ext: 'tif',
    lang: "eng",
    token: token_obj.token
  };

  console.log('OCR request base64:')
  //console.log(obj)

  axios
    .post(`${api_url}/ocr`, obj)
    .then(function (res) {
      if (res.data.success) {
        console.log(res.data);
        if (!fs.existsSync("./out")) fs.mkdirSync("./out");
        fs.writeFileSync("./out/out.json", JSON.stringify(res.data));
      }
      else{
        console.log('FAILED')
      }
    })
    .catch(function (error) {
      console.log(error);
    });
}

function run_ocr_url() {

  const img_url = 'https://jeroen.github.io/images/testocr.png'
  const token_file = path.join(__dirname, "./token.json");
  const token_obj = require(token_file)

  const obj = {
    img_url,
    img_ext: 'png',
    lang: "eng",
    token: token_obj.token
  };

  console.log('OCR request:')
  //console.log(obj)

  axios
    .post(`${api_url}/ocr`, obj)
    .then(function (res) {
      console.log('SUCCESS')
      console.log(res.data);
      if (res.data.success) {
        if (!fs.existsSync("./out")) fs.mkdirSync("./out");
        fs.writeFileSync("./out/out.json", JSON.stringify(res.data));
      }
    })
    .catch(function (error) {
      console.log('ERROR')
      console.log(error);
    });


}



