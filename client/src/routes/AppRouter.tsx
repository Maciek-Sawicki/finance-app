import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard";

import Accounts from "../pages/Accounts";
import AccountsDashboard from "../pages/AccountsDashboard";
import AccountPage from "../pages/AccountPage";

import Categories from "../pages/Categories";
import CategoriesDashboard from "../pages/CategoriesDashboard";

import BudgetsDashboardPage from "../pages/BudgetsDashboard";

import Transactions from "../pages/Transactions";
import Budgets from "../pages/Budgets";
import RecurringTransactionsPage from "../pages/RecurringTransactions";

import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import Profile from "../pages/Profile";
import PrivateRoute from "../components/PrivateRoute";
import { ProtectedLayout } from "../layouts/ProtectedLayout";


const AppRouter: React.FC = () => (
  <Routes>
    <Route path="/signin" element={<SignIn />} />
    <Route path="/signup" element={<SignUp />} />

    <Route
      path="/profile"
      element={
        <PrivateRoute>
          <ProtectedLayout>
            <Profile />
          </ProtectedLayout>
        </PrivateRoute>
      }
    />

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

    <Route
      path="/accounts/:id"
      element={
        <PrivateRoute>
          <ProtectedLayout>
            <AccountPage />
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

    <Route
      path="/categories/*"
      element={
        <PrivateRoute>
          <ProtectedLayout>
            <CategoriesDashboard />
          </ProtectedLayout>
        </PrivateRoute>
      }
    />

    {/* Transactions */}

    <Route
      path="/transactions/all/*"
      element={
        <PrivateRoute>
          <ProtectedLayout>
            <Transactions />
          </ProtectedLayout>
        </PrivateRoute>
      }
    />

    <Route
      path="/budgets/all/*"
      element={
        <PrivateRoute>
          <ProtectedLayout>
            <Budgets />
          </ProtectedLayout>
        </PrivateRoute>
      }
    />

    <Route
      path="/budgets/*"
      element={
        <PrivateRoute>
          <ProtectedLayout>
            <BudgetsDashboardPage />
          </ProtectedLayout>
        </PrivateRoute>
      }
    />

    <Route
      path="/recurring-transactions/all/*"
      element={
        <PrivateRoute>
          <ProtectedLayout>
            <RecurringTransactionsPage />
          </ProtectedLayout>
        </PrivateRoute>
      }
    />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRouter;
