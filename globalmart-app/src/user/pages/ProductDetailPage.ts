import { gsap } from 'gsap';
import { api, Product } from '../../utils/api';
import { addToCart } from '../../utils/cart';
import { formatCurrency } from '../../utils/format';

export async function renderProductDetailPage(container: HTMLElement, productId: string) {
  container.innerHTML = `
    <section class="section product-detail">
      <div id="product-detail-container" class="product-detail__container">
        <p>Đang tải sản phẩm...</p>
      </div>
    </section>
  `;

  const detailContainer = document.getElementById('product-detail-container')!;

  try {
    const id = Number(productId);
    const product = await api.getProduct(id);
    renderProductDetail(detailContainer, product);
  } catch {
    detailContainer.innerHTML = `
      <div class="alert alert-error">
        Không tìm thấy sản phẩm.
      </div>
    `;
  }
}

function renderProductDetail(container: HTMLElement, product: Product) {
  const productImage = product.image
    ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 420px; object-fit: cover; border-radius: 12px;">`
    : '<div style="width: 100%; height: 420px; display: flex; align-items: center; justify-content: center; font-size: 96px;">📦</div>';

  container.innerHTML = `
    <div class="product-layout">
      <div class="product-media">${productImage}</div>
      <div class="product-detail__info">
        <a href="/products" class="link back-link" data-nav>← Quay lại danh sách sản phẩm</a>
        <p class="product-meta">${product.categoryName || 'Sản phẩm'}</p>
        <h1 class="product-title">${product.name}</h1>
        <p class="product-price-lg">${formatCurrency(product.price)}</p>
        <p class="product-desc-lg">${product.description || 'Chưa có mô tả cho sản phẩm này.'}</p>
        <div class="product-actions">
          <button class="btn btn-primary" id="add-product-detail">Thêm vào giỏ hàng</button>
          <a href="/checkout" class="btn btn-ghost" data-nav>Mua liền</a>
        </div>
      </div>
    </div>
  `;

  const addButton = document.getElementById('add-product-detail');
  addButton?.addEventListener('click', () => {
    addToCart(product.id);
    addButton.textContent = 'Đã thêm vào giỏ';
    setTimeout(() => {
      addButton.textContent = 'Thêm vào giỏ hàng';
    }, 1200);
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  gsap.from(container.children, {
    autoAlpha: 0,
    y: 16,
    duration: 0.7,
    stagger: 0.06,
    ease: 'power2.out',
  });
}
