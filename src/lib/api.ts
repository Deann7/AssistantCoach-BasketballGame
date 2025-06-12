import axios from 'axios';

// Base URL for your backend API - uses environment variable or fallback to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const FULL_API_URL = `${API_BASE_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: FULL_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authentication API calls
export const authAPI = {
  // Register new user
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    age: number;
    isAssistant: boolean;
  }) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Registration failed' };
    }
  },

  // Login user
  login: async (credentials: {
    username: string;
    password: string;
  }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Login failed' };
    }
  },

  // Test API connection
  test: async () => {
    try {
      const response = await api.get('/auth/test');
      return response.data;    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'API test failed' };
    }
  },

  // Delete all users
  deleteAllUsers: async () => {
    try {
      const response = await api.delete('/auth/delete-all-users');
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Failed to delete all users' };
    }
  },

  // Get coach emotions
  getCoachEmotions: async (userId: string) => {
    try {
      const response = await api.get(`/auth/coach-emotions/${userId}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Failed to get coach emotions' };
    }
  },

  // Update coach emotions after game
  updateEmotions: async (userId: string, result: 'win' | 'loss') => {
    try {
      const response = await api.post(`/auth/update-emotions/${userId}`, { result });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Failed to update emotions' };
    }
  }
};

// User data type
export interface User {
  id: string;
  username: string;
  email: string;
  age: number;
  isAssistant: boolean;
}

// Team data type
export interface Team {
  teamId: number;
  teamName: string;
  wins: number;
  lose: number;
  user?: User;
}

// Player data type
export interface Player {
  playerName: string;
  playerAge: number;
  playerHeight: number;
  playerPosition: string;
  playerRating: number;
  playerTendencies: 'POST' | 'MIDRANGE' | 'THREE_POINT';
  team?: Team;
  stats?: {
    statsId: number;
    pointStats: number;
    assistStats: number;
    reboundStats: number;
    stealStats: number;
    blockStats: number;
  };
}

// API Response type
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  user?: T;
  teams?: T[];
  team?: T;
  standings?: T[];
}

// Teams API calls
export const teamsAPI = {
  // Get all bot teams (opponent teams)
  getBotTeams: async () => {
    try {
      const response = await api.get('/teams/bot-teams');
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Failed to get bot teams' };
    }
  },

  // Get user's team
  getUserTeam: async (userId: string) => {
    try {
      const response = await api.get(`/teams/user-team/${userId}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Failed to get user team' };
    }
  },

  // DEPRECATED: Get all teams standings (use getUserStandings instead)
  getStandings: async () => {
    try {
      const response = await api.get('/teams/standings');
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Failed to get standings' };
    }
  },
  // NEW: Get user-specific standings (isolated per user)
  getUserStandings: async (userId: string) => {
    try {
      const response = await api.get(`/teams/standings/${userId}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching user standings:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      return { 
        success: false, 
        message: axiosError.response?.data?.message || 'Failed to get user standings',
        standings: []
      };
    }
  },

  // NEW: Setup 6 teams for new user
  setupUserLeague: async (userId: string) => {
    try {
      const response = await api.post(`/teams/setup-user-league/${userId}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Error setting up user league:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      return { 
        success: false, 
        message: axiosError.response?.data?.message || 'Failed to setup user league' 
      };
    }
  },
  // NEW: Simulate all games in user's league (called when user finishes their game)
  simulateUserLeague: async (userId: string) => {
    try {
      const response = await api.post(`/teams/simulate-league/${userId}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Error simulating user league:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      return { 
        success: false, 
        message: axiosError.response?.data?.message || 'Failed to simulate league' 
      };
    }
  },

  // Update team record after game
  updateTeamRecord: async (teamId: number, result: 'win' | 'loss') => {
    try {
      const response = await api.put(`/teams/${teamId}/record`, { result });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Failed to update team record' };
    }
  },

  // Clean up user data (remove old leagues, teams, schedules)
  cleanupUserData: async (userId: string) => {
    try {
      const response = await api.delete(`/teams/cleanup-user/${userId}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Error cleaning up user data:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      return { 
        success: false, 
        message: axiosError.response?.data?.message || 'Failed to cleanup user data' 
      };
    }
  },

  // Clean up all test users (for development)
  cleanupTestUsers: async () => {
    try {
      const response = await api.delete('/teams/cleanup-test-users');
      return response.data;
    } catch (error: unknown) {
      console.error('Error cleaning up test users:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      return { 
        success: false, 
        message: axiosError.response?.data?.message || 'Failed to cleanup test users' 
      };
    }
  }
};

// Schedule API calls
export const scheduleAPI = {
  // Generate 5-week schedule for user's league
  generateSchedule: async (userId: string) => {
    try {
      const response = await api.post(`/schedule/generate/${userId}`);
      return response.data;
      console.log(response.data)
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Failed to generate schedule' };
    }
  },

  // Get league schedule for user
  getLeagueSchedule: async (userId: string) => {
    try {
      const response = await api.get(`/schedule/league/${userId}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Failed to get league schedule' };
    }
  },

  // Get user's next game
  getNextGame: async (userId: string) => {
    try {
      const response = await api.get(`/schedule/next-game/${userId}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Failed to get next game' };
    }
  },

  // Complete a game (record result)
  completeGame: async (gameResult: {
    scheduleId: number;
    homeScore: number;
    awayScore: number;
  }) => {
    try {
      const response = await api.post('/schedule/complete-game', gameResult);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Failed to complete game' };
    }
  },

  // Simulate remaining games in current week
  simulateWeek: async (userId: string) => {
    try {
      const response = await api.post(`/schedule/simulate-week/${userId}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Failed to simulate week' };
    }
  },

  // Generate playoffs for top 2 teams
  generatePlayoffs: async (userId: string) => {
    try {
      const response = await api.post(`/schedule/generate-playoffs/${userId}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Failed to generate playoffs' };
    }
  },

  // Reset and regenerate schedule for a league
  resetSchedule: async (userId: string) => {
    try {
      const response = await api.post(`/schedule/reset/${userId}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Failed to reset schedule' };
    }
  }
};

// Players API calls
export const playersAPI = {
  // Get players by team ID
  getPlayersByTeam: async (teamId: number) => {
    try {
      const response = await api.get(`/players/team/${teamId}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Failed to get team players' };
    }
  },

  // Save team lineup (starters and bench)
  saveLineup: async (teamId: number, lineup: { starters: string[]; bench: string[] }) => {
    try {
      const response = await api.put(`/players/team/${teamId}/lineup`, lineup);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Failed to save lineup' };
    }
  },

  // Generate players for all teams
  generateAllPlayers: async () => {
    try {
      const response = await api.post('/players/generate-all');
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      throw axiosError.response?.data || { success: false, message: 'Failed to generate players' };
    }
  }
};

export default api;
