import { api, Product } from '../../utils/api';
import { formatCurrency } from '../../utils/format';
import { getCart, removeFromCart, updateCartItem } from '../../utils/cart';

interface CartProduct extends Product {
  quantity: number;
}

export async function renderCartPage(container: HTMLElement) {
  container.innerHTML = `
    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <h2 class="section-title section-title--left">Giỏ hàng</h2>
            <p class="section-subtitle">Bạn có thể thêm hàng vào giỏ và tiếp tục thanh toán bất cứ lúc nào.</p>
          </div>
          <a href="/products" class="link" data-nav>Tiếp tục mua sắm</a>
        </div>
        <div id="cart-container">
          <p>Đang tải giỏ hàng...</p>
        </div>
      </div>
    </section>
  `;

  const cartContainer = document.getElementById('cart-container')!;

  try {
    const [products, cart] = await Promise.all([api.getProducts(), Promise.resolve(getCart())]);
    const cartProducts = cart
      .map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        return product ? { ...product, quantity: item.quantity } : null;
      })
      .filter(Boolean) as CartProduct[];

    renderCart(cartContainer, cartProducts);
  } catch {
    cartContainer.innerHTML = '<div class="alert alert-error">Không thể tải giỏ hàng.</div>';
  }
}

function renderCart(container: HTMLElement, products: CartProduct[]) {
  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Giỏ hàng đang trống</h3>
        <p>Hãy thêm sản phẩm vào giỏ để tiếp tục.</p>
        <a href="/products" class="btn btn-primary" data-nav>Xem sản phẩm</a>
      </div>
    `;
    return;
  }

  const total = products.reduce((sum, product) => sum + product.price * product.quantity, 0);

  container.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items">
        ${products
          .map(
            (product) => `
              <article class="cart-item">
                <div class="cart-item__image">
                  ${product.image
                    ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">`
                    : '<div class="cart-item__placeholder">📦</div>'
                  }
                </div>
                <div class="cart-item__info">
                  <h3>${product.name}</h3>
                  <p>${product.description || 'Chưa có mô tả cho sản phẩm này.'}</p>
                  <strong>${formatCurrency(product.price)}</strong>
                </div>
                <div class="cart-item__actions">
                  <label>
                    Số lượng
                    <input type="number" min="1" value="${product.quantity}" data-cart-qty="${product.id}" class="form-input cart-qty-input">
                  </label>
                  <button class="btn btn-ghost" data-cart-remove="${product.id}">Xóa</button>
                </div>
              </article>
            `
          )
          .join('')}
      </div>
      <aside class="summary-card glass-card">
        <h3>Tóm tắt đơn hàng</h3>
        <div class="summary-line"><span>Số sản phẩm</span><strong>${products.length}</strong></div>
        <div class="summary-line"><span>Tổng tiền</span><strong>${formatCurrency(total)}</strong></div>
        <a href="/checkout" class="btn btn-primary btn-block" data-nav>Tiến hành thanh toán</a>
      </aside>
    </div>
  `;

  container.querySelectorAll<HTMLInputElement>('[data-cart-qty]').forEach((input) => {
    input.addEventListener('change', () => {
      updateCartItem(Number(input.dataset.cartQty), Math.max(1, Number(input.value)));
      renderCartPage(container.closest('#app') as HTMLElement);
    });
  });

  container.querySelectorAll<HTMLElement>('[data-cart-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      removeFromCart(Number(button.dataset.cartRemove));
      renderCartPage(container.closest('#app') as HTMLElement);
    });
  });
}
