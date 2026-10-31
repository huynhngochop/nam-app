import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Badge,
  Button,
  Card,
  Chip,
  Chips,
  Grid,
  Icon,
  LineChart,
  ListItem,
  ProgressBar,
  Row,
  Screen,
  SectionHeader,
  T,
  Thumb,
  useTheme,
} from '@nam/ui';
import { shortMoney, vnd } from '@nam/core';
import { byCategory, totals, useQuery } from '../../src/db';
import { catOf, periodOf, useVi } from '../../src/store';

/** VG-11 · Phân tích: dòng tiền, cơ cấu danh mục, dự báo (Pro). Tablet: 2 cột thẻ. */
export default function Analysis() {
  const { c } = useTheme();
  const s = useVi();
  const [months, setMonths] = useState(6);
  const cur = periodOf(s.monthStartDay);

  const series = useQuery(
    () =>
      Array.from({ length: months }, (_, k) => {
        const p = periodOf(s.monthStartDay, k - months + 1);
        const t = totals(p.from, p.to);
        return { month: p.month, income: t.income, expense: t.expense };
      }),
    [months, s.monthStartDay],
    [],
  );
  const cats = useQuery(() => byCategory(cur.from, cur.to), [cur.from], []);
  const totalExp = cats.reduce((a, x) => a + x.total, 0);
  const withData = series.filter((x) => x.income || x.expense);
  const avgSaved = withData.length ? withData.reduce((a, x) => a + x.income - x.expense, 0) / withData.length : 0;

  // Dự báo cuối kỳ: tốc độ chi trung bình/ngày × số ngày của kỳ (chỉ Pro).
  const elapsed = Math.max(1, (Date.now() - cur.from) / 86400000);
  const lengthDays = (cur.to - cur.from) / 86400000;
  const spent = series[series.length - 1]?.expense ?? 0;
  const forecast = Math.round((spent / elapsed) * lengthDays);

  return (
    <Screen scroll>
      <Row between>
        <T v="display" accessibilityRole="header">
          Phân tích
        </T>
      </Row>
      <Chips>
        {[3, 6, 12].map((m) => (
          <Chip key={m} label={`${m} tháng`} selected={months === m} onPress={() => setMonths(m)} />
        ))}
      </Chips>
      <Grid min={1}>
        <Card>
          <Row between>
            <T v="headline">Dòng tiền</T>
            <T v="caption">
              <T v="caption" color={c.a}>
                — Thu
              </T>
              {'  '}
              <T v="caption" color={c.negative}>
                - - Chi
              </T>
            </T>
          </Row>
          {withData.length >= 2 ? (
            <LineChart
              series={[
                { values: series.map((x) => x.income), color: c.a },
                { values: series.map((x) => x.expense), color: c.negative, dashed: true },
              ]}
            />
          ) : (
            <T v="caption" muted>
              Cần ít nhất 2 tháng dữ liệu để vẽ biểu đồ.
            </T>
          )}
          <Row between>
            {series.map((x) => (
              <T key={x.month} v="caption" muted style={{ fontSize: 11 }}>{`T${x.month}`}</T>
            ))}
          </Row>
          <T v="caption">
            {`Tiết kiệm trung bình `}
            <T
              v="caption"
              weight="bold"
              color={avgSaved >= 0 ? c.positive : c.negative}
            >{`${shortMoney(avgSaved)}/tháng`}</T>
          </T>
        </Card>
        <Card>
          <Row between>
            <T v="headline">{`Chi theo danh mục · ${cur.label}`}</T>
          </Row>
          {cats.length ? (
            cats.slice(0, 8).map((x) => {
              const cat = catOf(x.categoryId, s.categories);
              const limit = s.budgets[x.categoryId];
              return (
                <View key={x.categoryId} style={{ gap: 4 }}>
                  <Row between>
                    <T v="body">{cat.name}</T>
                    <T v="headline">{shortMoney(x.total)}</T>
                  </Row>
                  <ProgressBar
                    value={totalExp ? x.total / totalExp : 0}
                    color={limit && x.total > limit ? c.negative : limit && x.total > limit * 0.8 ? c.warning : c.a}
                  />
                </View>
              );
            })
          ) : (
            <T v="caption" muted>
              Chưa có khoản chi nào trong kỳ này.
            </T>
          )}
        </Card>
        <Card onPress={s.isPro ? undefined : () => router.push('/paywall')} accessibilityLabel="Dự báo cuối tháng">
          <Row between>
            <Row>
              <Icon name={s.isPro ? 'trending-up' : 'lock'} color={c.a} />
              <T v="headline">Dự báo cuối kỳ</T>
            </Row>
            {!s.isPro ? <Badge label="Pro" tone="pro" /> : null}
          </Row>
          {s.isPro ? (
            <>
              <T v="title">{vnd(forecast)}</T>
              <T v="caption" color={s.monthlyBudget && forecast > s.monthlyBudget ? c.negative : c.inkMuted}>
                {s.monthlyBudget
                  ? forecast > s.monthlyBudget
                    ? `Có thể vượt ngân sách ${vnd(forecast - s.monthlyBudget)}`
                    : `Dưới ngân sách ${vnd(s.monthlyBudget - forecast)}`
                  : 'Theo tốc độ chi hiện tại'}
              </T>
            </>
          ) : (
            <T v="caption" muted>
              Ước tính chi tiêu, cảnh báo sớm khi sắp vượt.
            </T>
          )}
        </Card>
        <View style={{ gap: 4 }}>
          <SectionHeader title="Công cụ" />
          <ListItem
            left={<Thumb icon="message-circle" color={c.a} bg={c.at} />}
            title="Hỏi Ví Gọn"
            subtitle="Tính ngay trên máy"
            chevron
            onPress={() => router.push('/ask')}
          />
          <ListItem
            left={<Thumb icon="file-text" color={c.a} bg={c.at} />}
            title="Tổng kết tháng"
            subtitle="Nhận xét & gợi ý kỳ tới"
            chevron
            onPress={() => router.push('/summary')}
          />
          <ListItem
            left={<Thumb icon="sliders" color={c.a} bg={c.at} />}
            title="Ngân sách danh mục"
            chevron
            onPress={() => router.push('/budgets')}
          />
          <ListItem
            left={<Thumb icon="tag" color={c.a} bg={c.at} />}
            title="Danh mục & quy tắc"
            chevron
            onPress={() => router.push('/categories')}
            divider={false}
          />
        </View>
      </Grid>
      {!withData.length ? (
        <Button title="Thêm giao dịch đầu tiên" variant="secondary" onPress={() => router.push('/add')} />
      ) : null}
    </Screen>
  );
}
