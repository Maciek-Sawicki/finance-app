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