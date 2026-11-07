import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import type { MyRecording } from './store';

/**
 * Thêm bản ghi tụng kinh của chính người dùng (tự thu, hoặc bản chùa mình cho phép dùng).
 * Chép vào thư mục riêng của app để không mất khi máy dọn bộ nhớ tạm.
 * Trên web chỉ giữ được trong phiên đang mở.
 */
export async function pickRecording(key: string): Promise<MyRecording | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true, multiple: false });
  if (r.canceled || !r.assets?.[0]) return null;
  const a = r.assets[0] as { uri: string; name?: string };
  const name = a.name || 'Bản ghi';
  if (Platform.OS === 'web') return { uri: a.uri, name, addedAt: Date.now() };
  try {
    const dir = new Directory(Paths.document, 'ban-ghi');
    if (!dir.exists) dir.create();
    const ext = (name.match(/\.[a-z0-9]{2,4}$/i)?.[0] ?? '.m4a').toLowerCase();
    const dst = new File(dir, `${key}-${Date.now()}${ext}`);
    new File(a.uri).copy(dst);
    return { uri: dst.uri, name, addedAt: Date.now() };
  } catch {
    return { uri: a.uri, name, addedAt: Date.now() };
  }
}

export function forgetRecording(rec: MyRecording) {
  if (Platform.OS === 'web') return;
  try {
    const f = new File(rec.uri);
    if (f.exists) f.delete();
  } catch {
    // tệp đã mất: không sao
  }
}
