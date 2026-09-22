export interface HistoryItem {
  id: string;
  query: string;
  componentName: string;
  componentType: string;
  icId: string;
  sourceStage: string;
  timestamp: string;
}

const STORAGE_KEY = 'vlsi_history_store';

export function getHistoryItems(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse history:', e);
    return [];
  }
}

export function saveHistoryItem(item: Omit<HistoryItem, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): HistoryItem {
  const existing = getHistoryItems();
  const newItem: HistoryItem = {
    id: item.id || `hist_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    query: item.query,
    componentName: item.componentName,
    componentType: item.componentType,
    icId: item.icId,
    sourceStage: item.sourceStage || 'Main Screen',
    timestamp: item.timestamp || new Date().toISOString()
  };

  // Keep max 100 history items, deduplicate consecutive identical queries
  const filtered = existing.filter(h => h.query !== item.query);
  const updated = [newItem, ...filtered].slice(0, 100);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save history item:', e);
  }

  return newItem;
}

export function clearHistoryStore(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear history:', e);
  }
}

export function deleteHistoryItem(id: string): HistoryItem[] {
  const existing = getHistoryItems();
  const updated = existing.filter(item => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete history item:', e);
  }
  return updated;
}
