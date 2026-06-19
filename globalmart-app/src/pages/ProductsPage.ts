import { api, Product } from '../utils/api';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export async function renderProductsPage(container: HTMLElement, queryParams: Record<string, string> = {}) {
  container.innerHTML = `
    <section class="section">
      <h2 class="section-title">${queryParams.category ? 'Sản phẩm theo danh mục' : 'Sản phẩm nổi bật'}</h2>
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
    let products: Product[];
    if (queryParams.category) {
      products = await api.getProductsByCategory(queryParams.category);
    } else {
      products = await api.getProducts();
    }
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
  if (products.length === 0) {
    container.innerHTML = `
      <p style="text-align: center; width: 100%;">Chưa có sản phẩm nào.</p>
    `;
    return;
  }
  container.innerHTML = products.map(product => renderProductCard(product)).join('');
  animateProductCards();
}

function renderProductCard(product: Product): string {
  const productImage = product.image 
    ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">` 
    : '<div style="width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; font-size: 48px;">📦</div>';

  return `
    <a href="/products/${product.id}" class="product-card" style="text-decoration: none; color: inherit;">
      <div class="product-image">${productImage}</div>
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
