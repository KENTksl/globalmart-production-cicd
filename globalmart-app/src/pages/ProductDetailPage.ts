import { api, Product } from '../utils/api';
import { gsap } from 'gsap';

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
    const id = parseInt(productId);
    const product = await api.getProduct(id);
    renderProductDetail(detailContainer, product);
  } catch (error) {
    detailContainer.innerHTML = `
      <div class="alert alert-error">
        Không tìm thấy sản phẩm.
      </div>
    `;
  }
}

function renderProductDetail(container: HTMLElement, product: Product) {
  const productImage = product.image 
    ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 400px; object-fit: cover; border-radius: 12px;">` 
    : '<div style="width: 100%; height: 400px; display: flex; align-items: center; justify-content: center; font-size: 96px;">📦</div>';

  container.innerHTML = `
    <div class="product-layout">
      <div class="product-media">${productImage}</div>
      <div class="product-detail__info">
        <a href="/products" class="link back-link" data-nav>← Quay lại danh sách sản phẩm</a>
        <h1 class="product-title">${product.name}</h1>
        <p class="product-price-lg">${product.price.toLocaleString('vi-VN')}đ</p>
        <p class="product-desc-lg">${product.description}</p>
        <button class="btn btn-primary">Thêm vào giỏ hàng</button>
      </div>
    </div>
  `;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;
  gsap.from(container.children, {
    autoAlpha: 0,
    y: 16,
    duration: 0.7,
    stagger: 0.06,
    ease: 'power2.out'
  });
}
