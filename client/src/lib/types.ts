interface User {
  _id: string
  username: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  loading: boolean
}

export interface Account {
  _id: string
  name: string
  type: string
  currency: string
  startingBalance: number,
  balanceAfterRP: number,
  balance: number,
  icon?: string
  description?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface AccountsContextType {
  accounts: Account[];
  refreshAccounts: () => Promise<void>;
}

export interface AccountSummary {
  _id: string;
  accountName: string;
  type: string;
  currency: string;
  balance: number;
  isDefault: boolean;
}

export interface TotalBalanceResponse {
  totalBalance: number;
  totalAfterRP: number;
  currency: string;
}

export interface Category {
  _id: string;
  name: string;
  type: "income" | "expense" | "exclude" | "transfer";
  icon?: string;
  color?: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  categoryId: Category;
  accountId: Account;
  type: "income" | "expense" | "transfer" | "exclude" | string;
  amount: number;
  date: string; 
  settled: boolean;
  exclude: boolean;
  description?: string;
  createdAt: string; 
  updatedAt: string; 
  __v: number;
}

export interface Transfer {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  toCurrency: string;
  date: string;
  description?: string;
}

export interface YearlyCategory {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  percent: number;
}

export interface YearlyCategories {
  [year: string]: YearlyCategory[];
}

export interface YearlyCategoryStats {
  targetCurrency: string;
  type: "expense" | "income";
  yearlyCategories: YearlyCategories;
}

export interface MonthlyCategory {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  percent: number;
}

export interface MonthlyCategories {
  [month: string]: MonthlyCategory[];
}

export interface MonthlyCategoryStats {
  targetCurrency: string;
  type: "expense" | "income";
  monthlyCategories: MonthlyCategories;
}

export interface MonthlySummaryItem {
  totalIncome: number;
  totalExpense: number;
  profit: number;
  e_i_ratio: number | null; 
}

export interface MonthlySummaryData {
  targetCurrency: string;
  monthlySummary: Record<string, MonthlySummaryItem>;
}

export interface AccountSummaryItem {
  id: string;
  name: string;
  type: string;
  currency: string;
  originalSettled: number;
  originalWithRAndP: number;
  convertedSettled: number;
  convertedWithRAndP: number;
  isDefault: boolean;
}

export interface AccountSummaryResponse {
  currency: string;
  accounts: AccountSummaryItem[];
  total: number;
  totalAfterRAndP: number;
}



