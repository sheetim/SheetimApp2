import { differenceInDays } from "date-fns";
import _ from "lodash";

export const knownVendors = {
  'NETFLIX': { name: 'Netflix', category: 'streaming', emoji: '🎬' },
  'SPOTIFY': { name: 'Spotify', category: 'streaming', emoji: '🎵' },
  'APPLE': { name: 'Apple', category: 'software', emoji: '🍎' },
  'GOOGLE': { name: 'Google One', category: 'software', emoji: '🔵' },
  'AMAZON': { name: 'Amazon Prime', category: 'streaming', emoji: '📦' },
  'DISNEY': { name: 'Disney+', category: 'streaming', emoji: '🏰' },
  'HBO': { name: 'HBO Max', category: 'streaming', emoji: '🎭' },
  'YES': { name: 'Yes', category: 'telecom', emoji: '📺' },
  'HOT': { name: 'HOT', category: 'telecom', emoji: '📡' },
  'PARTNER': { name: 'פרטנר', category: 'telecom', emoji: '📱' },
  'CELLCOM': { name: 'סלקום', category: 'telecom', emoji: '📱' },
  'PELEPHONE': { name: 'פלאפון', category: 'telecom', emoji: '📱' },
  'BEZEQ': { name: 'בזק', category: 'telecom', emoji: '☎️' },
  'GOLAN': { name: 'גולן טלקום', category: 'telecom', emoji: '📞' },
  'MICROSOFT': { name: 'Microsoft 365', category: 'software', emoji: '💼' },
  'ADOBE': { name: 'Adobe', category: 'software', emoji: '🎨' },
  'ZOOM': { name: 'Zoom', category: 'software', emoji: '📹' },
  'DROPBOX': { name: 'Dropbox', category: 'software', emoji: '📦' },
  'GITHUB': { name: 'GitHub', category: 'software', emoji: '🐙' },
  'LINKEDIN': { name: 'LinkedIn Premium', category: 'software', emoji: '💼' },
  'YOUTUBE': { name: 'YouTube Premium', category: 'streaming', emoji: '▶️' },
  'HULU': { name: 'Hulu', category: 'streaming', emoji: '🟢' },
  'PARAMOUNT': { name: 'Paramount+', category: 'streaming', emoji: '⭐' },
  'PEACE': { name: 'Peace FM', category: 'fitness', emoji: '💪' },
  'HOLMES': { name: 'Holmes Place', category: 'fitness', emoji: '🏋️' },
  'GYM': { name: 'מועדון כושר', category: 'fitness', emoji: '💪' },
  'NYTIMES': { name: 'New York Times', category: 'news', emoji: '📰' },
  'WSJ': { name: 'Wall Street Journal', category: 'news', emoji: '📈' },
  'HAARETZ': { name: 'הארץ', category: 'news', emoji: '📰' },
  'YNET': { name: 'Ynet+', category: 'news', emoji: '📱' },
  'MAKO': { name: 'Mako', category: 'news', emoji: '📺' },
};

export function detectRecurringSubscriptions(transactions, existingSubscriptions = []) {
  if (!transactions || transactions.length < 2) return [];

  // Filter expense transactions only
  const expenseTransactions = transactions.filter(t => t.type === 'expense' && t.date && t.amount);
  
  // Group by description and amount (key = "description_amount")
  const grouped = _.groupBy(expenseTransactions, t => 
    `${(t.description || '').toLowerCase().trim()}_${Math.round(t.amount)}`
  );

  const detected = [];

  for (const [key, group] of Object.entries(grouped)) {
    // Need at least 2 occurrences
    if (group.length < 2) continue;

    // Sort by date
    const sortedGroup = group.sort((a, b) => new Date(a.date) - new Date(b.date));
    const dates = sortedGroup.map(t => new Date(t.date));

    // Calculate intervals between consecutive transactions
    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push(differenceInDays(dates[i], dates[i-1]));
    }

    // Check if intervals are roughly monthly (25-35 days)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const isMonthly = avgInterval >= 25 && avgInterval <= 35;

    if (!isMonthly) continue;

    const sample = sortedGroup[0];
    const desc = (sample.description || '').toUpperCase();
    
    // Try to match known vendor
    const vendor = Object.entries(knownVendors).find(([key]) => desc.includes(key));
    
    const subscriptionData = {
      name: vendor?.[1]?.name || sample.description || 'מנוי ללא שם',
      vendor: vendor?.[0] || desc,
      amount: sample.amount,
      category: vendor?.[1]?.category || 'other',
      logo_emoji: vendor?.[1]?.emoji || '📋',
      billing_day: new Date(sortedGroup[sortedGroup.length - 1].date).getDate(),
      last_charge_date: sortedGroup[sortedGroup.length - 1].date,
      is_active: true,
      detected_automatically: true
    };

    // Check if already exists
    const exists = existingSubscriptions.some(s => 
      (s.name?.toLowerCase() === subscriptionData.name.toLowerCase()) ||
      (Math.abs((s.amount || 0) - subscriptionData.amount) < 1 && s.vendor?.includes(subscriptionData.vendor))
    );

    if (!exists) {
      detected.push(subscriptionData);
    }
  }

  return detected;
}