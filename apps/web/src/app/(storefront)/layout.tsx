import { fetchAPI, settingsToRecord } from "@/lib/api-server";
import { AnnouncementBar } from "@/components/storefront/header/AnnouncementBar";
import { Header } from "@/components/storefront/header/Header";
import { Footer } from "@/components/storefront/footer/Footer";
import { BackToTop } from "@/components/storefront/widgets/BackToTop";
import { ChatWidget } from "@/components/storefront/shared/ChatWidget";
import { FloatingContacts } from "@/components/storefront/shared/FloatingContacts";
import { TrackingScripts } from "@/components/storefront/shared/TrackingScripts";
import { ToastProvider } from "@/components/storefront/shared/Toast";
import { PwaInstallPrompt } from "@/components/storefront/PwaInstallPrompt";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [generalSettings, appearanceSettings, headerMenu, categories, chatSettings, contactsSettings, trackingSettings] = await Promise.all([
    fetchAPI<any[]>("/settings/general"),
    fetchAPI<any[]>("/settings/appearance"),
    fetchAPI<any>("/menus/header"),
    fetchAPI<any[]>("/categories"),
    fetchAPI<any[]>("/settings?group=chat"),
    fetchAPI<any[]>("/settings?group=contacts"),
    fetchAPI<any[]>("/settings?group=tracking"),
  ]);

  const general = settingsToRecord(generalSettings);
  const appearance = settingsToRecord(appearanceSettings);
  const tracking = settingsToRecord(trackingSettings);

  // Parse chat settings
  const zaloChatSetting = chatSettings?.find((s) => s.key === "zalo_chat");
  const messengerChatSetting = chatSettings?.find((s) => s.key === "messenger_chat");

  const chatConfig = {
    zaloOaId: zaloChatSetting?.value?.oa_id,
    messengerPageId: messengerChatSetting?.value?.page_id,
  };

  // Parse contacts settings
  const contactItemsSetting = contactsSettings?.find((s) => s.key === "items");
  const contactItems = contactItemsSetting?.value || [];

  return (
    <div className="min-h-screen flex flex-col">
      <TrackingScripts settings={tracking} />
      <AnnouncementBar
        enabled={appearance.announcement_enabled === "true"}
        text={appearance.announcement_text || ""}
        link={appearance.announcement_link || ""}
        bgColor={appearance.announcement_bg_color || ""}
      />
      <Header
        settings={general}
        menus={headerMenu?.items || []}
        categories={categories || []}
      />
      <main className="flex-1">{children}</main>
      <Footer settings={general} config={appearance} />
      <BackToTop />
      <ChatWidget settings={chatConfig} />
      <FloatingContacts items={contactItems} />
      <ToastProvider />
      <PwaInstallPrompt />
    </div>
  );
}
