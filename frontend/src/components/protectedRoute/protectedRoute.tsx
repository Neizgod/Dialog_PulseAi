import { useAppSelector } from '../../services/store';
import { userSliceSelector } from '../../services/slices/userSlice';
import { Navigate, useLocation } from 'react-router-dom';

type ProtectedRouteProps = {
  onlyUnAuth?: boolean;
  adminOnly?: boolean;
  children: React.ReactElement;
};

export const ProtectedRoute = ({
  onlyUnAuth,
  adminOnly,
  children
}: ProtectedRouteProps) => {
  const { isAuthenticated, user } =
    useAppSelector(userSliceSelector);
  const location = useLocation();

  //   if (!isAuthChecked) {
  //     return <Preloader />;
  //   }

  if (!onlyUnAuth && !isAuthenticated) {
    return <Navigate replace to='/login' state={{ from: location }} />;
  }

  if (onlyUnAuth && isAuthenticated) {
    const from = location.state?.from || { pathname: '/import' };

    return <Navigate replace to={from} />;
  }

  // Экраны только для админа: остальных уводим на импорт
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate replace to='/import' />;
  }

  return children;
};
