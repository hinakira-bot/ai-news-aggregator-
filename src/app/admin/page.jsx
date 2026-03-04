'use client';

import { useState, useEffect, useCallback } from 'react';

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
        <p className="text-xs text-gray-400 text-center py-4">メニュー項目がありません</p>
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
              <input
                type="text"
                value={item.label}
                onChange={(e) => updateItem(i, 'label', e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="メルマガ登録"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 mb-1 block">URL</label>
              <input
                type="text"
                value={item.url}
                onChange={(e) => updateItem(i, 'url', e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={item.highlight}
                onChange={(e) => updateItem(i, 'highlight', e.target.checked)}
                className="rounded border-gray-300"
              />
              ハイライト表示
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={item.external}
                onChange={(e) => updateItem(i, 'external', e.target.checked)}
                className="rounded border-gray-300"
              />
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
  const addLink = () => {
    onChange({ ...section, items: [...items, { label: '', url: '', description: '', badge: '' }] });
  };
  const removeLink = (index) => {
    onChange({ ...section, items: items.filter((_, i) => i !== index) });
  };
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
            <button onClick={() => removeLink(i)} className="text-red-400 hover:text-red-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
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
  const addAccount = () => {
    onChange({ ...section, accounts: [...accounts, { platform: 'twitter', url: '', label: '' }] });
  };
  const removeAccount = (index) => {
    onChange({ ...section, accounts: accounts.filter((_, i) => i !== index) });
  };
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
            <button onClick={() => removeAccount(i)} className="text-red-400 hover:text-red-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
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
  const removeSection = (index) => {
    onChange(sections.filter((_, i) => i !== index));
  };
  const updateSection = (index, updated) => {
    onChange(sections.map((s, i) => i === index ? updated : s));
  };
  const toggleEnabled = (index) => {
    updateSection(index, { ...sections[index], enabled: !sections[index].enabled });
  };
  const moveSection = (index, direction) => {
    const newSections = [...sections];
    const target = index + direction;
    if (target < 0 || target >= newSections.length) return;
    // swap order values too
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
          <button className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + 追加
          </button>
          <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border border-gray-200 py-1 hidden group-hover:block z-10 min-w-[160px]">
            {SECTION_TYPES.map(t => (
              <button key={t.value} onClick={() => addSection(t.value)} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {sortedSections.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">セクションがありません</p>
      )}

      {sortedSections.map((section, i) => {
        const typeLabel = SECTION_TYPES.find(t => t.value === section.type)?.label || section.type;
        const originalIndex = sections.indexOf(section);

        return (
          <div key={section.id || i} className={`rounded-xl border ${section.enabled ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
            {/* セクションヘッダー */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={section.enabled} onChange={() => toggleEnabled(originalIndex)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
                <span className="text-xs font-medium text-gray-600">{typeLabel}</span>
                <span className="text-[10px] text-gray-400">({section.id})</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => moveSection(originalIndex, -1)} disabled={i === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                </button>
                <button onClick={() => moveSection(originalIndex, 1)} disabled={i === sortedSections.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <button onClick={() => removeSection(originalIndex)} className="p-1 text-red-400 hover:text-red-600 ml-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
            {/* セクション編集エリア */}
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

// ===== メインページ =====
export default function AdminPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('header');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/ai-news/data/site-config.json')
      .then(r => r.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => {
        // デフォルト設定
        setConfig({
          version: 1,
          header: { menuItems: [] },
          sidebar: { sections: [] },
          updatedAt: null,
        });
        setLoading(false);
      });
  }, []);

  const handleDownload = useCallback(() => {
    if (!config) return;
    const exportData = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'site-config.json';
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [config]);

  if (loading) {
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
            <p className="text-xs text-gray-400 mt-1">ヘッダーメニューとサイドバーの設定を編集します</p>
          </div>
          <button
            onClick={handleDownload}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              saved
                ? 'bg-green-100 text-green-700'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow'
            }`}
          >
            {saved ? '保存しました' : 'JSONダウンロード'}
          </button>
        </div>
      </div>

      {/* 保存方法の説明 */}
      <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-200">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>保存手順:</strong> 「JSONダウンロード」→ ダウンロードしたファイルを <code className="bg-amber-100 px-1 rounded">public/data/site-config.json</code> に置き換え → git commit & push → 自動リビルド・デプロイ
        </p>
      </div>

      {/* タブ切替 */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('header')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'header' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ヘッダーメニュー
        </button>
        <button
          onClick={() => setActiveTab('sidebar')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'sidebar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          サイドバー
        </button>
      </div>

      {/* 編集エリア */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        {activeTab === 'header' && (
          <HeaderEditor
            menuItems={config.header?.menuItems || []}
            onChange={(items) => setConfig({ ...config, header: { ...config.header, menuItems: items } })}
          />
        )}
        {activeTab === 'sidebar' && (
          <SidebarEditor
            sections={config.sidebar?.sections || []}
            onChange={(sections) => setConfig({ ...config, sidebar: { ...config.sidebar, sections } })}
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
