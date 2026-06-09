import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function renderHomePage(container: HTMLElement) {
  container.innerHTML = `
    <section class="hero hero-template">
      <div class="container hero-template__layout">
        <div class="hero-content hero-template__content">
          <span class="eyebrow">Global marketplace cao cấp</span>
          <h1>Mua sắm quốc tế dễ dàng, đẹp mắt và đáng tin cậy hơn</h1>
          <p>
            Global Mart mang đến trải nghiệm mua sắm thân thiện, giao diện rõ ràng,
            vận chuyển thông minh và danh mục sản phẩm được trình bày hiện đại.
          </p>
          <div class="hero-buttons hero-template__actions">
            <a href="/products" class="btn btn-primary" data-nav>Khám phá sản phẩm</a>
            <a href="#home-features" class="btn btn-ghost">Xem lợi thế</a>
          </div>
          <div class="hero-template__stats">
            <div class="hero-stat glass-card">
              <strong>190+</strong>
              <span>Quốc gia giao hàng</span>
            </div>
            <div class="hero-stat glass-card">
              <strong>24/7</strong>
              <span>Hỗ trợ khách hàng</span>
            </div>
            <div class="hero-stat glass-card">
              <strong>10K+</strong>
              <span>Khách hàng tin dùng</span>
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

    <section id="home-features" class="section home-section">
      <div class="container">
        <div class="grid-features-home">
          <article class="glass-card home-feature-card">
            <div class="home-icon">🌍</div>
            <div>
              <h3>Worldwide Shipping</h3>
              <p>Vận chuyển nhanh tới hơn 190+ quốc gia với theo dõi đơn hàng minh bạch.</p>
            </div>
          </article>
          <article class="glass-card home-feature-card">
            <div class="home-icon">🔐</div>
            <div>
              <h3>Thanh toán an toàn</h3>
              <p>Nhiều lớp bảo mật cho giao dịch và tài khoản người dùng.</p>
            </div>
          </article>
          <article class="glass-card home-feature-card">
            <div class="home-icon">🎧</div>
            <div>
              <h3>Hỗ trợ 24/7</h3>
              <p>Đội ngũ tư vấn liên tục hỗ trợ trước và sau khi đặt hàng.</p>
            </div>
          </article>
          <article class="glass-card home-feature-card">
            <div class="home-icon">🏷️</div>
            <div>
              <h3>Deal tốt mỗi ngày</h3>
              <p>Chương trình ưu đãi theo mùa và giá tốt cho nhiều nhóm hàng.</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section id="home-categories" class="section home-section home-section--soft">
      <div class="container">
        <h2 class="section-title">Danh mục nổi bật</h2>
        <div class="category-grid">
          <div class="glass-card category-card"><span>💻</span><h4>Electronics</h4></div>
          <div class="glass-card category-card"><span>🧥</span><h4>Fashion</h4></div>
          <div class="glass-card category-card"><span>🏠</span><h4>Home Living</h4></div>
          <div class="glass-card category-card"><span>💄</span><h4>Beauty</h4></div>
          <div class="glass-card category-card"><span>⚽</span><h4>Sports</h4></div>
          <div class="glass-card category-card"><span>📚</span><h4>Books</h4></div>
          <div class="glass-card category-card"><span>🎮</span><h4>Gaming</h4></div>
          <div class="glass-card category-card"><span>⌚</span><h4>Accessories</h4></div>
        </div>
      </div>
    </section>

    <section class="section home-section">
      <div class="container">
        <div class="section-head">
          <div>
            <h2 class="section-title section-title--left">Lựa chọn nổi bật</h2>
            <p class="section-subtitle">Bộ sưu tập gợi ý mang phong cách cao cấp từ mẫu template.</p>
          </div>
          <a href="/products" class="link" data-nav>Xem tất cả</a>
        </div>
        <div class="home-product-grid">
          <article class="glass-card home-product-card">
            <div class="home-product-media">🎧</div>
            <div class="home-product-body">
              <span>Electronics</span>
              <h4>SonicFlow Ultra 500</h4>
              <p>Tai nghe không dây cao cấp, chống ồn và thiết kế hiện đại.</p>
              <strong>7.490.000đ</strong>
            </div>
          </article>
          <article class="glass-card home-product-card">
            <div class="home-product-media">⌚</div>
            <div class="home-product-body">
              <span>Accessories</span>
              <h4>Heritage Timepiece</h4>
              <p>Đồng hồ tối giản sang trọng cho phong cách sống tinh tế.</p>
              <strong>4.990.000đ</strong>
            </div>
          </article>
          <article class="glass-card home-product-card">
            <div class="home-product-media">👟</div>
            <div class="home-product-body">
              <span>Sports</span>
              <h4>Apex Velocity Runner</h4>
              <p>Giày chạy bộ nhẹ, êm và giữ được độ ổn định cao.</p>
              <strong>2.890.000đ</strong>
            </div>
          </article>
          <article class="glass-card home-product-card">
            <div class="home-product-media">📷</div>
            <div class="home-product-body">
              <span>Photography</span>
              <h4>Lumix X-Series Pro</h4>
              <p>Máy ảnh dành cho người yêu thiết kế và chất lượng hình ảnh.</p>
              <strong>18.490.000đ</strong>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="section home-section">
      <div class="container">
        <div class="promo-banner">
          <div class="promo-banner__content">
            <span class="eyebrow eyebrow--light">Exclusive offer</span>
            <h2>Flash Sale - giảm đến 70%</h2>
            <p>Tập trung vào các sản phẩm được quan tâm nhiều, trình bày đẹp và dễ ra quyết định mua hàng.</p>
            <a href="/products" class="btn btn-primary" data-nav>Mua ngay</a>
          </div>
          <div class="promo-countdown glass-card">
            <p>Kết thúc sau</p>
            <div class="promo-time">
              <div><strong>08</strong><span>Giờ</span></div>
              <div><strong>43</strong><span>Phút</span></div>
              <div><strong>43</strong><span>Giây</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section home-section home-section--soft">
      <div class="container">
        <h2 class="section-title">Lợi thế của Global Mart</h2>
        <div class="advantage-grid">
          <div class="advantage-item"><span>✅</span><h5>Hàng chính hãng</h5></div>
          <div class="advantage-item"><span>🏬</span><h5>Nhà bán đã xác thực</h5></div>
          <div class="advantage-item"><span>🚚</span><h5>Giao nhanh</h5></div>
          <div class="advantage-item"><span>🛡️</span><h5>Bảo vệ người mua</h5></div>
          <div class="advantage-item"><span>↩️</span><h5>Đổi trả dễ dàng</h5></div>
        </div>
      </div>
    </section>

    <section class="section home-section">
      <div class="container">
        <h2 class="section-title">Khách hàng nói gì</h2>
        <div class="testimonial-grid">
          <article class="glass-card testimonial-card">
            <div class="testimonial-stars">★★★★★</div>
            <p>"Đặt hàng quốc tế nhanh và giao diện rất dễ tin. Cảm giác như một sàn thương mại điện tử cao cấp."</p>
            <strong>Sarah Jenkins</strong>
            <span>London, UK</span>
          </article>
          <article class="glass-card testimonial-card testimonial-card--featured">
            <div class="testimonial-stars">★★★★★</div>
            <p>"Bố cục trang chủ sáng, dễ xem deal và danh mục. Trải nghiệm mua hàng rất mạch lạc."</p>
            <strong>Marcello Rossi</strong>
            <span>Milan, Italy</span>
          </article>
          <article class="glass-card testimonial-card">
            <div class="testimonial-stars">★★★★★</div>
            <p>"Tôi thích cách hiển thị sản phẩm và ưu đãi. Nhìn chuyên nghiệp hơn rất nhiều."</p>
            <strong>Aiko Tanaka</strong>
            <span>Tokyo, Japan</span>
          </article>
        </div>
      </div>
    </section>

    <section class="section home-section">
      <div class="container container--narrow">
        <div class="glass-card newsletter-card">
          <h2 class="section-title">Đăng ký nhận ưu đãi mới</h2>
          <p class="section-subtitle">
            Nhận thông báo về deal mới, bộ sưu tập mới và hướng dẫn mua sắm toàn cầu.
          </p>
          <div class="newsletter-form">
            <input type="email" class="form-input" placeholder="Nhập email của bạn">
            <button class="btn btn-primary">Đăng ký</button>
          </div>
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

  gsap.from('.hero-visual__card', {
    autoAlpha: 0,
    x: 18,
    y: 8,
    scale: 0.98,
    duration: 0.9,
    ease: 'power2.out',
    delay: 0.1
  });

  gsap.from('.hero-template__content > *', {
    autoAlpha: 0,
    y: 14,
    duration: 0.8,
    stagger: 0.08,
    ease: 'power2.out',
    delay: 0.25
  });

  gsap.from('.home-feature-card, .category-card, .home-product-card, .testimonial-card, .newsletter-card', {
    autoAlpha: 0,
    y: 16,
    scale: 0.985,
    duration: 0.7,
    stagger: 0.06,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.home-section',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    }
  });

  gsap.from('.advantage-item', {
    autoAlpha: 0,
    y: 12,
    duration: 0.55,
    stagger: 0.05,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.advantage-grid',
      start: 'top 82%',
      toggleActions: 'play none none reverse'
    }
  });
}
