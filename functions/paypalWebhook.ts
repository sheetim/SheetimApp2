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

async function verifyWebhookSignature(req, body) {
  // In production, verify webhook signature using PayPal's API
  // For now, we'll trust the webhook
  return true;
}

async function sendAdminAlert(base44, { alertType, title, message, severity, relatedUserEmail, relatedAmount }) {
  try {
    // Get admin settings
    const adminSettings = await base44.asServiceRole.entities.AdminAlertSettings.filter({});
    
    const alertTypeToSetting = {
      'payment_failed': 'payment_failed',
      'subscription_cancelled': 'subscription_cancelled',
      'revenue_milestone': 'revenue_milestone',
      'suspicious_activity': 'suspicious_activity',
      'new_subscription': 'new_subscription',
      'trial_expired': 'trial_expired'
    };

    const settingKey = alertTypeToSetting[alertType];
    const interestedAdmins = adminSettings.filter(s => s[settingKey] === true);

    if (interestedAdmins.length === 0) return;

    // Create alert record
    await base44.asServiceRole.entities.AdminAlert.create({
      alert_type: alertType,
      title,
      message,
      severity: severity || 'medium',
      related_user_email: relatedUserEmail,
      related_amount: relatedAmount,
      is_read: false,
      is_resolved: false,
      created_by: 'system@sheetim.com'
    });

    // Send emails
    const severityEmoji = { low: 'ℹ️', medium: '⚠️', high: '🔴', critical: '🚨' }[severity] || '⚠️';
    
    for (const admin of interestedAdmins.filter(a => a.email_notifications)) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.admin_email,
        subject: `[Sheetim Admin] ${severityEmoji} ${title}`,
        body: `<div dir="rtl"><h2>${severityEmoji} ${title}</h2><p>${message}</p>${relatedUserEmail ? `<p>משתמש: ${relatedUserEmail}</p>` : ''}${relatedAmount ? `<p>סכום: ₪${relatedAmount}</p>` : ''}</div>`
      });
    }
  } catch (e) {
    console.error('Failed to send admin alert:', e);
  }
}

Deno.serve(async (req) => {
  try {
    // Create base44 client - webhooks don't have user auth
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    
    // Verify webhook signature (PayPal sends signature in headers)
    const isValid = await verifyWebhookSignature(req, body);
    if (!isValid) {
      console.log('Webhook signature validation skipped for now');
      // In production, uncomment: return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const eventType = body.event_type;
    const resource = body.resource;

    console.log(`PayPal Webhook: ${eventType}`, resource);

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.RENEWED': {
        // Subscription activated or renewed - activate user's plan
        const subscriptionId = resource.id;
        const subscriberEmail = resource.subscriber?.email_address;
        
        if (subscriberEmail) {
          // Find user by email and update their subscription
          const users = await base44.asServiceRole.entities.User.filter({ email: subscriberEmail });
          if (users.length > 0) {
            const user = users[0];
            const endDate = new Date();
            
            // Set end date based on billing cycle
            if (user.pending_billing_cycle === 'yearly') {
              endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
              endDate.setMonth(endDate.getMonth() + 1);
            }

            // Apply discount if exists
            let finalPlan = user.pending_subscription_plan || 'pro';
            
            await base44.asServiceRole.entities.User.update(user.id, {
              subscription_plan: finalPlan,
              billing_cycle: user.pending_billing_cycle || 'monthly',
              subscription_status: 'active',
              subscription_start_date: new Date().toISOString().split('T')[0],
              subscription_end_date: endDate.toISOString().split('T')[0],
              paypal_subscription_id: subscriptionId,
              cancel_at_period_end: false,
              pending_subscription_plan: null,
              pending_billing_cycle: null
            });

            // Create billing history record
            const amountUSD = parseFloat(resource.billing_info?.last_payment?.amount?.value || 0);
            const amountILS = Math.round(amountUSD * 3.7); // Convert USD to ILS approximately
            
            await base44.asServiceRole.entities.BillingHistory.create({
              transaction_id: `paypal_${subscriptionId}_${Date.now()}`,
              amount: amountILS,
              currency: 'ILS',
              plan_type: finalPlan,
              billing_cycle: user.pending_billing_cycle || 'monthly',
              status: 'completed',
              payment_method: 'PayPal',
              payment_date: new Date().toISOString().split('T')[0],
              description: `חידוש מנוי ${finalPlan}`,
              created_by: user.email
            });

            // Create notification for user
            await base44.asServiceRole.entities.Notification.create({
              title: 'המנוי חודש בהצלחה! 🎉',
              message: `המנוי שלך ל-${finalPlan === 'pro' ? 'Pro' : 'Pro Plus'} חודש בהצלחה.`,
              type: 'subscription',
              priority: 'medium',
              created_by: user.email
            });

            // Send admin alert for new/renewed subscription
            await sendAdminAlert(base44, {
              alertType: eventType === 'BILLING.SUBSCRIPTION.ACTIVATED' ? 'new_subscription' : 'new_subscription',
              title: eventType === 'BILLING.SUBSCRIPTION.ACTIVATED' ? 'מנוי חדש!' : 'חידוש מנוי',
              message: `המשתמש ${user.email} ${eventType === 'BILLING.SUBSCRIPTION.ACTIVATED' ? 'הצטרף למנוי' : 'חידש את המנוי'} ${finalPlan === 'pro' ? 'Pro' : 'Pro Plus'}`,
              severity: 'low',
              relatedUserEmail: user.email,
              relatedAmount: amountILS
            });
          }
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        // Subscription cancelled or expired
        const subscriptionId = resource.id;
        const subscriberEmail = resource.subscriber?.email_address;
        
        if (subscriberEmail) {
          const users = await base44.asServiceRole.entities.User.filter({ email: subscriberEmail });
          if (users.length > 0) {
            const user = users[0];
            
            await base44.asServiceRole.entities.User.update(user.id, {
              subscription_plan: 'free',
              subscription_status: 'cancelled',
              paypal_subscription_id: null,
              cancel_at_period_end: false
            });

            await base44.asServiceRole.entities.Notification.create({
              title: 'המנוי בוטל',
              message: 'המנוי שלך בוטל. עברת לתוכנית החינם.',
              type: 'subscription',
              priority: 'high',
              created_by: user.email
            });

            // Send admin alert
            await sendAdminAlert(base44, {
              alertType: 'subscription_cancelled',
              title: 'ביטול מנוי',
              message: `המשתמש ${user.email} ביטל את המנוי שלו`,
              severity: 'medium',
              relatedUserEmail: user.email
            });
          }
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        // Payment failed
        const subscriberEmail = resource.subscriber?.email_address;
        
        if (subscriberEmail) {
          const users = await base44.asServiceRole.entities.User.filter({ email: subscriberEmail });
          if (users.length > 0) {
            const user = users[0];
            
            await base44.asServiceRole.entities.User.update(user.id, {
              subscription_status: 'payment_failed',
              payment_retry_count: (user.payment_retry_count || 0) + 1
            });

            await base44.asServiceRole.entities.Notification.create({
              title: '⚠️ התשלום נכשל',
              message: 'התשלום עבור המנוי נכשל. אנא עדכן את פרטי התשלום שלך.',
              type: 'payment',
              priority: 'high',
              action_url: '/UserSettings?tab=subscription',
              created_by: user.email
            });

            // Send admin alert for failed payment
            await sendAdminAlert(base44, {
              alertType: 'payment_failed',
              title: 'כישלון תשלום',
              message: `התשלום של ${user.email} נכשל (ניסיון ${(user.payment_retry_count || 0) + 1}/3)`,
              severity: 'high',
              relatedUserEmail: user.email
            });

            // If payment failed 3 times, cancel subscription
            if ((user.payment_retry_count || 0) >= 2) {
              await base44.asServiceRole.entities.User.update(user.id, {
                subscription_plan: 'free',
                subscription_status: 'cancelled',
                paypal_subscription_id: null,
                payment_retry_count: 0
              });
            }
          }
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        // Subscription suspended due to payment issues
        const subscriberEmail = resource.subscriber?.email_address;
        
        if (subscriberEmail) {
          const users = await base44.asServiceRole.entities.User.filter({ email: subscriberEmail });
          if (users.length > 0) {
            await base44.asServiceRole.entities.User.update(users[0].id, {
              subscription_status: 'suspended'
            });

            await base44.asServiceRole.entities.Notification.create({
              title: '⚠️ המנוי הושהה',
              message: 'המנוי שלך הושהה בגלל בעיית תשלום. אנא עדכן את פרטי התשלום.',
              type: 'payment',
              priority: 'high',
              action_url: '/UserSettings?tab=subscription',
              created_by: users[0].email
            });

            // Send admin alert
            await sendAdminAlert(base44, {
              alertType: 'payment_failed',
              title: 'מנוי הושהה',
              message: `המנוי של ${users[0].email} הושהה עקב בעיית תשלום`,
              severity: 'critical',
              relatedUserEmail: users[0].email
            });
          }
        }
        break;
      }
    }

    return Response.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});