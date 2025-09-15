/*
  # Add sample chat messages

  1. Sample Data
    - Insert sample user question about business metrics
    - Insert corresponding AI agent response
    - Both messages linked by conversation_id
    - Realistic metadata including sentiment and keywords

  2. Data Structure
    - User message with question about revenue growth
    - AI agent response with detailed business advice
    - Proper conversation threading with parent_id
*/

-- Insert sample user question
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
  created_at
) VALUES (
  'user-msg-001',
  'c0a80121-1234-5678-9abc-def012345678',
  'conv-001',
  'user',
  'Hi, I need help understanding our revenue growth trends. Our Q3 numbers seem lower than expected and I''m trying to identify the key factors affecting our performance. Can you analyze our data and provide insights?',
  'website',
  '{"user_agent": "Mozilla/5.0", "ip_address": "192.168.1.100", "session_id": "sess_123"}',
  'Revenue Growth Analysis',
  0.3,
  ARRAY['revenue', 'growth', 'Q3', 'performance', 'analysis'],
  'john.smith@company.com',
  now() - interval '5 minutes'
);

-- Insert AI agent response
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
  'bot-msg-001',
  'c0a80121-1234-5678-9abc-def012345678',
  'conv-001',
  'bot',
  'Based on your company''s data analysis, I can see several factors contributing to the Q3 revenue trends:

**Key Findings:**
• Customer acquisition costs increased by 15% compared to Q2
• Average deal size decreased by 8% in the enterprise segment
• Seasonal factors typical for your industry during Q3

**Recommendations:**
1. **Optimize Marketing Spend**: Focus budget on highest-converting channels
2. **Enterprise Strategy**: Review pricing strategy and value proposition for larger deals
3. **Customer Retention**: Implement targeted retention campaigns for existing customers

**Next Steps:**
• Schedule a review of your sales funnel metrics
• Analyze competitor pricing in your market segment
• Consider launching a customer feedback survey

Would you like me to dive deeper into any of these areas or help you create an action plan?',
  'website',
  '{"response_time_ms": 2340, "sources_used": 3, "confidence_score": 0.92}',
  'Revenue Growth Analysis',
  0.8,
  ARRAY['revenue', 'analysis', 'recommendations', 'strategy', 'optimization'],
  'advisor@pri0r1ty.com',
  now() - interval '3 minutes',
  'user-msg-001'
);

-- Insert another user question
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
  created_at
) VALUES (
  'user-msg-002',
  'c0a80121-1234-5678-9abc-def012345678',
  'conv-002',
  'user',
  'What are the best practices for social media engagement in our industry? We want to improve our online presence.',
  'website',
  '{"user_agent": "Mozilla/5.0", "ip_address": "192.168.1.101", "session_id": "sess_456"}',
  'Social Media Strategy',
  0.7,
  ARRAY['social media', 'engagement', 'best practices', 'online presence'],
  'sarah.marketing@company.com',
  now() - interval '10 minutes'
);

-- Insert AI agent response for social media question
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
  'bot-msg-002',
  'c0a80121-1234-5678-9abc-def012345678',
  'conv-002',
  'bot',
  'Here are proven social media strategies for your industry:

**Content Strategy:**
• Share industry insights and thought leadership content
• Post behind-the-scenes content to humanize your brand
• Create educational content that adds value to your audience

**Engagement Tactics:**
• Respond to comments within 2-4 hours during business hours
• Use industry-specific hashtags to increase discoverability
• Engage with other industry leaders and potential customers

**Platform-Specific Tips:**
• **LinkedIn**: Focus on professional insights and company updates
• **Twitter**: Share quick tips and engage in industry conversations
• **Instagram**: Use visual storytelling and company culture content

**Metrics to Track:**
• Engagement rate (aim for 3-6% in B2B)
• Reach and impressions growth
• Click-through rates to your website
• Lead generation from social channels

Would you like me to help you create a content calendar or analyze your current social media performance?',
  'website',
  '{"response_time_ms": 1890, "sources_used": 5, "confidence_score": 0.89}',
  'Social Media Strategy',
  0.9,
  ARRAY['social media', 'strategy', 'engagement', 'content', 'best practices'],
  'advisor@pri0r1ty.com',
  now() - interval '8 minutes',
  'user-msg-002'
);