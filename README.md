# Netlify + HubSpot + Shopify Integration

Two Netlify Functions that receive form submissions from a Shopify custom form and push them into HubSpot.

## Setup

### 1. Set environment variables

Use the **Netlify UI** (Site settings → Environment variables) or the **Netlify CLI**:

```bash
netlify env:set HUB_SPOT_ACCESS_TOKEN "pat-eu1-xxxxx..."
```

> **Important:** Never commit secrets to `netlify.toml`. Environment variables declared in `netlify.toml` are **not available** to serverless functions. Always use the UI/CLI and ensure the variable scope includes **Functions**.

### 2. Deploy

Push to git. Netlify auto-detects `netlify/functions/` — no extra build config needed for simple JS functions.

```bash
git push origin main
```

### 3. Shopify form

- Copy `shopify-form.liquid` into your Shopify theme (as a section or snippet).
- Update `NETLIFY_BASE_URL` to your deployed Netlify site URL.
- Choose `INTEGRATION_MODE` (`crm` or `forms`).
- If using `forms` mode, also fill in `HUBSPOT_PORTAL_ID` and `HUBSPOT_FORM_GUID`.

## Functions

| Function | Path | API Used | Best For |
|----------|------|----------|----------|
| `submit-booking` | `/.netlify/functions/submit-booking` | HubSpot CRM **batch upsert** | Direct contact create/update, deduplicated by email |
| `submit-hubspot-form` | `/.netlify/functions/submit-hubspot-form` | HubSpot Forms API (authenticated secure endpoint) | Triggering HubSpot workflows, form analytics, and marketing automation |

### `submit-booking` (CRM API)
- Uses `POST /crm/v3/objects/contacts/batch/upsert`
- Automatically **creates or updates** the contact by `email`
- Returns `contactId` and whether the record was created or updated

### `submit-hubspot-form` (Forms API)
- Uses `POST https://api.hsforms.com/submissions/v3/integration/secure/submit/{portalId}/{formGuid}`
- Requires the same `HUB_SPOT_ACCESS_TOKEN`
- Triggers HubSpot form submission events, workflows, and thank-you messages

## Shopify form payload examples

### CRM mode
```json
POST /.netlify/functions/submit-booking
{
  "properties": {
    "email": "jane@example.com",
    "firstname": "Jane",
    "lastname": "Doe",
    "phone": "+1 555 0100",
    "message": "Looking for a massage"
  }
}
```

### Forms mode
```json
POST /.netlify/functions/submit-hubspot-form
{
  "portalId": "1234567",
  "formGuid": "abc123-def456",
  "fields": [
    { "name": "email", "value": "jane@example.com" },
    { "name": "firstname", "value": "Jane" }
  ],
  "context": {
    "pageUri": "https://store.com/pages/booking",
    "pageName": "Booking Page",
    "hutk": "hubspotutk cookie value"
  }
}
```

## CORS
Both functions return `Access-Control-Allow-Origin: *` so they work from any Shopify domain.

## Netlify-specific notes

- **Function directory:** `netlify/functions/` is the default and is used here.
- **No publish directory:** This repo is functions-only, so `netlify.toml` does not set a `publish` directory. If you add a frontend later, set `publish = "dist"` (or similar) and keep functions outside that folder.
- **Node version:** Netlify uses the Node version specified in `package.json` engines field or `.nvmrc`. For `fetch()` support (Node 18+), no extra config is needed on modern Netlify builds.
