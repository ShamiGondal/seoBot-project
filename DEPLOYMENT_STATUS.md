# SEO PR Bot - Quick Deployment Guide

## Your Heroku App is Ready! 🎉

**App Name:** seo-pr-bot-app  
**App URL:** https://seo-pr-bot-app-e89de5878ec1.herokuapp.com/  
**Git URL:** https://git.heroku.com/seo-pr-bot-app.git

---

## ✅ What's Already Set Up:

1. ✅ Heroku app created
2. ✅ Buildpacks configured:
   - jontewks/puppeteer (for Chrome/Puppeteer support)
   - heroku/nodejs (for Node.js)
3. ✅ Environment variables set:
   - JWT_SECRET: ✅ Set
   - NODE_ENV: production

---

## 🚀 Deployment Options:

### **Option 1: GitHub Integration (Easiest)**

1. Create a GitHub repository for this project
2. Push your code to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/seo-pr-bot.git
   git push -u origin main
   ```

3. Go to Heroku Dashboard:
   - Visit: https://dashboard.heroku.com/apps/seo-pr-bot-app/deploy/github
   - Click "Connect to GitHub"
   - Search for your repository: `seo-pr-bot`
   - Click "Connect"
   - Enable "Automatic Deploys" (optional)
   - Click "Deploy Branch"

### **Option 2: Manual Deployment via Git**

If you're still experiencing Git authentication issues, try:

1. Update Heroku CLI:
   ```powershell
   heroku update
   ```

2. Re-authenticate:
   ```powershell
   heroku login
   ```

3. Try deploying again:
   ```powershell
   git push heroku main
   ```

If it still fails, use Option 1 (GitHub Integration).

---

## ⚠️ **IMPORTANT: Database Setup**

Your app won't work without a database! You need to set up MongoDB:

### **MongoDB Atlas (Recommended)**

1. Create a free account at: https://www.mongodb.com/atlas
2. Create a new cluster (Free tier is fine)
3. Get your connection string
4. Set it in Heroku:
   ```powershell
   heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/seo-pr-bot" -a seo-pr-bot-app
   ```

---

## 📊 Post-Deployment Checklist:

Once deployed, test your endpoints:

### **1. Test Basic Endpoint**
```bash
curl https://seo-pr-bot-app-e89de5878ec1.herokuapp.com/
```

### **2. Test API Endpoints**
```bash
# Signup
curl -X POST https://seo-pr-bot-app-e89de5878ec1.herokuapp.com/api/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"testpass123"}'

# Signin
curl -X POST https://seo-pr-bot-app-e89de5878ec1.herokuapp.com/api/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

### **3. View Logs**
```powershell
heroku logs --tail -a seo-pr-bot-app
```

### **4. Check App Status**
```powershell
heroku ps -a seo-pr-bot-app
```

---

## 🔧 Useful Commands:

```powershell
# View configuration
heroku config -a seo-pr-bot-app

# Set environment variable
heroku config:set KEY=value -a seo-pr-bot-app

# Restart app
heroku restart -a seo-pr-bot-app

# Open app in browser
heroku open -a seo-pr-bot-app

# View app info
heroku apps:info -a seo-pr-bot-app

# Scale dynos
heroku ps:scale web=1 -a seo-pr-bot-app
```

---

## 📱 Access Your App:

- **Web URL:** https://seo-pr-bot-app-e89de5878ec1.herokuapp.com/
- **Dashboard:** https://dashboard.heroku.com/apps/seo-pr-bot-app
- **Logs:** https://dashboard.heroku.com/apps/seo-pr-bot-app/logs

---

## 🎯 Next Steps:

1. ✅ Set up MongoDB Atlas
2. ✅ Deploy using GitHub integration
3. ✅ Test your API endpoints
4. ✅ Monitor logs for any issues
5. ✅ Scale dynos if needed

---

## 🆘 Troubleshooting:

### **App Crashes on Startup**
- Check logs: `heroku logs --tail -a seo-pr-bot-app`
- Ensure MongoDB URI is set correctly
- Verify buildpacks are in correct order

### **Puppeteer Errors**
- Buildpack should be: jontewks/puppeteer (first)
- Check logs for Chromium errors
- Verify heroku-postbuild script in package.json

### **Database Connection Errors**
- Verify MONGODB_URI is set: `heroku config:get MONGODB_URI -a seo-pr-bot-app`
- Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for Heroku)
- Test connection string locally first

---

## 📞 Support:

- Heroku Dashboard: https://dashboard.heroku.com/apps/seo-pr-bot-app
- Heroku Docs: https://devcenter.heroku.com/
- Puppeteer Buildpack: https://github.com/jontewks/puppeteer-heroku-buildpack

---

**Your app is ready! Just complete the MongoDB setup and deploy via GitHub integration.** 🚀
