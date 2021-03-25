const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { base64_decode } = require("../..//utils/base64coder");
const OCR = require('../../models/ocr');
const authorizedAppOnly = require('../../security/authorizedAppOnly')
const tess = require('../../providers/tess')
const image_downloader = require('../../providers/image_downloader')

const ERROR_CODE = require('../../error_code')
const { err, scc, log_info } = require('../../utils/helper')

const util = require('util')
const fs_rename = util.promisify(fs.rename)

const version = process.env.VERSION || 'v1'

/////////////////////////////
// make temporary data dir
const out_dir = "./data";
if (!fs.existsSync(out_dir)) {
  log_info('making data directory: ' + out_dir)
  fs.mkdirSync(out_dir);
}

router.get("/", (req, res, next) => {
  res.send(`Hello OCR ${version}!!!`);
});

// GET lang list
router.get("/lang_list", (req, res, next) => {

  //////////
  // inputs
  const user = req.user;

  log_info("get /ocr/lang_list", req.session)

  /////////////////
  // start timer
  const start = new Date();

  /////////////////////
  // run tess command
  tess.get_lang_list()
    .then(list => {

      const end = new Date();
      const ms = end.getTime() - start.getTime();

      // log
      const data_to_logger = { list, exec_ms: ms };
      const data_to_user = { list, exec_ms: ms }
      scc("lang_list success", res, req, data_to_user, data_to_logger, false)
    })
    .catch(error => {
      err(ERROR_CODE.LANGLIST.ERROR, "Command lang_list failed.", res, req, true, error)
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

var multer = require('multer');
var upload = multer({ dest: 'data/' })

// run ocr
router.post("/", upload.single('img_data'), authorizedAppOnly, (req, res, next) => {

  ////////////////////////////////////
  // app & user from authorizedAppOnly
  const app = req.app;
  const user = app.user;

  console.log('==================')
  console.log('app.name=', app.name)
  console.log('user.email=', user.email)
  console.log('==================')

  ///////////
  // inputs
  const inputs = req.body;
  const { img_base64, img_url, img_ext, lang, output_json, output_pdf } = inputs
  const req_mode = (img_base64) ? "img_base64" : (img_url) ? "img_url" : "img_data";

  // default oem & psm values
  const oem = inputs.oem || 3;
  const psm = inputs.psm || 1;

  // add ocr params to session
  req.session.ocr_params = {
    oem, psm, img_ext, req_method: req_mode, date: new Date()
  }

  // logger.log({
  //   level: "info",
  //   message: "/ocr",
  //   email: user.email,
  //   user_ip: req.user_ip,
  //   url: req.url,
  //   session
  // })

  ////////////////
  // check inptus
  if (!img_ext) {
    err(ERROR_CODE.OCR.IMG_EXT_IS_NULL, "OCR failed - Parameter 'img_ext' cannot be null.", res, req)
    return;
  }

  ////////////////////
  // img_ext supported?
  const supported_img_ext_list = ["jpg", "jpeg", "png", "bmp", "tif", "tiff", "pdf"]
  const ext = img_ext.toLowerCase().trim();
  const matchlist = supported_img_ext_list.filter(item => item === ext);
  if (!matchlist || matchlist.length === 0) {
    err(ERROR_CODE.OCR.IMG_EXT_NOT_SUPPORTED, `OCR failed - the given img_ext(${img_ext}) is not supported`, res, req)
    return
  }

  /////////////////////
  // lang supported?
  if (!lang || lang.length != 3) {
    err(ERROR_CODE.OCR.LANG_MUST_BE_3, "OCR failed - lang parameter not provided or the length is not 3", res, req)
    return;
  }

  // check if img_ext is valid

  /////////////////////////////////
  // save image to a file
  const img_file_path = path.join(
    out_dir,
    `img-${req.session.session_id}.${img_ext}`
  );

  // if form-data, multer saves the file data to /data & req.file.path is pointing to the file
  if (!img_url && !img_base64) {
    if (!req.file) {
      err(ERROR_CODE.OCR.IMAGE_NOT_PROVIDED, "OCR failed - Invalid input - Image not provided or incorrect", res, req)
      return;
    }

    inputs.img_form_data_path = req.file.path;
  }

  save_to_file({ ...inputs, img_file_path })
    .then(() => {

      console.log("================ save file succeeded ===================")
      ///////////////
      // file saved?
      if (!fs.existsSync(img_file_path)) {
        err(ERROR_CODE.OCR.FAILED_SAVING_IMAGE_DATA, "OCR failed - image save failed on the server", res, req, true)
        return;
      }

      ////////////
      // file size (byte)
      try {
        var stats = fs.statSync(img_file_path)
        req.session.file_size_mbyte = stats.size / (1024 * 1024);
      }
      catch (error) {
        err(ERROR_CODE.OCR.FAILED_GETTING_FILE_SIZE, "OCR failed - failed getting the image size", res, req)
        return;
      }

      /////////////
      // run ocr
      return tess.run_ocr({ img_file_path, lang, oem, psm, output_json, output_pdf })
    })
    .then(ocr_result => {
      if (!ocr_result) {
        throw new Error("OCR failed - run_ocr() returned a null object")
      }

      console.log("================ run_ocr succeeded ===================")

      // add session info
      ocr_result.session_id = req.session.session_id;
      ocr_result.success = true;
      ocr_result.file_size_mbyte = req.session.file_size_mbyte;

      // save & return response to the user
      try {
        scc("OCR finished", res, req, ocr_result, { exec_ms: ocr_result.exec_ms })
      }
      catch (error) {
        throw new Error('OCR failed - something went wrong')
      }

      // save the ocr
      const ocr = new OCR({
        app: app._id,
        user: user._id,
        success: true,
        session_id: req.session.session_id,
        img_ext,
        req_mode,
        req_ip: req.user_ip,
        num_pages: (ocr_result.json) ? ocr_result.json.pages.length : 1,
        num_words: ocr_result.text.split(' ').length,
        exec_ms: ocr_result.exec_ms,
        file_size_mbyte: ocr_result.file_size_mbyte,
      })
      return ocr.save()
    })
    .then((ocr_ret) => {
      if (!ocr_ret) {
        throw new Error("OCR failed - OCR.save() returned a null object")
      }

      console.log('app.user.num_reqs=', app.user.num_reqs)
      // update user stats
      app.num_reqs += 1;
      app.num_pages += ocr_ret.num_pages
      app.num_words += ocr_ret.num_words;
      app.total_sec += ocr_ret.exec_ms / 1000;
      app.total_mbyte += ocr_ret.file_size_mbyte;
      return app.save();
    })
    .then((app_ret) => {
      if (!app_ret) {
        throw new Error("OCR failed - App.save() returned a null object")
      }

      console.log('app_ret.user.num_reqs=', app_ret.user.num_reqs)
    })
    .catch(error => {

      console.log("================ error ===================")
      console.error(error)
      console.log("================ error ===================")

      if (error && error.response && error.response.status == 404) {
        err(ERROR_CODE.OCR.RESOURCE_NOT_FOUND, `OCR failed - The resource not found (404). If img_url was provided, make sure the resource exists.`,
          res, req, true, error)
        return;
      }
      else {
        err(ERROR_CODE.GENERAL, "OCR failed", res, req, true, error)
        return;
      }
    })
});

module.exports = router;
