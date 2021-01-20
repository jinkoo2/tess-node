const fs = require("fs");
const { parse, valid } = require("node-html-parser");
const { stringify } = require("uuid");

function parse_bbox(str){
    return str.trim().split(' ').slice(1).map(i => parseInt(i))
}

function parse_page_no(str){
    return parseInt(str.trim().split(' ')[1])
}

function parse_x_wconf(str){
    return parseInt(str.trim().split(' ')[1])
}

function parse_pages(pageNodes, out_array) {
  pageNodes.forEach((pageNode) => {
    if (typeof pageNode.getAttribute === undefined) return;

    const title = pageNode.getAttribute("title");
    const list = title.split(';')
    const bbox = parse_bbox(list[1])
    const page_no = parse_page_no(list[2])

    // extract info
    const page = {
      id: pageNode.id,
      bbox: bbox,
      page_no: page_no,
      info: title,
      blocks: [],
    };

    // add to the output
    out_array.push(page);

    parse_areas(pageNode.childNodes, page.blocks);
  });
}

function parse_areas(areaNodes, out_array) {
  areaNodes.forEach((areaNode) => {

    if (typeof areaNode.getAttribute === undefined) return;

    const title = areaNode.getAttribute("title")

    // extract info
    const area = {
      id: areaNode.id,
      bbox: parse_bbox(title),
      info: title,
      paragraphs: [],
    };

    // add to the output
    out_array.push(area);

    parse_paragraphs(areaNode.childNodes, area.paragraphs);
  });
}

function parse_paragraphs(parNodes, out_array) {
  parNodes.forEach((parNode) => {
    if (typeof parNode.getAttribute === undefined) return;

    const title = parNode.getAttribute("title")

    // extract info
    const par = {
      id: parNode.id,
      bbox: parse_bbox(title),
      info: title,
      lang: parNode.getAttribute("lang"),
      lines: [],
    };

    // add to the output
    out_array.push(par);

    parse_lines(parNode.childNodes, par.lines);
  });
}

function parse_lines(lineNodes, out_array) {
  lineNodes.forEach((lineNode) => {
    if (typeof lineNode.getAttribute === undefined) return;

    const title = lineNode.getAttribute("title");

    const bbox = parse_bbox(title.split(';')[0])

    // extract info
    const line = {
      id: lineNode.id,
      info: title,
      bbox: bbox,
      words: [],
    };

    // add to the output
    out_array.push(line);

    parse_words(lineNode.childNodes, line.words);
  });
}

function parse_words(wordNodes, out_array) {
  wordNodes.forEach((wordNode) => {
    if (typeof wordNodes.getAttribute === undefined) return;

    const title = wordNode.getAttribute("title");

    const [bbox, x_wconf] = title.split(';')

    // extract info
    const word = {
      id: wordNode.id,
      bbox: parse_bbox(bbox),
      conf: parse_x_wconf(x_wconf),
      info: title,
    };

    // add to the output
    out_array.push(word);
  });
}

// parse hocr
function hocr2json(hocr_file) {


  console.log("FUNCTION: hocr2json");
  console.log("hocr_file=" + hocr_file);

  if (!hocr_file || !fs.existsSync(hocr_file)) {
    console.error("Error: file not found: " + hocr_file);
    return;
  }

  // read hocr file
  const html = fs.readFileSync(hocr_file).toString();

  if(!html || !valid(html)){
    console.error("Error: The content of hocr file is invalid: " + hocr_file);
    return;
  }

  // parse html
  const root = parse(html).removeWhitespace();
  //console.log('ROOT', root)

  // parse pages
  const pageNodes = root.querySelectorAll(".ocr_page");
  let pages = [];
  parse_pages(pageNodes, pages);

  return { pages: pages };
}

module.exports = hocr2json;
