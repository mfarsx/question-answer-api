const nodemailer = require("nodemailer");
const { isSmtpConfigured } = require("../config/env");

const sendEmail = async (mailOptions) => {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP is not fully configured");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail(mailOptions);
  console.log(`Message Send : ${info.messageId}`);
  return info;
};

module.exports = {
  sendEmail,
};
