# 🚀 Deployment Guide

Your Trading AI project is ready for deployment! Here are several options:

## 📋 Prerequisites

Make sure you have your environment variables ready:
- `VITE_SUPABASE_URL`: https://wumtsgpybpwtvqierlxr.supabase.co
- `VITE_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bXRzZ3B5YnB3dHZxaWVybHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDE5ODYsImV4cCI6MjA3NjAxNzk4Nn0.Mz9ln7_i6gm0pBKQE-4W0Txl5tl1qCoiCSUnJNkYHvY
- `VITE_POLYGON_API_KEY`: _OSxpOFyFmoejpLLo1qnJ7r4e4Ajie9F
- `VITE_OPENAI_API_KEY`: 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

## 🌐 Deployment Options

### Option 1: Netlify (Recommended)

1. **Create GitHub Repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Trading AI"
   git branch -M main
   git remote add origin https://github.com/yourusername/trading-ai.git
   git push -u origin main
   ```

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Build settings are already configured in `netlify.toml`
   - Add environment variables in Netlify dashboard

3. **Environment Variables in Netlify:**
   - Go to Site settings → Environment variables
   - Add all the variables listed above

### Option 2: Vercel

1. **Create GitHub Repository** (same as above)

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configuration is already set in `vercel.json`
   - Add environment variables in Vercel dashboard

3. **Environment Variables in Vercel:**
   - Go to Project settings → Environment Variables
   - Add all the variables listed above

### Option 3: GitHub Pages + Actions

1. **Push to GitHub** (same as above)

2. **Enable GitHub Actions:**
   - The workflow is already configured in `.github/workflows/deploy.yml`
   - Go to repository Settings → Secrets and variables → Actions
   - Add all environment variables as secrets

3. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: gh-pages (will be created by the action)

### Option 4: Manual Build & Upload

1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Upload `dist` folder to any static hosting:**
   - Firebase Hosting
   - AWS S3 + CloudFront
   - DigitalOcean App Platform
   - Surge.sh

## 🔧 Build Commands

- **Install**: `npm install`
- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## 📝 Notes

- The app is a Single Page Application (SPA)
- All routes should redirect to `index.html`
- Environment variables must be prefixed with `VITE_`
- The build output is in the `dist` folder

## 🆘 Troubleshooting

**Build fails?**
- Check that all environment variables are set
- Ensure Node.js version is 18 or higher

**App loads but features don't work?**
- Verify environment variables are correctly set
- Check browser console for errors
- Ensure Supabase and API keys are valid

**Deployment successful but site shows errors?**
- Check that the hosting platform supports SPA routing
- Verify all redirects are configured (see netlify.toml/vercel.json)

Your Trading AI is production-ready! 🎉