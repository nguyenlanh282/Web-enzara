import { Metadata } from "next";
import { TrackingForm } from "./TrackingForm";

export const metadata: Metadata = {
  title: "Theo doi don hang - Enzara",
};

export default function OrderTrackingPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-heading font-bold text-neutral-900 text-center mb-2">
        Theo doi don hang
      </h1>
      <p className="text-neutral-500 font-body text-center mb-8">
        Nhap ma don hang de kiem tra trang thai giao hang
      </p>
      <TrackingForm />
    </div>
  );
}
