import React, { useState } from 'react';
import { router } from 'expo-router';
import { AppBar, Banner, Button, Card, Screen, T, TextField, useToast } from '@nam/ui';
import { relativeTime, track } from '@nam/core';
import { createBackup } from '../src/backup';
import { useVi } from '../src/store';

/** Tạo bản sao lưu mã hóa (VG-15). */
export default function Backup() {
  const toast = useToast();
  const s = useVi();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [hint, setHint] = useState(s.backupHint);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const weak = pw.length > 0 && pw.length < 8;
  const mismatch = pw2.length > 0 && pw !== pw2;
  const hintLeaks = hint && pw && hint.toLowerCase().includes(pw.toLowerCase());

  const run = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await createBackup(pw, hint.trim());
      track('backup_created');
      toast(r.shared ? 'Đã tạo bản sao lưu' : 'Đã tạo bản sao lưu trong bộ nhớ app', { tone: 'success' });
      router.back();
    } catch (e) {
      setErr(
        e instanceof Error && e.message === 'WEAK_PASSWORD'
          ? 'Mật khẩu cần ít nhất 8 ký tự.'
          : 'Không tạo được bản sao lưu. Kiểm tra dung lượng máy rồi thử lại.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      footer={
        <Button
          title="Tạo & lưu bản sao lưu"
          loading={busy}
          disabled={pw.length < 8 || pw !== pw2 || !!hintLeaks}
          onPress={run}
        />
      }
    >
      <AppBar title="Sao lưu mã hóa" onBack={() => router.back()} />
      <Banner
        tone="ok"
        icon="lock"
        text="Mã hóa đầu-cuối bằng mật khẩu của bạn. Ví Gọn không giữ mật khẩu — quên là không ai mở được."
      />
      {s.lastBackupAt ? <T v="caption" muted>{`Lần sao lưu trước: ${relativeTime(s.lastBackupAt)}`}</T> : null}
      <TextField
        label="Mật khẩu sao lưu"
        value={pw}
        onChangeText={setPw}
        secureTextEntry
        autoComplete="new-password"
        error={weak ? 'Ít nhất 8 ký tự' : undefined}
      />
      <TextField
        label="Nhập lại mật khẩu"
        value={pw2}
        onChangeText={setPw2}
        secureTextEntry
        error={mismatch ? 'Chưa khớp' : undefined}
      />
      <TextField
        label="Gợi ý (không bắt buộc)"
        value={hint}
        onChangeText={setHint}
        maxLength={60}
        placeholder="Ví dụ: tên con mèo + năm"
        error={hintLeaks ? 'Gợi ý không được chứa mật khẩu' : undefined}
      />
      <Card variant="fill">
        <T v="caption">
          Sau khi tạo, chọn “Lưu vào Tệp” (iPhone) hoặc Google Drive (Android) để giữ bản sao lưu ngoài máy.
        </T>
      </Card>
      {err ? <Banner tone="negative" text={err} /> : null}
    </Screen>
  );
}
