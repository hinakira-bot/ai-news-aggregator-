export const RSS_SOURCES = [
  // === 海外（英語）- 公式ブログ ===
  {
    name: 'OpenAI Blog',
    url: 'https://openai.com/news/rss.xml',
    lang: 'en',
    type: 'official',
    priority: 'high',
  },
  {
    name: 'Google DeepMind',
    url: 'https://deepmind.google/blog/rss.xml',
    lang: 'en',
    type: 'official',
    priority: 'high',
  },
  {
    name: 'Anthropic News',
    url: 'https://raw.githubusercontent.com/taobojlen/anthropic-rss-feed/main/anthropic_news_rss.xml',
    lang: 'en',
    type: 'official',
    priority: 'high',
  },
  {
    name: 'Microsoft AI Blog',
    url: 'https://blogs.microsoft.com/ai/feed/',
    lang: 'en',
    type: 'official',
    priority: 'high',
  },
  {
    name: 'NVIDIA AI Blog',
    url: 'https://blogs.nvidia.com/feed/',
    lang: 'en',
    type: 'official',
    priority: 'medium',
  },
  {
    name: 'Hugging Face Blog',
    url: 'https://huggingface.co/blog/feed.xml',
    lang: 'en',
    type: 'official',
    priority: 'high',
  },
  {
    name: 'Meta AI Research',
    url: 'https://engineering.fb.com/category/ai-research/feed/',
    lang: 'en',
    type: 'official',
    priority: 'medium',
  },

  // === 海外（英語）- メディア ===
  {
    name: 'The Verge AI',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    lang: 'en',
    type: 'media',
    priority: 'high',
  },
  {
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    lang: 'en',
    type: 'media',
    priority: 'high',
  },
  {
    name: 'Ars Technica AI',
    url: 'https://arstechnica.com/tag/ai/feed/',
    lang: 'en',
    type: 'media',
    priority: 'high',
  },
  {
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com/feed/',
    lang: 'en',
    type: 'media',
    priority: 'high',
  },
  {
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/category/ai/feed/',
    lang: 'en',
    type: 'media',
    priority: 'high',
  },
  {
    name: 'Wired AI',
    url: 'https://www.wired.com/feed/tag/ai/latest/rss',
    lang: 'en',
    type: 'media',
    priority: 'medium',
  },

  // === 海外（英語）- ニュースレター・個人 ===
  {
    name: 'The Rundown AI',
    url: 'https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml',
    lang: 'en',
    type: 'individual',
    priority: 'high',
  },
  {
    name: 'TLDR AI',
    url: 'https://tldr.tech/api/rss/ai',
    lang: 'en',
    type: 'individual',
    priority: 'high',
  },
  {
    name: "Ben's Bites",
    url: 'https://www.bensbites.com/feed',
    lang: 'en',
    type: 'individual',
    priority: 'medium',
  },
  {
    name: 'Simon Willison',
    url: 'https://simonwillison.net/atom/everything/',
    lang: 'en',
    type: 'individual',
    priority: 'medium',
  },
  {
    name: 'Martin Alderson',
    url: 'https://martinalderson.com/feed.xml',
    lang: 'en',
    type: 'individual',
    priority: 'medium',
  },

  // === 海外（英語）- プロダクト ===
  {
    name: 'Product Hunt AI',
    url: 'https://www.producthunt.com/feed?category=artificial-intelligence',
    lang: 'en',
    type: 'ugc',
    priority: 'medium',
  },

  // === 日本語 - メディア ===
  {
    name: 'ITmedia AI+',
    url: 'https://rss.itmedia.co.jp/rss/2.0/aiplus.xml',
    lang: 'ja',
    type: 'media',
    priority: 'high',
  },
  {
    name: 'ASCII.jp TECH',
    url: 'https://ascii.jp/tech/rss.xml',
    lang: 'ja',
    type: 'media',
    priority: 'high',
  },
  {
    name: 'Publickey',
    url: 'https://www.publickey1.jp/atom.xml',
    lang: 'ja',
    type: 'media',
    priority: 'high',
  },
  {
    name: 'GIGAZINE',
    url: 'https://gigazine.net/news/rss_2.0/',
    lang: 'ja',
    type: 'media',
    priority: 'medium',
  },

  // === 日本語 - UGC ===
  {
    name: 'Zenn AI',
    url: 'https://zenn.dev/topics/ai/feed',
    lang: 'ja',
    type: 'ugc',
    priority: 'medium',
  },
  {
    name: 'Qiita AI',
    url: 'https://qiita.com/tags/ai/feed',
    lang: 'ja',
    type: 'ugc',
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
