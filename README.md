# Yemot Voicegain

A Vercel Node.js API starter that sends an HTTPS audio recording URL to Voicegain and returns recognized Hebrew text.

## Current scope

- `GET /api/health` — checks that the service is running and whether the Voicegain key is configured.
- `POST /api/transcribe` — sends an audio URL to Voicegain and returns JSON containing the transcript.
- The Voicegain API key stays on the server in a Vercel environment variable.
- The request selects Hebrew and the Voicegain Whisper model.

**Important:** this first version accepts a publicly reachable HTTPS `audioUrl`. It does not yet download private recordings from a Yemot account or emit a Yemot `type=api` response. Those parts require confirming the exact recording path and desired IVR response format before wiring them in.

## Deploy to Vercel

1. Import this GitHub repository into Vercel.
2. In Vercel → Project → Settings → Environment Variables, add:
   - `VOICEGAIN_API_KEY` — your Voicegain project API key.
   - `TRANSCRIBE_SECRET` — optional protection. If set, callers must send it in the `x-transcribe-secret` header.
3. Deploy or redeploy the project.

Do not put API keys in GitHub, IVR menu text, or a URL sent to callers.

## Test

Health check:

```bash
curl https://YOUR-PROJECT.vercel.app/api/health
```

Transcribe a publicly reachable HTTPS audio file:

```bash
curl -X POST https://YOUR-PROJECT.vercel.app/api/transcribe \
  -H "Content-Type: application/json" \
  -H "x-transcribe-secret: YOUR_SECRET" \
  -d '{"audioUrl":"https://example.com/recording.wav"}'
```

Successful response:

```json
{
  "ok": true,
  "status": "MATCH",
  "text": "הטקסט שזוהה",
  "confidence": 0.9
}
```

Remove the `x-transcribe-secret` header from the example if you did not configure `TRANSCRIBE_SECRET`.

## Free credit and cost protection

Voicegain advertises a one-time $50 starting credit and usage-based cloud pricing. This repository does not meter or cap account credit. To avoid paid usage after the credit is consumed, do not add a payment method to the Voicegain account unless you intend to pay, and monitor the provider billing console. Revoke the API key when the project is no longer used.
