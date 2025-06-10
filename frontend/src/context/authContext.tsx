import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiService } from "../services/apiService";
import { decodeToken, DecodedUser } from "../utils/jwtUtils";

interface AuthContextType {
  user: DecodedUser | null;
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<DecodedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = sessionStorage.getItem("token");

    console.log("Stored token:", storedToken);

    if (storedToken) {
      const decoded = decodeToken(storedToken);
      console.log("Decoded token:", decoded);

      if (decoded) {
        setToken(storedToken);
        setUser(decoded);
        apiService.setAuthToken(storedToken);
      } else {
        sessionStorage.removeItem("token");
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

      if (response.token) {
        const decoded = decodeToken(response.token);
        if (decoded) {
          sessionStorage.setItem("token", response.token);
          setToken(response.token);
          setUser(decoded);
          apiService.setAuthToken(response.token);
          return { success: true, message: response.message };
        }
      }

      return { success: false, message: response.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Login failed.",
      };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await apiService.register(name, email, password);
      return {
        success: true,
        data: response.data,
        message: "Registration successful! Please set up your 2FA.",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Registration failed.",
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
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Verification failed. Please try again.'
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("token");
    apiService.clearAuthToken();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register, verify }}>
      {children}
    </AuthContext.Provider>
  );
};
