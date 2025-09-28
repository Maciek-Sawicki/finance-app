import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard";

import Accounts from "../pages/Accounts";
import AccountsDashboard from "../pages/AccountsDashboard";

import Categories from "../pages/Categories";

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

    {/* {Accounts} */}
    <Route
      path="/accounts"
      element={
        <PrivateRoute>
          <ProtectedLayout>
            <AccountsDashboard />
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

    {/* {Categories} */}

    <Route
      path="/categories/all/*"
      element={
        <PrivateRoute>
          <ProtectedLayout>
            <Categories />
          </ProtectedLayout>
        </PrivateRoute>
      }
    />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRouter;
