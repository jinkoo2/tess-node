const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

const { base64_decode } = require("../../utils/base64coder");
const User = require('../../models/user.js');
const authorizedOnly = require('../../security/authorizedOnly')
const logger = require('../../providers/logger')
const tess = require('../../providers/tess')
const version = process.env.VERSION || 'v1'

router.get("/", (req, res, next) => {
  res.send(`Hello OCR ${version}!!!`);
});

// GET lang list
router.get("/lang_list", authorizedOnly, (req, res, next) => {

  //////////
  // inputs
  const user = req.user;
  const session_id = req.uuid;
  
  logger.info({ message: "get orc/lang_list", user: user.email, session_id})

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
      logger.info("lang_list exec time", {metadata:{session_id, list, user: user.email, exec_ms:ms}});
    })
    .catch(error => {
      console.error('catch error')
      res.status(500);
      res.send({
        session_id: session_id,
        message: "Error - " + error.msg,
      })

      // log
      logger.error(error.msg, {metadata: { user: user.email, session_id, error: error }})
    }) // catch

}); // get()

// run ocr
router.post("/", authorizedOnly, (req, res, next) => {

  // inputs
  const user = req.user;
  const session_id = req.uuid;
  const { img_base64, filename, lang } = req.body;

  //console.log(img_base64)
  logger.info("/ocr", {metadata:{ email: user.email, session_id, filename, lang}})

  /////////////////////////////////
  // check if the lang is supported

  // temporary data dir
  const out_dir = "./data";
  if (!fs.existsSync(out_dir)) {
    logger.info('mkdir ' + out_dir)
    fs.mkdirSync(out_dir);
  }

  //////////////////////////////////////
  // save the file as random file name
  const tmp_img_file = path.join(
    out_dir,
    "img-" + session_id + path.extname(filename)
  );
  base64_decode(img_base64, tmp_img_file);

  /////////////
  // run ocr
  tess.run_ocr({
    img_file: tmp_img_file,
    lang: lang
  })
    .then(ocr=>{
      
      // add session info
      ocr.session_id = session_id;

      res.send(ocr)

      // update user stats
      user.num_reqs+=1;
      user.num_pages+=ocr.json.pages.length;
      user.num_words+=ocr.text.split(' ').length;
      user.total_sec+=ocr.exec_ms/1000;
      user.save();

      logger.info("ocr finished", {metadata:{session_id, email:user.email, exec_ms:ocr.exec_ms}})
    })
    .catch(error=>{
      logger.error("ocr error", {metadata:error})
      
      res.status(500);
      res.send({
        session_id: session_id,
        message: "Error - OCR command failed",
      });
    })
});

module.exports = router;
