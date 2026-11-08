// Thành Tâm: gửi, nhận sổ giỗ và sao lưu bằng tệp. Nhập không làm mất dữ liệu đang có; trùng thì hỏi.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BACKUP_KEYS,
  MAX_IMPORT,
  TransferError,
  applyImport,
  buildBackup,
  buildSoGio,
  cleanAnniversary,
  diffFields,
  parseTransfer,
  personKey,
  planImport,
  transferFileName,
} from '../apps/thanh-tam/src/lib/transfer';
import type { Anniversary } from '../apps/thanh-tam/src/lib/schedule';

const gio = (id: string, name: string, day: number, month: number, extra: Partial<Anniversary> = {}): Anniversary => ({
  id,
  name,
  relation: 'Ông nội',
  lunar: { day, month, leap: false },
  missingDayRule: 'ngay-cuoi-thang',
  remindDays: [7, 3, 1],
  ...extra,
});
let n = 0;
const newId = () => `new-${++n}`;

test('gửi rồi nhận lại: đọc được, đủ ngày giỗ, tên tệp dễ nhận', () => {
  const f = buildSoGio([gio('a', 'Nguyễn Văn An', 12, 3)], 'Lan', 1);
  const p = parseTransfer(JSON.stringify(f));
  assert.equal(p.kind, 'so-gio');
  assert.equal(p.kind === 'so-gio' && p.file.anniversaries[0].name, 'Nguyễn Văn An');
  assert.equal(p.kind === 'so-gio' && p.file.from, 'Lan');
  assert.equal(transferFileName('so-gio', new Date(2026, 10, 8)), 'ThanhTam-sogio-20261108.json');
  assert.equal(transferFileName('sao-luu', new Date(2026, 0, 5)), 'ThanhTam-saoluu-20260105.json');
});

test('tệp lạ, hỏng, rỗng, bản mới hơn: báo lỗi rõ, không làm gì dữ liệu', () => {
  const code = (t: string) => {
    try {
      parseTransfer(t);
      return 'ok';
    } catch (e) {
      return (e as TransferError).code;
    }
  };
  assert.equal(code('{không phải json'), 'KHONG_DOC_DUOC');
  assert.equal(code('{"app":"vi-gon","kind":"so-gio","v":1}'), 'KHONG_PHAI_TEP_THANH_TAM');
  assert.equal(code('{"app":"thanh-tam","kind":"so-gio","v":2,"anniversaries":[]}'), 'PHIEN_BAN_MOI');
  assert.equal(code('{"app":"thanh-tam","kind":"so-gio","v":1,"anniversaries":[]}'), 'RONG');
  const big = {
    app: 'thanh-tam',
    kind: 'so-gio',
    v: 1,
    anniversaries: Array(MAX_IMPORT + 1).fill(gio('x', 'A', 1, 1)),
  };
  assert.equal(code(JSON.stringify(big)), 'QUA_LON');
});

test('bản ghi sai trong tệp bị bỏ, phần đúng vẫn nhập; chữ quá dài bị cắt', () => {
  assert.equal(cleanAnniversary({ name: '', lunar: { day: 1, month: 1 } }), null);
  assert.equal(cleanAnniversary({ name: 'A', lunar: { day: 31, month: 1 } }), null);
  assert.equal(cleanAnniversary({ name: 'A', lunar: { day: 1, month: 13 } }), null);
  assert.equal(cleanAnniversary('chuỗi'), null);
  const a = cleanAnniversary({
    name: 'x'.repeat(500),
    lunar: { day: 30, month: 12, leap: 'có' },
    remindDays: [1, 99, 3, 3, 'a'],
  })!;
  assert.equal(a.name.length, 80);
  assert.equal(a.lunar.leap, false);
  assert.deepEqual(a.remindDays, [3, 1]);
  assert.equal(a.missingDayRule, 'ngay-cuoi-thang');
  const mixed = { app: 'thanh-tam', kind: 'so-gio', v: 1, anniversaries: [gio('a', 'A', 1, 1), { name: 'hỏng' }] };
  const p = parseTransfer(JSON.stringify(mixed));
  assert.equal(p.kind === 'so-gio' && p.file.anniversaries.length, 1);
});

test('nhập: mới thì thêm, giống hệt thì bỏ qua, khác nội dung thì hỏi', () => {
  const mine = [gio('m1', 'Nguyễn Văn An', 12, 3), gio('m2', 'Trần Thị Bình', 5, 7)];
  const theirs = [
    gio('t1', 'nguyễn văn  an', 12, 3), // cùng người, viết khác hoa thường/khoảng trắng → nội dung khác (tên) → hỏi
    gio('t2', 'Trần Thị Bình', 5, 7), // giống hệt → bỏ qua
    gio('t3', 'Lê Văn Cường', 1, 1), // mới
  ];
  theirs[0] = { ...theirs[0], name: 'Nguyễn Văn An', dishes: 'Xôi gấc' };
  const plan = planImport(mine, theirs);
  assert.equal(plan.add.length, 1);
  assert.equal(plan.identical, 1);
  assert.equal(plan.conflicts.length, 1);
  assert.equal(plan.conflicts[0].why, 'cung-nguoi');
  assert.deepEqual(diffFields(plan.conflicts[0].mine, plan.conflicts[0].theirs), ['món cúng']);
});

test('trùng: chọn giữ thì bản trên máy không đổi; chọn ghi đè thì thay nội dung, giữ mã; không mất bản ghi nào', () => {
  const mine = [gio('m1', 'An', 12, 3), gio('m2', 'Bình', 5, 7), gio('m3', 'Không liên quan', 9, 9)];
  const theirs = [
    gio('m1', 'An', 12, 3, { relation: 'Cụ' }),
    gio('x', 'Bình', 5, 7, { dishes: 'Chè' }),
    gio('y', 'Mới', 2, 2),
  ];
  const plan = planImport(mine, theirs);
  assert.equal(plan.conflicts.length, 2);
  assert.equal(plan.conflicts[0].why, 'cung-ma');
  const keep = applyImport(mine, plan, ['giu', 'giu'], newId);
  assert.equal(keep.list.length, 4);
  assert.equal(keep.overwritten, 0);
  assert.equal(keep.list.find((a) => a.id === 'm1')!.relation, 'Ông nội');
  const over = applyImport(mine, plan, ['ghi-de', 'ghi-de'], newId);
  assert.equal(over.list.length, 4);
  assert.equal(over.overwritten, 2);
  assert.equal(over.list.find((a) => a.id === 'm1')!.relation, 'Cụ');
  assert.equal(over.list.find((a) => a.id === 'm2')!.dishes, 'Chè');
  assert.ok(
    over.list.some((a) => a.id === 'm3'),
    'bản ghi không liên quan vẫn còn',
  );
  assert.ok(
    over.list.some((a) => a.id === 'y'),
    'bản mới giữ mã từ tệp',
  );
});

test('mã trong tệp trùng mã một người khác trên máy: cấp mã mới, không đè nhầm', () => {
  const mine = [gio('same', 'Người A', 1, 1)];
  const theirs = [{ ...gio('same', 'Người B', 2, 2) }];
  // cùng mã nhưng khác người: coi là trùng theo mã → hỏi, không tự thay
  const plan = planImport(mine, theirs);
  assert.equal(plan.conflicts.length, 1);
  const r = applyImport(mine, plan, ['giu'], newId);
  assert.equal(r.list.length, 1);
  assert.equal(r.list[0].name, 'Người A');
});

test('tệp có hai dòng cùng một người: chỉ lấy một', () => {
  const plan = planImport([], [gio('a', 'An', 1, 1), gio('b', 'AN', 1, 1)]);
  assert.equal(plan.add.length, 1);
  assert.equal(personKey(gio('z', '  Đặng  Thị Ơn ', 3, 4)), 'dang thi on|3/4');
});

test('sao lưu: chỉ khóa cho phép, đọc lại đủ; khóa lạ trong tệp bị bỏ', () => {
  const state: Record<string, unknown> = {
    household: { tinChu: 'Lan' },
    anniversaries: [gio('a', 'An', 1, 1)],
    people: [{ id: 'p' }],
    recordings: { x: { uri: 'file:///riêng-máy' } },
    tamAn: true,
  };
  const b = buildBackup(state as never, 5);
  assert.ok(!('recordings' in b.data) && !('tamAn' in b.data));
  assert.deepEqual(b.counts, { anniversaries: 1, people: 1 });
  const p = parseTransfer(JSON.stringify({ ...b, data: { ...b.data, hacked: 1 } }));
  assert.equal(p.kind, 'sao-luu');
  if (p.kind === 'sao-luu') {
    assert.ok(!('hacked' in p.file.data));
    assert.equal((p.file.data.household as { tinChu: string }).tinChu, 'Lan');
    for (const k of Object.keys(p.file.data)) assert.ok((BACKUP_KEYS as readonly string[]).includes(k));
  }
});

test('dữ liệu lớn: so trùng 5.000 ngày giỗ với 5.000 trên máy dưới 300 ms', () => {
  const mine = Array.from({ length: 5000 }, (_, i) => gio(`m${i}`, `Người ${i}`, (i % 30) + 1, (i % 12) + 1));
  const theirs = Array.from({ length: 5000 }, (_, i) =>
    gio(`t${i}`, `Người ${i + 2500}`, ((i + 2500) % 30) + 1, ((i + 2500) % 12) + 1),
  );
  const t0 = performance.now();
  const plan = planImport(mine, theirs);
  const r = applyImport(
    mine,
    plan,
    plan.conflicts.map(() => 'giu'),
    newId,
  );
  const ms = performance.now() - t0;
  assert.equal(plan.identical, 2500, 'nửa sau trùng hệt nửa trên máy');
  assert.equal(plan.conflicts.length, 0);
  assert.equal(plan.add.length, 2500);
  assert.equal(r.list.length, 5000 + plan.add.length);
  assert.ok(ms < 300, `${ms} ms`);
});
