# WhatsApp Access Token Refresh Guide

## ⚠️ Current Issue
Your WhatsApp access token has expired (expired on Aug 20, 2025). You need to refresh it to continue sending messages.

## 🔄 How to Get a New Access Token

### Option 1: Meta Business Suite (Recommended)
1. Go to: https://business.facebook.com
2. Navigate to your WhatsApp Business Account
3. Go to Settings → WhatsApp Business API
4. Click on "Configuration" or "API Setup"
5. Generate a new Access Token
6. Copy the new token

### Option 2: Facebook Developer Console
1. Go to: https://developers.facebook.com
2. Select your app (should be linked to WhatsApp Business)
3. Go to WhatsApp → Getting Started
4. Under "Temporary access token", click "Generate"
5. Copy the new token

### Option 3: Use System User Token (Long-lived)
For production, create a System User token that doesn't expire:

1. Go to Business Settings: https://business.facebook.com/settings
2. Click on "System Users" under "Users"
3. Click "Add" to create a new system user
4. Assign the system user to your WhatsApp Business Account
5. Generate a token with these permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
6. This token will be long-lived (60+ days)

## 📝 Update Your Environment File

Once you have the new token, update your `.env.local` file:

```env
WHATSAPP_ACCESS_TOKEN=your_new_token_here
```

## 🧪 Test the New Token

Run this command to test:
```bash
curl -X GET "https://graph.facebook.com/v18.0/me?access_token=YOUR_NEW_TOKEN"
```

If successful, you'll see your WhatsApp Business Account details.

## 🔒 Token Best Practices

1. **Never commit tokens to Git**
2. **Use environment variables**
3. **Rotate tokens regularly**
4. **Use System User tokens for production**
5. **Monitor token expiration**

## 📊 Current WhatsApp Configuration

- **Phone Number ID**: 574744175733556
- **Business Account ID**: 1861646317956355
- **Webhook URL**: https://jarvis-whatsapp-assist-silent-fog-7955.fly.dev/webhook
- **Verify Token**: hubix_secure_webhook_token_2024

## 🚨 Important Notes

- **Temporary tokens expire in 24 hours**
- **User tokens expire in 60 days**
- **System User tokens can be configured to never expire**
- **Always test new tokens before production use**

## 📞 Your Test Number
- **Recipient**: 9765071249 (India)
- **Format with country code**: 919765071249

---

After updating the token, run the test again:
```bash
node test-whatsapp-e2e.js
```