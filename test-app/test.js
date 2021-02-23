const axios = require("axios");
const path = require("path");
const fs = require("fs");

const api_url = "http://localhost:3334/api/v1";

function base64_encode(file) {
  // read binary data
  var bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return new Buffer(bitmap).toString("base64");
}

//register()
//recover_token()
run_ocr()
//get_lang_list()

/////////////////////
// register

function register(){

  const user = {
    name: 'Jinkoo Hotmail',
    email: 'jinkoo2@hotmail.com',
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


function recover_token(){

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

function get_lang_list(){
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
// run ocr
function run_ocr(){

  const img_file = path.join(__dirname, "./phototest.tif");
  const token_file = path.join(__dirname, "./token.json");
  const token_obj = require(token_file)

  const obj = {
    img_base64: base64_encode(img_file),
    filename: path.basename(img_file),
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


