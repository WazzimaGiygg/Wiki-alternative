const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

function generateAccountabilityPresentationPdf() {
  // A4 Landscape presentation slides (297mm x 210mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // 265mm

  const slides = [
    // SLIDE 1: COVER
    {
      slideNum: 1,
      tag: 'APRESENTAÇÃO INSTITUCIONAL & AUDITORIA DE GOVERNANÇA',
      title: 'Wikimedia Institutional Accountability Dossier',
      subtitle: 'O Caso Chronus: Violações Sistêmicas, Instrumentalização de Ferramentas e Responsabilidade Civil/Institucional',
      category: 'DOCUMENTO EXECUTIVO PARA AUDITORIA EXTERNA E MEDIDAS JURÍDICO-INSTITUCIONAIS',
      sections: [
        {
          heading: 'Ficha Técnica da Apresentação',
          lines: [
            '• Objeto: Investigação Técnica e Jurídica sobre Moderação Abusiva, Perseguição e Ausência de Controles na Wikipédia Lusófona.',
            '• Titular / Autor da Auditoria: Pedro Henrique Cardona Peres (WazzimaGiygg) — Pesquisador e Fundador da WikiWorldWeb.',
            '• Moderador Sob Investigação: Usuário Chronus (Administrador / Burocrata com poderes ampliados na Wikipédia Lusófona).',
            '• Instituição Responsável Solidária: Wikimedia Foundation Inc. (San Francisco, CA, USA — Mantenedora Global).',
            '• Enquadramento Legal: Marco Civil da Internet (Lei 12.965/14), Código Civil Brasileiro (Arts. 186 e 927), LGPD (Lei 13.709/18), GDPR (Reg. UE 2016/679) e DSA (Digital Services Act).',
            '• Data de Emissão: 2026 • Registro Documental Permanente na WikiWorldWeb Enciclopédia.',
          ],
        },
        {
          heading: 'Resumo da Tese Institucional',
          lines: [
            'Demonstração probatória de que o ecossistema Wikimedia falhou em conter abusos de poder sistemáticos praticados pelo administrador Chronus.',
            'A instrumentalização de sanções sumárias, vazamento de mensagens confidenciais e perseguição contra editores configuram negligência institucional culposa da Wikimedia Foundation.',
          ],
        },
      ],
    },

    // SLIDE 2: EXECUTIVE SUMMARY & PURPOSE
    {
      slideNum: 2,
      tag: 'SUMÁRIO EXECUTIVO & ESCOPO',
      title: 'Contexto Executivo & Propósito da Apresentação',
      subtitle: 'A Necessidade Urgente de Prestação de Contas (Accountability) no Modelo Wikimedia',
      sections: [
        {
          heading: '1. O Problema Estrutural',
          lines: [
            '• A Wikipédia Lusófona opera sob um regime informal de "feudos administrativos", onde burocratas exercem poder punitivo absoluto sem supervisão independente.',
            '• Conflitos editoriais legítimos são rotulados unilateralmente como "vandalismo" ou "sockpuppetry (contas múltiplas)", sem exibição prévia de provas técnicas auditáveis.',
            '• O direito constitucional e universal ao contraditório e à ampla defesa é sumariamente suprimido mediante bloqueios em cascata e supressão de páginas de discussão.',
          ],
        },
        {
          heading: '2. Objetivos deste Dossiê de Apresentação',
          lines: [
            '• Prover às cortes de justiça, autoridades de dados (ANPD / DPA europeias) e comunidade internacional um compêndio claro e irrefutável dos abusos praticados.',
            '• Demonstrar a responsabilidade direta e solidária da Wikimedia Foundation pela negligência na fiscalização de seus prepostos e moderadores com poderes especiais.',
            '• Apresentar os pilares éticos e técnicos do WikiWorldWeb como antídoto arquitetural contra o arbítrio e a censura velada.',
          ],
        },
      ],
    },

    // SLIDE 3: CORE PLAYERS & GOVERNANCE ARCHITECTURE
    {
      slideNum: 3,
      tag: 'MAPEAMENTO DE ATORES & GOVERNANÇA',
      title: 'Atores Centrais e Arquitetura de Governança',
      subtitle: 'Concentração de Poder, Conflito de Interesses e Inércia da Wikimedia Foundation',
      sections: [
        {
          heading: 'Principais Agentes Envolvidos',
          lines: [
            '• Chronus: Administrador e Burocrata da Wikipédia Lusófona. Agente ativo das imputações caluniosas, bloqueios arbitrários e intimidação sistemática.',
            '• Teles, Érico, Little Sunshine e Burocratas Locais: Círculo de ratificação automática que mantém a blindagem recíproca entre operadores de privilégios.',
            '• WMF Trust & Safety (San Francisco): Órgão global de segurança que tem reiteradamente ignorado denúncias formais de violação de direitos humanos e LGPD na Wikipédia em português.',
            '• ArbCom Lusófono Inexistente / Inoperante: Ausência proposital de tribunal de apelação imparcial e independente, gerando vácuo de legalidade.',
          ],
        },
        {
          heading: 'Falhas Críticas no Design de Governança',
          lines: [
            '• Concentração de poderes de julgamento, execução e revisão na mesma figura administrativa ou em aliados de mesma panelinha (cabal).',
            '• Ausência de quórum externo e ausência total de responsabilidade civil/jurídica direta perante leis locais nos termos dos Termos de Uso da WMF.',
          ],
        },
      ],
    },

    // SLIDE 4: CHRONOLOGY OF EVENTS & FABRICATED JUSTIFICATIONS
    {
      slideNum: 4,
      tag: 'CRONOLOGIA & METODOLOGIA DE REPRESSÃO',
      title: 'Cronologia dos Fatos & Imputações Arbitrárias',
      subtitle: 'O Método Chronus de Silenciamento: Da Divergência Editorial à Execução Sumária',
      sections: [
        {
          heading: 'Linha do Tempo dos Eventos',
          lines: [
            '• Fase 1 - Divergência Editorial & Científica: Edições legítimas e documentadas de WazzimaGiygg desafiam edições protecionistas de Chronus.',
            '• Fase 2 - Hostilização e Reversões Coordenadas: Aplicação de tags depreciativas sem diálogo prévio, configurando infração aberta ao UCoC e WP:CIV.',
            '• Fase 3 - Imputação de Falsa Conduta (Calúnia): Acusação de "vandalismo destrutivo" e "criação de fantoches", imputando falsamente conduta ilícita desprovida de lastro técnico.',
            '• Fase 4 - Bloqueio em Cascata sem Defesa: Bloqueio infinito da conta principal, revogação do acesso à própria página de discussão e extensão a faixas de IP de provedores residenciais.',
          ],
        },
        {
          heading: 'Metodologia Repressiva Identificada',
          lines: [
            '• Inversão do ônus da prova: O editor atingido é obrigado a provar que não cometeu infrações que sequer foram especificadas com logs.',
            '• Fabricação retroativa de precedentes para justificar bloqueios que violam abertamente o Estatuto dos Administradores.',
          ],
        },
      ],
    },

    // SLIDE 5: UNIVERSAL CODE OF CONDUCT (UCoC) VIOLATIONS
    {
      slideNum: 5,
      tag: 'INFRAÇÃO DE CÓDIGOS INTERNOS DA WMF',
      title: 'Violações ao Código Universal de Conduta (UCoC)',
      subtitle: 'O Abandono dos Padrões Globais da Wikimedia Foundation pelo Administrador Chronus',
      sections: [
        {
          heading: 'Artigos Flagrantemente Violados do UCoC',
          lines: [
            '• Seção 3.1 - Respeito Mútuo & Não-Discriminação: Tratamento hostil, insultos depreciativos velados e sarcasmo institucionalizado contra o editor denunciante.',
            '• Seção 3.2 - Assédio e Perseguição (Harassment / Stalking): Perseguição contínua através do histórico de edições do editor para desfazer contribuições em artigos não correlatos.',
            '• Seção 3.3 - Abuso de Poder e Ferramentas (Abuse of Administrative Tools): Utilização de privilégios de bloqueio para vencer disputas de conteúdo pessoal.',
            '• Seção 4 - Cumprimento e Denúncia: Repressão contra quem tenta reportar a conduta do administrador às instâncias globais da fundação.',
          ],
        },
        {
          heading: 'Impacto da Quebra Institucional',
          lines: [
            '• O UCoC foi ratificado pela Diretoria da WMF como vinculante para todos os projetos; sua não aplicação na Wikipédia lusófona demonstra hipocrisia e negligência regulatória.',
          ],
        },
      ],
    },

    // SLIDE 6: WEAPONIZATION OF ADMINISTRATIVE TOOLS & CHECKUSER
    {
      slideNum: 6,
      tag: 'INSTRUMENTALIZAÇÃO TECNOLÓGICA',
      title: 'Instrumentalização de Ferramentas Administrativas & CheckUser',
      subtitle: 'Uso de Poderes Técnicos como Armas de Guerra Editorial e Coação',
      sections: [
        {
          heading: 'Mecanismos de Abuso Técnico',
          lines: [
            '• Ameaças de Verificação de IP (CheckUser) sem Causa Provável: Utilização da suspeita de CheckUser para coagir psicologicamente usuários dissidentes.',
            '• Supressão de Versões de Histórico (RevDelete / Oversight Indevido): Ocultação de erros do próprio administrador enquanto se expõem dados do usuário alvo.',
            '• Bloqueio Geográfico Indiscriminado (Rangeblocks): Aplicação de bloqueios /16 ou /24 que impedem milhares de leitores e cidadãos de contribuir, gerando dano social difuso.',
            '• Rollback Coordenado: Reversão em lote em velocidade sobre-humana sem ler as referências científicas trazidas pelos editores.',
          ],
        },
        {
          heading: 'Quebra dos Princípios Internacionais de Acesso Aberto',
          lines: [
            '• A ferramenta administrativa não foi criada como propriedade pessoal do operador, mas como custódia pública da comunidade de conhecimento livre.',
          ],
        },
      ],
    },

    // SLIDE 7: DUE PROCESS VIOLATIONS & SUMMARY JUSTICE
    {
      slideNum: 7,
      tag: 'DEVIDO PROCESSO LEGAL',
      title: 'Supressão do Devido Processo Legal e Julgamento Sumário',
      subtitle: 'A Negação do Contraditório e da Ampla Defesa no Tribunal de Exceção da Wikipédia',
      sections: [
        {
          heading: 'Violações Procedimentais Inaceitáveis',
          lines: [
            '• Nulidade por Falta de Citação / Notificação Prévia: Usuário bloqueado sumariamente sem direito a esclarecer ou apontar fontes.',
            '• Supressão do Acesso à Página de Discussão do Usuário (Talk Page): Eliminação de qualquer meio de recurso interno da própria plataforma.',
            '• Encerramento Prematuro de Pedidos de Bloqueio a Administradores (P/A): Pedidos de auditoria contra Chronus são arquivados em minutos por colegas de panelinha.',
            '• Ausência de Recurso com Efeito Suspensivo: A decisão punitiva entra em vigor imediatamente e perpetua-se indefinidamente.',
          ],
        },
        {
          heading: 'Confronto com Garantias Fundamentais',
          lines: [
            '• Violação ao Art. 5º, LIV e LV da Constituição Federal do Brasil (Ninguém será privado de seus direitos sem o devido processo legal; garantia do contraditório e ampla defesa).',
          ],
        },
      ],
    },

    // SLIDE 8: SUPPRESSION OF DISSENT & STREISAND EFFECT
    {
      slideNum: 8,
      tag: 'CENSURA & EFEITO STREISAND',
      title: 'Censura, Efeito Streisand e Perseguição a Denunciantes',
      subtitle: 'A Tentativa de Apagar Provas e as Consequências da Exposição Pública',
      sections: [
        {
          heading: 'Estratégia de Omissão e Censura',
          lines: [
            '• Exclusão Imediata de Páginas que Documentam Abusos: Criação de filtros automáticos (EditFilter) para proibir a menção a irregularidades de administradores.',
            '• Criação de Narrativa Difamatória Permanente: Inclusão do nome do editor em "listas negras" comunitárias com o rótulo de vândalo e propagador de ódio.',
            '• Bloqueio de Links Externos de Auditoria: A Wikipédia lusófona bloqueia no nível de spam-filter qualquer link que aponte para relatórios externos sobre o Caso Chronus.',
          ],
        },
        {
          heading: 'O Tiro pela Culatra (Efeito Streisand)',
          lines: [
            '• A censura motivou a formalização deste Dossiê em formato aberto e perene, a ser preservado na WikiWorldWeb e entregue a instâncias judiciais e acadêmicas mundiais.',
          ],
        },
      ],
    },

    // SLIDE 9: STRUCTURAL FAILURES IN WIKIMEDIA GOVERNANCE
    {
      slideNum: 9,
      tag: 'GOVERNANÇA & FALHAS SISTÊMICAS',
      title: 'Falhas Estruturais no Sistema de Governança da Wikimedia',
      subtitle: 'Por que o Modelo de Voluntariado Desregulado Favorece Oligarquias Abusivas',
      sections: [
        {
          heading: 'Causas-Raiz do Colapso de Governança',
          lines: [
            '• Falsa Descentralização: A WMF se diz "mera hospedeira" para fugir da responsabilidade legal, mas detém toda a infraestrutura e escolhe a dedo os administradores que empodera.',
            '• Ausência de Rotatividade nos Postos Chave: Administradores ocupam cargos por mais de uma década sem revalidação periódica ou avaliação de integridade comportamental.',
            '• Falta de Responsabilidade Profissional: Operadores não recebem treinamento em direito civil, direitos humanos, privacidade ou moderação equitativa.',
            '• Cultura Corporativa Tóxica de Blindagem: Denúncias levadas à WMF são sistematicamente devolvidas com a resposta padrão de "questão local comunitária".',
          ],
        },
        {
          heading: 'Consequência Institucional',
          lines: [
            '• Perda catastrófica de editores qualificados e declínio de confiança pública no projeto enciclopédico mais consultado da internet.',
          ],
        },
      ],
    },

    // SLIDE 10: INFORMATION LEAK & PRIVACY BREACHES (LGPD / GDPR)
    {
      slideNum: 10,
      tag: 'VIOLAÇÕES GRAVES DE PRIVACIDADE',
      title: 'Vazamento de Comunicações Confidenciais e Quebra de Sigilo',
      subtitle: 'Violações Diretas à LGPD (Lei 13.709/18) e ao GDPR (Regulamento UE 2016/679)',
      sections: [
        {
          heading: 'Os Fatos do Vazamento',
          lines: [
            '• Divulgação Indevida de Mensagens Privadas: E-mails e comunicações confidenciais endereçadas aos canais formais da WMF e administradores foram expostos e compartilhados.',
            '• Doxxing Velado e Cruzamento de Dados Cadastrais: Tentativa de expor dados de localização e redes sociais do pesquisador Pedro Henrique Cardona Peres.',
            '• Negligência com a Segurança dos Dados dos Denunciantes: Falha crassa no dever de custódia e sigilo aplicável a queixas e manifestações de abuso.',
          ],
        },
        {
          heading: 'Dispositivos Legais Violados',
          lines: [
            '• LGPD Arts. 6º (Princípios da Segurança e Prevenção), 17 e 18 (Direitos dos Titulares), 42 e 44 (Dever de Reparação por Vazamento e Tratamento Ilegítimo).',
            '• GDPR Art. 5º (Princípios do Tratamento de Dados Pessoais) e Art. 32 (Segurança do Tratamento) — sanções cabíveis de até 20 milhões de euros ou 4% do faturamento global.',
          ],
        },
      ],
    },

    // SLIDE 11: BRAZILIAN LEGAL FRAMEWORK (MARCO CIVIL & CÓDIGO CIVIL)
    {
      slideNum: 11,
      tag: 'LEGISLAÇÃO BRASILEIRA',
      title: 'Responsabilidade Civil e Penal perante o Ordenamento Brasileiro',
      subtitle: 'Enquadramento no Marco Civil da Internet (Lei 12.965/14) e Códigos Civil e Penal',
      sections: [
        {
          heading: 'Enquadramento Jurídico Específico',
          lines: [
            '• Código Penal Arts. 138 (Calúnia), 139 (Difamação) e 140 (Injúria): A acusação infundada de vandalismo e desonestidade intelectual constitui crime contra a honra.',
            '• Código Penal Art. 147-A (Perseguição / Stalking): Perseguição sistemática, reiterada e ameaçadora nos espaços digitais, restringindo a liberdade de expressão da vítima.',
            '• Código Civil Arts. 186 e 927: Aquele que por ação ou omissão voluntária causa dano a outrem comete ato ilícito, ficando obrigado a indenizar integralmente os danos morais e à imagem.',
            '• Marco Civil da Internet Arts. 10 e 11: Submissão de provedores de aplicação que ofertam serviços a brasileiros à jurisdição e legislação do Brasil, independentemente da sede física.',
          ],
        },
        {
          heading: 'Responsabilidade Solidária da Wikimedia Foundation',
          lines: [
            '• A WMF responde solidariamente pelos atos praticados por administradores que ela credencia e aos quais confere ferramentas de alta restrição e controle de conteúdo.',
          ],
        },
      ],
    },

    // SLIDE 12: INTERNATIONAL LEGAL LIABILITY (GDPR & DIGITAL SERVICES ACT)
    {
      slideNum: 12,
      tag: 'DIREITO INTERNACIONAL & DIGITAL SERVICES ACT',
      title: 'Responsabilidade Internacional (GDPR e EU Digital Services Act - DSA)',
      subtitle: 'Exigências de Transparência, Gestão de Riscos Sistêmicos e Due Process na União Europeia',
      sections: [
        {
          heading: 'O Impacto do Digital Services Act (DSA - Reg. UE 2022/2065)',
          lines: [
            '• Art. 17 do DSA: Dever formal de emitir declaração de motivos detalhada (Statement of Reasons) para qualquer restrição de conta ou conteúdo.',
            '• Art. 20 do DSA: Obrigação de fornecer sistema interno de tramitação de reclamações (Internal Complaint-Handling System) acessível, gratuito e célere.',
            '• Art. 21 do DSA: Acesso obrigatório a órgãos de resolução extrajudicial de litígios certificados por Estados-Membros da UE.',
            '• Art. 34 e 35 do DSA: Avaliação e mitigação obrigatória de riscos sistêmicos à liberdade de expressão, direitos civis e integridade cívica.',
          ],
        },
        {
          heading: 'Conclusão Jurídica Internacional',
          lines: [
            '• A prática de silenciamento operada por Chronus viola frontalmente as obrigações que a Wikimedia Foundation assumiu ao operar serviços para cidadãos no espaço europeu.',
          ],
        },
      ],
    },

    // SLIDE 13: INTERNAL POLICY BREACHES & SELECTIVE ENFORCEMENT
    {
      slideNum: 13,
      tag: 'QUEBRA DE NORMAS COMUNITÁRIAS',
      title: 'Quebra de Políticas Internas da Wikipédia & Blindagem Feudal',
      subtitle: 'A Degradação dos Pilares Editoriais sob o Mandato do Usuário Chronus',
      sections: [
        {
          heading: 'Políticas da Wikipédia Desrespeitadas pelo Administrador',
          lines: [
            '• WP:NPA (Não Faça Ataques Pessoais): Uso constante de rotulações ofensivas e presunção de má-fé contra novos colaboradores ou pesquisadores independentes.',
            '• WP:CIV (Conduta Civil): Falta de urbanidade e utilização de tom sarcástico e humilhante em discussões públicas.',
            '• WP:PBF (Presuma a Boa-Fé): Descarte sumário de edições com fontes sem a presunção inicial de contribuição produtiva.',
            '• WP:SYSOP (Conduta dos Administradores): Proibição explícita do uso de ferramentas administrativas em disputas nas quais o administrador é parte interessada.',
          ],
        },
        {
          heading: 'A Mecânica da Blindagem Corporativa',
          lines: [
            '• Administradores amigos votam pelo arquivamento sumário de qualquer contestação, transformando a Wikipédia Lusófona em uma corte sem recurso viável.',
          ],
        },
      ],
    },

    // SLIDE 14: PROPOSED SOLUTIONS, REMEDIATION & WIKIWORLDWEB
    {
      slideNum: 14,
      tag: 'REMEDIAÇÃO & O NOVO PARADIGMA',
      title: 'Propostas de Solução, Remediação e o Modelo WikiWorldWeb',
      subtitle: 'Do Autoritarismo Centralizado à Arquitetura Aberta, Auditável e com Direitos Garantidos',
      sections: [
        {
          heading: 'Medidas Reivindicadas junto à Wikimedia Foundation',
          lines: [
            '• 1. Revogação Imediata dos Privilégios do Usuário Chronus (Estatuto de Administrador e Burocrata).',
            '• 2. Desbloqueio e Reabilitação Formal de WazzimaGiygg e de todas as contas atingidas por bloqueios em cascata sem prova técnica.',
            '• 3. Instituição de Tribunal de Apelações Externo e Imparcial para a Wikipédia Lusófona, composto por juristas e acadêmicos.',
            '• 4. Auditoria Pública e Independente dos Logs de CheckUser e Bloqueios dos últimos 5 anos.',
          ],
        },
        {
          heading: 'O Antídoto: Arquitetura WikiWorldWeb',
          lines: [
            '• Auditoria transparente em tempo real, respeito irrestrito à LGPD/GDPR, separação de poderes, mediação neutra e garantia inalienável do contraditório.',
          ],
        },
      ],
    },

    // SLIDE 15: CONCLUSION & FORMAL PETITIONS
    {
      slideNum: 15,
      tag: 'CONCLUSÃO & ENCAMINHAMENTOS FORMAIS',
      title: 'Conclusão, Reivindicações Formais e Encaminhamentos',
      subtitle: 'Apresentação Concluída — Protocolo Oficial e Preservação Documental Perpétua',
      sections: [
        {
          heading: 'Encaminhamentos Legais em Andamento',
          lines: [
            '• Representação perante a Autoridade Nacional de Proteção de Dados (ANPD) por violação sistemática aos direitos de privacidade do titular.',
            '• Notificação Extrajudicial e Ação Civil de Responsabilidade perante o Poder Judiciário Brasileiro contra a Wikimedia Foundation Inc. e prepostos.',
            '• Comunicação aos Órgãos Reguladores da União Europeia com base nas regras do Digital Services Act e do GDPR.',
            '• Disponibilização Integral e Gratuita deste Dossiê em formato PDF e Web para a comunidade global de conhecimento livre.',
          ],
        },
        {
          heading: 'Mensagem Final',
          lines: [
            'O conhecimento livre não pode subsistir sob a sombra da censura e da intimidação feudal. A verdade dos fatos e a legalidade prevalecerão.',
            'WikiWorldWeb: A Nova Era da Enciclopédia Colaborativa Ética, Segura e Transparente.',
          ],
        },
      ],
    },
  ];

  slides.forEach((slide, index) => {
    if (index > 0) {
      doc.addPage();
    }

    let y = margin;

    // Header bar (Slide Tag & Header)
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(margin, y, contentWidth, 24, 'F');

    // Accent line on bottom of banner
    doc.setFillColor(225, 29, 72); // Rose 600
    doc.rect(margin, y + 23, contentWidth, 1.2, 'F');

    // Slide Tag & Counter
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(244, 63, 94); // Rose 500
    doc.text(slide.tag, margin + 5, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`SLIDE ${slide.slideNum} DE 15`, pageWidth - margin - 5, y + 7, { align: 'right' });

    // Main Slide Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.setTextColor(255, 255, 255);
    doc.text(slide.title, margin + 5, y + 15);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225); // Slate 300
    doc.text(slide.subtitle, margin + 5, y + 20.5);

    y += 30;

    // Slide Content Boxes (2 Columns or 2 Stacked Cards)
    const cardGap = 5;
    const cardHeight = 65;

    slide.sections.forEach((section, sIndex) => {
      // Draw Card Background
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.35);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'FD');

      // Card Header Banner
      doc.setFillColor(241, 245, 249); // Slate 100
      doc.roundedRect(margin, y, contentWidth, 9, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 9, pageWidth - margin, y + 9);

      // Card Header Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text(section.heading, margin + 5, y + 6.2);

      // Section lines
      let lineY = y + 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85); // Slate 700

      section.lines.forEach((line) => {
        const splitLines = doc.splitTextToSize(line, contentWidth - 10);
        doc.text(splitLines, margin + 5, lineY);
        lineY += splitLines.length * 4.2;
      });

      y += cardHeight + cardGap;
    });

    // Slide Footer
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Wikimedia Institutional Accountability Dossier • Apresentação Oficial de Governança & Auditoria Jurídica • Caso Chronus / WMF • DPO: pedrohenriquecardonaperes@gmail.com',
      margin,
      pageHeight - 7
    );

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72);
    doc.text(
      `Slide ${slide.slideNum} de 15 • WikiWorldWeb`,
      pageWidth - margin,
      pageHeight - 7,
      { align: 'right' }
    );
  });

  // Ensure directories exist
  const publicDir = path.join(process.cwd(), 'public');
  const documentsDir = path.join(publicDir, 'documents');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  if (!fs.existsSync(documentsDir)) fs.mkdirSync(documentsDir, { recursive: true });

  const pdfOutput = doc.output('arraybuffer');
  const buffer = Buffer.from(pdfOutput);

  // Write files with exact names and URL-friendly aliases
  const filesToCreate = [
    path.join(publicDir, 'Wikimedia_Institutional_Accountability_Dossier.pdf'),
    path.join(publicDir, 'Wikimedia Institutional Accountability Dossier.pdf'),
    path.join(publicDir, 'wikimedia-institutional-accountability-dossier.pdf'),
    path.join(publicDir, 'Dossie de Apresentacao - Wikimedia Institutional Accountability Dossier.pdf'),
    path.join(publicDir, 'Dossiê de Apresentação - Wikimedia Institutional Accountability Dossier.pdf'),
    path.join(documentsDir, 'Wikimedia_Institutional_Accountability_Dossier.pdf'),
    path.join(documentsDir, 'Wikimedia Institutional Accountability Dossier.pdf'),
    path.join(documentsDir, 'wikimedia-institutional-accountability-dossier.pdf'),
    path.join(documentsDir, 'Dossie de Apresentacao - Wikimedia Institutional Accountability Dossier.pdf'),
    path.join(documentsDir, 'Dossiê de Apresentação - Wikimedia Institutional Accountability Dossier.pdf'),
  ];

  console.log('Generating Wikimedia Institutional Accountability Dossier (15 Slides Presentation PDF)...');
  filesToCreate.forEach((filePath) => {
    fs.writeFileSync(filePath, buffer);
    console.log(' - ' + filePath);
  });
  console.log('Finished generating accountability presentation PDF successfully!');
}

generateAccountabilityPresentationPdf();
