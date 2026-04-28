/**
 * Netlify Function: submit-booking
 * Creates or updates a HubSpot contact using the CRM batch upsert API.
 *
 * Environment variable:
 *   HUB_SPOT_ACCESS_TOKEN = pat-eu1-xxxxx...
 *
 * Shopify usage:
 *   POST https://<site>.netlify.app/.netlify/functions/submit-booking
 *   Body: { "properties": { "email": "...", "firstname": "...", ... } }
 */

const HUBSPOT_API = 'https://api.hubapi.com';

exports.handler = async (event) => {
  // CORS preflight
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
    const body = JSON.parse(event.body || '{}');
    const properties = body.properties || body.contact?.properties || {};
    const email = properties.email;

    if (!email) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Email is required' }),
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

    // Use batch upsert so we create OR update by email automatically
    const upsertPayload = {
      inputs: [
        {
          id: email,
          idProperty: 'email',
          properties,
        },
      ],
    };

    const response = await fetch(
      `${HUBSPOT_API}/crm/v3/objects/contacts/batch/upsert`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(upsertPayload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('HubSpot upsert error:', JSON.stringify(data));
      const message = data?.message || 'Failed to create or update contact';
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: message }),
      };
    }

    const result = data.results?.[0];

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: result?.updated ? 'Contact updated' : 'Contact created',
        contactId: result?.id,
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
