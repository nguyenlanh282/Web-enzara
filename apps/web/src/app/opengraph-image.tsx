import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Enzara - San pham tay rua huu co tu enzyme dua";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background:
            "linear-gradient(135deg, #047857 0%, #065f46 50%, #064e3b 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          {/* Brand name */}
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: "white",
              letterSpacing: "-2px",
              marginBottom: "16px",
            }}
          >
            ENZARA
          </div>

          {/* Divider line */}
          <div
            style={{
              width: 120,
              height: 4,
              background: "rgba(255,255,255,0.5)",
              borderRadius: 2,
              marginBottom: "24px",
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              color: "rgba(255,255,255,0.9)",
              fontWeight: 400,
              maxWidth: 800,
              lineHeight: 1.4,
            }}
          >
            San pham tay rua huu co tu enzyme dua tu nhien
          </div>

          {/* Sub-tagline */}
          <div
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.6)",
              marginTop: "16px",
              fontWeight: 300,
            }}
          >
            An toan cho suc khoe • Than thien voi moi truong
          </div>
        </div>

        {/* Website URL bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 22,
            color: "rgba(255,255,255,0.5)",
            fontWeight: 300,
          }}
        >
          enzara.vn
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
