const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { base64_decode } = require("../..//utils/base64coder");
const User = require('../../models/user.js');
const authorizedOnly = require('../../security/authorizedOnly')
const logger = require('../../providers/logger')
const tess = require('../../providers/tess')
const image_downloader = require('../../providers/image_downloader')


const util = require('util')
const fs_rename = util.promisify(fs.rename)

const version = process.env.VERSION || 'v1'


/////////////////////////////
// make temporary data dir
const out_dir = "./data";
if (!fs.existsSync(out_dir)) {
  logger.info('making data directory: ' + out_dir)
  fs.mkdirSync(out_dir);
}

router.get("/", (req, res, next) => {
  res.send(`Hello OCR ${version}!!!`);
});

// GET lang list
router.get("/lang_list", authorizedOnly, (req, res, next) => {

  //////////
  // inputs
  const user = req.user;
  const session_id = req.uuid;
  const session = { session_id, user_ip: req.userIp, email: user.email }

  logger.info("get orc/lang_list", { metadata: { session } })

  /////////////////
  // start timer
  const start = new Date();

  /////////////////////
  // run tess command
  tess.get_lang_list()
    .then(list => {

      res.send(list);

      // log
      const end = new Date();
      const ms = end.getTime() - start.getTime();
      logger.info("lang_list exec time", { metadata: { session, list, exec_ms: ms } });
    })
    .catch(error => {
      console.error('catch error')
      res.status(500);
      res.send({
        session_id: session_id,
        message: "Error - " + error.msg,
      })

      // log
      logger.error(error.msg, { metadata: { session, error } })
    }) // catch

}); // get()

function save_to_file({ img_url, img_base64, img_form_data_path, img_file_path }) {
  if (img_url)
    return image_downloader.download(img_url, img_file_path)
  else if (img_base64)
    return base64_decode(img_base64, img_file_path)
  else // img_data
    return fs_rename(img_form_data_path, img_file_path)
}

var multer = require('multer')
var upload = multer({ dest: 'data/' })

// run ocr
router.post("/", upload.single('img_data'), authorizedOnly, (req, res, next) => {

  // inputs
  const user = req.user;
  const session_id = req.uuid;
  const session = { session_id, user_ip: req.userIp, email: user.email }
  const inputs = req.body;
  const { img_base64, img_url, img_ext, lang } = inputs

  // default oem & psm values
  const oem = inputs.oem || 3;
  const psm = inputs.psm || 1;

  logger.info("/ocr", { metadata: { session, img_ext, lang, oem, psm } })

  // check if the lang is supported
  if (!lang || lang.length != 3) {
    logger.error("Parameter 'lang' is not valid. The langth should be 3.", { metadata: { session } })
    const error_code = 5;
    res.send({
      session_id: session_id,
      success: false,
      error_code,
      message: "OCR failed - lang parameter not provided or the length is not 3",
    });
    return;
  }

  // check if img_ext is valid

  /////////////////////////////////
  // save image to a file
  const img_file_path = path.join(
    out_dir,
    `img-${session_id}.${img_ext}`
  );

  // if form-data, multer saves the file data to /data & req.file.path is pointing to the file
  if (!img_url && !img_base64) {
    if (!req.file) {
      logger.error("Invalid input. Image not provided", { metadata: { session } })
      const error_code = 6;
      res.send({
        session_id: session_id,
        success: false,
        error_code,
        message: "OCR failed - Invalid input - Image not provided",
      });
      return;
    }

    inputs.img_form_data_path = req.file.path;
  }

  save_to_file({ ...inputs, img_file_path })
    .then(() => {

      /////////////
      // run ocr
      tess.run_ocr({ img_file_path, lang, oem, psm })
        .then(ocr => {

          // add session info
          ocr.session_id = session_id;
          ocr.success = true;

          res.send(ocr)

          // update user stats
          user.num_reqs += 1;
          user.num_pages += ocr.json.pages.length;
          user.num_words += ocr.text.split(' ').length;
          user.total_sec += ocr.exec_ms / 1000;
          user.save();

          logger.info("ocr finished", { metadata: { session, exec_ms: ocr.exec_ms } })
        })
        .catch(error => {
          logger.error("ocr error", { metadata: { session, error } })

          //res.status(500);
          const error_code = 2;
          res.send({
            session_id: session_id,
            success: false,
            error_code,
            message: "OCR failed",
          });
        })

    }).
    catch(error => {

      // console.log('==============')
      // console.log(error.message)
      // console.log('==============')

      if (error && error.response && error.response.status == 404) {
        const error_code = 1;

        //res.status(500);
        res.send({
          mesage: `OCR failed - The resource not found. If img_url was provided, make sure the resource exists.`,
          success: false,
          error_code,
          session_id
        })

        logger.error("ocr error", { metadata: { session, error, error_code } })

      }
      else {
        const error_code = -1;
        //res.status(500);
        res.send({
          session_id: session_id,
          success: false,
          error_code,
          message: "OCR command failed",
        });

        logger.error("ocr error", { metadata: { session, error, error_code } })


      }


    })


});

module.exports = router;
