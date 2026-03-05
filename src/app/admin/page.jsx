'use client';

import { useState, useEffect, useCallback } from 'react';

// === GitHub API設定 ===
const GITHUB_REPO = 'hinakira-bot/ai-news-aggregator-';
const CONFIG_PATH = 'public/data/site-config.json';

const DEFAULT_MENU_ITEM = { id: '', label: '', url: '', highlight: false, external: true };

const SECTION_TYPES = [
  { value: 'newsletter', label: 'メルマガCTA' },
  { value: 'links', label: 'リンク集' },
  { value: 'sns', label: 'SNSリンク' },
  { value: 'html', label: 'カスタムHTML' },
];

const DEFAULT_SECTIONS = {
  newsletter: { id: '', type: 'newsletter', enabled: true, order: 1, title: 'メルマガ登録', description: '', url: '', buttonText: '無料で登録する' },
  links: { id: '', type: 'links', enabled: true, order: 2, title: 'おすすめコンテンツ', items: [] },
  sns: { id: '', type: 'sns', enabled: true, order: 3, title: 'SNSをフォロー', accounts: [] },
  html: { id: '', type: 'html', enabled: true, order: 4, title: 'お知らせ', content: '' },
};

function generateId() {
  return Math.random().toString(36).substring(2, 8);
}

// ===== GitHub API ヘルパー =====
async function githubGet(token) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${CONFIG_PATH}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
  });
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
  const data = await res.json();
  const content = JSON.parse(atob(data.content));
  return { content, sha: data.sha };
}

async function githubPut(token, config, sha) {
  const body = JSON.stringify(config, null, 2);
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${CONFIG_PATH}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'update: サイト設定を管理画面から更新',
      content: btoa(unescape(encodeURIComponent(body))),
      sha,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub PUT failed: ${res.status}`);
  }
  return await res.json();
}

// ===== ヘッダーメニュー編集 =====
function HeaderEditor({ menuItems, onChange }) {
  const addItem = () => {
    onChange([...menuItems, { ...DEFAULT_MENU_ITEM, id: generateId() }]);
  };
  const removeItem = (index) => {
    onChange(menuItems.filter((_, i) => i !== index));
  };
  const updateItem = (index, field, value) => {
    const updated = menuItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };
  const moveItem = (index, direction) => {
    const newItems = [...menuItems];
    const target = index + direction;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700">メニュー項目</h3>
        <button onClick={addItem} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          + 追加
        </button>
      </div>
      {menuItems.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">メニュー項目がありません。「+追加」で追加してください。</p>
      )}
      {menuItems.map((item, i) => (
        <div key={item.id || i} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">#{i + 1}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => moveItem(i, -1)} disabled={i === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
              </button>
              <button onClick={() => moveItem(i, 1)} disabled={i === menuItems.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <button onClick={() => removeItem(i)} className="p-1 text-red-400 hover:text-red-600 ml-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-500 mb-1 block">ラベル</label>
              <input type="text" value={item.label} onChange={(e) => updateItem(i, 'label', e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="メルマガ登録" />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 mb-1 block">URL</label>
              <input type="text" value={item.url} onChange={(e) => updateItem(i, 'url', e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="https://..." />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={item.highlight} onChange={(e) => updateItem(i, 'highlight', e.target.checked)} className="rounded border-gray-300" />
              ハイライト表示
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={item.external} onChange={(e) => updateItem(i, 'external', e.target.checked)} className="rounded border-gray-300" />
              外部リンク
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== サイドバー セクション編集 =====
function NewsletterEditor({ section, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] text-gray-500 mb-1 block">タイトル</label>
        <input type="text" value={section.title || ''} onChange={(e) => onChange({ ...section, title: e.target.value })} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div>
        <label className="text-[11px] text-gray-500 mb-1 block">説明文</label>
        <textarea value={section.description || ''} onChange={(e) => onChange({ ...section, description: e.target.value })} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={3} />
      </div>
      <div>
        <label className="text-[11px] text-gray-500 mb-1 block">リンクURL</label>
        <input type="text" value={section.url || ''} onChange={(e) => onChange({ ...section, url: e.target.value })} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
      </div>
      <div>
        <label className="text-[11px] text-gray-500 mb-1 block">ボタンテキスト</label>
        <input type="text" value={section.buttonText || ''} onChange={(e) => onChange({ ...section, buttonText: e.target.value })} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
    </div>
  );
}

function LinksEditor({ section, onChange }) {
  const items = section.items || [];
  const addLink = () => onChange({ ...section, items: [...items, { label: '', url: '', description: '', badge: '' }] });
  const removeLink = (index) => onChange({ ...section, items: items.filter((_, i) => i !== index) });
  const updateLink = (index, field, value) => {
    const updated = items.map((item, i) => i === index ? { ...item, [field]: value } : item);
    onChange({ ...section, items: updated });
  };
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] text-gray-500 mb-1 block">タイトル</label>
        <input type="text" value={section.title || ''} onChange={(e) => onChange({ ...section, title: e.target.value })} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-500">リンク一覧</span>
        <button onClick={addLink} className="text-[11px] px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">+ 追加</button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-lg p-3 space-y-2 border border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400">リンク {i + 1}</span>
            <button onClick={() => removeLink(i)} className="text-red-400 hover:text-red-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <input type="text" value={item.label} onChange={(e) => updateLink(i, 'label', e.target.value)} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ラベル" />
          <input type="text" value={item.url} onChange={(e) => updateLink(i, 'url', e.target.value)} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="URL" />
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={item.description || ''} onChange={(e) => updateLink(i, 'description', e.target.value)} className="text-xs px-2 py-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="説明（任意）" />
            <input type="text" value={item.badge || ''} onChange={(e) => updateLink(i, 'badge', e.target.value)} className="text-xs px-2 py-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="バッジ（任意）" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SNSEditor({ section, onChange }) {
  const accounts = section.accounts || [];
  const addAccount = () => onChange({ ...section, accounts: [...accounts, { platform: 'twitter', url: '', label: '' }] });
  const removeAccount = (index) => onChange({ ...section, accounts: accounts.filter((_, i) => i !== index) });
  const updateAccount = (index, field, value) => {
    const updated = accounts.map((item, i) => i === index ? { ...item, [field]: value } : item);
    onChange({ ...section, accounts: updated });
  };
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] text-gray-500 mb-1 block">タイトル</label>
        <input type="text" value={section.title || ''} onChange={(e) => onChange({ ...section, title: e.target.value })} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-500">SNSアカウント</span>
        <button onClick={addAccount} className="text-[11px] px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">+ 追加</button>
      </div>
      {accounts.map((acc, i) => (
        <div key={i} className="bg-white rounded-lg p-3 space-y-2 border border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400">SNS {i + 1}</span>
            <button onClick={() => removeAccount(i)} className="text-red-400 hover:text-red-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <select value={acc.platform} onChange={(e) => updateAccount(i, 'platform', e.target.value)} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option value="twitter">X (Twitter)</option>
            <option value="youtube">YouTube</option>
            <option value="instagram">Instagram</option>
            <option value="threads">Threads</option>
          </select>
          <input type="text" value={acc.url} onChange={(e) => updateAccount(i, 'url', e.target.value)} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="URL" />
          <input type="text" value={acc.label} onChange={(e) => updateAccount(i, 'label', e.target.value)} className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ラベル（例: @hinakira_）" />
        </div>
      ))}
    </div>
  );
}

function HTMLEditor({ section, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] text-gray-500 mb-1 block">タイトル</label>
        <input type="text" value={section.title || ''} onChange={(e) => onChange({ ...section, title: e.target.value })} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div>
        <label className="text-[11px] text-gray-500 mb-1 block">HTMLコンテンツ</label>
        <textarea value={section.content || ''} onChange={(e) => onChange({ ...section, content: e.target.value })} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono" rows={6} placeholder="<p>カスタムHTMLをここに入力</p>" />
      </div>
    </div>
  );
}

function SidebarEditor({ sections, onChange }) {
  const addSection = (type) => {
    const template = { ...DEFAULT_SECTIONS[type], id: generateId(), order: sections.length + 1 };
    onChange([...sections, template]);
  };
  const removeSection = (index) => onChange(sections.filter((_, i) => i !== index));
  const updateSection = (index, updated) => onChange(sections.map((s, i) => i === index ? updated : s));
  const toggleEnabled = (index) => updateSection(index, { ...sections[index], enabled: !sections[index].enabled });
  const moveSection = (index, direction) => {
    const newSections = [...sections];
    const target = index + direction;
    if (target < 0 || target >= newSections.length) return;
    const tempOrder = newSections[index].order;
    newSections[index] = { ...newSections[index], order: newSections[target].order };
    newSections[target] = { ...newSections[target], order: tempOrder };
    [newSections[index], newSections[target]] = [newSections[target], newSections[index]];
    onChange(newSections);
  };

  const sortedSections = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700">サイドバー セクション</h3>
        <div className="relative group">
          <button className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">+ 追加</button>
          <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border border-gray-200 py-1 hidden group-hover:block z-10 min-w-[160px]">
            {SECTION_TYPES.map(t => (
              <button key={t.value} onClick={() => addSection(t.value)} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">{t.label}</button>
            ))}
          </div>
        </div>
      </div>
      {sortedSections.length === 0 && <p className="text-xs text-gray-400 text-center py-4">セクションがありません</p>}
      {sortedSections.map((section, i) => {
        const typeLabel = SECTION_TYPES.find(t => t.value === section.type)?.label || section.type;
        const originalIndex = sections.indexOf(section);
        return (
          <div key={section.id || i} className={`rounded-xl border ${section.enabled ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={section.enabled} onChange={() => toggleEnabled(originalIndex)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
                <span className="text-xs font-medium text-gray-600">{typeLabel}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => moveSection(originalIndex, -1)} disabled={i === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg></button>
                <button onClick={() => moveSection(originalIndex, 1)} disabled={i === sortedSections.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></button>
                <button onClick={() => removeSection(originalIndex)} className="p-1 text-red-400 hover:text-red-600 ml-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            </div>
            {section.enabled && (
              <div className="p-4">
                {section.type === 'newsletter' && <NewsletterEditor section={section} onChange={(s) => updateSection(originalIndex, s)} />}
                {section.type === 'links' && <LinksEditor section={section} onChange={(s) => updateSection(originalIndex, s)} />}
                {section.type === 'sns' && <SNSEditor section={section} onChange={(s) => updateSection(originalIndex, s)} />}
                {section.type === 'html' && <HTMLEditor section={section} onChange={(s) => updateSection(originalIndex, s)} />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ===== トークン設定画面 =====
// トークンからASCII以外の不正文字を除去
function sanitizeToken(raw) {
  return raw.replace(/[^\x20-\x7E]/g, '').trim();
}

function TokenSetup({ onSave, errorMessage }) {
  const [token, setToken] = useState('');
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState(errorMessage || '');

  const handleSubmit = async () => {
    const clean = sanitizeToken(token);
    if (!clean) return;
    setTesting(true);
    setTestError('');
    try {
      // トークンの有効性を事前チェック
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${CONFIG_PATH}`, {
        headers: { Authorization: `Bearer ${clean}`, Accept: 'application/vnd.github.v3+json' },
      });
      if (res.status === 401) {
        setTestError('トークンが無効です。正しいトークンを入力してください。');
        setTesting(false);
        return;
      }
      if (res.status === 403) {
        setTestError('権限が不足しています。Contents: Read and write 権限を確認してください。');
        setTesting(false);
        return;
      }
      if (res.status === 404) {
        setTestError('リポジトリまたはファイルが見つかりません。リポジトリの選択を確認してください。');
        setTesting(false);
        return;
      }
      if (!res.ok) {
        setTestError(`GitHub APIエラー: ${res.status}`);
        setTesting(false);
        return;
      }
      // 成功 → 保存
      onSave(clean);
    } catch (e) {
      setTestError(`接続エラー: ${e.message}`);
      setTesting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-12">
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
        <h1 className="text-lg font-bold text-gray-900 mb-2">管理画面セットアップ</h1>
        <p className="text-sm text-gray-500 mb-6">GitHubのPersonal Access Tokenを設定すると、この画面から直接設定を保存できます。</p>

        <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
          <p className="text-xs text-blue-800 leading-relaxed">
            <strong>トークンの取得方法:</strong><br />
            GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token<br />
            権限: <code className="bg-blue-100 px-1 rounded">Contents: Read and write</code>（リポジトリ: ai-news-aggregator-）
          </p>
        </div>

        {testError && (
          <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200">
            <p className="text-xs text-red-700">{testError}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">GitHub Personal Access Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="github_pat_..."
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!token.trim() || testing}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? '確認中...' : '設定して管理画面に進む'}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-4 text-center">トークンはこのブラウザのlocalStorageにのみ保存されます</p>
      </div>
    </div>
  );
}

// ===== メインページ =====
export default function AdminPage() {
  const [token, setToken] = useState(null);
  const [config, setConfig] = useState(null);
  const [sha, setSha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('header');
  const [hasChanges, setHasChanges] = useState(false);

  // トークン読み込み
  useEffect(() => {
    const saved = localStorage.getItem('hinakira_admin_token');
    if (saved) {
      setToken(saved);
    } else {
      setLoading(false);
    }
  }, []);

  // 設定読み込み（GitHub APIから）
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setErrorMsg('');
    githubGet(token)
      .then(({ content, sha }) => {
        setConfig(content);
        setSha(sha);
        setLoading(false);
      })
      .catch((e) => {
        console.error('Failed to load config:', e);
        const is401 = e.message?.includes('401');
        if (is401) {
          // トークン無効 → セットアップに戻す
          localStorage.removeItem('hinakira_admin_token');
          setToken(null);
          setLoading(false);
          setErrorMsg('トークンが無効または期限切れです。再度設定してください。');
        } else {
          // その他のエラー → フォールバック設定で続行
          setConfig({
            version: 1,
            header: { menuItems: [] },
            sidebar: { sections: [] },
            updatedAt: null,
          });
          setLoading(false);
          setErrorMsg('GitHubから設定を読み込めませんでした: ' + e.message);
        }
      });
  }, [token]);

  const handleTokenSave = (newToken) => {
    const clean = sanitizeToken(newToken);
    localStorage.setItem('hinakira_admin_token', clean);
    setToken(clean);
  };

  const handleSave = useCallback(async () => {
    if (!config || !token || !sha) return;
    setSaving(true);
    setSaveStatus(null);
    setErrorMsg('');

    try {
      const exportData = { ...config, updatedAt: new Date().toISOString() };
      const result = await githubPut(token, exportData, sha);
      setSha(result.content.sha);
      setSaveStatus('success');
      setHasChanges(false);
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (e) {
      console.error('Save failed:', e);
      setSaveStatus('error');
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  }, [config, token, sha]);

  const updateConfig = useCallback((newConfig) => {
    setConfig(newConfig);
    setHasChanges(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('hinakira_admin_token');
    setToken(null);
    setConfig(null);
    setSha(null);
  };

  // トークン未設定
  if (!token && !loading) {
    return <TokenSetup onSave={handleTokenSave} errorMessage={errorMsg} />;
  }

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              サイト設定
            </h1>
            <p className="text-xs text-gray-400 mt-1">ヘッダーメニューとサイドバーの設定を編集・保存</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">ログアウト</button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                saveStatus === 'success'
                  ? 'bg-green-500 text-white'
                  : saveStatus === 'error'
                  ? 'bg-red-500 text-white'
                  : hasChanges
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow animate-pulse'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  保存中...
                </span>
              ) : saveStatus === 'success' ? (
                '保存完了!'
              ) : saveStatus === 'error' ? (
                '保存失敗'
              ) : (
                '保存してデプロイ'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* エラーメッセージ */}
      {errorMsg && (
        <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200">
          <p className="text-xs text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* 保存成功メッセージ */}
      {saveStatus === 'success' && (
        <div className="bg-green-50 rounded-xl p-4 mb-6 border border-green-200">
          <p className="text-xs text-green-700">
            GitHubに保存しました。自動でリビルド・デプロイが開始されます（約5分で反映）
          </p>
        </div>
      )}

      {/* タブ切替 */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        <button onClick={() => setActiveTab('header')} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${activeTab === 'header' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          ヘッダーメニュー
        </button>
        <button onClick={() => setActiveTab('sidebar')} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${activeTab === 'sidebar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          サイドバー
        </button>
      </div>

      {/* 編集エリア */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        {activeTab === 'header' && (
          <HeaderEditor
            menuItems={config.header?.menuItems || []}
            onChange={(items) => updateConfig({ ...config, header: { ...config.header, menuItems: items } })}
          />
        )}
        {activeTab === 'sidebar' && (
          <SidebarEditor
            sections={config.sidebar?.sections || []}
            onChange={(sections) => updateConfig({ ...config, sidebar: { ...config.sidebar, sections } })}
          />
        )}
      </div>

      {/* フッター */}
      <div className="mt-6 text-center">
        <a href="/ai-news/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← サイトに戻る
        </a>
      </div>
    </div>
  );
}
