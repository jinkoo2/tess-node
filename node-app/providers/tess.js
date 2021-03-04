const fs = require('fs')
const { exec } = require("child_process");
const hocr2json = require("../utils/hocr2json");

const version = process.env.VERSION || 'v1'

let lang_list = null;

init()

function init() {

    ////////////////////
    // set lang list to the global variale
    get_lang_list_tess() // get lang_list by running tess command
        .then(list => {

            // get global variable 
            lang_list = list;

            console.log('======== lang_list =========================')
            console.log(lang_list)
            console.log('============================================')
        })
        .catch(error => {
            console.error('Failed getting lang_list from get_lang_list_tess()')
            console.error(error)
        })
}

function get_lang_list() {
    return new Promise((resolve, reject) => {
        if (lang_list.length > 0) {
            resolve(lang_list)
        }
        else {
            reject("Invalid lang list array. Internal server error")
        }
    })
}

const tess_lang_list = require('./tess_lang_list')

function get_lang_list_tess() {
    return new Promise((resolve, reject) => {
        const cmd = `tesseract --list-langs`;
        console.log(cmd)
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject({ msg: "lang_list returned error", error });
            } else {

                if (stderr) {
                    reject({ msg: "lang_list returned stderr", error: stderr });
                } else {
                    // supported lang code list
                    const code_list = stdout.trim().split('\n').slice(1)

                    // convert to name
                    const new_list = code_list.map(code => {

                        // find the lang of the given code 
                        const matches = tess_lang_list.filter(item => item.code === code)

                        // there should be only one matching item.
                        if (matches.length === 1)
                            return matches[0]
                        else if (matches.length > 1) {
                            console.error("=============================================================================================")
                            console.error(`More then one item found in the tess_lang_list.js for the code:${code}. Please check it out!`)
                            console.error("=============================================================================================")
                            return matches[0]
                        }
                        else {
                            console.error("=============================================================================================")
                            console.error(`No item found in the tess_lang_list.js for the code:${code}. Please check it out!`)
                            console.error("=============================================================================================")
                            return { code, label: "Unknown" };
                        }
                    })

                    resolve(new_list)
                }
            }
        });
    })
}




// OCR Engine modes: (see https://github.com/tesseract-ocr/tesseract/wiki#linux)
//   0    Legacy engine only.
//   1    Neural nets LSTM engine only.
//   2    Legacy + LSTM engines.
//   3    Default, based on what is available.

// Page segmentation modes:
//   0    Orientation and script detection (OSD) only.
//   1    Automatic page segmentation with OSD.
//   2    Automatic page segmentation, but no OSD, or OCR.
//   3    Fully automatic page segmentation, but no OSD. (Default)
//   4    Assume a single column of text of variable sizes.
//   5    Assume a single uniform block of vertically aligned text.
//   6    Assume a single uniform block of text.
//   7    Treat the image as a single text line.
//   8    Treat the image as a single word.
//   9    Treat the image as a single word in a circle.
//  10    Treat the image as a single character.
//  11    Sparse text. Find as much text as possible in no particular order.
//  12    Sparse text with OSD.
//  13    Raw line. Treat the image as a single text line,
//        bypassing hacks that are Tesseract-specific.



function run_ocr({ img_file_path, lang, oem, psm }) {
    return new Promise((resolve, reject) => {

        const start = new Date();
        const out_str = img_file_path;


        // cmd
        const cmd = `tesseract ${img_file_path} ${out_str} -l ${lang} --oem ${oem} --psm ${psm} hocr txt pdf`;

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject({ msg: "tesseract command failed", cmd, error })
                return;
            }

            // if (stderr) {
            //     reject({ msg: "tesseract stderr object is not empty", cmd, error: stderr })
            //     return;
            // }

            let ocr = {
                version: version,
                lang: lang
            };

            // parse the output and send the data back
            const hocr_file = img_file_path + ".hocr";
            if (fs.existsSync(hocr_file)) {
                const json = hocr2json(hocr_file);
                ocr.json = json;

                const txt_file = img_file_path + ".txt";
                if (fs.existsSync(txt_file)) {
                    const txt = fs.readFileSync(txt_file).toString();
                    ocr.text = txt;

                    // exec_ms
                    const end = new Date();
                    ocr.exec_ms = (end.getTime() - start.getTime());

                    // return
                    resolve(ocr);
                } else {
                    reject({ msg: 'result hocr file not found', cmd })
                }
            } else {
                reject({ msg: 'result txt file not found', cmd })
            }
        });
    })
}


module.exports = { get_lang_list, run_ocr }