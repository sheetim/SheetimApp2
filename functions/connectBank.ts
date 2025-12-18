import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bankName, authCode } = await req.json();

    if (!bankName || !authCode) {
      return Response.json({ 
        error: 'Bank name and auth code required' 
      }, { status: 400 });
    }

    // In production, exchange auth code for access token with bank's API
    // This is a mock implementation
    const mockAccessToken = `access_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockRefreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const expiresIn = 30 * 24 * 60 * 60 * 1000; // 30 days

    // Get account details from bank (mock)
    const accountNumber = '****' + Math.floor(1000 + Math.random() * 9000);
    const accountName = 'חשבון עו"ש';

    // Create bank connection
    const connection = await base44.entities.BankConnection.create({
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      connection_status: 'connected',
      access_token: mockAccessToken,
      refresh_token: mockRefreshToken,
      token_expires_at: new Date(Date.now() + expiresIn).toISOString(),
      last_sync_date: new Date().toISOString(),
      auto_sync: true,
      sync_frequency: 'daily'
    });

    // Trigger initial sync
    try {
      await base44.functions.invoke('syncBankTransactions', {
        connectionId: connection.id
      });
    } catch (syncError) {
      console.error('Initial sync failed:', syncError);
    }

    return Response.json({
      success: true,
      connection: {
        id: connection.id,
        bank_name: connection.bank_name,
        account_number: connection.account_number,
        account_name: connection.account_name,
        connection_status: connection.connection_status
      }
    });

  } catch (error) {
    console.error('Connect bank error:', error);
    
    // Detailed error response
    const errorMessage = error.message || 'Failed to connect bank';
    const errorDetails = {
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      suggestion: 'אנא נסה שוב. אם הבעיה נמשכת, פנה לתמיכה.'
    };
    
    return Response.json(errorDetails, { status: 500 });
  }
});