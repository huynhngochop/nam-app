import React, { useState } from 'react';
import { router } from 'expo-router';
import { AppBar, Button, Dialog, ListItem, Screen, SectionHeader, Sheet, T, Thumb, useTheme, useToast } from '@nam/ui';
import { track } from '@nam/core';
import { useTT } from '../src/store';
import { useSession } from '../src/session';
import { goBack } from '../src/nav';
import { pickJsonText, shareJson } from '../src/fileShare';
import {
  BACKUP_KEYS,
  TRANSFER_MESSAGES,
  TransferError,
  buildBackup,
  parseTransfer,
  transferFileName,
  type BackupFile,
} from '../src/lib/transfer';

const fmt = (ms: number) => {
  const d = new Date(ms);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

/** TT-33 · Sao lưu, khôi phục, gửi và nhận sổ giỗ. Không cần máy chủ: mọi thứ đi bằng tệp người dùng tự gửi. */
export default function DataScreen() {
  const { c } = useTheme();
  const toast = useToast();
  const lastBackupAt = useTT((s) => s.lastBackupAt);
  const count = useTT((s) => s.anniversaries.length);
  const set = useTT((s) => s.set);
  const setSession = useSession((s) => s.set);
  const [restore, setRestore] = useState<BackupFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const icon = (n: 'upload' | 'download' | 'send' | 'inbox') => <Thumb icon={n} bg={c.surface2} color={c.ink} size={32} />;

  const backup = async () => {
    setBusy(true);
    try {
      const s = useTT.getState() as unknown as Record<string, unknown>;
      const file = buildBackup(Object.fromEntries(BACKUP_KEYS.map((k) => [k, s[k]])));
      const ok = await shareJson(transferFileName('sao-luu'), file, 'Lưu bản sao lưu Thành Tâm');
      if (ok) {
        set({ lastBackupAt: Date.now() });
        track('backup_created', { anniversaries: file.counts.anniversaries });
        toast('Đã tạo bản sao lưu. Nhớ lưu vào Drive, mail hoặc Zalo của mình.');
      } else toast('Máy này chưa chia sẻ được tệp', { tone: 'error' });
    } catch {
      toast('Chưa tạo được bản sao lưu, thử lại sau', { tone: 'error' });
    }
    setBusy(false);
  };

  const openFile = async () => {
    try {
      const f = await pickJsonText();
      if (!f) return;
      const p = parseTransfer(f.text);
      if (p.kind === 'so-gio') {
        setSession({
          importDraft: { from: p.file.from, createdAt: p.file.createdAt, list: p.file.anniversaries, source: 'so-gio' },
        });
        router.push('/anniversaries/import');
      } else setRestore(p.file);
    } catch (e) {
      toast(e instanceof TransferError ? TRANSFER_MESSAGES[e.code] : 'Không mở được tệp này', { tone: 'error' });
    }
  };

  return (
    <Screen scroll>
      <AppBar title="Sao lưu và chia sẻ" onBack={goBack} />
      <T v="body" muted>
        Dữ liệu chỉ nằm trên máy này. Sao lưu ra một tệp để đổi máy không mất. Gửi sổ giỗ cho người trong nhà qua mail,
        Zalo; người nhận mở tệp trong Thành Tâm để thêm vào sổ của họ.
      </T>

      <SectionHeader title="Sao lưu" />
      <ListItem
        left={icon('upload')}
        title="Tạo bản sao lưu"
        subtitle={lastBackupAt ? `Lần gần nhất: ${fmt(lastBackupAt)}` : 'Chưa sao lưu lần nào'}
        chevron
        onPress={busy ? undefined : backup}
      />
      <ListItem
        left={icon('download')}
        title="Mở tệp sao lưu hoặc sổ giỗ"
        subtitle="Chọn tệp đã lưu hoặc nhận qua mail, Zalo, Drive"
        chevron
        divider={false}
        onPress={openFile}
      />

      <SectionHeader title="Sổ giỗ chung cả nhà" />
      <ListItem
        left={icon('send')}
        title="Gửi sổ giỗ cho người khác"
        subtitle={count ? `${count} ngày giỗ, chọn ngày nào muốn gửi` : 'Sổ giỗ đang trống'}
        chevron
        onPress={count ? () => router.push('/anniversaries/share') : undefined}
      />
      <ListItem
        left={icon('inbox')}
        title="Nhận sổ giỗ từ người khác"
        subtitle="Thêm vào sổ của mình, không xóa gì. Ngày trùng sẽ hỏi trước khi ghi đè."
        chevron
        divider={false}
        onPress={openFile}
      />
      <T v="caption" muted>
        Mỗi người giữ một sổ trên máy mình. Khi có ai thêm hay sửa ngày giỗ, gửi lại sổ cho cả nhà để cập nhật.
      </T>

      <Sheet visible={!!restore && !confirmReplace} onClose={() => setRestore(null)} title="Mở bản sao lưu">
        {restore ? (
          <T v="body">
            Bản sao lưu ngày {fmt(restore.createdAt || Date.now())}: {restore.counts.anniversaries} ngày giỗ,{' '}
            {restore.counts.people} người trong nhà.
          </T>
        ) : null}
        <Button
          title="Chỉ thêm sổ giỗ"
          onPress={() => {
            if (!restore) return;
            setSession({
              importDraft: {
                createdAt: restore.createdAt,
                list: (restore.data.anniversaries ?? []) as never,
                source: 'sao-luu',
              },
            });
            setRestore(null);
            router.push('/anniversaries/import');
          }}
        />
        <T v="caption" muted>
          Giữ nguyên dữ liệu đang có, thêm ngày giỗ chưa có, hỏi trước khi ghi đè ngày trùng.
        </T>
        <Button title="Thay toàn bộ dữ liệu" variant="danger" onPress={() => setConfirmReplace(true)} />
        <Button title="Hủy" variant="text" onPress={() => setRestore(null)} />
      </Sheet>
      <Dialog
        visible={confirmReplace}
        destructive
        title="Thay toàn bộ dữ liệu?"
        body="Tên gia chủ, sổ giỗ, người trong nhà và cài đặt trên máy này sẽ được thay bằng bản sao lưu. Không hoàn tác được."
        confirm="Thay toàn bộ"
        cancel="Hủy"
        onCancel={() => setConfirmReplace(false)}
        onConfirm={() => {
          if (restore) {
            set({ ...(restore.data as object), onboarded: true });
            track('backup_restored', { anniversaries: restore.counts.anniversaries });
            toast('Đã khôi phục từ bản sao lưu');
          }
          setConfirmReplace(false);
          setRestore(null);
        }}
      />
    </Screen>
  );
}
