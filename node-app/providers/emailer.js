var nodemailer = require('nodemailer');


var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'myocr.net@gmail.com',
    pass: 'zaq1ZAQ!'
  }
});

function send(to, subject, text, html = null) {
  var mailOptions = {
    from: 'myocr.net@gmail.com',
    to: to,
    subject: subject,
    text,
    html
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

function send_template(to, tmpl_loader, data) {
  send(to, tmpl_loader.toSubject(data), tmpl_loader.toText(data), tmpl_loader.toHtml(data))
}

function notifyAdmins(subject, body) {

  const to = 'admin@myocr.net'

  var mailOptions = {
    from: 'myocr.net@gmail.com',
    to: to,
    subject: subject,
    text: '[myocr] - ' + body
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}


module.exports = { send, send_template, notifyAdmins };

