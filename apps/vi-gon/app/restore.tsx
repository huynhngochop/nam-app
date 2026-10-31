import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import {
  AppBar,
  Banner,
  Button,
  Card,
  Dialog,
  ListItem,
  Screen,
  T,
  TextField,
  Thumb,
  useTheme,
  useToast,
} from '@nam/ui';
import { shortDate, track } from '@nam/core';
import { BackupMeta, readMeta, restoreBackup } from '../src/backup';
import { useVi } from '../src/store';

const MAX_TRIES = 5;

/** VG-20 · Khôi phục sao lưu: sai mật khẩu (đếm lượt, khóa 30 giây), quên mật khẩu. */
export default function Restore() {
  const { c } = useTheme();
  const toast = useToast();
  const onboarded = useVi((s) => s.onboarded);
  const [uri, setUri] = useState<string | null>(null);
  const [meta, setMeta] = useState<BackupMeta | null>(null);
  const [pw, setPw] = useState('');
  const [tries, setTries] = useState(0);
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (waitUntil <= now) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [waitUntil, now]);
  const locked = waitUntil > now;

  const pick = async () => {
    setErr(null);
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
      if (r.canceled || !r.assets?.[0]) return;
      const m = readMeta(r.assets[0].uri);
      setUri(r.assets[0].uri);
      setMeta(m);
      setTries(0);
      setPw('');
    } catch {
      setErr('Tệp này không phải bản sao lưu Ví Gọn, hoặc đã bị hỏng.');
    }
  };
  const run = async () => {
    if (!uri) return;
    setConfirm(false);
    setBusy(true);
    setErr(null);
    try {
      const r = await restoreBackup(uri, pw);
      track('backup_restored', { tx: r.txCount });
      toast(`Đã khôi phục ${r.txCount} giao dịch`, { tone: 'success' });
      router.replace('/(tabs)/home');
    } catch (e) {
      if (e instanceof Error && e.message === 'WRONG_PASSWORD') {
        const n = tries + 1;
        setTries(n);
        if (n >= MAX_TRIES) {
          setWaitUntil(Date.now() + 30000);
          setNow(Date.now());
          setTries(0);
          setErr('Sai quá nhiều lần. Thử lại sau 30 giây.');
        } else setErr(`Mật khẩu chưa đúng · còn ${MAX_TRIES - n} lần thử`);
      } else setErr('Không khôi phục được. Dữ liệu hiện tại vẫn giữ nguyên.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      footer={
        meta ? (
          <Button
            title={locked ? `Thử lại sau ${Math.ceil((waitUntil - now) / 1000)} giây` : 'Khôi phục'}
            loading={busy}
            disabled={!pw || locked}
            onPress={() => (onboarded ? setConfirm(true) : run())}
          />
        ) : (
          <Button title="Chọn tệp sao lưu (.vgb)" icon="folder" onPress={pick} />
        )
      }
    >
      <AppBar title="Khôi phục sao lưu" onBack={() => router.back()} />
      {meta ? (
        <>
          <Card>
            <ListItem
              left={<Thumb icon="archive" color={c.a} bg={c.at} />}
              title={`Bản sao lưu ${shortDate(new Date(meta.createdAt))}`}
              subtitle={`${meta.txCount.toLocaleString('vi-VN')} giao dịch · ${meta.fundCount} quỹ`}
              divider={false}
              right={<Button title="Đổi" size="sm" variant="text" onPress={pick} />}
            />
          </Card>
          <TextField
            label="Mật khẩu sao lưu"
            value={pw}
            onChangeText={setPw}
            secureTextEntry
            autoFocus
            error={err && err.startsWith('Mật khẩu') ? err : undefined}
            onSubmitEditing={() => !locked && pw && (onboarded ? setConfirm(true) : run())}
          />
          {meta.hint ? <T v="caption" muted>{`Gợi ý bạn đã đặt: “${meta.hint}”`}</T> : null}
          {busy ? (
            <T v="caption" muted>
              Đang giải mã… có thể mất vài giây trên máy cũ.
            </T>
          ) : null}
          <Card variant="fill">
            <T v="headline">Quên mật khẩu?</T>
            <T v="caption">
              Bản sao lưu được mã hóa đầu-cuối, kể cả Ví Gọn cũng không mở được. Bạn có thể bắt đầu mới và giữ tệp cũ để
              thử lại sau.
            </T>
            <Button
              title="Bắt đầu mới"
              size="sm"
              variant="secondary"
              onPress={() => router.replace(onboarded ? '/(tabs)/home' : '/onboarding/privacy')}
            />
          </Card>
        </>
      ) : (
        <T v="body">Chọn tệp .vgb bạn đã lưu trong Tệp (iCloud Drive) hoặc Google Drive.</T>
      )}
      {err && !err.startsWith('Mật khẩu') ? <Banner tone="negative" text={err} /> : null}
      <Dialog
        visible={confirm}
        title="Thay dữ liệu hiện tại?"
        body="Giao dịch, quỹ và ngân sách trên máy sẽ được thay bằng bản sao lưu."
        confirm="Khôi phục"
        destructive
        onCancel={() => setConfirm(false)}
        onConfirm={run}
      />
    </Screen>
  );
}
