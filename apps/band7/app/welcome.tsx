import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Icon, Row, Screen, T, TextField, useTheme, useToast } from '@nam/ui';
import { ApiError, sendEmailCode, serverEnabled, signInAnonymously, verifyEmailCode } from '../src/api';
import { useBand7 } from '../src/store';

const POINTS = [
  'Lộ trình riêng theo trình độ, ngày thi và band bạn muốn',
  'Lỗi nào sửa dứt lỗi đó: giám khảo hỏi lại đến khi bạn hết sai',
  'Giải thích lỗi bằng tiếng Việt, so với cách người Việt hay nói',
];

/** 0a · Chào mừng & đăng nhập (email bằng mã 6 số, hoặc dùng thử không cần tài khoản). */
export default function Welcome() {
  const { c } = useTheme();
  const toast = useToast();
  const set = useBand7((s) => s.set);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'start' | 'email' | 'code'>('start');
  const [busy, setBusy] = useState(false);

  const next = () => {
    set({ onboarded: true });
    router.replace('/placement');
  };
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast(e instanceof ApiError ? e.messageVi : 'Có lỗi, thử lại sau.', { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      scroll
      footer={
        step === 'start' ? (
          <View style={{ gap: 10 }}>
            {serverEnabled() ? (
              <>
                <Button title="Đăng nhập bằng email" icon="mail" onPress={() => setStep('email')} />
                <Button
                  title="Dùng thử không cần tài khoản"
                  variant="secondary"
                  loading={busy}
                  onPress={() =>
                    run(async () => {
                      await signInAnonymously();
                      next();
                    })
                  }
                />
              </>
            ) : (
              <Button title="Bắt đầu" onPress={next} />
            )}
            <T v="caption" muted center>
              Bản ghi âm chỉ dùng để chấm bài của bạn.
            </T>
          </View>
        ) : null
      }
    >
      <View style={{ height: 24 }} />
      <Row gap={10}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: c.a2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <T v="headline" color="#121826">
            B7
          </T>
        </View>
        <T v="title">Band7</T>
      </Row>
      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
        <View
          style={{
            width: 148,
            height: 148,
            borderRadius: 74,
            backgroundColor: c.at,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="mic" size={64} color={c.a} />
        </View>
      </View>
      <T v="display" center>
        Nói tiếng Anh mỗi ngày với giám khảo AI
      </T>
      <View style={{ gap: 10, marginTop: 8 }}>
        {POINTS.map((p) => (
          <Row key={p} gap={10} style={{ alignItems: 'flex-start' }}>
            <Icon name="check" size={18} color={c.positive} />
            <T v="body" style={{ flex: 1 }}>
              {p}
            </T>
          </Row>
        ))}
      </View>

      {step === 'email' ? (
        <Card style={{ marginTop: 12 }}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="ban@email.com"
          />
          <Button
            title="Gửi mã"
            loading={busy}
            disabled={!/^\S+@\S+\.\S+$/.test(email)}
            onPress={() =>
              run(async () => {
                await sendEmailCode(email.trim());
                setStep('code');
              })
            }
          />
          <Button title="Quay lại" variant="text" onPress={() => setStep('start')} />
        </Card>
      ) : null}
      {step === 'code' ? (
        <Card style={{ marginTop: 12 }}>
          <T v="body">Nhập mã 6 số đã gửi tới {email}</T>
          <TextField value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} placeholder="123456" />
          <Button
            title="Xác nhận"
            loading={busy}
            disabled={code.length !== 6}
            onPress={() =>
              run(async () => {
                await verifyEmailCode(email.trim(), code);
                next();
              })
            }
          />
        </Card>
      ) : null}
    </Screen>
  );
}
