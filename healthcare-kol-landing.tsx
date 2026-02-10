import React, { useState } from 'react';
import { AlertCircle, Shield, FileText, CheckCircle, Mail, User, Phone } from 'lucide-react';

export default function HealthcareKOLLanding() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Larkbase Configuration - Người dùng cần thay thế các giá trị này
  const LARKBASE_CONFIG = {
    appId: 'YOUR_APP_ID', // Thay bằng App ID từ Lark
    appSecret: 'YOUR_APP_SECRET', // Thay bằng App Secret
    tableId: 'YOUR_TABLE_ID', // Thay bằng Table ID
    baseUrl: 'https://open.larksuite.com/open-apis'
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getTenantAccessToken = async () => {
    try {
      const response = await fetch(`${LARKBASE_CONFIG.baseUrl}/auth/v3/tenant_access_token/internal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app_id: LARKBASE_CONFIG.appId,
          app_secret: LARKBASE_CONFIG.appSecret
        })
      });
      const data = await response.json();
      return data.tenant_access_token;
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  };

  const submitToLarkbase = async () => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Validate form
      if (!formData.name || !formData.email) {
        setSubmitStatus({
          type: 'error',
          message: 'Vui lòng điền đầy đủ Họ tên và Email'
        });
        setIsSubmitting(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setSubmitStatus({
          type: 'error',
          message: 'Email không hợp lệ'
        });
        setIsSubmitting(false);
        return;
      }

      // Get access token
      const token = await getTenantAccessToken();

      // Create record in Larkbase
      const response = await fetch(
        `${LARKBASE_CONFIG.baseUrl}/bitable/v1/apps/${LARKBASE_CONFIG.appId}/tables/${LARKBASE_CONFIG.tableId}/records`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              'Họ tên': formData.name,
              'Email': formData.email,
              'Số điện thoại': formData.phone,
              'Chuyên khoa': formData.specialty,
              'Ngày đăng ký': new Date().toISOString(),
              'Nguồn': 'Landing Page - Blouse Campaign'
            }
          })
        }
      );

      const result = await response.json();

      if (response.ok && result.code === 0) {
        setSubmitStatus({
          type: 'success',
          message: 'Đăng ký thành công! Tài liệu sẽ được gửi đến email của bạn trong 24h.'
        });
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          specialty: ''
        });
      } else {
        throw new Error(result.msg || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Có lỗi xảy ra. Vui lòng thử lại sau hoặc liên hệ trực tiếp với chúng tôi.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <AlertCircle size={18} />
              CẢNH BÁO PHÁP LÝ
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              KHI CHIẾC ÁO BLOUSE<br />"LÀM KINH TẾ"
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-blue-100">
              Ranh Giới Mỏng Manh Giữa "Chuyên Gia" Và "Vi Phạm Pháp Luật"
            </p>
            <p className="text-lg text-blue-100 max-w-3xl mx-auto">
              Làm sao để Bác sĩ vẫn có thể gia tăng thu nhập xứng đáng từ chuyên môn, 
              vẫn giới thiệu được sản phẩm tốt tới bệnh nhân, mà <strong>TUYỆT ĐỐI KHÔNG PHẠM LUẬT</strong> 
              và giữ trọn vẹn sự tôn nghiêm của nghề?
            </p>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            3 RỦI RO PHÁP LÝ BÁC SĨ KOL ĐANG ĐỐI MẶT
          </h2>
          <p className="text-xl text-gray-600">
            Một video viral có thể khiến bạn mất tất cả
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Risk 1 */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-red-500 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="text-red-600" size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              "Cái Bẫy" Nghị Định 15/2018/NĐ-CP
            </h3>
            <p className="text-gray-600 mb-4">
              Nghiêm cấm sử dụng hình ảnh, uy tín của bác sĩ để quảng cáo thực phẩm.
            </p>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700 font-semibold">
                Phạt: 50-70 triệu đồng
              </p>
              <p className="text-sm text-red-600 mt-1">
                + Nguy cơ vi phạm tiêu chuẩn cộng đồng
              </p>
            </div>
          </div>

          {/* Risk 2 */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-orange-500 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="text-orange-600" size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Vùng Xám: "Tư Vấn" Hay "Chỉ Định"?
            </h3>
            <p className="text-gray-600 mb-4">
              Ranh giới mong manh giữa lời khuyên dinh dưỡng và kê đơn TPCN (Thông tư 52/2017/TT-BYT).
            </p>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
              <p className="text-orange-700 font-semibold">
                Lợi dụng danh nghĩa chuyên môn
              </p>
              <p className="text-sm text-orange-600 mt-1">
                Gây hiểu nhầm cho người bệnh
              </p>
            </div>
          </div>

          {/* Risk 3 */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-yellow-500 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="text-yellow-600" size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Rủi Ro Y Đức & Niềm Tin
            </h3>
            <p className="text-gray-600 mb-4">
              Hình ảnh "Lương y" dần chuyển thành "Người bán hàng" khi livestream liên tục.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <p className="text-yellow-700 font-semibold">
                Mất vị thế chuyên môn
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                10 năm xây dựng, vài tuần để mất
              </p>
            </div>
          </div>
        </div>

        {/* Warning Note */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-6 rounded-lg mb-16">
          <p className="text-lg text-gray-800">
            <strong>⚠️ Lưu ý quan trọng:</strong> Nhiều người đang làm không sao <strong>KHÔNG CÓ NGHĨA LÀ ĐÚNG</strong>, 
            và pháp luật nói không có nghĩa là cho phép khi chưa có cơ quan nào trả lời chính thức.
          </p>
        </div>
      </div>

      {/* Solution Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              GIẢI PHÁP AN TOÀN & HỢP PHÁP
            </h2>
            <p className="text-xl text-gray-600">
              Cẩm nang được đúc kết từ kinh nghiệm vận hành hệ thống truyền thông Y Dược
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="text-green-600" size={24} />
                <h4 className="font-bold text-gray-900">Trích Lục Pháp Lý</h4>
              </div>
              <p className="text-gray-600">
                Các điểm nóng cần tránh khi làm việc với TPCN và Thiết bị y tế
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="text-green-600" size={24} />
                <h4 className="font-bold text-gray-900">Từ Khóa Cấm Kỵ</h4>
              </div>
              <p className="text-gray-600">
                Danh sách chi tiết các từ ngữ tuyệt đối tránh khi viết bài/quay video
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="text-green-600" size={24} />
                <h4 className="font-bold text-gray-900">Mô Hình Traffic</h4>
              </div>
              <p className="text-gray-600">
                Dòng chảy chuyển đổi ra đơn hàng mà không phạm luật quảng cáo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Form Section */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <FileText size={18} />
              NHẬN TÀI LIỆU MIỄN PHÍ
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              CẨM NANG PHÁP LÝ & CHIẾN LƯỢC NỘI DUNG<br />
              AN TOÀN CHO BÁC SĨ KOC
            </h2>
            <p className="text-lg text-gray-600">
              Tài liệu sẽ được gửi đến email của bạn trong vòng 24 giờ
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Họ và Tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập họ và tên của bạn"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Số Điện Thoại
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0912 345 678"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Chuyên Khoa
              </label>
              <select
                name="specialty"
                value={formData.specialty}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Chọn chuyên khoa</option>
                <option value="Nội khoa">Nội khoa</option>
                <option value="Ngoại khoa">Ngoại khoa</option>
                <option value="Sản phụ khoa">Sản phụ khoa</option>
                <option value="Nhi khoa">Nhi khoa</option>
                <option value="Da liễu">Da liễu</option>
                <option value="Tim mạch">Tim mạch</option>
                <option value="Tiêu hóa">Tiêu hóa</option>
                <option value="Dược sĩ">Dược sĩ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            {submitStatus && (
              <div className={`p-4 rounded-lg ${
                submitStatus.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {submitStatus.type === 'success' ? (
                    <CheckCircle size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                  <p className="font-medium">{submitStatus.message}</p>
                </div>
              </div>
            )}

            <button
              onClick={submitToLarkbase}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 px-8 rounded-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang gửi...
                </span>
              ) : (
                'NHẬN TÀI LIỆU MIỄN PHÍ NGAY'
              )}
            </button>

            <p className="text-sm text-gray-500 text-center">
              Bằng cách đăng ký, bạn đồng ý nhận thông tin hữu ích từ chúng tôi. 
              Chúng tôi tôn trọng quyền riêng tư của bạn.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            #TruyenThongYTe #LuatQuangCao #XayDungThuongHieuBacSi #LanhTuTe
          </p>
          <p className="text-gray-500 text-sm mt-4">
            © 2025 Healthcare Marketing Compliance. All rights reserved.
          </p>
        </div>
      </div>

      {/* Configuration Notice */}
      <div className="fixed bottom-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded shadow-lg max-w-md z-50">
        <p className="text-sm text-yellow-800 font-semibold">
          ⚙️ Cấu hình Larkbase
        </p>
        <p className="text-xs text-yellow-700 mt-1">
          Vui lòng cập nhật LARKBASE_CONFIG với App ID, App Secret và Table ID của bạn trong code.
        </p>
      </div>
    </div>
  );
}