import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoutes = ({ isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="protected-layout">
      <Outlet />
    </div>
  );
};

export default ProtectedRoutes;