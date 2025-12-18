import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
const PAYPAL_API = "https://api-m.paypal.com";

async function getPayPalAccessToken() {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const data = await response.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reason } = await req.json();
    
    if (!user.paypal_subscription_id) {
      return Response.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();
    
    // Cancel subscription at end of billing period
    const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${user.paypal_subscription_id}/cancel`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reason: reason || "User requested cancellation"
      })
    });

    if (response.status === 204 || response.ok) {
      // Update user - mark as cancel at period end
      await base44.auth.updateMe({
        cancel_at_period_end: true
      });

      return Response.json({ success: true, message: 'Subscription will be cancelled at end of billing period' });
    } else {
      const error = await response.json();
      return Response.json({ error: error.message || 'Failed to cancel subscription' }, { status: 500 });
    }
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});