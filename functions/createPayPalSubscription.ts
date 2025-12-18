import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
const PAYPAL_API = "https://api-m.paypal.com"; // Use sandbox for testing: https://api-m.sandbox.paypal.com

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

async function createProduct(accessToken, planType) {
  const response = await fetch(`${PAYPAL_API}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: `Sheetim ${planType === 'pro' ? 'Pro' : 'Pro Plus'}`,
      description: `מנוי ${planType === 'pro' ? 'Pro' : 'Pro Plus'} לאפליקציית Sheetim`,
      type: "SERVICE",
      category: "SOFTWARE"
    })
  });
  return await response.json();
}

async function createPlan(accessToken, productId, planType, billingCycle, discountPercent = 0) {
  // Prices in USD (PayPal doesn't support ILS for subscriptions)
  const prices = {
    pro: { monthly: 7.99, yearly: 79.99 },
    pro_plus: { monthly: 11.99, yearly: 119.99 }
  };
  
  let price = prices[planType]?.[billingCycle] || 7.99;
  
  // Apply discount if exists
  if (discountPercent > 0) {
    price = price * (1 - discountPercent / 100);
  }
  
  const intervalUnit = billingCycle === 'yearly' ? 'YEAR' : 'MONTH';
  
  const response = await fetch(`${PAYPAL_API}/v1/billing/plans`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      product_id: productId,
      name: `Sheetim ${planType === 'pro' ? 'Pro' : 'Pro Plus'} - ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}${discountPercent > 0 ? ` (${discountPercent}% off)` : ''}`,
      billing_cycles: [
        {
          frequency: {
            interval_unit: intervalUnit,
            interval_count: 1
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: price.toFixed(2),
              currency_code: "USD"
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3
      }
    })
  });
  return await response.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planType, billingCycle, returnUrl, cancelUrl } = await req.json();
    
    if (!planType || !billingCycle) {
      return Response.json({ error: 'Missing planType or billingCycle' }, { status: 400 });
    }

    // Check for user discount
    const discountPercent = user.has_discount && user.discount_end_date && new Date(user.discount_end_date) > new Date() 
      ? user.discount_percent || 0 
      : 0;

    const accessToken = await getPayPalAccessToken();
    
    // Create or get product
    const product = await createProduct(accessToken, planType);
    
    // Create billing plan with discount if applicable
    const plan = await createPlan(accessToken, product.id, planType, billingCycle, discountPercent);
    
    // Create subscription
    const subscriptionResponse = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        plan_id: plan.id,
        subscriber: {
          name: {
            given_name: user.full_name?.split(' ')[0] || 'User',
            surname: user.full_name?.split(' ').slice(1).join(' ') || ''
          },
          email_address: user.email
        },
        application_context: {
          brand_name: "Sheetim",
          locale: "he-IL",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          return_url: returnUrl || `${req.headers.get('origin')}/UserSettings?subscription=success`,
          cancel_url: cancelUrl || `${req.headers.get('origin')}/UserSettings?subscription=cancelled`
        }
      })
    });
    
    const subscription = await subscriptionResponse.json();
    
    if (subscription.id) {
      // Save subscription ID to user
      await base44.auth.updateMe({
        paypal_subscription_id: subscription.id,
        pending_subscription_plan: planType,
        pending_billing_cycle: billingCycle
      });
    }
    
    return Response.json({
      subscriptionId: subscription.id,
      approvalUrl: subscription.links?.find(l => l.rel === 'approve')?.href
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});