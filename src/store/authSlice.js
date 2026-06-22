import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  signIn,
  signOut,
  signUpWithProfile,
  getSessionWithProfile,
  fetchProfileById,
} from "../services/authService";
import { supabase } from "../lib/supabase";
import { mapProfile } from "../lib/mappers";
import { withTimeout } from "../lib/async";

export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async () => {
    try {
      return await getSessionWithProfile();
    } catch (err) {
      console.error("Auth init failed:", err);
      return null;
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, thunkAPI) => {
    try {
      return await signIn(email, password);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Login failed");
    }
  },
);

export const adminLogin = createAsyncThunk(
  "auth/adminLogin",
  async ({ email, password }, thunkAPI) => {
    try {
      const result = await signIn(email, password);
      if (result.user?.role !== "admin") {
        await signOut();
        return thunkAPI.rejectWithValue("Access denied — admin account required");
      }
      return result;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Admin login failed");
    }
  },
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, thunkAPI) => {
    try {
      const result = await signUpWithProfile(userData);
      if (result.needsEmailConfirm) {
        return {
          message: "Account created! Please confirm your email, then login.",
          needsEmailConfirm: true,
        };
      }
      return {
        message: "Account created! Welcome to Velora.",
        needsEmailConfirm: false,
        user: result.user,
        session: result.session,
        token: result.token,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Signup failed");
    }
  },
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await signOut();
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: null,
    user: null,
    session: null,
    status: "idle",
    initialized: false,
    error: null,
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    clearAuthError(state) {
      state.error = null;
    },
    forceInitialized(state) {
      state.initialized = true;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.status = "loading";
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.status = "idle";
        state.initialized = true;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.session = action.payload.session;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.status = "idle";
        state.initialized = true;
      })

      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "idle";
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.session = action.payload.session;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(adminLogin.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.status = "idle";
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.session = action.payload.session;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (action.payload.user && action.payload.session) {
          state.user = action.payload.user;
          state.session = action.payload.session;
          state.token = action.payload.token;
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.session = null;
        state.status = "idle";
      });
  },
});

export const { setUser, clearAuthError, forceInitialized } = authSlice.actions;

/** Listen for Supabase auth state changes */
export function setupAuthListener(store) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_OUT") {
      store.dispatch({ type: "auth/logout/fulfilled" });
      return;
    }
    if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
      try {
        const profile = await withTimeout(
          fetchProfileById(session.user.id),
          5000,
          null,
        );
        store.dispatch(setUser(mapProfile(profile, session.user)));
      } catch {
        store.dispatch(setUser(mapProfile(null, session.user)));
      }
    }
  });
}

export const logout = logoutUser;
export default authSlice.reducer;
