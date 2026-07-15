import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { api, Category, Product } from '../../utils/api';
import { addToCart } from '../../utils/cart';
import { formatCurrency } from '../../utils/format';

gsap.registerPlugin(ScrollTrigger);

export async function renderProductsPage(container: HTMLElement, queryParams: Record<string, string> = {}) {
  container.innerHTML = `
    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <h2 class="section-title section-title--left">${queryParams.category ? 'Sản phẩm theo danh mục' : 'Tất cả sản phẩm'}</h2>
            <p class="section-subtitle">Khám phá các sản phẩm phù hợp với nhu cầu của bạn.</p>
          </div>
          <div id="products-filter" class="chip-group"></div>
        </div>
        <div class="search-container" style="margin-bottom: 24px;">
          <div class="search-box" style="position: relative; max-width: 500px; margin-bottom: 16px;">
            <input 
              type="text" 
              id="search-input" 
              placeholder="Tìm kiếm sản phẩm..." 
              style="width: 100%; padding: 12px 48px 12px 16px; border: 2px solid #e0e0e0; border-radius: 12px; font-size: 16px; transition: border-color 0.3s; outline: none;"
            >
            <span style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); font-size: 20px;">🔍</span>
          </div>
          <div id="price-filter" class="chip-group"></div>
        </div>
        <div id="products-container" class="products">
          <p style="text-align: center; width: 100%;">Đang tải sản phẩm...</p>
        </div>
      </div>
    </section>

    <footer id="contact">
      <p>© 2026 Global Mart. All rights reserved.</p>
      <p>Hotline: 1900-1234 | Email: support@globalmart.com</p>
    </footer>
  `;

  const productsContainer = document.getElementById('products-container')!;
  const filterContainer = document.getElementById('products-filter')!;
  const priceFilterContainer = document.getElementById('price-filter')!;
  const searchInput = document.getElementById('search-input') as HTMLInputElement;

  let state = {
    search: '',
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined
  };

  const updateProducts = async () => {
    try {
      console.log('updateProducts called with state:', state);
      const products = queryParams.category 
        ? await api.getProductsByCategory(queryParams.category, state.search || undefined, state.minPrice, state.maxPrice) 
        : await api.getProducts(state.search || undefined, state.minPrice, state.maxPrice);
      console.log('Products received:', products);
      renderProducts(productsContainer, products);
      bindAddToCart(container);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  try {
    const [categories, products] = await Promise.all([
      api.getCategories(),
      queryParams.category ? api.getProductsByCategory(queryParams.category) : api.getProducts(),
    ]);

    renderCategoryFilters(filterContainer, categories, queryParams.category);
    renderPriceFilters(priceFilterContainer, state, updateProducts);
    renderProducts(productsContainer, products);
    bindAddToCart(container);
    bindSearch(searchInput, updateProducts, state);
  } catch {
    productsContainer.innerHTML = `
      <div class="alert alert-error">
        Không thể tải sản phẩm. Vui lòng thử lại sau.
      </div>
    `;
  }
}

function bindSearch(input: HTMLInputElement, updateProducts: () => Promise<void>, state: any) {
  const searchHandler = debounce(async (searchTerm: string) => {
    state.search = searchTerm;
    await updateProducts();
  }, 300);

  input.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    searchHandler(target.value);
  });
}

function renderPriceFilters(container: HTMLElement, state: any, updateProducts: () => Promise<void>) {
  const priceRanges = [
    { label: 'Dưới 10tr', min: undefined, max: 10000000 },
    { label: '10tr - 15tr', min: 10000000, max: 15000000 },
    { label: '15tr - 20tr', min: 15000000, max: 20000000 },
    { label: 'Trên 20tr', min: 20000000, max: undefined },
    { label: 'Tất cả', min: undefined, max: undefined }
  ];

  const render = () => {
    container.innerHTML = priceRanges.map((range) => `
      <button class="chip ${(state.minPrice === range.min && state.maxPrice === range.max) ? 'chip--active' : ''}" data-min="${range.min ?? ''}" data-max="${range.max ?? ''}">
        ${range.label}
      </button>
    `).join('');

    container.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', async () => {
        state.minPrice = (button.dataset.min && button.dataset.min !== '') ? Number(button.dataset.min) : undefined;
        state.maxPrice = (button.dataset.max && button.dataset.max !== '') ? Number(button.dataset.max) : undefined;
        render();
        await updateProducts();
      });
    });
  };

  render();
}

function debounce(func: (...args: any[]) => any, wait: number) {
  let timeoutId: number;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func.apply(null, args), wait);
  };
}

function renderCategoryFilters(container: HTMLElement, categories: Category[], activeCategory?: string) {
  container.innerHTML = `
    <a href="/products" class="chip ${!activeCategory ? 'chip--active' : ''}" data-nav>Tất cả</a>
    ${categories
      .map(
        (category) => `
          <a
            href="/products?category=${category.id}"
            class="chip ${String(category.id) === activeCategory ? 'chip--active' : ''}"
            data-nav
          >
            ${category.name}
          </a>
        `
      )
      .join('')}
  `;
}

function renderProducts(container: HTMLElement, products: Product[]) {
  if (products.length === 0) {
    container.innerHTML = `
      <div class="alert">Chưa có sản phẩm nào.</div>
    `;
    return;
  }

  container.innerHTML = products.map((product) => renderProductCard(product)).join('');
  animateProductCards();
}

function renderProductCard(product: Product): string {
  const productImage = product.image
    ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 220px; object-fit: cover; border-radius: 8px;">`
    : '<div style="width: 100%; height: 220px; display: flex; align-items: center; justify-content: center; font-size: 48px;">📦</div>';

  return `
    <article class="product-card">
      <a href="/products/${product.id}" data-nav style="text-decoration: none; color: inherit;">
        <div class="product-image">${productImage}</div>
        <div class="product-info">
          <p class="product-meta">${product.categoryName || 'Sản phẩm'}</p>
          <h3 class="product-name">${product.name}</h3>
          <p class="product-price">${formatCurrency(product.price)}</p>
          <p class="product-desc">${product.description || 'Chưa có mô tả cho sản phẩm này.'}</p>
        </div>
      </a>
      <div class="product-actions">
        <a href="/products/${product.id}" class="btn btn-ghost" data-nav>Xem chi tiết</a>
        <button class="btn btn-primary add-cart-btn" data-product-id="${product.id}">Thêm vào giỏ</button>
      </div>
    </article>
  `;
}

function bindAddToCart(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>('.add-cart-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = Number(button.dataset.productId);
      addToCart(productId);
      button.textContent = 'Đã thêm';
      setTimeout(() => {
        button.textContent = 'Thêm vào giỏ';
      }, 1200);
    });
  });
}

function animateProductCards() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  gsap.from('.product-card', {
    autoAlpha: 0,
    y: 16,
    duration: 0.7,
    stagger: 0.07,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.products',
      start: 'top 80%',
      toggleActions: 'play none none reverse',
    },
  });
}
