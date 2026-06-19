import { api, Product } from '../../utils/api';
import { clearCart, getCart } from '../../utils/cart';
import { formatCurrency } from '../../utils/format';

interface CheckoutProduct extends Product {
  quantity: number;
}

export async function renderCheckoutPage(container: HTMLElement) {
  container.innerHTML = `
    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <h2 class="section-title section-title--left">Thanh toán</h2>
            <p class="section-subtitle">Hoàn tất đơn hàng của bạn một cách nhanh chóng và thuận tiện.</p>
          </div>
          <a href="/cart" class="link" data-nav>Quay lại giỏ hàng</a>
        </div>
        <div id="checkout-container">
          <p>Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    </section>
  `;

  const checkoutContainer = document.getElementById('checkout-container')!;

  try {
    const [products, cart] = await Promise.all([api.getProducts(), Promise.resolve(getCart())]);
    const checkoutProducts = cart
      .map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        return product ? { ...product, quantity: item.quantity } : null;
      })
      .filter(Boolean) as CheckoutProduct[];

    renderCheckout(checkoutContainer, checkoutProducts);
  } catch {
    checkoutContainer.innerHTML = '<div class="alert alert-error">Không thể tải trang thanh toán.</div>';
  }
}

function renderCheckout(container: HTMLElement, products: CheckoutProduct[]) {
  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Chưa có sản phẩm để thanh toán</h3>
        <p>Hãy thêm sản phẩm vào giỏ hàng trước khi đặt đơn.</p>
        <a href="/products" class="btn btn-primary" data-nav>Xem sản phẩm</a>
      </div>
    `;
    return;
  }

  const total = products.reduce((sum, product) => sum + product.price * product.quantity, 0);

  container.innerHTML = `
    <div class="checkout-layout">
      <form id="checkout-form" class="glass-card checkout-form">
        <h3>Thông tin nhận hàng</h3>
        <div class="form-group">
          <label class="form-label">Họ và tên</label>
          <input class="form-input" type="text" name="customerName" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" name="email" required>
        </div>
        <div class="form-group">
          <label class="form-label">Số điện thoại</label>
          <input class="form-input" type="tel" name="phone" required>
        </div>
        <div class="form-group">
          <label class="form-label">Địa chỉ</label>
          <textarea class="form-input form-textarea" name="address" required></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Ghi chú</label>
          <textarea class="form-input form-textarea" name="notes"></textarea>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Đặt hàng</button>
      </form>

      <aside class="summary-card glass-card">
        <h3>Đơn hàng của bạn</h3>
        <div class="checkout-summary-list">
          ${products
            .map(
              (product) => `
                <div class="summary-line">
                  <span>${product.name} x ${product.quantity}</span>
                  <strong>${formatCurrency(product.price * product.quantity)}</strong>
                </div>
              `
            )
            .join('')}
        </div>
        <div class="summary-line summary-line--total">
          <span>Tổng thanh toán</span>
          <strong>${formatCurrency(total)}</strong>
        </div>
      </aside>
    </div>
  `;

  const form = document.getElementById('checkout-form') as HTMLFormElement;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    try {
      const result = await api.checkout({
        customerName: String(formData.get('customerName') ?? ''),
        email: String(formData.get('email') ?? ''),
        phone: String(formData.get('phone') ?? ''),
        address: String(formData.get('address') ?? ''),
        notes: String(formData.get('notes') ?? ''),
        items: products.map((product) => ({
          productId: product.id,
          quantity: product.quantity,
        })),
      }) as { id: number; totalAmount: number };

      clearCart();
      container.innerHTML = `
        <div class="empty-state">
          <h3>Đặt hàng thành công</h3>
          <p>Mã đơn hàng: #${result.id}</p>
          <p>Tổng thanh toán: ${formatCurrency(result.totalAmount)}</p>
          <a href="/products" class="btn btn-primary" data-nav>Tiếp tục mua sắm</a>
        </div>
      `;
    } catch {
      alert('Không thể đặt hàng. Vui lòng kiểm tra lại thông tin.');
    }
  });
}
