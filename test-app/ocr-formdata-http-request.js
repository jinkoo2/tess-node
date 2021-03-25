const axios = require("axios");
const path = require("path");
const fs = require("fs");

// your application token. To get an application token, register at MYOCR.NET
// Note, you cannot use this example token yourself. 
const app_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImppbmtvbzJAZ21haWwuY29tIiwiYXBwX25hbWUiOiJNeSBBcHAgMiIsImlhdCI6MTYxNjE3NDE5N30.hrsu1QOLO5yLiYQ_F5LiLqvZVRKuR_y__S3AkGyos-I';

// api end point
const api_url = "http://localhost:3333/api/v1/ocr";

// image file path
const img_file = path.join(__dirname, "./phototest.tif");

// read input file
let img_base64;
try {
    var bitmap = fs.readFileSync(img_file);
    img_base64 = new Buffer(bitmap).toString("base64");
}
catch (error) {
    console.error('loading input file failed.', error)
    return;
}

var FormData = require('form-data');

let form = new FormData()
form.append('lang', 'eng')
form.append('img_ext', img_file.split('.').pop().toLocaleLowerCase().trim())
form.append('app_token', app_token)
form.append('output_json', 'true')
form.append('output_pdf', 'true')
form.append('img_data', fs.createReadStream(img_file))

console.log('sending a request')

var http = require('http');

let options = {
    method: 'post',
    host: 'localhost',
    port: '3333',
    path: '/api/v1/ocr',
    headers: form.getHeaders()
};
var request = http.request(options, res => {
    let data_str = ""
    res.on('data', d => {
        data_str += d;
        console.log('===data===')
    })

    res.on('end', () => {
        console.log('==== end ====')
        process_return_date(JSON.parse(data_str))
    })
});

request.on('error', (err) => {
    console.error('OCR error', err)
})

request.on('response', function (res) {
    console.log('=======response============')
    console.error(`response.statusCode=${res.statusCode}`)
    console.error(`response.statusMessage=${res.statusMessage}`)
});

form.pipe(request);

function process_return_date(data) {

    console.log('processing data...', data)
    const ocr_resutl = data.data;

    if (data && data.success) {

        console.log('OCR succeeded!')

        console.log('===== text ======')
        console.log(ocr_resutl.text)

        // make output directory
        const out_dir = path.join(__dirname, 'out')
        if (!fs.existsSync(out_dir)) {
            console.log('creating output directory')
            fs.mkdirSync(out_dir);
        }

        // save the json data
        try {
            fs.writeFileSync(path.join(out_dir, "out.json"), JSON.stringify(data))
        }
        catch (error) {
            console.error('Saving out.json failed', error)
        }

        if (ocr_resutl.pdf_base64) {
            console.log('saving pdf file')
            // create pdf object from base64 encoded string
            var pdf = new Buffer(ocr_resutl.pdf_base64, 'base64');

            // write buffer to file
            fs.writeFileSync(path.join(out_dir, "out.pdf"), pdf);
        }
    }
    else {
        console.error('OCR failed')
    }
}













