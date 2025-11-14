export const sendOTPSMS = async (phone, otp) => {
  // SMS simulation - log to console for now
  console.log(`📱 SMS OTP for ${phone}: ${otp}`);
  console.log('📱 SMS sent successfully (simulated)');
  
  // In production, integrate with:
  // - Twilio
  // - AWS SNS
  // - Fast2SMS (India)
  // - TextLocal (India)
};