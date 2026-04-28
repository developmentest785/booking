/**
 * Netlify Function: submit-hubspot-form
 * Submits to a HubSpot form via the authenticated Forms API.
 * This triggers HubSpot form submission events, workflows, and tracking.
 *
 * Environment variable:
 *   HUB_SPOT_ACCESS_TOKEN = pat-eu1-xxxxx...
 *
 * Shopify usage:
 *   POST https://<site>.netlify.app/.netlify/functions/submit-hubspot-form
 *   Body: {
 *     "portalId": "1234567",
 *     "formGuid": "abc-def-...",
 *     "fields": [
 *       { "name": "email", "value": "..." },
 *       { "name": "firstname", "value": "..." }
 *     ],
 *     "context": { "pageUri": "...", "pageName": "...", "hutk": "..." }
 *   }
 */

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { portalId, formGuid, fields, context = {} } = JSON.parse(event.body || '{}');

    if (!portalId || !formGuid) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'portalId and formGuid are required' }),
      };
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'fields array is required' }),
      };
    }

    const token = process.env.HUB_SPOT_ACCESS_TOKEN;
    if (!token) {
      console.error('HUB_SPOT_ACCESS_TOKEN is not set');
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Server configuration error' }),
      };
    }

    const payload = {
      fields,
      context: {
        pageUri: context.pageUri || 'https://shopify-store.com',
        pageName: context.pageName || 'Shopify Store',
        ...context,
      },
    };

    const response = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/secure/submit/${portalId}/${formGuid}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('HubSpot Forms API error:', JSON.stringify(data));
      const message = data?.message || data?.errors?.[0]?.message || 'Form submission failed';
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: message }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: data.inlineMessage || 'Form submitted successfully',
        redirectUrl: data.redirectUrl || null,
      }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
