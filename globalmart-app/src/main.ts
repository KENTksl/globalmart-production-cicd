import './style.css';
import Navigo from 'navigo';
import { renderNavbar } from './components/Navbar';
import { renderHomePage } from './pages/HomePage';
import { renderCategoriesPage } from './pages/CategoriesPage';
import { renderProductsPage } from './pages/ProductsPage';
import { renderProductDetailPage } from './pages/ProductDetailPage';
import { renderLoginPage } from './pages/LoginPage';
import { renderRegisterPage } from './pages/RegisterPage';

const app = document.querySelector<HTMLDivElement>('#app')!;
const router = new Navigo('/');

// Function to parse query params
function parseQueryParams(queryString: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!queryString) return params;
  const pairs = queryString.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
    }
  }
  return params;
}

// Render navbar
const navbarContainer = document.createElement('div');
document.body.insertBefore(navbarContainer, app);

router.on('/', () => {
  renderNavbar(navbarContainer);
  renderHomePage(app);
});

router.on('/categories', () => {
  renderNavbar(navbarContainer);
  renderCategoriesPage(app);
});

router.on('/products', (match) => {
  renderNavbar(navbarContainer);
  const queryParams = parseQueryParams(match?.queryString || '');
  renderProductsPage(app, queryParams);
});

router.on('/products/:id', (match) => {
  renderNavbar(navbarContainer);
  const productId = match?.data?.id || '1';
  renderProductDetailPage(app, productId);
});

router.on('/login', () => {
  renderNavbar(navbarContainer);
  renderLoginPage(app);
});

router.on('/register', () => {
  renderNavbar(navbarContainer);
  renderRegisterPage(app);
});

// Handle navigation clicks
document.body.addEventListener('click', (e) => {
  const link = (e.target as HTMLElement).closest('a');
  if (!link) return;
  const shouldHandle =
    link.hasAttribute('data-nav') ||
    link.classList.contains('btn') ||
    link.classList.contains('logo-link') ||
    link.classList.contains('product-card') ||
    link.classList.contains('category-card');
  if (!shouldHandle) return;
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

router.resolve();
