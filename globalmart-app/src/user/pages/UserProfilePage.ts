import { api } from '../../utils/api';

export async function renderUserProfilePage(container: HTMLElement) {
  let isEditing = false;

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
  let user = await api.getMe();

  function renderProfile() {
    if (isEditing) {
      profileContent.innerHTML = `
        <div style="display: grid; gap: 1.5rem;">
          <form id="edit-profile-form" class="admin-form" style="padding: 0;">
            <div class="form-group">
              <label for="edit-username" class="form-label">Tên đăng nhập</label>
              <input type="text" id="edit-username" class="form-input" value="${user.username}" required>
            </div>
            <div class="form-group">
              <label for="edit-email" class="form-label">Email (không thể thay đổi)</label>
              <input type="email" id="edit-email" class="form-input" value="${user.email}" disabled style="background: var(--surface-soft); cursor: not-allowed;">
            </div>
            <div class="form-group">
              <label for="edit-password" class="form-label">Mật khẩu mới (để trống nếu không đổi)</label>
              <input type="password" id="edit-password" class="form-input" placeholder="Mật khẩu mới">
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
              <button type="submit" class="btn btn-primary" style="flex: 1; justify-content: center;">Lưu thay đổi</button>
              <button type="button" id="cancel-edit-btn" class="btn btn-ghost" style="flex: 1; justify-content: center;">Hủy</button>
            </div>
          </form>
        </div>
      `;

      const form = document.getElementById('edit-profile-form') as HTMLFormElement;
      const cancelBtn = document.getElementById('cancel-edit-btn') as HTMLButtonElement;

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const username = (document.getElementById('edit-username') as HTMLInputElement).value;
          const password = (document.getElementById('edit-password') as HTMLInputElement).value;
          
          const updateData: any = { username };
          if (password.trim()) {
            updateData.password = password;
          }
          
          user = await api.updateMe(updateData);
          isEditing = false;
          window.dispatchEvent(new CustomEvent('user:updated'));
          renderProfile();
        } catch (err) {
          alert('Lỗi khi cập nhật thông tin! Vui lòng kiểm tra lại.');
        }
      });

      cancelBtn.addEventListener('click', () => {
        isEditing = false;
        renderProfile();
      });
    } else {
      profileContent.innerHTML = `
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
            <button id="edit-profile-btn" class="btn btn-primary" style="flex: 1; justify-content: center;">
              Chỉnh sửa hồ sơ
            </button>
          </div>
        </div>
      `;

      document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
        isEditing = true;
        renderProfile();
      });
    }
  }

  renderProfile();
}
