import type { Movie, Comment, UserProfile } from '../types';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isReplit = hostname.includes('replit.dev') || hostname.includes('repl.co');
    
    if (isReplit) {
      const protocol = window.location.protocol;
      return `${protocol}//${hostname}:8000/api`;
    }
  }
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

export const api = {
  async getMovies(params?: { genre?: string; search?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    
    if (params?.genre) queryParams.append('genre', params.genre);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/movies?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch movies');
    
    return response.json();
  },

  async getMovie(id: number): Promise<Movie> {
    const response = await fetch(`${API_BASE_URL}/movies/${id}`);
    if (!response.ok) throw new Error('Failed to fetch movie');
    
    return response.json();
  },

  async getMovieComments(movieId: number): Promise<Comment[]> {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}/comments`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    
    return response.json();
  },

  async addComment(movieId: number, userId: number, text: string): Promise<Comment> {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, text }),
    });
    
    if (!response.ok) throw new Error('Failed to add comment');
    
    return response.json();
  },

  async login(email: string, password: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to login');
    }
    
    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      avatarUrl: data.avatarUrl,
    };
  },

  async signup(name: string, email: string, password: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to signup');
    }
    
    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      avatarUrl: data.avatarUrl,
    };
  },

  async getUserProfile(userId: number): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user profile');
    
    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      avatarUrl: data.avatarUrl,
    };
  },

  async updateUserProfile(userId: number, updates: Partial<UserProfile>): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: updates.name,
        email: updates.email,
        avatarUrl: updates.avatarUrl,
      }),
    });
    
    if (!response.ok) throw new Error('Failed to update user profile');
    
    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      avatarUrl: data.avatarUrl,
    };
  },

  async getGenres(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/genres`);
    if (!response.ok) throw new Error('Failed to fetch genres');
    
    return response.json();
  },

  async getWatchlist(userId: number): Promise<Movie[]> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/watchlist`);
    if (!response.ok) throw new Error('Failed to fetch watchlist');
    
    return response.json();
  },

  async addToWatchlist(userId: number, movieId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/watchlist/${movieId}`, {
      method: 'POST',
    });
    
    if (!response.ok) throw new Error('Failed to add to watchlist');
  },

  async removeFromWatchlist(userId: number, movieId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/watchlist/${movieId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) throw new Error('Failed to remove from watchlist');
  },

  async getContinueWatching(userId: number): Promise<Movie[]> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/continue-watching`);
    if (!response.ok) throw new Error('Failed to fetch continue watching');
    
    return response.json();
  },

  async updateWatchProgress(userId: number, movieId: number, progressSeconds: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/watch-progress/${movieId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ progressSeconds }),
    });
    
    if (!response.ok) throw new Error('Failed to update watch progress');
  },
};
