import { api, Category, Product } from '../../utils/api';
import { formatCurrency } from '../../utils/format';
import { renderAdminLayout } from '../components/AdminLayout';

export async function renderAdminProductsPage(container: HTMLElement, editingId?: number) {
  container.innerHTML = renderAdminLayout(
    'Quản trị sản phẩm',
    `
      <div id="admin-products-content" class="admin-panel">
        <p>Đang tải sản phẩm...</p>
      </div>
    `
  );

  const content = document.getElementById('admin-products-content')!;

  try {
    const [products, categories] = await Promise.all([api.getProducts(), api.getCategories()]);
    const editingProduct = editingId ? products.find((product) => product.id === editingId) : undefined;

    content.innerHTML = `
      <div class="admin-form-layout">
        <form id="product-admin-form" class="glass-card admin-form">
          <input type="hidden" name="editingId" value="${editingProduct?.id ?? ''}">
          <h3>${editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h3>
          <div class="form-group">
            <label class="form-label">Tên sản phẩm</label>
            <input class="form-input" type="text" name="name" value="${editingProduct?.name ?? ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Giá</label>
            <input class="form-input" type="number" min="0" name="price" value="${editingProduct?.price ?? ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Ảnh</label>
            <input class="form-input" type="text" name="image" value="${editingProduct?.image ?? ''}" placeholder="https://...">
          </div>
          <div class="form-group">
            <label class="form-label">Danh mục</label>
            <select class="form-input" name="categoryId" required>
              <option value="">Chọn danh mục</option>
              ${categories
                .map(
                  (category) => `
                    <option value="${category.id}" ${editingProduct?.categoryId === category.id ? 'selected' : ''}>
                      ${category.name}
                    </option>
                  `
                )
                .join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Mô tả</label>
            <textarea class="form-input form-textarea" name="description">${editingProduct?.description ?? ''}</textarea>
          </div>
          <div class="product-actions">
            <button type="submit" class="btn btn-primary">${editingProduct ? 'Lưu thay đổi' : 'Tạo sản phẩm'}</button>
            ${editingProduct ? '<a href="/admin/products" class="btn btn-ghost" data-nav>Hủy</a>' : ''}
          </div>
        </form>

        <section class="glass-card admin-table-card">
          <div class="section-head">
            <div>
              <h3 class="section-title section-title--left">Danh sách sản phẩm</h3>
              <p class="section-subtitle">Danh sách sản phẩm hiện có.</p>
            </div>
          </div>
          ${
            products.length === 0
              ? '<div class="empty-state empty-state--sm"><p>Chưa có sản phẩm nào.</p></div>'
              : `
                <div class="admin-table">
                  <div class="admin-table__head admin-table__head--products">
                    <span>Tên</span>
                    <span>Danh mục</span>
                    <span>Giá</span>
                    <span>Thao tác</span>
                  </div>
                  ${products
                    .map((product) => renderProductRow(product, categories))
                    .join('')}
                </div>
              `
          }
        </section>
      </div>
    `;

    bindProductActions(container);
  } catch (error) {
    content.innerHTML = '<div class="alert alert-error">Không thể tải quản trị sản phẩm.</div>';
  }
}

function renderProductRow(product: Product, categories: Category[]) {
  const categoryName = categories.find((category) => category.id === product.categoryId)?.name || 'Chưa phân loại';

  return `
    <div class="admin-table__row admin-table__row--products">
      <span>${product.name}</span>
      <span>${categoryName}</span>
      <span>${formatCurrency(product.price)}</span>
      <span class="admin-row-actions">
        <button class="btn btn-ghost" data-product-edit="${product.id}">Sửa</button>
        <button class="btn btn-primary" data-product-delete="${product.id}">Xóa</button>
      </span>
    </div>
  `;
}

function bindProductActions(container: HTMLElement) {
  const form = document.getElementById('product-admin-form') as HTMLFormElement | null;

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const editingId = Number(formData.get('editingId') ?? 0);
    const name = String(formData.get('name') ?? '');
    const description = String(formData.get('description') ?? '');
    const price = Number(formData.get('price') ?? 0);
    const image = String(formData.get('image') ?? '');
    const categoryId = Number(formData.get('categoryId') ?? 0);

    try {
      if (editingId) {
        await api.updateProduct(editingId, { name, description, price, image, categoryId });
      } else {
        await api.createProduct({ name, description, price, image, categoryId });
      }

      window.location.href = '/admin/products';
    } catch {
      alert('Không thể lưu sản phẩm.');
    }
  });

  container.querySelectorAll<HTMLElement>('[data-product-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.href = `/admin/products?edit=${button.dataset.productEdit}`;
    });
  });

  container.querySelectorAll<HTMLElement>('[data-product-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
      try {
        await api.deleteProduct(Number(button.dataset.productDelete));
        window.location.href = '/admin/products';
      } catch {
        alert('Không thể xóa sản phẩm.');
      }
    });
  });
}
