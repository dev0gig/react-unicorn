import { useCallback } from 'react';
import { ToolLink } from '../../types';
import { useLocalStorage } from './useLocalStorage';

interface RecentEntry {
  name: string;
  url: string;
  timestamp: number;
}

const MAX_RECENT = 6;
const STORAGE_KEY = 'recentlyUsedLinks';

export const useRecentlyUsed = () => {
  const [entries, setEntries] = useLocalStorage<RecentEntry[]>(STORAGE_KEY, []);

  const recordUsage = useCallback((link: ToolLink) => {
    setEntries(prev => {
      const filtered = prev.filter(e => e.url !== link.url);
      const updated = [{ name: link.name, url: link.url, timestamp: Date.now() }, ...filtered];
      return updated.slice(0, MAX_RECENT);
    });
  }, [setEntries]);

  return { recentLinks: entries, recordUsage };
};
