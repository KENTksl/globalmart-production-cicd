import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function renderCategoriesPage(container: HTMLElement) {
  container.innerHTML = `
    <section class="section home-section">
      <div class="container container--narrow">
        <span class="eyebrow">Danh mục sản phẩm</span>
        <h1 class="section-title" style="margin-top: 1rem;">Khám phá danh mục phù hợp với bạn</h1>
        <p class="section-subtitle">
          Tổng hợp các nhóm ngành hàng nổi bật để người dùng truy cập nhanh, dễ tìm và dễ mua hơn.
        </p>
      </div>
    </section>

    <section class="section home-section home-section--soft">
      <div class="container">
        <div class="category-grid">
          <div class="glass-card category-card"><span>💻</span><h4>Điện tử</h4></div>
          <div class="glass-card category-card"><span>🧥</span><h4>Thời trang</h4></div>
          <div class="glass-card category-card"><span>🏠</span><h4>Nhà cửa</h4></div>
          <div class="glass-card category-card"><span>💄</span><h4>Làm đẹp</h4></div>
          <div class="glass-card category-card"><span>⚽</span><h4>Thể thao</h4></div>
          <div class="glass-card category-card"><span>📚</span><h4>Sách</h4></div>
          <div class="glass-card category-card"><span>🎮</span><h4>Gaming</h4></div>
          <div class="glass-card category-card"><span>⌚</span><h4>Phụ kiện</h4></div>
        </div>
      </div>
    </section>

    <section class="section home-section">
      <div class="container">
        <div class="grid-features-home">
          <article class="glass-card home-feature-card">
            <div class="home-icon">⚡</div>
            <div>
              <h3>Tìm nhanh hơn</h3>
              <p>Chia nhóm sản phẩm rõ ràng để người dùng không mất thời gian tìm kiếm.</p>
            </div>
          </article>
          <article class="glass-card home-feature-card">
            <div class="home-icon">🧭</div>
            <div>
              <h3>Điều hướng dễ hơn</h3>
              <p>Danh mục nổi bật giúp khách hàng đi đúng nhóm nhu cầu ngay từ đầu.</p>
            </div>
          </article>
          <article class="glass-card home-feature-card">
            <div class="home-icon">✨</div>
            <div>
              <h3>Trình bày đẹp hơn</h3>
              <p>Giao diện sáng, gọn và đồng bộ với phong cách của toàn bộ website.</p>
            </div>
          </article>
          <article class="glass-card home-feature-card">
            <div class="home-icon">🛒</div>
            <div>
              <h3>Dễ chuyển đổi hơn</h3>
              <p>Người dùng tiếp cận sản phẩm đúng nhu cầu nhanh hơn, tăng khả năng mua hàng.</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <footer id="contact">
      <p>© 2026 Global Mart. All rights reserved.</p>
      <p>Hotline: 1900-1234 | Email: support@globalmart.com</p>
    </footer>
  `;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  gsap.from('.category-card, .home-feature-card', {
    autoAlpha: 0,
    y: 16,
    duration: 0.7,
    stagger: 0.06,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.category-grid',
      start: 'top 82%',
      toggleActions: 'play none none reverse'
    }
  });
}
