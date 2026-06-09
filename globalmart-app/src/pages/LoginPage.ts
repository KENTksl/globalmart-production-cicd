import { api } from '../utils/api';
import { gsap } from 'gsap';

export function renderLoginPage(container: HTMLElement) {
  container.innerHTML = `
    <section class="section auth">
      <div class="auth-card">
        <h2 class="auth-title">Đăng nhập</h2>
        <form id="login-form">
          <div class="form-group">
            <label class="form-label">Tên đăng nhập</label>
            <input class="form-input" type="text" name="username" required autocomplete="username">
          </div>
          <div class="form-group">
            <label class="form-label">Mật khẩu</label>
            <input class="form-input" type="password" name="password" required autocomplete="current-password">
          </div>
          <button type="submit" class="btn btn-primary btn-block">Đăng nhập</button>
        </form>
        <p class="auth-footer">
          Chưa có tài khoản? <a href="/register" class="link" data-nav>Đăng ký ngay</a>
        </p>
      </div>
    </section>
  `;

  const form = document.getElementById('login-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      await api.login({ username, password });
      window.location.href = '/';
    } catch (error) {
      alert('Đăng nhập thất bại! Vui lòng kiểm tra lại thông tin.');
    }
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;
  gsap.from(container.querySelector('.auth-card')!, {
    autoAlpha: 0,
    y: 16,
    duration: 0.7,
    ease: 'power2.out'
  });
}
