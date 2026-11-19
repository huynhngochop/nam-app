// Dùng một lần: đổi biến cục bộ tên một chữ sang tên có nghĩa, theo giá trị gán cho nó.
// Đổi bằng ts-morph (theo cú pháp, đổi đúng mọi chỗ dùng biến đó), không thay chữ hàng loạt.
// Chạy: node .github/scripts/rename-locals.mjs > .github/rename-report.txt
import { Node, Project, SyntaxKind } from 'ts-morph';

// Vế phải của phép gán → các tên đề xuất (lấy tên đầu tiên chưa bị dùng trong cùng hàm).
const RULES = [
  [/^useLayout\(\)$/, ['layout']],
  [/^use(Vi|Hen|Nhip|Meo)(\.getState)?\(\)$/, ['state']],
  [/^useLocalSearchParams/, ['params']],
  [/^useContext\(Ctx\)$/, ['theme']],
  [/^setTimeout\(/, ['timer']],
  [/^setInterval\(/, ['ticker']],
  [/^period(Of|Range)\(/, ['period', 'range']],
  [/^parse(BankText|Locally|Intent)\(/, ['parsed']],
  [/^untransferKinds\(/, ['kinds']],
  [/^await Notifications\.(request|get)PermissionsAsync/, ['permission']],
  [/^await NetInfo\.fetch|^NetInfo\.fetch/, ['netState']],
  [/^await (buy|send|callAi)\b/, ['result']],
  [/^new Date\(/, ['date', 'day', 'when']],
  [/^addDays\(/, ['day', 'date']],
  [/^Number\(/, ['value', 'num']],
  [/^(` \$\{)?fold\(/, ['folded', 'normalized']],
  [/^new File\(/, ['file']],
  [/^totals\(/, ['total']],
  [/^Math\.max\(0, Math\.min\(1/, ['clamped', 'ratio']],
  [/^getDb\(\)\.getFirstSync/, ['row']],
  [/^getDb\(\)$/, ['db']],
  [/^useTxVersion/, ['version']],
  [/^backDecision\(/, ['decision']],
  [/^backing\(\)$/, ['storage']],
  [/^pending\.get\(/, ['entry']],
  [/^createDebouncedStorage/, ['storage']],
  [/^RECIPES\.find\(/, ['recipe']],
  [/^GUESS\.find\(/, ['guess']],
  [/^findGap\(/, ['gap']],
  [/^[\w.]+\.match\(/, ['match']],
  [/^line\.trim\(\)$/, ['trimmed']],
  [/^new Map</, ['byId', 'map']],
  [/^rnd\(\)/, ['roll']],
  [/^int\(/, ['count']],
  [/^Math\.floor\(min \/ 60\)/, ['hours']],
  [/^Math\.round\(min % 60\)/, ['minutes']],
  [/^Math\.floor\(s \/ 86400\)/, ['days']],
  [/^Math\.abs\(/, ['abs']],
  [/^Math\.round\(Math\.abs\(n\)\)\.toString\(\)/, ['digits']],
  [/^size === 'lg'/, ['height']],
  [/^\(size - stroke\) \/ 2/, ['radius']],
  [/^Math\.max\(1, s\.values\.length - 1\)/, ['segments']],
  [/^performance\.now\(\)/, ['startedAt']],
  [/^sess\(/, ['session']],
  [/^d\.getHours\(\)/, ['hour']],
  [/^typeof iso === 'number'/, ['ms']],
  [/^customerStats\(/, ['stats']],
  [/^RECIPES\.filter|^TIPS\.filter/, ['list']],
];
const KEEP = new Set(['i', 'j', 'k', 'x', 'y', '_']);

const project = new Project({
  compilerOptions: { jsx: 4, allowJs: false, strict: true },
  skipAddingFilesFromTsConfig: true,
});
project.addSourceFilesAtPaths([
  'apps/*/app/**/*.{ts,tsx}',
  'apps/*/src/**/*.{ts,tsx}',
  'packages/*/src/**/*.{ts,tsx}',
  'tests/**/*.ts',
  'qa/**/*.tsx',
  '!**/node_modules/**',
  '!**/tipdata/**',
  '!tests/typestubs/**',
]);

const report = [];
let renamed = 0;
for (const file of project.getSourceFiles()) {
  const decls = file.getDescendantsOfKind(SyntaxKind.VariableDeclaration).filter((d) => {
    const n = d.getNameNode();
    return Node.isIdentifier(n) && n.getText().length === 1 && !KEEP.has(n.getText());
  });
  for (const decl of decls) {
    if (decl.wasForgotten()) continue;
    const name = decl.getName();
    const init = (decl.getInitializer()?.getText() ?? '').replace(/\s+/g, ' ');
    const inFor = Node.isForStatement(decl.getParent()?.getParent());
    const candidates = inFor && name === 'd' ? ['dayOffset'] : RULES.find(([rx]) => rx.test(init))?.[1];
    const scope = decl.getFirstAncestor((a) => Node.isFunctionLikeDeclaration(a) || Node.isArrowFunction(a)) ?? file;
    const text = scope.getText();
    const pick = candidates?.find((c) => !new RegExp(`\\b${c}\\b`).test(text));
    const where = `${file.getFilePath().split('/nam-app/').pop()}:${decl.getStartLineNumber()}`;
    if (!pick) {
      report.push(`${where}  ${name} = ${init.slice(0, 70)}  ${candidates ? '(trùng tên)' : '(chưa có quy tắc)'}`);
      continue;
    }
    decl.getNameNode().rename(pick, { usePrefixAndSuffixText: true });
    renamed++;
  }
}
project.saveSync();
console.log(`Đã đổi ${renamed} biến. Còn lại ${report.length}:`);
console.log(report.join('\n'));
