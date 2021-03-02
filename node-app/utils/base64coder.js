const { __esModule } = require("uuid/dist/v1");

const util = require('util')
const fs = require('fs')
const fs_writeFile = util.promisify(fs.writeFile)

function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

// function to create file from base64 encoded string
function base64_decode(base64str, file) {

    // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
    var bitmap = new Buffer(base64str, 'base64');

    // write buffer to file
    return fs_writeFile(file, bitmap);
}

module.exports = {base64_encode, base64_decode}

