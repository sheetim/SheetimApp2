import { extractTopics, generateFollowUpQuestions, updateQuestionPatterns } from '../aiPatternUtils';

describe('AI Pattern Utilities', () => {
  describe('extractTopics', () => {
    test('should extract savings topic from message', () => {
      const message = 'אני רוצה לחסוך יותר כסף';
      const topics = extractTopics(message);
      expect(topics).toContain('חיסכון');
    });

    test('should extract debt topic from message', () => {
      const message = 'יש לי חובות גבוהים שאני צריך לפרוע';
      const topics = extractTopics(message);
      expect(topics).toContain('חובות');
    });

    test('should extract multiple topics from message', () => {
      const message = 'אני רוצה לחסוך כדי לפרוע את החובות שלי';
      const topics = extractTopics(message);
      expect(topics).toContain('חיסכון');
      expect(topics).toContain('חובות');
    });

    test('should return general topic for unrecognized message', () => {
      const message = 'שלום מה קורה';
      const topics = extractTopics(message);
      expect(topics).toEqual(['כללי']);
    });

    test('should handle empty message', () => {
      const message = '';
      const topics = extractTopics(message);
      expect(topics).toEqual(['כללי']);
    });
  });

  describe('generateFollowUpQuestions', () => {
    test('should generate follow-up questions for recurring pattern', () => {
      const patterns = {
        'חיסכון': {
          count: 3,
          lastAsked: new Date().toISOString(),
          relatedQuestions: ['איך לחסוך?']
        }
      };
      const context = [];
      
      const questions = generateFollowUpQuestions(patterns, context);
      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0]).toContain('חיסכון');
    });

    test('should not generate questions for low frequency patterns', () => {
      const patterns = {
        'חיסכון': {
          count: 1,
          lastAsked: new Date().toISOString(),
          relatedQuestions: []
        }
      };
      const context = [];
      
      const questions = generateFollowUpQuestions(patterns, context);
      expect(questions.length).toBe(0);
    });

    test('should suggest unasked topics', () => {
      const patterns = {
        'חיסכון': {
          count: 3,
          lastAsked: new Date().toISOString(),
          relatedQuestions: []
        },
        'חובות': {
          count: 2,
          lastAsked: new Date().toISOString(),
          relatedQuestions: []
        }
      };
      const context = [];
      
      const questions = generateFollowUpQuestions(patterns, context);
      const hasUnaskedTopic = questions.some(q => 
        q.includes('השקעות') || q.includes('הוצאות') || q.includes('תקציב') || q.includes('פרישה')
      );
      expect(hasUnaskedTopic).toBe(true);
    });

    test('should limit returned questions to 3', () => {
      const patterns = {
        'חיסכון': {
          count: 5,
          lastAsked: new Date().toISOString(),
          relatedQuestions: []
        }
      };
      const context = [];
      
      const questions = generateFollowUpQuestions(patterns, context);
      expect(questions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('updateQuestionPatterns', () => {
    test('should create new pattern for first-time topic', () => {
      const currentPatterns = {};
      const topics = ['חיסכון'];
      const userMessage = 'איך לחסוך?';
      
      const updated = updateQuestionPatterns(currentPatterns, topics, userMessage);
      expect(updated['חיסכון']).toBeDefined();
      expect(updated['חיסכון'].count).toBe(1);
      expect(updated['חיסכון'].relatedQuestions).toContain(userMessage);
    });

    test('should increment count for existing pattern', () => {
      const currentPatterns = {
        'חיסכון': {
          count: 2,
          lastAsked: new Date().toISOString(),
          relatedQuestions: ['שאלה קודמת']
        }
      };
      const topics = ['חיסכון'];
      const userMessage = 'איך לחסוך עוד?';
      
      const updated = updateQuestionPatterns(currentPatterns, topics, userMessage);
      expect(updated['חיסכון'].count).toBe(3);
    });

    test('should limit related questions to last 3', () => {
      const currentPatterns = {
        'חיסכון': {
          count: 1,
          lastAsked: new Date().toISOString(),
          relatedQuestions: ['שאלה 1', 'שאלה 2', 'שאלה 3']
        }
      };
      const topics = ['חיסכון'];
      const userMessage = 'שאלה 4';
      
      const updated = updateQuestionPatterns(currentPatterns, topics, userMessage);
      expect(updated['חיסכון'].relatedQuestions.length).toBeLessThanOrEqual(3);
      expect(updated['חיסכון'].relatedQuestions).toContain('שאלה 4');
      expect(updated['חיסכון'].relatedQuestions).not.toContain('שאלה 1');
    });

    test('should handle multiple topics in one message', () => {
      const currentPatterns = {};
      const topics = ['חיסכון', 'חובות'];
      const userMessage = 'איך לחסוך כדי לפרוע חובות?';
      
      const updated = updateQuestionPatterns(currentPatterns, topics, userMessage);
      expect(updated['חיסכון']).toBeDefined();
      expect(updated['חובות']).toBeDefined();
      expect(updated['חיסכון'].count).toBe(1);
      expect(updated['חובות'].count).toBe(1);
    });

    test('should update lastAsked timestamp', () => {
      const oldDate = new Date('2025-01-01').toISOString();
      const currentPatterns = {
        'חיסכון': {
          count: 1,
          lastAsked: oldDate,
          relatedQuestions: []
        }
      };
      const topics = ['חיסכון'];
      const userMessage = 'שאלה חדשה';
      
      const updated = updateQuestionPatterns(currentPatterns, topics, userMessage);
      expect(updated['חיסכון'].lastAsked).not.toBe(oldDate);
      expect(new Date(updated['חיסכון'].lastAsked).getTime()).toBeGreaterThan(new Date(oldDate).getTime());
    });
  });
});