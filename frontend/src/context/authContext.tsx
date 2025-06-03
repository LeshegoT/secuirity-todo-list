import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/apiService';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, totpToken?: string) => Promise<{ success: boolean; requiresTwoFactor?: boolean; message: string }>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; data?: any; message: string }>;
  verify: (userId: string, token: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const storedToken = localStorage.getItem('token');
 //   const storedUser = localStorage.getItem('user');

 //if (storedToken && storedUser)
 if (storedToken)  {
      try {
   //     const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
     //   setUser(parsedUser);
        apiService.setAuthToken(storedToken); // Set token in apiService (now updates localStorage)
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('token');
       // localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string, totpToken?: string) => {
    try {
      const response = await apiService.login(email, password, totpToken);

      if (response.requiresTwoFactor) {
        return { success: false, requiresTwoFactor: true, message: response.message };
      }

      if (response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        apiService.setAuthToken(response.token); // Set token in apiService (now updates localStorage)
        return { success: true, message: response.message };
      }

      return { success: false, message: response.message };
    } catch (error: any) {
      // Adjusted to be compatible with the custom error structure from fetchWrapper
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed. Please try again.'
      };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await apiService.register(name, email, password);
      return {
        success: true,
        data: response.data,
        message: 'Registration successful! Please set up your 2FA.'
      };
    } catch (error: any) {
      // Adjusted to be compatible with the custom error structure from fetchWrapper
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed. Please try again.'
      };
    }
  };

  const verify = async (userId: string, totpToken: string) => {
    try {
      const response = await apiService.verify(userId, totpToken);
      return {
        success: response.data.verified,
        message: response.message
      };
    } catch (error: any) {
      // Adjusted to be compatible with the custom error structure from fetchWrapper
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Verification failed. Please try again.'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    apiService.clearAuthToken(); // Clear token in apiService (now clears localStorage)
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    verify
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};