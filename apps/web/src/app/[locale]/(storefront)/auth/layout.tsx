import Link from "next/link";
import { Leaf, Shield, Heart } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left branding panel - hidden on mobile, shown on lg+ */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] relative overflow-hidden bg-gradient-to-br from-primary-700 to-primary-800">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <svg
            className="absolute -top-20 -left-20 w-96 h-96 text-white"
            viewBox="0 0 200 200"
            fill="currentColor"
          >
            <path d="M100 0C60 0 30 20 15 50c-15 30-10 65 10 90s55 35 75 35 55-10 75-35 25-60 10-90C170 20 140 0 100 0zm0 160c-33 0-60-27-60-60s27-60 60-60 60 27 60 60-27 60-60 60z" />
          </svg>
          <svg
            className="absolute top-1/3 right-10 w-64 h-64 text-white"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <ellipse cx="50" cy="50" rx="45" ry="25" transform="rotate(-30 50 50)" />
          </svg>
          <svg
            className="absolute -bottom-10 left-1/4 w-80 h-80 text-white"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <path d="M50 5C30 5 15 15 10 30c-5 15 0 30 10 40s25 15 30 15 20-5 30-15 15-25 10-40C85 15 70 5 50 5z" />
          </svg>
        </div>

        {/* Leaf decorative SVG */}
        <div className="absolute bottom-10 right-10 opacity-15">
          <svg
            className="w-48 h-48 text-white"
            viewBox="0 0 120 120"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M60 110 C60 110 20 80 15 45 C10 10 50 5 60 20 C70 5 110 10 105 45 C100 80 60 110 60 110Z" />
            <path d="M60 110 C60 110 60 50 60 20" />
            <path d="M60 70 C60 70 40 55 30 50" />
            <path d="M60 70 C60 70 80 55 90 50" />
            <path d="M60 50 C60 50 45 40 35 38" />
            <path d="M60 50 C60 50 75 40 85 38" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-12">
          <Link href="/" className="inline-block mb-8">
            <h1 className="text-4xl xl:text-5xl font-heading font-bold text-white">
              Enzara
            </h1>
          </Link>

          <p className="text-xl xl:text-2xl font-heading text-white/90 leading-relaxed mb-12 max-w-md">
            San pham tay rua sinh thai, than thien voi moi truong
          </p>

          {/* Trust badges */}
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium font-body">Nguon goc tu nhien</p>
                <p className="text-white/60 text-sm font-body">Chiet xuat tu enzyme dua</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium font-body">An toan cho gia dinh</p>
                <p className="text-white/60 text-sm font-body">Khong hoa chat doc hai</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium font-body">Than thien moi truong</p>
                <p className="text-white/60 text-sm font-body">Phan huy sinh hoc hoan toan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 xl:w-[55%] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Mobile branding - shown only on mobile */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-heading font-bold text-primary-700">
                Enzara
              </h1>
              <p className="text-sm text-neutral-500 mt-1 font-body">
                San pham huu co tu enzyme dua
              </p>
            </Link>
          </div>

          {/* Form container */}
          <div className="bg-white rounded-2xl shadow-card p-8 lg:shadow-none lg:bg-transparent lg:p-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
