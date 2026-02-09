"use client";

import Script from "next/script";

interface ChatWidgetProps {
  settings: {
    zaloOaId?: string;
    messengerPageId?: string;
  };
}

export function ChatWidget({ settings }: ChatWidgetProps) {
  const { zaloOaId, messengerPageId } = settings;

  // Don't render anything if no chat services are configured
  if (!zaloOaId && !messengerPageId) {
    return null;
  }

  return (
    <>
      {/* Zalo Chat Widget */}
      {zaloOaId && (
        <>
          <div
            className="zalo-chat-widget"
            data-oaid={zaloOaId}
            data-welcome-message="Xin chào! Cần hỗ trợ gì không?"
            data-autopopup="0"
          />
          <Script
            src="https://sp.zalo.me/plugins/sdk.js"
            strategy="lazyOnload"
          />
        </>
      )}

      {/* Facebook Messenger Chat Plugin */}
      {messengerPageId && (
        <>
          <div id="fb-root" />
          <div id="fb-customer-chat" className="fb-customerchat" />
          <Script
            id="facebook-messenger-sdk"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                var chatbox = document.getElementById('fb-customer-chat');
                chatbox.setAttribute("page_id", "${messengerPageId}");
                chatbox.setAttribute("attribution", "biz_inbox");

                window.fbAsyncInit = function() {
                  FB.init({
                    xfbml: true,
                    version: 'v18.0'
                  });
                };

                (function(d, s, id) {
                  var js, fjs = d.getElementsByTagName(s)[0];
                  if (d.getElementById(id)) return;
                  js = d.createElement(s); js.id = id;
                  js.src = 'https://connect.facebook.net/vi_VN/sdk/xfbml.customerchat.js';
                  fjs.parentNode.insertBefore(js, fjs);
                }(document, 'script', 'facebook-jssdk'));
              `,
            }}
          />
        </>
      )}
    </>
  );
}
