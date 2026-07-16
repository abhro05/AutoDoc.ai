import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { supabase, supabaseAvailable } from '../supabase/client';
import { getAuthErrorMessage } from '../utils/authErrors';

const AuthContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData && userData !== 'undefined' && userData !== 'null' && userData !== '') {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('AuthProvider error:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = async (name, email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name,
        email,
        password,
      });

      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error, 'Signup failed. Please try again.'),
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error, 'Login failed. Please try again.'),
      };
    }
  };

  const signInWithGoogle = async () => {
    if (!supabaseAvailable) {
      return { success: false, error: 'OAuth is not configured. Set up Supabase environment variables.' };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/success`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const signInWithGithub = async () => {
    if (!supabaseAvailable) {
      return { success: false, error: 'OAuth is not configured. Set up Supabase environment variables.' };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/success`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const refreshProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/user/me`);
      if (response.data.success) {
        const profile = response.data.user;
        const userData = {
          id: profile._id || profile.id,
          name: profile.name,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
          authProvider: profile.authProvider,
          bio: profile.bio,
          createdAt: profile.createdAt,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
    } catch {
      /* silent fail */
    }
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);

    if (supabaseAvailable) {
      supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, signInWithGoogle, signInWithGithub, logout, loading, refreshProfile, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};