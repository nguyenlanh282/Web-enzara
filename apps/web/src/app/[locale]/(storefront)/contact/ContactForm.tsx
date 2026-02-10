"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { apiClient } from "@/lib/api";
import { Mail, Phone, MapPin, CheckCircle } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(1, "Vui long nhap ten"),
  email: z.string().email("Email khong hop le"),
  phone: z.string().optional(),
  message: z.string().min(1, "Vui long nhap noi dung"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setSubmitError("");
    try {
      await apiClient.post("/contact", data);
      setIsSubmitted(true);
    } catch (err) {
      console.error("Contact form error:", err);
      setSubmitError("Co loi xay ra. Vui long thu lai.");
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle className="h-16 w-16 text-primary-700 mb-4" />
        <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-2">
          Cam on ban da lien he!
        </h2>
        <p className="text-neutral-600 font-body max-w-md">
          Chung toi da nhan duoc tin nhan cua ban va se phan hoi trong thoi gian som nhat.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div>
        <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-4">
          Lien he voi chung toi
        </h1>
        <p className="text-neutral-600 font-body mb-8">
          Ban co cau hoi hoac gop y? Hay gui tin nhan cho chung toi, chung toi se phan hoi som nhat.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 font-body mb-1">
              Ho va ten *
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent font-body"
              placeholder="Nhap ho va ten"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 font-body mb-1">
              Email *
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent font-body"
              placeholder="Nhap email"
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 font-body mb-1">
              So dien thoai
            </label>
            <input
              id="phone"
              type="tel"
              {...register("phone")}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent font-body"
              placeholder="Nhap so dien thoai (tuy chon)"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-neutral-700 font-body mb-1">
              Noi dung *
            </label>
            <textarea
              id="message"
              rows={5}
              {...register("message")}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent font-body resize-none"
              placeholder="Nhap noi dung lien he"
            />
            {errors.message && (
              <p className="text-sm text-red-600 mt-1">{errors.message.message}</p>
            )}
          </div>

          {submitError && (
            <p className="text-sm text-red-600">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 bg-primary-700 text-white font-body font-semibold rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Dang gui..." : "Gui lien he"}
          </button>
        </form>
      </div>

      <div className="space-y-8 lg:pt-16">
        <div>
          <h2 className="text-xl font-heading font-bold text-neutral-900 mb-4">
            Thong tin lien he
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium font-body text-neutral-900">Enzara</p>
                <p className="text-neutral-600 font-body">Ho Chi Minh City, Vietnam</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium font-body text-neutral-900">Email</p>
                <a href="mailto:info@enzara.vn" className="text-primary-700 hover:underline font-body">
                  info@enzara.vn
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium font-body text-neutral-900">Dien thoai</p>
                <a href="tel:0123456789" className="text-primary-700 hover:underline font-body">
                  0123 456 789
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
