import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:8000/api';

// API Error response type
interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const message = error.response?.data?.detail || error.response?.data?.message || error.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

// Transform snake_case to camelCase for Competition objects
const transformCompetition = (data: any): Competition => ({
  id: data.id,
  title: data.title,
  description: data.description,
  category: data.category,
  platform: data.platform,
  startDate: data.start_date,
  endDate: data.end_date,
  difficulty: data.difficulty,
  timeCommitment: data.time_commitment,
  prize: data.prize,
  tags: data.tags || [],
  teamSize: data.team_size,
  link: data.link,
  recruitmentPotential: data.recruitment_potential,
  portfolioValue: data.portfolio_value,
  company: data.company,
  location: data.location,
  skillsRequired: data.skills_required || [],
});

export interface Competition {
  id: string;
  title: string;
  description: string;
  category: string;
  platform: string;
  startDate: string;
  endDate?: string;
  difficulty: string;
  timeCommitment: 'low' | 'medium' | 'high';
  prize?: {
    value: string;
    currency: string;
  };
  tags: string[];
  teamSize?: string;
  link: string;
  recruitmentPotential?: boolean;
  portfolioValue?: number;
  company?: string;
  location?: string;
  skillsRequired?: string[];
}

export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  college: string;
  year?: number;
  specializations: string[];
  skill_levels: {
    competitive_programming: number;
    ml_ds: number;
    web_dev: number;
    security: number;
    hardware_robotics: number;
    design: number;
    open_source: number;
  };
  linked_profiles: {
    codeforces?: string;
    leetcode?: string;
    hackerrank?: string;
    kaggle?: string;
    github?: string;
    linkedin?: string;
  };
  difficulty_preference: string;
  time_available_weekly: number;
  preferred_categories: string[];
  goals: string[];
  saved_competitions: string[];
  competitions_entered: any[];
  competitions_won: any[];
}

export interface Recommendation {
  competition: Competition;
  match_score: number;
}

export interface AnalyticsData {
  competitions_entered: number;
  competitions_won: number;
  win_rate: number;
  skill_levels: {
    [key: string]: number;
  };
  specializations: string[];
  portfolio_value: number;
}

// Competition APIs
export const fetchCompetitions = async (params?: {
  category?: string;
  difficulty?: string;
  timeCommitment?: string;
  search?: string;
  platform?: string;
  recruitmentOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Competition[]> => {
  const response = await api.get('/competitions', { params });
  const rawData = response.data.data || [];
  return rawData.map(transformCompetition);
};

export const fetchCompetition = async (id: string): Promise<Competition> => {
  const response = await api.get(`/competitions/${id}`);
  return transformCompetition(response.data.data);
};

export const fetchUpcomingWeek = async (): Promise<Competition[]> => {
  const response = await api.get('/competitions/upcoming/week');
  const rawData = response.data.data || [];
  return rawData.map(transformCompetition);
};

export const fetchStats = async () => {
  const response = await api.get('/stats/overview');
  return response.data.data;
};

// User Profile APIs
export const fetchUserProfile = async (userId: string = 'default_user'): Promise<UserProfile> => {
  const response = await api.get('/users/profile', {
    params: { user_id: userId }
  });
  return response.data.data;
};

export const updateUserProfile = async (
  profileData: Partial<UserProfile>,
  userId: string = 'default_user'
): Promise<UserProfile> => {
  const response = await api.post(
    '/users/profile',
    profileData,
    { params: { user_id: userId } }
  );
  return response.data.data;
};

export const enterCompetition = async (compId: string, userId: string = 'default_user') => {
  const response = await api.post(
    '/users/competition/enter',
    JSON.stringify(compId),
    { 
      params: { user_id: userId },
      headers: { 'Content-Type': 'application/json' }
    }
  );
  return response.data;
};

export const recordWin = async (compId: string, placement: number, userId: string = 'default_user') => {
  const response = await api.post(
    '/users/competition/win',
    { comp_id: compId, placement },
    { params: { user_id: userId } }
  );
  return response.data;
};

export const saveCompetitionForUser = async (compId: string, save: boolean, userId: string = 'default_user') => {
  const response = await api.post(
    '/users/competition/save',
    { comp_id: compId, save },
    { params: { user_id: userId } }
  );
  return response.data;
};

// Recommendations API
export const fetchRecommendations = async (
  userId: string = 'default_user',
  limit: number = 10
): Promise<Recommendation[]> => {
  const response = await api.get('/recommendations', {
    params: { user_id: userId, limit }
  });
  const rawData = response.data.data || [];
  return rawData.map((item: any) => ({
    competition: transformCompetition(item.competition),
    match_score: item.match_score,
  }));
};

// Analytics API
export const fetchUserAnalytics = async (userId: string = 'default_user'): Promise<AnalyticsData> => {
  const response = await api.get('/analytics/user', {
    params: { user_id: userId }
  });
  return response.data.data;
};

// Refresh API
export const refreshCompetitions = async () => {
  const response = await api.post('/refresh');
  return response.data;
};
