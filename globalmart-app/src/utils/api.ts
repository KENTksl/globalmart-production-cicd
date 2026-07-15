const API_BASE_URL = 'https://43s4cr8zt0.execute-api.ap-southeast-1.amazonaws.com';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: number;
  categoryName?: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  productCount?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface ProductPayload {
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: number;
}

export interface CategoryPayload {
  name: string;
  description: string;
}

export interface CheckoutPayload {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
}

export interface AdminChartDatum {
  label: string;
  value: number;
}

export interface AdminOrderSummary {
  id: number;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface AdminStats {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalRevenue: number;
  productsPerCategory: AdminChartDatum[];
  orderStatusBreakdown: AdminChartDatum[];
  latestOrders: AdminOrderSummary[];
}

function normalizeProduct(raw: any): Product {
  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    price: Number(raw.price ?? 0),
    image: String(raw.image ?? ''),
    categoryId: Number(raw.categoryId ?? 0),
    categoryName: raw.categoryName ? String(raw.categoryName) : undefined,
  };
}

function normalizeCategory(raw: any): Category {
  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    productCount: raw.productCount !== undefined ? Number(raw.productCount) : undefined,
  };
}

function normalizeUser(raw: any): User {
  return {
    id: Number(raw.id ?? raw.numericId ?? 0),
    username: String(raw.username ?? ''),
    email: String(raw.email ?? ''),
  };
}

function getToken() {
  return localStorage.getItem('token');
}

async function request<T>(path: string, init: RequestInit = {}, requiresAuth = false): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (requiresAuth) {
    const token = getToken();
    if (!token) {
      throw new Error('Unauthorized');
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export interface UpdateUserData {
  username?: string;
  password?: string;
}

export const api = {
  async getProducts(search?: string, minPrice?: number, maxPrice?: number): Promise<Product[]> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (minPrice !== undefined) params.set('minPrice', String(minPrice));
    if (maxPrice !== undefined) params.set('maxPrice', String(maxPrice));
    const url = params.toString() ? `/products?${params.toString()}` : '/products';
    console.log('Calling getProducts with URL:', url);
    const data = await request<any[]>(url);
    return data.map(normalizeProduct);
  },

  async getProduct(id: number): Promise<Product> {
    const data = await request<any>(`/products/${id}`);
    return normalizeProduct(data);
  },

  async createProduct(payload: ProductPayload): Promise<Product> {
    const data = await request<any>(
      '/products',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      true
    );
    return normalizeProduct(data);
  },

  async updateProduct(id: number, payload: ProductPayload): Promise<Product> {
    const data = await request<any>(
      `/products/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      true
    );
    return normalizeProduct(data);
  },

  async deleteProduct(id: number): Promise<void> {
    await request<void>(`/products/${id}`, { method: 'DELETE' }, true);
  },

  async getCategories(): Promise<Category[]> {
    const data = await request<any[]>('/categories');
    return data.map(normalizeCategory);
  },

  async getCategory(id: number): Promise<Category> {
    const data = await request<any>(`/categories/${id}`);
    return normalizeCategory(data);
  },

  async createCategory(payload: CategoryPayload): Promise<Category> {
    const data = await request<any>(
      '/categories',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      true
    );
    return normalizeCategory(data);
  },

  async updateCategory(id: number, payload: CategoryPayload): Promise<Category> {
    const data = await request<any>(
      `/categories/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      true
    );
    return normalizeCategory(data);
  },

  async deleteCategory(id: number): Promise<void> {
    await request<void>(`/categories/${id}`, { method: 'DELETE' }, true);
  },

  async getProductsByCategory(categoryId: string | number, search?: string, minPrice?: number, maxPrice?: number): Promise<Product[]> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (minPrice !== undefined) params.set('minPrice', String(minPrice));
    if (maxPrice !== undefined) params.set('maxPrice', String(maxPrice));
    const url = params.toString() 
      ? `/categories/${categoryId}/products?${params.toString()}` 
      : `/categories/${categoryId}/products`;
    console.log('Calling getProductsByCategory with URL:', url);
    const data = await request<any[]>(url);
    return data.map(normalizeProduct);
  },

  async register(data: RegisterData): Promise<{ token: string; user: User }> {
    const result = await request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const payload = {
      token: String(result.token ?? ''),
      user: normalizeUser(result.user ?? {}),
    };
    localStorage.setItem('token', payload.token);
    localStorage.setItem('user', JSON.stringify(payload.user));
    return payload;
  },

  async login(data: LoginData): Promise<{ token: string; user: User }> {
    const result = await request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const payload = {
      token: String(result.token ?? ''),
      user: normalizeUser(result.user ?? {}),
    };
    localStorage.setItem('token', payload.token);
    localStorage.setItem('user', JSON.stringify(payload.user));
    return payload;
  },

  async getMe(): Promise<User> {
    const data = await request<any>('/auth/me', {}, true);
    const user = normalizeUser(data);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  async updateMe(data: UpdateUserData): Promise<User> {
    const result = await request<any>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
    const user = normalizeUser(result);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? normalizeUser(JSON.parse(userStr)) : null;
  },

  isAuthenticated(): boolean {
    return Boolean(getToken() && this.getCurrentUser());
  },

  async getAdminStats(): Promise<AdminStats> {
    return request<AdminStats>('/admin/stats', {}, true);
  },

  async checkout(payload: CheckoutPayload) {
    const currentUser = this.getCurrentUser();
    return request('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        userId: currentUser?.id ?? 0,
      }),
    });
  },
};
