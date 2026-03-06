import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI;
let model;

function getModel() {
  if (!model) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    });
  }
  return model;
}

const BATCH_SIZE = 5;

export async function enrichArticles(articles, historicalContext = {}) {
  const enriched = [];

  // バッチ処理（5記事ずつ）
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    console.log(`Enriching batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(articles.length / BATCH_SIZE)}...`);

    try {
      const results = await enrichBatch(batch, historicalContext);
      enriched.push(...results);
    } catch (error) {
      console.error(`Batch enrichment failed, retrying...`, error.message);
      // リトライ1回
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const results = await enrichBatch(batch, historicalContext);
        enriched.push(...results);
      } catch (retryError) {
        console.error(`Retry failed, saving without enrichment`, retryError.message);
        // 要約なしで保存
        for (const article of batch) {
          enriched.push({
            ...article,
            summary: null,
            commentary: null,
            keyPoints: [],
            faq: [],
            category: 'ai-tools',
            relevanceScore: 5,
            importance: 'medium',
            originalTitle: article.sourceLang === 'en' ? article.title : null,
          });
        }
      }
    }

    // レート制限対策: バッチ間に少し待機
    if (i + BATCH_SIZE < articles.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // relevanceScore 0 の記事を除外
  const filtered = enriched.filter(a => a.relevanceScore > 0);
  console.log(`Enrichment complete: ${enriched.length} processed, ${enriched.length - filtered.length} excluded (relevance=0), ${filtered.length} kept`);

  return filtered;
}

async function enrichBatch(articles, historicalContext = {}) {
  const ai = getModel();

  const articlesForPrompt = articles.map((a, i) => ({
    index: i,
    title: a.title,
    description: a.description?.substring(0, 300) || '',
    source: a.sourceName,
    lang: a.sourceLang,
    // 記事本文（extractor.js で取得済み、最大2000文字）
    article_text: a.bodyText?.substring(0, 2000) || null,
  }));

  // 過去記事コンテキストを構築
  let historySection = '';
  const historyEntries = Object.entries(historicalContext);
  if (historyEntries.length > 0) {
    const historyData = historyEntries.map(([cat, arts]) => ({
      category: cat,
      recent_articles: arts.map(a => ({
        title: a.title,
        summary: a.summary?.substring(0, 150) || '',
        date: a.collected_at,
      }))
    }));
    historySection = `
## 過去の関連記事（直近7日間）
以下は過去7日間に掲載された関連記事の要約です。考察（commentary）では、これらの過去記事との関連性や流れを踏まえて、「先週発表された〇〇と比較すると...」「以前から話題になっている〇〇の続報として...」のように、時系列的な文脈を盛り込んでください。ただし過去記事への言及は自然な場合のみ行い、無理に言及する必要はありません。

${JSON.stringify(historyData, null, 2)}
`;
  }

  const prompt = `あなたは「ヒナキラ」という名前のAI情報ブロガーです。以下の記事を分析し、**個人ユーザー・クリエイター・副業者**にとっての価値を判定してください。

## 対象読者
- 個人でAIを活用したい人（マーケター、副業者、クリエイター、ノーコーダー）
- AIの最新ツールやLLMの動向を追いたい人

## カテゴリ一覧（slugで回答）
- ai-tools: 最新ツール・サービス（新しいAIツールの紹介・レビュー）
- llm-models: 最新LLM・モデル（GPT, Claude, Gemini等の新モデル情報）
- prompts: プロンプト・活用術（プロンプトのコツ、使い方Tips）
- marketing: マーケティング×AI（SNS、広告、コピーライティングのAI活用）
- side-business: 副業・収益化（AIを使った副業、ビジネス活用）
- vibe-coding: バイブコーディング（AI支援コーディング、ノーコード）
- workflow: ワークフロー・自動化（Make, Zapier, n8n等のAI自動化）
- media-ai: 画像・動画・音声AI（Midjourney, Suno, ElevenLabs等）

## 除外基準（relevance_score = 0にする）
- 大手企業のAI導入事例（例: 「トヨタがAIを〇〇に活用」）
- エンタープライズ向けBtoB SaaS
- 純粋に理論的な学術論文（数式中心、再現不可能な基礎研究）
- 政府の規制・政策のみ

## 論文の扱い（arXiv等）
- 個人が実際に使えるツール・モデル・手法を紹介する論文は対象とする（relevance_score 3〜6程度）
- 新しいLLMの性能比較、プロンプト手法、画像生成の新技術などは実用的なので含める
- ただしニュース記事より優先度は下げる（importanceは原則 "low"）

## 記事一覧
各記事にはtitle、description（RSS概要）に加え、article_text（記事本文、最大2000文字）が含まれます。
article_textがnullの記事は、titleとdescriptionのみで判断してください。
article_textがある記事は、本文の具体的な内容（数値、機能名、比較情報など）を活用して、より深い要約・考察を生成してください。

${JSON.stringify(articlesForPrompt, null, 2)}
${historySection}
## 回答形式
以下のJSON配列で回答してください。各記事に対して:
[
  {
    "index": 0,
    "summary": "200〜300文字の日本語要約。記事の主要な事実・内容をわかりやすくまとめる。何が発表されたか、何が起きたか、どういう機能かを具体的に記述する。article_textがある場合は具体的な数値や機能名も含める。",
    "commentary": "400〜500文字の独自考察。事実の列挙ではなく、個人ユーザー・クリエイターにとってなぜ重要か、どう活用できるか、今後どんな影響があるかを深く解釈する。ブログ記事風の読みやすい文体で、「〜でしょう」「〜と考えられます」「〜がポイントです」などの表現を使い、読者が自分ごととして捉えられる視点で書く。具体的な活用シーンや、今後の展望にも触れる。過去の関連記事がある場合は、時系列的な文脈も自然に盛り込む。",
    "key_points": ["ポイント1（30〜50文字）", "ポイント2（30〜50文字）", "ポイント3（30〜50文字）"],
    "faq": [
      {"question": "読者が気になりそうな質問（30〜60文字）", "answer": "80〜120文字の回答"},
      {"question": "もう一つの質問（30〜60文字）", "answer": "80〜120文字の回答"}
    ],
    "category": "カテゴリslug",
    "relevance_score": 0-10の整数（個人ユーザーへの関連度。0=対象外で除外される）,
    "importance": "high|medium|low",
    "title_ja": "英語記事の場合、日本語タイトル。日本語記事はnull"
  }
]

key_pointsは記事のポイントを3つ、具体的かつ簡潔にまとめる。「〜できる」「〜がある」などの体言止めや動詞終わりで統一。
faqは読者が記事を読んで気になりそうな質問を2つ作成し、わかりやすく回答する。

JSONのみを出力し、他のテキストは含めないでください。`;

  const result = await ai.generateContent(prompt);
  const text = result.response.text();

  // JSONを抽出（```json ... ``` のブロック対応）
  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  const parsed = JSON.parse(jsonStr.trim());

  return articles.map((article, i) => {
    const enrichment = parsed.find(p => p.index === i) || {};
    return {
      ...article,
      summary: enrichment.summary || null,
      commentary: enrichment.commentary || null,
      keyPoints: enrichment.key_points || [],
      faq: enrichment.faq || [],
      category: enrichment.category || 'ai-tools',
      relevanceScore: enrichment.relevance_score ?? 5,
      importance: enrichment.importance || 'medium',
      originalTitle: enrichment.title_ja || (article.sourceLang === 'en' ? article.title : null),
      title: enrichment.title_ja || article.title,
    };
  });
}
