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

    // In production, use refresh token to get new access token from bank's API
    // This is a mock implementation
    const newAccessToken = `access_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newRefreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const expiresIn = 30 * 24 * 60 * 60 * 1000; // 30 days

    // Update connection with new tokens
    await base44.entities.BankConnection.update(connectionId, {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      token_expires_at: new Date(Date.now() + expiresIn).toISOString(),
      connection_status: 'connected'
    });

    return Response.json({
      success: true,
      message: 'Token refreshed successfully',
      expiresAt: new Date(Date.now() + expiresIn).toISOString()
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    
    // Mark connection as error if refresh fails
    try {
      await base44.entities.BankConnection.update(connectionId, {
        connection_status: 'error'
      });
    } catch (updateError) {
      console.error('Failed to update connection status:', updateError);
    }

    const errorDetails = {
      error: error.message || 'Failed to refresh token',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      connectionId,
      suggestion: 'לא ניתן לרענן את הטוקן. אנא התחבר מחדש לחשבון הבנק.'
    };
    
    return Response.json(errorDetails, { status: 500 });
  }
});