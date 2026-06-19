import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { api, Category } from '../../utils/api';

gsap.registerPlugin(ScrollTrigger);

export async function renderCategoriesPage(container: HTMLElement) {
  container.innerHTML = `
    <section class="section home-section">
      <div class="container container--narrow">
        <span class="eyebrow">Danh mục sản phẩm</span>
        <h1 class="section-title" style="margin-top: 1rem;">Danh mục sản phẩm</h1>
        <p class="section-subtitle">
          Chọn danh mục để xem những sản phẩm phù hợp với nhu cầu của bạn.
        </p>
      </div>
    </section>

    <section class="section home-section home-section--soft">
      <div class="container">
        <div id="categories-container" class="category-grid">
          <p style="text-align: center; width: 100%;">Đang tải danh mục...</p>
        </div>
      </div>
    </section>

    <footer id="contact">
      <p>© 2026 Global Mart. All rights reserved.</p>
      <p>Hotline: 1900-1234 | Email: support@globalmart.com</p>
    </footer>
  `;

  const categoriesContainer = document.getElementById('categories-container')!;

  try {
    const categories = await api.getCategories();
    renderCategories(categoriesContainer, categories);
  } catch {
    categoriesContainer.innerHTML = `
      <div class="alert alert-error">
        Không thể tải danh mục. Vui lòng thử lại sau.
      </div>
    `;
  }
}

function renderCategories(container: HTMLElement, categories: Category[]) {
  if (categories.length === 0) {
    container.innerHTML = `
      <div class="alert">
        Chưa có danh mục nào.
      </div>
    `;
    return;
  }

  container.innerHTML = categories
    .map(
      (category) => `
        <a href="/products?category=${encodeURIComponent(String(category.id))}" class="glass-card category-card" data-nav style="text-decoration: none; color: inherit;">
          <span>📦</span>
          <h4>${category.name}</h4>
          <p class="category-card__desc">${category.description || 'Danh mục đang được cập nhật mô tả.'}</p>
          <small class="category-card__meta">${category.productCount ?? 0} sản phẩm</small>
        </a>
      `
    )
    .join('');

  animateCategoryCards();
}

function animateCategoryCards() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  gsap.from('.category-card', {
    autoAlpha: 0,
    y: 16,
    duration: 0.7,
    stagger: 0.06,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.category-grid',
      start: 'top 82%',
      toggleActions: 'play none none reverse',
    },
  });
}
