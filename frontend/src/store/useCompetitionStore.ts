import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Competition {
  id: string;
  title: string;
  platform: string;
  category: string;
  startDate: string;
  endDate?: string;
  difficulty: string;
  timeCommitment: string;
  prize?: {
    value: string;
    currency: string;
  };
  tags: string[];
}

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
      saveCompetition: (id: string) =>
        set((state) => ({
          savedCompetitions: [...state.savedCompetitions, id],
        })),
      unsaveCompetition: (id: string) =>
        set((state) => ({
          savedCompetitions: state.savedCompetitions.filter((cId) => cId !== id),
        })),
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
