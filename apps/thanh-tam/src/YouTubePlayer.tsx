import React, { createElement } from 'react';
import { Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Trình phát YouTube nhúng trong app. Dùng trang nhúng chính thức (youtube-nocookie.com).
 * Trên điện thoại: WebView với nội dung HTML và `baseUrl` https, để YouTube nhận đúng trang nhúng
 * (thiếu nguồn gửi, YouTube báo lỗi 152/153 "cấu hình trình phát").
 */
const ORIGIN = 'https://huynhngochop.github.io';

/** `origin` phải đúng trang đang nhúng: điện thoại là ORIGIN (baseUrl của WebView), web là địa chỉ trang hiện tại. */
export const embedUrl = (id: string, origin = ORIGIN) =>
  `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0&modestbranding=1&origin=${encodeURIComponent(origin)}`;
const pageOrigin = () => (globalThis as { location?: { origin?: string } }).location?.origin ?? ORIGIN;

const html = (id: string) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<style>html,body{margin:0;height:100%;background:#000}iframe{position:absolute;inset:0;width:100%;height:100%;border:0}</style>
</head><body>
<iframe src="${embedUrl(id)}" referrerpolicy="strict-origin-when-cross-origin"
 allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Video tụng kinh"></iframe>
</body></html>`;

export function YouTubePlayer({ id, title }: { id: string; title: string }) {
  return (
    <View
      style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden' }}
      accessibilityLabel={`Video: ${title}`}
    >
      {Platform.OS === 'web' ? (
        createElement('iframe', {
          key: id,
          src: embedUrl(id, pageOrigin()),
          title,
          allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
          allowFullScreen: true,
          referrerPolicy: 'strict-origin-when-cross-origin',
          style: { width: '100%', height: '100%', border: 0 },
        })
      ) : (
        <WebView
          key={id}
          source={{ html: html(id), baseUrl: ORIGIN }}
          style={{ flex: 1, backgroundColor: '#000' }}
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          originWhitelist={['*']}
          // Bấm vào logo, tên kênh: không mở trang YouTube bên trong khung nhỏ
          onShouldStartLoadWithRequest={(r: { url: string; isTopFrame?: boolean }) =>
            r.isTopFrame === false ||
            r.url.startsWith('about:') ||
            r.url.includes('youtube-nocookie.com/embed') ||
            r.url.startsWith(ORIGIN)
          }
        />
      )}
    </View>
  );
}
