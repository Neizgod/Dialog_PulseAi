import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  ApiError,
  ApiErrorDetail,
  UserShort,
} from "../../utils/types/common.types";
import type {
  LoginRequest,
  RegisterRequest,
} from "../../utils/types/auth.types";
import {
  authUserAPI,
  loginUserAPI,
  logoutUserAPI,
  registerUserAPI,
} from "../../utils/dialog-pulse-api";
import { deleteCookie, setCookie } from "../../utils/cookie";

type TUserState = {
  isAuthChecked: boolean;
  isAuthenticated: boolean;
  loginUserError: null | ApiErrorDetail;
  loginUserRequest: boolean;
  user: UserShort | null; //CurrentUser
};

const initialState: TUserState = {
  isAuthChecked: false,
  isAuthenticated: false,
  loginUserRequest: false,
  loginUserError: null,
  user: { id: 0, email: "", full_name: "", role: "user" }, //   is_active: false, },
};

export const authUser = createAsyncThunk("user/authUser", async () =>
  authUserAPI()
);

export const loginUser = createAsyncThunk(
  "user/loginUser",
  async (data: LoginRequest, { rejectWithValue }) => {
    try {
      return await loginUserAPI(data);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const registerUser = createAsyncThunk(
  "user/registerUser",
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      return await registerUserAPI(data);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const logoutUser = createAsyncThunk("user/logoutUser", async () =>
  logoutUserAPI()
);

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  selectors: {
    userSliceSelector: (state) => state,
  },
  extraReducers: (builder) => {
    builder
      .addCase(authUser.pending, (state) => {
        state.loginUserRequest = true;
      })
      .addCase(authUser.rejected, (state) => {
        state.loginUserRequest = false;
        state.isAuthChecked = true;
      })
      .addCase(authUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loginUserRequest = false;
        state.isAuthenticated = true;
        state.isAuthChecked = true;
      })

      .addCase(loginUser.pending, (state) => {
        state.loginUserRequest = true;
        state.loginUserError = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loginUserRequest = false;
        state.isAuthChecked = true;
        state.loginUserError = (action.payload as ApiError).detail;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        // state.user.is_active= action.payload.user.is_active;
        state.loginUserRequest = false;
        state.isAuthenticated = true;
        state.isAuthChecked = true;
        setCookie("accessToken", action.payload.access_token);
      })

      .addCase(registerUser.pending, (state) => {
        state.loginUserRequest = true;
        state.loginUserError = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loginUserRequest = false;
        state.loginUserError = (action.payload as ApiError).detail;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loginUserRequest = false;
      })

      .addCase(logoutUser.pending, (state) => {
        state.loginUserRequest = true;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loginUserRequest = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loginUserRequest = false;
        state.isAuthenticated = false;
        state.isAuthChecked = true;
        state.user = null;
        state.loginUserError = null;
        deleteCookie("accessToken");
      });
  },
});

export const { userSliceSelector } = userSlice.selectors;
