const VOICEGAIN_URL = "https://api.voicegain.ai/v1/asr/transcribe";
const MAX_URL_LENGTH = 2048;

function sendError(res, status, error) {
  return res.status(status).json({ ok: false, error });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(res, 405, "Method not allowed");
  }

  const expectedSecret = process.env.TRANSCRIBE_SECRET;
  if (expectedSecret) {
    const suppliedSecret = req.headers["x-transcribe-secret"];
    if (suppliedSecret !== expectedSecret) {
      return sendError(res, 401, "Unauthorized");
    }
  }

  const apiKey = process.env.VOICEGAIN_API_KEY;
  if (!apiKey) {
    return sendError(res, 503, "Voicegain is not configured");
  }

  const { audioUrl } = req.body || {};
  if (typeof audioUrl !== "string" || audioUrl.length > MAX_URL_LENGTH) {
    return sendError(res, 400, "Send a valid audioUrl in the JSON body");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(audioUrl);
  } catch {
    return sendError(res, 400, "audioUrl must be a valid URL");
  }

  if (parsedUrl.protocol !== "https:") {
    return sendError(res, 400, "Only HTTPS audio URLs are accepted");
  }

  try {
    const upstream = await fetch(VOICEGAIN_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        audio: {
          source: {
            fromUrl: { url: parsedUrl.toString() }
          }
        },
        settings: {
          asr: {
            languages: ["he"],
            model: "whisper"
          }
        }
      })
    });

    const raw = await upstream.text();
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      result = null;
    }

    if (!upstream.ok) {
      return res.status(502).json({
        ok: false,
        error: "Voicegain request failed",
        providerStatus: upstream.status,
        details: result || raw.slice(0, 500)
      });
    }

    const text =
      result?.result?.alternatives?.[0]?.utterance ??
      result?.result?.transcript ??
      result?.transcript ??
      "";

    if (!text) {
      return res.status(200).json({
        ok: true,
        status: result?.result?.status || "NO_MATCH",
        text: "",
        providerResult: result
      });
    }

    return res.status(200).json({
      ok: true,
      status: result?.result?.status || "MATCH",
      text,
      confidence: result?.result?.alternatives?.[0]?.confidence ?? null
    });
  } catch (error) {
    return sendError(res, 502, "Could not reach Voicegain");
  }
}
