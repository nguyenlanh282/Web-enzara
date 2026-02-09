import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="text-center max-w-lg">
        <p className="text-8xl font-heading font-extrabold text-primary-700">
          404
        </p>
        <h1 className="mt-4 text-2xl font-heading font-bold text-neutral-900">
          Trang khong ton tai
        </h1>
        <p className="mt-3 text-neutral-500 font-body">
          Trang ban tim kiem khong ton tai hoac da bi xoa.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors"
          >
            <Home className="h-4 w-4" />
            Ve trang chu
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 border border-neutral-300 text-neutral-700 rounded-xl font-body font-medium hover:border-primary-700 hover:text-primary-700 transition-colors"
          >
            <Search className="h-4 w-4" />
            Tim kiem san pham
          </Link>
        </div>
      </div>
    </div>
  );
}
