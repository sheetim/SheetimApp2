import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { symbols, type = 'stock' } = await req.json();
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return Response.json({ error: 'No symbols provided' }, { status: 400 });
    }

    const prices = {};

    // Get current USD/ILS exchange rate
    let usdToIls = 3.7;
    try {
      const fxResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (fxResponse.ok) {
        const fxData = await fxResponse.json();
        usdToIls = fxData.rates?.ILS || 3.7;
      }
    } catch (e) {
      console.error('Failed to fetch exchange rate:', e);
    }

    if (type === 'crypto') {
      const cryptoIds = symbols.map(s => s.toLowerCase()).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd,ils&include_24hr_change=true`
      );
      
      if (response.ok) {
        const data = await response.json();
        for (const [id, info] of Object.entries(data)) {
          prices[id.toUpperCase()] = {
            price_usd: info.usd,
            price_ils: info.ils || info.usd * usdToIls,
            change_24h: info.usd_24h_change || 0
          };
        }
      }
    } else {
      // Use Yahoo Finance API for stocks
      for (const symbol of symbols) {
        try {
          const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const result = data.chart?.result?.[0];
            if (result) {
              const meta = result.meta;
              const currentPrice = meta.regularMarketPrice;
              const previousClose = meta.previousClose || meta.chartPreviousClose;
              const change = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
              const currency = meta.currency;
              
              // Convert to ILS based on currency
              let priceInIls = currentPrice;
              if (currency === 'USD') {
                priceInIls = currentPrice * usdToIls;
              } else if (currency === 'ILA' || currency === 'ILS') {
                // Israeli stocks are in Agorot (ILA) - divide by 100
                priceInIls = currency === 'ILA' ? currentPrice / 100 : currentPrice;
              }
              
              prices[symbol] = {
                price_usd: currency === 'USD' ? currentPrice : currentPrice / usdToIls,
                price_ils: priceInIls,
                change_24h: change,
                currency: currency
              };
            }
          }
        } catch (e) {
          console.error(`Error fetching ${symbol}:`, e);
        }
      }
    }

    return Response.json({ 
      prices,
      usdToIls,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});