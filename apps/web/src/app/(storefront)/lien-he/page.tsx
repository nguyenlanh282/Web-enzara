import { Metadata } from "next";
import { ContactForm } from "./ContactForm";
import { generatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata({
  title: "Lien he - Enzara",
  description: "Lien he voi Enzara de duoc tu van ve san pham tay rua huu co tu enzyme dua. Ho tro khach hang nhanh chong.",
  path: "/lien-he",
});

export default function ContactPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <ContactForm />
    </div>
  );
}
