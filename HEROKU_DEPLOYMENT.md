# SEO PR Bot - Heroku Deployment Guide

## 🚀 Professional Heroku Deployment Setup

This guide will help you deploy your SEO PR Bot to Heroku with Puppeteer support using the [puppeteer-heroku-buildpack](https://elements.heroku.com/buildpacks/jontewks/puppeteer-heroku-buildpack).

---

## 📋 Prerequisites

1. **Heroku CLI** installed and configured
2. **Git** repository initialized
3. **MongoDB Atlas** account (for production database)
4. **Node.js 18+** (specified in package.json)

---

## 🔧 Step 1: Heroku App Setup

### Create Heroku App
```bash
# Create new Heroku app
heroku create your-seo-bot-app-name

# Or if you already have an app
heroku git:remote -a your-seo-bot-app-name
```

### Add Required Buildpacks
```bash
# Add Puppeteer buildpack (MUST be first)
heroku buildpacks:add jontewks/puppeteer

# Add Node.js buildpack
heroku buildpacks:add heroku/nodejs
```

### Verify Buildpacks
```bash
heroku buildpacks
# Should show:
# 1. jontewks/puppeteer
# 2. heroku/nodejs
```

---

## 🗄️ Step 2: Database Setup

### Option A: MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Set environment variable:
```bash
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/seo-pr-bot"
```

### Option B: Heroku Postgres (Alternative)
```bash
# Add Heroku Postgres addon
heroku addons:create heroku-postgresql:mini

# Get database URL
heroku config:get DATABASE_URL
```

---

## 🔐 Step 3: Environment Variables

Set all required environment variables:

```bash
# JWT Secret (generate a strong secret)
heroku config:set JWT_SECRET="your-super-secret-jwt-key-here"

# Node Environment
heroku config:set NODE_ENV="production"

# Optional: Custom port (Heroku sets this automatically)
heroku config:set PORT="5000"

# Optional: Rate limiting
heroku config:set RATE_LIMIT_WINDOW_MS="900000"
heroku config:set RATE_LIMIT_MAX_REQUESTS="100"
```

### View all config variables:
```bash
heroku config
```

---

## 📦 Step 4: Deploy to Heroku

### Initial Deployment
```bash
# Add all files to git
git add .

# Commit changes
git commit -m "Initial Heroku deployment setup"

# Deploy to Heroku
git push heroku main
```

### Subsequent Deployments
```bash
# Make changes to your code
# Then deploy
git add .
git commit -m "Update SEO bot features"
git push heroku main
```

---

## 🔍 Step 5: Verify Deployment

### Check App Status
```bash
# Check if app is running
heroku ps

# View logs
heroku logs --tail

# Open app in browser
heroku open
```

### Test API Endpoints
```bash
# Test basic endpoint
curl https://your-app-name.herokuapp.com/

# Test SEO metadata endpoint (requires authentication)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://your-app-name.herokuapp.com/api/seo-metadata
```

---

## 🛠️ Step 6: Troubleshooting

### Common Issues and Solutions

#### 1. Puppeteer Chrome Not Found
```bash
# Clear Heroku build cache
heroku plugins:install heroku-repo
heroku repo:purge_cache -a your-app-name

# Redeploy
git commit --allow-empty -m "Clear cache and redeploy"
git push heroku main
```

#### 2. Memory Issues
```bash
# Scale up dyno (if needed)
heroku ps:scale web=1:standard-1x

# Monitor memory usage
heroku logs --tail
```

#### 3. Database Connection Issues
```bash
# Check MongoDB URI
heroku config:get MONGODB_URI

# Test database connection
heroku run node -e "console.log('Testing DB connection...')"
```

#### 4. Build Failures
```bash
# Check build logs
heroku logs --tail

# Verify buildpacks
heroku buildpacks

# Check package.json scripts
cat package.json | grep -A 10 "scripts"
```

---

## 📊 Step 7: Monitoring and Maintenance

### Monitor App Performance
```bash
# View real-time logs
heroku logs --tail

# Check dyno status
heroku ps

# Monitor metrics
heroku metrics
```

### Database Maintenance
```bash
# Access MongoDB shell (if using MongoDB Atlas)
heroku run node -e "require('./models/trafficData').find({}).limit(5).then(console.log)"

# Backup database (if using Heroku Postgres)
heroku pg:backups:capture
```

---

## 🔒 Step 8: Security Considerations

### Environment Variables
- ✅ Never commit `.env` files
- ✅ Use strong JWT secrets
- ✅ Rotate secrets regularly
- ✅ Use MongoDB Atlas with IP whitelisting

### API Security
- ✅ Implement rate limiting
- ✅ Validate all inputs
- ✅ Use HTTPS (automatic on Heroku)
- ✅ Implement proper CORS settings

---

## 📈 Step 9: Scaling

### Horizontal Scaling
```bash
# Scale to multiple dynos
heroku ps:scale web=2

# Use different dyno types
heroku ps:scale web=1:standard-1x
```

### Vertical Scaling
```bash
# Upgrade dyno type
heroku ps:scale web=1:performance-m
```

---

## 🎯 Step 10: Production Checklist

### Pre-Deployment
- [ ] All environment variables set
- [ ] Database connection tested
- [ ] Buildpacks configured correctly
- [ ] Security measures implemented
- [ ] Error handling in place

### Post-Deployment
- [ ] App responds to requests
- [ ] Database operations working
- [ ] Puppeteer functionality tested
- [ ] SEO metadata extraction working
- [ ] API endpoints accessible
- [ ] Logs showing no errors

---

## 📞 Support

### Heroku Resources
- [Heroku Dev Center](https://devcenter.heroku.com/)
- [Puppeteer Buildpack](https://elements.heroku.com/buildpacks/jontewks/puppeteer-heroku-buildpack)
- [Heroku Support](https://help.heroku.com/)

### Common Commands Reference
```bash
# App management
heroku apps:create
heroku apps:destroy
heroku apps:info

# Configuration
heroku config:set KEY=value
heroku config:get KEY
heroku config:unset KEY

# Deployment
git push heroku main
heroku releases
heroku rollback

# Monitoring
heroku logs --tail
heroku ps
heroku metrics
```

---

## 🎉 Success!

Your SEO PR Bot should now be running on Heroku with full Puppeteer support! 

The bot will automatically:
- ✅ Extract comprehensive SEO metadata
- ✅ Generate traffic and rank tracking
- ✅ Provide detailed SEO analysis
- ✅ Store data in your MongoDB database
- ✅ Serve API endpoints for frontend integration

**Your app URL:** `https://your-app-name.herokuapp.com`

---

*For additional support or questions, refer to the [Heroku documentation](https://devcenter.heroku.com/) or the [Puppeteer buildpack repository](https://github.com/jontewks/puppeteer-heroku-buildpack).*
