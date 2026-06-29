import { api } from '../../utils/api';
import { getCartCount } from '../../utils/cart';

export function renderUserNavbar(container: HTMLElement) {
  const currentUser = api.getCurrentUser();
  const cartCount = getCartCount();

  container.innerHTML = `
    <nav class="site-nav">
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
          <li><a href="/cart" data-nav>Giỏ hàng <span class="cart-badge">${cartCount}</span></a></li>
          ${currentUser ? '<li><a href="/admin" data-nav>Quản trị</a></li>' : ''}
          ${currentUser ? `<li><a href="/profile" data-nav>Hồ sơ</a></li>` : ''}
          ${currentUser
            ? `<li><a href="/logout" id="logout-link">Đăng xuất (${currentUser.username})</a></li>`
            : '<li><a href="/login" data-nav>Đăng nhập</a></li>'
          }
        </ul>
      </div>
    </nav>
  `;

  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', (event) => {
      event.preventDefault();
      api.logout();
      window.dispatchEvent(new CustomEvent('cart:updated'));
      window.location.href = '/';
    });
  }
}
