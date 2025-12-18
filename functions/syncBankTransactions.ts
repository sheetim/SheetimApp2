import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Credit card billing date calculation
const calculateBillingDate = (transactionDate, billingDay = 10) => {
  if (!transactionDate) return '';
  
  const transDate = new Date(transactionDate);
  const billingDate = new Date(transDate);
  billingDate.setDate(billingDay);
  
  if (transDate.getDate() >= billingDay) {
    billingDate.setMonth(billingDate.getMonth() + 1);
  }
  
  return billingDate.toISOString().split('T')[0];
};

const isCreditCardTransaction = (description) => {
  if (!description) return false;
  
  const lower = description.toLowerCase();
  const keywords = [
    'כרטיס', 'visa', 'mastercard', 'אשראי', 'max', 'cal', 'ישראכרט',
    'לאומי קארד', 'דיינרס', 'אמריקן אקספרס'
  ];
  
  return keywords.some(keyword => lower.includes(keyword));
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectionId } = await req.json();

    if (!connectionId) {
      return Response.json({ error: 'Connection ID required' }, { status: 400 });
    }

    // Get bank connection
    const connections = await base44.entities.BankConnection.filter({ id: connectionId });
    const connection = connections[0];

    if (!connection) {
      return Response.json({ error: 'Connection not found' }, { status: 404 });
    }

    if (connection.connection_status !== 'connected') {
      return Response.json({ error: 'Connection not active' }, { status: 400 });
    }

    // Check token expiration
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
      return Response.json({ 
        error: 'Token expired', 
        requiresReauth: true 
      }, { status: 401 });
    }

    // Fetch user preferences for billing day
    const userPrefs = await base44.entities.UserPreferences.filter({ created_by: user.email });
    const billingDay = userPrefs[0]?.credit_card_billing_day || 10;

    // Simulate fetching transactions from bank API
    // In production, this would call the actual bank's Open Banking API
    const mockTransactions = [];
    const categories = [
      'מזון_ומשקאות', 
      'תחבורה', 
      'קניות', 
      'שירותים', 
      'בילויים',
      'דיור',
      'בריאות',
      'חינוך'
    ];
    
    const descriptions = {
      'מזון_ומשקאות': ['סופרמרקט', 'מסעדה', 'קפה', 'מאפייה'],
      'תחבורה': ['דלק', 'חניה', 'תחבורה ציבורית', 'מונית'],
      'קניות': ['ביגוד', 'אלקטרוניקה', 'ריהוט', 'מתנות'],
      'שירותים': ['חשמל', 'מים', 'אינטרנט', 'סלולרי'],
      'בילויים': ['קולנוע', 'תיאטרון', 'ספורט', 'בידור'],
      'דיור': ['שכר דירה', 'ועד בית', 'ארנונה'],
      'בריאות': ['קופת חולים', 'בית מרקחת', 'רופא'],
      'חינוך': ['שכר לימוד', 'ספרים', 'קורסים']
    };

    const paymentMethods = ['מזומן', 'כרטיס_אשראי', 'העברה_בנקאית', 'כרטיס_אשראי', 'כרטיס_אשראי']; // More credit card transactions

    const now = new Date();
    const numTransactions = Math.floor(Math.random() * 15) + 5;

    for (let i = 0; i < numTransactions; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      const category = categories[Math.floor(Math.random() * categories.length)];
      const categoryDescriptions = descriptions[category] || ['עסקה'];
      const description = categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
      
      const isIncome = Math.random() > 0.7;
      const payment_method = isIncome ? 'העברה_בנקאית' : paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      const transactionDate = date.toISOString().split('T')[0];
      let billing_date = '';
      
      // Calculate billing date for credit card transactions
      if (payment_method === 'כרטיס_אשראי') {
        billing_date = calculateBillingDate(transactionDate, billingDay);
      }
      
      mockTransactions.push({
        type: isIncome ? 'income' : 'expense',
        amount: isIncome 
          ? Math.floor(Math.random() * 5000) + 1000 
          : Math.floor(Math.random() * 500) + 50,
        category: isIncome ? 'משכורת' : category,
        description: `${description} - ${connection.bank_name}`,
        date: transactionDate,
        payment_method: payment_method,
        billing_date: billing_date,
        is_recurring: Math.random() > 0.85
      });
    }

    // Create transactions in database
    let createdCount = 0;
    if (mockTransactions.length > 0) {
      await base44.entities.Transaction.bulkCreate(
        mockTransactions.map(t => ({ ...t, created_by: user.email }))
      );
      createdCount = mockTransactions.length;
    }

    // Update connection last sync date
    await base44.entities.BankConnection.update(connectionId, {
      last_sync_date: new Date().toISOString(),
      connection_status: 'connected'
    });

    return Response.json({
      success: true,
      transactionsCount: createdCount,
      lastSync: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sync error:', error);
    
    // Detailed error response with recovery suggestions
    const errorMessage = error.message || 'Failed to sync transactions';
    const errorDetails = {
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      connectionId,
      suggestion: error.message?.includes('not found') 
        ? 'החיבור לא נמצא. אנא חבר מחדש את חשבון הבנק.'
        : error.message?.includes('expired')
        ? 'תוקף הטוקן פג. אנא חבר מחדש את חשבון הבנק.'
        : 'שגיאה בסנכרון. אנא נסה שוב מאוחר יותר.'
    };
    
    return Response.json(errorDetails, { status: 500 });
  }
});