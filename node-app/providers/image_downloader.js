const fs = require('fs');
const axios = require('axios');

const url = 'https://jeroen.github.io/images/testocr.png'

function download(url, image_path) {
    
    console.log('DOWNLOAD')
    console.log(url)
    console.log(image_path)
    
    return axios({
        url,
        responseType: 'stream',
    }).then(
        res => {
            return new Promise((resolve, reject) => {
                res.data
                    .pipe(fs.createWriteStream(image_path))
                    .on('finish', () => resolve())
                    .on('error', e => reject(e));
            })// Promise      
        })
}

module.exports = {download}


