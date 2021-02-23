const fs = require('fs')
const { exec } = require("child_process");
const hocr2json = require("../utils/hocr2json");
const version = process.env.VERSION || 'v1'

function get_lang_list() {
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
                    const lists = stdout.trim().split('\n').slice(1)
                    resolve(lists)
                }
            }
        });
    })
}

function run_ocr({ img_file, lang }) {
    return new Promise((resolve, reject) => {

        const start = new Date();
        const out_str = img_file;

        // cmd
        const cmd = `tesseract ${img_file} ${out_str} -l ${lang} --psm 1 --oem 3 hocr txt pdf`;

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
            const hocr_file = img_file + ".hocr";
            if (fs.existsSync(hocr_file)) {
                const json = hocr2json(hocr_file);
                ocr.json = json;

                const txt_file = img_file + ".txt";
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


module.exports = { get_lang_list, run_ocr}