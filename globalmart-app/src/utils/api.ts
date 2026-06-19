const API_BASE_URL = 'http://localhost:8080';


export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image?: string;
  categoryId?: string | number;
}

export interface Category {
  id: string;
  numericId: number;
  name: string;
  description: string;
}

export interface User {
  _id?: string;
  numericId: number;
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

function normalizeProduct(raw: any): Product {
  return {
    id: Number(raw.numericId ?? raw.id),
    name: raw.name ?? '',
    description: raw.description ?? '',
    price: Number(raw.price ?? 0),
    image: raw.image ?? '',
    categoryId: raw.categoryId,
  };
}

function normalizeCategory(raw: any): Category {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    numericId: Number(raw.numericId ?? 0),
    name: raw.name ?? '',
    description: raw.description ?? '',
  };
}

export const api = {
  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data.map(normalizeProduct);
  },

  async getProduct(id: number): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    const data = await response.json();
    return normalizeProduct(data);
  },

  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    const data = await response.json();
    return data.map(normalizeCategory);
  },

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data.map(normalizeProduct);
  },

  async register(data: RegisterData): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },

  async login(data: LoginData): Promise<{ token: string; user: User }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Login failed');
    const result = await response.json();
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    return result;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
