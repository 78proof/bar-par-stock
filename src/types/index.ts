export interface Category {
  id: string;
  name: string;
  type?: 'spirit' | 'wine' | 'soft_drink' | 'other';
  updatedAt: any;
  createdBy: string;
}

export interface Item {
  id: string;
  name: string;
  categoryId: string;
  unit: string;
  parLevel: number;
  currentStock: number;
  isGlass?: boolean;
  type?: 'spirit' | 'wine' | 'soft_drink' | 'other';
  updatedAt: any;
  createdBy: string;
}

export interface Ingredient {
  itemId: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  categoryId: string;
  ingredients: Ingredient[];
  updatedAt: any;
  createdBy: string;
}

export interface InventoryLog {
  id: string;
  itemId: string;
  quantity: number;
  date: string; // YYYY-MM-DD
  type: 'count' | 'usage' | 'delivery' | 'sales';
  notes?: string;
  createdBy: string;
  createdAt: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}
