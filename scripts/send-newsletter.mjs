import { neon } from '@neondatabase/serverless';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ===== 設定 =====
const SITE_URL = 'https://hinakira.com/ai-news';
const SITE_NAME = 'Hinakira AI News';
const FULL_RANK_CUTOFF = 3; // 1位〜3位はフル表示、4位以下は要約のみ

const CATEGORY_LABELS = {
  'ai-tools': '最新ツール',
  'llm-models': 'LLM',
  'prompts': 'プロンプト',
  'marketing': 'マーケ×AI',
  'side-business': '副業',
  'vibe-coding': 'バイブコーディング',
  'workflow': '自動化',
  'media-ai': '画像・動画AI',
};

const CATEGORY_EMOJI = {
  'ai-tools': '\u{1F6E0}',
  'llm-models': '\u{1F916}',
  'prompts': '\u{1F4A1}',
  'marketing': '\u{1F4C8}',
  'side-business': '\u{1F4B0}',
  'vibe-coding': '\u{1F468}\u{200D}\u{1F4BB}',
  'workflow': '\u{26A1}',
  'media-ai': '\u{1F3A8}',
};

// ===== DB接続 =====
function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(process.env.DATABASE_URL);
}

// ===== 記事取得（当日分、relevance_score降順） =====
async function getTodayArticles(dateOverride) {
  const sql = getDb();
  const targetDate = dateOverride || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });

  console.log(`Fetching articles for date: ${targetDate}`);

  const articles = await sql`
    SELECT id, title, url, source_name, published_at, collected_at,
           summary, commentary, category, relevance_score, importance, is_pick
    FROM articles
    WHERE DATE(collected_at AT TIME ZONE 'Asia/Tokyo') = ${targetDate}::date
    ORDER BY relevance_score DESC, importance ASC, published_at DESC
    LIMIT 10
  `;

  return articles;
}

// ===== 日付フォーマット =====
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}/${month}/${day}`;
}

function formatDateForSubject(dateOverride) {
  const now = dateOverride
    ? new Date(dateOverride + 'T00:00:00+09:00')
    : new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[now.getDay()];
  return `${month}/${day}(${weekday})`;
}

// ===== 英単語判定 =====
function isAsciiWordChar(ch) {
  if (!ch) return false;
  const c = ch.charCodeAt(0);
  // A-Z, a-z, 0-9, ハイフン, ドット, スラッシュ, アンダースコア, アットマーク
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57)
    || ch === '-' || ch === '.' || ch === '/' || ch === '_' || ch === '@'
    || ch === ':' || ch === '#';
}

// ===== テキストをトークン分割 =====
function tokenize(str) {
  const tokens = [];
  let i = 0;
  while (i < str.length) {
    if (isAsciiWordChar(str[i])) {
      // 英単語（連続ASCII文字）を1トークンに
      let start = i;
      while (i < str.length && isAsciiWordChar(str[i])) i++;
      tokens.push(str.substring(start, i));
    } else {
      // 日本語文字・記号は1文字ずつ
      tokens.push(str[i]);
      i++;
    }
  }
  return tokens;
}

// ===== 禁則文字（行頭禁止） =====
const KINSOKU_HEAD = '。、！？）」』】〉》：；.,!?)]}';

// ===== テキスト折り返し（スマホ用・23文字） =====
function wrapText(str, maxLen = 23) {
  if (!str) return '';
  str = str.replace(/\n/g, '');
  const tokens = tokenize(str);
  const lines = [];
  let currentLine = '';

  for (let t = 0; t < tokens.length; t++) {
    const token = tokens[t];

    if (currentLine.length + token.length <= maxLen) {
      // 行に収まる
      currentLine += token;
    } else if (KINSOKU_HEAD.includes(token) && token.length === 1) {
      // 禁則処理: 句読点は前の行に付ける（1文字はみ出しOK）
      currentLine += token;
    } else {
      // 行に収まらない → 改行
      if (currentLine.length > 0) {
        lines.push(currentLine.trimEnd());
      }
      if (token === ' ') {
        currentLine = '';
      } else if (token.length > maxLen) {
        // 極端に長い単語は強制分割
        let remaining = token;
        while (remaining.length > maxLen) {
          lines.push(remaining.substring(0, maxLen));
          remaining = remaining.substring(maxLen);
        }
        currentLine = remaining;
      } else {
        currentLine = token;
      }
    }
  }

  if (currentLine.trim().length > 0) {
    lines.push(currentLine.trimEnd());
  }

  return lines.join('\n');
}

// ===== 要約を短く切り詰め（HTML用） =====
function truncateSummary(summary, maxLen = 60) {
  if (!summary) return '';
  const firstSentence = summary.split(/[。！？]/).filter(Boolean)[0];
  if (firstSentence && firstSentence.length <= maxLen) {
    return firstSentence + '。';
  }
  return summary.substring(0, maxLen) + '...';
}

// ===== 考察を冒頭2文に短縮 =====
function truncateCommentary(commentary, sentenceCount = 2) {
  if (!commentary) return '';
  // 。！？で文を分割し、区切り文字を保持
  const sentences = commentary.match(/[^。！？]+[。！？]/g);
  if (!sentences || sentences.length <= sentenceCount) {
    return commentary; // 短い場合はそのまま
  }
  return sentences.slice(0, sentenceCount).join('');
}

// ===== テキスト版メルマガ生成 =====
function generateTextNewsletter(articles, dateStr) {
  const dateLabel = formatDateForSubject(dateStr);
  const totalCount = articles.length;
  const LINE = '━'.repeat(20);
  const LINE_THIN = '─'.repeat(20);

  let text = '';

  // ヘッダー
  text += `${LINE}\n`;
  text += `${SITE_NAME}\n`;
  text += `AI\u30CB\u30E5\u30FC\u30B9 TOP${totalCount}\n`;
  text += `${dateLabel}\u53F7\n`;
  text += `${LINE}\n\n`;

  text += `\u3053\u3093\u306B\u3061\u306F\u3001\n`;
  text += `\u30D2\u30CA\u30AD\u30E9\u3067\u3059\u3002\n\n`;
  text += `\u4ECA\u65E5\u3082AI\u306E\u6700\u65B0\u30CB\u30E5\u30FC\u30B9\u3092\n`;
  text += `\u304A\u5C4A\u3051\u3057\u307E\u3059\uFF01\n\n`;

  // ランキング（10位→1位の逆順で表示）
  const ranked = articles.map((a, i) => ({ ...a, rank: i + 1 })).reverse();

  // --- 10位〜4位（ダイジェスト）---
  const digestArticles = ranked.filter(a => a.rank > FULL_RANK_CUTOFF);
  if (digestArticles.length > 0) {
    text += `${LINE_THIN}\n`;
    text += `\u7B2C${digestArticles[0].rank}\u4F4D\uFF5E\u7B2C${digestArticles[digestArticles.length - 1].rank}\u4F4D\n`;
    text += `${LINE_THIN}\n\n`;

    for (const article of digestArticles) {
      text += `-- \u7B2C${article.rank}\u4F4D\n`;
      text += `${wrapText(article.title)}\n`;
      text += `[${article.source_name}]\n`;
      if (article.summary) {
        text += `\n`;
        text += `${article.summary}\n`;
      }
      text += `\n`;
    }

    text += `>> \u8A73\u3057\u304F\u306F\u30B5\u30A4\u30C8\u3067\n`;
    text += `${SITE_URL}/\n\n`;
  }

  // --- 3位→2位→1位（フル表示・盛り上がる順）---
  const fullArticles = ranked.filter(a => a.rank <= FULL_RANK_CUTOFF);

  if (fullArticles.length > 0) {
    text += `${LINE}\n`;
    text += `TOP${FULL_RANK_CUTOFF} \u8A73\u7D30\u30EC\u30D3\u30E5\u30FC\n`;
    text += `${LINE}\n\n`;
  }

  for (const article of fullArticles) {
    text += `${LINE_THIN}\n`;
    text += `\u7B2C${article.rank}\u4F4D\n`;
    text += `${wrapText(article.title)}\n`;
    text += `${LINE_THIN}\n`;
    text += `[${article.source_name}]\n`;
    text += `${formatDate(article.published_at)}\n\n`;

    if (article.summary) {
      text += `\u3010\u8981\u7D04\u3011\n`;
      text += `${article.summary}\n\n`;
    }

    if (article.commentary) {
      text += `\u3010\u30D2\u30CA\u30AD\u30E9\u306E\u8003\u5BDF\u3011\n`;
      if (article.rank === 1) {
        // 1位のみ全文表示
        text += `${article.commentary}\n\n`;
      } else {
        // 2位・3位は冒頭2文のみ
        text += `${truncateCommentary(article.commentary)}\n`;
        text += `\u2026\u7D9A\u304D\u306F\u30B5\u30A4\u30C8\u3067\n\n`;
      }
    }

    text += `>> \u8A18\u4E8B\u3092\u8AAD\u3080\n`;
    text += `${SITE_URL}/articles/${article.id}/\n\n`;
  }

  // フッター
  text += `${LINE}\n`;
  text += `\u5168\u8A18\u4E8B\u4E00\u89A7\n`;
  text += `${SITE_URL}/\n\n`;
  text += `${LINE}\n`;
  text += `${SITE_NAME}\n`;
  text += `\u500B\u4EBA\u5411\u3051AI\u6700\u65B0\u60C5\u5831\u3092\n`;
  text += `\u6BCE\u65E5\u914D\u4FE1\n`;
  text += `${LINE}\n\n`;

  // 発行者情報フッター
  const DIAMOND = '\u25C7'.repeat(20);
  text += `${DIAMOND}\n\n`;
  text += `\u3010\u304A\u554F\u3044\u5408\u308F\u305B\u3011:info@hinakira.net\n`;
  text += `\u3010\u767A\u884C\u8005\u3011\u30D2\u30CA\u30AD\u30E9\n`;
  text += `\u3010Twitter(X)\u3011:https://x.com/hinakira_gpts\n`;
  text += `\u3010Instagram\u3011:https://www.instagram.com/hinakira_gpts_creator/\n`;
  text += `\u3010Threads\u3011:https://www.threads.com/@hinakira_gpts_creator\n`;
  text += `\u3010\u30D6\u30ED\u30B0\u3011:https://hinakira.com/\n`;
  text += `\u3010\u7279\u96FB\u6CD5\u3011:https://hinakira.com/blog/special-telecommunications-law/\n\n`;
  text += `${DIAMOND}\n\n`;
  text += `\u3010\u30E1\u30EB\u30A2\u30C9\u30EC\u30B9\u5909\u66F4\u3011:%change_mail_url%\n`;
  text += `\u3010\u8CFC\u8AAD\u89E3\u9664\u3011:%cancelurl%\n\n`;
  text += `${DIAMOND}\n`;

  return text;
}

// ===== HTML版メルマガ生成 =====
function generateHtmlNewsletter(articles, dateStr) {
  const dateLabel = formatDateForSubject(dateStr);
  const totalCount = articles.length;
  const ranked = articles.map((a, i) => ({ ...a, rank: i + 1 })).reverse();
  const digestArticles = ranked.filter(a => a.rank > FULL_RANK_CUTOFF);
  const fullArticles = ranked.filter(a => a.rank <= FULL_RANK_CUTOFF);
  const CATEGORY_BG = {
    'ai-tools': '#f3e8ff',
    'llm-models': '#dbeafe',
    'prompts': '#dcfce7',
    'marketing': '#fce7f3',
    'side-business': '#fef9c3',
    'vibe-coding': '#cffafe',
    'workflow': '#e0e7ff',
    'media-ai': '#fee2e2',
  };
  const CATEGORY_TEXT_COLOR = {
    'ai-tools': '#7e22ce',
    'llm-models': '#1d4ed8',
    'prompts': '#15803d',
    'marketing': '#be185d',
    'side-business': '#a16207',
    'vibe-coding': '#0e7490',
    'workflow': '#4338ca',
    'media-ai': '#dc2626',
  };

  let html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${SITE_NAME} - ${dateLabel}</title>
<style>
  body { margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, 'Segoe UI', 'Hiragino Sans', sans-serif; }
  .wrapper { max-width: 640px; margin: 0 auto; background: #ffffff; }
  .header { background: linear-gradient(135deg, #4a5a7a 0%, #5d6d8e 50%, #c4a0a0 100%); padding: 28px 24px; text-align: center; }
  .header h1 { color: #fff; font-size: 22px; margin: 0 0 4px 0; letter-spacing: 0.5px; }
  .header .subtitle { color: rgba(255,255,255,0.85); font-size: 13px; margin: 0; }
  .header .date-badge { display: inline-block; background: rgba(255,255,255,0.2); color: #fff; padding: 4px 16px; border-radius: 20px; font-size: 12px; margin-top: 10px; font-weight: 600; }
  .body-content { padding: 24px; }
  .greeting { color: #374151; font-size: 14px; line-height: 1.8; margin-bottom: 24px; }
  .section-header { background: #f8fafc; border-left: 4px solid #4a5a7a; padding: 10px 16px; margin: 24px 0 16px 0; font-size: 15px; font-weight: 700; color: #1f2937; }
  .digest-item { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
  .digest-title { font-size: 14px; font-weight: 600; color: #1f2937; }
  .digest-meta { margin-top: 4px; font-size: 12px; color: #6b7280; }
  .digest-summary { margin-top: 4px; font-size: 13px; color: #4b5563; line-height: 1.6; }
  .category-tag { display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; margin-right: 6px; vertical-align: middle; }
  .full-article { margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
  .full-article-header { padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
  .rank-medal { font-size: 24px; margin-right: 8px; vertical-align: middle; }
  .full-article-title { font-size: 16px; font-weight: 700; color: #1f2937; line-height: 1.5; }
  .full-article-body { padding: 20px; }
  .summary-section { margin-bottom: 16px; }
  .summary-section h4 { font-size: 13px; color: #4a5a7a; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 2px solid #4a5a7a; display: inline-block; }
  .summary-section p { font-size: 14px; color: #374151; line-height: 1.8; margin: 0; }
  .commentary-section { background: linear-gradient(135deg, #f5eded 0%, #eef0f4 100%); border-left: 4px solid #c4a0a0; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 16px; }
  .commentary-section h4 { font-size: 13px; color: #4a5a7a; margin: 0 0 8px 0; }
  .commentary-section p { font-size: 14px; color: #374151; line-height: 1.8; margin: 0; }
  .article-link { display: inline-block; background: linear-gradient(135deg, #4a5a7a, #5d6d8e); color: #fff !important; text-decoration: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-top: 4px; }
  .article-link:hover { opacity: 0.9; }
  .source-link { font-size: 12px; color: #6b7280; margin-top: 8px; }
  .source-link a { color: #4a5a7a; text-decoration: underline; }
  .site-cta { text-align: center; margin: 28px 0; }
  .site-cta a { display: inline-block; background: linear-gradient(135deg, #4a5a7a 0%, #5d6d8e 40%, #c4a0a0 100%); color: #fff !important; text-decoration: none; padding: 12px 32px; border-radius: 10px; font-size: 14px; font-weight: 700; }
  .footer { background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb; }
  .footer p { font-size: 12px; color: #9ca3af; margin: 4px 0; line-height: 1.6; }
  .footer a { color: #4a5a7a; text-decoration: underline; }
  @media (max-width: 480px) {
    .body-content { padding: 16px; }
    .full-article-body { padding: 14px; }
    .header h1 { font-size: 18px; }
  }
</style>
</head>
<body>
<div class="wrapper">

  <!-- ヘッダー -->
  <div class="header">
    <h1>${SITE_NAME}</h1>
    <p class="subtitle">AI\u30CB\u30E5\u30FC\u30B9 TOP${totalCount}\u30E9\u30F3\u30AD\u30F3\u30B0</p>
    <div class="date-badge">${dateLabel}\u53F7</div>
  </div>

  <div class="body-content">

    <!-- 挨拶 -->
    <div class="greeting">
      \u3053\u3093\u306B\u3061\u306F\u3001\u30D2\u30CA\u30AD\u30E9\u3067\u3059\u3002<br>
      \u4ECA\u65E5\u3082AI\u306E\u6700\u65B0\u30CB\u30E5\u30FC\u30B9\u3092\u304A\u5C4A\u3051\u3057\u307E\u3059\uFF01
    </div>`;

  // --- ダイジェスト（10位〜4位）---
  if (digestArticles.length > 0) {
    html += `
    <div class="section-header">
      \u7B2C${digestArticles[0].rank}\u4F4D\uFF5E\u7B2C${digestArticles[digestArticles.length - 1].rank}\u4F4D\uFF08\u30C0\u30A4\u30B8\u30A7\u30B9\u30C8\uFF09
    </div>`;

    for (const article of digestArticles) {
      html += `
    <div class="digest-item">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="38" valign="top" style="padding-right:10px;">
          <div style="background:#4a5a7a;color:#fff;font-size:11px;font-weight:700;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;">${article.rank}</div>
        </td>
        <td valign="top">
          <div class="digest-title">${escapeHtml(article.title)}</div>
          <div class="digest-meta">
            <span class="category-tag" style="background:#eef0f4;color:#4a5a7a;">${escapeHtml(article.source_name)}</span>
          </div>
          ${article.summary ? `<div class="digest-summary">${escapeHtml(article.summary)}</div>` : ''}
        </td>
      </tr></table>
    </div>`;
    }

    html += `
    <div style="text-align:center;margin:16px 0;">
      <a href="${SITE_URL}/" style="color:#4a5a7a;font-size:13px;text-decoration:underline;">&raquo; \u5168\u8A18\u4E8B\u3092\u30B5\u30A4\u30C8\u3067\u898B\u308B</a>
    </div>`;
  }

  // --- フル表示（3位〜1位）---
  if (fullArticles.length > 0) {
    html += `
    <div class="section-header">
      TOP${FULL_RANK_CUTOFF} \u8A73\u7D30\u30EC\u30D3\u30E5\u30FC
    </div>`;

    for (const article of fullArticles) {
      html += `
    <div class="full-article">
      <div class="full-article-header">
        <span class="rank-medal">\u7B2C${article.rank}\u4F4D</span>
        <span class="category-tag" style="background:#eef0f4;color:#4a5a7a;">${escapeHtml(article.source_name)}</span>
        <span style="font-size:12px;color:#6b7280;">${formatDate(article.published_at)}</span>
        <div class="full-article-title" style="margin-top:8px;">${escapeHtml(article.title)}</div>
      </div>
      <div class="full-article-body">`;

      if (article.summary) {
        html += `
        <div class="summary-section">
          <h4>\u3010\u8981\u7D04\u3011</h4>
          <p>${escapeHtml(article.summary)}</p>
        </div>`;
      }

      if (article.commentary) {
        if (article.rank === 1) {
          // 1位は全文表示
          html += `
        <div class="commentary-section">
          <h4>\u3010\u30D2\u30CA\u30AD\u30E9\u306E\u8003\u5BDF\u3011</h4>
          <p>${escapeHtml(article.commentary)}</p>
        </div>`;
        } else {
          // 2位・3位は冒頭2文 + 続きリンク
          html += `
        <div class="commentary-section">
          <h4>\u3010\u30D2\u30CA\u30AD\u30E9\u306E\u8003\u5BDF\u3011</h4>
          <p>${escapeHtml(truncateCommentary(article.commentary))}<br><a href="${SITE_URL}/articles/${article.id}/" style="color:#4a5a7a;font-weight:600;">\u2026\u7D9A\u304D\u3092\u8AAD\u3080</a></p>
        </div>`;
        }
      }

      html += `
        <a href="${SITE_URL}/articles/${article.id}/" class="article-link">&raquo; \u8A18\u4E8B\u3092\u8AAD\u3080</a>
      </div>
    </div>`;
    }
  }

  // CTA + フッター
  html += `
    <div class="site-cta">
      <a href="${SITE_URL}/">\u5168\u8A18\u4E8B\u4E00\u89A7\u3092\u898B\u308B</a>
    </div>

  </div><!-- /body-content -->

  <div class="footer">
    <p><strong>${SITE_NAME}</strong></p>
    <p>\u500B\u4EBA\u5411\u3051AI\u6700\u65B0\u60C5\u5831\u3092\u6BCE\u65E5\u914D\u4FE1</p>
    <p><a href="${SITE_URL}/">${SITE_URL}/</a></p>
  </div>

  <!-- 発行者情報フッター -->
  <div style="background:#f1f3f7;padding:24px;text-align:center;border-top:3px solid #c4a0a0;">
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;text-align:left;">
      <tr><td style="font-size:12px;color:#6b7280;padding:3px 0;"><span style="color:#4a5a7a;font-weight:600;">\u304A\u554F\u3044\u5408\u308F\u305B</span>\uFF1A<a href="mailto:info@hinakira.net" style="color:#4a5a7a;text-decoration:underline;">info@hinakira.net</a></td></tr>
      <tr><td style="font-size:12px;color:#6b7280;padding:3px 0;"><span style="color:#4a5a7a;font-weight:600;">\u767A\u884C\u8005</span>\uFF1A\u30D2\u30CA\u30AD\u30E9</td></tr>
      <tr><td style="font-size:12px;color:#6b7280;padding:3px 0;"><span style="color:#4a5a7a;font-weight:600;">X (Twitter)</span>\uFF1A<a href="https://x.com/hinakira_gpts" style="color:#4a5a7a;text-decoration:underline;">@hinakira_gpts</a></td></tr>
      <tr><td style="font-size:12px;color:#6b7280;padding:3px 0;"><span style="color:#4a5a7a;font-weight:600;">Instagram</span>\uFF1A<a href="https://www.instagram.com/hinakira_gpts_creator/" style="color:#4a5a7a;text-decoration:underline;">@hinakira_gpts_creator</a></td></tr>
      <tr><td style="font-size:12px;color:#6b7280;padding:3px 0;"><span style="color:#4a5a7a;font-weight:600;">Threads</span>\uFF1A<a href="https://www.threads.com/@hinakira_gpts_creator" style="color:#4a5a7a;text-decoration:underline;">@hinakira_gpts_creator</a></td></tr>
      <tr><td style="font-size:12px;color:#6b7280;padding:3px 0;"><span style="color:#4a5a7a;font-weight:600;">\u30D6\u30ED\u30B0</span>\uFF1A<a href="https://hinakira.com/" style="color:#4a5a7a;text-decoration:underline;">hinakira.com</a></td></tr>
      <tr><td style="font-size:12px;color:#6b7280;padding:3px 0;"><span style="color:#4a5a7a;font-weight:600;">\u7279\u96FB\u6CD5</span>\uFF1A<a href="https://hinakira.com/blog/special-telecommunications-law/" style="color:#4a5a7a;text-decoration:underline;">\u7279\u5B9A\u96FB\u5B50\u30E1\u30FC\u30EB\u6CD5\u306B\u57FA\u3065\u304F\u8868\u793A</a></td></tr>
    </table>
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid #dde0e6;">
      <a href="%change_mail_url%" style="font-size:11px;color:#9ca3af;text-decoration:underline;margin-right:16px;">\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u5909\u66F4</a>
      <a href="%cancelurl%" style="font-size:11px;color:#9ca3af;text-decoration:underline;">\u8CFC\u8AAD\u89E3\u9664</a>
    </div>
  </div>

</div>
</body>
</html>`;

  return html;
}

// ===== ユーティリティ =====
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncateUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    const path = u.pathname.length > 30 ? u.pathname.substring(0, 30) + '...' : u.pathname;
    return u.hostname + path;
  } catch {
    return url.length > 50 ? url.substring(0, 50) + '...' : url;
  }
}

// ===== メール件名生成 =====
function generateSubject(articles, dateStr) {
  const dateLabel = formatDateForSubject(dateStr);
  return `\u65E5\u520A\u30D2\u30CA\u30AD\u30E9AI\u30CB\u30E5\u30FC\u30B9TOP10 \u3010${dateLabel}\u3011`;
}

// ===== メイン処理 =====
async function main() {
  console.log('=== Hinakira AI News - Newsletter Generator ===\n');

  // 引数で日付指定可能（例: node scripts/send-newsletter.mjs 2026-03-05）
  // --send フラグは日付ではないので除外
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const dateOverride = args[0] || null;

  // Step 1: 記事取得
  const articles = await getTodayArticles(dateOverride);
  console.log(`Found ${articles.length} articles\n`);

  if (articles.length === 0) {
    console.log('No articles found for today. Skipping newsletter.');
    process.exit(0);
  }

  // Step 2: メルマガ生成
  const subject = generateSubject(articles, dateOverride);
  const textBody = generateTextNewsletter(articles, dateOverride);
  const htmlBody = generateHtmlNewsletter(articles, dateOverride);

  // Step 3: プレビュー用ファイル出力
  const outputDir = path.join(PROJECT_ROOT, 'newsletters');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const dateTag = dateOverride || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });

  // 件名
  const subjectFile = path.join(outputDir, `${dateTag}-subject.txt`);
  fs.writeFileSync(subjectFile, subject, 'utf-8');

  // テキスト版
  const textFile = path.join(outputDir, `${dateTag}-text.txt`);
  fs.writeFileSync(textFile, textBody, 'utf-8');

  // HTML版
  const htmlFile = path.join(outputDir, `${dateTag}-preview.html`);
  fs.writeFileSync(htmlFile, htmlBody, 'utf-8');

  console.log('--- Newsletter Generated ---');
  console.log(`Subject: ${subject}`);
  console.log(`Text:    ${textFile}`);
  console.log(`HTML:    ${htmlFile}`);
  console.log('');
  console.log('Open the HTML file in your browser to preview:');
  console.log(`  ${htmlFile}`);
  console.log('');

  // --send フラグが付いている場合のみ送信
  if (process.argv.includes('--send')) {
    await sendNewsletter(subject, textBody, htmlBody);
  }
}

// ===== SMTP送信 =====
async function sendNewsletter(subject, textBody, htmlBody) {
  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
  const MYASP_POST_ADDRESS = process.env.MYASP_POST_ADDRESS || 'post_tVBskSyq@hinakira.net';

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error('Error: GMAIL_USER and GMAIL_APP_PASSWORD environment variables are required for sending.');
    console.error('Set them in .env.local or GitHub Secrets.');
    process.exit(1);
  }

  console.log('--- Sending Newsletter ---');
  console.log(`From: ${GMAIL_USER}`);
  console.log(`To:   ${MYASP_POST_ADDRESS}`);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Hinakira AI News" <${GMAIL_USER}>`,
    to: MYASP_POST_ADDRESS,
    subject: subject,
    text: textBody,
    html: htmlBody,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`\u2705 Newsletter sent successfully!`);
    console.log(`Message ID: ${info.messageId}`);
  } catch (err) {
    console.error('\u274C Failed to send newsletter:', err.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Newsletter generation failed:', err);
  process.exit(1);
});
