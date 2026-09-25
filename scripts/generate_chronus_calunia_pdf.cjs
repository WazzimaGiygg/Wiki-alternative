const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

function generateChronusCaluniaPdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function checkPageBreak(neededSpace = 20) {
    if (y + neededSpace > pageHeight - margin - 15) {
      addFooter();
      doc.addPage();
      y = margin + 12;
      addHeader();
    }
  }

  function addHeader() {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'DOSSIÊ JURÍDICO-DOCUMENTAL | CALÚNIA POR PARTE DE CHRONUS E ABUSOS NA WIKIPÉDIA (V2)',
      margin,
      12
    );
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, 14, pageWidth - margin, 14);
  }

  function addFooter() {
    const pageNum = doc.internal.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text(
      'WikiWorldWeb Enciclopédia • Auditoria de Direitos Fundamentais, LGPD & Marco Civil • DPO: pedrohenriquecardonaperes@gmail.com',
      margin,
      pageHeight - 8
    );
    doc.text(
      `Página ${pageNum}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  // ================= PAGE 1: COVER & EXECUTIVE SUMMARY =================
  // Top Banner
  doc.setFillColor(159, 18, 57); // Rose 900
  doc.rect(margin, y, contentWidth, 34, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('DOSSIÊ TÉCNICO-JURÍDICO & DOCUMENTAL (V2)', margin + 6, y + 11);
  doc.setFontSize(10.5);
  doc.setTextColor(254, 226, 226);
  doc.text('CALÚNIA, DIFAMAÇÃO, PERSEGUIÇÃO E ABUSOS DE MODERAÇÃO NA WIKIPÉDIA', margin + 6, y + 19);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(254, 205, 211);
  doc.text('Imputações Falsas pelo Usuário Chronus, Violação ao Código Penal, LGPD, Marco Civil e UCOC', margin + 6, y + 26);

  y += 40;

  // Metadata Box
  doc.setFillColor(255, 241, 242); // Rose 50
  doc.setDrawColor(254, 205, 211);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(159, 18, 57);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHA TÉCNICA DO PROCEDIMENTO DE AUDITORIA & REGISTRO DE INFRAÇÕES', margin + 5, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('• Documento de Referência: Calúnia por parte de Chronus V2.pdf (47 Páginas Consolidadas)', margin + 5, y + 11);
  doc.text('• Requerente / Titular Ofendido: Pedro Henrique Cardona Peres (WazzimaGiygg)', margin + 5, y + 16);
  doc.text('• Moderador Representado: Usuário Chronus (Administrador / Burocrata na Wikipédia Lusófona)', margin + 5, y + 21);
  doc.text('• Entidade Responsável Solidária: Wikimedia Foundation Inc. (São Francisco, Califórnia, EUA)', margin + 5, y + 26);

  y += 34;

  // 1. Sumário Executivo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. SUMÁRIO EXECUTIVO DO CASO CHRONUS / WIKIPÉDIA', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const sumarioText =
    'O presente dossiê documental e jurídico consolida a análise detalhada acerca dos atos ilícitos perpetrados pelo administrador conhecido pelo pseudônimo "Chronus" no âmbito da Wikipédia em língua portuguesa, com a complacência e omissão da Wikimedia Foundation Inc.\n\n' +
    'Trata-se de um conjunto sistemático de práticas abusivas que transgridem frontalmente a legislação penal brasileira (crimes contra a honra e perseguição cibernética/stalking), a responsabilidade civil (dano moral in re ipsa), a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), o Marco Civil da Internet (Lei nº 12.965/2014) e os próprios termos internacionais da Fundação Wikimedia, em particular o Código Universal de Conduta (UCOC - Universal Code of Conduct) e o Regulamento Europeu de Serviços Digitais (Digital Services Act - DSA).\n\n' +
    'O administrador Chronus atuou reiteradamente mediante a imputação falsa de crimes e condutas desonrosas contra o titular Pedro Henrique Cardona Peres (WazzimaGiygg), promovendo reversões deliberadas de conteúdo idôneo, cancelamento de contas sem direito ao contraditório, difamação indexada perpetuamente em motores de busca globais e bloqueio arbitrário de canais de defesa.';

  const splitSumario = doc.splitTextToSize(sumarioText, contentWidth);
  doc.text(splitSumario, margin, y);
  y += splitSumario.length * 3.8 + 6;

  // ================= 2. CRIMES CONTRA A HONRA NO CÓDIGO PENAL =================
  checkPageBreak(35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. CRIMES CONTRA A HONRA NO CÓDIGO PENAL BRASILEIRO (ARTS. 138, 139 E 140)', margin, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('2.1. Calúnia (Art. 138 do Código Penal): Imputação Falsa de Fato Definido como Crime', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const caluniaText =
    'O Art. 138 do Código Penal tipifica o crime de calúnia como a conduta de imputar falsamente a outrem fato definido como crime. No ambiente da Wikipédia, o administrador Chronus acusou publicamente o requerente Pedro Henrique Cardona Peres de práticas tipificadas penalmente como fraude, falsidade ideológica, invasão de dispositivo informático e adulteração ilícita de sistemas.\n\n' +
    'Tais imputações foram veiculadas publicamente em sumários de reversão, pedidos a administradores e discussões abertas, sem qualquer prova material, perícia técnica ou decisão de órgão judiciário competente. Ao atribuir crimes falsos ao requerente, Chronus cometeu calúnia em sua forma consumada, cuja gravidade é acentuada pelo alcance difuso da plataforma.';

  const splitCalunia = doc.splitTextToSize(caluniaText, contentWidth);
  doc.text(splitCalunia, margin, y);
  y += splitCalunia.length * 3.8 + 5;

  checkPageBreak(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('2.2. Difamação e Injúria (Arts. 139 e 140 do CP) e Causa de Aumento (Art. 141, III)', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const difamacaoText =
    'Além da calúnia, o administrador incorreu reiteradamente em difamação (Art. 139) ao divulgar fatos ofensivos à reputação do titular perante toda a comunidade lusófona e internacional, e em injúria (Art. 140) mediante ofensas verbais diretas à sua dignidade pessoal.\n\n' +
    'Incide no caso a causa especial de aumento de pena prevista no Art. 141, inciso III, do Código Penal, uma vez que as condutas criminosas foram perpetradas "na presença de várias pessoas, ou por meio que facilite a divulgação da calúnia, da difamação ou da injúria" — a Wikipédia é o 5º portal mais acessado do mundo, cujas páginas são permanentemente rastreadas e indexadas pelo Google.';

  const splitDifamacao = doc.splitTextToSize(difamacaoText, contentWidth);
  doc.text(splitDifamacao, margin, y);
  y += splitDifamacao.length * 3.8 + 6;

  // ================= 3. CRIME DE PERSEGUIÇÃO / STALKING =================
  checkPageBreak(35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. CRIME DE PERSEGUIÇÃO CIBERNÉTICA / STALKING (ART. 147-A DO CÓDIGO PENAL)', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const stalkingText =
    'A Lei nº 14.132/2021 introduziu no ordenamento pátrio o Art. 147-A do Código Penal, criminalizando a conduta de perseguir alguém, reiteradamente e por qualquer meio, ameaçando-lhe a integridade física ou psicológica, restringindo-lhe a capacidade de locomoção ou, de qualquer forma, invadindo ou perturbando sua esfera de liberdade ou privacidade.\n\n' +
    'O dossiê documenta como o usuário Chronus exerceu vigilância sistemática sobre o requerente, monitorando contribuições em verbetes temáticos, executando reversões mecânicas em fração de segundos, promovendo a abertura coordenada de votações para eliminar referências à produção intelectual do titular e intimidando outros editores que buscassem manter a neutralidade e o diálogo editorial. Essa perseguição reiterada configura incontestável stalking cibernético com severos danos psicológicos à vítima.';

  const splitStalking = doc.splitTextToSize(stalkingText, contentWidth);
  doc.text(splitStalking, margin, y);
  y += splitStalking.length * 3.8 + 6;

  // ================= 4. VIOLAÇÕES AO UCOC DA WIKIMEDIA =================
  checkPageBreak(35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. VIOLAÇÃO EXPRESSA AO CÓDIGO UNIVERSAL DE CONDUTA DA WIKIMEDIA (UCOC)', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const ucocText =
    'O Código Universal de Conduta (UCOC - Universal Code of Conduct), ratificado pela Wikimedia Foundation como política obrigatória global, proíbe explicitamente:\n\n' +
    '• Seção 3.1 - Respeito Mútuo: Proibição de ataques pessoais, insultos, ridicularização pública e rotulação depreciativa de usuários.\n' +
    '• Seção 3.2 - Abuso de Poder, Privilégios ou Posição: Veda expressamente que administradores utilizem ferramentas técnicas (reversor, bloqueador, eliminação rápida) para intimidar usuários ou vencer disputas de conteúdo pessoal.\n' +
    '• Seção 3.3 - Assédio e Perseguição (Harassment): Proíbe perseguição continuada de um usuário em múltiplos artigos, doxxing, e difamação sistemática.\n\n' +
    'O comportamento do administrador Chronus violou categoricamente todas as três diretrizes supracitadas. A despeito de representações formais protocoladas junto ao Comitê de Arbitragem e ao Trust & Safety da Wikimedia Foundation, nenhuma sanção efetiva foi aplicada ao administrador, caracterizando cumplicidade corporativa e responsabilidade solidária da fundação norte-americana.';

  const splitUcoc = doc.splitTextToSize(ucocText, contentWidth);
  doc.text(splitUcoc, margin, y);
  y += splitUcoc.length * 3.8 + 6;

  // ================= 5. FALHAS METODOLÓGICAS, CHECKUSER INFUNDADO E EFEITO STREISAND =================
  checkPageBreak(35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('5. ERROS METODOLÓGICOS: FALSA ACUSAÇÃO DE FANTOCHES E EFEITO STREISAND', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const metodoText =
    'O dossiê de 47 páginas detalha as graves falhas metodológicas adotadas na moderação do caso:\n\n' +
    '1. Acusações Forjadas de "Sockpuppetry" (Contas Fantoche): Chronus e moderadores correlatos rotularam qualquer nova conta ou IP com estilo formal de escrita como sendo um "fantoche ilícito" do requerente, sem apresentação de evidências técnicas verificáveis ou relatórios de correlação de rede.\n' +
    '2. Instrumentalização de Ferramentas de CheckUser: Utilização abusiva da verificação de IP para justificar bloqueios preventivos descabidos, ignorando que faixas inteiras de IPs dinâmicos de provedores brasileiros (Claro, Vivo, TIM) são compartilhadas por milhares de assinantes simultâneos.\n' +
    '3. Supressão do Contraditório e Ampla Defesa (Art. 5º, LV da Constituição Federal): A conta do titular teve o acesso de edição suspenso, sua página de discussão trancada contra edições e a ferramenta de envio de e-mails revogada, impedindo qualquer recurso ou defesa técnica perante a comunidade.\n' +
    '4. Efeito Streisand Deliberado: Abertura ostensiva de páginas de "eliminação por votação" contendo o nome civil do requerente e termos vexatórios, criando um histórico difamatório permanente nas buscas da web.';

  const splitMetodo = doc.splitTextToSize(metodoText, contentWidth);
  doc.text(splitMetodo, margin, y);
  y += splitMetodo.length * 3.8 + 6;

  // ================= 6. VIOLAÇÕES À LGPD, MARCO CIVIL E DSA EUROPEU =================
  checkPageBreak(35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('6. INFRAÇÕES À LGPD, AO MARCO CIVIL DA INTERNET E AO DIGITAL SERVICES ACT (DSA)', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const leisText =
    '• Marco Civil da Internet (Lei nº 12.965/2014): O Art. 10 e o Art. 15 proíbem a publicização de registros telemáticos e IPs sem ordem judicial. Na contramão da lei, editores associados a Chronus divulgaram faixas e provedores para expor o usuário geograficamente.\n' +
    '• Lei Geral de Proteção de Dados (Lei nº 13.709/2018): Violação dos princípios de necessidade, segurança e prevenção (Art. 6º), e violação frontal do direito inalienável do titular de exigir a exclusão e retificação de dados caluniosos e distorcidos (Art. 18).\n' +
    '• Digital Services Act (Regulamento UE 2022/2065 - DSA): A legislação europeia obriga as grandes plataformas a possuírem canais internos de tratamento célere de reclamações e recurso transparente contra decisões unilaterais de moderação, preceito totalmente descumprido pelo ecossistema Wikimedia.\n' +
    '• Responsabilidade Civil (Arts. 186 e 927 do Código Civil): O dano moral resultante da atribuição de fatos caluniosos em meio de alcance planetário é inequívoco e enseja o dever de indenizar e de retratação formal.';

  const splitLeis = doc.splitTextToSize(leisText, contentWidth);
  doc.text(splitLeis, margin, y);
  y += splitLeis.length * 3.8 + 6;

  // ================= 7. COMPLIANCE E SALVAGUARDAS WIKIWORLDWEB =================
  checkPageBreak(35);

  doc.setFillColor(241, 245, 249); // Slate 100
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('7. SALVAGUARDAS E COMPLIANCE RIGOROSO NA WIKIWORLDWEB', margin + 5, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const compText =
    'Como resposta aos abusos estruturais da Wikipédia, a WikiWorldWeb foi fundada com salvaguardas invioláveis:\n' +
    '1. Proibição Absoluta de Calúnia e Linchamento Moral: Moderação pautada em presunção de boa-fé e verificação estrita de fontes.\n' +
    '2. Sigilo Total de Endereços IP: Nenhum IP é revelado publicamente nos históricos de edição (criptografia ponta a ponta).\n' +
    '3. DPO & Canal de Oversight: Retificação ou expurgo permanente de dados ilícitos direto do Firestore em até 48 horas.\n' +
    '4. Garantia Irrestrita do Contraditório: Todo usuário tem direito de resposta e recurso perante auditoria independente.';
  const splitComp = doc.splitTextToSize(compText, contentWidth - 10);
  doc.text(splitComp, margin + 5, y + 11);

  y += 44;

  // Final Signatures
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('São Paulo / Internacional, 2026.', margin, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Dossiê Técnico-Jurídico emitido pelo Comitê de Governança, Compliance & Direitos Fundamentais WikiWorldWeb.', margin, y);
  doc.text('Encarregado de Dados (DPO) e Representante Legal: Pedro Henrique Cardona Peres', margin, y + 4);
  doc.text('Contato Oficial para fins de Instrução Processual: pedrohenriquecardonaperes@gmail.com', margin, y + 8);

  // Add Headers and Footers to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'DOSSIÊ JURÍDICO-DOCUMENTAL | CALÚNIA POR PARTE DE CHRONUS E ABUSOS NA WIKIPÉDIA (V2)',
        margin,
        12
      );
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(margin, 14, pageWidth - margin, 14);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text(
      'WikiWorldWeb Enciclopédia • Auditoria de Direitos Fundamentais, LGPD & Marco Civil • DPO: pedrohenriquecardonaperes@gmail.com',
      margin,
      pageHeight - 8
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  // Ensure directories exist
  const publicDir = path.join(process.cwd(), 'public');
  const documentsDir = path.join(publicDir, 'documents');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  if (!fs.existsSync(documentsDir)) fs.mkdirSync(documentsDir, { recursive: true });

  const pdfOutput = doc.output('arraybuffer');
  const buffer = Buffer.from(pdfOutput);

  // Write to both root public and public/documents with standard names and encoded-friendly aliases
  const filesToCreate = [
    path.join(publicDir, 'Calúnia por parte de Chronus V2.pdf'),
    path.join(publicDir, 'Calunia por parte de Chronus V2.pdf'),
    path.join(publicDir, 'calunia-por-parte-de-chronus-v2.pdf'),
    path.join(documentsDir, 'Calúnia por parte de Chronus V2.pdf'),
    path.join(documentsDir, 'Calunia por parte de Chronus V2.pdf'),
    path.join(documentsDir, 'calunia-por-parte-de-chronus-v2.pdf'),
  ];

  filesToCreate.forEach((filePath) => {
    fs.writeFileSync(filePath, buffer);
    console.log(' - ' + filePath);
  });
}

generateChronusCaluniaPdf();
