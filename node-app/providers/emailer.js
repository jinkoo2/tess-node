var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'myocr.net@gmail.com',
    pass: 'zaq1ZAQ!'
  }
});

function send(to, subject, body){
  var mailOptions = {
    from:'myocr.net@gmail.com',
    to: to,
    subject: subject,
    text: body
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

function notifyAdmins(subject, body){
  
  const to = 'admin@myocr.net'
  
  var mailOptions = {
    from:'myocr.net@gmail.com',
    to: to,
    subject: subject,
    text: '[myocr] - ' + body
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}


module.exports = {send, notifyAdmins};

