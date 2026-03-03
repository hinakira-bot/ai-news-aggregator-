export const RSS_SOURCES = [
  // === 海外（英語）- ツール・実用系中心 ===
  {
    name: 'The Verge AI',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    lang: 'en',
    priority: 'high',
  },
  {
    name: "There's An AI For That",
    url: 'https://theresanaiforthat.com/rss/',
    lang: 'en',
    priority: 'high',
  },
  {
    name: 'OpenAI Blog',
    url: 'https://openai.com/blog/rss.xml',
    lang: 'en',
    priority: 'high',
  },
  {
    name: 'Anthropic Blog',
    url: 'https://www.anthropic.com/rss.xml',
    lang: 'en',
    priority: 'high',
  },
  {
    name: 'Google AI Blog',
    url: 'https://blog.google/technology/ai/rss/',
    lang: 'en',
    priority: 'medium',
  },
  {
    name: "Ben's Bites",
    url: 'https://bensbites.beehiiv.com/feed',
    lang: 'en',
    priority: 'medium',
  },
  {
    name: 'Product Hunt AI',
    url: 'https://www.producthunt.com/feed?category=artificial-intelligence',
    lang: 'en',
    priority: 'medium',
  },

  // === 日本語 - 活用Tips・ツール系中心 ===
  {
    name: 'AINOW',
    url: 'https://ainow.ai/feed/',
    lang: 'ja',
    priority: 'high',
  },
  {
    name: 'Ledge.ai',
    url: 'https://ledge.ai/feed/',
    lang: 'ja',
    priority: 'high',
  },
  {
    name: 'ITmedia AI+',
    url: 'https://rss.itmedia.co.jp/rss/2.0/aiplus.xml',
    lang: 'ja',
    priority: 'medium',
  },
  {
    name: 'Qiita AI',
    url: 'https://qiita.com/tags/ai/feed',
    lang: 'ja',
    priority: 'medium',
  },
];

export const NEWSAPI_CONFIG = {
  baseUrl: 'https://newsapi.org/v2/everything',
  queries: [
    {
      q: '"AI tools" OR "ChatGPT" OR "Claude AI" OR "Gemini AI" OR "LLM release"',
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: 20,
    },
    {
      q: 'AI OR 生成AI OR ChatGPT OR LLM',
      language: 'ja',
      sortBy: 'publishedAt',
      pageSize: 10,
    },
  ],
};

export const CATEGORIES = [
  { slug: 'ai-tools', label: '最新ツール・サービス' },
  { slug: 'llm-models', label: '最新LLM・モデル' },
  { slug: 'prompts', label: 'プロンプト・活用術' },
  { slug: 'marketing', label: 'マーケティング×AI' },
  { slug: 'side-business', label: '副業・収益化' },
  { slug: 'vibe-coding', label: 'バイブコーディング' },
  { slug: 'workflow', label: 'ワークフロー・自動化' },
  { slug: 'media-ai', label: '画像・動画・音声AI' },
];
