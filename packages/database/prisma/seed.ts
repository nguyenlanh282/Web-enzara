import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Enzara database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("enzara@admin2026", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@enzara.vn" },
    update: {},
    create: {
      email: "admin@enzara.vn",
      password: hashedPassword,
      fullName: "Enzara Admin",
      phone: "0945139990",
      role: "ADMIN",
      emailVerified: true,
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  // Create brand
  const brand = await prisma.brand.upsert({
    where: { slug: "enzara" },
    update: {},
    create: {
      name: "Enzara",
      slug: "enzara",
    },
  });
  console.log(`Brand created: ${brand.name}`);

  // Create categories based on Enzara product lines
  const categories = [
    {
      name: "Nước rửa chén",
      slug: "nuoc-rua-chen",
      description: "Nước rửa chén hữu cơ từ enzyme dứa",
    },
    {
      name: "Nước rửa rau củ quả",
      slug: "nuoc-rua-rau-cu-qua",
      description: "Nước rửa rau củ quả an toàn từ enzyme tự nhiên",
    },
    {
      name: "Gel rửa bình sữa",
      slug: "gel-rua-binh-sua",
      description: "Gel rửa bình sữa an toàn cho bé",
    },
    {
      name: "Nước tẩy toilet",
      slug: "nuoc-tay-toilet",
      description: "Nước tẩy toilet hữu cơ từ enzyme dứa",
    },
    {
      name: "Nước tẩy đa năng",
      slug: "nuoc-tay-da-nang",
      description: "Nước tẩy rửa đa năng hương cam",
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`${categories.length} categories created`);

  // Create default settings
  const settings = [
    {
      group: "general",
      key: "siteName",
      value: JSON.stringify("Enzara"),
    },
    {
      group: "general",
      key: "siteDescription",
      value: JSON.stringify(
        "Sản phẩm tẩy rửa hữu cơ từ enzyme dứa tự nhiên"
      ),
    },
    {
      group: "general",
      key: "phone",
      value: JSON.stringify("0945139990"),
    },
    {
      group: "general",
      key: "email",
      value: JSON.stringify("info@enzara.vn"),
    },
    {
      group: "general",
      key: "address",
      value: JSON.stringify("Đồng Nai, Việt Nam"),
    },
    {
      group: "seo",
      key: "defaultTitle",
      value: JSON.stringify("Enzara - Sản phẩm tẩy rửa hữu cơ từ enzyme dứa"),
    },
    {
      group: "seo",
      key: "defaultDescription",
      value: JSON.stringify(
        "Enzara cung cấp sản phẩm tẩy rửa hữu cơ từ enzyme dứa tự nhiên. An toàn cho sức khỏe, thân thiện với môi trường."
      ),
    },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: {
        group_key: { group: setting.group, key: setting.key },
      },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log(`${settings.length} settings created`);

  // ============================================
  // PRODUCTS
  // ============================================

  // Look up category IDs by slug
  const catNuocRuaChen = await prisma.category.findUnique({ where: { slug: "nuoc-rua-chen" } });
  const catNuocRuaRauCuQua = await prisma.category.findUnique({ where: { slug: "nuoc-rua-rau-cu-qua" } });
  const catGelRuaBinhSua = await prisma.category.findUnique({ where: { slug: "gel-rua-binh-sua" } });
  const catNuocTayToilet = await prisma.category.findUnique({ where: { slug: "nuoc-tay-toilet" } });
  const catNuocTayDaNang = await prisma.category.findUnique({ where: { slug: "nuoc-tay-da-nang" } });

  // Product 1: Nuoc rua chen Enzara 500ml
  const product1 = await prisma.product.upsert({
    where: { slug: "nuoc-rua-chen-enzara-500ml" },
    update: {},
    create: {
      name: "Nước rửa chén Enzara 500ml",
      slug: "nuoc-rua-chen-enzara-500ml",
      shortDesc: "Nước rửa chén hữu cơ từ enzyme dứa, an toàn và thân thiện với môi trường",
      description: `<h2>Nước rửa chén Enzara 500ml - Sạch tự nhiên từ enzyme dứa</h2>
<p>Nước rửa chén Enzara được chiết xuất từ enzyme dứa tự nhiên, mang đến khả năng làm sạch vượt trội mà vẫn an toàn cho sức khỏe gia đình bạn.</p>
<h2>Ưu điểm nổi bật</h2>
<ul>
  <li>Chiết xuất từ enzyme dứa tự nhiên 100%</li>
  <li>Không chứa hóa chất độc hại, an toàn cho da tay</li>
  <li>Khả năng tẩy rửa dầu mỡ mạnh mẽ</li>
  <li>Thân thiện với môi trường, phân hủy sinh học hoàn toàn</li>
  <li>Hương thơm tự nhiên dịu nhẹ</li>
</ul>
<h2>Hướng dẫn sử dụng</h2>
<p>Cho 2-3ml nước rửa chén vào miếng rửa ẩm, tạo bọt và rửa sạch chén bát. Xả lại bằng nước sạch. Có thể pha loãng với nước theo tỷ lệ 1:3 để tiết kiệm hơn.</p>`,
      categoryId: catNuocRuaChen?.id,
      brandId: brand.id,
      basePrice: 89000,
      salePrice: 79000,
      sku: "ENZ-NRC-500",
      stockQuantity: 200,
      weight: 550,
      isFeatured: true,
      tags: ["huu-co", "enzyme-dua", "an-toan"],
      metaTitle: "Nước rửa chén Enzara 500ml - Hữu cơ từ enzyme dứa",
      metaDescription: "Nước rửa chén hữu cơ Enzara 500ml chiết xuất từ enzyme dứa tự nhiên. An toàn cho da tay, thân thiện môi trường.",
    },
  });

  // Product 1 - Primary image
  await prisma.productImage.deleteMany({ where: { productId: product1.id } });
  await prisma.productImage.create({
    data: {
      productId: product1.id,
      url: "/uploads/products/nuoc-rua-chen-500ml.jpg",
      altText: "Nước rửa chén Enzara 500ml",
      sortOrder: 0,
      isPrimary: true,
    },
  });

  // Product 1 - Variants
  await prisma.productVariant.deleteMany({ where: { productId: product1.id } });
  await prisma.productVariant.createMany({
    data: [
      {
        productId: product1.id,
        name: "500ml",
        sku: "ENZ-NRC-500V",
        price: 79000,
        stockQuantity: 100,
        attributes: { dung_tich: "500ml" },
      },
      {
        productId: product1.id,
        name: "1 Lít",
        sku: "ENZ-NRC-1000V",
        price: 149000,
        stockQuantity: 100,
        attributes: { dung_tich: "1L" },
      },
    ],
  });

  // Product 2: Nuoc rua rau cu qua Enzara 400ml
  const product2 = await prisma.product.upsert({
    where: { slug: "nuoc-rua-rau-cu-qua-enzara-400ml" },
    update: {},
    create: {
      name: "Nước rửa rau củ quả Enzara 400ml",
      slug: "nuoc-rua-rau-cu-qua-enzara-400ml",
      shortDesc: "Nước rửa rau củ quả hữu cơ, loại bỏ thuốc trừ sâu và vi khuẩn an toàn",
      description: `<h2>Nước rửa rau củ quả Enzara 400ml</h2>
<p>Nước rửa rau củ quả Enzara giúp loại bỏ thuốc trừ sâu, vi khuẩn và tạp chất bám trên bề mặt rau củ quả một cách an toàn và hiệu quả.</p>
<h2>Ưu điểm nổi bật</h2>
<ul>
  <li>Loại bỏ đến 99% thuốc trừ sâu trên bề mặt</li>
  <li>Thành phần từ enzyme dứa tự nhiên</li>
  <li>Không để lại dư lượng hóa chất trên thực phẩm</li>
  <li>An toàn cho cả gia đình, kể cả trẻ nhỏ</li>
</ul>
<h2>Hướng dẫn sử dụng</h2>
<p>Pha 5-10ml nước rửa vào 1 lít nước sạch. Ngâm rau củ quả trong 5-10 phút, sau đó xả lại bằng nước sạch.</p>`,
      categoryId: catNuocRuaRauCuQua?.id,
      brandId: brand.id,
      basePrice: 95000,
      sku: "ENZ-RCQ-400",
      stockQuantity: 150,
      weight: 450,
      isFeatured: true,
      tags: ["huu-co", "rau-cu", "an-toan"],
      metaTitle: "Nước rửa rau củ quả Enzara 400ml - An toàn từ enzyme dứa",
      metaDescription: "Nước rửa rau củ quả hữu cơ Enzara 400ml. Loại bỏ thuốc trừ sâu, vi khuẩn an toàn cho cả gia đình.",
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: product2.id } });
  await prisma.productImage.create({
    data: {
      productId: product2.id,
      url: "/uploads/products/nuoc-rua-rau-cu-qua-400ml.jpg",
      altText: "Nước rửa rau củ quả Enzara 400ml",
      sortOrder: 0,
      isPrimary: true,
    },
  });

  // Product 3: Gel rua binh sua Enzara 300ml
  const product3 = await prisma.product.upsert({
    where: { slug: "gel-rua-binh-sua-enzara-300ml" },
    update: {},
    create: {
      name: "Gel rửa bình sữa Enzara 300ml",
      slug: "gel-rua-binh-sua-enzara-300ml",
      shortDesc: "Gel rửa bình sữa hữu cơ, an toàn tuyệt đối cho bé yêu",
      description: `<h2>Gel rửa bình sữa Enzara 300ml - An toàn cho bé</h2>
<p>Gel rửa bình sữa Enzara được nghiên cứu và phát triển đặc biệt dành cho các bé. Thành phần từ enzyme dứa tự nhiên, đảm bảo an toàn tuyệt đối khi rửa bình sữa, núm ti và đồ chơi của bé.</p>
<h2>Ưu điểm nổi bật</h2>
<ul>
  <li>100% từ enzyme dứa tự nhiên, không hóa chất</li>
  <li>An toàn cho bé từ sơ sinh</li>
  <li>Loại bỏ cặn sữa, dầu mỡ hiệu quả</li>
  <li>Không mùi, không gây kích ứng</li>
  <li>Dạng gel dễ sử dụng, tiết kiệm</li>
</ul>
<h2>Hướng dẫn sử dụng</h2>
<p>Cho 1-2ml gel vào cọ rửa bình, chà sạch bên trong và ngoài bình sữa. Xả kỹ bằng nước sạch 2-3 lần trước khi sử dụng.</p>`,
      categoryId: catGelRuaBinhSua?.id,
      brandId: brand.id,
      basePrice: 109000,
      sku: "ENZ-GBS-300",
      stockQuantity: 100,
      weight: 350,
      isFeatured: true,
      tags: ["binh-sua", "an-toan-cho-be", "enzyme-dua"],
      metaTitle: "Gel rửa bình sữa Enzara 300ml - An toàn cho bé",
      metaDescription: "Gel rửa bình sữa hữu cơ Enzara 300ml từ enzyme dứa. An toàn tuyệt đối cho bé yêu từ sơ sinh.",
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: product3.id } });
  await prisma.productImage.create({
    data: {
      productId: product3.id,
      url: "/uploads/products/gel-rua-binh-sua-300ml.jpg",
      altText: "Gel rửa bình sữa Enzara 300ml",
      sortOrder: 0,
      isPrimary: true,
    },
  });

  // Product 4: Nuoc tay toilet Enzara 500ml
  const product4 = await prisma.product.upsert({
    where: { slug: "nuoc-tay-toilet-enzara-500ml" },
    update: {},
    create: {
      name: "Nước tẩy toilet Enzara 500ml",
      slug: "nuoc-tay-toilet-enzara-500ml",
      shortDesc: "Nước tẩy toilet hữu cơ, diệt khuẩn và khử mùi hiệu quả",
      description: `<h2>Nước tẩy toilet Enzara 500ml</h2>
<p>Nước tẩy toilet Enzara với thành phần từ enzyme dứa tự nhiên, giúp tẩy sạch vết bẩn cứng đầu, diệt khuẩn và khử mùi hiệu quả mà không gây hại cho đường ống và môi trường.</p>
<h2>Ưu điểm nổi bật</h2>
<ul>
  <li>Tẩy sạch vết bẩn, cặn canxi cứng đầu</li>
  <li>Diệt 99.9% vi khuẩn gây hại</li>
  <li>Khử mùi hôi hiệu quả, để lại hương thơm dịu nhẹ</li>
  <li>Không ăn mòn bề mặt sứ và đường ống</li>
  <li>Thân thiện với môi trường</li>
</ul>
<h2>Hướng dẫn sử dụng</h2>
<p>Xịt trực tiếp lên bề mặt bồn cầu, để trong 5-10 phút rồi chà và xả nước. Sử dụng 2-3 lần/tuần để giữ toilet luôn sạch sẽ.</p>`,
      categoryId: catNuocTayToilet?.id,
      brandId: brand.id,
      basePrice: 75000,
      sku: "ENZ-NTT-500",
      stockQuantity: 180,
      weight: 550,
      tags: ["toilet", "tay-rua", "huu-co"],
      metaTitle: "Nước tẩy toilet Enzara 500ml - Hữu cơ từ enzyme dứa",
      metaDescription: "Nước tẩy toilet hữu cơ Enzara 500ml. Diệt khuẩn, khử mùi, tẩy sạch vết bẩn cứng đầu an toàn.",
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: product4.id } });
  await prisma.productImage.create({
    data: {
      productId: product4.id,
      url: "/uploads/products/nuoc-tay-toilet-500ml.jpg",
      altText: "Nước tẩy toilet Enzara 500ml",
      sortOrder: 0,
      isPrimary: true,
    },
  });

  // Product 5: Nuoc tay da nang Enzara huong cam 500ml
  const product5 = await prisma.product.upsert({
    where: { slug: "nuoc-tay-da-nang-enzara-500ml" },
    update: {},
    create: {
      name: "Nước tẩy đa năng Enzara hương cam 500ml",
      slug: "nuoc-tay-da-nang-enzara-500ml",
      shortDesc: "Nước tẩy đa năng hữu cơ hương cam, làm sạch mọi bề mặt",
      description: `<h2>Nước tẩy đa năng Enzara hương cam 500ml</h2>
<p>Nước tẩy đa năng Enzara với hương cam tự nhiên, phù hợp để làm sạch mọi bề mặt trong nhà: sàn nhà, bếp, kính, đồ nội thất và nhiều hơn nữa.</p>
<h2>Ưu điểm nổi bật</h2>
<ul>
  <li>Đa năng: sử dụng cho mọi bề mặt trong nhà</li>
  <li>Hương cam tự nhiên thơm mát, dễ chịu</li>
  <li>Enzyme dứa giúp phân hủy dầu mỡ và vết bẩn</li>
  <li>Không gây hại bề mặt, không để lại vệt</li>
  <li>An toàn cho gia đình có trẻ nhỏ và thú cưng</li>
</ul>
<h2>Hướng dẫn sử dụng</h2>
<p>Pha 30-50ml nước tẩy vào 1 lít nước. Dùng khăn lau sạch bề mặt. Với vết bẩn cứng đầu, xịt trực tiếp và để 5 phút trước khi lau sạch.</p>`,
      categoryId: catNuocTayDaNang?.id,
      brandId: brand.id,
      basePrice: 85000,
      salePrice: 75000,
      sku: "ENZ-TDN-500",
      stockQuantity: 160,
      weight: 550,
      isFeatured: true,
      tags: ["da-nang", "huong-cam", "huu-co"],
      metaTitle: "Nước tẩy đa năng Enzara hương cam 500ml",
      metaDescription: "Nước tẩy đa năng hữu cơ Enzara hương cam 500ml. Làm sạch mọi bề mặt, an toàn cho gia đình.",
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: product5.id } });
  await prisma.productImage.create({
    data: {
      productId: product5.id,
      url: "/uploads/products/nuoc-tay-da-nang-500ml.jpg",
      altText: "Nước tẩy đa năng Enzara hương cam 500ml",
      sortOrder: 0,
      isPrimary: true,
    },
  });

  console.log("5 products created with images and variants");

  // ============================================
  // BLOG POSTS
  // ============================================

  await prisma.post.upsert({
    where: { slug: "tai-sao-nen-su-dung-san-pham-tay-rua-huu-co" },
    update: {},
    create: {
      title: "Tại sao nên sử dụng sản phẩm tẩy rửa hữu cơ?",
      slug: "tai-sao-nen-su-dung-san-pham-tay-rua-huu-co",
      excerpt: "Tìm hiểu lý do ngày càng nhiều gia đình Việt Nam chuyển sang sử dụng sản phẩm tẩy rửa hữu cơ để bảo vệ sức khỏe và môi trường.",
      content: `<h2>Xu hướng sử dụng sản phẩm tẩy rửa hữu cơ</h2>
<p>Trong những năm gần đây, ngày càng nhiều gia đình Việt Nam quan tâm đến việc sử dụng các sản phẩm tẩy rửa hữu cơ thay thế cho các sản phẩm hóa chất truyền thống. Đây không chỉ là xu hướng mà còn là sự lựa chọn thông minh để bảo vệ sức khỏe gia đình và môi trường sống.</p>

<h2>Tác hại của hóa chất tẩy rửa truyền thống</h2>
<p>Các sản phẩm tẩy rửa thông thường chứa nhiều hóa chất độc hại như sodium lauryl sulfate (SLS), phosphate, chlorine và các chất tạo mùi nhân tạo. Những hóa chất này có thể gây kích ứng da, ảnh hưởng đến hệ hô hấp và gây ô nhiễm nguồn nước khi thải ra môi trường.</p>

<h2>Lợi ích của sản phẩm tẩy rửa hữu cơ</h2>
<p>Sản phẩm tẩy rửa hữu cơ như Enzara được chiết xuất từ enzyme dứa tự nhiên, mang đến nhiều lợi ích vượt trội:</p>
<ul>
  <li><strong>An toàn cho sức khỏe:</strong> Không chứa hóa chất độc hại, an toàn cho da tay và hệ hô hấp.</li>
  <li><strong>Thân thiện môi trường:</strong> Phân hủy sinh học hoàn toàn, không gây ô nhiễm nguồn nước.</li>
  <li><strong>Hiệu quả làm sạch:</strong> Enzyme dứa có khả năng phân hủy protein và dầu mỡ tự nhiên.</li>
  <li><strong>An toàn cho trẻ nhỏ:</strong> Không để lại dư lượng hóa chất trên bát đĩa và đồ dùng.</li>
</ul>

<h2>Kết luận</h2>
<p>Việc chuyển sang sử dụng sản phẩm tẩy rửa hữu cơ là một quyết định đúng đắn cho sức khỏe gia đình và môi trường. Hãy bắt đầu với những sản phẩm từ Enzara để trải nghiệm sự khác biệt.</p>`,
      authorId: admin.id,
      status: "PUBLISHED",
      publishedAt: new Date(),
      tags: ["huu-co", "suc-khoe", "moi-truong"],
      readingTime: 5,
      metaTitle: "Tại sao nên sử dụng sản phẩm tẩy rửa hữu cơ? - Enzara Blog",
      metaDescription: "Tìm hiểu lý do nên chuyển sang sản phẩm tẩy rửa hữu cơ từ enzyme dứa để bảo vệ sức khỏe gia đình và môi trường.",
    },
  });

  await prisma.post.upsert({
    where: { slug: "enzyme-dua-bi-quyet-lam-sach-tu-thien-nhien" },
    update: {},
    create: {
      title: "Enzyme dứa - Bí quyết làm sạch từ thiên nhiên",
      slug: "enzyme-dua-bi-quyet-lam-sach-tu-thien-nhien",
      excerpt: "Enzyme dứa là thành phần chính trong các sản phẩm Enzara, mang đến khả năng làm sạch tự nhiên vượt trội.",
      content: `<h2>Enzyme dứa là gì?</h2>
<p>Enzyme dứa (bromelain) là một loại enzyme protease tự nhiên được chiết xuất từ quả dứa. Enzyme này có khả năng phân hủy protein, dầu mỡ và các chất hữu cơ một cách tự nhiên, giúp làm sạch hiệu quả mà không cần đến hóa chất tổng hợp.</p>

<h2>Cơ chế làm sạch của enzyme dứa</h2>
<p>Khác với các chất tẩy rửa hóa học hoạt động bằng cách hòa tan và phá vỡ cấu trúc vết bẩn, enzyme dứa hoạt động theo cơ chế sinh học. Bromelain phân cắt các liên kết peptide trong protein, biến các vết bẩn bám chặt thành các phân tử nhỏ dễ dàng rửa trôi bằng nước.</p>

<h2>Ứng dụng trong sản phẩm Enzara</h2>
<p>Tại Enzara, chúng tôi đã nghiên cứu và ứng dụng enzyme dứa vào toàn bộ dòng sản phẩm tẩy rửa:</p>
<ul>
  <li><strong>Nước rửa chén:</strong> Enzyme dứa phân hủy dầu mỡ thức ăn hiệu quả.</li>
  <li><strong>Nước rửa rau củ quả:</strong> Loại bỏ thuốc trừ sâu và vi khuẩn an toàn.</li>
  <li><strong>Gel rửa bình sữa:</strong> Phân hủy cặn sữa, an toàn cho bé.</li>
  <li><strong>Nước tẩy đa năng:</strong> Làm sạch mọi bề mặt tự nhiên.</li>
</ul>

<h2>Cam kết từ Enzara</h2>
<p>Enzara cam kết sử dụng 100% enzyme dứa tự nhiên trong sản xuất, không thêm hóa chất tổng hợp. Mỗi sản phẩm đều được kiểm nghiệm chất lượng nghiêm ngặt để đảm bảo an toàn cho người sử dụng và môi trường.</p>`,
      authorId: admin.id,
      status: "PUBLISHED",
      publishedAt: new Date(),
      tags: ["enzyme-dua", "cong-nghe", "tu-nhien"],
      readingTime: 4,
      metaTitle: "Enzyme dứa - Bí quyết làm sạch từ thiên nhiên - Enzara Blog",
      metaDescription: "Tìm hiểu về enzyme dứa (bromelain) - thành phần chính trong sản phẩm Enzara và cơ chế làm sạch tự nhiên.",
    },
  });

  console.log("2 blog posts created");

  // ============================================
  // POLICY PAGES
  // ============================================

  await prisma.page.upsert({
    where: { slug: "chinh-sach-bao-mat" },
    update: {},
    create: {
      title: "Chính sách bảo mật",
      slug: "chinh-sach-bao-mat",
      content: `<h1>Chính sách bảo mật</h1>
<p>Enzara cam kết bảo vệ quyền riêng tư và thông tin cá nhân của khách hàng. Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.</p>

<h2>1. Thông tin chúng tôi thu thập</h2>
<p>Chúng tôi thu thập các thông tin sau khi bạn sử dụng dịch vụ:</p>
<ul>
  <li>Họ tên, số điện thoại, địa chỉ email</li>
  <li>Địa chỉ giao hàng</li>
  <li>Lịch sử đặt hàng và giao dịch</li>
  <li>Thông tin thiết bị và trình duyệt khi truy cập website</li>
</ul>

<h2>2. Mục đích sử dụng thông tin</h2>
<ul>
  <li>Xử lý đơn hàng và giao hàng</li>
  <li>Liên hệ hỗ trợ khách hàng</li>
  <li>Gửi thông tin khuyến mãi và cập nhật sản phẩm (với sự đồng ý của bạn)</li>
  <li>Cải thiện chất lượng dịch vụ</li>
</ul>

<h2>3. Bảo vệ thông tin</h2>
<p>Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù hợp để bảo vệ thông tin cá nhân của bạn khỏi truy cập trái phép, mất mát hoặc phá hủy.</p>

<h2>4. Cookie</h2>
<p>Website của chúng tôi sử dụng cookie để cải thiện trải nghiệm người dùng. Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên điều này có thể ảnh hưởng đến một số tính năng của website.</p>

<h2>5. Liên hệ</h2>
<p>Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật, vui lòng liên hệ với chúng tôi qua email: info@enzara.vn hoặc hotline: 0945139990.</p>`,
      metaTitle: "Chính sách bảo mật - Enzara",
      metaDescription: "Chính sách bảo mật của Enzara. Tìm hiểu cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.",
      isActive: true,
      sortOrder: 1,
    },
  });

  await prisma.page.upsert({
    where: { slug: "chinh-sach-doi-tra" },
    update: {},
    create: {
      title: "Chính sách đổi trả",
      slug: "chinh-sach-doi-tra",
      content: `<h1>Chính sách đổi trả</h1>
<p>Enzara luôn mong muốn mang đến sự hài lòng cho khách hàng. Nếu bạn không hài lòng với sản phẩm, chúng tôi sẵn sàng hỗ trợ đổi trả theo chính sách dưới đây.</p>

<h2>1. Điều kiện đổi trả</h2>
<ul>
  <li>Sản phẩm còn nguyên bao bì, chưa qua sử dụng</li>
  <li>Sản phẩm bị lỗi do nhà sản xuất</li>
  <li>Sản phẩm giao không đúng mẫu mã hoặc số lượng đã đặt</li>
  <li>Thời gian yêu cầu đổi trả trong vòng 7 ngày kể từ ngày nhận hàng</li>
</ul>

<h2>2. Quy trình đổi trả</h2>
<ol>
  <li>Liên hệ hotline 0945139990 hoặc email info@enzara.vn để thông báo yêu cầu đổi trả</li>
  <li>Cung cấp mã đơn hàng, hình ảnh sản phẩm và lý do đổi trả</li>
  <li>Enzara xác nhận yêu cầu trong vòng 24 giờ</li>
  <li>Gửi sản phẩm về địa chỉ kho Enzara (phí ship do Enzara chịu nếu lỗi từ nhà sản xuất)</li>
  <li>Enzara kiểm tra và xử lý đổi trả trong 3-5 ngày làm việc</li>
</ol>

<h2>3. Thời gian hoàn tiền</h2>
<p>Sau khi yêu cầu đổi trả được chấp nhận, tiền sẽ được hoàn lại trong vòng 5-7 ngày làm việc qua phương thức thanh toán ban đầu.</p>

<h2>4. Trường hợp không áp dụng</h2>
<ul>
  <li>Sản phẩm đã qua sử dụng hoặc bao bì bị hư hỏng do khách hàng</li>
  <li>Yêu cầu đổi trả sau 7 ngày kể từ ngày nhận hàng</li>
  <li>Sản phẩm thuộc chương trình khuyến mãi có ghi chú không đổi trả</li>
</ul>`,
      metaTitle: "Chính sách đổi trả - Enzara",
      metaDescription: "Chính sách đổi trả sản phẩm của Enzara. Điều kiện, quy trình và thời gian hoàn tiền.",
      isActive: true,
      sortOrder: 2,
    },
  });

  await prisma.page.upsert({
    where: { slug: "dieu-khoan-su-dung" },
    update: {},
    create: {
      title: "Điều khoản sử dụng",
      slug: "dieu-khoan-su-dung",
      content: `<h1>Điều khoản sử dụng</h1>
<p>Chào mừng bạn đến với Enzara. Bằng việc truy cập và sử dụng website enzara.vn, bạn đồng ý tuân thủ các điều khoản sử dụng dưới đây.</p>

<h2>1. Tài khoản người dùng</h2>
<ul>
  <li>Bạn phải cung cấp thông tin chính xác khi đăng ký tài khoản</li>
  <li>Bạn chịu trách nhiệm bảo mật thông tin tài khoản của mình</li>
  <li>Enzara có quyền khóa tài khoản nếu phát hiện hành vi vi phạm</li>
</ul>

<h2>2. Đặt hàng và thanh toán</h2>
<ul>
  <li>Giá sản phẩm được hiển thị bằng Việt Nam Đồng (VNĐ) và đã bao gồm VAT</li>
  <li>Đơn hàng chỉ được xác nhận sau khi Enzara gửi email xác nhận</li>
  <li>Enzara có quyền từ chối hoặc hủy đơn hàng trong trường hợp sản phẩm hết hàng hoặc có lỗi về giá</li>
</ul>

<h2>3. Quyền sở hữu trí tuệ</h2>
<p>Toàn bộ nội dung trên website bao gồm văn bản, hình ảnh, logo, thiết kế đều thuộc quyền sở hữu của Enzara. Nghiêm cấm sao chép, phân phối hoặc sử dụng mà không có sự đồng ý bằng văn bản.</p>

<h2>4. Giới hạn trách nhiệm</h2>
<p>Enzara không chịu trách nhiệm cho bất kỳ thiệt hại gián tiếp nào phát sinh từ việc sử dụng sản phẩm không đúng hướng dẫn hoặc các sự cố ngoài tầm kiểm soát.</p>

<h2>5. Thay đổi điều khoản</h2>
<p>Enzara có quyền cập nhật điều khoản sử dụng bất kỳ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải trên website. Việc tiếp tục sử dụng website đồng nghĩa với việc bạn chấp nhận các thay đổi.</p>`,
      metaTitle: "Điều khoản sử dụng - Enzara",
      metaDescription: "Điều khoản sử dụng website Enzara. Quy định về tài khoản, đặt hàng, thanh toán và trách nhiệm.",
      isActive: true,
      sortOrder: 3,
    },
  });

  console.log("3 policy pages created");

  // ============================================
  // MENUS
  // ============================================

  await prisma.menu.upsert({
    where: { position: "header" },
    update: {},
    create: {
      name: "Menu chính",
      position: "header",
      items: [
        { label: "Trang chủ", url: "/", children: [] },
        {
          label: "Sản phẩm",
          url: "/products",
          children: [
            { label: "Nước rửa chén", url: "/products?category=nuoc-rua-chen" },
            { label: "Nước rửa rau củ quả", url: "/products?category=nuoc-rua-rau-cu-qua" },
            { label: "Gel rửa bình sữa", url: "/products?category=gel-rua-binh-sua" },
            { label: "Nước tẩy toilet", url: "/products?category=nuoc-tay-toilet" },
            { label: "Nước tẩy đa năng", url: "/products?category=nuoc-tay-da-nang" },
          ],
        },
        { label: "Blog", url: "/blog", children: [] },
        { label: "Liên hệ", url: "/lien-he", children: [] },
      ],
      isActive: true,
    },
  });

  await prisma.menu.upsert({
    where: { position: "footer" },
    update: {},
    create: {
      name: "Menu footer",
      position: "footer",
      items: [
        { label: "Chính sách bảo mật", url: "/pages/chinh-sach-bao-mat" },
        { label: "Chính sách đổi trả", url: "/pages/chinh-sach-doi-tra" },
        { label: "Điều khoản sử dụng", url: "/pages/dieu-khoan-su-dung" },
        { label: "Liên hệ", url: "/lien-he" },
      ],
      isActive: true,
    },
  });

  console.log("2 menus created (header, footer)");

  // ============================================
  // BANNER
  // ============================================

  const existingHeroBanner = await prisma.banner.findFirst({
    where: { position: "hero" },
  });

  if (!existingHeroBanner) {
    await prisma.banner.create({
      data: {
        title: "Enzara - Sản phẩm tẩy rửa hữu cơ từ enzyme dứa",
        image: "/uploads/banners/placeholder-hero.jpg",
        link: "/products",
        position: "hero",
        sortOrder: 0,
        isActive: true,
      },
    });
  }

  console.log("1 hero banner created");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
