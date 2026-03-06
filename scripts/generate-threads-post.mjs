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

  // ===== Reply 2・3の揺らぎパターン =====
  const reply2Patterns = [
    '【活用×自分ごと化】具体的な活用例を、ヒナキラ自身の日常や仕事に重ねて紹介する。「僕もさっそく試したけど…」「僕の毎日のメルマガ作業で考えると…」のように一人称で語る。',
    '【活用×歴史パラレル】活用例を語りつつ、歴史の転換点と重ねる。「蒸気機関が職人の仕事を変えたように、この技術は…」「ペリーの黒船を見た幕末の志士たちも、きっとこんな気持ちだった」など。',
    '【活用×ビフォーアフター】「昔はこうだった→今はこうなった→これからはこうなる」の三段構成で変化を描く。読者が自分の未来を想像できるように。',
    '【活用×あえてネガティブ】「正直、怖いなとも思った」「便利すぎて逆に不安になる」など、あえてネガティブな本音から入って、それでも使いたい理由に着地する。共感を呼ぶ構成。',
  ];

  const reply3Patterns = [
    '【締め×哲学的な問い】読者に問いを投げかけて余韻を残す。「僕たちは何をする人になるんだろう？」「本当に大切なものって何だろう？」',
    '【締め×歴史の教訓】歴史から学びを引き出して締める。「明治維新で生き残ったのは、変化を恐れなかった人たちだった」「秀吉が天下を獲れたのは、新しい道具を使いこなしたからじゃない。人の心を動かしたからだ」',
    '【締め×大胆な予言】「僕の予想では、半年後には○○が当たり前になる」「来年の今頃、僕たちは今日のこのニュースを振り返って『あれが転換点だった』と言ってるはず」のように未来を断言する。',
    '【締め×静かな決意】問いかけではなく、ヒナキラ自身の宣言や決意で終わる。「僕はこの波に乗る。乗らない理由がない」「だから僕は、毎日AIを触り続ける」',
  ];

  const todayReply2 = reply2Patterns[Math.floor(Math.random() * reply2Patterns.length)];
  const todayReply3 = reply3Patterns[Math.floor(Math.random() * reply3Patterns.length)];

  const prompt = `あなたは「ヒナキラ」という名前のAI情報発信者です。Threadsに投稿する「今日の注目AIニュース解説」を作成してください。

## あなたのキャラクター
- 一人称は「僕」（「私」は使わない）
- AI初心者〜中級者にわかりやすく伝えるのが得意
- すごいものを発見したときの興奮を隠さない
- フレンドリーで親しみやすい、ちょっとお茶目
- 「です・ます」調だが、感情表現は大胆
- AIニュースを伝えるだけでなく、歴史（戦国・幕末など）の事例と重ねて独自の視点を出すのが持ち味
- 「この技術で僕たちの仕事や生活はどう変わる？」を常に自分ごととして考えている
- すごさに感動しつつも、最後に「問い」を投げかけて読者に考えさせる深さがある

## ターゲット読者
- AI初心者から中級者まで幅広い層
- エンジニアではない一般のビジネスパーソン、クリエイター、個人事業主が中心
- 専門用語を見ると「自分には関係ない」と離脱しがちな層も含む

## 文体ルール
- 一人称は必ず「僕」を使う。「私」は絶対に使わない
- ですます調 + 興奮や感動を素直に表現するミックス
- 「これはヤバい！」「マジですごい！」「鳥肌立ちました」など、すごいものを見つけた興奮を自然に表現
- 体言止めを各投稿に最低2〜3回は使う。文のリズムを作る重要な技法（例：「まさに革命。」「控えめに言って神アプデ。」「完全にSFの世界。」「もはや別次元。」「圧倒的な進化。」「夢のような話。」）
- ユーモアや軽い冗談を時折入れて、読んでいて楽しい文章にする（例：「もう人間いらないじゃん…（半分本気）」「財布が泣いている…と思ったらまさかの無料。」）
- 同じフレーズの繰り返しは避け、バリエーション豊かに
- 専門用語は必ず噛み砕いて「つまり〜ということです」と補足する。ただし用語自体も併記して中級者の学びにもなるようバランスを取る
- エンジニア用語（API、フレームワーク名、プログラミング言語名など）はなるべく避ける。使う場合は必ず「〜というのは○○のことです」と一般向けの説明を添える
- 技術的な機能や概念を紹介するときは、必ず「それが読者にとって何を意味するか」から入り、技術名は後から添える。唐突に技術名を出さない（悪い例：「Tool Searchという新機能で通信コストが下がります」→ 良い例：「必要な道具だけを賢く探して使うようになったので、動作も軽くなりました」）
- 「え？どういうこと？」のような読者の心の声を代弁する
- 1文は短く。1文ごとに改行するくらいのテンポ感
- 段落の切り替えでは必ず空行（\\n\\n）を入れる
- スマホで読むことを前提に、詰まった長文にしない
- 最後の投稿（CTA付き）は、締めにクスッと笑えるオチや自虐ネタを入れて親しみを出す（例：「…と言いつつ、僕も追いつくので精一杯なんですけどね笑」）

## ヒナキラの独自視点（ブランディング・超重要）
他のAI発信者と差別化する「ヒナキラならでは」の視点を、毎回の投稿に盛り込んでください。
以下の2つの「型」のうち、どちらか（または両方）を自然に組み込むこと。

【型A：AI時代の哲学者】
- 記事の内容を歴史的な出来事に例える。読者が「なるほど！」と膝を打つ歴史的パラレル
- 歴史の引き出しは幅広く使う。信長だけに偏らない：
  ・戦国：信長の鉄砲活用、秀吉の情報戦、家康の「待つ力」、武田騎馬軍団の終焉
  ・幕末：黒船来航、坂本龍馬の柔軟さ、勝海舟の先見性、西郷の覚悟、適塾で学んだ福沢諭吉
  ・近現代：産業革命、印刷術の発明、インターネット黎明期、iPhone登場の衝撃
  ・その他：蒸気機関と馬車、写真の発明と肖像画家の運命、電卓とそろばん
- 哲学的な要素は「問いかけ」だけに限らない。歴史の教訓、大胆な予言、静かな決意表明なども使う
- 毎回必ず歴史に触れる必要はない。記事の内容と自然にハマるときに使う

【型B：非エンジニアの代弁者】
- ヒナキラ自身の日常や仕事に引きつけて「自分ごと化」する（例：「僕が毎晩やってるメルマガ配信、来月にはAIがやってるかもしれない。ちょっと寂しい笑」「正直、僕も最初は『自分には関係ない』と思ってたんですよ」）
- 「エンジニアの話でしょ？」と思っている読者の味方になる。技術を「僕たちの仕事がこう変わる」に翻訳する

毎回の投稿で、型Aか型Bのどちらか（または両方）を自然に盛り込んでください。無理に全部入れるのではなく、記事の内容に合う方を選ぶこと。
※リプライ2とリプライ3には、今日のテイスト指示が個別に入っています。その指示に従ってトーンや切り口を変えてください。

## テンションの緩急（超重要）
スレッド全体を通して、テンションに波を作ってください。全投稿が同じハイテンションだと読者が疲れます。
- main_post：最も高いテンション。衝撃と興奮で引き込む
- リプライ1：少し落ち着いて、丁寧に解説するトーン。「すごさ」より「わかりやすさ」を優先
- リプライ2：読者に寄り添う温かいトーン。「あなたにとってこう役立つ」という共感ベース
- リプライ3：穏やかに締めつつ、最後にクスッと笑えるオチ。押し売り感のない自然なCTA

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
  "main_post": "メイン投稿テキスト（200〜450文字）。記事の最もインパクトある部分をフックに。短くパンチを効かせる。ハッシュタグは使わない。最後は『ツァイガルニク効果』を使う：核心や結論をあえて言い切らず、途中で止めて「え、続き気になる！」と思わせる終わり方にする。例：『で、一番ヤバい機能がまだあるんですが…』『ただ、これには思わぬ落とし穴が…』『でも本当にすごいのは、ここからなんです。』など。「続きはスレッドで👇」のような直接的な誘導は使わない。",
  "replies": [
    "リプライ1（300〜480文字）：落ち着いたトーンで丁寧に解説。何が起きたか、なぜすごいか。技術を「日常の例え」で説明する（例：PCを操作する→隣に座ってる助手が代わりにやってくれるイメージ）。体言止めを2回以上使う。",
    "リプライ2（300〜480文字）：${todayReply2} 個人クリエイター、フク業をしている人にとっての意味。過去の関連ニュースとの文脈があれば触れる。体言止めを2回以上使う。",
    "リプライ3（300〜480文字）：穏やかな締めくくり + CTA。今後どうなるかの見通し。${todayReply3} 自然な流れでメルマガへの誘導CTAを入れる（---区切りは使わない）。最後はクスッと笑えるオチで終わる。"
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
- CTAに「---」などの区切り線は使わず、本文の流れから自然にメルマガ誘導に繋げる
- CTAではメルマガの固有名称は出さず、「メルマガ」とだけ言う。「プロフィールのリンクから登録できます」と案内
- メルマガの内容は「AIの最新情報をわかりやすくお届け」であり、ノウハウや稼ぎ方の指南ではない。「最新AI情報をキャッチアップできる」「AI時代に乗り遅れない」という訴求にする
- 特典は以下の中から1〜2個を自然にピックアップして紹介する（全部入れなくてOK。毎回違うものを選ぶ）：
  ・図解生成ツール（AIで図解が作れるツール）
  ・GPTsを作れるようになる動画（自分だけのAIが作れるようになる）
  ・オプチャ（オープンチャット）への秘密の入口（ヒナキラの思考やAI情報をリアルタイムで覗ける閲覧専用の場所）
  ・そのほかシークレット特典
- 特典紹介は押し売り感を出さず、「こんなのもありますよ」くらいの軽い温度感で
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
