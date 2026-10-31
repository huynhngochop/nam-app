import React, { useRef, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Icon, IconButton, Row, T, useLayout, useToast } from '@nam/ui';
import { track } from '@nam/core';
import { ingName } from '../src/data/recipes';
import { detectIngredients, QUICK_GUESSES } from '../src/lib/detect';
import { useMeo } from '../src/store';

const DARK = '#14110f';
const SOFT = 'rgba(255,255,255,0.12)';
const INK = '#f2efea';

/** MN-10 Chụp nguyên liệu · MN-18 Camera bị từ chối · MN-19 Không nhận ra. Màn luôn nền tối. */
export default function Scan() {
  const L = useLayout();
  const toast = useToast();
  const addPantry = useMeo((s) => s.addPantry);
  const pantry = useMeo((s) => s.pantry);
  const [perm, requestPerm] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [torch, setTorch] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [guessing, setGuessing] = useState(false);

  const analyze = async (uri: string) => {
    setBusy(true);
    const found = await detectIngredients(uri);
    setBusy(false);
    const sure = found.filter((d) => d.confidence >= 0.7).map((d) => d.ingredientId);
    if (sure.length) setPicked((p) => Array.from(new Set([...p, ...sure])));
    else setGuessing(true);
  };
  const shoot = async () => {
    const photo = await cam.current?.takePictureAsync({ quality: 0.5, skipProcessing: true });
    if (photo?.uri) analyze(photo.uri);
  };
  const gallery = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5 });
    if (!r.canceled) analyze(r.assets[0].uri);
  };
  const confirm = () => {
    addPantry(picked);
    track('scan_confirmed', { kept: picked.length });
    toast(`Đã thêm ${picked.length} nguyên liệu`, { tone: 'success' });
    router.back();
  };
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const header = (
    <Row between style={{ paddingHorizontal: 16, minHeight: 52 }}>
      <IconButton icon="x" label="Đóng" bg={SOFT} color={INK} onPress={() => router.back()} />
      <T v="headline" color={INK}>
        Chụp nguyên liệu
      </T>
      {perm?.granted ? (
        <IconButton
          icon="zap"
          label="Đèn"
          bg={torch ? '#a64a22' : SOFT}
          color={INK}
          onPress={() => setTorch((t) => !t)}
        />
      ) : (
        <View style={{ width: 40 }} />
      )}
    </Row>
  );

  if (perm && !perm.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DARK }}>
        {header}
        <View
          style={{
            flex: 1,
            margin: 16,
            borderRadius: 22,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: 24,
            backgroundColor: '#2a2724',
          }}
        >
          <Icon name="camera" size={40} color="#bdb6ad" />
          <T v="headline" color={INK} center>
            Mẹo Nhà chưa được dùng camera
          </T>
          <T v="caption" color="#bdb6ad" center>
            Ảnh chỉ xử lý trên máy để nhận nguyên liệu, không lưu, không gửi đi.
          </T>
        </View>
        <View style={{ padding: 16, gap: 10, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          <Button
            title={perm.canAskAgain ? 'Cho phép camera' : 'Mở Cài đặt'}
            onPress={() => (perm.canAskAgain ? requestPerm() : Linking.openSettings())}
          />
          <Row>
            <Button
              title="Chọn ảnh"
              icon="image"
              variant="secondary"
              color={SOFT}
              textColor={INK}
              onPress={gallery}
              style={{ backgroundColor: SOFT }}
            />
            <Button
              title="Gõ tên"
              icon="edit-2"
              variant="secondary"
              textColor={INK}
              // M14: mở thẳng ô thêm nguyên liệu ở Tủ lạnh (trước đây chỉ quay lại, không làm gì khi mở trực tiếp).
              onPress={() => router.replace({ pathname: '/(tabs)/fridge', params: { add: '1' } })}
              style={{ backgroundColor: SOFT }}
            />
          </Row>
        </View>
      </SafeAreaView>
    );
  }

  const camH = L.landscape ? undefined : ('58%' as const);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK }}>
      {header}
      <View style={{ flex: 1, flexDirection: L.landscape ? 'row' : 'column', gap: 12, padding: 16 }}>
        <View
          style={{
            flex: L.landscape ? 1 : undefined,
            height: camH,
            borderRadius: 22,
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.7)',
            backgroundColor: '#2a2724',
          }}
        >
          {perm?.granted ? <CameraView ref={cam} style={{ flex: 1 }} facing="back" enableTorch={torch} /> : null}
          <T v="caption" color={INK} center style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
            {busy
              ? 'Đang nhận diện…'
              : guessing
                ? 'Chưa nhận ra chắc chắn — chọn nhanh bên dưới'
                : 'Đưa nguyên liệu vào khung, giữ yên 1 giây'}
          </T>
        </View>
        <View style={{ flex: L.landscape ? 1 : 1, gap: 12, justifyContent: 'space-between' }}>
          <View style={{ gap: 8 }}>
            <Row between>
              <T v="headline" color={INK}>{`Đã chọn ${picked.length} nguyên liệu`}</T>
            </Row>
            <T v="caption" color="#bdb6ad">
              {guessing ? 'Có phải là…' : 'Chạm để chọn nguyên liệu bạn thấy'}
            </T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {QUICK_GUESSES.filter((id) => !pantry.includes(id)).map((id) => (
                <Chip key={id} label={ingName(id)} selected={picked.includes(id)} onPress={() => toggle(id)} />
              ))}
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Row between>
              <IconButton icon="image" label="Chọn ảnh" bg={SOFT} color={INK} onPress={gallery} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Chụp"
                onPress={shoot}
                disabled={!perm?.granted}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  borderWidth: 4,
                  borderColor: INK,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: INK }} />
              </Pressable>
              <IconButton
                icon="check"
                label="Thêm vào tủ lạnh"
                bg={picked.length ? '#a64a22' : SOFT}
                color="#ffffff"
                onPress={() => (picked.length ? confirm() : router.back())}
              />
            </Row>
            <Row style={{ justifyContent: 'center' }}>
              <Icon name="shield" size={12} color="#bdb6ad" />
              <T v="caption" color="#bdb6ad">
                Xử lý trên máy · ảnh không rời điện thoại
              </T>
            </Row>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
