export const RSS_SOURCES = [
  // === 海外（英語）- 公式ブログ ===
  {
    name: 'OpenAI Blog',
    url: 'https://openai.com/news/rss.xml',
    lang: 'en',
    priority: 'high',
  },
  {
    name: 'Google DeepMind',
    url: 'https://deepmind.google/blog/rss.xml',
    lang: 'en',
    priority: 'high',
  },
  {
    name: 'Hugging Face Blog',
    url: 'https://huggingface.co/blog/feed.xml',
    lang: 'en',
    priority: 'high',
  },

  // === 海外（英語）- メディア ===
  {
    name: 'The Verge AI',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    lang: 'en',
    priority: 'high',
  },
  {
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    lang: 'en',
    priority: 'high',
  },

  // === 海外（英語）- ニュースレター・個人 ===
  {
    name: 'The Rundown AI',
    url: 'https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml',
    lang: 'en',
    priority: 'high',
  },
  {
    name: 'TLDR AI',
    url: 'https://tldr.tech/api/rss/ai',
    lang: 'en',
    priority: 'high',
  },
  {
    name: "Ben's Bites",
    url: 'https://www.bensbites.com/feed',
    lang: 'en',
    priority: 'medium',
  },
  {
    name: 'Simon Willison',
    url: 'https://simonwillison.net/atom/everything/',
    lang: 'en',
    priority: 'medium',
  },
  {
    name: 'Martin Alderson',
    url: 'https://martinalderson.com/feed.xml',
    lang: 'en',
    priority: 'medium',
  },

  // === 海外（英語）- プロダクト ===
  {
    name: 'Product Hunt AI',
    url: 'https://www.producthunt.com/feed?category=artificial-intelligence',
    lang: 'en',
    priority: 'medium',
  },

  // === 日本語 ===
  {
    name: 'ITmedia AI+',
    url: 'https://rss.itmedia.co.jp/rss/2.0/aiplus.xml',
    lang: 'ja',
    priority: 'high',
  },
  {
    name: 'Zenn AI',
    url: 'https://zenn.dev/topics/ai/feed',
    lang: 'ja',
    priority: 'high',
  },
  {
    name: 'Zenn LLM',
    url: 'https://zenn.dev/topics/llm/feed',
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
