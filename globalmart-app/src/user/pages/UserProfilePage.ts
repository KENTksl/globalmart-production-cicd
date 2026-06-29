import { api } from '../../utils/api';

export async function renderUserProfilePage(container: HTMLElement) {
  container.innerHTML = `
    <section class="hero hero-template">
      <div class="container" style="max-width: 900px; margin: 0 auto; padding: 4rem 1.25rem;">
        <div class="glass-card" style="padding: 2.5rem; border-radius: var(--radius-lg);">
          <span class="eyebrow">Thông tin cá nhân</span>
          <h1 style="margin-top: 1rem; margin-bottom: 2rem; font-size: 2rem;">Hồ sơ của bạn</h1>
          <div id="profile-content">
            <p style="text-align: center;">Đang tải thông tin...</p>
          </div>
        </div>
      </div>
    </section>

    <footer id="contact">
      <p>© 2026 Global Mart. All rights reserved.</p>
      <p>Hotline: 1900-1234 | Email: support@globalmart.com</p>
    </footer>
  `;

  const profileContent = document.getElementById('profile-content')!;

  try {
    const user = await api.getMe();
    renderProfile(profileContent, user);
  } catch (err) {
    profileContent.innerHTML = `
      <div class="alert alert-error">
        Không thể tải thông tin cá nhân. Vui lòng đăng nhập lại.
      </div>
    `;
  }
}

function renderProfile(container: HTMLElement, user: { id: number; username: string; email: string }) {
  container.innerHTML = `
    <div style="display: grid; gap: 1.5rem;">
      <div class="summary-card" style="position: static;">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
          <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: 800;">
            ${user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style="font-size: 1.5rem; margin-bottom: 0.25rem;">${user.username}</h3>
            <p style="color: var(--text-subtle);">${user.email}</p>
          </div>
        </div>
        <div class="summary-line" style="border-bottom: none;">
          <span style="font-weight: 600; color: var(--text-muted);">ID người dùng:</span>
          <span>#${user.id}</span>
        </div>
        <div class="summary-line">
          <span style="font-weight: 600; color: var(--text-muted);">Tên đăng nhập:</span>
          <span>${user.username}</span>
        </div>
        <div class="summary-line" style="border-bottom: none;">
          <span style="font-weight: 600; color: var(--text-muted);">Email:</span>
          <span>${user.email}</span>
        </div>
      </div>
      <div style="display: flex; gap: 1rem;">
        <a href="/" class="btn btn-ghost" data-nav style="flex: 1; justify-content: center;">
          Về trang chủ
        </a>
        <a href="/cart" class="btn btn-primary" data-nav style="flex: 1; justify-content: center;">
          Giỏ hàng
        </a>
      </div>
    </div>
  `;
}
