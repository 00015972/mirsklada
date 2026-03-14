# React Frontend Patterns for Mirsklada

## Project Structure

```
apps/web/src/
├── components/           # Shared UI components
│   ├── ui/              # Base components (Button, Input, Card)
│   ├── layout/          # Layout components (Sidebar, Header)
│   └── common/          # Common components (DataTable, Modal)
├── features/            # Feature-based modules
│   ├── auth/
│   ├── dashboard/
│   ├── inventory/
│   ├── clients/
│   ├── orders/
│   └── settings/
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and API client
│   ├── api.ts          # Axios/fetch wrapper
│   ├── utils.ts        # Helper functions
│   └── constants.ts
├── locales/             # i18n translations
│   ├── en/
│   ├── ru/
│   └── uz/
├── stores/              # Zustand state stores
├── styles/              # Global styles
├── types/               # TypeScript types
├── App.tsx
└── main.tsx
```

## Component Patterns

### Base Component Template

```tsx
// apps/web/src/components/ui/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading,
    disabled,
    children, 
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      ghost: 'bg-transparent text-gray-300 hover:bg-gray-800 focus:ring-gray-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### Feature Component Structure

```tsx
// apps/web/src/features/inventory/components/ProductList.tsx
import { useTranslation } from 'react-i18next';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from './ProductCard';
import { ProductSkeleton } from './ProductSkeleton';
import { EmptyState } from '@/components/common/EmptyState';

export function ProductList() {
  const { t } = useTranslation();
  const { data: products, isLoading, error } = useProducts();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        {t('errors.loadingFailed')}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <EmptyState
        title={t('inventory.noProducts')}
        description={t('inventory.noProductsDescription')}
        actionLabel={t('inventory.addProduct')}
        onAction={() => {/* open modal */}}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## Hooks Patterns

### Data Fetching Hook (TanStack Query)

```tsx
// apps/web/src/features/inventory/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Product, CreateProductInput } from '@mirsklada/shared';
import { useTenantStore } from '@/stores/tenant-store';

const QUERY_KEY = 'products';

export function useProducts() {
  const { tenantId } = useTenantStore();

  return useQuery({
    queryKey: [QUERY_KEY, tenantId],
    queryFn: () => api.get<Product[]>('/products'),
    enabled: !!tenantId,
  });
}

export function useProduct(productId: string) {
  const { tenantId } = useTenantStore();

  return useQuery({
    queryKey: [QUERY_KEY, tenantId, productId],
    queryFn: () => api.get<Product>(`/products/${productId}`),
    enabled: !!tenantId && !!productId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { tenantId } = useTenantStore();

  return useMutation({
    mutationFn: (data: CreateProductInput) => 
      api.post<Product>('/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tenantId] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { tenantId } = useTenantStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProductInput> }) =>
      api.patch<Product>(`/products/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tenantId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tenantId, variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { tenantId } = useTenantStore();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tenantId] });
    },
  });
}
```

### Optimistic Update Pattern

```tsx
// Optimistic update for better UX on slow connections
export function useUpdateStock() {
  const queryClient = useQueryClient();
  const { tenantId } = useTenantStore();

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      api.post(`/stock/adjust`, { productId, quantity }),
    
    // Optimistic update
    onMutate: async ({ productId, quantity }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, tenantId] });

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData<Product[]>([QUERY_KEY, tenantId]);

      // Optimistically update
      queryClient.setQueryData<Product[]>([QUERY_KEY, tenantId], (old) =>
        old?.map((p) =>
          p.id === productId
            ? { ...p, currentStockKg: p.currentStockKg + quantity }
            : p
        )
      );

      return { previousProducts };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData([QUERY_KEY, tenantId], context?.previousProducts);
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tenantId] });
    },
  });
}
```

## State Management (Zustand)

```tsx
// apps/web/src/stores/tenant-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Tenant {
  id: string;
  name: string;
  subscriptionTier: 'basic' | 'pro';
}

interface TenantState {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  tenantId: string | null;
  setCurrentTenant: (tenant: Tenant) => void;
  setTenants: (tenants: Tenant[]) => void;
  clearTenant: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      currentTenant: null,
      tenants: [],
      tenantId: null,
      
      setCurrentTenant: (tenant) => 
        set({ currentTenant: tenant, tenantId: tenant.id }),
      
      setTenants: (tenants) => 
        set({ tenants }),
      
      clearTenant: () => 
        set({ currentTenant: null, tenantId: null }),
    }),
    {
      name: 'tenant-storage',
    }
  )
);

// apps/web/src/stores/auth-store.ts
import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  setUser: (user) => 
    set({ user, isAuthenticated: !!user, isLoading: false }),
  
  setLoading: (isLoading) => 
    set({ isLoading }),
}));
```

## API Client

```tsx
// apps/web/src/lib/api.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useTenantStore } from '@/stores/tenant-store';
import { useAuthStore } from '@/stores/auth-store';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(async (config) => {
  // Add auth token
  const session = await supabase.auth.getSession();
  if (session.data.session?.access_token) {
    config.headers.Authorization = `Bearer ${session.data.session.access_token}`;
  }

  // Add tenant ID
  const { tenantId } = useTenantStore.getState();
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }

  return config;
});

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ error: { code: string; message: string } }>) => {
    const message = error.response?.data?.error?.message || 'An error occurred';
    const code = error.response?.data?.error?.code || 'UNKNOWN_ERROR';
    
    // Handle auth errors
    if (error.response?.status === 401) {
      useAuthStore.getState().setUser(null);
      window.location.href = '/login';
    }

    return Promise.reject({ message, code, status: error.response?.status });
  }
);

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.get<any, { success: boolean; data: T }>(url, config).then((r) => r.data),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    axiosInstance.post<any, { success: boolean; data: T }>(url, data, config).then((r) => r.data),

  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    axiosInstance.patch<any, { success: boolean; data: T }>(url, data, config).then((r) => r.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.delete<any, { success: boolean; data: T }>(url, config).then((r) => r.data),
};
```

## i18n Setup

```tsx
// apps/web/src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from '@/locales/en/common.json';
import ruCommon from '@/locales/ru/common.json';
import uzCommon from '@/locales/uz/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon },
      ru: { common: ruCommon },
      uz: { common: uzCommon },
    },
    defaultNS: 'common',
    fallbackLng: 'ru', // Default to Russian for Uzbekistan
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

```json
// apps/web/src/locales/en/common.json
{
  "app": {
    "name": "Mirsklada",
    "tagline": "Inventory Management System"
  },
  "nav": {
    "dashboard": "Dashboard",
    "inventory": "Inventory",
    "clients": "Clients",
    "orders": "Orders",
    "reports": "Reports",
    "settings": "Settings"
  },
  "inventory": {
    "title": "Products",
    "addProduct": "Add Product",
    "noProducts": "No products yet",
    "noProductsDescription": "Start by adding your first product to the inventory",
    "stock": "Stock",
    "price": "Price per kg"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "search": "Search"
  },
  "units": {
    "kg": "{{value}} kg",
    "uzs": "{{value}} UZS"
  }
}
```

## Dark Mode Tailwind Config

```ts
// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark theme primary colors
        dark: {
          bg: '#0f0f0f',
          card: '#1a1a1a',
          border: '#2a2a2a',
          hover: '#252525',
        },
        // Brand colors
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

## Form Handling (React Hook Form + Zod)

```tsx
// apps/web/src/features/inventory/components/ProductForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { CreateProductInput, createProductSchema } from '@mirsklada/shared';
import { useCreateProduct } from '../hooks/useProducts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ProductFormProps {
  onSuccess?: () => void;
}

export function ProductForm({ onSuccess }: ProductFormProps) {
  const { t } = useTranslation();
  const createProduct = useCreateProduct();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
  });

  const onSubmit = async (data: CreateProductInput) => {
    try {
      await createProduct.mutateAsync(data);
      reset();
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label={t('inventory.productName')}
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label={t('inventory.price')}
        type="number"
        step="0.01"
        error={errors.basePricePerKg?.message}
        {...register('basePricePerKg', { valueAsNumber: true })}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => reset()}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
```

## Utility Functions

```tsx
// apps/web/src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format weight with 2 decimal places
 */
export function formatWeight(kg: number): string {
  return `${kg.toFixed(2)} kg`;
}

/**
 * Format UZS currency
 */
export function formatUZS(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';
}

/**
 * Format date for Uzbekistan locale
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}
```
