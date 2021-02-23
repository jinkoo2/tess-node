const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
//const { parse } = require("node-html-parser");
const hocr2json = require("../../utils/hocr2json");
const { base64_decode } = require("../../utils/base64coder");

const User = require('../../models/user.js');
const authorizedOnly = require('../../security/authorizedOnly')

const logger = require('../../providers/logger')

const version = 'v1'

router.get("/", (req, res, next) => {
  res.send(`Hello OCR ${version}!!!`);
});

router.get("/lang_list",authorizedOnly, (req, res, next) => {
  
  const user = req.user;
  const session_id = uuidv4();
  
  const cmd = `tesseract --list-langs`;
  
  logger.info({user:user.email, session_id, cmd:cmd})

  const timer_langlist = logger.startTimer();

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      
      logger.error({user:user.email, session_id, error:error})
      
      res.status(500);
      res.send({
        session_id: session_id,
        message: "Error - lang_list command failed",
      });

      return;
    }

    logger.info({session_id, stdout});
    
    if(stderr)
    {
      logger.error({session_id, stderr});
    }

    const lists = stdout.trim().split('\n').slice(1)
    res.send(lists);

    // log performace
    timer_langlist.done({message: 'lang_list exec time', session_id: session_id})
  });
});

router.post("/", authorizedOnly, (req, res, next) => {
  
  const user = req.user;
  
  const session_id = uuidv4();

  const { img_base64, filename, lang } = req.body;

  //console.log(img_base64)
  logger.info({user:user.email, session_id, filename , lang})
  
  /////////////////////////////////
  // check if the lang is supported
  
  // temporary data dir
  const out_dir = "./data";
  if (!fs.existsSync(out_dir)) {
    logger.info('mkdir '+out_dir)
    fs.mkdirSync(out_dir);
  }

  // save the file as random file name
  const tmp_img_file = path.join(
    out_dir,
    "img-" + session_id + path.extname(filename)
  );
  base64_decode(img_base64, tmp_img_file);

  // run ocr
  const timer_ocr = logger.startTimer()
  const start = new Date();
  const out_str = tmp_img_file;
  const cmd = `tesseract ${tmp_img_file} ${out_str} -l ${lang} --psm 1 --oem 3 hocr txt pdf`;
  logger.info({user:user.email, session_id, cmd:cmd})
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
     
      logger.error({user:user.email, session_id, error:error})

      res.status(500);
      res.send({
        session_id: session_id,
        message: "Error - OCR command failed",
      });
      return;
    }

    // stdout & stderr
    logger.info({session_id, stdout});
    if(stderr) {
      logger.error({session_id, stderr});
    }

    let ocr = {
      session_id: session_id,
      version: "v1",
      lang: lang
    };

    // parse the output and send the data back
    const hocr_file = tmp_img_file + ".hocr";
    if (fs.existsSync(hocr_file)) {
      logger.info('result hocr file found & converting to json - '+hocr_file)
      const json = hocr2json(hocr_file);
      ocr.json = json;

      const txt_file = tmp_img_file + ".txt";
      if (fs.existsSync(txt_file)) {
        logger.info('result txt file found - '+txt_file)
        const txt = fs.readFileSync(txt_file).toString();
        ocr.text = txt;

        res.send(ocr);

        // log the exec time
        timer_ocr.done({message: 'ocr exe time', session_id, user:user.email})
        const end= new Date();
        const seconds = (end.getTime()-start.getTime())/1000;
        
        // update user stats
        user.num_reqs+=1;
        user.num_pages+=json.pages.length;
        user.num_words+=txt.split('').length;
        user.total_sec+=seconds;
        user.save();

        logger.info({
          message:'updated user stats', 
          session_id,
          user: user.email, 
          num_reqs: user.num_reqs, 
          num_pages: user.num_pages, 
          num_words:user.num_words,
          total_sec:user.total_sec})

      } else {
        logger.error({message: 'result hocr file not found', session_id, user: user.email})
        res.status(500);
        res.send({
          session_id: session_id,
          message: "Error - OCR failed (TXT)",
        });
      }
    } else {
      logger.error({message: 'result txt file not found', session_id, user: user.email})
      res.status(500);
      res.send({
        session_id: session_id,
        message: "Error - OCR failed (HOCR)",
      });
    }
  });
});

module.exports = router;
