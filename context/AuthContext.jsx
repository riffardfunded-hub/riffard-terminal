import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";
import {
  getAccountRequest,
  loginRequest,
  logoutRequest,
  registerDeviceRequest,
} from "../lib/api";
import { buildDevicePayload } from "../lib/device";

const AuthContext = createContext(null);
const TOKEN_KEY = "riffardToken";

function runBackgroundTask(label, fn) {
  setTimeout(() => {
    Promise.resolve()
      .then(fn)
      .catch((err) => {
        console.log(`[BACKGROUND ${label}]`, err);
      });
  }, 0);
}

export function AuthProvider({ children }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [account, setAccount] = useState(null);

  async function registerDeviceInBackground(sessionToken, fundedAccountId = null) {
    const devicePayload = await buildDevicePayload();

    await registerDeviceRequest(sessionToken, {
      fundedAccountId,
      ...devicePayload,
    });
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        let stored = null;

        try {
          stored = await SecureStore.getItemAsync(TOKEN_KEY);
        } catch {
          stored = null;
        }

        if (!stored) return;

        if (!mounted) return;
        setToken(stored);

const cachedAccount =
  await SecureStore.getItemAsync(
    "riffardCachedAccount"
  );

if (cachedAccount && mounted) {
  try {
    setAccount(JSON.parse(cachedAccount));
  } catch {}
}

        try {
          const acc = await getAccountRequest(stored);

if (!mounted) return;

setAccount(acc);

await SecureStore.setItemAsync(
  "riffardCachedAccount",
  JSON.stringify(acc)
);

          runBackgroundTask("DEVICE_REGISTER_LOAD", () =>
            registerDeviceInBackground(stored, acc?.id || null)
          );
        } catch (e) {
          console.log("Load account with stored token failed", e);

          if (!mounted) return;

          setToken(null);
          setAccount(null);

          try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
          } catch {}
        }
      } catch (e) {
        console.log("Error load token", e);
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const data = await loginRequest(email, password);

    if (!data?.token) {
      throw new Error("Login succeeded but no token was returned.");
    }

    setToken(data.token);

    console.log("LOGIN TOKEN", data.token);

    try {
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    } catch (e) {
      console.log("SecureStore set error", e);
    }

    let acc = null;

    try {
      acc = await getAccountRequest(data.token);

setAccount(acc);

await SecureStore.setItemAsync(
  "riffardCachedAccount",
  JSON.stringify(acc)
);
    } catch (e) {
      console.log("Account fetch after login failed", e);
      setAccount(null);
      throw new Error("Login succeeded but account could not be loaded.");
    }

    runBackgroundTask("DEVICE_REGISTER_LOGIN", () =>
      registerDeviceInBackground(data.token, acc?.id || null)
    );

    return {
      ...data,
      account: acc,
    };
  };

  const refreshAccount = async () => {
    if (!token) return null;

    const acc = await getAccountRequest(token);
    setAccount(acc);

    return acc;
  };

  const logout = async () => {
    const currentToken = token;

    setToken(null);
    setAccount(null);

    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.log("SecureStore delete error", e);
    }

    if (currentToken) {
      runBackgroundTask("LOGOUT_REQUEST", () => logoutRequest(currentToken));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authLoading,
        token,
        account,
        login,
        logout,
        refreshAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}