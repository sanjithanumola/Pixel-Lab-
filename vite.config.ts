import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-proxy-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/ai/status') || req.url === '/api/status') {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                status: 'online',
                geminiAvailable: !!process.env.GEMINI_API_KEY,
                removeBgAvailable: !!process.env.REMOVE_BG_API_KEY
              }));
              return;
            }

            if (req.url?.startsWith('/api/ai/enhance') || req.url === '/api/enhance') {
              if (req.method !== 'POST') {
                res.statusCode = 405;
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
              }

              let bodyStr = '';
              req.on('data', chunk => { bodyStr += chunk; });
              req.on('end', async () => {
                try {
                  const body = JSON.parse(bodyStr || '{}');
                  const geminiKey = (req.headers['x-gemini-key'] as string) || process.env.GEMINI_API_KEY;
                  if (!geminiKey) {
                    res.statusCode = 401;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'GEMINI_API_KEY not configured on server or in request header.' }));
                    return;
                  }

                  const cleanBase64 = (body.imageBase64 || '').replace(/^data:image\/\w+;base64,/, '');
                  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
                  const prompt = `Analyze this image as a professional colorist. Return JSON only:
{"summary": "Brief assessment", "recommendedAdjustments": {"brightness": 5, "contrast": 15, "saturation": 10, "temperature": 5, "sharpness": 15, "filterPreset": "Vivid"}, "colorPalette": ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1"]}`;

                  const geminiRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contents: [{
                        parts: [
                          { text: prompt },
                          { inline_data: { mime_type: body.mimeType || 'image/jpeg', data: cleanBase64 } }
                        ]
                      }],
                      generationConfig: { response_mime_type: "application/json" }
                    })
                  });

                  const data = await geminiRes.json();
                  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, data: JSON.parse(rawText) }));
                } catch (e: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: e.message || 'Server error' }));
                }
              });
              return;
            }

            if (req.url?.startsWith('/api/ai/remove-bg') || req.url === '/api/remove-bg') {
              if (req.method !== 'POST') {
                res.statusCode = 405;
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
              }

              let bodyStr = '';
              req.on('data', chunk => { bodyStr += chunk; });
              req.on('end', async () => {
                try {
                  const body = JSON.parse(bodyStr || '{}');
                  const removeBgKey = (req.headers['x-removebg-key'] as string) || process.env.REMOVE_BG_API_KEY;
                  const cleanBase64 = (body.imageBase64 || '').replace(/^data:image\/\w+;base64,/, '');

                  if (removeBgKey) {
                    const rbgRes = await fetch('https://api.remove.bg/v1.0/removebg', {
                      method: 'POST',
                      headers: {
                        'X-Api-Key': removeBgKey,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ image_file_b64: cleanBase64, size: 'auto', format: 'png' })
                    });
                    if (rbgRes.ok) {
                      const rData: any = await rbgRes.json();
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({ success: true, imageResult: `data:image/png;base64,${rData.data.result_b64}` }));
                      return;
                    }
                  }

                  // If no remove.bg key, return guidance to use client-side smart isolation
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: false,
                    useClientIsolation: true,
                    message: 'No external Remove.bg key detected. Use built-in high-precision Smart Browser Isolation.'
                  }));
                } catch (e: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: e.message || 'Server error' }));
                }
              });
              return;
            }

            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
