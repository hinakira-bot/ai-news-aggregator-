import fs from 'fs';
import path from 'path';

const DEFAULT_CONFIG = {
  version: 1,
  header: { menuItems: [] },
  sidebar: { sections: [] },
  updatedAt: null,
};

export function getSiteConfig() {
  try {
    const configPath = path.join(process.cwd(), 'public', 'data', 'site-config.json');
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn('site-config.json not found, using defaults:', e.message);
    return DEFAULT_CONFIG;
  }
}
