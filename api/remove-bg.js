/**
 * Vercel Serverless Function: /api/remove-bg
 * Background removal using Gemini Vision or remove.bg
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { imageBase64, mimeType = 'image/png', provider = 'gemini' } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 parameter.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Check for Remove.bg API key
    if (provider === 'removebg' || process.env.REMOVE_BG_API_KEY) {
      const apiKey = req.headers['x-removebg-key'] || process.env.REMOVE_BG_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: 'Remove.bg API key is required.' });
      }

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          image_file_b64: cleanBase64,
          size: 'auto',
          format: 'png'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: `Remove.bg error: ${errorText}` });
      }

      const resultData = await response.json();
      return res.status(200).json({
        success: true,
        imageResult: `data:image/png;base64,${resultData.data.result_b64}`
      });
    }

    // Default: Gemini Vision API Masking / Isolation
    const geminiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(401).json({ 
        error: 'No GEMINI_API_KEY or REMOVE_BG_API_KEY configured. Please provide an API key in Settings or use client-side Smart Isolation.' 
      });
    }

    // Gemini API call for subject isolation
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const prompt = "Analyze this image and identify the main foreground subject vs background. Return a precise JSON object with subject bounding box and background color distribution: {\"subject\": \"description\", \"boundingBox\": {\"ymin\": 0, \"xmin\": 0, \"ymax\": 1000, \"xmax\": 1000}, \"dominantBgColor\": \"#HEX\"}.";

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: cleanBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return res.status(geminiRes.status).json({ error: `Gemini API error: ${err}` });
    }

    const geminiJson = await geminiRes.json();
    const rawText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(rawText);

    return res.status(200).json({
      success: true,
      analysis: parsed,
      message: 'Subject identified. Layer ready for matte isolation.'
    });

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error processing image.' });
  }
}
