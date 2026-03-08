const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendLowAttendanceEmail(to, name, percentage) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Low Attendance Warning',
    html: `<p>Dear ${name},<br>Your attendance is <b>${percentage}%</b>. Please ensure you meet the minimum requirements.</p>`
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendLowAttendanceEmail };
