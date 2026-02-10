"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setErrorMessage("Link xac minh khong hop le.");
      return;
    }

    apiClient
      .post("/auth/verify-email", { token, email })
      .then(() => {
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        if (err instanceof ApiError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage("Da co loi xay ra. Vui long thu lai.");
        }
      });
  }, [token, email]);

  const handleResend = async () => {
    setResending(true);
    setResendSuccess(false);
    try {
      await apiClient.post("/auth/resend-verification");
      setResendSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Khong the gui lai email xac minh.");
      }
    } finally {
      setResending(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-primary-700 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-2">
          Dang xac minh email...
        </h2>
        <p className="text-neutral-500 text-sm">
          Vui long doi trong giay lat.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-4">
          Email da duoc xac minh thanh cong
        </h2>
        <p className="text-neutral-600 text-sm mb-6">
          Tai khoan cua ban da duoc xac minh. Ban co the su dung day du tinh
          nang cua Enzara.
        </p>
        <Link
          href="/account/profile"
          className="inline-block px-6 py-3 rounded-lg bg-primary-700 text-white font-medium text-sm hover:bg-primary-800 transition-colors"
        >
          Di den ho so
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-4">
        Xac minh that bai
      </h2>
      <p className="text-neutral-600 text-sm mb-6">{errorMessage}</p>

      {resendSuccess ? (
        <p className="text-green-600 text-sm mb-4">
          Email xac minh da duoc gui lai thanh cong.
        </p>
      ) : (
        <button
          onClick={handleResend}
          disabled={resending}
          className="inline-block px-6 py-3 rounded-lg bg-primary-700 text-white font-medium text-sm hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resending ? "Dang gui..." : "Gui lai email xac minh"}
        </button>
      )}

      <p className="mt-4 text-sm text-neutral-500">
        <Link
          href="/auth/login"
          className="text-primary-700 font-medium hover:underline"
        >
          Quay lai dang nhap
        </Link>
      </p>
    </div>
  );
}
