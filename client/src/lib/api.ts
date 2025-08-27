const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

export interface RegisterResponse {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type RuleType = 'ip' | 'url' | 'port';
export type Category = 'whitelist' | 'blacklist';

export const api = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }
    return res.json();
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Registration failed');
    }
    return res.json();
  },

  fetchAllRules: async () => {
    const res = await fetch(`${API_BASE}/rules/api/firewall/rules`);
    if (!res.ok) throw new Error('Failed to fetch rules');
    return res.json();
  },

  addRules: async (type: RuleType, mode: Category, values: (string|number)[]) => {
    const res = await fetch(`${API_BASE}/rules/api/firewall/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, values })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to add rules');
    }
    return res.json();
  },

  deleteRules: async (type: RuleType, mode: Category, values: (string|number)[]) => {
    const res = await fetch(`${API_BASE}/rules/api/firewall/${type}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, values })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete rules');
    }
    return res.json();
  },

  deleteRulesByIds: async (ids: number[]) => {
    const res = await fetch(`${API_BASE}/rules/api/firewall/many/rules`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete selected rules');
    }
    return res.json();
  },

  toggleRules: async (payload: { ips?: { ids: number[]; active: boolean }; urls?: { ids: number[]; active: boolean }; ports?: { ids: number[]; active: boolean } }) => {
    const res = await fetch(`${API_BASE}/rules/api/firewall/rules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update rules');
    }
    return res.json();
  }
};
