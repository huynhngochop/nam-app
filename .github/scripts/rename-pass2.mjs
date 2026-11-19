// Dùng một lần, lượt 2: đặt tên theo nghĩa cho các biến một chữ mà lượt 1 chưa có quy tắc.
// Khóa: [tên cũ, phần đầu vế phải ('' = không có vế phải: for-of, catch), tên mới].
import path from 'node:path';
import { Node, Project, SyntaxKind } from 'ts-morph';

const MAP = {
  'apps/hen-dep/app/auth.tsx': [['r', 'await fetch', 'response']],
  'apps/hen-dep/app/campaign-ai.tsx': [
    ['p', 'useLocalSearchParams', 'routeParams'],
    ['r', 'await generatePromo', 'promo'],
  ],
  'apps/hen-dep/app/campaign.tsx': [['p', 'useLocalSearchParams', 'routeParams']],
  'apps/hen-dep/app/scan.tsx': [
    ['r', 'camera ?', 'pickerResult'],
    ['t', 'await recognizeText', 'recognized'],
    ['r', 'used < quota', 'parsed'],
    ['p', 'parsePrice(', 'price'],
  ],
  'apps/hen-dep/app/setup.tsx': [['h', 'hours.find', 'dayHours']],
  'apps/hen-dep/src/codes.ts': [['b', '', 'booking']],
  'apps/hen-dep/src/customerIndex.ts': [['b', '', 'booking']],
  'apps/hen-dep/src/priceBoard.ts': [['m', 'rest.match', 'priceMatch']],
  'apps/hen-dep/src/promo.ts': [
    ['w', 'i.window', 'timeWindow'],
    ['T', '{', 'templates'],
  ],
  'apps/hen-dep/src/reminders.ts': [
    ['b', '', 'booking'],
    ['h', '', 'hoursBefore'],
    ['t', 'null', 'timer'],
    ['d', 'r.notification', 'data'],
  ],
  'apps/hen-dep/src/seed.ts': [
    ['n', '2400', 'bookingCount'],
    ['b', '(', 'makeBooking'],
  ],
  'apps/hen-dep/src/store.ts': [
    ['b', '{ ...bk', 'booking'],
    ['b', '', 'booking'],
  ],
  'apps/hen-dep/src/sync.tsx': [
    ['t', 'b.startAt', 'slotStart'],
    ['h', 'state.shop.hours', 'dayHours'],
    ['b', 'c0.payload', 'remote'],
  ],
  'apps/hen-dep/src/Timeline.tsx': [['h', 'Math.max(28', 'height']],
  'apps/hen-dep/app/(tabs)/revenue.tsx': [['e', 'svcCount.get', 'entry']],
  'apps/hen-dep/app/booking/[id].tsx': [['b', 'useHen(', 'booking']],
  'apps/hen-dep/app/booking/new.tsx': [
    ['m', 'openMin', 'minute'],
    ['b', 'state.createBooking', 'booking'],
  ],
  'apps/meo-nha/app/ask.tsx': [['a', 'await ask', 'answer']],
  'apps/meo-nha/app/search.tsx': [['t', 'term.trim', 'query']],
  'apps/meo-nha/src/store.ts': [['t', 'today()', 'todayKey']],
  'apps/meo-nha/app/(tabs)/explore.tsx': [
    ['h', 'InteractionManager', 'task'],
    ['n', 'getConfig()', 'adEvery'],
  ],
  'apps/meo-nha/src/data/tips.ts': [
    ['d', 'tokens[1]', 'difficultyCode'],
    ['t', '', 'tip'],
  ],
  'apps/meo-nha/src/lib/ask.ts': [['d', '', 'danger']],
  'apps/meo-nha/src/lib/search.ts': [
    ['h', 'useMeo.getState', 'hidden'],
    ['f', 'cache.get', 'entry'],
    ['t', '', 'tip'],
    ['s', '0', 'score'],
    ['w', '', 'word'],
    ['g', 'groups.get', 'group'],
    ['l', '', 'list'],
  ],
  'apps/nhip/app/habits.tsx': [
    ['h', 'state.habits.find', 'habit'],
    ['r', 'state.habits.map', 'ratios'],
    ['r', 'ratioOf(', 'ratio'],
    ['v', 'valueOf(', 'value'],
  ],
  'apps/nhip/app/session.tsx': [['n', 'useNhip.getState().startPhase', 'next']],
  'apps/nhip/src/audio.ts': [['p', 'players.get', 'player']],
  'apps/nhip/src/store.ts': [
    ['d', 'dateKey(new Date())', 'todayKey'],
    ['m', '{ id: uid()', 'mix'],
    ['n', '0', 'count'],
  ],
  'apps/nhip/app/(tabs)/timer.tsx': [['s', 'useNhip()', 'store']],
  'apps/vi-gon/app/_layout.tsx': [['t', 'null', 'timer']],
  'apps/vi-gon/app/backup.tsx': [['r', 'await createBackup', 'backup']],
  'apps/vi-gon/app/budgets.tsx': [
    ['n', 'digits(', 'amount'],
    ['r', 'used / limit', 'ratio'],
    ['b', '{ ...state.budgets', 'nextBudgets'],
  ],
  'apps/vi-gon/app/import.tsx': [
    ['r', 'ingestText(', 'result'],
    ['r', 'ingestMany(', 'result'],
    ['t', 'await Clipboard', 'clipboard'],
  ],
  'apps/vi-gon/app/restore.tsx': [
    ['r', 'await DocumentPicker', 'picked'],
    ['m', 'readMeta(', 'meta'],
    ['r', 'await restoreBackup', 'result'],
    ['n', 'tries + 1', 'attempts'],
  ],
  'apps/vi-gon/app/review.tsx': [['t', '', 'tx']],
  'apps/vi-gon/src/answer.ts': [
    ['f', 'ctx.funds.find', 'fund'],
    ['p', 'periodOf(', 'currentPeriod'],
    ['n', 'countOf(', 'count'],
    ['v', 'cat ?', 'value'],
  ],
  'apps/vi-gon/src/ask.ts': [
    ['m', 'folded.match', 'monthMatch'],
    ['w', '', 'word'],
    ['m', 'now.getMonth()', 'monthIndex'],
    ['s', 'd0.getTime()', 'weekStart'],
    ['a', 'month(-1)', 'lastMonth'],
    ['b', 'month(-2)', 'monthBefore'],
    ['a', 'month(0)', 'thisMonth'],
    ['b', 'month(-1)', 'lastMonth'],
  ],
  'apps/vi-gon/src/backup.ts': [
    ['s', "''", 'encoded'],
    ['f', 'new File(', 'backupFile'],
  ],
  'apps/vi-gon/src/db.ts': [['r', '', 'result']],
  'apps/vi-gon/src/ingest.ts': [
    ['r', '{ saved', 'summary'],
    ['p', '', 'part'],
  ],
  'apps/vi-gon/src/listener.ts': [['n', 'native', 'nativeModule']],
  'apps/vi-gon/src/parse.ts': [
    ['t', 'text.replace', 'cleaned'],
    ['m', 'withoutBal.match(MONEY)', 'moneyMatch'],
    ['n', 'withoutBal.match(', 'amountMatch'],
    ['r', 'rules.find', 'rule'],
    ['b', 'BUILTIN.find', 'builtin'],
  ],
  'apps/vi-gon/src/store.ts': [['m', 'now.getMonth()', 'month']],
  'apps/vi-gon/src/summary.ts': [
    ['t', 'totals(', 'periodTotal'],
    ['c', '', 'category'],
  ],
  'apps/vi-gon/src/transfer.ts': [
    ['a', 'kindOf(self)', 'selfKind'],
    ['b', 'kindOf(pair)', 'pairKind'],
  ],
  'apps/vi-gon/src/ui.tsx': [['r', 'await LocalAuthentication', 'auth']],
  'apps/vi-gon/app/(tabs)/home.tsx': [['t', 'useQuery(', 'total']],
  'apps/vi-gon/app/(tabs)/transactions.tsx': [['d', 'startOfDay(', 'dayStart']],
  'apps/vi-gon/app/fund/[id].tsx': [
    ['f', 'fund!', 'current'],
    ['n', 'monthlyNeed(', 'monthly'],
    ['a', 'digits(', 'value'],
  ],
  'apps/vi-gon/app/onboarding/permission.tsx': [['p', 'await checkPermission', 'permission']],
  'packages/core/src/ai.ts': [['d', '', 'data']],
  'packages/core/src/format.ts': [
    ['a', 'Math.abs(n)', 'absolute'],
    ['s', 'Math.round((now', 'seconds'],
  ],
  'packages/ui/src/components/base.tsx': [
    ['h', "size === 'lg'", 'buttonHeight'],
    ['s', '{ backgroundColor', 'cardStyle'],
  ],
  'tests/core-stub.ts': [['n', '0', 'counter']],
  'tests/logic.test.ts': [['q', '', 'question']],
  'tests/qa-high.test.ts': [['q', '', 'question']],
};

const project = new Project({ compilerOptions: { jsx: 4, strict: true }, skipAddingFilesFromTsConfig: true });
for (const file of Object.keys(MAP)) project.addSourceFileAtPath(file);
project.addSourceFilesAtPaths([
  'apps/*/app/**/*.{ts,tsx}',
  'apps/*/src/**/*.{ts,tsx}',
  'packages/*/src/**/*.{ts,tsx}',
  '!**/node_modules/**',
]);

const free = (decl, name) => {
  const scope =
    decl.getFirstAncestor((a) => Node.isFunctionLikeDeclaration(a) || Node.isArrowFunction(a)) ?? decl.getSourceFile();
  return !new RegExp(`\\b${name}\\b`).test(scope.getText());
};
const log = [];
let renamed = 0;
for (const sf of project.getSourceFiles()) {
  const rel = path.relative(process.cwd(), sf.getFilePath());
  const rules = MAP[rel] ?? [];
  const decls = sf
    .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
    .filter((d) => Node.isIdentifier(d.getNameNode()) && d.getName().length === 1);
  for (const decl of decls) {
    if (decl.wasForgotten()) continue;
    const name = decl.getName();
    const init = (decl.getInitializer()?.getText() ?? '').replace(/\s+/g, ' ');
    // Biến lỗi trong catch (e) → error ở mọi file.
    const isCatch = Node.isCatchClause(decl.getParent());
    const rule =
      isCatch && name === 'e'
        ? [name, '', 'error']
        : rules.find(([n, prefix]) => n === name && (prefix === '' ? init === '' : init.startsWith(prefix)));
    if (!rule) continue;
    const target = free(decl, rule[2]) ? rule[2] : isCatch && free(decl, 'err') ? 'err' : null;
    if (!target) {
      log.push(`${rel}:${decl.getStartLineNumber()}  ${name} → ${rule[2]} (trùng tên, giữ nguyên)`);
      continue;
    }
    decl.getNameNode().rename(target, { usePrefixAndSuffixText: true });
    renamed++;
  }
}
project.saveSync();
console.log(`Lượt 2: đổi ${renamed} biến.`);
console.log(log.join('\n'));
