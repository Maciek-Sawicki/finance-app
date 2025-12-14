export interface User {
  _id: string
  username: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
  country: string
}

export interface UserSettings {
  _id: string
  userId: string
  defaultCurrency: string
  favoriteCurrencies: string[]
  locale: string  
  theme: "light" | "dark" | "system"
  dateFormat: string             
  country: string
  updatedAt: string
}


export interface UserProfileResponse {
  user: User
  settings: UserSettings
}


export interface AuthContextType {
  user: User | null
  token: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  signUp: (data: any) => Promise<any>;
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
  convertedBalance?: number,
  convertedCurrency?: string,
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
  // color?: string;
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

export interface Budget {
  _id: string;
  userId: string;
  categoryId: {
    _id: string;
    name: string;
    icon: string;
    color: string;
    type: string;
  };
  amount: number;
  currency: string;
  spent?: number;
  progress?: number;
  convertedAmount?: number;
  targetCurrency?: string;
  type: "fixed" | "recurring";
  recurrencePeriod?: "weekly" | "monthly" | "quarterly" | "yearly";
  carryOver: boolean;
  status: "active" | "completed";
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface EditBudgetDialogProps {
  budget: Budget | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<Budget>) => Promise<void>;
};

export interface BudgetFormState {
  categoryId?: string;
  amount?: number;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
  type?: string;
  carryOver?: boolean;
  status?: string;
};

export type RecurringFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom";

export type CustomInterval = {
  everyXDays?: number | null;
  everyXWeeks?: number | null;
  everyXMonths?: number | null;
  dayOfMonth?: number | null;
  dayOfWeek?: 
    | "Sunday"
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | null;
  weekOfMonth?: "First" | "Second" | "Third" | "Fourth" | "Last" | null;
};

export interface RecurringTransaction {
  _id: string;
  userId: string;
  name: string;
  categoryId: any; 
  accountId: any; 
  amount: number;
  currency: string;

  frequency: RecurringFrequency;
  customInterval: CustomInterval;

  nextDueDate: string;
  endDate?: string | null;

  repeatCount: number;
  maxRepeats?: number | null;

  description?: string;
  isActive: boolean;
  settled: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface ImportRecord {
  _id: string;
  accountId: string;
  fileName: string;
  status: "pending" | "completed";
  rowCount: number;
  importedCount: number;
  skippedCount: number;
  uploadDate: string;
}

export interface ImportTransaction {
  _id: string;
  date: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  categoryId: string | null;
}




