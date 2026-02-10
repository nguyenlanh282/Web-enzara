"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-100 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-primary-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-3">
          Khong co ket noi mang
        </h1>

        <p className="text-neutral-600 font-body mb-6">
          Vui long kiem tra ket noi internet cua ban va thu lai.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-body font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          Thu lai
        </button>
      </div>
    </div>
  );
}
