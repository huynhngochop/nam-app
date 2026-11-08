import React, { createElement, useMemo } from 'react';
import { Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { nextPlayable, YT_BLOCKED_CODES } from './lib/videoFallback';

/**
 * Trình phát YouTube nằm hẳn trong app (không mở app hay trang YouTube).
 *
 * - Dùng YouTube IFrame Player API chính thức trong một WebView, nạp bằng HTML với `baseUrl` https
 *   để YouTube nhận đúng trang nhúng (thiếu nguồn gửi thì báo lỗi 152/153 "cấu hình trình phát").
 * - Mỗi bài có 2–3 bản. Bản nào lỗi (chủ kênh tắt nhúng 101/150, video bị gỡ 100, lỗi trình phát 2/5/152/153,
 *   hay 15 giây không nạp được) thì tự chuyển sang bản kế, báo lên màn hình bản đang phát.
 * - Chặn mọi lần chuyển trang ở khung chính (bấm logo, tên kênh, "Xem trên YouTube"): ở lại trong app.
 */
const ORIGIN = 'https://huynhngochop.github.io';

export type PlayerEvent =
  | { t: 'ready'; i: number }
  | { t: 'playing'; i: number }
  | { t: 'switched'; i: number; from: number; code: number | string }
  | { t: 'allfailed'; code: number | string };

const html = (ids: string[], start: number) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}#p,iframe{position:absolute;inset:0;width:100%;height:100%;border:0}</style>
</head><body><div id="p"></div>
<script>
var ids=${JSON.stringify(ids)}, i=${start}, tried={}, player=null, timer=null;
var BLOCKED=${JSON.stringify(YT_BLOCKED_CODES)};
function send(m){try{window.ReactNativeWebView.postMessage(JSON.stringify(m))}catch(e){}}
function arm(){clearTimeout(timer);timer=setTimeout(function(){fail('timeout')},15000)}
function fail(code){
  clearTimeout(timer);
  if(!player||!player.loadVideoById){send({t:'allfailed',code:code});return;}
  tried[i]=1;
  for(var k=1;k<=ids.length;k++){var j=(i+k)%ids.length; if(!tried[j]){var from=i;i=j;send({t:'switched',i:i,from:from,code:code});
    player.loadVideoById(ids[i]);arm();return;}}
  send({t:'allfailed',code:code});
}
function onYouTubeIframeAPIReady(){
  player=new YT.Player('p',{host:'https://www.youtube-nocookie.com',videoId:ids[i],
    playerVars:{playsinline:1,rel:0,modestbranding:1,iv_load_policy:3,fs:1,origin:'${ORIGIN}',widget_referrer:'${ORIGIN}'},
    events:{
      onReady:function(){clearTimeout(timer);send({t:'ready',i:i})},
      onStateChange:function(e){if(e.data===1||e.data===3){clearTimeout(timer)} if(e.data===1){send({t:'playing',i:i})}},
      onError:function(e){fail(e.data)}
    }});
  arm();
}
arm();
</script>
<script src="https://www.youtube.com/iframe_api" onerror="fail('api')"></script>
</body></html>`;

export function YouTubePlayer({
  ids,
  start,
  title,
  onEvent,
}: {
  ids: string[];
  start: number;
  title: string;
  onEvent?: (e: PlayerEvent) => void;
}) {
  const source = useMemo(() => ({ html: html(ids, start), baseUrl: ORIGIN }), [ids, start]);
  const id = ids[start];
  return (
    <View
      style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden' }}
      accessibilityLabel={`Video: ${title}`}
    >
      {Platform.OS === 'web' ? (
        // Bản web chỉ để xem thử: khung nhúng thường (WebView không chạy trên web).
        createElement('iframe', {
          key: id,
          src: `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0&modestbranding=1`,
          title,
          allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
          referrerPolicy: 'strict-origin-when-cross-origin',
          style: { width: '100%', height: '100%', border: 0 },
        })
      ) : (
        <WebView
          key={`${ids.join(',')}#${start}`}
          source={source}
          style={{ flex: 1, backgroundColor: '#000' }}
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          originWhitelist={['*']}
          onMessage={(e: { nativeEvent: { data: string } }) => {
            try {
              onEvent?.(JSON.parse(e.nativeEvent.data) as PlayerEvent);
            } catch {
              // bỏ qua tin lạ
            }
          }}
          // Ở lại trong app: chỉ cho khung chính là trang trình phát; khung con (iframe YouTube) tải bình thường.
          onShouldStartLoadWithRequest={(r: { url: string; isTopFrame?: boolean; mainDocumentURL?: string }) =>
            nextPlayable.allowNavigation(r.url, r.isTopFrame, ORIGIN)
          }
          onOpenWindow={() => {}}
        />
      )}
    </View>
  );
}
