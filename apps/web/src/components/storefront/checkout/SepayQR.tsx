"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, AlertCircle, RefreshCw, Clock } from "lucide-react";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

interface OrderTracking {
  total: number;
  paymentStatus: string;
  bankBin?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  bankName?: string;
  transferContent?: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "\u0111";
}

const POLL_INTERVAL = 5000;
const TIMER_DURATION = 15 * 60; // 15 minutes in seconds

// Placeholder bank info -- backend should provide real values via tracking endpoint
const FALLBACK_BANK_BIN = "970422";
const FALLBACK_BANK_ACCOUNT = "0123456789";
const FALLBACK_BANK_NAME = "MB Bank";
const FALLBACK_ACCOUNT_HOLDER = "ENZARA VIET NAM";

export function SepayQR({ orderNumber }: { orderNumber: string }) {
  const [orderData, setOrderData] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_DURATION);
  const [expired, setExpired] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const fetchOrderData = useCallback(async () => {
    try {
      const data = await apiClient.get<OrderTracking>(
        `/orders/${orderNumber}/tracking`
      );
      setOrderData(data);
      setError(null);

      if (data.paymentStatus === "PAID") {
        setIsPaid(true);
        stopAll();
      }
    } catch {
      setError("Khong the tai thong tin thanh toan");
    } finally {
      setLoading(false);
    }
  }, [orderNumber, stopAll]);

  const startTimersAndPolling = useCallback(() => {
    setExpired(false);
    setSecondsLeft(TIMER_DURATION);
    setIsPaid(false);

    // Initial fetch
    fetchOrderData();

    // Poll payment status
    pollRef.current = setInterval(() => {
      apiClient
        .get<OrderTracking>(`/orders/${orderNumber}/tracking`)
        .then((data) => {
          setOrderData(data);
          if (data.paymentStatus === "PAID") {
            setIsPaid(true);
            stopAll();
          }
        })
        .catch(() => {});
    }, POLL_INTERVAL);

    // Countdown timer
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setExpired(true);
          stopAll();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [fetchOrderData, orderNumber, stopAll]);

  useEffect(() => {
    startTimersAndPolling();
    return stopAll;
  }, [startTimersAndPolling, stopAll]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  // Bank info from order data or fallback
  const bankBin = orderData?.bankBin || FALLBACK_BANK_BIN;
  const bankAccount = orderData?.bankAccountNumber || FALLBACK_BANK_ACCOUNT;
  const bankName = orderData?.bankName || FALLBACK_BANK_NAME;
  const accountHolder = orderData?.bankAccountName || FALLBACK_ACCOUNT_HOLDER;
  const transferContent = orderData?.transferContent || `PC ${orderNumber}`;
  const amount = orderData?.total || 0;

  const qrUrl = `https://img.vietqr.io/image/${bankBin}-${bankAccount}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}`;

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-primary-700 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-neutral-500 font-body">
          Dang tai thong tin thanh toan...
        </p>
      </div>
    );
  }

  // Error state (no order data at all)
  if (error && !orderData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="mt-4 text-sm text-red-600 font-body">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchOrderData();
          }}
          className="mt-4 inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Thu lai
        </button>
      </div>
    );
  }

  // Payment confirmed
  if (isPaid) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-xl font-heading font-bold text-green-700">
          Thanh toan thanh cong!
        </h3>
        <p className="mt-2 text-sm text-neutral-600 font-body">
          Don hang <span className="font-semibold">{orderNumber}</span> da duoc
          thanh toan. Cam on ban da mua hang tai Enzara!
        </p>
      </div>
    );
  }

  // Expired
  if (expired) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-xl font-heading font-bold text-red-600">
          Da het han thanh toan
        </h3>
        <p className="mt-2 text-sm text-neutral-600 font-body">
          Thoi gian thanh toan cho don hang{" "}
          <span className="font-semibold">{orderNumber}</span> da het.
        </p>
        <button
          onClick={startTimersAndPolling}
          className="mt-4 inline-flex items-center gap-2 px-6 h-10 rounded-lg bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Thanh toan lai
        </button>
      </div>
    );
  }

  // Active QR payment
  return (
    <div className="flex flex-col items-center">
      {/* Timer */}
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-neutral-500" />
        <span
          className={cn(
            "text-sm font-mono font-medium",
            secondsLeft <= 60 ? "text-red-600" : "text-neutral-700"
          )}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>

      {/* QR Image */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrUrl}
          alt="QR thanh toan"
          width={280}
          height={280}
          className="w-[280px] h-auto"
        />
      </div>

      {/* Bank details */}
      <div className="w-full max-w-sm space-y-3 text-sm font-body">
        <div className="flex items-center justify-between py-2 border-b border-neutral-100">
          <span className="text-neutral-500">Ngan hang</span>
          <span className="font-medium text-neutral-900">{bankName}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-neutral-100">
          <span className="text-neutral-500">So tai khoan</span>
          <span className="font-medium text-neutral-900">{bankAccount}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-neutral-100">
          <span className="text-neutral-500">Chu tai khoan</span>
          <span className="font-medium text-neutral-900">{accountHolder}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-neutral-100">
          <span className="text-neutral-500">Noi dung CK</span>
          <span className="font-semibold text-primary-700">
            {transferContent}
          </span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-neutral-500">So tien</span>
          <span className="font-bold text-primary-700 text-base">
            {formatPrice(amount)}
          </span>
        </div>
      </div>

      <p className="mt-6 text-xs text-neutral-400 text-center max-w-sm font-body">
        Vui long chuyen khoan dung so tien va noi dung. Thanh toan se duoc xac
        nhan tu dong trong vai giay.
      </p>
    </div>
  );
}
