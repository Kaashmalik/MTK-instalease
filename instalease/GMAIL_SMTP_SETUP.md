# Gmail SMTP Setup for InstalEase
## Quick 5-Minute Setup Guide

**Goal**: Configure Gmail to send professional emails from your app  
**Time**: 5 minutes  
**Cost**: FREE

---

## 🚀 Step-by-Step Setup

### Step 1: Enable 2-Step Verification (2 minutes)

1. Go to: https://myaccount.google.com/security
2. Scroll to **"How you sign in to Google"**
3. Click **2-Step Verification**
4. Click **Get Started**
5. Follow the prompts to enable it
6. ✅ Done!

### Step 2: Create App Password (1 minute)

1. Go to: https://myaccount.google.com/apppasswords
2. In **"Select app"** dropdown: Choose **Mail**
3. In **"Select device"** dropdown: Choose **Other (Custom name)**
4. Type: **InstalEase**
5. Click **Generate**
6. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)
7. ✅ Save this password - you'll need it!

### Step 3: Configure Supabase SMTP (2 minutes)

1. Open **Supabase Dashboard**
2. Go to **Project Settings** (gear icon)
3. Click **Auth** in the sidebar
4. Scroll down to **SMTP Settings**
5. Click **Enable Custom SMTP**
6. Fill in these values:

```
Sender email: your-email@gmail.com
Sender name: InstalEase
Host: smtp.gmail.com
Port number: 587
Username: your-email@gmail.com
Password: [paste your 16-char app password]
```

7. Click **Save**
8. ✅ Done!

---

## 🧪 Test It Works

### Send Test Email

1. In Supabase Dashboard
2. Go to **Authentication** → **Email Templates**
3. Click **Confirm signup** template
4. Click **Send test email**
5. Enter your email
6. Click **Send**
7. ✅ Check your inbox!

### Test via Signup

```bash
# 1. Start your app
npm run dev

# 2. Go to signup
http://localhost:3000/auth/signup

# 3. Create account with your email
# 4. Check inbox for confirmation email
```

---

## 📧 Email Settings Reference

### Gmail SMTP Configuration

| Setting | Value |
|---------|-------|
| **Host** | `smtp.gmail.com` |
| **Port** | `587` (TLS) or `465` (SSL) |
| **Security** | TLS/STARTTLS |
| **Username** | Your Gmail address |
| **Password** | 16-char App Password |
| **From Email** | Your Gmail address |
| **From Name** | InstalEase |

### Rate Limits

| Plan | Daily Limit |
|------|-------------|
| **Free Gmail** | 500 emails/day |
| **Google Workspace** | 2,000 emails/day |
| **Supabase Free** | 30 emails/hour |

---

## 🎨 Add Professional Templates

### In Supabase Dashboard:

1. **Authentication** → **Email Templates**
2. Click **Confirm signup**
3. Replace with professional template from `EMAIL_VERIFICATION_SETUP.md`
4. Click **Save**
5. Repeat for **Reset password** and **Magic Link**

---

## 🔧 Troubleshooting

### Error: "Invalid credentials"

**Solution**:
- Make sure you're using the **App Password**, not your regular Gmail password
- App Password should be 16 characters (no spaces)
- Re-generate App Password if needed

### Error: "Less secure app access"

**Solution**:
- This error is outdated
- Use **App Password** instead (Step 2 above)
- Google removed "less secure apps" option

### Emails Go to Spam

**Solutions**:
1. **Add SPF Record** (if using custom domain):
   ```
   v=spf1 include:_spf.google.com ~all
   ```

2. **Warm up your email**:
   - Send to yourself first
   - Mark as "Not Spam"
   - Reply to the email
   - Then send to others

3. **Avoid spam words**:
   - Don't use: FREE, URGENT, ACT NOW
   - Use professional language
   - Include unsubscribe link

### Emails Not Received

**Check**:
1. Spam folder
2. Promotions tab (Gmail)
3. Supabase logs: **Logs** → **Auth Logs**
4. Gmail sent folder
5. Rate limits not exceeded

---

## 🔐 Security Best Practices

### ✅ Do's

- ✅ Use App Password (never regular password)
- ✅ Enable 2-Step Verification
- ✅ Store password in environment variables
- ✅ Use different email for different environments
- ✅ Monitor email logs

### ❌ Don'ts

- ❌ Never commit passwords to Git
- ❌ Don't share App Password
- ❌ Don't use same password for multiple apps
- ❌ Don't disable 2-Step Verification
- ❌ Don't exceed rate limits

---

## 📊 Environment Variables

### Add to `.env.local`:

```bash
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your_16_char_app_password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=InstalEase
```

### For Production (Vercel):

1. Go to **Vercel Dashboard**
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable above
5. Click **Save**

---

## 🎯 Alternative: Use Resend.com

### Why Resend?

- ✅ 3,000 emails/month FREE
- ✅ Better deliverability
- ✅ No spam issues
- ✅ Professional analytics
- ✅ Easy setup

### Quick Setup:

1. Sign up: https://resend.com
2. Get API key
3. Configure in Supabase:

```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [your API key]
From: noreply@yourdomain.com
```

---

## ✅ Verification Checklist

- [ ] 2-Step Verification enabled
- [ ] App Password created
- [ ] Supabase SMTP configured
- [ ] Test email sent successfully
- [ ] Test email received (not in spam)
- [ ] Professional templates added
- [ ] Environment variables set
- [ ] Production SMTP configured

---

## 🎉 You're Done!

Your Gmail SMTP is now configured! 

**What works now**:
- ✅ Email verification on signup
- ✅ Password reset emails
- ✅ Magic link emails
- ✅ Professional templates
- ✅ Reliable delivery

**Next steps**:
1. Test signup flow
2. Add professional templates
3. Monitor email delivery
4. Consider Resend for production

---

## 📞 Need Help?

### Common Issues:

1. **Emails not sending**: Check Supabase logs
2. **Going to spam**: Add SPF record, warm up email
3. **Rate limited**: Upgrade to Google Workspace or use Resend
4. **Invalid credentials**: Re-generate App Password

### Resources:

- Gmail SMTP Guide: https://support.google.com/mail/answer/7126229
- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Email Templates: See `EMAIL_VERIFICATION_SETUP.md`

---

**Status**: ✅ Ready to use  
**Time to setup**: 5 minutes  
**Cost**: FREE  
**Emails/day**: 500
