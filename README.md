# Bharat Icons - Deployment Guide for Render.com

This project is a React application built with Vite and Tailwind CSS. To host this website on Render.com through a GitHub repository, follow these step-by-step instructions.

## Step 1: Push your code to GitHub
1. Create a new repository on [GitHub](https://github.com/new).
2. Open your terminal in your project folder.
3. Initialize the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Bharat Icons"
   ```
4. Connect to your GitHub repository and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Set up Render.com
1. Log in to [Render.com](https://dashboard.render.com).
2. Click the **"New +"** button and select **"Static Site"**.
3. Connect your GitHub account and select the **Bharat Icons** repository you just created.

## Step 3: Configure Build & Deploy Settings
On the Render configuration screen, use the following settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `bharat-icons` (or any name you prefer) |
| **Runtime** | `Static Site` |
| **Build Command** | `npm run build` |
| **Publish Directory** | `dist` |

## Step 4: Add Environment Variables (Optional)
If your app uses the Gemini API or other secrets:
1. Go to the **Environment** tab in your Render dashboard.
2. Add your `GEMINI_API_KEY` (if you are using AI features).

## Step 5: Deploy
1. Click **"Create Static Site"**.
2. Render will now pull your code, run the build command, and deploy the `dist` folder.
3. Once the build is finished, Render will provide you with a live URL (e.g., `https://bharat-icons.onrender.com`).

---

### Why "Static Site"?
Since this app is a Single Page Application (SPA), hosting it as a Static Site is the fastest and most cost-efficient method (Free tier available). Render's CDN handles the global delivery of your compiled assets.
