import { useNavigate } from "react-router-dom";
import { logoutUser, userSliceSelector } from "../../services/slices/userSlice";
import { useAppDispatch, useAppSelector } from "../../services/store";
import { SidebarUI } from "../ui/sidebarUI/sidebarUI";

export const Sidebar = () => {
  const { user } = useAppSelector(userSliceSelector);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser())
      .unwrap()
      .catch(() => {})
      .finally(() => navigate("/login"));
  };

  // После logout user становится null (до редиректа ProtectedRoute) — не падаем
  if (!user) return null;

  return (
    <SidebarUI
      nameUser={user.full_name}
      roleUser={user.role}
      onLogout={handleLogout}
    />
  );
};
