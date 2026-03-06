import { neon } from '@neondatabase/serverless';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ===== 設定 =====
const SITE_URL = 'https://hinakira.com/ai-news';
const NEWSLETTER_URL = 'https://my150p.com/p/r/CFsMJiCY'; // メルマガ登録URL

// ===== DB接続 =====
function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(process.env.DATABASE_URL);
}

// ===== Gemini =====
function getModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  });
}

// ===== Pick記事を取得（前日のTOP1） =====
async function getPickArticle(dateOverride) {
  const sql = getDb();
  let targetDate;
  if (dateOverride) {
    targetDate = dateOverride;
  } else {
    // デフォルト: 前日（JST）
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    targetDate = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });
  }

  console.log(`Target date: ${targetDate}`);

  const result = await sql`
    SELECT id, title, url, source_name, summary, commentary, key_points, faq, category, content, is_pick
    FROM articles
    WHERE DATE(collected_at AT TIME ZONE 'Asia/Tokyo') = ${targetDate}::date
    ORDER BY is_pick DESC, relevance_score DESC, importance ASC
    LIMIT 1
  `;

  return result.length > 0 ? result[0] : null;
}

// ===== 過去の関連記事を取得 =====
async function getRelatedContext(category, daysBack = 7) {
  const sql = getDb();
  const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const result = await sql`
    SELECT title, summary, commentary, collected_at
    FROM articles
    WHERE category = ${category}
      AND collected_at >= ${cutoff}
    ORDER BY collected_at DESC
    LIMIT 10
  `;
  return result;
}

// ===== Gemini でThreads解説を生成 =====
async function generateThreadsContent(article, relatedArticles) {
  const model = getModel();

  // 過去記事コンテキスト
  let relatedSection = '';
  if (relatedArticles.length > 0) {
    const relatedData = relatedArticles.map(a => ({
      title: a.title,
      summary: a.summary?.substring(0, 200) || '',
      commentary: a.commentary?.substring(0, 200) || '',
      date: a.collected_at,
    }));
    relatedSection = `
## 過去7日間の関連記事
以下の過去記事を踏まえ、時系列的な文脈（「先週の〇〇と合わせて考えると...」「以前から話題の〇〇がさらに進化して...」など）を自然に盛り込んでください。

${JSON.stringify(relatedData, null, 2)}
`;
  }

  const prompt = `あなたは「ヒナキラ」という名前のAI情報発信者です。Threadsに投稿する「今日の注目AIニュース解説」を作成してください。

## あなたのキャラクター
- AI初心者〜中級者にわかりやすく伝えるのが得意
- すごいものを発見したときの興奮を隠さない
- フレンドリーで親しみやすい
- 「です・ます」調だが、感情表現は大胆

## 文体ルール
- ですます調 + 興奮や感動を素直に表現するミックス
- 「これはヤバい！」「マジですごい！」「鳥肌立ちました」など、すごいものを見つけた興奮を自然に表現
- 同じフレーズの繰り返しは避け、バリエーション豊かに
- 専門用語は必ず噛み砕いて「つまり〜ということです」と補足
- 「え？どういうこと？」のような読者の心の声を代弁する
- 1文は短く。1文ごとに改行するくらいのテンポ感
- 段落の切り替えでは必ず空行（\\n\\n）を入れる
- スマホで読むことを前提に、詰まった長文にしない

## 記事情報
タイトル: ${article.title}
ソース: ${article.source_name}
URL: ${article.url}
要約: ${article.summary || ''}
考察: ${article.commentary || ''}
キーポイント: ${JSON.stringify(article.key_points || [])}
FAQ: ${JSON.stringify(article.faq || [])}
本文: ${article.content?.substring(0, 3000) || '(本文なし)'}
${relatedSection}
## 出力形式
Threadsはリプライチェーン（スレッド）形式で投稿します。各投稿は500文字以内です。
以下のJSON形式で出力してください。

{
  "main_post": "メイン投稿テキスト（200〜450文字）。記事の最もインパクトある部分をフックに。短くパンチを効かせて、続きを読みたくなるように。最後に「続きはスレッドで👇」を入れる。ハッシュタグは使わない。",
  "replies": [
    "リプライ1（300〜480文字）：導入と解説。何が起きたか、なぜすごいか。専門用語を噛み砕いて説明。",
    "リプライ2（300〜480文字）：具体的な活用例。個人クリエイター、フク業をしている人にとっての意味。過去の関連ニュースとの文脈があれば触れる。",
    "リプライ3（300〜480文字）：今後の展望 + CTA。今後どうなるかの見通し。最後に---で区切ってメルマガ誘導CTA。"
  ]
}

## 禁止ワード（シャドウバンリスク対策）
以下の単語はそのまま使わず、必ず隠語に置き換えてください：
- 「副業」→「フク業」
- 「稼ぐ」→「カセぐ」
- 「稼げる」→「カセげる」
- 「儲かる」→「モウかる」
- 「儲ける」→「モウける」
- 「収益」→「収エキ」
- 「月収」→「月シュウ」
- 「年収」→「年シュウ」

## 重要な注意
- main_postは500文字以内に厳守。450文字前後が理想
- 各repliesも500文字以内に厳守。480文字前後が理想
- repliesは2〜4個。内容量に応じて調整
- main_postとrepliesは連続した文脈で、同じ内容を繰り返さない
- main_postはフック、repliesは本編＋CTAという役割分担
- CTAにURLは絶対に入れないこと（インプレッションが下がるため）
- CTAは以下のように：メルマガ「日刊AIニュース」で毎朝届くこと、豪華特典があること、「プロフィールのリンクから登録できます」と案内
- 上記の禁止ワードは絶対にそのまま使わないこと
- 改行は \\n、空行は \\n\\n で表現する
- JSONのみを出力し、他のテキストは含めないでください`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  return JSON.parse(jsonStr.trim());
}

// ===== メイン =====
async function main() {
  console.log('=== Threads Post Generator ===');

  // 日付オーバーライド（引数で指定可能）
  const dateOverride = process.argv[2] || null;

  // 1. Pick記事を取得
  console.log('Step 1: Getting Pick article...');
  const article = await getPickArticle(dateOverride);

  if (!article) {
    console.log('No Pick article found. Skipping Threads post.');
    process.exit(0);
  }
  console.log(`  Pick: ${article.title}`);

  // 2. 過去の関連記事を取得
  console.log('Step 2: Loading related context...');
  const relatedArticles = await getRelatedContext(article.category, 7);
  // 自分自身を除外
  const filtered = relatedArticles.filter(a => a.title !== article.title);
  console.log(`  Related articles: ${filtered.length}`);

  // 3. Geminiで解説生成
  console.log('Step 3: Generating Threads content with Gemini...');
  const content = await generateThreadsContent(article, filtered);

  // replies が無い場合のフォールバック（旧形式互換）
  const replies = content.replies || [];
  if (replies.length === 0 && content.text_attachment) {
    // 旧形式: text_attachment を500文字ずつ分割
    const att = content.text_attachment;
    for (let i = 0; i < att.length; i += 480) {
      replies.push(att.substring(i, i + 480));
    }
  }

  console.log('\n=== Generated Content ===');
  console.log('\n--- Main Post ---');
  console.log(content.main_post.replace(/\\n/g, '\n'));
  console.log(`(${content.main_post.length} chars)`);

  replies.forEach((reply, i) => {
    console.log(`\n--- Reply ${i + 1} ---`);
    console.log(reply.replace(/\\n/g, '\n'));
    console.log(`(${reply.length} chars)`);
  });

  // 4. ファイルに保存（投稿スクリプトで使う or プレビュー用）
  const outputDir = path.join(PROJECT_ROOT, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const now = new Date();
  const dateTag = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });

  const outputData = {
    date: dateTag,
    article: {
      id: article.id,
      title: article.title,
      url: article.url,
      category: article.category,
    },
    main_post: content.main_post,
    replies: replies,
    generated_at: now.toISOString(),
  };

  const outputPath = path.join(outputDir, `threads-${dateTag}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`\nSaved to: ${outputPath}`);
}

main().catch(err => {
  console.error('Threads post generation failed:', err);
  process.exit(1);
});
