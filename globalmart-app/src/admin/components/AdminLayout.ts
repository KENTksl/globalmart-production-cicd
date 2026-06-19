export function renderAdminLayout(title: string, body: string) {
  return `
    <section class="admin-shell">
      <aside class="admin-sidebar">
        <a href="/" class="admin-brand" data-nav>
          <img src="/ico.png" alt="Global Mart">
          <span>Quản trị Global Mart</span>
        </a>
        <nav class="admin-menu">
          <a href="/admin" class="admin-menu__link" data-nav>Thống kê</a>
          <a href="/admin/products" class="admin-menu__link" data-nav>Quản trị sản phẩm</a>
          <a href="/admin/categories" class="admin-menu__link" data-nav>Quản trị danh mục</a>
        </nav>
      </aside>
      <div class="admin-content">
        <div class="admin-topbar">
          <div>
            <p class="admin-eyebrow">Khu vực quản trị</p>
            <h1>${title}</h1>
          </div>
          <a href="/" class="btn btn-ghost" data-nav>Về trang chủ</a>
        </div>
        ${body}
      </div>
    </section>
  `;
}
