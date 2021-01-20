const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const { parse } = require("node-html-parser");
const hocr2json = require("../utils/hocr2json");
const { base64_decode } = require("../utils/base64coder");

const version = 'v1'

router.get("/", (req, res, next) => {
  res.send(`Hello OCR ${version}!!!`);
});

router.get("/lang_list", (req, res, next) => {
  const cmd = `tesseract --list-langs`;
    console.log("CMD:"+cmd)
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      res.status(500);
      res.send({
        session_id: session_id,
        message: "Error - OCR command failed",
      });
      return;
    }

    console.log(`stdout:${stdout}`);
    
    if(stderr)
        console.log(`stderr:${stderr}`);

    const lists = stdout.trim().split('\n').slice(1)
    console.log(lists)

    res.send(lists);
  });
 
});

router.post("/ocr", (req, res, next) => {
  const session_id = uuidv4();

  const { img_base64, filename, lang } = req.body;
  //console.log(img_base64)
  
  /////////////////////////////////
  // check if the lang is supported
  
  // data dir
  const out_dir = "./data";
  if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir);

  // save the file as random file name
  const tmp_img_file = path.join(
    out_dir,
    "img-" + session_id + path.extname(filename)
  );
  console.log("tmp_img_file=", tmp_img_file);
  base64_decode(img_base64, tmp_img_file);

  // run ocr
  const out_str = tmp_img_file;
  const cmd = `tesseract ${tmp_img_file} ${out_str} -l ${lang} --psm 1 --oem 3 hocr txt pdf`;
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      res.status(500);
      res.send({
        session_id: session_id,
        message: "Error - OCR command failed",
      });
      return;
    }

    console.log(`stdout:${stdout}`);
    console.log(`stderr:${stderr}`);

    let ocr = {
      session_id: session_id,
      version: "v1",
      lang: lang
    };

    // parse the output and send the data back
    const hocr_file = tmp_img_file + ".hocr";
    if (fs.existsSync(hocr_file)) {
      const json = hocr2json(hocr_file);
      ocr.json = json;

      const txt_file = tmp_img_file + ".txt";
      if (fs.existsSync(txt_file)) {
        const txt = fs.readFileSync(txt_file).toString();
        ocr.text = txt;

        res.send(ocr);
      } else {
        res.status(500);
        res.send({
          session_id: session_id,
          message: "Error - OCR failed (TXT)",
        });
      }
    } else {
      res.status(500);
      res.send({
        session_id: session_id,
        message: "Error - OCR failed (HOCR)",
      });
    }
  });
});

module.exports = router;
