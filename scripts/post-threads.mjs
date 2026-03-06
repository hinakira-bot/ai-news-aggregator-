import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ===== Threads API =====
const THREADS_API_BASE = 'https://graph.threads.net/v1.0';

// ===== ユーザーID取得 =====
async function getThreadsUserId(accessToken) {
  const res = await fetch(
    `${THREADS_API_BASE}/me?fields=id,username&access_token=${accessToken}`
  );
  const data = await res.json();
  if (data.error) {
    throw new Error(`Failed to get user ID: ${data.error.message} (code: ${data.error.code})`);
  }
  return { id: data.id, username: data.username };
}

// ===== コンテナ作成（テキスト投稿） =====
async function createTextContainer(userId, accessToken, text, replyToId = null) {
  const params = new URLSearchParams({
    media_type: 'TEXT',
    text: text,
    access_token: accessToken,
  });

  if (replyToId) {
    params.append('reply_to_id', replyToId);
  }

  const res = await fetch(`${THREADS_API_BASE}/${userId}/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json();

  if (data.error) {
    throw new Error(`Failed to create container: ${data.error.message} (code: ${data.error.code})`);
  }
  return data.id;
}

// ===== コンテナのステータス確認 =====
async function checkContainerStatus(containerId, accessToken) {
  const res = await fetch(
    `${THREADS_API_BASE}/${containerId}?fields=status,error_message&access_token=${accessToken}`
  );
  const data = await res.json();
  if (data.error) {
    throw new Error(`Failed to check status: ${data.error.message}`);
  }
  return data;
}

// ===== 公開 =====
async function publishContainer(userId, accessToken, creationId) {
  const params = new URLSearchParams({
    creation_id: creationId,
    access_token: accessToken,
  });

  const res = await fetch(`${THREADS_API_BASE}/${userId}/threads_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json();

  if (data.error) {
    throw new Error(`Failed to publish: ${data.error.message} (code: ${data.error.code})`);
  }
  return data.id;
}

// ===== ステータスをポーリングで待機 =====
async function waitForContainer(containerId, accessToken, maxWaitSec = 30) {
  for (let i = 0; i < maxWaitSec; i += 3) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const status = await checkContainerStatus(containerId, accessToken);
    if (status.status === 'FINISHED') return true;
    if (status.status === 'ERROR') {
      throw new Error(`Container processing error: ${status.error_message || 'unknown'}`);
    }
  }
  throw new Error(`Container processing timed out after ${maxWaitSec}s`);
}

// ===== 1つの投稿を作成＆公開 =====
async function createAndPublish(userId, accessToken, text, replyToId = null) {
  const containerId = await createTextContainer(userId, accessToken, text, replyToId);
  await waitForContainer(containerId, accessToken, 30);
  const postId = await publishContainer(userId, accessToken, containerId);
  return postId;
}

// ===== 改行処理ヘルパー =====
function normalizeNewlines(text) {
  return text.replace(/\\n/g, '\n');
}

// ===== メイン =====
async function main() {
  console.log('=== Threads Post Publisher ===\n');

  // 環境変数チェック
  const accessToken = process.env.THREADS_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('ERROR: THREADS_ACCESS_TOKEN environment variable is not set');
    process.exit(1);
  }

  // 入力ファイルの特定
  const dateOverride = process.argv.find(arg => /^\d{4}-\d{2}-\d{2}$/.test(arg));
  const isDryRun = process.argv.includes('--dry-run');

  let inputPath;
  if (dateOverride) {
    inputPath = path.join(PROJECT_ROOT, 'output', `threads-${dateOverride}.json`);
  } else {
    const outputDir = path.join(PROJECT_ROOT, 'output');
    if (!fs.existsSync(outputDir)) {
      console.error('Output directory not found. Run generate-threads-post.mjs first.');
      process.exit(1);
    }
    const files = fs.readdirSync(outputDir)
      .filter(f => f.startsWith('threads-') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.error('No threads output files found. Run generate-threads-post.mjs first.');
      process.exit(1);
    }
    inputPath = path.join(outputDir, files[0]);
  }

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  // ファイル読み込み
  console.log(`Reading: ${inputPath}`);
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  // 既に投稿済みかチェック
  if (data.posted_at && !process.argv.includes('--force')) {
    console.log(`Already posted at ${data.posted_at} (Post ID: ${data.threads_post_id})`);
    console.log('Use --force to re-post.');
    process.exit(0);
  }

  // 新形式（replies配列）と旧形式（text_attachment）の両対応
  const mainPost = normalizeNewlines(data.main_post);
  let replies = [];

  if (data.replies && data.replies.length > 0) {
    replies = data.replies.map(r => normalizeNewlines(r));
  } else if (data.text_attachment) {
    // 旧形式フォールバック: text_attachmentを500文字以内に分割
    const fullText = normalizeNewlines(data.text_attachment);
    const paragraphs = fullText.split('\n\n');
    let current = '';
    for (const para of paragraphs) {
      const next = current ? current + '\n\n' + para : para;
      if (next.length > 480) {
        if (current.trim()) replies.push(current.trim());
        current = para;
      } else {
        current = next;
      }
    }
    if (current.trim()) replies.push(current.trim());
  }

  const allPosts = [mainPost, ...replies];

  console.log(`Total posts: ${allPosts.length} (1 main + ${replies.length} replies)\n`);
  allPosts.forEach((post, i) => {
    const label = i === 0 ? 'Main Post' : `Reply ${i}`;
    console.log(`--- ${label} (${post.length} chars) ---`);
    console.log(post.substring(0, 120) + (post.length > 120 ? '...' : ''));
    console.log('');
  });

  // ドライランモード
  if (isDryRun) {
    console.log('\n[DRY RUN] Full content preview:\n');
    allPosts.forEach((post, i) => {
      const label = i === 0 ? 'Main Post' : `Reply ${i}`;
      console.log(`========== ${label} (${post.length} chars) ==========`);
      console.log(post);
      console.log('');
    });
    return;
  }

  // === 投稿フロー ===

  // 1. ユーザーID取得
  console.log('Step 1: Getting Threads user info...');
  const user = await getThreadsUserId(accessToken);
  console.log(`  User: @${user.username} (ID: ${user.id})\n`);

  // 2. メイン投稿を公開
  console.log('Step 2: Publishing main post...');
  const mainPostId = await createAndPublish(user.id, accessToken, mainPost);
  console.log(`  Main post published! ID: ${mainPostId}`);

  // 3. リプライチェーンを公開
  const postIds = [mainPostId];
  let lastPostId = mainPostId;

  for (let i = 0; i < replies.length; i++) {
    console.log(`\nStep ${i + 3}: Publishing reply ${i + 1}/${replies.length}...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const replyId = await createAndPublish(user.id, accessToken, replies[i], lastPostId);
    console.log(`  Reply ${i + 1} published! ID: ${replyId}`);
    postIds.push(replyId);
    lastPostId = replyId;
  }

  // 4. 投稿情報をファイルに記録
  data.posted_at = new Date().toISOString();
  data.threads_post_id = mainPostId;
  data.threads_reply_ids = postIds.slice(1);
  data.total_posts = postIds.length;
  fs.writeFileSync(inputPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\nUpdated: ${inputPath}`);

  console.log(`\nPost URL: https://www.threads.net/@${user.username}/post/${mainPostId}`);
  console.log(`\nThreads thread published successfully! (${postIds.length} posts)`);
}

main().catch(err => {
  console.error('Threads posting failed:', err.message);
  process.exit(1);
});
