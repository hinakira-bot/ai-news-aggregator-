import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

/**
 * 記事本文を全記事から抽出する（並列実行・タイムアウト付き）
 * fetchOgImages と同じパターン: Promise.allSettled + 並行制御
 * 各記事に bodyText プロパティを追加（失敗時は null）
 */
export async function extractArticleContent(articles, concurrency = 3) {
  console.log(`Extracting article content for ${articles.length} articles...`);
  let extracted = 0;

  for (let i = 0; i < articles.length; i += concurrency) {
    const batch = articles.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map(article => fetchAndExtract(article.url))
    );

    for (let j = 0; j < batch.length; j++) {
      if (results[j].status === 'fulfilled' && results[j].value) {
        batch[j].bodyText = results[j].value;
        extracted++;
      } else {
        batch[j].bodyText = null;
      }
    }
  }

  console.log(`Content extracted: ${extracted}/${articles.length} successful`);
  return articles;
}

/**
 * 単一URLから記事本文を取得・抽出
 * @mozilla/readability + jsdom で本文テキストを取得
 * 2000文字に切り詰めて返す
 */
async function fetchAndExtract(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8秒タイムアウト

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AI-News-Aggregator/1.0 (Content Extractor)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    // Content-Type チェック（PDFやバイナリはスキップ）
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return null;
    }

    // HTMLを読み込み（上限500KB）
    const reader = response.body?.getReader();
    if (!reader) return null;

    let html = '';
    const decoder = new TextDecoder();
    const maxBytes = 500000;

    while (html.length < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }

    reader.cancel().catch(() => {});

    if (html.length < 100) return null; // あまりに短いHTMLはスキップ

    // jsdom + Readability で本文抽出
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();

    if (!article || !article.textContent) return null;

    // テキストをクリーンアップ
    const cleaned = article.textContent
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (cleaned.length < 50) return null; // 実質的な内容がない

    // 2000文字に切り詰め
    return cleaned.length > 2000 ? cleaned.substring(0, 2000) + '...' : cleaned;
  } catch (error) {
    // タイムアウト、ネットワークエラー、パースエラー → 静かにスキップ
    return null;
  }
}
