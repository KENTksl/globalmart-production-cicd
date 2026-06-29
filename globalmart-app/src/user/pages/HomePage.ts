import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { api, Category, Product } from '../../utils/api';
import { addToCart } from '../../utils/cart';
import { formatCurrency } from '../../utils/format';

gsap.registerPlugin(ScrollTrigger);

export async function renderHomePage(container: HTMLElement) {
  container.innerHTML = `
    <section class="hero hero-template">
      <div class="container hero-template__layout">
        <div class="hero-content hero-template__content">
          <span class="eyebrow">Sàn thương mại toàn cầu 112</span>
          <h1>Mua sắm hiện đại cùng Global Mart</h1>
          <p>
            Khám phá danh mục, sản phẩm và giỏ hàng với giao diện hiện đại,
            rõ ràng và thuận tiện cho mọi nhu cầu mua sắm.
          </p>
          <div class="hero-buttons hero-template__actions">
            <a href="/products" class="btn btn-primary" data-nav>Khám phá sản phẩm</a>
            <a href="/categories" class="btn btn-ghost" data-nav>Xem danh mục</a>
          </div>
          <div id="home-stats" class="hero-template__stats">
            <div class="hero-stat glass-card">
              <strong>...</strong>
              <span>Sản phẩm</span>
            </div>
            <div class="hero-stat glass-card">
              <strong>...</strong>
              <span>Danh mục</span>
            </div>
            <div class="hero-stat glass-card">
              <strong>100%</strong>
              <span>Đồng bộ</span>
            </div>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-visual__glow hero-visual__glow--blue"></div>
          <div class="hero-visual__glow hero-visual__glow--orange"></div>
          <div class="hero-visual__card glass-card">
            <img src="/banner.png" alt="Global Mart Banner" class="hero-banner">
          </div>
        </div>
      </div>
    </section>

    <section class="section home-section">
      <div class="container">
        <div class="section-head">
          <div>
            <h2 class="section-title section-title--left">Danh mục</h2>
            <p class="section-subtitle">Khám phá các nhóm hàng nổi bật của cửa hàng.</p>
          </div>
          <a href="/categories" class="link" data-nav>Xem tất cả</a>
        </div>
        <div id="home-categories" class="category-grid">
          <p style="text-align: center; width: 100%;">Đang tải danh mục...</p>
        </div>
      </div>
    </section>

    <section class="section home-section home-section--soft">
      <div class="container">
        <div class="section-head">
          <div>
            <h2 class="section-title section-title--left">Sản phẩm mới nhất</h2>
            <p class="section-subtitle">Những lựa chọn nổi bật dành cho bạn.</p>
          </div>
          <a href="/products" class="link" data-nav>Xem tất cả</a>
        </div>
        <div id="home-products" class="products">
          <p style="text-align: center; width: 100%;">Đang tải sản phẩm...</p>
        </div>
      </div>
    </section>

    <footer id="contact">
      <p>© 2026 Global Mart. All rights reserved.</p>
      <p>Hotline: 1900-1234 | Email: support@globalmart.com</p>
    </footer>
  `;

  const categoriesContainer = document.getElementById('home-categories')!;
  const productsContainer = document.getElementById('home-products')!;
  const statsContainer = document.getElementById('home-stats')!;

  try {
    const [categories, products] = await Promise.all([api.getCategories(), api.getProducts()]);
    renderStats(statsContainer, categories, products);
    renderCategories(categoriesContainer, categories);
    renderProducts(productsContainer, products.slice(0, 4));
    bindAddToCart(container);
    animateHome();
  } catch {
    categoriesContainer.innerHTML = `
      <div class="alert alert-error">Không thể tải dữ liệu từ hệ thống.</div>
    `;
    productsContainer.innerHTML = '';
  }
}

function renderStats(container: HTMLElement, categories: Category[], products: Product[]) {
  container.innerHTML = `
    <div class="hero-stat glass-card">
      <strong>${products.length}</strong>
      <span>Sản phẩm</span>
    </div>
    <div class="hero-stat glass-card">
      <strong>${categories.length}</strong>
      <span>Danh mục</span>
    </div>
    <div class="hero-stat glass-card">
      <strong>${products.filter((product) => product.image).length}</strong>
      <span>Sản phẩm có ảnh</span>
    </div>
  `;
}

function renderCategories(container: HTMLElement, categories: Category[]) {
  if (categories.length === 0) {
    container.innerHTML = '<div class="alert">Chưa có danh mục nào.</div>';
    return;
  }

  container.innerHTML = categories
    .slice(0, 6)
    .map(
      (category) => `
        <a href="/products?category=${category.id}" class="glass-card category-card" data-nav style="text-decoration: none; color: inherit;">
          <span>📦</span>
          <h4>${category.name}</h4>
          <p class="category-card__desc">${category.description || 'Danh mục đang được cập nhật mô tả.'}</p>
        </a>
      `
    )
    .join('');
}

function renderProducts(container: HTMLElement, products: Product[]) {
  if (products.length === 0) {
    container.innerHTML = '<div class="alert">Chưa có sản phẩm nào.</div>';
    return;
  }

  container.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <a href="/products/${product.id}" data-nav style="text-decoration: none; color: inherit;">
            <div class="product-image">
              ${product.image
                ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 220px; object-fit: cover; border-radius: 8px;">`
                : '<div style="width: 100%; height: 220px; display: flex; align-items: center; justify-content: center; font-size: 48px;">📦</div>'
              }
            </div>
            <div class="product-info">
              <p class="product-meta">${product.categoryName || 'Sản phẩm'}</p>
              <h3 class="product-name">${product.name}</h3>
              <p class="product-price">${formatCurrency(product.price)}</p>
              <p class="product-desc">${product.description || 'Chưa có mô tả cho sản phẩm này.'}</p>
            </div>
          </a>
          <button class="btn btn-primary btn-block add-cart-btn" data-product-id="${product.id}">Thêm vào giỏ</button>
        </article>
      `
    )
    .join('');
}

function bindAddToCart(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>('.add-cart-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = Number(button.dataset.productId);
      addToCart(productId);
      button.textContent = 'Đã thêm vào giỏ';
      setTimeout(() => {
        button.textContent = 'Thêm vào giỏ';
      }, 1200);
    });
  });
}

function animateHome() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  gsap.from('.hero-visual__card', {
    autoAlpha: 0,
    x: 18,
    y: 8,
    scale: 0.98,
    duration: 0.9,
    ease: 'power2.out',
    delay: 0.1,
  });

  gsap.from('.hero-template__content > *', {
    autoAlpha: 0,
    y: 14,
    duration: 0.8,
    stagger: 0.08,
    ease: 'power2.out',
    delay: 0.25,
  });

  gsap.from('.category-card, .product-card', {
    autoAlpha: 0,
    y: 16,
    scale: 0.985,
    duration: 0.7,
    stagger: 0.06,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.home-section',
      start: 'top 80%',
      toggleActions: 'play none none reverse',
    },
  });
}
