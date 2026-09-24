const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

function generateDossierPdf() {
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
      'DOSSIÊ TÉCNICO-JURÍDICO | IRREGULARIDADES DA WIKIPÉDIA E WIKIMEDIA FOUNDATION',
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
      'WikiWorldWeb Enciclopédia • Auditoria de Privacidade LGPD, GDPR e Marco Civil • DPO: pedrohenriquecardonaperes@gmail.com',
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
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(margin, y, contentWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DOSSIÊ DE IRREGULARIDADES', margin + 6, y + 12);
  doc.setFontSize(11);
  doc.setTextColor(226, 232, 240);
  doc.text('WIKIPÉDIA & WIKIMEDIA FOUNDATION INC.', margin + 6, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Violações Sistemáticas à LGPD (Brasil), GDPR (União Europeia) e Marco Civil da Internet', margin + 6, y + 26);

  y += 38;

  // Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('DOCUMENTO OFICIAL DE AUDITORIA E COMPLIANCE', margin + 5, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text('• Órgão Emissor: Comitê de Governança & Auditoria Jurídica WikiWorldWeb', margin + 5, y + 11);
  doc.text('• Encarregado de Dados (DPO): Pedro Henrique Cardona Peres (pedrohenriquecardonaperes@gmail.com)', margin + 5, y + 16);
  doc.text('• Normas Auditadas: Lei nº 13.709/2018 (LGPD), Lei nº 12.965/2014 (Marco Civil) e Reg. UE 2016/679 (GDPR)', margin + 5, y + 21);

  y += 30;

  // Sumário Executivo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. SUMÁRIO EXECUTIVO', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const sumarioText = 
    'O presente relatório documental consolida um exame aprofundado acerca das irregularidades jurídicas e operacionais perpetradas pela Wikimedia Foundation Inc. (entidade gestora da Wikipédia) no tratamento de dados de cidadãos brasileiros e estrangeiros. Enquanto plataforma de alcance massivo no território nacional, a Wikipédia recusa deliberadamente a adequação às salvaguardas da Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018) e ao Marco Civil da Internet (Lei nº 12.965/2014), além de desrespeitar os cânones de privacidade vigentes na União Europeia através do GDPR (Regulamento UE 2016/679).\n\n' +
    'A prática de expor publicamente endereços IP de usuários, a ausência de canal efetivo de DPO no Brasil, a recusa a ordens judiciais brasileiras invocando extraterritorialidade e a exposição humilhante de cidadãos que solicitam a retificação ou exclusão de dados em votações comunitárias abertas (Efeito Streisand) caracterizam ilícitos civis e administrativos de extrema gravidade.';

  const splitSumario = doc.splitTextToSize(sumarioText, contentWidth);
  doc.text(splitSumario, margin, y);
  y += splitSumario.length * 4.2 + 6;

  // ================= CAPÍTULO 2 =================
  checkPageBreak(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('2. VIOLAÇÕES AO MARCO CIVIL DA INTERNET (LEI Nº 12.965/2014)', margin, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('2.1. Exposição Pública Arbitrária de Endereços IP (Art. 10 e Art. 15)', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const ipViolationText =
    'Na Wikipédia, qualquer usuário que realiza uma edição sem ter criado uma conta tem o seu endereço de Protocolo de Internet (IP) completo, seja IPv4 ou IPv6, gravado no histórico de edições da página e tornado público e acessível a qualquer internauta ou bot de raspagem de dados no mundo.\n\n' +
    'O Art. 10 e o Art. 15 do Marco Civil da Internet estipulam categoricamente que os registros de conexão e de acesso a aplicações devem ser guardados sob sigilo estrito, em ambiente controlado e seguro, pelo prazo legal, e fornecidos exclusivamente sob ordem judicial formal. Ao publicar os endereços IP de forma perene no banco de dados da enciclopédia, a Wikimedia Foundation incorre em violação direta da lei, ensejando geolocalização indevida, identificação do provedor de acesso e perseguição cibernética (doxxing) contra os colaboradores.';

  const splitIp = doc.splitTextToSize(ipViolationText, contentWidth);
  doc.text(splitIp, margin, y);
  y += splitIp.length * 4.2 + 5;

  checkPageBreak(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('2.2. Negativa de Submissão à Legislação Brasileira (Art. 11)', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const jurisdicaoText =
    'O Art. 11 do Marco Civil estabelece expressamente: "Em qualquer operação de coleta, armazenamento, guarda e tratamento de registros, de dados pessoais ou de comunicações por provedores de conexão e de aplicações de internet em que pelo menos um desses atos ocorra em território nacional, deverão ser obrigatoriamente respeitados a legislação brasileira e os direitos à privacidade".\n\n' +
    'A Wikimedia Foundation, sediada na Califórnia (EUA), habitualmente recusa notificações judiciais e extrajudiciais expedidas por tribunais estaduais e federais do Brasil, alegando falta de representação legal e demandando expedição de cartas rogatórias internacionais. Essa postura anula a efetividade das decisões dos magistrados brasileiros e desampara os cidadãos ofendidos.';

  const splitJuris = doc.splitTextToSize(jurisdicaoText, contentWidth);
  doc.text(splitJuris, margin, y);
  y += splitJuris.length * 4.2 + 8;

  // ================= CAPÍTULO 3: LGPD =================
  checkPageBreak(40);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('3. VIOLAÇÕES À LEI GERAL DE PROTEÇÃO DE DADOS (LGPD - LEI Nº 13.709/2018)', margin, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('3.1. Inobservância dos Princípios Fundamentais (Art. 6º)', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const lgpdPrincText =
    'A Wikimedia Foundation descumpre reiteradamente os princípios do Art. 6º da LGPD:\n' +
    'a) Princípio da Necessidade e Minimização (Inciso III): Manter históricos públicos perpétuos com dados pessoais é desproporcional à finalidade enciclopédica;\n' +
    'b) Princípio da Segurança e Prevenção (Incisos VII e VIII): Não adota medidas técnicas eficazes para salvaguardar a identidade civil dos editores e pessoas biografadas;\n' +
    'c) Princípio da Não Discriminação (Inciso IX): Permite a propagação de difamação em páginas biográficas sem mecanismos imediatos de resposta e contenção.';

  const splitPrinc = doc.splitTextToSize(lgpdPrincText, contentWidth);
  doc.text(splitPrinc, margin, y);
  y += splitPrinc.length * 4.2 + 5;

  checkPageBreak(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('3.2. Supressão dos Direitos dos Titulares e o "Efeito Streisand" (Art. 18)', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const titularText =
    'O Art. 18 da LGPD assegura ao titular o direito de obter do controlador a retificação de dados incompletos ou inexatos, a anonimização, o bloqueio ou a eliminação de dados desnecessários ou tratados em desconformidade.\n\n' +
    'Na Wikipédia, cidadãos que solicitam a remoção de informações falsas, íntimas ou vexatórias são confrontados com a abertura de "Páginas para Eliminar" ou fóruns públicos onde moderadores voluntários debatem abertamente a vida privada do requerente. Esse procedimento humilhante produz o nefasto Efeito Streisand, ampliando o dano à honra da vítima nos buscadores globais, em aberta infração aos direitos da personalidade.';

  const splitTitular = doc.splitTextToSize(titularText, contentWidth);
  doc.text(splitTitular, margin, y);
  y += splitTitular.length * 4.2 + 5;

  checkPageBreak(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('3.3. Violação no Tratamento de Menores e Dados Sensíveis (Arts. 11 e 14)', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const menoresText =
    'O Art. 14 da LGPD exige que o tratamento de dados de crianças e adolescentes ocorra sempre no seu melhor interesse. A Wikipédia expõe com frequência nomes de filhos menores de figuras públicas, fotografias sem autorização tutelar e menções desnecessárias, descumprindo os preceitos do Estatuto da Criança e do Adolescente (ECA). Ademais, dados sensíveis (saúde, orientação e convicções) são lançados em verbetes sem o devido rigor de verificação de fontes fidedignas primárias.';

  const splitMenores = doc.splitTextToSize(menoresText, contentWidth);
  doc.text(splitMenores, margin, y);
  y += splitMenores.length * 4.2 + 8;

  // ================= CAPÍTULO 4: GDPR =================
  checkPageBreak(40);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('4. VIOLAÇÕES AO REGULAMENTO EUROPEU (GDPR - REG. UE 2016/679)', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const gdprText =
    'No plano comunitário europeu, a conduta da Wikimedia Foundation também colide frontalmente com o GDPR:\n\n' +
    '• Artigo 17 (Direito ao Apagamento / "Direito ao Esquecimento"): A Wikimedia Foundation historicamente contesta o direito ao esquecimento nos tribunais da Europa, alegando que o registro histórico da wiki deve prevalecer de forma absoluta, impedindo cidadãos absolvidos de processos ou alvos de fake news de expurgar registros do passado.\n\n' +
    '• Artigo 25 (Privacy by Design e Privacy by Default): O MediaWiki foi programado para arquivar e expor versões de páginas sem qualquer filtro automatizado para proteger a identidade civil de participantes.\n\n' +
    '• Artigos 44 a 49 (Transferência Internacional Ilícita de Dados): Os dados de cidadãos europeus e brasileiros são transferidos e armazenados em datacenters nos Estados Unidos sem as salvaguardas contratuais equivalentes exigidas pelo Tribunal de Justiça da União Europeia no julgamento Schrems II.';

  const splitGdpr = doc.splitTextToSize(gdprText, contentWidth);
  doc.text(splitGdpr, margin, y);
  y += splitGdpr.length * 4.2 + 8;

  // ================= CAPÍTULO 5: QUADRO COMPARATIVO =================
  checkPageBreak(50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('5. QUADRO COMPARATIVO: WIKIPÉDIA VS. WIKIWORLDWEB', margin, y);
  y += 6;

  // Render Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('REQUISITO LEGAL / NORMA', margin + 3, y + 4.8);
  doc.text('WIKIPÉDIA (WIKIMEDIA FOUNDATION)', margin + 60, y + 4.8);
  doc.text('WIKIWORLDWEB (CONFORME)', margin + 120, y + 4.8);
  y += 7;

  const rows = [
    [
      'Exposição de Endereço IP (Marco Civil Art. 10/15)',
      'Expõe publicamente no histórico de edições',
      'Criptografado e em sigilo estrito'
    ],
    [
      'Submissão à LGPD e ANPD (Art. 3º)',
      'Alega extraterritorialidade e recusa',
      'Total submissão e conformidade'
    ],
    [
      'Encarregado de Proteção de Dados (Art. 41)',
      'Inexistente no Brasil',
      'DPO nomeado e canal direto ativo'
    ],
    [
      'Direitos do Titular (Art. 18 LGPD)',
      'Debates públicos humilhantes (Streisand)',
      'Painel Meus Dados e canal sigiloso'
    ],
    [
      'Direito ao Esquecimento (Art. 17 GDPR)',
      'Recusa e contesta na Justiça da Europa',
      'Supressão definitiva via Oversight'
    ],
    [
      'Proteção a Menores (Art. 14 LGPD e ECA)',
      'Exposição guiada por reportagens soltas',
      'Vedação estrita a dados de menores'
    ]
  ];

  doc.setFontSize(7.5);
  rows.forEach((row, idx) => {
    checkPageBreak(12);
    const bgCol = idx % 2 === 0 ? 248 : 255;
    doc.setFillColor(bgCol, bgCol, bgCol);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 8, margin + contentWidth, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(row[0], margin + 2, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(185, 28, 28); // Red
    doc.text(row[1], margin + 60, y + 5);

    doc.setTextColor(16, 149, 106); // Green
    doc.setFont('helvetica', 'bold');
    doc.text(row[2], margin + 120, y + 5);

    y += 8;
  });

  y += 6;

  // ================= CAPÍTULO 6: CONCLUSÕES =================
  checkPageBreak(35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('6. CONCLUSÕES E ENCAMINHAMENTOS', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const conclusoesText =
    'Diante das constatações materiais elencadas neste dossiê, a WikiWorldWeb reitera o compromisso inabalável com a legalidade digital, submetendo sua arquitetura ao respeito intransigente dos direitos dos titulares e da soberania jurídica do Brasil.\n\n' +
    'Recomenda-se aos titulares de dados cujos direitos tenham sido violados nos projetos da Wikimedia Foundation a formalização de peticionamento perante a Autoridade Nacional de Proteção de Dados (ANPD) e aos órgãos do Ministério Público Federal, demandando a aplicação das sanções administrativas previstas no Art. 52 da LGPD, incluindo multas diárias e bloqueio de operação por tratamento ilícito.';

  const splitConc = doc.splitTextToSize(conclusoesText, contentWidth);
  doc.text(splitConc, margin, y);
  y += splitConc.length * 4.2 + 10;

  // Signatures
  checkPageBreak(25);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + 80, y);
  doc.line(margin + 90, y, margin + 170, y);
  y += 4;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Pedro Henrique Cardona Peres', margin, y);
  doc.text('Comitê Editorial & Governança', margin + 90, y);
  y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Encarregado pelo Tratamento de Dados (DPO)', margin, y);
  doc.text('WikiWorldWeb (WazzimaGiygg)', margin + 90, y);

  // Add footers & headers to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Header for pages > 1
    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'DOSSIÊ TÉCNICO-JURÍDICO | IRREGULARIDADES DA WIKIPÉDIA E WIKIMEDIA FOUNDATION',
        margin,
        12
      );
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(margin, 14, pageWidth - margin, 14);
    }

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text(
      'WikiWorldWeb Enciclopédia • Auditoria de Privacidade LGPD, GDPR e Marco Civil • DPO: pedrohenriquecardonaperes@gmail.com',
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

  // Write to both root public and public/documents
  const target1 = path.join(publicDir, 'Irregularidades da Wikipédia e Wikimedia Foundation.pdf');
  const target2 = path.join(documentsDir, 'Irregularidades da Wikipédia e Wikimedia Foundation.pdf');
  const target3 = path.join(publicDir, 'irregularidades-wikipedia-wikimedia-foundation.pdf');
  const target4 = path.join(documentsDir, 'irregularidades-wikipedia-wikimedia-foundation.pdf');

  fs.writeFileSync(target1, buffer);
  fs.writeFileSync(target2, buffer);
  fs.writeFileSync(target3, buffer);
  fs.writeFileSync(target4, buffer);

  console.log('PDFs generated successfully:');
  console.log(' - ' + target1);
  console.log(' - ' + target2);
}

generateDossierPdf();
