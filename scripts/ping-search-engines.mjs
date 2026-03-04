/**
 * デプロイ後にGoogle/Bingにsitemap更新を通知する
 * + IndexNow APIでBing/Yandexに新しいURLを即時通知
 */
import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://hinakira.com/ai-news';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '';

async function pingSitemap() {
  console.log('=== Pinging search engines with sitemap ===');

  // Google Sitemap Ping
  try {
    const googleUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
    const res = await fetch(googleUrl);
    console.log(`  Google ping: ${res.status} ${res.statusText}`);
  } catch (e) {
    console.warn(`  Google ping failed: ${e.message}`);
  }

  // Bing Sitemap Ping
  try {
    const bingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
    const res = await fetch(bingUrl);
    console.log(`  Bing ping: ${res.status} ${res.statusText}`);
  } catch (e) {
    console.warn(`  Bing ping failed: ${e.message}`);
  }
}

async function indexNow() {
  if (!INDEXNOW_KEY) {
    console.log('  IndexNow: INDEXNOW_KEY not set, skipping');
    return;
  }

  console.log('=== IndexNow: Submitting new URLs ===');

  // 全記事IDから最新のURL一覧を作成
  const idsPath = path.join(process.cwd(), 'public', 'data', 'all-ids.json');
  let urls = [`${SITE_URL}/`];

  try {
    const ids = JSON.parse(fs.readFileSync(idsPath, 'utf-8'));
    urls.push(...ids.map(id => `${SITE_URL}/articles/${id}/`));
  } catch (e) {
    console.warn(`  Could not read all-ids.json: ${e.message}`);
  }

  // IndexNow API (Bing)
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'hinakira.com',
        key: INDEXNOW_KEY,
        keyLocation: `https://hinakira.com/${INDEXNOW_KEY}.txt`,
        urlList: urls.slice(0, 100), // 最大100件
      }),
    });
    console.log(`  IndexNow: ${res.status} ${res.statusText} (${urls.length} URLs)`);
  } catch (e) {
    console.warn(`  IndexNow failed: ${e.message}`);
  }
}

async function main() {
  await pingSitemap();
  await indexNow();
  console.log('=== Search engine notification complete ===');
}

main().catch(err => {
  console.error('Ping failed:', err);
  // ping失敗はデプロイ全体を止めない
  process.exit(0);
});
