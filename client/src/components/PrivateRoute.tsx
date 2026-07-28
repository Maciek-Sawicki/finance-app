import * as React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";


interface PrivateRouteProps {
  children: React.JSX.Element;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // There's no token to read synchronously anymore - "am I logged in" now
  // only resolves once AuthProvider's /auth/me check comes back, so this
  // has to wait rather than redirecting before that's known.
  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default PrivateRoute;
