import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Accounts from "../pages/Accounts";
import SignIn from "../pages/SignIn";
import PrivateRoute from "../components/PrivateRoute";
import { ProtectedLayout } from "../layouts/ProtectedLayout";

const AppRouter: React.FC = () => (
  <Routes>
    <Route path="/signin" element={<SignIn />} />

    <Route
      path="/"
      element={
        <PrivateRoute>
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        </PrivateRoute>
      }
    />

    <Route
      path="/accounts/all/*"
      element={
        <PrivateRoute>
          <ProtectedLayout>
            <Accounts />
          </ProtectedLayout>
        </PrivateRoute>
      }
    />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRouter;
