# HubSpot + Shopify "Build Your Package" Integration

Custom Shopify page template that submits spa package bookings directly to HubSpot via the **Forms API** — no Netlify, no serverless functions, no Shopify apps.

## How It Works

1. Customer builds a spa package on the Shopify page:
   - **Step 1:** Select 1 massage
   - **Step 2:** Select 2+ add-ons
   - **Step 3:** Set number of people
2. Customer clicks **"Request a Booking"**
3. A custom modal opens with a booking form (Name, Email, Phone, Date, Branch, Message)
4. The form also shows a read-only preview of the selected package
5. On submit, JavaScript assembles a JSON payload and `fetch()` posts it directly to:
   ```
   POST https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}
   ```
6. HubSpot creates/updates the contact and triggers any attached workflows

## Files

| File | Purpose |
|------|---------|
| `build-package.html` | Shopify page template. Place in `templates/page.build-your-package.liquid` (or rename accordingly). Contains the full package builder + booking modal. |

## Setup

### 1. Upload the template to Shopify

- Rename `build-package.html` to `page.build-your-package.liquid`
- Upload it to your theme's `templates/` folder
- Create a new Shopify page and set its template to "page.build-your-package"

### 2. Configure HubSpot field mapping

The JavaScript sends these field names to HubSpot. **Update them** in the `fetch()` payload to match the exact internal field names in your HubSpot form (`fef0d83e-9157-4ac9-80a8-10f12468f238`):

| Data | Placeholder Field Name |
|------|------------------------|
| First name | `firstname` |
| Last name | `lastname` |
| Email | `email` |
| Phone | `phone` |
| Preferred date | `preferred_date` |
| Branch | `branch` |
| Message | `message` |
| Massage type | `massage_type` |
| Add-ons | `addons_selected` |
| Number of people | `number_of_people` |
| Total price | `total_price` |
| Total duration | `total_duration` |
| Package summary | `package_summary` |

> **Important:** The field names in the JavaScript `fields` array must exactly match the internal property names of your HubSpot form fields.

### 3. Branch options

The dropdown in the modal currently shows:
- Durban
- Umhlanga
- Ballito

Update the `<select name="branch">` options in `build-package.html` to match your actual locations.

## Why This Approach

| Requirement | Solution |
|-------------|----------|
| No Netlify / serverless | Direct `fetch()` from browser to HubSpot Forms API |
| No Shopify app | Pure Liquid + HTML + vanilla JS in theme template |
| No exposed API tokens | HubSpot Forms API is public by design; no token needed |
| Create/update HubSpot contacts | Forms API automatically creates or deduplicates by email |
| Trigger HubSpot workflows | Form submission events fire attached workflows |

## Technical Notes

- **CORS:** The HubSpot Forms API allows cross-origin requests from storefronts. No proxy needed.
- **Tracking:** If the HubSpot tracking script (`js-eu1.hs-scripts.com`) is loaded on your store, the `hubspotutk` cookie is captured and passed in the `context.hutk` field for attribution.
- **jQuery:** Included for compatibility with existing theme code, but the HubSpot submission uses vanilla JS `fetch()`.
- **Layout:** The template uses `{% layout none %}` because it contains a full `<html><head><body>` document. This prevents Shopify from wrapping it in `theme.liquid`.

## Previous Approach (Deprecated)

Earlier versions of this repo used:
- Netlify Functions + HubSpot CRM API
- Embedded HubSpot iframe forms with fragile cross-origin field injection
- External PHP endpoints (`submitform.php`)
- Gift form + draft order creation

All of these have been removed in favor of the direct, serverless Forms API approach.
