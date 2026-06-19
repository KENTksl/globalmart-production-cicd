import { gsap } from 'gsap';
import { api } from '../../utils/api';

export function renderRegisterPage(container: HTMLElement) {
  container.innerHTML = `
    <section class="section auth">
      <div class="auth-card">
        <h2 class="auth-title">Đăng ký</h2>
        <p class="section-subtitle" style="margin-bottom: 1.25rem;">
          Tạo tài khoản để truy cập dashboard quản trị và sử dụng hệ thống thuận tiện hơn.
        </p>
        <form id="register-form">
          <div class="form-group">
            <label class="form-label">Tên đăng nhập</label>
            <input class="form-input" type="text" name="username" required autocomplete="username">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" name="email" required autocomplete="email">
          </div>
          <div class="form-group">
            <label class="form-label">Mật khẩu</label>
            <input class="form-input" type="password" name="password" required autocomplete="new-password">
          </div>
          <button type="submit" class="btn btn-primary btn-block">Đăng ký</button>
        </form>
        <p class="auth-footer">
          Đã có tài khoản? <a href="/login" class="link" data-nav>Đăng nhập ngay</a>
        </p>
      </div>
    </section>
  `;

  const form = document.getElementById('register-form') as HTMLFormElement;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const username = String(formData.get('username') ?? '');
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    try {
      await api.register({ username, email, password });
      window.location.href = '/admin';
    } catch {
      alert('Đăng ký thất bại! Vui lòng thử lại.');
    }
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  gsap.from(container.querySelector('.auth-card')!, {
    autoAlpha: 0,
    y: 16,
    duration: 0.7,
    ease: 'power2.out',
  });
}
