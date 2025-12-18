import { AIService } from '../AIService';
import { base44 } from '@/api/base44Client';

// Mock the base44 client
jest.mock('@/api/base44Client', () => ({
  base44: {
    integrations: {
      Core: {
        InvokeLLM: jest.fn()
      }
    }
  }
}));

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('suggestCategory', () => {
    test('should suggest category based on description', async () => {
      const mockResponse = 'מזון_ומשקאות';
      base44.integrations.Core.InvokeLLM.mockResolvedValue(mockResponse);

      const result = await AIService.suggestCategory('קניות בסופרמרקט', []);

      expect(result).toBe(mockResponse);
      expect(base44.integrations.Core.InvokeLLM).toHaveBeenCalled();
    });

    test('should use historical data for better suggestions', async () => {
      const mockResponse = 'תחבורה';
      base44.integrations.Core.InvokeLLM.mockResolvedValue(mockResponse);

      const historicalTransactions = [
        { description: 'תחנת דלק', category: 'תחבורה' },
        { description: 'דלק', category: 'תחבורה' }
      ];

      const result = await AIService.suggestCategory('תדלוק', historicalTransactions);

      expect(result).toBe(mockResponse);
      expect(base44.integrations.Core.InvokeLLM).toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      base44.integrations.Core.InvokeLLM.mockRejectedValue(new Error('API Error'));

      const result = await AIService.suggestCategory('test', []);

      expect(result).toBe('אחר_הוצאה');
    });
  });

  describe('calculateFinancialHealthScore', () => {
    test('should calculate score correctly for healthy finances', () => {
      const data = {
        totalIncome: 10000,
        totalExpenses: 6000,
        totalSavings: 50000,
        totalDebt: 0,
        hasEmergencyFund: true,
        hasInvestments: true,
        savingsGoalsProgress: 0.7
      };

      const result = AIService.calculateFinancialHealthScore(data);

      expect(result.score).toBeGreaterThan(7);
      expect(result.grade).toBe('A');
      expect(result.recommendations).toBeDefined();
    });

    test('should calculate lower score for poor finances', () => {
      const data = {
        totalIncome: 10000,
        totalExpenses: 9500,
        totalSavings: 1000,
        totalDebt: 50000,
        hasEmergencyFund: false,
        hasInvestments: false,
        savingsGoalsProgress: 0.1
      };

      const result = AIService.calculateFinancialHealthScore(data);

      expect(result.score).toBeLessThan(5);
      expect(result.grade).not.toBe('A');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    test('should handle edge case with zero income', () => {
      const data = {
        totalIncome: 0,
        totalExpenses: 5000,
        totalSavings: 0,
        totalDebt: 0,
        hasEmergencyFund: false,
        hasInvestments: false,
        savingsGoalsProgress: 0
      };

      const result = AIService.calculateFinancialHealthScore(data);

      expect(result.score).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(10);
    });

    test('should include detailed breakdown', () => {
      const data = {
        totalIncome: 10000,
        totalExpenses: 7000,
        totalSavings: 20000,
        totalDebt: 10000,
        hasEmergencyFund: true,
        hasInvestments: true,
        savingsGoalsProgress: 0.5
      };

      const result = AIService.calculateFinancialHealthScore(data);

      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.savingsRate).toBeDefined();
      expect(result.breakdown.debtToIncome).toBeDefined();
      expect(result.breakdown.emergencyFund).toBeDefined();
    });
  });

  describe('predictFutureBalance', () => {
    test('should predict positive balance trend', async () => {
      const mockResponse = {
        predictions: [
          { month: '2025-12', balance: 15000 },
          { month: '2026-01', balance: 18000 }
        ]
      };
      base44.integrations.Core.InvokeLLM.mockResolvedValue(JSON.stringify(mockResponse));

      const transactions = [
        { date: '2025-10-01', type: 'income', amount: 10000 },
        { date: '2025-10-15', type: 'expense', amount: 6000 }
      ];

      const result = await AIService.predictFutureBalance(transactions, 10000, 6);

      expect(result.predictions).toBeDefined();
      expect(result.predictions.length).toBeGreaterThan(0);
    });

    test('should handle insufficient data', async () => {
      const transactions = [];

      const result = await AIService.predictFutureBalance(transactions, 5000, 6);

      expect(result.predictions).toBeDefined();
    });
  });

  describe('analyzeSpendingPatterns', () => {
    test('should identify spending patterns by day of week', () => {
      const transactions = [
        { date: '2025-11-18', type: 'expense', amount: 100, category: 'מזון' }, // Monday
        { date: '2025-11-19', type: 'expense', amount: 200, category: 'מזון' }, // Tuesday
        { date: '2025-11-25', type: 'expense', amount: 150, category: 'מזון' }  // Monday
      ];

      const result = AIService.analyzeSpendingPatterns(transactions);

      expect(result.byDayOfWeek).toBeDefined();
      expect(Object.keys(result.byDayOfWeek).length).toBeGreaterThan(0);
    });

    test('should identify spending patterns by time of month', () => {
      const transactions = [
        { date: '2025-11-05', type: 'expense', amount: 100, category: 'מזון' },
        { date: '2025-11-15', type: 'expense', amount: 200, category: 'מזון' },
        { date: '2025-11-25', type: 'expense', amount: 300, category: 'מזון' }
      ];

      const result = AIService.analyzeSpendingPatterns(transactions);

      expect(result.byTimeOfMonth).toBeDefined();
      expect(result.byTimeOfMonth.early).toBeDefined();
      expect(result.byTimeOfMonth.mid).toBeDefined();
      expect(result.byTimeOfMonth.late).toBeDefined();
    });

    test('should identify recurring transactions', () => {
      const transactions = [
        { date: '2025-10-01', type: 'expense', amount: 100, description: 'Netflix', category: 'שירותים' },
        { date: '2025-11-01', type: 'expense', amount: 100, description: 'Netflix', category: 'שירותים' }
      ];

      const result = AIService.analyzeSpendingPatterns(transactions);

      expect(result.recurringTransactions).toBeDefined();
    });

    test('should handle empty transaction list', () => {
      const transactions = [];

      const result = AIService.analyzeSpendingPatterns(transactions);

      expect(result).toBeDefined();
      expect(result.byDayOfWeek).toBeDefined();
      expect(result.byTimeOfMonth).toBeDefined();
    });
  });
});