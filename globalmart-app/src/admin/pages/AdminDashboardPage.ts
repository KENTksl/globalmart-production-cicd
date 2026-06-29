import { api, AdminChartDatum } from '../../utils/api';
import { formatCurrency } from '../../utils/format';
import { renderAdminLayout } from '../components/AdminLayout';

export async function renderAdminDashboardPage(container: HTMLElement) {
  container.innerHTML = renderAdminLayout(
    'Biểu đồ thống kê',
    `
      <div id="admin-dashboard-content" class="admin-panel">
        <p>Đang tải thống kê...</p>
      </div>
    `
  );

  const content = document.getElementById('admin-dashboard-content')!;

  try {
    const stats = await api.getAdminStats();
    content.innerHTML = `
      <div class="admin-stats-grid">
        <article class="glass-card admin-stat-card">
          <span>Tổng sản phẩm Khôi</span>
          <strong>${stats.totalProducts}</strong>
        </article>
        <article class="glass-card admin-stat-card">
          <span>Tổng danh mục</span>
          <strong>${stats.totalCategories}</strong>
        </article>
        <article class="glass-card admin-stat-card">
          <span>Tổng đơn hàng</span>
          <strong>${stats.totalOrders}</strong>
        </article>
        <article class="glass-card admin-stat-card">
          <span>Doanh thu</span>
          <strong>${formatCurrency(stats.totalRevenue)}</strong>
        </article>
      </div>

      <div class="admin-charts-grid">
        <section class="glass-card admin-chart-card">
          <h3>Sản phẩm theo danh mục</h3>
          ${renderBarChart(stats.productsPerCategory, 'Chưa có dữ liệu')}
        </section>
        <section class="glass-card admin-chart-card">
          <h3>Trạng thái đơn hàng</h3>
          ${renderBarChart(stats.orderStatusBreakdown, 'Chưa có đơn hàng nào')}
        </section>
      </div>

      <section class="glass-card admin-table-card">
        <div class="section-head">
          <div>
            <h3 class="section-title section-title--left">Đơn hàng gần đây</h3>
            <p class="section-subtitle">Danh sách đơn hàng mới nhất.</p>
          </div>
        </div>
        ${
          stats.latestOrders.length === 0
            ? '<div class="empty-state empty-state--sm"><p>Chưa có đơn hàng nào.</p></div>'
            : `
              <div class="admin-table">
                <div class="admin-table__head">
                  <span>Mã đơn</span>
                  <span>Khách hàng</span>
                  <span>Trạng thái</span>
                  <span>Tổng tiền</span>
                </div>
                ${stats.latestOrders
                  .map(
                    (order) => `
                      <div class="admin-table__row">
                        <span>#${order.id}</span>
                        <span>${order.customerName}</span>
                        <span>${order.status}</span>
                        <span>${formatCurrency(order.totalAmount)}</span>
                      </div>
                    `
                  )
                  .join('')}
              </div>
            `
        }
      </section>
    `;
  } catch {
    content.innerHTML = '<div class="alert alert-error">Không thể tải thống kê quản trị.</div>';
  }
}

function renderBarChart(items: AdminChartDatum[], emptyText: string) {
  if (items.length === 0) {
    return `<div class="empty-state empty-state--sm"><p>${emptyText}</p></div>`;
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return `
    <div class="bar-chart">
      ${items
        .map(
          (item) => `
            <div class="bar-chart__item">
              <div class="bar-chart__label">
                <span>${item.label}</span>
                <strong>${item.value}</strong>
              </div>
              <div class="bar-chart__track">
                <div class="bar-chart__fill" style="width: ${(item.value / maxValue) * 100}%;"></div>
              </div>
            </div>
          `
        )
        .join('')}
    </div>
  `;
}
