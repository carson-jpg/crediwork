import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  phone: string;
  fullName: string;
  package: 'A' | 'B';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token and validate it
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Token found in localStorage, validating...');
      validateToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://crediwork.onrender.com';
      const response = await fetch(`${baseURL}/api/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const validatedUser: User = {
          _id: data.user._id,
          email: data.user.email,
          phone: data.user.phone,
          fullName: `${data.user.firstName} ${data.user.lastName}`,
          role: data.user.role,
          package: data.user.package,
          packagePrice: data.user.package === 'A' ? 1000 : 2000,
          dailyEarning: data.user.package === 'A' ? 50 : 100,
          status: data.user.status,
          activationDate: data.user.activationDate ? new Date(data.user.activationDate) : null,
          createdAt: new Date(data.user.createdAt),
          updatedAt: new Date(data.user.updatedAt),
        };
        setUser(validatedUser);
        console.log('Token validated successfully, user:', validatedUser.role);
      } else {
        console.log('Token validation failed, clearing token');
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://crediwork.onrender.com';
      const response = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const loggedInUser: User = {
        _id: data.user._id,
        email: data.user.email,
        phone: data.user.phone,
        fullName: `${data.user.firstName} ${data.user.lastName}`,
        role: data.user.role,
        package: data.user.package,
        packagePrice: data.user.package === 'A' ? 1000 : 2000,
        dailyEarning: data.user.package === 'A' ? 50 : 100,
        status: data.user.status,
        activationDate: data.user.activationDate ? new Date(data.user.activationDate) : null,
        createdAt: new Date(data.user.createdAt),
        updatedAt: new Date(data.user.updatedAt),
      };

      localStorage.setItem('token', data.token);
      setUser(loggedInUser);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://crediwork.onrender.com';
      const response = await fetch(`${baseURL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          phone: userData.phone,
          firstName: userData.fullName.split(' ')[0],
          lastName: userData.fullName.split(' ').slice(1).join(' ') || '',
          package: userData.package,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      const newUser: User = {
        _id: data.user._id,
        email: data.user.email,
        phone: userData.phone,
        fullName: userData.fullName,
        role: data.user.role,
        package: data.user.package,
        packagePrice: userData.package === 'A' ? 1000 : 2000,
        dailyEarning: userData.package === 'A' ? 50 : 100,
        status: data.user.status,
        activationDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      localStorage.setItem('token', data.token);
      setUser(newUser);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
