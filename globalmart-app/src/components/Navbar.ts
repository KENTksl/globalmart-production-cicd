import { api } from '../utils/api';

export function renderNavbar(container: HTMLElement) {
  const currentUser = api.getCurrentUser();
  
  container.innerHTML = `
    <nav>
      <div class="nav-container">
        <a href="/" class="logo-link" data-nav>
          <div class="brand">
            <span class="brand-mark">
              <img class="brand-logo" src="/ico.png" alt="Global Mart">
            </span>
            <span class="brand-name">Global Mart</span>
          </div>
        </a>
        <ul class="nav-links">
          <li><a href="/" data-nav>Trang chủ</a></li>
          <li><a href="/categories" data-nav>Danh mục</a></li>
          <li><a href="/products" data-nav>Sản phẩm</a></li>
          ${currentUser 
            ? `<li><a href="/logout" id="logout-link">Đăng xuất (${currentUser.username})</a></li>`
            : `<li><a href="/login" data-nav>Đăng nhập</a></li>`
          }
        </ul>
      </div>
    </nav>
  `;

  // Handle logout
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      api.logout();
      window.location.href = '/';
    });
  }
}
