import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TrackingForm } from "./TrackingForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orderTracking");
  return {
    title: t("seo.title"),
  };
}

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("orderTracking");

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-heading font-bold text-neutral-900 text-center mb-2">
        {t("title")}
      </h1>
      <p className="text-neutral-500 font-body text-center mb-8">
        {t("subtitle")}
      </p>
      <TrackingForm />
    </div>
  );
}
