import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactForm } from "./ContactForm";
import { generatePageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");
  return generatePageMetadata({
    title: t("seo.title"),
    description: t("seo.description"),
    path: "/contact",
  });
}

export default async function ContactPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <ContactForm />
    </div>
  );
}
