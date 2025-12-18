// Currency conversion utilities with live exchange rates

const CACHE_KEY = 'currency_rates_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Fallback rates if API fails
const FALLBACK_RATES = {
  USD: 3.65,
  EUR: 4.0,
  GBP: 4.6,
  ILS: 1
};

/**
 * Fetch live exchange rates from API
 * Uses free exchangerate-api service
 */
async function fetchLiveRates() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/ILS');
    const data = await response.json();
    
    if (data && data.rates) {
      // Convert to ILS base (API gives us ILS to other currencies, we need reverse)
      return {
        USD: 1 / data.rates.USD,
        EUR: 1 / data.rates.EUR,
        GBP: 1 / data.rates.GBP,
        ILS: 1,
        lastUpdated: Date.now()
      };
    }
    
    throw new Error('Invalid API response');
  } catch (error) {
    console.warn('Failed to fetch live rates, using fallback:', error);
    return {
      ...FALLBACK_RATES,
      lastUpdated: Date.now(),
      isFallback: true
    };
  }
}

/**
 * Get exchange rates (cached for 1 hour)
 */
export async function getExchangeRates() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    
    if (cached) {
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.lastUpdated;
      
      // Use cache if less than 1 hour old
      if (age < CACHE_DURATION) {
        return parsed;
      }
    }
    
    // Fetch new rates
    const rates = await fetchLiveRates();
    localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
    return rates;
    
  } catch (error) {
    console.error('Error getting exchange rates:', error);
    return { ...FALLBACK_RATES, lastUpdated: Date.now(), isFallback: true };
  }
}

/**
 * Convert amount from one currency to ILS
 */
export async function convertToILS(amount, fromCurrency) {
  if (!amount || amount === 0) return 0;
  if (!fromCurrency || fromCurrency === 'ILS') return amount;
  
  const rates = await getExchangeRates();
  const rate = rates[fromCurrency] || FALLBACK_RATES[fromCurrency] || 1;
  
  return amount * rate;
}

/**
 * Convert amount from ILS to another currency
 */
export async function convertFromILS(amount, toCurrency) {
  if (!amount || amount === 0) return 0;
  if (!toCurrency || toCurrency === 'ILS') return amount;
  
  const rates = await getExchangeRates();
  const rate = rates[toCurrency] || FALLBACK_RATES[toCurrency] || 1;
  
  return amount / rate;
}

/**
 * Batch convert multiple investments to ILS
 */
export async function convertInvestmentsToILS(investments) {
  const rates = await getExchangeRates();
  
  return investments.map(inv => {
    const valueInOriginalCurrency = (inv.quantity || 0) * (inv.current_price || 0);
    const costInOriginalCurrency = (inv.quantity || 0) * (inv.purchase_price || 0);
    const dividendsInOriginalCurrency = inv.dividends || 0;
    
    const currency = inv.currency || 'ILS';
    const rate = rates[currency] || FALLBACK_RATES[currency] || 1;
    
    return {
      ...inv,
      valueInILS: valueInOriginalCurrency * rate,
      costInILS: costInOriginalCurrency * rate,
      dividendsInILS: dividendsInOriginalCurrency * rate,
      conversionRate: rate
    };
  });
}

/**
 * Get current rate for a specific currency
 */
export async function getRate(currency) {
  if (!currency || currency === 'ILS') return 1;
  const rates = await getExchangeRates();
  return rates[currency] || FALLBACK_RATES[currency] || 1;
}

/**
 * Force refresh rates (ignores cache)
 */
export async function refreshRates() {
  localStorage.removeItem(CACHE_KEY);
  return await getExchangeRates();
}

/**
 * Get rate info (including last update time)
 */
export async function getRateInfo() {
  const rates = await getExchangeRates();
  return {
    rates,
    lastUpdated: rates.lastUpdated,
    isFallback: rates.isFallback || false,
    age: Date.now() - rates.lastUpdated
  };
}