'use client';

const PLATFORM_ICONS = {
  twitter: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  ),
  youtube: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  ),
  instagram: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  ),
  threads: (
    <svg className="w-5 h-5" viewBox="0 0 448 512" fill="currentColor"><path d="M331.5 235.7c2.2.9 4.2 1.9 6.3 2.8c29.2 14.1 50.6 35.2 61.8 61.4c15.7 36.5 17.2 95.8-30.3 143.2c-36.2 36.2-80.3 52.5-142.6 53h-.3c-70.2-.5-124.1-24.1-160.4-70.2c-32.2-40.6-48.8-96.6-49.5-166.7v-.4c.7-70 17.3-126.1 49.5-166.7C102.4 46.1 156.2 22.5 226.4 22h.3c70.3.5 124.9 24 162.3 69.9c18.4 22.7 32 50 40.6 81.7l-40.4 10.8c-7.1-25.8-17.8-47.8-32.2-65.4c-29.2-35.8-73-54.2-130.5-54.6c-57 .5-100.1 18.8-128.2 54.4C72.1 146.1 58.5 194.3 58 256c.5 61.7 14.1 109.9 40.3 143.3c28 35.6 71.2 53.9 128.2 54.4c51.4-.4 85.4-12.6 113.7-40.9c32.3-32.2 31.7-71.8 21.4-95.9c-6.1-14.2-17.1-26-31.9-34.9c-3.7 26.9-11.8 48.3-24.7 64.8c-17.1 21.8-41.4 33.6-72.7 35.3c-23.6 1.3-46.3-4.4-63.9-16c-20.8-13.8-33-34.1-34.4-57.3c-2.6-48.2 35.3-73.6 79.2-76.1c16.3-.9 31.6.2 46.1 3.4c-.3-10.6-1.2-20.6-2.8-29.8c-5-26.7-18.1-40.2-39.1-41.3c-14.4-.8-27.8 3.4-37.4 11.6l-22.2-23.6c16.7-16.6 39.5-25.3 64.7-25.3c1.8 0 3.6 0 5.4.2c46.1 2.5 76.4 30 82.8 75.6zM226.7 259.6c-33.6 1.9-47.7 13.7-46.7 30.9c.8 14.6 13.7 24.6 34.5 23.4c26.8-1.5 46.1-16 51.4-48.8c-12.1-3.5-25.2-5.6-39.2-5.5z"/></svg>
  ),
};

const PLATFORM_COLORS = {
  twitter: 'hover:text-black',
  youtube: 'hover:text-red-600',
  instagram: 'hover:text-pink-600',
  threads: 'hover:text-black',
};

function NewsletterSection({ section }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        <h3 className="text-sm font-bold text-gray-800">{section.title}</h3>
      </div>
      {section.description && (
        <p className="text-xs text-gray-600 leading-relaxed mb-4">{section.description}</p>
      )}
      <a
        href={section.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow"
      >
        {section.buttonText || '登録する'}
      </a>
    </div>
  );
}

function LinksSection({ section }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        {section.title}
      </h3>
      <ul className="space-y-2">
        {(section.items || []).map((item, i) => (
          <li key={i}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600 transition-colors truncate">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full font-bold flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">{item.description}</p>
                )}
              </div>
              <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SNSSection({ section }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
        {section.title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {(section.accounts || []).map((account, i) => (
          <a
            key={i}
            href={account.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 text-gray-500 ${PLATFORM_COLORS[account.platform] || 'hover:text-gray-700'} transition-colors hover:bg-gray-100`}
            title={account.label}
          >
            {PLATFORM_ICONS[account.platform] || (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            )}
            <span className="text-xs font-medium">{account.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function HTMLSection({ section }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      {section.title && (
        <h3 className="text-sm font-bold text-gray-800 mb-3">{section.title}</h3>
      )}
      <div
        className="text-xs text-gray-600 leading-relaxed prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: section.content || '' }}
      />
    </div>
  );
}

export default function ArticleSidebar({ sections = [] }) {
  const enabledSections = sections
    .filter(s => s.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (enabledSections.length === 0) return null;

  return (
    <div className="space-y-4">
      {enabledSections.map(section => {
        switch (section.type) {
          case 'newsletter':
            return <NewsletterSection key={section.id} section={section} />;
          case 'links':
            return <LinksSection key={section.id} section={section} />;
          case 'sns':
            return <SNSSection key={section.id} section={section} />;
          case 'html':
            return <HTMLSection key={section.id} section={section} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
