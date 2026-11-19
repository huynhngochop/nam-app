// Dùng một lần, lượt 2: đặt tên theo nghĩa cho các biến một chữ mà lượt 1 chưa có quy tắc.
// Khóa: [tên cũ, phần đầu vế phải ('' = không có vế phải: for-of, catch), tên mới].
import path from 'node:path';
import { Node, Project, SyntaxKind } from 'ts-morph';

const MAP = {
  'apps/hen-dep/src/priceBoard.ts': [['dur', 'trimmed.match', 'durationMatch']],
  'apps/hen-dep/src/Timeline.tsx': [['sel', 'selectedId ===', 'isSelected']],
  'apps/hen-dep/src/customerIndex.ts': [['st', 'byId.get', 'summary']],
  'apps/hen-dep/src/store.ts': [['st', '', 'member']],
  'apps/hen-dep/src/sync.tsx': [
    ['dur', 'b.endAt', 'duration'],
    ['cur', 'useHen.getState()', 'local'],
  ],
  'apps/hen-dep/app/settings.tsx': [['st', 'state.shop.settings', 'shopSettings']],
  'apps/hen-dep/app/(tabs)/revenue.tsx': [
    ['st', 'end - 7', 'weekStart'],
    ['st', 'day.getTime()', 'dayStart'],
  ],
  'apps/hen-dep/app/booking/new.tsx': [
    ['dur', 'durationOf(', 'duration'],
    ['st', 'useHen.getState()', 'latest'],
  ],
  'apps/meo-nha/src/data/tips.ts': [['cur', 'null', 'current']],
  'apps/meo-nha/src/lib/notify.ts': [['cur', 'await Notifications', 'permission']],
  'apps/vi-gon/src/parse.ts': [['balM', 'cleaned.match', 'balanceMatch']],
  'apps/vi-gon/src/listener.ts': [['st', 'await checkPermission', 'permission']],
  'apps/vi-gon/src/answer.ts': [['cur', 'sumOf(', 'currentSum']],
  'apps/vi-gon/app/settings.tsx': [['cur', 'await Notifications', 'permission']],
  'apps/vi-gon/app/(tabs)/analysis.tsx': [['cur', 'periodOf(', 'currentPeriod']],
  'apps/nhip/app/timer-settings.tsx': [['st', 'state.settings', 'settings']],
  'apps/nhip/app/session.tsx': [
    ['cur', 'useNhip.getState().session', 'activeSession'],
    ['cur', 'useNhip.getState()', 'latest'],
  ],
  'apps/nhip/src/store.ts': [
    ['st', 'get().settings', 'settings'],
    ['cur', 's.mixes.find', 'currentMix'],
  ],
  'packages/ui/src/components/base.tsx': [
    ['col', 'color ??', 'textColor'],
    ['col', "tone === 'negative'", 'toneColor'],
  ],
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
  const names = new Set(rules.map(([n]) => n));
  const decls = sf
    .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
    .filter((d) => Node.isIdentifier(d.getNameNode()) && (names.has(d.getName()) || d.getName() === 'e'));
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
