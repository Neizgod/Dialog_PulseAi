// store.ts
import { combineSlices, configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import { userSlice } from "./slices/userSlice";
import {  importSlice } from "./slices/importSlice";
import { dialogsSlice } from "./slices/dialogsSlice";
import { dialogCardSlice } from "./slices/dialogCardSlice";
import { dashboardSlice } from "./slices/dashboardSlice";

// Добавляйте слайсы сюда по мере создания:
// import { counterSlice } from './features/counter/counterSlice';

const rootReducer = combineSlices(
  userSlice,
  importSlice,
  dialogsSlice,
  dialogCardSlice,
  dashboardSlice
);

const store = configureStore({
  reducer: rootReducer,
  //   devTools: process.env.NODE_ENV !== 'production',
});

// Типы
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

// Типизированные хуки
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
