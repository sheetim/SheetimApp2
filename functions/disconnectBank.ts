import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

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
    const connections = await base44.entities.BankConnection.filter({ 
      id: connectionId 
    });
    const connection = connections[0];

    if (!connection) {
      return Response.json({ error: 'Connection not found' }, { status: 404 });
    }

    // In production, revoke access token with bank's API
    // For now, just update the status and clear tokens

    await base44.entities.BankConnection.update(connectionId, {
      connection_status: 'disconnected',
      access_token: null,
      refresh_token: null,
      token_expires_at: null
    });

    return Response.json({
      success: true,
      message: 'Bank disconnected successfully'
    });

  } catch (error) {
    console.error('Disconnect bank error:', error);
    
    const errorDetails = {
      error: error.message || 'Failed to disconnect bank',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      suggestion: 'שגיאה בניתוק החשבון. אנא נסה שוב.'
    };
    
    return Response.json(errorDetails, { status: 500 });
  }
});