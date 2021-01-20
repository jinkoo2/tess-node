const axios = require("axios");
const path = require("path");

function base64_encode(file) {
  // read binary data
  var bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return new Buffer(bitmap).toString("base64");
}

// read the image
const fs = require("fs");
const file = "./phototest.tif";

const obj = {
  img_base64: base64_encode(file),
  filename: path.basename(file),
  lang: "eng",
};

const api_url = "http://localhost:9999/api/v1";

/////////////
// run ocr
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

/////////////////
// get lang list
axios
  .get(`${api_url}/lang_list`)
  .then(function (response) {
    console.log(response.data);
  })
  .catch(function (error) {
    console.log(error.message);
  });
