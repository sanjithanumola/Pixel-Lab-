/**
 * Vercel Serverless Function: /api/enhance
 * Intelligent image enhancement and color grading suggestions via Gemini Vision
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 parameter.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const geminiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return res.status(401).json({ 
        error: 'GEMINI_API_KEY is required for AI enhancement. Set it in Vercel environment variables or enter it in PixelLab Settings.' 
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const prompt = `You are a world-class colorist and photo editor. Analyze this image's lighting, contrast, exposure, white balance, and tone.
Recommend exact adjustments to make this photo look polished and cinematic.
Return strictly a JSON object matching this schema:
{
  "summary": "Short 1-2 sentence assessment",
  "recommendedAdjustments": {
    "brightness": number between -40 and +40 (0 is neutral),
    "contrast": number between -30 and +50 (0 is neutral),
    "saturation": number between -30 and +50 (0 is neutral),
    "temperature": number between -40 and +40 (negative is cool, positive is warm),
    "sharpness": number between 0 and 50,
    "filterPreset": one of ["Original", "Vintage", "Cinematic", "Warm", "Cool", "Black & White", "Fade", "Vivid", "Soft Portrait", "Dramatic"]
  },
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"]
}`;

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
      data: parsed
    });

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error enhancing image.' });
  }
}
