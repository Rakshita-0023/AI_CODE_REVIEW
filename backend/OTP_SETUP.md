# OTP Service Setup Guide

## Email Service (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Update .env**:
   ```env
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-16-digit-app-password
   ```

## SMS Service (Twilio)

1. **Create Twilio Account**: https://www.twilio.com/try-twilio
2. **Get Credentials**:
   - Account SID
   - Auth Token
   - Phone Number (from Twilio Console)
3. **Update .env**:
   ```env
   TWILIO_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_PHONE=+1234567890
   ```

## Testing

- Start backend: `npm run dev`
- Test forgot password with email/phone
- Check console logs for OTP codes during development
- OTPs expire in 5 minutes
- Rate limit: 3 OTPs per hour per identifier

## Alternative Services

### Email Alternatives:
- SendGrid
- AWS SES
- Mailgun

### SMS Alternatives:
- AWS SNS
- Vonage (Nexmo)
- MessageBird