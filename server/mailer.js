const nodemailer = require('nodemailer');

function createTransport() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('SMTP credentials not set — emails will not be sent. Set SMTP_USER and SMTP_PASS in environment variables.');
    return null;
  }

  return nodemailer.createTransport({
    host, port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendOTP(email, name, otp) {
  const transport = createTransport();
  if (!transport) {
    console.log(`[DEV] OTP for ${email}: ${otp}`); // Print to logs in dev
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transport.sendMail({
    from: `"South Shopping" <${from}>`,
    to: email,
    subject: 'Verify your South Shopping account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#22C55E;margin-bottom:8px">South Shopping</h2>
        <p style="color:#333">Hi <strong>${name}</strong>,</p>
        <p style="color:#333">Enter this code to verify your email address:</p>
        <div style="background:#f5f5f5;border-radius:12px;padding:24px;text-align:center;margin:20px 0">
          <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#22C55E">${otp}</span>
        </div>
        <p style="color:#666;font-size:13px">This code expires in 15 minutes. If you didn't sign up, ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendOTP };
