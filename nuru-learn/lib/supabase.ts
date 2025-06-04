/**
 * Local Database Configuration
 * Simple in-memory database with localStorage persistence
 * Replaces Supabase with a local solution
 */

// Type definitions for our local database
export interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface DatabaseTable {
  [key: string]: any;
}

export interface DatabaseSchema {
  users: any[];
  user_progress: any[];
  achievements: any[];
  learning_sessions: any[];
  lessons: any[];
}

class LocalDatabase {
  private data: DatabaseSchema;
  private storageKey = 'nuru-learn-db';

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): DatabaseSchema {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load data from localStorage:', error);
    }

    // Default empty schema
    return {
      users: [],
      user_progress: [],
      achievements: [],
      learning_sessions: [],
      lessons: []
    };
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (error) {
      console.warn('Failed to save data to localStorage:', error);
    }
  }

  from(table: keyof DatabaseSchema) {
    return new QueryBuilder(this.data[table], () => this.saveToStorage());
  }

  // Auth simulation
  auth = {
    signUp: async (credentials: { email: string; password: string; options?: any }) => {
      const { email, password, options } = credentials;
      
      // Check if user already exists
      const existingUser = this.data.users.find(u => u.email === email);
      if (existingUser) {
        return {
          data: { user: null, session: null },
          error: new Error('User already exists')
        };
      }

      // Create new user
      const user = {
        id: generateId(),
        email,
        email_confirmed_at: new Date().toISOString(),
        user_metadata: options?.data || {},
        created_at: new Date().toISOString()
      };

      const session = {
        access_token: generateId(),
        refresh_token: generateId(),
        user,
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };

      // Store in localStorage for persistence
      localStorage.setItem('nuru-auth-user', JSON.stringify(user));
      localStorage.setItem('nuru-auth-session', JSON.stringify(session));

      return {
        data: { user, session },
        error: null
      };
    },

    signInWithPassword: async (credentials: { email: string; password: string }) => {
      const { email } = credentials;
      
      // Simple mock authentication - in production, you'd validate password
      const user = this.data.users.find(u => u.email === email);
      if (!user) {
        return {
          data: { user: null, session: null },
          error: new Error('Invalid credentials')
        };
      }

      const session = {
        access_token: generateId(),
        refresh_token: generateId(),
        user,
        expires_at: Date.now() + (24 * 60 * 60 * 1000)
      };

      localStorage.setItem('nuru-auth-user', JSON.stringify(user));
      localStorage.setItem('nuru-auth-session', JSON.stringify(session));

      return {
        data: { user, session },
        error: null
      };
    },

    verifyOtp: async (params: { email: string; token: string; type: string }) => {
      // Simple mock verification
      const user = this.data.users.find(u => u.email === params.email);
      if (!user) {
        return {
          data: { user: null, session: null },
          error: new Error('User not found')
        };
      }

      const session = {
        access_token: generateId(),
        refresh_token: generateId(),
        user,
        expires_at: Date.now() + (24 * 60 * 60 * 1000)
      };

      localStorage.setItem('nuru-auth-user', JSON.stringify(user));
      localStorage.setItem('nuru-auth-session', JSON.stringify(session));

      return {
        data: { user, session },
        error: null
      };
    },

    signOut: async () => {
      localStorage.removeItem('nuru-auth-user');
      localStorage.removeItem('nuru-auth-session');
      return { error: null };
    },

    getSession: async () => {
      try {
        const session = localStorage.getItem('nuru-auth-session');
        if (session) {
          const parsedSession = JSON.parse(session);
          if (parsedSession.expires_at > Date.now()) {
            return { data: { session: parsedSession }, error: null };
          }
        }
      } catch (error) {
        console.warn('Failed to get session:', error);
      }
      return { data: { session: null }, error: null };
    },

    getUser: async () => {
      try {
        const user = localStorage.getItem('nuru-auth-user');
        if (user) {
          return { data: { user: JSON.parse(user) }, error: null };
        }
      } catch (error) {
        console.warn('Failed to get user:', error);
      }
      return { data: { user: null }, error: null };
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Simple implementation - you might want to enhance this
      const checkAuth = () => {
        const session = localStorage.getItem('nuru-auth-session');
        if (session) {
          try {
            const parsedSession = JSON.parse(session);
            if (parsedSession.expires_at > Date.now()) {
              callback('SIGNED_IN', parsedSession);
            } else {
              callback('SIGNED_OUT', null);
            }
          } catch (error) {
            callback('SIGNED_OUT', null);
          }
        } else {
          callback('SIGNED_OUT', null);
        }
      };

      // Check immediately
      checkAuth();

      // Return unsubscribe function
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              // Cleanup if needed
            }
          }
        }
      };
    }
  };

  // Simulate RPC calls
  rpc = async (functionName: string, params: any) => {
    switch (functionName) {
      case 'add_user_xp':
        // Find user progress and add XP
        const progressIndex = this.data.user_progress.findIndex(p => p.user_id === params.p_user_id);
        if (progressIndex >= 0) {
          this.data.user_progress[progressIndex].total_xp += params.p_xp_amount;
          if (params.p_subject) {
            const subjectProgress = this.data.user_progress[progressIndex].subject_progress || {};
            if (subjectProgress[params.p_subject]) {
              subjectProgress[params.p_subject].xp += params.p_xp_amount;
            }
          }
          this.saveToStorage();
        }
        return { data: null, error: null };
      default:
        return { data: null, error: new Error(`RPC function ${functionName} not implemented`) };
    }
  };
}

class QueryBuilder {
  private data: any[];
  private filters: Array<(item: any) => boolean> = [];
  private selectFields: string[] = [];
  private saveCallback: () => void;

  constructor(data: any[], saveCallback: () => void) {
    this.data = data;
    this.saveCallback = saveCallback;
  }

  select(fields: string = '*') {
    if (fields !== '*') {
      this.selectFields = fields.split(',').map(f => f.trim());
    }
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push(item => item[field] === value);
    return this;
  }

  single() {
    const results = this.execute();
    return {
      data: results.length > 0 ? results[0] : null,
      error: results.length === 0 ? new Error('No data found') : null
    };
  }

  async insert(records: any[]) {
    const newRecords = records.map(record => ({
      ...record,
      id: record.id || generateId()
    }));
    
    this.data.push(...newRecords);
    this.saveCallback();
    
    return {
      data: newRecords,
      error: null
    };
  }

  async update(updates: any) {
    const results = [];
    for (let i = 0; i < this.data.length; i++) {
      const item = this.data[i];
      if (this.filters.every(filter => filter(item))) {
        this.data[i] = { ...item, ...updates };
        results.push(this.data[i]);
      }
    }
    
    this.saveCallback();
    
    return {
      data: results,
      error: null
    };
  }

  async delete() {
    const originalLength = this.data.length;
    for (let i = this.data.length - 1; i >= 0; i--) {
      if (this.filters.every(filter => filter(this.data[i]))) {
        this.data.splice(i, 1);
      }
    }
    
    this.saveCallback();
    
    return {
      data: null,
      error: null,
      count: originalLength - this.data.length
    };
  }

  private execute(): any[] {
    let results = this.data.filter(item => 
      this.filters.every(filter => filter(item))
    );

    if (this.selectFields.length > 0) {
      results = results.map(item => {
        const selected: any = {};
        this.selectFields.forEach(field => {
          selected[field] = item[field];
        });
        return selected;
      });
    }

    return results;
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Create and export the database instance
export const supabase = new LocalDatabase();
