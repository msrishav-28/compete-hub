import { create } from 'zustand';
import { persist } from 'zustand/middleware';



interface CompetitionStore {
  savedCompetitions: string[];
  viewMode: 'grid' | 'list' | 'calendar';
  filters: {
    category: string[];
    difficulty: string[];
    timeCommitment: string[];
    search: string;
  };
  saveCompetition: (id: string) => void;
  unsaveCompetition: (id: string) => void;
  isSaved: (id: string) => boolean;
  setViewMode: (mode: 'grid' | 'list' | 'calendar') => void;
  setFilters: (filters: Partial<CompetitionStore['filters']>) => void;
  resetFilters: () => void;
  syncSavedCompetitions: (ids: string[]) => void;
}

const defaultFilters = {
  category: [],
  difficulty: [],
  timeCommitment: [],
  search: '',
};

export const useCompetitionStore = create<CompetitionStore>()(
  persist(
    (set, get) => ({
      savedCompetitions: [],
      viewMode: 'grid',
      filters: defaultFilters,
      saveCompetition: (id: string) => {
        set((state) => {
          if (state.savedCompetitions.includes(id)) return state;
          // Optimistic update
          const newSaved = [...state.savedCompetitions, id];
          // Sync with backend (fire and forget)
          import('../api/competitions').then(({ saveCompetitionForUser }) => {
            saveCompetitionForUser(id, true).catch(console.error);
          });
          return { savedCompetitions: newSaved };
        });
      },
      unsaveCompetition: (id: string) => {
        set((state) => {
          // Optimistic update
          const newSaved = state.savedCompetitions.filter((cId) => cId !== id);
          // Sync with backend
          import('../api/competitions').then(({ saveCompetitionForUser }) => {
            saveCompetitionForUser(id, false).catch(console.error);
          });
          return { savedCompetitions: newSaved };
        });
      },
      syncSavedCompetitions: (ids: string[]) => set({ savedCompetitions: ids }),
      isSaved: (id: string) => get().savedCompetitions.includes(id),
      setViewMode: (mode) => set({ viewMode: mode }),
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
      resetFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: 'competition-storage',
    }
  )
);
