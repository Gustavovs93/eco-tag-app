// netlify/functions/get-env.js
exports.handler = async function(event, context) {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            VITE_PAYPAL_CLIENT_ID: process.env.VITE_PAYPAL_CLIENT_ID,
            NODE_ENV: process.env.NODE_ENV,
            URL: process.env.URL,
            SITE_NAME: process.env.SITE_NAME,
            CONTACT_EMAIL: process.env.CONTACT_EMAIL
        })
    };
};