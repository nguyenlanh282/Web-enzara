import { Truck, Leaf, ShieldCheck, Headphones } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function ValueProposition() {
  const t = await getTranslations("home.valueProps");

  const items = [
    {
      icon: Truck,
      title: t("freeShipping.title"),
      desc: t("freeShipping.desc"),
    },
    {
      icon: Leaf,
      title: t("organic.title"),
      desc: t("organic.desc"),
    },
    {
      icon: ShieldCheck,
      title: t("guarantee.title"),
      desc: t("guarantee.desc"),
    },
    {
      icon: Headphones,
      title: t("support.title"),
      desc: t("support.desc"),
    },
  ];

  return (
    <section className="border-b border-neutral-100">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-neutral-100">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3 py-6 px-4 lg:px-6"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                <item.icon className="h-5 w-5 text-primary-600" />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-semibold text-sm text-neutral-900 truncate">
                  {item.title}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
