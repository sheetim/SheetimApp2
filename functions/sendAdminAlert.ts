import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { alertType, title, message, severity, relatedUserEmail, relatedAmount, metadata } = await req.json();

    if (!alertType || !title || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get all admin alert settings
    const adminSettings = await base44.asServiceRole.entities.AdminAlertSettings.filter({});
    
    // Get admins who want this type of alert
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

    // Create alert record
    const alert = await base44.asServiceRole.entities.AdminAlert.create({
      alert_type: alertType,
      title,
      message,
      severity: severity || 'medium',
      related_user_email: relatedUserEmail,
      related_amount: relatedAmount,
      metadata: metadata || {},
      is_read: false,
      is_resolved: false,
      created_by: 'system@sheetim.com'
    });

    // Send email to admins who enabled email notifications
    const emailPromises = interestedAdmins
      .filter(admin => admin.email_notifications)
      .map(admin => 
        base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.admin_email,
          subject: `[Sheetim Admin] ${severityEmoji(severity)} ${title}`,
          body: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: ${severityColor(severity)}; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                <h2 style="margin: 0;">${severityEmoji(severity)} ${title}</h2>
              </div>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; color: #333;">${message}</p>
                ${relatedUserEmail ? `<p><strong>משתמש:</strong> ${relatedUserEmail}</p>` : ''}
                ${relatedAmount ? `<p><strong>סכום:</strong> ₪${relatedAmount}</p>` : ''}
                <p style="font-size: 12px; color: #666; margin-top: 20px;">
                  ${new Date().toLocaleString('he-IL')}
                </p>
                <a href="https://app.base44.com" style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 15px;">
                  צפה בדשבורד
                </a>
              </div>
            </div>
          `
        })
      );

    await Promise.all(emailPromises);

    return Response.json({ 
      success: true, 
      alertId: alert.id,
      notifiedAdmins: interestedAdmins.length 
    });

  } catch (error) {
    console.error('Admin alert error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function severityEmoji(severity) {
  return {
    'low': 'ℹ️',
    'medium': '⚠️',
    'high': '🔴',
    'critical': '🚨'
  }[severity] || '⚠️';
}

function severityColor(severity) {
  return {
    'low': '#3b82f6',
    'medium': '#f59e0b',
    'high': '#ef4444',
    'critical': '#7c2d12'
  }[severity] || '#f59e0b';
}