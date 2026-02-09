"use client";

import { useState } from "react";
import { MessageCircle, X, Phone, Facebook, MapPin, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ContactItem {
  id: string;
  type: string;
  label: string;
  value: string;
  icon: string;
  color: string;
  enabled: boolean;
  sort_order: number;
}

interface FloatingContactsProps {
  items: ContactItem[];
}

export function FloatingContacts({ items }: FloatingContactsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter enabled items and sort by sort_order
  const enabledItems = items
    .filter((item) => item.enabled)
    .sort((a, b) => a.sort_order - b.sort_order);

  // Don't render if no items are enabled
  if (enabledItems.length === 0) {
    return null;
  }

  const handleContactClick = (item: ContactItem) => {
    switch (item.type) {
      case "phone":
        window.open(`tel:${item.value}`, "_self");
        break;
      case "zalo":
        window.open(`https://zalo.me/${item.value}`, "_blank");
        break;
      case "messenger":
        window.open(`https://m.me/${item.value}`, "_blank");
        break;
      case "email":
        window.open(`mailto:${item.value}`, "_self");
        break;
      case "link":
        window.open(item.value, "_blank");
        break;
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case "phone":
        return <Phone className="h-5 w-5 md:h-6 md:w-6" />;
      case "messagecircle":
      case "zalo":
        return <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />;
      case "facebook":
      case "messenger":
        return <Facebook className="h-5 w-5 md:h-6 md:w-6" />;
      case "mappin":
      case "map":
        return <MapPin className="h-5 w-5 md:h-6 md:w-6" />;
      case "mail":
      case "email":
        return <Mail className="h-5 w-5 md:h-6 md:w-6" />;
      default:
        return <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col gap-3"
          >
            {enabledItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <button
                  onClick={() => handleContactClick(item)}
                  className={cn(
                    "p-3 md:p-4 rounded-full text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-110",
                  )}
                  style={{ backgroundColor: item.color }}
                  aria-label={item.label}
                >
                  {getIcon(item.icon)}
                </button>
                {/* Tooltip */}
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  <div className="bg-neutral-900 text-white text-sm px-3 py-1.5 rounded shadow-lg">
                    {item.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 md:p-4 bg-primary-700 text-white rounded-full shadow-lg hover:bg-primary-800 transition-colors"
        aria-label={isOpen ? "Đóng liên hệ" : "Mở liên hệ"}
      >
        {isOpen ? (
          <X className="h-6 w-6 md:h-7 md:w-7" />
        ) : (
          <MessageCircle className="h-6 w-6 md:h-7 md:w-7" />
        )}
      </button>
    </div>
  );
}
