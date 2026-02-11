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
      name: "Nước rửa chén hữu cơ",
      slug: "nuoc-rua-chen",
      description: "Nước rửa chén hữu cơ từ enzyme dứa, an toàn cho da tay và thân thiện với môi trường",
    },
    {
      name: "Nước rửa rau củ quả",
      slug: "nuoc-rua-rau-cu-qua",
      description: "Nước rửa rau củ quả an toàn từ enzyme tự nhiên, loại bỏ thuốc trừ sâu hiệu quả",
    },
    {
      name: "Gel rửa bình sữa",
      slug: "gel-rua-binh-sua",
      description: "Gel rửa bình sữa hữu cơ an toàn tuyệt đối cho bé yêu",
    },
    {
      name: "Nước tẩy toilet",
      slug: "nuoc-tay-toilet",
      description: "Nước tẩy toilet hữu cơ từ enzyme dứa, diệt khuẩn và khử mùi hiệu quả",
    },
    {
      name: "Nước tẩy đa năng",
      slug: "nuoc-tay-da-nang",
      description: "Nước tẩy rửa đa năng hữu cơ, làm sạch mọi bề mặt trong nhà",
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: cat,
    });
  }
  console.log(`${categories.length} categories created`);

  // Create default settings with full company info from enzara.vn
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
        "Sản phẩm tẩy rửa hữu cơ từ enzyme dứa tự nhiên - Sức mạnh của sự chuyển hóa Enzyme Dứa"
      ),
    },
    {
      group: "general",
      key: "companyName",
      value: JSON.stringify("CÔNG TY TNHH ENZARA VIỆT NAM"),
    },
    {
      group: "general",
      key: "taxCode",
      value: JSON.stringify("3603993402"),
    },
    {
      group: "general",
      key: "phone",
      value: JSON.stringify("0945.139.990"),
    },
    {
      group: "general",
      key: "email",
      value: JSON.stringify("lienhe@enzara.vn"),
    },
    {
      group: "general",
      key: "address",
      value: JSON.stringify(
        "Đường D22, Tổ 3, Ấp Suối Trầu, Xã Long Thành, Tỉnh Đồng Nai"
      ),
    },
    {
      group: "general",
      key: "representative",
      value: JSON.stringify("Trần Thị Ngọc Châu"),
    },
    {
      group: "general",
      key: "contentManager",
      value: JSON.stringify("Nguyễn Hoàng Anh"),
    },
    {
      group: "social",
      key: "facebook",
      value: JSON.stringify("https://www.facebook.com/EnzaraVietnam"),
    },
    {
      group: "social",
      key: "tiktok",
      value: JSON.stringify("https://www.tiktok.com/@enzara.official"),
    },
    {
      group: "social",
      key: "youtube",
      value: JSON.stringify("https://www.youtube.com/@EnzaraVietNam"),
    },
    {
      group: "social",
      key: "zaloOA",
      value: JSON.stringify("1822213360129474042"),
    },
    {
      group: "social",
      key: "messenger",
      value: JSON.stringify("413079168565168"),
    },
    {
      group: "seo",
      key: "defaultTitle",
      value: JSON.stringify(
        "Enzara - Sản phẩm tẩy rửa hữu cơ từ enzyme dứa | Sức mạnh của sự chuyển hóa Enzyme Dứa"
      ),
    },
    {
      group: "seo",
      key: "defaultDescription",
      value: JSON.stringify(
        "CÔNG TY TNHH ENZARA VIỆT NAM - Sản phẩm tẩy rửa hữu cơ từ enzyme dứa tự nhiên. Không gây kích ứng da, an toàn cho trẻ nhỏ, thân thiện với môi trường. Ship COD toàn quốc."
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
  // PRODUCTS (prices from enzara.vn)
  // ============================================

  // Look up category IDs by slug
  const catNuocRuaChen = await prisma.category.findUnique({ where: { slug: "nuoc-rua-chen" } });
  const catNuocRuaRauCuQua = await prisma.category.findUnique({ where: { slug: "nuoc-rua-rau-cu-qua" } });
  const catGelRuaBinhSua = await prisma.category.findUnique({ where: { slug: "gel-rua-binh-sua" } });
  const catNuocTayToilet = await prisma.category.findUnique({ where: { slug: "nuoc-tay-toilet" } });
  const catNuocTayDaNang = await prisma.category.findUnique({ where: { slug: "nuoc-tay-da-nang" } });

  // Product 1: Nước Rửa Chén Hữu Cơ ENZARA Hương Dứa
  const product1 = await prisma.product.upsert({
    where: { slug: "nuoc-rua-chen-huu-co-enzara-huong-dua" },
    update: {
      basePrice: 75000,
      salePrice: 50000,
    },
    create: {
      name: "Nước Rửa Chén Hữu Cơ ENZARA Hương Dứa",
      slug: "nuoc-rua-chen-huu-co-enzara-huong-dua",
      shortDesc: "Chứa Enzyme Bromelain từ dứa, khả năng phân hủy dầu mỡ mạnh mẽ. An toàn cho da tay, thân thiện với môi trường.",
      description: `<h2>Nước Rửa Chén Hữu Cơ ENZARA Hương Dứa</h2>
<p>Sản phẩm nước rửa chén hữu cơ ENZARA được chiết xuất từ Enzyme Bromelain có trong quả dứa, mang đến khả năng phân hủy dầu mỡ mạnh mẽ và tự nhiên. Quy trình lên men 90 ngày biến vỏ dứa thành giải pháp tẩy rửa xanh.</p>

<h3>Thành phần Enzyme chính</h3>
<ul>
  <li><strong>Enzyme Bromelain:</strong> Enzyme chính và quan trọng nhất trong quả dứa, có khả năng phân hủy protein mạnh mẽ</li>
  <li><strong>Enzyme Peroxidase:</strong> Có khả năng khử trùng, giúp loại bỏ các vi khuẩn và vi sinh vật có hại</li>
  <li><strong>Enzyme Cellulase:</strong> Giúp phân giải cellulose, phá vỡ cấu trúc vết bẩn</li>
  <li><strong>Enzyme Amylase:</strong> Giúp phá vỡ cấu trúc tinh bột, làm vết bẩn dễ hòa tan</li>
</ul>

<h3>Ưu điểm nổi bật</h3>
<ul>
  <li>Không gây kích ứng da, an toàn cho trẻ nhỏ</li>
  <li>Không làm ô nhiễm nguồn nước</li>
  <li>Giúp phân hủy chất cặn bẩn trong đường ống và cống rãnh</li>
  <li>Giảm thiểu hóa chất độc hại</li>
  <li>Hương dứa tự nhiên thơm mát</li>
</ul>

<h3>Hướng dẫn sử dụng</h3>
<p>Cho 2-3ml nước rửa chén vào miếng rửa ẩm, tạo bọt và rửa sạch chén bát. Xả lại bằng nước sạch. Có thể pha loãng với nước theo tỷ lệ 1:3 để tiết kiệm hơn.</p>`,
      categoryId: catNuocRuaChen?.id,
      brandId: brand.id,
      basePrice: 75000,
      salePrice: 50000,
      sku: "ENZ-NRC-DUA",
      stockQuantity: 200,
      weight: 550,
      isFeatured: true,
      tags: ["huu-co", "enzyme-dua", "an-toan", "huong-dua"],
      metaTitle: "Nước Rửa Chén Hữu Cơ ENZARA Hương Dứa - Giảm 33%",
      metaDescription: "Nước rửa chén hữu cơ ENZARA hương dứa chứa Enzyme Bromelain. Giá gốc 75.000đ chỉ còn 50.000đ. An toàn cho da tay, thân thiện môi trường.",
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: product1.id } });
  await prisma.productImage.create({
    data: {
      productId: product1.id,
      url: "/uploads/products/nuoc-rua-chen-huong-dua.jpg",
      altText: "Nước Rửa Chén Hữu Cơ ENZARA Hương Dứa",
      sortOrder: 0,
      isPrimary: true,
    },
  });

  // Product 2: Nước Rửa Chén Hữu Cơ ENZARA Chiết Xuất Dịch Gừng Tươi
  const product2 = await prisma.product.upsert({
    where: { slug: "nuoc-rua-chen-huu-co-enzara-chiet-xuat-gung" },
    update: {
      basePrice: 75000,
      salePrice: 50000,
    },
    create: {
      name: "Nước Rửa Chén Hữu Cơ ENZARA Chiết Xuất Dịch Gừng Tươi",
      slug: "nuoc-rua-chen-huu-co-enzara-chiet-xuat-gung",
      shortDesc: "Kết hợp enzyme dứa và chiết xuất dịch gừng tươi, khả năng khử mùi tanh vượt trội. Đánh giá 5/5 sao.",
      description: `<h2>Nước Rửa Chén Hữu Cơ ENZARA Chiết Xuất Dịch Gừng Tươi</h2>
<p>Sự kết hợp hoàn hảo giữa Enzyme Bromelain từ dứa và chiết xuất dịch gừng tươi, mang đến khả năng tẩy rửa vượt trội cùng khả năng khử mùi tanh đặc biệt hiệu quả.</p>

<h3>Thành phần đặc biệt</h3>
<ul>
  <li><strong>Enzyme Bromelain:</strong> Phân hủy dầu mỡ và protein mạnh mẽ</li>
  <li><strong>Chiết xuất gừng tươi:</strong> Khử mùi tanh cá, hải sản hiệu quả</li>
  <li><strong>Enzyme Peroxidase:</strong> Diệt khuẩn tự nhiên</li>
</ul>

<h3>Ưu điểm nổi bật</h3>
<ul>
  <li>Khử mùi tanh cá, hải sản hiệu quả nhờ dịch gừng tươi</li>
  <li>Không gây kích ứng da, an toàn cho trẻ nhỏ</li>
  <li>Không làm ô nhiễm nguồn nước</li>
  <li>Hương gừng tự nhiên ấm áp, dễ chịu</li>
  <li>Được đánh giá 5/5 sao bởi khách hàng</li>
</ul>

<h3>Hướng dẫn sử dụng</h3>
<p>Cho 2-3ml nước rửa chén vào miếng rửa ẩm, tạo bọt và rửa sạch chén bát. Đặc biệt hiệu quả với chén bát dính mùi tanh từ cá và hải sản.</p>`,
      categoryId: catNuocRuaChen?.id,
      brandId: brand.id,
      basePrice: 75000,
      salePrice: 50000,
      sku: "ENZ-NRC-GUNG",
      stockQuantity: 200,
      weight: 550,
      isFeatured: true,
      avgRating: 5.0,
      tags: ["huu-co", "enzyme-dua", "an-toan", "gung-tuoi", "khu-mui-tanh"],
      metaTitle: "Nước Rửa Chén Hữu Cơ ENZARA Chiết Xuất Dịch Gừng Tươi - Giảm 33%",
      metaDescription: "Nước rửa chén hữu cơ ENZARA chiết xuất dịch gừng tươi. Giá gốc 75.000đ chỉ còn 50.000đ. Khử mùi tanh hiệu quả, an toàn cho da tay.",
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: product2.id } });
  await prisma.productImage.create({
    data: {
      productId: product2.id,
      url: "/uploads/products/nuoc-rua-chen-gung-tuoi.jpg",
      altText: "Nước Rửa Chén Hữu Cơ ENZARA Chiết Xuất Dịch Gừng Tươi",
      sortOrder: 0,
      isPrimary: true,
    },
  });

  // Product 3: Nước Rửa Rau Củ Quả ENZARA Hương Dứa
  const product3 = await prisma.product.upsert({
    where: { slug: "nuoc-rua-rau-cu-qua-enzara-huong-dua" },
    update: {
      basePrice: 85000,
      salePrice: 60000,
    },
    create: {
      name: "Nước Rửa Rau Củ Quả ENZARA Hương Dứa",
      slug: "nuoc-rua-rau-cu-qua-enzara-huong-dua",
      shortDesc: "Loại bỏ đến 99% thuốc trừ sâu trên bề mặt rau củ quả. An toàn cho cả gia đình kể cả trẻ nhỏ.",
      description: `<h2>Nước Rửa Rau Củ Quả ENZARA Hương Dứa</h2>
<p>Nước rửa rau củ quả ENZARA giúp loại bỏ thuốc trừ sâu, vi khuẩn và tạp chất bám trên bề mặt rau củ quả một cách an toàn và hiệu quả nhờ Enzyme Bromelain từ dứa.</p>

<h3>Ưu điểm nổi bật</h3>
<ul>
  <li>Loại bỏ đến 99% thuốc trừ sâu trên bề mặt</li>
  <li>Thành phần từ enzyme dứa tự nhiên 100%</li>
  <li>Không để lại dư lượng hóa chất trên thực phẩm</li>
  <li>An toàn cho cả gia đình, kể cả trẻ nhỏ</li>
  <li>Hương dứa tự nhiên dịu nhẹ</li>
</ul>

<h3>Hướng dẫn sử dụng</h3>
<p>Pha 5-10ml nước rửa vào 1 lít nước sạch. Ngâm rau củ quả trong 5-10 phút, sau đó xả lại bằng nước sạch.</p>`,
      categoryId: catNuocRuaRauCuQua?.id,
      brandId: brand.id,
      basePrice: 85000,
      salePrice: 60000,
      sku: "ENZ-RCQ-DUA",
      stockQuantity: 150,
      weight: 450,
      isFeatured: true,
      tags: ["huu-co", "rau-cu", "an-toan", "thuoc-tru-sau"],
      metaTitle: "Nước Rửa Rau Củ Quả ENZARA Hương Dứa - Giảm 29%",
      metaDescription: "Nước rửa rau củ quả hữu cơ ENZARA hương dứa. Giá gốc 85.000đ chỉ còn 60.000đ. Loại bỏ 99% thuốc trừ sâu, an toàn cho cả gia đình.",
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: product3.id } });
  await prisma.productImage.create({
    data: {
      productId: product3.id,
      url: "/uploads/products/nuoc-rua-rau-cu-qua.jpg",
      altText: "Nước Rửa Rau Củ Quả ENZARA Hương Dứa",
      sortOrder: 0,
      isPrimary: true,
    },
  });

  // Product 4: Gel Rửa Bình Sữa Hữu Cơ ENZARA
  const product4 = await prisma.product.upsert({
    where: { slug: "gel-rua-binh-sua-huu-co-enzara" },
    update: {
      basePrice: 79000,
      salePrice: 60000,
    },
    create: {
      name: "Gel Rửa Bình Sữa Hữu Cơ ENZARA",
      slug: "gel-rua-binh-sua-huu-co-enzara",
      shortDesc: "An toàn tuyệt đối cho bé yêu. 100% từ enzyme dứa tự nhiên, không hóa chất, không gây kích ứng.",
      description: `<h2>Gel Rửa Bình Sữa Hữu Cơ ENZARA</h2>
<p>Gel rửa bình sữa ENZARA được nghiên cứu và phát triển đặc biệt dành cho các bé. Thành phần từ enzyme dứa tự nhiên, đảm bảo an toàn tuyệt đối khi rửa bình sữa, núm ti và đồ chơi của bé.</p>

<h3>Ưu điểm nổi bật</h3>
<ul>
  <li>100% từ enzyme dứa tự nhiên, không hóa chất</li>
  <li>An toàn cho bé từ sơ sinh</li>
  <li>Loại bỏ cặn sữa, dầu mỡ hiệu quả</li>
  <li>Không mùi, không gây kích ứng</li>
  <li>Dạng gel dễ sử dụng, tiết kiệm</li>
</ul>

<h3>Hướng dẫn sử dụng</h3>
<p>Cho 1-2ml gel vào cọ rửa bình, chà sạch bên trong và ngoài bình sữa. Xả kỹ bằng nước sạch 2-3 lần trước khi sử dụng.</p>`,
      categoryId: catGelRuaBinhSua?.id,
      brandId: brand.id,
      basePrice: 79000,
      salePrice: 60000,
      sku: "ENZ-GBS-HC",
      stockQuantity: 100,
      weight: 350,
      isFeatured: true,
      tags: ["binh-sua", "an-toan-cho-be", "enzyme-dua", "huu-co"],
      metaTitle: "Gel Rửa Bình Sữa Hữu Cơ ENZARA - Giảm 24%",
      metaDescription: "Gel rửa bình sữa hữu cơ ENZARA từ enzyme dứa. Giá gốc 79.000đ chỉ còn 60.000đ. An toàn tuyệt đối cho bé yêu từ sơ sinh.",
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: product4.id } });
  await prisma.productImage.create({
    data: {
      productId: product4.id,
      url: "/uploads/products/gel-rua-binh-sua.jpg",
      altText: "Gel Rửa Bình Sữa Hữu Cơ ENZARA",
      sortOrder: 0,
      isPrimary: true,
    },
  });

  // Product 5: Nước Tẩy Toilet Hữu Cơ ENZARA
  const product5 = await prisma.product.upsert({
    where: { slug: "nuoc-tay-toilet-huu-co-enzara" },
    update: {
      basePrice: 79000,
      salePrice: 60000,
    },
    create: {
      name: "Nước Tẩy Toilet Hữu Cơ ENZARA",
      slug: "nuoc-tay-toilet-huu-co-enzara",
      shortDesc: "Tẩy sạch vết bẩn cứng đầu, diệt khuẩn và khử mùi hiệu quả. Không ăn mòn đường ống.",
      description: `<h2>Nước Tẩy Toilet Hữu Cơ ENZARA</h2>
<p>Nước tẩy toilet ENZARA với thành phần từ enzyme dứa tự nhiên, giúp tẩy sạch vết bẩn cứng đầu, diệt khuẩn và khử mùi hiệu quả mà không gây hại cho đường ống và môi trường.</p>

<h3>Ưu điểm nổi bật</h3>
<ul>
  <li>Tẩy sạch vết bẩn, cặn canxi cứng đầu</li>
  <li>Diệt 99.9% vi khuẩn gây hại</li>
  <li>Khử mùi hôi hiệu quả, để lại hương thơm dịu nhẹ</li>
  <li>Không ăn mòn bề mặt sứ và đường ống</li>
  <li>Giúp phân hủy chất cặn bẩn trong đường ống và cống rãnh</li>
  <li>Thân thiện với môi trường</li>
</ul>

<h3>Hướng dẫn sử dụng</h3>
<p>Xịt trực tiếp lên bề mặt bồn cầu, để trong 5-10 phút rồi chà và xả nước. Sử dụng 2-3 lần/tuần để giữ toilet luôn sạch sẽ.</p>`,
      categoryId: catNuocTayToilet?.id,
      brandId: brand.id,
      basePrice: 79000,
      salePrice: 60000,
      sku: "ENZ-NTT-HC",
      stockQuantity: 180,
      weight: 550,
      isFeatured: true,
      tags: ["toilet", "tay-rua", "huu-co", "diet-khuan"],
      metaTitle: "Nước Tẩy Toilet Hữu Cơ ENZARA - Giảm 24%",
      metaDescription: "Nước tẩy toilet hữu cơ ENZARA. Giá gốc 79.000đ chỉ còn 60.000đ. Diệt khuẩn, khử mùi, tẩy sạch vết bẩn cứng đầu an toàn.",
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: product5.id } });
  await prisma.productImage.create({
    data: {
      productId: product5.id,
      url: "/uploads/products/nuoc-tay-toilet.jpg",
      altText: "Nước Tẩy Toilet Hữu Cơ ENZARA",
      sortOrder: 0,
      isPrimary: true,
    },
  });

  // Product 6: Tẩy Đa Năng ENZARA Hữu Cơ Hương Cam
  const product6 = await prisma.product.upsert({
    where: { slug: "tay-da-nang-enzara-huu-co-huong-cam" },
    update: {
      basePrice: 69000,
      salePrice: 50000,
    },
    create: {
      name: "Tẩy Đa Năng ENZARA Hữu Cơ Hương Cam",
      slug: "tay-da-nang-enzara-huu-co-huong-cam",
      shortDesc: "Làm sạch mọi bề mặt trong nhà: sàn nhà, bếp, kính, đồ nội thất. Hương cam tự nhiên thơm mát.",
      description: `<h2>Tẩy Đa Năng ENZARA Hữu Cơ Hương Cam</h2>
<p>Nước tẩy đa năng ENZARA với hương cam tự nhiên, phù hợp để làm sạch mọi bề mặt trong nhà: sàn nhà, bếp, kính, đồ nội thất và nhiều hơn nữa.</p>

<h3>Ưu điểm nổi bật</h3>
<ul>
  <li>Đa năng: sử dụng cho mọi bề mặt trong nhà</li>
  <li>Hương cam tự nhiên thơm mát, dễ chịu</li>
  <li>Enzyme dứa giúp phân hủy dầu mỡ và vết bẩn</li>
  <li>Không gây hại bề mặt, không để lại vệt</li>
  <li>An toàn cho gia đình có trẻ nhỏ và thú cưng</li>
  <li>Không gây kích ứng da</li>
</ul>

<h3>Hướng dẫn sử dụng</h3>
<p>Pha 30-50ml nước tẩy vào 1 lít nước. Dùng khăn lau sạch bề mặt. Với vết bẩn cứng đầu, xịt trực tiếp và để 5 phút trước khi lau sạch.</p>`,
      categoryId: catNuocTayDaNang?.id,
      brandId: brand.id,
      basePrice: 69000,
      salePrice: 50000,
      sku: "ENZ-TDN-CAM",
      stockQuantity: 160,
      weight: 550,
      isFeatured: true,
      tags: ["da-nang", "huong-cam", "huu-co", "tay-rua"],
      metaTitle: "Tẩy Đa Năng ENZARA Hữu Cơ Hương Cam - Giảm 28%",
      metaDescription: "Tẩy đa năng hữu cơ ENZARA hương cam. Giá gốc 69.000đ chỉ còn 50.000đ. Làm sạch mọi bề mặt, an toàn cho gia đình.",
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: product6.id } });
  await prisma.productImage.create({
    data: {
      productId: product6.id,
      url: "/uploads/products/tay-da-nang-huong-cam.jpg",
      altText: "Tẩy Đa Năng ENZARA Hữu Cơ Hương Cam",
      sortOrder: 0,
      isPrimary: true,
    },
  });

  console.log("6 products created with images");

  // ============================================
  // BLOG POSTS
  // ============================================

  await prisma.post.upsert({
    where: { slug: "cau-chuyen-khoi-nghiep-enzara" },
    update: {},
    create: {
      title: "Câu Chuyện Khởi Nghiệp: Hành Trình Biến Phế Phẩm Thành Sản Phẩm Xanh",
      slug: "cau-chuyen-khoi-nghiep-enzara",
      excerpt: "Xuất phát từ khóa học 'Đánh Thức Sự Giàu Có', gặp dự án cộng đồng nghiên cứu Enzyme sinh học tại Gia Lai, hành trình Enzara bắt đầu.",
      content: `<h2>Câu Chuyện Khởi Nghiệp ENZARA</h2>
<p>Câu chuyện ENZARA bắt đầu từ khóa học "Đánh Thức Sự Giàu Có", nơi chúng tôi gặp dự án cộng đồng nghiên cứu Enzyme sinh học tại Gia Lai. Từ đó, ý tưởng biến phế phẩm nông nghiệp thành sản phẩm có giá trị được hình thành.</p>

<h3>Tận dụng phế phẩm nông nghiệp</h3>
<p>Vỏ dứa và dứa dạt - những thứ thường bị bỏ đi - chính là nguyên liệu quý giá để sản xuất Enzyme. Quy trình lên men 90 ngày biến những phế phẩm này thành giải pháp tẩy rửa xanh, an toàn cho sức khỏe con người và thân thiện với môi trường.</p>

<h3>Sứ mệnh của ENZARA</h3>
<p>"Không chỉ tạo ra sản phẩm an toàn cho sức khỏe, mà còn giúp nông dân nâng cao giá trị nông sản" - đó là sứ mệnh mà ENZARA theo đuổi từ ngày đầu thành lập.</p>

<h3>Hỗ trợ nông dân</h3>
<p>ENZARA thu mua vỏ dứa và dứa dạt từ nông dân, giúp họ có đầu ra ổn định và tăng thu nhập. Mỗi chai sản phẩm ENZARA không chỉ là giải pháp tẩy rửa xanh mà còn góp phần vào sự phát triển bền vững của cộng đồng nông nghiệp.</p>`,
      authorId: admin.id,
      status: "PUBLISHED",
      publishedAt: new Date(),
      tags: ["khoi-nghiep", "cau-chuyen", "enzyme-dua", "nong-dan"],
      readingTime: 5,
      metaTitle: "Câu Chuyện Khởi Nghiệp ENZARA - Biến Phế Phẩm Thành Sản Phẩm Xanh",
      metaDescription: "Câu chuyện khởi nghiệp ENZARA - hành trình biến vỏ dứa và dứa dạt thành sản phẩm tẩy rửa hữu cơ, giúp nông dân nâng cao giá trị nông sản.",
    },
  });

  await prisma.post.upsert({
    where: { slug: "enzyme-dua-hanh-trinh-90-ngay" },
    update: {},
    create: {
      title: "Enzyme từ Dứa - Hành trình 90 ngày lên men tự nhiên",
      slug: "enzyme-dua-hanh-trinh-90-ngay",
      excerpt: "Quy trình lên men 90 ngày biến vỏ dứa thành giải pháp tẩy rửa xanh với 4 loại enzyme tự nhiên: Bromelain, Peroxidase, Cellulase và Amylase.",
      content: `<h2>Enzyme từ Dứa - Hành trình 90 ngày</h2>
<p>Mỗi chai sản phẩm ENZARA đều trải qua quy trình lên men 90 ngày tự nhiên, biến vỏ dứa thành dung dịch enzyme có khả năng tẩy rửa vượt trội.</p>

<h3>4 Enzyme chính trong sản phẩm ENZARA</h3>

<h4>1. Enzyme Bromelain</h4>
<p>Enzyme chính và quan trọng nhất trong quả dứa, có khả năng phân hủy protein mạnh mẽ. Bromelain phân cắt các liên kết peptide, biến các vết bẩn bám chặt thành các phân tử nhỏ dễ rửa trôi.</p>

<h4>2. Enzyme Peroxidase</h4>
<p>Là một enzyme có khả năng khử trùng, giúp loại bỏ các vi khuẩn và vi sinh vật có hại trên bề mặt chén bát, rau củ quả.</p>

<h4>3. Enzyme Cellulase</h4>
<p>Cellulase giúp phân giải cellulose, một loại carbohydrate cấu thành thành tế bào của thực vật. Điều này giúp loại bỏ các vết bẩn từ thực vật hiệu quả.</p>

<h4>4. Enzyme Amylase</h4>
<p>Enzyme Amylase giúp phá vỡ cấu trúc tinh bột, làm vết bẩn dễ hòa tan và rửa sạch dễ dàng hơn.</p>

<h3>Lợi ích của sản phẩm Enzyme tự nhiên</h3>
<ul>
  <li>Không gây kích ứng da, an toàn cho trẻ nhỏ</li>
  <li>Không làm ô nhiễm nguồn nước</li>
  <li>Giúp phân hủy chất cặn bẩn trong đường ống và cống rãnh</li>
  <li>Giảm thiểu hóa chất độc hại trong gia đình</li>
</ul>`,
      authorId: admin.id,
      status: "PUBLISHED",
      publishedAt: new Date(),
      tags: ["enzyme-dua", "bromelain", "len-men", "tu-nhien"],
      readingTime: 4,
      metaTitle: "Enzyme từ Dứa - Hành trình 90 ngày lên men tự nhiên - Enzara Blog",
      metaDescription: "Tìm hiểu về 4 loại enzyme tự nhiên trong sản phẩm ENZARA: Bromelain, Peroxidase, Cellulase, Amylase và quy trình lên men 90 ngày.",
    },
  });

  await prisma.post.upsert({
    where: { slug: "tai-sao-nen-su-dung-san-pham-tay-rua-huu-co" },
    update: {},
    create: {
      title: "Tại sao nên sử dụng sản phẩm tẩy rửa hữu cơ?",
      slug: "tai-sao-nen-su-dung-san-pham-tay-rua-huu-co",
      excerpt: "Tìm hiểu lý do ngày càng nhiều gia đình Việt Nam chuyển sang sử dụng sản phẩm tẩy rửa hữu cơ để bảo vệ sức khỏe và môi trường.",
      content: `<h2>Xu hướng sử dụng sản phẩm tẩy rửa hữu cơ</h2>
<p>Trong những năm gần đây, ngày càng nhiều gia đình Việt Nam quan tâm đến việc sử dụng các sản phẩm tẩy rửa hữu cơ thay thế cho các sản phẩm hóa chất truyền thống.</p>

<h3>Tác hại của hóa chất tẩy rửa truyền thống</h3>
<p>Các sản phẩm tẩy rửa thông thường chứa nhiều hóa chất độc hại như SLS, phosphate, chlorine. Những hóa chất này gây kích ứng da, ảnh hưởng hệ hô hấp và gây ô nhiễm nguồn nước.</p>

<h3>Lợi ích của sản phẩm tẩy rửa hữu cơ ENZARA</h3>
<ul>
  <li><strong>An toàn cho sức khỏe:</strong> Không chứa hóa chất độc hại, an toàn cho da tay</li>
  <li><strong>Thân thiện môi trường:</strong> Phân hủy sinh học hoàn toàn, không gây ô nhiễm nguồn nước</li>
  <li><strong>Hiệu quả làm sạch:</strong> Enzyme dứa có khả năng phân hủy protein và dầu mỡ tự nhiên</li>
  <li><strong>An toàn cho trẻ nhỏ:</strong> Không để lại dư lượng hóa chất trên bát đĩa</li>
</ul>`,
      authorId: admin.id,
      status: "PUBLISHED",
      publishedAt: new Date(),
      tags: ["huu-co", "suc-khoe", "moi-truong"],
      readingTime: 5,
      metaTitle: "Tại sao nên sử dụng sản phẩm tẩy rửa hữu cơ? - Enzara Blog",
      metaDescription: "Tìm hiểu lý do nên chuyển sang sản phẩm tẩy rửa hữu cơ từ enzyme dứa để bảo vệ sức khỏe gia đình và môi trường.",
    },
  });

  console.log("3 blog posts created");

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
<p>CÔNG TY TNHH ENZARA VIỆT NAM cam kết bảo vệ quyền riêng tư và thông tin cá nhân của khách hàng.</p>

<h2>1. Thông tin chúng tôi thu thập</h2>
<ul>
  <li>Họ tên, số điện thoại, địa chỉ email</li>
  <li>Địa chỉ giao hàng</li>
  <li>Lịch sử đặt hàng và giao dịch</li>
</ul>

<h2>2. Mục đích sử dụng</h2>
<ul>
  <li>Xử lý đơn hàng và giao hàng</li>
  <li>Liên hệ hỗ trợ khách hàng</li>
  <li>Gửi thông tin khuyến mãi (với sự đồng ý)</li>
</ul>

<h2>3. Liên hệ</h2>
<p>Email: lienhe@enzara.vn | Hotline: 0945.139.990</p>
<p>Địa chỉ: Đường D22, Tổ 3, Ấp Suối Trầu, Xã Long Thành, Tỉnh Đồng Nai</p>`,
      metaTitle: "Chính sách bảo mật - Enzara",
      metaDescription: "Chính sách bảo mật của CÔNG TY TNHH ENZARA VIỆT NAM.",
      isActive: true,
      sortOrder: 1,
    },
  });

  await prisma.page.upsert({
    where: { slug: "chinh-sach-doi-tra" },
    update: {},
    create: {
      title: "Chính sách đổi trả và hoàn tiền",
      slug: "chinh-sach-doi-tra",
      content: `<h1>Chính sách đổi trả và hoàn tiền</h1>
<p>ENZARA cam kết miễn phí đổi – trả với sản phẩm lỗi.</p>

<h2>1. Điều kiện đổi trả</h2>
<ul>
  <li>Sản phẩm còn nguyên bao bì, chưa qua sử dụng</li>
  <li>Sản phẩm bị lỗi do nhà sản xuất</li>
  <li>Sản phẩm giao không đúng mẫu mã hoặc số lượng</li>
  <li>Thời gian yêu cầu đổi trả: 7 ngày kể từ ngày nhận hàng</li>
</ul>

<h2>2. Quy trình</h2>
<ol>
  <li>Liên hệ hotline 0945.139.990 hoặc email lienhe@enzara.vn</li>
  <li>Cung cấp mã đơn hàng, hình ảnh và lý do đổi trả</li>
  <li>ENZARA xác nhận trong 24 giờ</li>
  <li>Hoàn tiền trong 5-7 ngày làm việc</li>
</ol>`,
      metaTitle: "Chính sách đổi trả và hoàn tiền - Enzara",
      metaDescription: "Chính sách đổi trả và hoàn tiền của ENZARA. Miễn phí đổi trả với sản phẩm lỗi.",
      isActive: true,
      sortOrder: 2,
    },
  });

  await prisma.page.upsert({
    where: { slug: "chinh-sach-mua-hang" },
    update: {},
    create: {
      title: "Chính sách mua hàng và thanh toán",
      slug: "chinh-sach-mua-hang",
      content: `<h1>Chính sách mua hàng và thanh toán</h1>

<h2>1. Ship COD toàn quốc</h2>
<p>ENZARA hỗ trợ giao hàng COD (thanh toán khi nhận hàng) trên toàn quốc.</p>

<h2>2. Phương thức thanh toán</h2>
<ul>
  <li>Thanh toán khi nhận hàng (COD)</li>
  <li>Chuyển khoản ngân hàng</li>
</ul>

<h2>3. Ưu đãi</h2>
<ul>
  <li>Ưu đãi thành viên - Đăng ký nhận ưu đãi hàng tuần</li>
  <li>Ưu đãi Combo - Mua theo Combo, càng mua càng rẻ</li>
</ul>

<h2>4. Liên hệ</h2>
<p>Hotline: 0945.139.990 | Email: lienhe@enzara.vn</p>`,
      metaTitle: "Chính sách mua hàng và thanh toán - Enzara",
      metaDescription: "Chính sách mua hàng và thanh toán của ENZARA. Ship COD toàn quốc, thanh toán khi nhận hàng.",
      isActive: true,
      sortOrder: 3,
    },
  });

  await prisma.page.upsert({
    where: { slug: "dieu-khoan-su-dung" },
    update: {},
    create: {
      title: "Điều khoản sử dụng",
      slug: "dieu-khoan-su-dung",
      content: `<h1>Điều khoản sử dụng</h1>
<p>Chào mừng bạn đến với ENZARA. Bằng việc truy cập và sử dụng website, bạn đồng ý tuân thủ các điều khoản dưới đây.</p>

<h2>1. Thông tin công ty</h2>
<p>CÔNG TY TNHH ENZARA VIỆT NAM | MST: 3603993402</p>
<p>Địa chỉ: Đường D22, Tổ 3, Ấp Suối Trầu, Xã Long Thành, Tỉnh Đồng Nai</p>
<p>Người đại diện: Trần Thị Ngọc Châu</p>

<h2>2. Đặt hàng và thanh toán</h2>
<ul>
  <li>Giá sản phẩm bằng Việt Nam Đồng (VNĐ) và đã bao gồm VAT</li>
  <li>Đơn hàng được xác nhận qua điện thoại hoặc email</li>
</ul>

<h2>3. Quyền sở hữu trí tuệ</h2>
<p>Toàn bộ nội dung trên website thuộc quyền sở hữu của CÔNG TY TNHH ENZARA VIỆT NAM.</p>`,
      metaTitle: "Điều khoản sử dụng - Enzara",
      metaDescription: "Điều khoản sử dụng website ENZARA. Quy định về đặt hàng, thanh toán và trách nhiệm.",
      isActive: true,
      sortOrder: 4,
    },
  });

  console.log("4 policy pages created");

  // ============================================
  // MENUS
  // ============================================

  await prisma.menu.upsert({
    where: { position: "header" },
    update: {
      items: [
        { label: "Trang chủ", url: "/", children: [] },
        {
          label: "Sản phẩm",
          url: "/products",
          children: [
            { label: "Nước rửa chén hữu cơ", url: "/products?category=nuoc-rua-chen" },
            { label: "Nước rửa rau củ quả", url: "/products?category=nuoc-rua-rau-cu-qua" },
            { label: "Gel rửa bình sữa", url: "/products?category=gel-rua-binh-sua" },
            { label: "Nước tẩy toilet", url: "/products?category=nuoc-tay-toilet" },
            { label: "Nước tẩy đa năng", url: "/products?category=nuoc-tay-da-nang" },
          ],
        },
        { label: "Giới thiệu", url: "/pages/gioi-thieu", children: [] },
        { label: "Blog", url: "/blog", children: [] },
        { label: "Liên hệ", url: "/lien-he", children: [] },
      ],
    },
    create: {
      name: "Menu chính",
      position: "header",
      items: [
        { label: "Trang chủ", url: "/", children: [] },
        {
          label: "Sản phẩm",
          url: "/products",
          children: [
            { label: "Nước rửa chén hữu cơ", url: "/products?category=nuoc-rua-chen" },
            { label: "Nước rửa rau củ quả", url: "/products?category=nuoc-rua-rau-cu-qua" },
            { label: "Gel rửa bình sữa", url: "/products?category=gel-rua-binh-sua" },
            { label: "Nước tẩy toilet", url: "/products?category=nuoc-tay-toilet" },
            { label: "Nước tẩy đa năng", url: "/products?category=nuoc-tay-da-nang" },
          ],
        },
        { label: "Giới thiệu", url: "/pages/gioi-thieu", children: [] },
        { label: "Blog", url: "/blog", children: [] },
        { label: "Liên hệ", url: "/lien-he", children: [] },
      ],
      isActive: true,
    },
  });

  await prisma.menu.upsert({
    where: { position: "footer" },
    update: {
      items: [
        { label: "Chính sách bảo mật", url: "/pages/chinh-sach-bao-mat" },
        { label: "Chính sách đổi trả", url: "/pages/chinh-sach-doi-tra" },
        { label: "Chính sách mua hàng", url: "/pages/chinh-sach-mua-hang" },
        { label: "Điều khoản sử dụng", url: "/pages/dieu-khoan-su-dung" },
        { label: "Liên hệ", url: "/lien-he" },
      ],
    },
    create: {
      name: "Menu footer",
      position: "footer",
      items: [
        { label: "Chính sách bảo mật", url: "/pages/chinh-sach-bao-mat" },
        { label: "Chính sách đổi trả", url: "/pages/chinh-sach-doi-tra" },
        { label: "Chính sách mua hàng", url: "/pages/chinh-sach-mua-hang" },
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
        title: "Sức mạnh của sự chuyển hóa Enzyme Dứa",
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
