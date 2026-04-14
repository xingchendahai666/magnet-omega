import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TorrentResult, SearchFilters } from '@/lib/types';

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  resultCount: number;
}

interface AppState {
  // 搜索状态
  searchHistory: SearchHistoryItem[];
  favorites: string[]; // 存储 result.id
  filters: SearchFilters;
  
  // 操作方法
  addToHistory: (query: string, count: number) => void;
  clearHistory: () => void;
  removeHistoryItem: (id: string) => void;
  
  toggleFavorite: (resultId: string) => void;
  isFavorite: (resultId: string) => boolean;
  
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  
  exportData: () => string;
  importData: (data: string) => void;
}

const defaultFilters: SearchFilters = {
  sortBy: 'seeds',
  sortOrder: 'desc',
  category: 'all',
  verifiedOnly: false,
  timeRange: 'all',
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      searchHistory: [],
      favorites: [],
      filters: defaultFilters,
      
      addToHistory: (query, count) => set(state => {
        const newHistory = [
          { id: Date.now().toString(), query, timestamp: Date.now(), resultCount: count },
          ...state.searchHistory.filter(h => h.query !== query)
        ].slice(0, 20);
        return { searchHistory: newHistory };
      }),
      
      clearHistory: () => set({ searchHistory: [] }),
      
      removeHistoryItem: (id) => set(state => ({
        searchHistory: state.searchHistory.filter(h => h.id !== id)
      })),
      
      toggleFavorite: (resultId) => set(state => {
        const exists = state.favorites.includes(resultId);
        return {
          favorites: exists 
            ? state.favorites.filter(id => id !== resultId)
            : [...state.favorites, resultId]
        };
      }),
      
      isFavorite: (resultId) => get().favorites.includes(resultId),
      
      setFilters: (filters) => set(state => ({
        filters: { ...state.filters, ...filters }
      })),
      
      resetFilters: () => set({ filters: defaultFilters }),
      
      exportData: () => {
        const { searchHistory, favorites, filters } = get();
        return JSON.stringify({ searchHistory, favorites, filters, exportDate: new Date().toISOString() }, null, 2);
      },
      
      importData: (data: string) => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.searchHistory) set({ searchHistory: parsed.searchHistory });
          if (parsed.favorites) set({ favorites: parsed.favorites });
          if (parsed.filters) set({ filters: { ...defaultFilters, ...parsed.filters } });
          return true;
        } catch (e) {
          console.error('Import failed:', e);
          return false;
        }
      },
    }),
    {
      name: 'magnet-omega-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        favorites: state.favorites,
        filters: state.filters,
      }),
    }
  )
);
