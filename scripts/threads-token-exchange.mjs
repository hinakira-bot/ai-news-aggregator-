/**
 * Threads アクセストークン交換ユーティリティ
 *
 * 使い方:
 *   node scripts/threads-token-exchange.mjs <SHORT_LIVED_TOKEN>
 *
 * 短期トークン → 長期トークン（60日間有効）に交換します。
 * 成功したら THREADS_ACCESS_TOKEN として .env.local に追記してください。
 */

const APP_SECRET = process.env.THREADS_APP_SECRET || '';

async function exchangeToken(shortLivedToken) {
  console.log('=== Threads Token Exchange ===\n');

  if (!shortLivedToken) {
    console.error('Usage: node scripts/threads-token-exchange.mjs <SHORT_LIVED_TOKEN>');
    console.error('\nShort-lived token is required.');
    console.error('Get it from: https://developers.facebook.com/apps/ → あなたのアプリ → Threads API → アクセストークンの生成');
    process.exit(1);
  }

  const appSecret = APP_SECRET;
  if (!appSecret) {
    console.error('THREADS_APP_SECRET environment variable is not set.');
    console.error('Set it in .env.local or provide it as environment variable.');
    process.exit(1);
  }

  console.log(`Token (first 20 chars): ${shortLivedToken.substring(0, 20)}...`);
  console.log(`App Secret (first 8 chars): ${appSecret.substring(0, 8)}...`);

  // Method 1: GET request (standard approach)
  console.log('\n--- Method 1: GET request ---');
  try {
    const url = new URL('https://graph.threads.net/access_token');
    url.searchParams.set('grant_type', 'th_exchange_token');
    url.searchParams.set('client_secret', appSecret);
    url.searchParams.set('access_token', shortLivedToken);

    console.log(`URL: ${url.origin}${url.pathname}?grant_type=th_exchange_token&client_secret=***&access_token=***`);

    const res = await fetch(url.toString());
    const text = await res.text();
    console.log(`Status: ${res.status}`);

    try {
      const data = JSON.parse(text);
      if (data.access_token) {
        console.log('\n=== SUCCESS ===');
        console.log(`Long-lived token: ${data.access_token}`);
        console.log(`Token type: ${data.token_type}`);
        console.log(`Expires in: ${data.expires_in} seconds (${Math.round(data.expires_in / 86400)} days)`);
        console.log(`\n.env.local に以下を追記してください:`);
        console.log(`THREADS_ACCESS_TOKEN=${data.access_token}`);
        return data;
      }
      console.log(`Error: ${JSON.stringify(data, null, 2)}`);
    } catch (e) {
      console.log(`Response: ${text.substring(0, 500)}`);
    }
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }

  // Method 2: POST request (alternative approach)
  console.log('\n--- Method 2: POST request ---');
  try {
    const params = new URLSearchParams({
      grant_type: 'th_exchange_token',
      client_secret: appSecret,
      access_token: shortLivedToken,
    });

    const res = await fetch('https://graph.threads.net/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);

    try {
      const data = JSON.parse(text);
      if (data.access_token) {
        console.log('\n=== SUCCESS ===');
        console.log(`Long-lived token: ${data.access_token}`);
        console.log(`Token type: ${data.token_type}`);
        console.log(`Expires in: ${data.expires_in} seconds (${Math.round(data.expires_in / 86400)} days)`);
        console.log(`\n.env.local に以下を追記してください:`);
        console.log(`THREADS_ACCESS_TOKEN=${data.access_token}`);
        return data;
      }
      console.log(`Error: ${JSON.stringify(data, null, 2)}`);
    } catch (e) {
      console.log(`Response: ${text.substring(0, 500)}`);
    }
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }

  console.log('\n=== トラブルシューティング ===');
  console.log('1. トークンを再生成してください（Meta Developer Console → あなたのアプリ → API設定）');
  console.log('2. 生成後すぐに（1分以内に）このスクリプトを実行してください');
  console.log('3. トークンをコピーする際、余分な空白や改行が入っていないか確認してください');
  console.log('4. アプリのスコープに threads_basic, threads_content_publish が含まれていることを確認');
}

const token = process.argv[2] || '';
exchangeToken(token).catch(err => {
  console.error('Token exchange failed:', err.message);
  process.exit(1);
});
