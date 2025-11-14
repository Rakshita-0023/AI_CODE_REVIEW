import nodemailer from 'nodemailer';

export const sendOTPEmail = async (email, otp) => {
  // Use Mailtrap for reliable email delivery (free tier)
  const transporter = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: '4a5b6c7d8e9f10',
      pass: 'a1b2c3d4e5f6g7'
    }
  });

  await transporter.sendMail({
    from: '"AI Code Reviewer" <noreply@aicodereview.com>',
    to: email,
    subject: 'Password Reset OTP - AI Code Reviewer',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366f1;">Password Reset Request</h2>
        <p>Your OTP code is:</p>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #333; font-size: 36px; margin: 0; letter-spacing: 8px;">${otp}</h1>
        </div>
        <p>This code expires in 5 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });

  console.log(`📧 OTP email sent to ${email}: ${otp}`);
};