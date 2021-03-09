const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { base64_decode } = require("../..//utils/base64coder");
const User = require('../../models/user.js');
const authorizedAppOnly = require('../../security/authorizedAppOnly')
const logger = require('../../providers/logger')
const tess = require('../../providers/tess')
const image_downloader = require('../../providers/image_downloader')

const ERROR_CODE = require('../../error_code')
const { err, scc } = require('../../utils/helper')

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
router.post("/", upload.single('img_data'), authorizedAppOnly, (req, res, next) => {

  // inputs
  const user = req.user;
  const session_id = req.uuid;

  const inputs = req.body;
  const { img_base64, img_url, img_ext, lang, output_json, output_pdf } = inputs

  // default oem & psm values
  const oem = inputs.oem || 3;
  const psm = inputs.psm || 1;

  // this will be recorded on most logging.
  const req_method = (img_base64) ? "img_base64" : (img_url) ? "img_url" : "img_data";
  const session = { session_id, user_ip: req.userIp, email: user.email, oem, psm, lang, img_ext, req_method, date: new Date() }

  logger.info("/ocr", { metadata: { session } })

  ////////////////
  // check inptus
  if (!img_ext) {
    err(ERROR_CODE.OCR.IMG_EXT_IS_NULL, "OCR failed - Parameter 'img_ext' cannot be null.", session, res, req)
    return;
  }

  ////////////////////
  // img_ext supported?
  const supported_img_ext_list = ["jpg", "jpeg", "png", "bmp", "tif", "tiff", "pdf"]
  const ext = img_ext.toLowerCase().trim();
  const matchlist = supported_img_ext_list.filter(item => item === ext);
  if (!matchlist || matchlist.length === 0) {
    err(ERROR_CODE.OCR.IMG_EXT_NOT_SUPPORTED, `OCR failed - the given img_ext(${img_ext}) is not supported`, session, res, req)
    return
  }

  /////////////////////
  // lang supported?
  if (!lang || lang.length != 3) {
    err(ERROR_CODE.OCR.LANG_MUST_BE_3, "OCR failed - lang parameter not provided or the length is not 3", session, res, req)
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
      err(ERROR_CODE.OCR.IMAGE_NOT_PROVIDED, "OCR failed - Invalid input - Image not provided or incorrect", session, res, req)
      return;
    }

    inputs.img_form_data_path = req.file.path;
  }

  save_to_file({ ...inputs, img_file_path })
    .then(() => {

      ///////////////
      // file saved?
      if (!fs.existsSync(img_file_path)) {
        err(ERROR_CODE.OCR.FAILED_SAVING_IMAGE_DATA, "OCR failed - image save failed on the server", session, res, req, true)
        return;
      }

      ////////////
      // file size (byte)
      try {
        var stats = fs.statSync(img_file_path)
        session.file_size_mbyte = stats.size / (1024 * 1024);
      }
      catch (error) {
        err(ERROR_CODE.OCR.FAILED_GETTING_FILE_SIZE, "OCR failed - failed getting the image size", session, res, req)
        return;
      }

      /////////////
      // run ocr
      tess.run_ocr({ img_file_path, lang, oem, psm, output_json, output_pdf })
        .then(ocr => {

          // add session info
          ocr.session_id = session_id;
          ocr.success = true;
          ocr.file_size_mbyte = session.file_size_mbyte;

          // success
          scc("OCR finished", session, res, req, ocr, { exec_ms: ocr.exec_ms })

          // update user stats
          user.num_reqs += 1;

          if (output_json) user.num_pages += ocr.json.pages.length;
          user.num_words += ocr.text.split(' ').length;
          user.total_sec += ocr.exec_ms / 1000;
          user.total_mbyte += ocr.file_size_mbyte;
          user.save();
        })
        .catch(error => {
          err(ERROR_CODE.OCR.FAILED, "OCR failed", session, res, req, true, error)
          return;
        })
    }).
    catch(error => {
      if (error && error.response && error.response.status == 404) {
        err(ERROR_CODE.OCR.RESOURCE_NOT_FOUND, `OCR failed - The resource not found (404). If img_url was provided, make sure the resource exists.`,
          session, res, req, true, error)
        return;
      }
      else {
        err(ERROR_CODE.GENERAL, "OCR failed", session, res, req, true, error)
        return;
      }
    })
});

module.exports = router;
