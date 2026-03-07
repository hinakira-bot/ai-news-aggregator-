import { neon } from '@neondatabase/serverless';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return Response.json({ error: 'DATABASE_URL not configured' }, {
        status: 500,
        headers: corsHeaders(),
      });
    }

    const sql = neon(process.env.DATABASE_URL);

    // 最新のis_pick=trueの記事を取得
    const articles = await sql`
      SELECT id, title, url, source_name, published_at, summary, commentary, key_points, faq, category, content, thumbnail_url
      FROM articles
      WHERE is_pick = true
      ORDER BY collected_at DESC
      LIMIT 1
    `;

    if (articles.length === 0) {
      return Response.json({ error: 'Pickup記事が見つかりませんでした' }, {
        status: 404,
        headers: corsHeaders(),
      });
    }

    const article = articles[0];

    return Response.json({
      id: article.id,
      title: article.title,
      url: article.url,
      source_name: article.source_name,
      published_at: article.published_at,
      summary: article.summary,
      commentary: article.commentary,
      key_points: article.key_points || [],
      faq: article.faq || [],
      category: article.category,
      content: article.content,
      thumbnail_url: article.thumbnail_url,
    }, {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (error) {
    console.error('Pickup API error:', error);
    return Response.json({ error: 'サーバーエラーが発生しました' }, {
      status: 500,
      headers: corsHeaders(),
    });
  }
}

// CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
