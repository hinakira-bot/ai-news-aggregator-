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
    <svg className="w-5 h-5" viewBox="0 0 192 192" fill="currentColor"><path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.673-1.14-23.82 1.371-39.134 15.265-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.681 22.231-5.574 29.049-14.54 5.182-6.813 8.458-15.473 9.876-26.126 5.921 3.576 10.313 8.302 12.742 14.06 4.15 9.834 4.39 25.988-7.335 37.725-10.26 10.28-22.588 14.725-41.16 14.862-20.597-.15-36.187-6.747-46.32-19.604C46.072 137.468 40.49 117.845 40.323 96c.166-21.845 5.749-41.468 16.598-58.297C67.054 25.046 82.644 18.448 103.24 18.299c20.742.15 36.508 6.775 46.876 19.69 5.042 6.28 8.742 13.85 11.087 22.595l14.88-3.985c-2.875-10.737-7.549-20.08-13.994-27.923C149.34 13.155 129.362 4.15 103.287 4 77.07 4.16 56.906 13.205 43.803 29.833 29.696 47.835 22.465 72.628 22.277 96l.002.11c.188 23.372 7.42 48.165 21.526 66.167 13.103 16.628 33.267 25.673 59.487 25.833h.11c22.472-.159 38.847-6.14 51.558-18.836 17.086-17.08 16.125-38.637 10.377-52.256-4.124-9.758-12.003-17.56-22.777-22.634l-.023-.01ZM109.2 141.405c-10.452.574-21.307-4.129-22.218-16.19-.667-8.81 5.956-18.721 24.708-19.8 2.159-.124 4.274-.184 6.35-.184 6.28 0 12.168.7 17.524 2.066-1.994 28.472-14.877 33.505-26.364 34.108Z"/></svg>
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
