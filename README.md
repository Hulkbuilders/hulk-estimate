# Hulk Builders — Estimate Landing + Tracking

Public landing page for contractors to submit estimate requests to Rodrigo Salgado, Hulk Builders LLC (MA Licensed GC, Worcester).

**Live:** https://hulkbuilders.github.io/hulk-estimate/ (static) OR https://hulk-estimate.vercel.app/ (com backend tracking)

## Endpoints da API (Vercel Serverless)

### GET /api/track-click
Rastreia cliques no link do outreach.

Query params: `ref`, `contractor`, `address`, `permit`, `source`

Retorna 1x1 pixel PNG (pode ser usado em `<img>`).

### POST /api/submit-form
Recebe submissão do form.

Body JSON: dados do form (name, email, phone, address, scope, budget, timeline, notes, ref_permit_id)

## Environment Variables (Vercel dashboard)

| Var | Descrição | Obrigatório |
|---|---|---|
| `RESEND_API_KEY` | API key do Resend (email) | opcional — sem ela, submits só logam |
| `EMAIL_FROM` | Email de envio (ex: noreply@hulkbuilders.com) | usa `noreply@hulkbuilders.com` como default |
| `EMAIL_TO` | Email do Rodrigo (destinatário) | usa `contact@hulkbuilders.com` como default |
| `GOOGLE_SHEETS_WEBHOOK_URL` | Apps Script webhook pra salvar em Sheet | opcional — sem ela, só logs Vercel |
| `RODRIGO_NOTIFY_URL` | Webhook pra WhatsApp/Telegram bot | opcional |

## Deploy

1. Import repo `Hulkbuilders/hulk-estimate` em [vercel.com/new](https://vercel.com/new)
2. Framework: **Other**
3. Root: `.`
4. Deploy
5. Adicionar env vars quando quiser ativar Resend

Contact: (508) 596-5050 · contact@hulkbuilders.com · Worcester, MA
