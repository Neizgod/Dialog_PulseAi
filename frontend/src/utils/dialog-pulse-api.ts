// Barrel: реэкспорт API по доменам. Реализация — в utils/api/*.
// Импорты потребителей не меняются: import { xxxAPI } from ".../dialog-pulse-api".
export * from "./api/auth";
export * from "./api/imports";
export * from "./api/analysis";
export * from "./api/dialogs";
export * from "./api/dashboard";
export * from "./api/reports";
export * from "./api/managers";
export * from "./api/aiSettings";
