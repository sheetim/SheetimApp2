/**
 * Utility functions for handling credit card billing dates
 */

/**
 * Calculate billing date for a credit card transaction
 * @param {string} transactionDate - Transaction date in YYYY-MM-DD format
 * @param {number} billingDay - Day of month for billing (1-31)
 * @returns {string} Billing date in YYYY-MM-DD format
 */
export const calculateBillingDate = (transactionDate, billingDay = 10) => {
  if (!transactionDate) return '';
  
  const transDate = new Date(transactionDate);
  const billingDate = new Date(transDate);
  billingDate.setDate(billingDay);
  
  // If transaction is on or after billing day, move to next month
  if (transDate.getDate() >= billingDay) {
    billingDate.setMonth(billingDate.getMonth() + 1);
  }
  
  return billingDate.toISOString().split('T')[0];
};

/**
 * Get the effective date for a transaction (billing_date for credit cards, date otherwise)
 * Used for forecasting and cash flow analysis
 * @param {Object} transaction - Transaction object
 * @returns {string} The effective date to use for calculations
 */
export const getEffectiveTransactionDate = (transaction) => {
  if (transaction.payment_method === 'כרטיס_אשראי' && transaction.billing_date) {
    return transaction.billing_date;
  }
  return transaction.date;
};

/**
 * Detect if a transaction description suggests credit card payment
 * Used for automatic classification during imports
 * @param {string} description - Transaction description
 * @returns {boolean} True if likely a credit card transaction
 */
export const isCreditCardTransaction = (description) => {
  if (!description) return false;
  
  const lower = description.toLowerCase();
  const creditCardKeywords = [
    'כרטיס', 'visa', 'mastercard', 'אשראי', 'max', 'cal', 'ישראכרט',
    'לאומי קארד', 'דיינרס', 'אמריקן אקספרס'
  ];
  
  return creditCardKeywords.some(keyword => lower.includes(keyword));
};

/**
 * Process imported transaction and add billing date if needed
 * @param {Object} transaction - Raw transaction data
 * @param {number} billingDay - User's credit card billing day
 * @returns {Object} Processed transaction with billing_date if applicable
 */
export const processImportedTransaction = (transaction, billingDay = 10) => {
  // If payment method not specified but description suggests credit card
  if (!transaction.payment_method && isCreditCardTransaction(transaction.description)) {
    transaction.payment_method = 'כרטיס_אשראי';
  }
  
  // Calculate billing date for credit card transactions
  if (transaction.payment_method === 'כרטיס_אשראי' && transaction.date && !transaction.billing_date) {
    transaction.billing_date = calculateBillingDate(transaction.date, billingDay);
  }
  
  return transaction;
};