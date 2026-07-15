// GET /api/track-click?ref=1&contractor=Paul&address=148%20Waverley
// Registra clique no link do outreach (chamado pela landing no page load)
// Retorna 1x1 pixel transparente pra poder ser usado em <img src="/api/track-click?ref=1">

export default async function handler(req, res) {
  const { ref, contractor, address, permit, source } = req.query;

  const event = {
    type: 'click',
    at: new Date().toISOString(),
    ref: ref || null,
    contractor: contractor || null,
    address: address || null,
    permit: permit || null,
    source: source || 'link',
    ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    referer: req.headers['referer'] || null,
  };

  // Log estruturado — Vercel captura tudo em /logs
  console.log('[TRACK-CLICK]', JSON.stringify(event));

  // Se GOOGLE_SHEETS_WEBHOOK_URL configurado, envia (não bloqueia resposta)
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }).catch(err => console.error('[TRACK-CLICK] webhook failed:', err.message));
    } catch (e) { /* silent */ }
  }

  // Se RODRIGO_NOTIFY_URL configurado (webhook de WhatsApp/Telegram/etc), notifica
  const notifyUrl = process.env.RODRIGO_NOTIFY_URL;
  if (notifyUrl && contractor) {
    try {
      fetch(notifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🔗 Click! ${decodeURIComponent(contractor)} abriu o link (${decodeURIComponent(address || '')})`
        }),
      }).catch(err => console.error('[TRACK-CLICK] notify failed:', err.message));
    } catch (e) { /* silent */ }
  }

  // Retorna 1x1 pixel transparente PNG
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=', 'base64');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.status(200).send(pixel);
}
