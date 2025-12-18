/**
 * AI Pattern Recognition and Follow-up Question Generation
 * Utilities for the Financial Advisor Chat Interface
 */

/**
 * Extract topics from user message based on keywords
 * @param {string} message - User's message
 * @returns {string[]} - Array of detected topics
 */
export const extractTopics = (message) => {
  const topicKeywords = {
    'חיסכון': ['חיסכון', 'לחסוך', 'יעד', 'יעדים', 'חסכת', 'קרן חירום'],
    'חובות': ['חוב', 'חובות', 'לשלם', 'פירעון', 'ריבית', 'משכנתא', 'הלוואה'],
    'השקעות': ['השקעה', 'השקעות', 'מניות', 'תיק', 'תשואה', 'דיבידנד', 'קרן נאמנות'],
    'הוצאות': ['הוצאות', 'להוציא', 'קניות', 'בזבוז', 'לבזבז', 'מוציא'],
    'תקציב': ['תקציב', 'תקציבים', 'תכנון', 'לתכנן'],
    'פרישה': ['פרישה', 'פנסיה', 'גיל פרישה', 'קופת גמל'],
    'הכנסות': ['הכנסה', 'הכנסות', 'משכורת', 'שכר', 'רווחים'],
    'בריאות_פיננסית': ['בריאות', 'ציון', 'מצב פיננסי', 'סטטוס']
  };

  const topics = [];
  const lowerMessage = message.toLowerCase();
  
  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(kw => lowerMessage.includes(kw))) {
      topics.push(topic);
    }
  });

  return topics.length > 0 ? topics : ['כללי'];
};

/**
 * Generate personalized follow-up questions based on user patterns
 * @param {Object} patterns - User question patterns with frequency
 * @param {Array} context - Conversation context
 * @returns {string[]} - Array of suggested follow-up questions
 */
export const generateFollowUpQuestions = (patterns, context) => {
  const questions = [];
  const sortedPatterns = Object.entries(patterns)
    .filter(([, data]) => data.count >= 2)
    .sort(([, a], [, b]) => b.count - a.count);
  
  if (sortedPatterns.length > 0) {
    const [topTopic, topicData] = sortedPatterns[0];
    
    const followUpMap = {
      'חיסכון': [
        'רוצה שאעזור לך להגדיר יעד חיסכון חדש?',
        'מעניין אותך לראות תחזית כמה תחסוך ב-12 החודשים הקרובים?',
        'רוצה המלצות איך להגדיל את שיעור החיסכון שלך?'
      ],
      'חובות': [
        'רוצה תוכנית מפורטת לפירעון החובות מהר יותר?',
        'האם בדקת אפשרויות רפיננסינג?',
        'מעניין אותך לראות כמה כסף תחסוך אם תפרע את החובות בסדר אופטימלי?'
      ],
      'השקעות': [
        'רוצה ניתוח עמוק של תיק ההשקעות שלך?',
        'מעניין אותך לשמוע על אסטרטגיות גיוון?',
        'רוצה שאשווה את הביצועים שלך לשוק?'
      ],
      'הוצאות': [
        'רוצה שאזהה בשבילך הזדמנויות חיסכון בהוצאות?',
        'מעניין אותך לראות מתי אתה מוציא הכי הרבה כסף?',
        'רוצה ניתוח של דפוסי ההוצאות שלך לפי יום בשבוע?'
      ],
      'תקציב': [
        'רוצה עזרה בבניית תקציב מותאם אישית?',
        'מעניין אותך לראות היכן אתה חורג מהתקציב?'
      ],
      'פרישה': [
        'רוצה חישוב מדויק כמה צריך לחסוך לפרישה?',
        'מעניין אותך לראות תרחישים שונים לפרישה?'
      ],
      'בריאות_פיננסית': [
        'רוצה לראות את ציון הבריאות הפיננסית המלא שלך?',
        'מעניין אותך לדעת מה לשפר קודם כל?'
      ]
    };

    // Add personalized questions based on recurring patterns
    if (topicData.count >= 3) {
      questions.push(`שמתי לב שאתה מתעניין ב${topTopic.replace(/_/g, ' ')} - רוצה תוכנית פעולה מקיפה בנושא?`);
    }

    if (followUpMap[topTopic]) {
      const availableQuestions = followUpMap[topTopic].filter(q => 
        !context.some(ctx => ctx.userMessage.includes(q.substring(0, 15)))
      );
      questions.push(...availableQuestions.slice(0, 2));
    }
  }

  // Detect gaps - topics not asked about
  const allTopics = ['חיסכון', 'חובות', 'השקעות', 'הוצאות', 'תקציב', 'פרישה'];
  const askedTopics = Object.keys(patterns);
  const unaskedTopics = allTopics.filter(t => !askedTopics.includes(t));
  
  if (unaskedTopics.length > 0 && sortedPatterns.length >= 2) {
    const randomUnasked = unaskedTopics[Math.floor(Math.random() * unaskedTopics.length)];
    questions.push(`לא דיברנו על ${randomUnasked.replace(/_/g, ' ')} - רוצה שאנתח את זה בשבילך?`);
  }

  return questions.slice(0, 3);
};

/**
 * Update question patterns with new user message
 * @param {Object} currentPatterns - Current patterns object
 * @param {string[]} topics - Extracted topics from message
 * @param {string} userMessage - The user's message
 * @returns {Object} - Updated patterns object
 */
export const updateQuestionPatterns = (currentPatterns, topics, userMessage) => {
  const updatedPatterns = { ...currentPatterns };
  
  topics.forEach(topic => {
    if (!updatedPatterns[topic]) {
      updatedPatterns[topic] = {
        count: 0,
        lastAsked: null,
        relatedQuestions: []
      };
    }
    updatedPatterns[topic].count += 1;
    updatedPatterns[topic].lastAsked = new Date().toISOString();
    if (!updatedPatterns[topic].relatedQuestions.includes(userMessage)) {
      updatedPatterns[topic].relatedQuestions.push(userMessage);
      updatedPatterns[topic].relatedQuestions = updatedPatterns[topic].relatedQuestions.slice(-3);
    }
  });

  return updatedPatterns;
};