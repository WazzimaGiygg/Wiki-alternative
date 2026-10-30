/**
 * @file scripts/test-sanitization.ts
 * @description Executável CLI de Testes Unitários de Sanitização (4.1.1.20Z.6)
 * Executado via: npm run test:sanitization ou npx tsx scripts/test-sanitization.ts
 */

import { runSanitizationTestSuite } from '../src/utils/textSanitizer';

console.log('='.repeat(70));
console.log('  SUÍTE DE TESTES UNITÁRIOS DE SANITIZAÇÃO DE TEXTO (4.1.1.20Z.6)');
console.log('  WikiWorldWeb - Extrator de Documentos (PDF, DOCX, DOC, TXT)');
console.log('='.repeat(70));
console.log('');

const report = runSanitizationTestSuite();

report.results.forEach((r, idx) => {
  const icon = r.passed ? '✅ [PASSOU]' : '❌ [FALHOU]';
  console.log(`${idx + 1}. ${icon} ${r.name} (${r.durationMs}ms)`);
  console.log(`   Categoria: ${r.category}`);
  console.log(`   Descrição: ${r.description}`);
  if (!r.passed) {
    console.log(`   Entrada:   ${JSON.stringify(r.input)}`);
    console.log(`   Saída:     ${JSON.stringify(r.output)}`);
    console.log(`   Esperado:  ${r.expectedExplanation}`);
    if (r.error) console.log(`   Erro:      ${r.error}`);
  }
  console.log('');
});

console.log('-'.repeat(70));
console.log(`Resultado Final: ${report.passedCount}/${report.total} testes passaram (${Math.round((report.passedCount / report.total) * 100)}%)`);
console.log(`Status: ${report.allPassed ? 'TODOS OS TESTES PASSARAM COM SUCESSO! 🚀' : 'ATENÇÃO: ALGUNS TESTES FALHARAM!'}`);
console.log('='.repeat(70));

if (!report.allPassed) {
  process.exit(1);
} else {
  process.exit(0);
}
