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

export async function enrichArticles(articles) {
  const enriched = [];

  // バッチ処理（5記事ずつ）
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    console.log(`Enriching batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(articles.length / BATCH_SIZE)}...`);

    try {
      const results = await enrichBatch(batch);
      enriched.push(...results);
    } catch (error) {
      console.error(`Batch enrichment failed, retrying...`, error.message);
      // リトライ1回
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const results = await enrichBatch(batch);
        enriched.push(...results);
      } catch (retryError) {
        console.error(`Retry failed, saving without enrichment`, retryError.message);
        // 要約なしで保存
        for (const article of batch) {
          enriched.push({
            ...article,
            summary: null,
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

async function enrichBatch(articles) {
  const ai = getModel();

  const articlesForPrompt = articles.map((a, i) => ({
    index: i,
    title: a.title,
    description: a.description?.substring(0, 300) || '',
    source: a.sourceName,
    lang: a.sourceLang,
  }));

  const prompt = `あなたはAIニュースの分析者です。以下の記事を分析し、**個人ユーザー・クリエイター・副業者**にとっての価値を判定してください。

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
- 学術論文・理論的な研究のみ
- 政府の規制・政策のみ

## 記事一覧
${JSON.stringify(articlesForPrompt, null, 2)}

## 回答形式
以下のJSON配列で回答してください。各記事に対して:
[
  {
    "index": 0,
    "summary": "日本語で2-3文の要約（個人ユーザー目線で、何が使えるか・なぜ重要かを中心に）",
    "category": "カテゴリslug",
    "relevance_score": 0-10の整数（個人ユーザーへの関連度。0=対象外で除外される）,
    "importance": "high|medium|low",
    "title_ja": "英語記事の場合、日本語タイトル。日本語記事はnull"
  }
]

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
      category: enrichment.category || 'ai-tools',
      relevanceScore: enrichment.relevance_score ?? 5,
      importance: enrichment.importance || 'medium',
      originalTitle: enrichment.title_ja || (article.sourceLang === 'en' ? article.title : null),
      title: enrichment.title_ja || article.title,
    };
  });
}
