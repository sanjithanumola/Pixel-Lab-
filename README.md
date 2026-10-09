# PixelLab AI — Professional Browser-Based Image Editor

PixelLab AI is a desktop-class, high-performance image editing suite that runs directly in the modern web browser using HTML5 Canvas API and vanilla JavaScript.

## Highlights
- **100% Client-Side Core Engine**: Image adjustments, filters, cropping, freehand drawing, eraser, text, shapes, multi-layer rendering, undo/redo, and file export run locally in the browser with zero external dependencies and zero API keys needed.
- **Self-Contained `index.html`**: The entire frontend is encapsulated in a single, clean `index.html` file suitable for static hosting on Vercel, Netlify, GitHub Pages, or any static web server.
- **Non-Destructive Adjustments & Presets**: Adjustments are rendered on top of pristine source layers using composited Canvas processing.
- **Real Layer System**: Image layers, text layers, vector shape layers, and freehand drawing layers with visibility, locking, opacity, reordering, and transforms.
- **Smart Subject Isolation & AI Enhancement**:
  - Built-in offline Smart Browser Edge & Chroma isolation (runs 100% locally with 0 API keys).
  - Optional Gemini Vision integration for intelligent color grading, tone curve analysis, and palette extraction.
  - Optional Remove.bg API key support for automated cloud background cutouts.
  - Optional Vercel Serverless Functions (`/api/remove-bg` and `/api/enhance`).

---

## Deployment Guide

### Option 1: 100% Static Deployment on Vercel (Zero Config)
1. Push `index.html` to your Git repository (GitHub, GitLab, or Bitbucket).
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
3. Select **Other** as the framework preset (or leave defaults for static HTML).
4. Click **Deploy**.
5. Your application is live instantly! All core features (editing, filters, drawing, text, cropping, export, local project save/load, smart offline isolation) function immediately.

### Option 2: Full-Stack Vercel Deployment with AI Serverless Functions
If you want server-side AI background removal or Gemini color grading proxy:
1. Ensure the `/api` directory is present in the repository with `api/remove-bg.js` and `api/enhance.js`.
2. In your Vercel Project Dashboard, navigate to **Settings > Environment Variables**.
3. Add:
   - `GEMINI_API_KEY`: Your Google AI Studio Gemini API key.
   - `REMOVE_BG_API_KEY` (Optional): Your remove.bg API key.
4. Deploy. Vercel automatically exposes `/api/remove-bg` and `/api/enhance` as serverless functions.
5. In PixelLab AI, open **Settings** (gear icon in the top bar) or the **AI Tools** tab; it will automatically detect the server endpoints!

### Option 3: Direct In-Browser Usage (file:// or Local Server)
Simply open `index.html` directly in Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari.
If you wish to use Gemini or Remove.bg directly without a server, click the **Settings** gear icon in PixelLab AI and input your own API key. Keys are saved in `localStorage` strictly on your device and are never broadcast.
