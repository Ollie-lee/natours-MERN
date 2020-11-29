const nodemailer = require('nodemailer');

const sendEmail = (options) => {
  // options: email address, the subject line, the email content,
  //1) create a transporter, is basically a service that will actually send the email,
  // const transporter = nodemailer.createTransport({
  //   service: 'Gmail',
  //   auth: {
  //     user: process.env.EMAIL_USERNAME,
  //     pass: process.env.EMAIL_PASSWORD,
  //   },
  // });

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  //activate in gmail "less secure app" option
  //but gmail at most can send 500 emails, surpass this amount will be marked as spammer
  //use SendGrid and Mailgun instead.
  //2) define email options
  const mailOptions = {
    from: 'Ollie Lee <myself.ollie.lee@gmail.com>',
    //coming from argument from this function
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };
  //3)actually send the email
  //async func
  transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
