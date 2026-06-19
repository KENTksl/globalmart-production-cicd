import { api, Category } from '../../utils/api';
import { renderAdminLayout } from '../components/AdminLayout';

export async function renderAdminCategoriesPage(container: HTMLElement, editingId?: number) {
  container.innerHTML = renderAdminLayout(
    'Quản trị danh mục',
    `
      <div id="admin-categories-content" class="admin-panel">
        <p>Đang tải dữ liệu danh mục...</p>
      </div>
    `
  );

  const content = document.getElementById('admin-categories-content')!;

  try {
    const categories = await api.getCategories();
    const editingCategory = editingId ? categories.find((category) => category.id === editingId) : undefined;

    content.innerHTML = `
      <div class="admin-form-layout">
        <form id="category-admin-form" class="glass-card admin-form">
          <input type="hidden" name="editingId" value="${editingCategory?.id ?? ''}">
          <h3>${editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}</h3>
          <div class="form-group">
            <label class="form-label">Tên danh mục</label>
            <input class="form-input" type="text" name="name" value="${editingCategory?.name ?? ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Mô tả</label>
            <textarea class="form-input form-textarea" name="description">${editingCategory?.description ?? ''}</textarea>
          </div>
          <div class="product-actions">
            <button type="submit" class="btn btn-primary">${editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}</button>
            ${editingCategory ? '<a href="/admin/categories" class="btn btn-ghost" data-nav>Hủy</a>' : ''}
          </div>
        </form>

        <section class="glass-card admin-table-card">
          <div class="section-head">
            <div>
              <h3 class="section-title section-title--left">Danh sách danh mục</h3>
              <p class="section-subtitle">Xóa danh mục sẽ xóa luôn sản phẩm thuộc danh mục đó.</p>
            </div>
          </div>
          ${
            categories.length === 0
              ? '<div class="empty-state empty-state--sm"><p>Chưa có danh mục nào.</p></div>'
              : `
                <div class="admin-table">
                  <div class="admin-table__head admin-table__head--products">
                    <span>Tên</span>
                    <span>Mô tả</span>
                    <span>Sản phẩm</span>
                    <span>Thao tác</span>
                  </div>
                  ${categories.map((category) => renderCategoryRow(category)).join('')}
                </div>
              `
          }
        </section>
      </div>
    `;

    bindCategoryActions(container);
  } catch {
    content.innerHTML = '<div class="alert alert-error">Không thể tải quản trị danh mục.</div>';
  }
}

function renderCategoryRow(category: Category) {
  return `
    <div class="admin-table__row admin-table__row--products">
      <span>${category.name}</span>
      <span>${category.description || 'Chưa có mô tả'}</span>
      <span>${category.productCount ?? 0}</span>
      <span class="admin-row-actions">
        <button class="btn btn-ghost" data-category-edit="${category.id}">Sửa</button>
        <button class="btn btn-primary" data-category-delete="${category.id}">Xóa</button>
      </span>
    </div>
  `;
}

function bindCategoryActions(container: HTMLElement) {
  const form = document.getElementById('category-admin-form') as HTMLFormElement | null;

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const editingId = Number(formData.get('editingId') ?? 0);
    const name = String(formData.get('name') ?? '');
    const description = String(formData.get('description') ?? '');

    try {
      if (editingId) {
        await api.updateCategory(editingId, { name, description });
      } else {
        await api.createCategory({ name, description });
      }
      window.location.href = '/admin/categories';
    } catch {
      alert('Không thể lưu danh mục.');
    }
  });

  container.querySelectorAll<HTMLElement>('[data-category-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.href = `/admin/categories?edit=${button.dataset.categoryEdit}`;
    });
  });

  container.querySelectorAll<HTMLElement>('[data-category-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;
      try {
        await api.deleteCategory(Number(button.dataset.categoryDelete));
        window.location.href = '/admin/categories';
      } catch {
        alert('Không thể xóa danh mục.');
      }
    });
  });
}
