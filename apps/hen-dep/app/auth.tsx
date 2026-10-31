import React, { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Icon, Row, Screen, T, TextField, useTheme } from '@nam/ui';
import { getConfig, track } from '@nam/core';
import { useHen } from '../src/store';

const VN_PHONE = /^(0|\+?84)(3|5|7|8|9)\d{8}$/;

/**
 * Mã thử 123456 (và mã mời bất kỳ) chỉ dùng được ở bản dev / preview khi chưa có máy chủ.
 * Bản production thiếu EXPO_PUBLIC_API_BASE_URL thì không đăng nhập được (app.config.js cũng chặn build).
 * EXPO_PUBLIC_APP_VARIANT đặt theo profile trong eas.json.
 */
const VARIANT = process.env.EXPO_PUBLIC_APP_VARIANT;
const TEST_LOGIN = __DEV__ || VARIANT === 'development' || VARIANT === 'preview';
const TEST_CODE = '123456';

/** HD-C01 · Chủ tiệm đăng nhập bằng SĐT + mã OTP (Zalo/SMS). Chưa có máy chủ: mã thử (chỉ bản dev/preview). */
export default function Auth() {
  const { c } = useTheme();
  const set = useHen((s) => s.set);
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'invite'>('phone');
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const otpRef = useRef<TextInput>(null);
  const clean = phone.replace(/\s/g, '');

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const sendCode = async () => {
    if (!VN_PHONE.test(clean)) {
      setErr('Số điện thoại chưa đúng');
      return;
    }
    setErr(null);
    setStep('otp');
    setWait(30);
    track('owner_login_started');
    setTimeout(() => otpRef.current?.focus(), 200);
  };
  const verify = async (v: string) => {
    setCode(v);
    if (v.length < 6) return;
    const base = getConfig().apiBaseUrl;
    let ok = false;
    if (base) {
      try {
        const r = await fetch(`${base}/auth/otp/verify`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ phone: clean, code: v }),
        });
        ok = r.ok;
      } catch {
        setErr('Không kết nối được. Thử lại.');
        return;
      }
    } else if (TEST_LOGIN) ok = v === TEST_CODE;
    else {
      setErr('Chưa kết nối được máy chủ đăng nhập. Thử lại sau.');
      return;
    }
    if (!ok) {
      setErr('Mã chưa đúng. Kiểm tra lại tin nhắn.');
      return;
    }
    set({ auth: { phone: clean, role: 'owner' } });
    track('owner_signed_up');
    router.replace('/');
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 22,
          backgroundColor: c.a,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 24,
        }}
      >
        <Icon name="calendar" size={40} color={c.onAccent} />
      </View>
      <T v="display">Hẹn Đẹp cho chủ tiệm</T>
      <T v="caption" muted>
        Lịch hẹn, nhắc khách, doanh thu — gọn trong điện thoại.
      </T>
      {step === 'phone' ? (
        <>
          <TextField
            label="Số điện thoại"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            error={err ?? undefined}
            placeholder="0912 345 678"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
          <Button title="Nhận mã qua Zalo/SMS" onPress={sendCode} />
          <Row style={{ marginVertical: 4 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
            <T v="caption" muted>
              hoặc
            </T>
            <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
          </Row>
          <Button
            title="Tôi là nhân viên, có mã mời"
            icon="users"
            variant="secondary"
            onPress={() => setStep('invite')}
          />
          <T v="caption" muted center>
            Dùng thử miễn phí, không cần thẻ
          </T>
        </>
      ) : step === 'otp' ? (
        <>
          <T v="headline">Nhập mã 6 số</T>
          <T
            v="caption"
            muted
          >{`Đã gửi tới ${clean}.${!getConfig().apiBaseUrl && TEST_LOGIN ? ` Bản chạy thử: nhập ${TEST_CODE}.` : ''}`}</T>
          <TextField
            ref={otpRef}
            value={code}
            onChangeText={(v) => verify(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={6}
            error={err ?? undefined}
            style={{ fontSize: 24, letterSpacing: 12, textAlign: 'center' }}
          />
          <Button
            title={wait > 0 ? `Gửi lại mã sau ${wait}s` : 'Gửi lại mã'}
            variant="text"
            disabled={wait > 0}
            onPress={() => setWait(30)}
          />
          <Button
            title="Sửa số điện thoại"
            variant="text"
            onPress={() => {
              setStep('phone');
              setCode('');
              setErr(null);
            }}
          />
        </>
      ) : (
        <>
          <TextField
            label="Mã mời 6 ký tự"
            autoCapitalize="characters"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />
          <Button
            title="Vào tiệm"
            disabled={code.length < 6}
            onPress={() => {
              // Chưa có máy chủ kiểm tra mã mời: chỉ cho vào ở bản dev/preview.
              if (!getConfig().apiBaseUrl && !TEST_LOGIN) {
                setErr('Chưa kết nối được máy chủ. Thử lại sau.');
                return;
              }
              set({ auth: { phone: clean, role: 'staff' }, setupDone: true });
              router.replace('/');
            }}
          />
          {err ? (
            <T v="caption" color={c.negative}>
              {err}
            </T>
          ) : null}
          <Button title="Quay lại" variant="text" onPress={() => setStep('phone')} />
        </>
      )}
    </Screen>
  );
}
