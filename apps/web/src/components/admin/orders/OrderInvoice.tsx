"use client";

interface OrderInvoiceProps {
  order: {
    orderNumber: string;
    createdAt: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    customer?: { fullName: string; email: string; phone: string };
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    shippingWard: string;
    shippingDistrict: string;
    shippingProvince: string;
    items: Array<{
      productName: string;
      variantName?: string;
      sku?: string;
      price: number;
      quantity: number;
      total: number;
    }>;
    subtotal: number;
    discountAmount: number;
    shippingFee: number;
    total: number;
    note?: string;
    voucherCode?: string;
  };
}

function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function formatInvoiceDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  SEPAY_QR: "Chuyển khoản QR",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
};

export function OrderInvoice({ order }: OrderInvoiceProps) {
  const fullAddress = [
    order.shippingAddress,
    order.shippingWard,
    order.shippingDistrict,
    order.shippingProvince,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      id="print-invoice"
      style={{
        display: "none",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        color: "#1a1a1a",
        fontSize: "13px",
        lineHeight: "1.5",
        maxWidth: "210mm",
        margin: "0 auto",
        padding: "0",
        background: "#fff",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          paddingBottom: "16px",
          borderBottom: "3px solid #047857",
          marginBottom: "24px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#047857",
              letterSpacing: "2px",
            }}
          >
            ENZARA
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            Thời trang chất lượng
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: "12px", color: "#555" }}>
          <div>Website: enzara.vn</div>
          <div>Email: support@enzara.vn</div>
          <div>Hotline: 0123 456 789</div>
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "bold",
            margin: "0 0 4px 0",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Hóa đơn bán hàng
        </h1>
        <div style={{ fontSize: "12px", color: "#888" }}>
          (Bản in từ hệ thống)
        </div>
      </div>

      {/* Order info row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          border: "1px solid #ddd",
          borderRadius: "6px",
          padding: "12px 16px",
          marginBottom: "20px",
          backgroundColor: "#f9fafb",
        }}
      >
        <div>
          <span style={{ color: "#666", fontSize: "12px" }}>Mã đơn hàng:</span>
          <div style={{ fontWeight: "bold", fontSize: "14px" }}>
            #{order.orderNumber}
          </div>
        </div>
        <div>
          <span style={{ color: "#666", fontSize: "12px" }}>Ngày đặt:</span>
          <div style={{ fontWeight: "bold", fontSize: "14px" }}>
            {formatInvoiceDate(order.createdAt)}
          </div>
        </div>
        <div>
          <span style={{ color: "#666", fontSize: "12px" }}>
            Thanh toán:
          </span>
          <div style={{ fontWeight: "bold", fontSize: "14px" }}>
            {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
          </div>
        </div>
      </div>

      {/* Customer info */}
      <div
        style={{
          marginBottom: "20px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            fontSize: "14px",
            marginBottom: "8px",
            color: "#047857",
          }}
        >
          Thông tin khách hàng
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td
                style={{
                  padding: "3px 0",
                  color: "#666",
                  width: "120px",
                  fontSize: "12px",
                }}
              >
                Người nhận:
              </td>
              <td style={{ padding: "3px 0", fontWeight: "500" }}>
                {order.shippingName}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "3px 0",
                  color: "#666",
                  fontSize: "12px",
                }}
              >
                Số điện thoại:
              </td>
              <td style={{ padding: "3px 0" }}>{order.shippingPhone}</td>
            </tr>
            {order.customer?.email && (
              <tr>
                <td
                  style={{
                    padding: "3px 0",
                    color: "#666",
                    fontSize: "12px",
                  }}
                >
                  Email:
                </td>
                <td style={{ padding: "3px 0" }}>{order.customer.email}</td>
              </tr>
            )}
            <tr>
              <td
                style={{
                  padding: "3px 0",
                  color: "#666",
                  fontSize: "12px",
                  verticalAlign: "top",
                }}
              >
                Địa chỉ giao hàng:
              </td>
              <td style={{ padding: "3px 0" }}>{fullAddress}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Items table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "20px",
          fontSize: "13px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#047857", color: "#fff" }}>
            <th
              style={{
                padding: "8px 10px",
                textAlign: "center",
                fontWeight: "600",
                width: "40px",
                border: "1px solid #047857",
              }}
            >
              STT
            </th>
            <th
              style={{
                padding: "8px 10px",
                textAlign: "left",
                fontWeight: "600",
                border: "1px solid #047857",
              }}
            >
              Sản phẩm
            </th>
            <th
              style={{
                padding: "8px 10px",
                textAlign: "left",
                fontWeight: "600",
                width: "100px",
                border: "1px solid #047857",
              }}
            >
              SKU
            </th>
            <th
              style={{
                padding: "8px 10px",
                textAlign: "center",
                fontWeight: "600",
                width: "50px",
                border: "1px solid #047857",
              }}
            >
              SL
            </th>
            <th
              style={{
                padding: "8px 10px",
                textAlign: "right",
                fontWeight: "600",
                width: "110px",
                border: "1px solid #047857",
              }}
            >
              Đơn giá
            </th>
            <th
              style={{
                padding: "8px 10px",
                textAlign: "right",
                fontWeight: "600",
                width: "120px",
                border: "1px solid #047857",
              }}
            >
              Thành tiền
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr
              key={index}
              style={{
                backgroundColor: index % 2 === 0 ? "#fff" : "#f9fafb",
              }}
            >
              <td
                style={{
                  padding: "8px 10px",
                  textAlign: "center",
                  border: "1px solid #ddd",
                }}
              >
                {index + 1}
              </td>
              <td
                style={{
                  padding: "8px 10px",
                  border: "1px solid #ddd",
                }}
              >
                <div style={{ fontWeight: "500" }}>{item.productName}</div>
                {item.variantName && (
                  <div style={{ fontSize: "11px", color: "#888" }}>
                    {item.variantName}
                  </div>
                )}
              </td>
              <td
                style={{
                  padding: "8px 10px",
                  border: "1px solid #ddd",
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                {item.sku || "-"}
              </td>
              <td
                style={{
                  padding: "8px 10px",
                  textAlign: "center",
                  border: "1px solid #ddd",
                }}
              >
                {item.quantity}
              </td>
              <td
                style={{
                  padding: "8px 10px",
                  textAlign: "right",
                  border: "1px solid #ddd",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                {formatVND(item.price)}
              </td>
              <td
                style={{
                  padding: "8px 10px",
                  textAlign: "right",
                  border: "1px solid #ddd",
                  fontWeight: "500",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                {formatVND(item.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "20px",
        }}
      >
        <div style={{ width: "300px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 0",
              fontSize: "13px",
            }}
          >
            <span style={{ color: "#666" }}>Tạm tính:</span>
            <span style={{ fontFamily: "'Courier New', monospace" }}>
              {formatVND(order.subtotal)}
            </span>
          </div>
          {order.discountAmount > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                fontSize: "13px",
              }}
            >
              <span style={{ color: "#666" }}>
                Giảm giá
                {order.voucherCode ? ` (${order.voucherCode})` : ""}:
              </span>
              <span
                style={{
                  color: "#dc2626",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                -{formatVND(order.discountAmount)}
              </span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 0",
              fontSize: "13px",
            }}
          >
            <span style={{ color: "#666" }}>Phí vận chuyển:</span>
            <span style={{ fontFamily: "'Courier New', monospace" }}>
              {order.shippingFee > 0
                ? formatVND(order.shippingFee)
                : "Miễn phí"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0 6px 0",
              borderTop: "2px solid #047857",
              marginTop: "6px",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            <span>Tổng cộng:</span>
            <span
              style={{
                color: "#047857",
                fontFamily: "'Courier New', monospace",
              }}
            >
              {formatVND(order.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.note && (
        <div
          style={{
            marginBottom: "20px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            padding: "12px 16px",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              fontSize: "13px",
              marginBottom: "6px",
              color: "#047857",
            }}
          >
            Ghi chú đơn hàng
          </div>
          <div style={{ fontSize: "12px", color: "#555" }}>{order.note}</div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          borderTop: "1px solid #ddd",
          paddingTop: "20px",
          marginTop: "32px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: "500",
            color: "#047857",
            marginBottom: "4px",
          }}
        >
          Cảm ơn quý khách đã mua hàng tại Enzara!
        </div>
        <div style={{ fontSize: "12px", color: "#888" }}>
          enzara.vn | support@enzara.vn
        </div>
      </div>
    </div>
  );
}
