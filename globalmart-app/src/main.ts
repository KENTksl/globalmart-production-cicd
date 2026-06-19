import './style.css';
import Navigo from 'navigo';
import { api } from './utils/api';
import { renderUserNavbar } from './user/components/Navbar';
import { renderHomePage } from './user/pages/HomePage';
import { renderCategoriesPage } from './user/pages/CategoriesPage';
import { renderProductsPage } from './user/pages/ProductsPage';
import { renderProductDetailPage } from './user/pages/ProductDetailPage';
import { renderLoginPage } from './user/pages/LoginPage';
import { renderRegisterPage } from './user/pages/RegisterPage';
import { renderCartPage } from './user/pages/CartPage';
import { renderCheckoutPage } from './user/pages/CheckoutPage';
import { renderAdminDashboardPage } from './admin/pages/AdminDashboardPage';
import { renderAdminProductsPage } from './admin/pages/AdminProductsPage';
import { renderAdminCategoriesPage } from './admin/pages/AdminCategoriesPage';

const app = document.querySelector<HTMLDivElement>('#app')!;
const router = new Navigo('/');

function parseQueryParams(queryString: string): Record<string, string> {
  const searchParams = new URLSearchParams(queryString.startsWith('?') ? queryString : `?${queryString}`);
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

const navbarContainer = document.createElement('div');
document.body.insertBefore(navbarContainer, app);

function renderChrome(isAdmin = false) {
  if (isAdmin) {
    navbarContainer.innerHTML = '';
    app.style.paddingTop = '0';
    return;
  }

  app.style.paddingTop = '';
  renderUserNavbar(navbarContainer);
}

function requireAuth() {
  if (api.isAuthenticated()) return true;
  router.navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  return false;
}

router.on('/', () => {
  renderChrome();
  renderHomePage(app);
});

router.on('/categories', () => {
  renderChrome();
  renderCategoriesPage(app);
});

router.on('/products', (match) => {
  renderChrome();
  const queryParams = parseQueryParams(match?.queryString || '');
  renderProductsPage(app, queryParams);
});

router.on('/products/:id', (match) => {
  renderChrome();
  const productId = match?.data?.id || '1';
  renderProductDetailPage(app, productId);
});

router.on('/login', () => {
  renderChrome();
  renderLoginPage(app);
});

router.on('/register', () => {
  renderChrome();
  renderRegisterPage(app);
});

router.on('/cart', () => {
  renderChrome();
  renderCartPage(app);
});

router.on('/checkout', () => {
  renderChrome();
  renderCheckoutPage(app);
});

router.on('/logout', () => {
  api.logout();
  renderChrome();
  router.navigate('/');
});

router.on('/admin', async () => {
  if (!requireAuth()) return;
  renderChrome(true);
  renderAdminDashboardPage(app);
});

router.on('/admin/products', async (match) => {
  if (!requireAuth()) return;
  renderChrome(true);
  const queryParams = parseQueryParams(match?.queryString || '');
  const editingId = queryParams.edit ? Number(queryParams.edit) : undefined;
  renderAdminProductsPage(app, editingId);
});

router.on('/admin/categories', async (match) => {
  if (!requireAuth()) return;
  renderChrome(true);
  const queryParams = parseQueryParams(match?.queryString || '');
  const editingId = queryParams.edit ? Number(queryParams.edit) : undefined;
  renderAdminCategoriesPage(app, editingId);
});

document.body.addEventListener('click', (e) => {
  const link = (e.target as HTMLElement).closest('a');
  if (!link) return;
  if (!link.hasAttribute('data-nav')) return;
  const href = link.getAttribute('href');
  if (!href) return;
  e.preventDefault();
  if (href.startsWith('#')) {
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return;
  }
  if (href.includes('#')) {
    const [path, hash] = href.split('#');
    const targetSelector = hash ? `#${hash}` : '';
    router.navigate(path || '/');
    if (targetSelector) {
      requestAnimationFrame(() => {
        const target = document.querySelector(targetSelector);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
    return;
  }
  router.navigate(href);
});

window.addEventListener('cart:updated', () => {
  if (!window.location.pathname.startsWith('/admin')) {
    renderChrome();
  }
});

router.resolve();
