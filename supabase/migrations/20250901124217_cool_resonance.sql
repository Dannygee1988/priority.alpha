/*
  # Add AI agent response to existing chat message

  1. Sample Data
    - Insert AI agent response to the existing user message
    - Link response to original message using parent_id and conversation_id
    - Include realistic advisor response with business insights

  2. Data Structure
    - AI agent response with detailed business advice
    - Proper conversation threading
    - Realistic metadata and sentiment analysis
*/

-- Insert AI agent response to the existing user message
INSERT INTO chatbot_messages (
  id,
  company_id,
  conversation_id,
  role,
  content,
  source,
  metadata,
  subject,
  sentiment_score,
  keywords,
  email,
  created_at,
  parent_id
) VALUES (
  gen_random_uuid(),
  'c0a80121-1234-5678-9abc-def012345678',
  (SELECT conversation_id FROM chatbot_messages WHERE role = 'user' LIMIT 1),
  'bot',
  'Based on your business data and current market conditions, here are my recommendations:

**Key Insights:**
• Your customer acquisition metrics show strong potential for growth
• Market trends indicate increased demand in your sector
• Operational efficiency can be improved through automation

**Strategic Recommendations:**
1. **Focus on Customer Retention**: Implement a customer success program to reduce churn
2. **Optimize Marketing Spend**: Reallocate budget to highest-performing channels
3. **Streamline Operations**: Automate repetitive tasks to improve efficiency
4. **Expand Market Reach**: Consider new geographic markets or customer segments

**Next Steps:**
• Review your current customer feedback and satisfaction scores
• Analyze competitor strategies in your market
• Set up key performance indicators (KPIs) for tracking progress

Would you like me to dive deeper into any of these areas or help you create a detailed action plan?',
  'website',
  '{"response_time_ms": 2150, "sources_used": 4, "confidence_score": 0.94, "ai_model": "gpt-4"}',
  'Business Strategy Consultation',
  0.85,
  ARRAY['business strategy', 'recommendations', 'growth', 'optimization', 'kpis'],
  'advisor@pri0r1ty.com',
  now() - interval '2 minutes',
  (SELECT id FROM chatbot_messages WHERE role = 'user' LIMIT 1)
);