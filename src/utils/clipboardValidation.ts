// Enhanced clipboard history validation utility
export function validateHistoryItem(item: any): boolean {
  return !!(item && item.id && item.content && item.timestamp);
}

export function sanitizeHistoryItem(item: any): any {
  return {
    id: item.id || '',
    content: String(item.content || ''),
    timestamp: Number(item.timestamp) || Date.now(),
    type: item.type || 'text'
  };
}
