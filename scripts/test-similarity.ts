/**
 * @file scripts/test-similarity.ts
 * @description Executável CLI de Testes Unitários do Motor de Similaridade Textual Determinístico (4.1.1.RW.5 & 4.1.1.8P.5)
 * Executado via: npm run test:similarity ou npx tsx scripts/test-similarity.ts
 */

import { runSimilarityTestSuite } from '../src/services/similarityEngine';

console.log('='.repeat(72));
console.log('  SUÍTE DE TESTES DO MOTOR DE SIMILARIDADE DETERMINÍSTICO (k=5 Shingles)');
console.log('  WikiWorldWeb - Normalização, Winnowing, Containment & Isenção ABNT');
console.log('='.repeat(72));
console.log('');

const report = runSimilarityTestSuite();

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

console.log('-'.repeat(72));
console.log(`Resultado Final: ${report.passedCount}/${report.total} testes passaram (${Math.round((report.passedCount / report.total) * 100)}%)`);
console.log(`Status: ${report.allPassed ? 'TODOS OS TESTES DETERMINÍSTICOS PASSARAM COM SUCESSO! 🚀' : 'ATENÇÃO: ALGUNS TESTES FALHARAM!'}`);
console.log('='.repeat(72));

if (!report.allPassed) {
  process.exit(1);
} else {
  process.exit(0);
}
