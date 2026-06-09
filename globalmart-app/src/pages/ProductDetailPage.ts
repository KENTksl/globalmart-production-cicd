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
    renderProductDetail(detailContainer, getMockProduct(parseInt(productId) || 1));
  }
}

function renderProductDetail(container: HTMLElement, product: Product) {
  container.innerHTML = `
    <div class="product-layout">
      <div class="product-media">📦</div>
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

function getMockProduct(id: number): Product {
  const mockProducts: Product[] = [
    { id: 1, name: 'Điện thoại thông minh', description: 'Điện thoại hiện đại, camera chất lượng cao, màn hình AMOLED 6.5 inch, pin 5000mAh, sạc nhanh 65W.', price: 12990000 },
    { id: 2, name: 'Laptop cao cấp', description: 'Hiệu năng mạnh mẽ, thiết kế sang trọng, CPU Intel Core i7, RAM 16GB, SSD 512GB, màn hình 14 inch 2K.', price: 25990000 },
    { id: 3, name: 'Tai nghe không dây', description: 'Âm thanh chân thực, pin kéo dài 30 giờ, chống nước IPX5, kết nối Bluetooth 5.3.', price: 3490000 },
    { id: 4, name: 'Đồng hồ thông minh', description: 'Theo dõi sức khỏe, kết hợp thời trang, màn hình AMOLED 1.4 inch, theo dõi nhịp tim, SpO2.', price: 5990000 },
    { id: 5, name: 'Máy chơi game', description: 'Trải nghiệm game đỉnh cao, đồ họa 4K, 1TB bộ nhớ trong, controller không dây.', price: 8990000 },
    { id: 6, name: 'Máy ảnh DSLR', description: 'Chụp ảnh chuyên nghiệp, cảm biến 24MP, quay video 4K, kèm lens 18-55mm.', price: 18990000 },
  ];
  return mockProducts.find(p => p.id === id) || mockProducts[0];
}
