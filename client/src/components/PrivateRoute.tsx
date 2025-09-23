import * as React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";


interface PrivateRouteProps {
  children: React.JSX.Element;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { token } = useAuth();

  if (!token) {
    // Brak tokenu → przekieruj na logowanie
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default PrivateRoute;

