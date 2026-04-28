/**
 * Netlify Function to handle spa booking submissions
 * Deploy to Netlify automatically when you push to git
 * 
 * Environment variable:
 * HUB_SPOT_ACCESS_TOKEN = pat-eu1-xxxxx...
 */

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { contact, portalId } = JSON.parse(event.body);
    const HUBSPOT_TOKEN = process.env.HUB_SPOT_ACCESS_TOKEN;

    // Validate required data
    if (!contact || !contact.properties) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing contact data' 
        })
      };
    }

    if (!contact.properties.email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          success: false, 
          error: 'Email is required' 
        })
      };
    }

    if (!HUBSPOT_TOKEN) {
      console.error('HubSpot token not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          success: false, 
          error: 'Server configuration error' 
        })
      };
    }

    // Create contact in HubSpot
    const response = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contact)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('HubSpot error:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          success: false, 
          error: data.message || 'Failed to create contact' 
        })
      };
    }

    // Success
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Booking submitted successfully',
        contactId: data.id 
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
};
