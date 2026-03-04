import { neon } from '@neondatabase/serverless';

let sql;

function getDb() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

export async function initializeDatabase() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      source_name VARCHAR(100),
      source_lang VARCHAR(2),
      published_at TIMESTAMP,
      collected_at TIMESTAMP DEFAULT NOW(),
      summary TEXT,
      category VARCHAR(50),
      relevance_score INTEGER DEFAULT 5,
      importance VARCHAR(10) DEFAULT 'medium',
      original_title TEXT,
      thumbnail_url TEXT
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_articles_collected ON articles(collected_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_articles_importance ON articles(importance)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_name)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_articles_relevance ON articles(relevance_score)`;

  // commentary カラム追加（既存テーブルへの安全な追加）
  await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS commentary TEXT`;
}

export async function insertArticle(article) {
  const sql = getDb();
  try {
    const result = await sql`
      INSERT INTO articles (title, url, source_name, source_lang, published_at, summary, commentary, category, relevance_score, importance, original_title, thumbnail_url)
      VALUES (${article.title}, ${article.url}, ${article.sourceName}, ${article.sourceLang}, ${article.publishedAt}, ${article.summary}, ${article.commentary || null}, ${article.category}, ${article.relevanceScore}, ${article.importance}, ${article.originalTitle}, ${article.thumbnailUrl})
      ON CONFLICT (url) DO NOTHING
      RETURNING id
    `;
    return result.length > 0 ? result[0].id : null;
  } catch (error) {
    console.error(`Failed to insert article: ${article.url}`, error.message);
    return null;
  }
}

export async function getExistingUrls(urls) {
  if (urls.length === 0) return new Set();
  const sql = getDb();
  const result = await sql`SELECT url FROM articles WHERE url = ANY(${urls})`;
  return new Set(result.map(r => r.url));
}

export async function getArticles({ date, category, importance, search, page = 1, limit = 50 }) {
  const sql = getDb();
  const offset = (page - 1) * limit;

  let conditions = [];
  let params = [];

  if (date) {
    conditions.push(`DATE(collected_at AT TIME ZONE 'Asia/Tokyo') = '${date}'`);
  }
  if (category) {
    conditions.push(`category = '${category}'`);
  }
  if (importance) {
    conditions.push(`importance = '${importance}'`);
  }
  if (search) {
    conditions.push(`(title ILIKE '%${search}%' OR summary ILIKE '%${search}%' OR original_title ILIKE '%${search}%')`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const articles = await sql`
    SELECT * FROM articles
    WHERE
      (${date}::text IS NULL OR DATE(collected_at AT TIME ZONE 'Asia/Tokyo') = ${date}::date)
      AND (${category}::text IS NULL OR category = ${category})
      AND (${importance}::text IS NULL OR importance = ${importance})
      AND (${search}::text IS NULL OR title ILIKE ${'%' + (search || '') + '%'} OR summary ILIKE ${'%' + (search || '') + '%'})
    ORDER BY relevance_score DESC, importance ASC, published_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const countResult = await sql`
    SELECT COUNT(*) as total FROM articles
    WHERE
      (${date}::text IS NULL OR DATE(collected_at AT TIME ZONE 'Asia/Tokyo') = ${date}::date)
      AND (${category}::text IS NULL OR category = ${category})
      AND (${importance}::text IS NULL OR importance = ${importance})
      AND (${search}::text IS NULL OR title ILIKE ${'%' + (search || '') + '%'} OR summary ILIKE ${'%' + (search || '') + '%'})
  `;

  const categoryStats = await sql`
    SELECT category, COUNT(*) as count FROM articles
    WHERE
      (${date}::text IS NULL OR DATE(collected_at AT TIME ZONE 'Asia/Tokyo') = ${date}::date)
    GROUP BY category
    ORDER BY count DESC
  `;

  return {
    articles,
    total: parseInt(countResult[0].total),
    categories: Object.fromEntries(categoryStats.map(c => [c.category, parseInt(c.count)])),
  };
}

export async function getAvailableDates(limit = 30) {
  const sql = getDb();
  const result = await sql`
    SELECT DISTINCT TO_CHAR(collected_at AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD') as date, COUNT(*) as count
    FROM articles
    GROUP BY TO_CHAR(collected_at AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD')
    ORDER BY date DESC
    LIMIT ${limit}
  `;
  return result;
}
