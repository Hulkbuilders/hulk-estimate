// POST /api/submit-form
// Body JSON: dados do form da landing
// Registra submissão + notifica Rodrigo + salva em Google Sheets (se configurado)
// Se RESEND_API_KEY configurado, manda email formatado pro Rodrigo

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const data = req.body;
  if (!data || !data.email || !data.address) {
    return res.status(400).json({ error: 'Missing required fields (email, address)' });
  }

  const submission = {
    type: 'submit',
    at: new Date().toISOString(),
    id: `REQ-${Date.now()}`,
    ...data,
    ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
  };

  console.log('[SUBMIT-FORM]', JSON.stringify(submission));

  // Google Sheets webhook (banco leve, grátis)
  const sheetsUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (sheetsUrl) {
    try {
      await fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
    } catch (e) { console.error('[SUBMIT-FORM] sheets failed:', e.message); }
  }

  // Notificação instant (WhatsApp/Telegram webhook)
  const notifyUrl = process.env.RODRIGO_NOTIFY_URL;
  if (notifyUrl) {
    try {
      await fetch(notifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `📥 NEW ESTIMATE REQUEST!\n\n${data.name} · ${data.email} · ${data.phone}\n${data.address}\n${data.project_type || ''}\n\nBudget: $${(data.budget && data.budget.total) || 0}`
        }),
      });
    } catch (e) { console.error('[SUBMIT-FORM] notify failed:', e.message); }
  }

  // Email pro Rodrigo via Resend (quando configurado)
  const resendKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'noreply@hulkbuilders.com';
  const emailTo   = process.env.EMAIL_TO   || 'contact@hulkbuilders.com';

  if (resendKey) {
    const emailBody = `New estimate request received.

═══ CONTACT ═══
Name: ${data.name}
Company: ${data.company || '(not provided)'}
Email: ${data.email}
Phone: ${data.phone}

═══ PROJECT ═══
Address: ${data.address}
Type: ${data.project_type || '(not specified)'}
Permit #: ${data.permit_number || '(none)'}

Scope:
${data.scope || '(not provided)'}

═══ BUDGET ═══
Framing:         $${(data.budget && data.budget.framing) || 0}
Exterior finish: $${(data.budget && data.budget.exterior_finish) || 0}
Interior paint:  $${(data.budget && data.budget.interior_paint) || 0}
Exterior paint:  $${(data.budget && data.budget.exterior_paint) || 0}
─────────────────────────
Total:           $${(data.budget && data.budget.total) || 0}

═══ TIMELINE ═══
Start:    ${(data.timeline && data.timeline.start) || '(flexible)'}
Deadline: ${(data.timeline && data.timeline.deadline) || '(flexible)'}

═══ NOTES ═══
${data.notes || '(none)'}

—
Submitted via Hulk Builders online form
${new Date().toLocaleString()}
Request ID: ${submission.id}
Referred by permit ID: ${data.ref_permit_id || '(direct)'}`;

    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Hulk Builders <${emailFrom}>`,
          to: [emailTo],
          reply_to: data.email,
          subject: `📥 New Estimate Request — ${data.name} — ${data.address}`,
          text: emailBody,
        }),
      });

      if (!emailRes.ok) {
        const err = await emailRes.text();
        console.error('[SUBMIT-FORM] Resend failed:', emailRes.status, err);
      }
    } catch (e) {
      console.error('[SUBMIT-FORM] Resend exception:', e.message);
    }
  }

  res.status(200).json({
    success: true,
    id: submission.id,
    message: 'Request received. Rodrigo will get back to you within 48 hours.'
  });
}
