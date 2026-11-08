import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

/**
 * Lưu một tệp JSON rồi mở bảng chia sẻ của máy (Gmail, Zalo, Drive, Lưu vào Tệp...).
 * Web: tải tệp xuống. Trả về false khi máy không có cách chia sẻ.
 */
export async function shareJson(name: string, data: unknown, title: string): Promise<boolean> {
  const text = JSON.stringify(data);
  if (Platform.OS === 'web') {
    const g = globalThis as unknown as {
      document?: { createElement: (t: string) => { href: string; download: string; click: () => void } };
      URL?: { createObjectURL: (b: unknown) => string; revokeObjectURL: (u: string) => void };
      Blob?: new (parts: string[], o: { type: string }) => unknown;
    };
    if (!g.document || !g.URL || !g.Blob) return false;
    const url = g.URL.createObjectURL(new g.Blob([text], { type: 'application/json' }));
    const a = g.document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => g.URL?.revokeObjectURL(url), 5000);
    return true;
  }
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  f.write(text);
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(f.uri, { mimeType: 'application/json', dialogTitle: title, UTI: 'public.json' });
  return true;
}

/** Chọn một tệp trên máy (tệp nhận qua mail, Zalo, Drive) và đọc chữ. Hủy thì trả null. */
export async function pickJsonText(): Promise<{ name: string; text: string } | null> {
  const r = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', 'application/octet-stream', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (r.canceled || !r.assets?.[0]) return null;
  const a = r.assets[0] as { uri: string; name?: string; file?: { text: () => Promise<string> } };
  let text: string;
  if (Platform.OS === 'web') text = a.file ? await a.file.text() : await (await fetch(a.uri)).text();
  else text = await new File(a.uri).text();
  return { name: a.name ?? 'tệp', text };
}
