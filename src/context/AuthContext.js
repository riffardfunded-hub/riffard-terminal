// src/context/AuthContext.js
import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";
import {
  getAccountRequest,
  loginRequest
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    async function loadToken() {
      try {
        const storedToken = await SecureStore.getItemAsync("terminalToken");
        if (storedToken) {
          setToken(storedToken);
          const acc = await getAccountRequest(storedToken);
          setAccount(acc);
        }
      } catch (e) {
        console.log("Error loading token", e);
      } finally {
        setAuthLoading(false);
      }
    }
    loadToken();
  }, []);

  const login = async (email, password) => {
    const data = await loginRequest(email, password);
    if (data?.token) {
      setToken(data.token);
      await SecureStore.setItemAsync("terminalToken", data.token);
      if (data.account) setAccount(data.account);
    }
    return data;
  };

  const refreshAccount = async () => {
    if (!token) return null;
    const acc = await getAccountRequest(token);
    setAccount(acc);
    return acc;
  };

  const logout = async () => {
    setToken(null);
    setAccount(null);
    await SecureStore.deleteItemAsync("terminalToken");
  };

  return (
    <AuthContext.Provider
      value={{ authLoading, token, account, login, logout, refreshAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
