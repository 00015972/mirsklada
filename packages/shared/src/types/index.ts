// Type definitions for Mirsklada

// ═══════════════════════════════════════════════════════════════
// TENANCY & AUTH
// ═══════════════════════════════════════════════════════════════

export type SubscriptionTier = 'basic' | 'pro';
export type UserRole = 'superadmin' | 'admin' | 'staff';
export type TenantStatus = 'active' | 'suspended' | 'cancelled';
export type MemberStatus = 'active' | 'invited' | 'disabled';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: SubscriptionTier;
  status: TenantStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

export interface TenantMember {
  id: string;
  tenantId: string;
  userId: string;
  role: UserRole;
  status: MemberStatus;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  unit: string;
  basePricePerKg: number;
  currentStockKg: number;
  minStockKg: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type StockMovementType = 'IN' | 'OUT' | 'ADJUST';

export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  type: StockMovementType;
  quantityKg: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// CLIENTS & PRICING
// ═══════════════════════════════════════════════════════════════

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  telegramId: number | null;
  address: string | null;
  priceMatrixId: string | null;
  debtBalance: number;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceMatrix {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceMatrixItem {
  id: string;
  priceMatrixId: string;
  productId: string;
  customPriceKg: number;
}

// ═══════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'delivered' 
  | 'cancelled';

export interface Order {
  id: string;
  tenantId: string;
  clientId: string;
  orderNumber: string | null;
  status: OrderStatus;
  totalAmount: number;
  notes: string | null;
  deliveryAddress: string | null;
  deliveryDate: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt: Date | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantityKg: number;
  pricePerKg: number;
  lineTotal: number;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// PAYMENTS & DEBT
// ═══════════════════════════════════════════════════════════════

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'click' | 'payme';
export type DebtLedgerType = 'DEBIT' | 'CREDIT';

export interface Payment {
  id: string;
  tenantId: string;
  clientId: string;
  amount: number;
  method: PaymentMethod | null;
  reference: string | null;
  notes: string | null;
  receivedBy: string | null;
  createdAt: Date;
}

export interface DebtLedgerEntry {
  id: string;
  tenantId: string;
  clientId: string;
  type: DebtLedgerType;
  amount: number;
  orderId: string | null;
  paymentId: string | null;
  description: string | null;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// API RESPONSES
// ═══════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
