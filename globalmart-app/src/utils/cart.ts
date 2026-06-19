const CART_STORAGE_KEY = 'globalmart-cart';

export interface CartItem {
  productId: number;
  quantity: number;
}

function emitCartUpdated() {
  window.dispatchEvent(new CustomEvent('cart:updated'));
}

export function getCart(): CartItem[] {
  const raw = localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return parsed.filter((item) => item.productId > 0 && item.quantity > 0);
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  emitCartUpdated();
}

export function addToCart(productId: number, quantity = 1) {
  const cart = getCart();
  const existingItem = cart.find((item) => item.productId === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }

  saveCart(cart);
}

export function updateCartItem(productId: number, quantity: number) {
  const cart = getCart()
    .map((item) => (item.productId === productId ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0);
  saveCart(cart);
}

export function removeFromCart(productId: number) {
  const cart = getCart().filter((item) => item.productId !== productId);
  saveCart(cart);
}

export function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
  emitCartUpdated();
}

export function getCartCount() {
  return getCart().reduce((total, item) => total + item.quantity, 0);
}
