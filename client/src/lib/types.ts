export interface Account {
  _id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  balanceStr?: string; 
  icon?: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TotalBalanceResponse {
  totalBalance: number;
  currency: string;
}

export interface Category {
  _id: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
  color?: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

