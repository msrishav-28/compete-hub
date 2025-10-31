import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:8000/api';

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
  const response = await axios.get(`${API_BASE_URL}/competitions`, { params });
  return response.data.data;
};

export const fetchCompetition = async (id: string): Promise<Competition> => {
  const response = await axios.get(`${API_BASE_URL}/competitions/${id}`);
  return response.data.data;
};

export const fetchUpcomingWeek = async (): Promise<Competition[]> => {
  const response = await axios.get(`${API_BASE_URL}/competitions/upcoming/week`);
  return response.data.data;
};

export const fetchStats = async () => {
  const response = await axios.get(`${API_BASE_URL}/stats/overview`);
  return response.data.data;
};

// User Profile APIs
export const fetchUserProfile = async (userId: string = 'default_user'): Promise<UserProfile> => {
  const response = await axios.get(`${API_BASE_URL}/users/profile`, {
    params: { user_id: userId }
  });
  return response.data.data;
};

export const updateUserProfile = async (
  profileData: Partial<UserProfile>,
  userId: string = 'default_user'
): Promise<UserProfile> => {
  const response = await axios.post(
    `${API_BASE_URL}/users/profile`,
    profileData,
    { params: { user_id: userId } }
  );
  return response.data.data;
};

export const enterCompetition = async (compId: string, userId: string = 'default_user') => {
  const response = await axios.post(
    `${API_BASE_URL}/users/competition/enter`,
    compId,
    { params: { user_id: userId } }
  );
  return response.data;
};

export const recordWin = async (compId: string, placement: number, userId: string = 'default_user') => {
  const response = await axios.post(
    `${API_BASE_URL}/users/competition/win`,
    { comp_id: compId, placement },
    { params: { user_id: userId } }
  );
  return response.data;
};

// Recommendations API
export const fetchRecommendations = async (
  userId: string = 'default_user',
  limit: number = 10
): Promise<Recommendation[]> => {
  const response = await axios.get(`${API_BASE_URL}/recommendations`, {
    params: { user_id: userId, limit }
  });
  return response.data.data;
};

// Analytics API
export const fetchUserAnalytics = async (userId: string = 'default_user'): Promise<AnalyticsData> => {
  const response = await axios.get(`${API_BASE_URL}/analytics/user`, {
    params: { user_id: userId }
  });
  return response.data.data;
};

// Refresh API
export const refreshCompetitions = async () => {
  const response = await axios.post(`${API_BASE_URL}/refresh`);
  return response.data;
};
