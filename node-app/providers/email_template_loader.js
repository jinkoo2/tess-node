const fs = require('fs')
const path = require('path')
const Handlebars = require("handlebars");

function get_loader(template_name) {
    const templates_root_dir = path.join(__dirname, 'email_templates');
    const template_dir = path.join(templates_root_dir, template_name);

    const html_tmpl = fs.readFileSync(path.join(template_dir, "index.html")).toString()
    const text_tmpl = fs.readFileSync(path.join(template_dir, "index.txt")).toString()
    const subject_tmpl = fs.readFileSync(path.join(template_dir, "index.subject")).toString()

    const toHtml = Handlebars.compile(html_tmpl);
    const toText = Handlebars.compile(text_tmpl);
    const toSubject = Handlebars.compile(subject_tmpl);

    return { toHtml, toText, toSubject }
}

module.exports = { get_loader }