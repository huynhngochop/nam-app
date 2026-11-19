import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import {
  AppBar,
  Badge,
  Button,
  Card,
  Chip,
  Chips,
  EmptyState,
  IconButton,
  ListItem,
  Row,
  Screen,
  Segmented,
  Sheet,
  Stepper,
  T,
  TextField,
  useLayout,
  useTheme,
  useToast,
} from '@nam/ui';
import { addDays, dateKey, minutesLabel, track } from '@nam/core';
import { Task, useNhip } from '../src/store';

type Filter = 'today' | 'upcoming' | 'done';

/** Việc cần làm; thêm, sửa việc trong sheet. ?pick=1 → chọn việc cho phiên. */
export default function Tasks() {
  const { c } = useTheme();
  const layout = useLayout();
  const toast = useToast();
  const { pick } = useLocalSearchParams<{ pick?: string }>();
  const state = useNhip();
  const [filter, setFilter] = useState<Filter>('today');
  const [edit, setEdit] = useState<Task | 'new' | null>(null);
  const [title, setTitle] = useState('');
  const [est, setEst] = useState(2);
  const [due, setDue] = useState(dateKey(new Date()));
  const today = dateKey(new Date());

  const list = useMemo(
    () =>
      state.tasks
        .filter((t) =>
          filter === 'done' ? t.finished : !t.finished && (filter === 'today' ? t.due <= today : t.due > today),
        )
        .sort((a, b) => a.order - b.order),
    [state.tasks, filter, today],
  );
  const sum = state.tasks.filter((t) => !t.finished && t.due <= today).reduce((a, t) => a + Math.max(0, t.est - t.done), 0);

  const openEdit = (t: Task | 'new') => {
    setEdit(t);
    if (t === 'new') {
      setTitle('');
      setEst(2);
      setDue(today);
    } else {
      setTitle(t.title);
      setEst(t.est);
      setDue(t.due);
    }
  };
  const saveTask = () => {
    if (edit === 'new') {
      state.addTask(title, est, due);
      track('task_created', { est });
      toast('Đã thêm');
    } else if (edit) state.updateTask(edit.id, { title, est, due });
    setEdit(null);
  };

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: layout.gutter, gap: 12 }}>
        <AppBar
          title={pick ? 'Chọn việc' : 'Việc cần làm'}
          onBack={() => router.back()}
          right={<IconButton icon="plus" label="Thêm việc" color={c.a} bg={c.at} onPress={() => openEdit('new')} />}
        />
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { key: 'today', label: `Hôm nay (${state.tasks.filter((t) => !t.finished && t.due <= today).length})` },
            { key: 'upcoming', label: 'Sắp tới' },
            { key: 'done', label: 'Đã xong' },
          ]}
        />
      </View>
      <FlashList
        data={list}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingHorizontal: layout.gutter, paddingBottom: 24 }}
        ListEmptyComponent={
          <EmptyState
            icon="list"
            title="Chưa có việc nào"
            body="Thêm việc để biết mỗi phiên dành cho điều gì."
            action="Thêm việc"
            onAction={() => openEdit('new')}
          />
        }
        ListFooterComponent={
          filter === 'today' && sum ? (
            <Card variant="tint" style={{ marginTop: 12 }}>
              <Row between>
                <T v="headline">Ước tính hôm nay</T>
                <T v="headline" accent>{`${sum} phiên`}</T>
              </Row>
              <T v="caption">{`≈ ${minutesLabel(sum * state.settings.focusMin)} · mục tiêu ${minutesLabel(state.goalMin)}`}</T>
            </Card>
          ) : null
        }
        renderItem={({ item }) => (
          <ListItem
            left={
              <IconButton
                soft={false}
                icon={item.finished ? 'check-square' : 'square'}
                color={item.finished ? c.a : c.inkMuted}
                label="Đánh dấu xong"
                onPress={() => state.updateTask(item.id, { finished: !item.finished })}
              />
            }
            title={item.title}
            subtitle={`${item.done}/${item.est} phiên${item.due > today ? ` · ${item.due.slice(8)}/${item.due.slice(5, 7)}` : ''}`}
            right={
              state.currentTaskId === item.id ? (
                <Badge label="Đang làm" tone="accent" />
              ) : (
                <IconButton
                  soft={false}
                  icon="play"
                  label="Bắt đầu với việc này"
                  onPress={() => {
                    state.set({ currentTaskId: item.id });
                    router.back();
                  }}
                />
              )
            }
            onPress={() => {
              if (pick) {
                state.set({ currentTaskId: item.id });
                router.back();
              } else openEdit(item);
            }}
            onLongPress={() => {
              state.removeTask(item.id);
              toast('Đã xóa việc');
            }}
          />
        )}
      />
      <Sheet
        visible={!!edit}
        onClose={() => setEdit(null)}
        title={edit === 'new' ? 'Thêm việc' : 'Sửa việc'}
        footer={<Button title={edit === 'new' ? 'Thêm việc' : 'Lưu'} disabled={!title.trim()} onPress={saveTask} />}
      >
        <TextField
          label="Tên việc"
          value={title}
          onChangeText={setTitle}
          maxLength={80}
          autoFocus
          placeholder="Chuẩn bị slide họp thứ Hai"
        />
        <Row between>
          <T v="body">Số phiên ước tính</T>
          <Stepper value={est} onChange={setEst} min={1} max={12} />
        </Row>
        <Chips>
          <Chip label="Hôm nay" selected={due === today} onPress={() => setDue(today)} />
          <Chip
            label="Ngày mai"
            selected={due === dateKey(addDays(new Date(), 1))}
            onPress={() => setDue(dateKey(addDays(new Date(), 1)))}
          />
          <Chip
            label="Tuần sau"
            selected={due === dateKey(addDays(new Date(), 7))}
            onPress={() => setDue(dateKey(addDays(new Date(), 7)))}
          />
        </Chips>
        {edit && edit !== 'new' ? (
          <Button
            title="Xóa việc"
            variant="danger"
            size="sm"
            onPress={() => {
              state.removeTask(edit.id);
              setEdit(null);
            }}
          />
        ) : null}
      </Sheet>
    </Screen>
  );
}
