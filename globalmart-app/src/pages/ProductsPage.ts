import { api, Product } from '../utils/api';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export async function renderProductsPage(container: HTMLElement) {
  container.innerHTML = `
    <section class="section">
      <h2 class="section-title">Sản phẩm nổi bật</h2>
      <div id="products-container" class="products">
        <p style="text-align: center; width: 100%;">Đang tải sản phẩm...</p>
      </div>
    </section>

    <footer id="contact">
      <p>© 2026 Global Mart. All rights reserved.</p>
      <p>Hotline: 1900-1234 | Email: support@globalmart.com</p>
    </footer>
  `;

  const productsContainer = document.getElementById('products-container')!;
  
  try {
    const products = await api.getProducts();
    renderProducts(productsContainer, products);
  } catch (error) {
    productsContainer.innerHTML = `
      <div class="alert alert-error">
        Không thể tải sản phẩm. Vui lòng thử lại sau.
      </div>
    `;
  }
}

function renderProducts(container: HTMLElement, products: Product[]) {
  container.innerHTML = products.map(product => renderProductCard(product)).join('');
  animateProductCards();
}

function renderProductCard(product: Product): string {
  return `
    <a href="/products/${product.id}" class="product-card" style="text-decoration: none; color: inherit;">
      <div class="product-image">📦</div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">${product.price.toLocaleString('vi-VN')}đ</p>
        <p class="product-desc">${product.description}</p>
      </div>
    </a>
  `;
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
      toggleActions: 'play none none reverse'
    }
  });
}
