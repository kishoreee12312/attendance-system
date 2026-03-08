const nodemailer = require("nodemailer");

const isMailerConfigured = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
const isAlertsEnabled = process.env.EMAIL_ALERTS_ENABLED === "true";

let transporter = null;
if (isMailerConfigured) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

async function sendLowAttendanceEmail(to, name, percentage) {
  if (!isAlertsEnabled || !transporter) {
    return { skipped: true };
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Low Attendance Warning",
    html: `<p>Dear ${name},<br>Your attendance is <b>${percentage}%</b>. Please ensure you meet the minimum requirements.</p>`
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendLowAttendanceEmail,
  isMailerConfigured,
  isAlertsEnabled
};
