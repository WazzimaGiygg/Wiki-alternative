import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { parseWikitext } from '../src/utils/wikitextParser';
import {
  INFOBOX_TEMPLATES,
  INFOBOX_VARIABLES_REFERENCE,
  buildDefaultUserBioWikitext,
  buildDefaultUserInfoboxWikitext,
  hasInfoboxInWikitext,
} from '../src/utils/infoboxCatalog';
import { InfoboxTutorialModal } from '../src/components/InfoboxTutorialModal';

describe('Infobox de Usuário, Tutorial e Catálogo de Infoboxes', () => {
  it('gera automaticamente {{Info/Usuário}} completo para novas contas', () => {
    const bio = buildDefaultUserBioWikitext({
      uid: 'uid_novo_123',
      displayName: 'Nova_Editora',
      username: 'Nova_Editora',
      role: 'editor',
      location: 'Brasil',
      createdAt: '2026-11-17T12:00:00.000Z',
      isBanned: false,
    });

    expect(hasInfoboxInWikitext(bio)).toBe(true);
    expect(bio).toContain('{{Info/Usuário');
    expect(bio).toContain('| Nome = Nova_Editora');
    expect(bio).toContain('| Usuário = @Nova_Editora');
    expect(bio).toContain('| Identificador UID = `uid_novo_123`');
    expect(bio).toContain('| Status = Ativo');

    const parsed = parseWikitext(bio);
    expect(parsed.html).toContain('wiki-infobox');
    expect(parsed.html).toContain('Nova_Editora');
    expect(parsed.html).toContain('Identificação da Conta');
    expect(parsed.html).toContain('uid_novo_123');
  });

  it('suporta novas variáveis visuais e semânticas no parser de Infobox', () => {
    const wikitext = `{{Info/Software
| Nome = WikiWorldWeb Engine
| Subtítulo = Plataforma Aberta
| Selo = Destaque Editorial
| Cor = esmeralda
| Estilo = destaque
| Compacto = sim
| Ícone = 💻
| Alinhamento = esquerda
| Largura = largo
| Imagem = /logo.png
| Imagem_Forma = circulo
| Imagem_Largura = 96px
| Legenda = Marca oficial
| Seção1 = Métricas
| Status = Ativo
| Progresso = 85%
| Avaliação = 4.8/5
| Coordenadas = 23°33′S 46°38′W
| Tags = TypeScript, React, Open Source
| Fonte = Documentação Oficial 2026
| Rodapé = Licença GNU GPL v3.0
}}`;

    const { html } = parseWikitext(wikitext);
    expect(html).toContain('wiki-infobox');
    expect(html).toContain('from-emerald-700');
    expect(html).toContain('sm:float-left');
    expect(html).toContain('sm:w-96');
    expect(html).toContain('rounded-full');
    expect(html).toContain('Destaque Editorial');
    expect(html).toContain('shadow-md');
    expect(html).toContain('85%');
    expect(html).toContain('4.8/5');
    expect(html).toContain('bg-emerald-600');
    expect(html).toContain('23°33′S 46°38′W');
    expect(html).toContain('TypeScript');
    expect(html).toContain('Open Source');
    expect(html).toContain('Documentação Oficial 2026');
    expect(html).toContain('Licença GNU GPL v3.0');
    expect(html).not.toContain('style="');
  });

  it('oferece 22 tipos de infobox e documentação completa de variáveis no catálogo', () => {
    expect(INFOBOX_TEMPLATES.length).toBeGreaterThanOrEqual(22);
    expect(INFOBOX_VARIABLES_REFERENCE.length).toBeGreaterThanOrEqual(20);

    const templateNames = INFOBOX_TEMPLATES.map((t) => t.templateName);
    expect(templateNames).toContain('Info/Usuário');
    expect(templateNames).toContain('Info/Software');
    expect(templateNames).toContain('Info/País');
    expect(templateNames).toContain('Info/Livro');
    expect(templateNames).toContain('Info/Jogo');
    expect(templateNames).toContain('Info/Ciência');
    expect(templateNames).toContain('Info/Animal');
    expect(templateNames).toContain('Info/Planeta');
    expect(templateNames).toContain('Info/Hardware');
    expect(templateNames).toContain('Info/Personagem');
    expect(templateNames).toContain('Info/Esporte');
    expect(templateNames).toContain('Info/Universidade');
    expect(templateNames).toContain('Info/Idioma');
    expect(templateNames).toContain('Info/Alimento');

    // Todos os modelos devem produzir HTML válido com classe wiki-infobox e sem style inline
    for (const tpl of INFOBOX_TEMPLATES) {
      const snippet = tpl.buildSnippet('Teste');
      expect(hasInfoboxInWikitext(snippet)).toBe(true);
      const { html } = parseWikitext(snippet);
      expect(html).toContain('wiki-infobox');
      expect(html).not.toContain('style="');
    }
  });

  it('renderiza o InfoboxTutorialModal nas abas de tutorial, catálogo e variáveis', () => {
    const tutorialHtml = renderToStaticMarkup(
      <InfoboxTutorialModal
        isOpen={true}
        onClose={() => {}}
        initialTab="tutorial"
      />
    );
    expect(tutorialHtml).toContain('Guia de Infoboxes');
    expect(tutorialHtml).toContain('Como funciona o Infobox na WikiWorldWeb');
    expect(tutorialHtml).toContain('01. Abra e feche o bloco com chaves duplas');
    expect(tutorialHtml).toContain('04. Privacidade e LGPD no Infobox de Usuário');
    expect(tutorialHtml).toContain('wiki-infobox');

    const catalogHtml = renderToStaticMarkup(
      <InfoboxTutorialModal
        isOpen={true}
        onClose={() => {}}
        initialTab="catalog"
      />
    );
    expect(catalogHtml).toContain('Usuário (Perfil)');
    expect(catalogHtml).toContain('Software / Tecnologia');
    expect(catalogHtml).toContain('País / Território');

    const varsHtml = renderToStaticMarkup(
      <InfoboxTutorialModal
        isOpen={true}
        onClose={() => {}}
        initialTab="variables"
      />
    );
    expect(varsHtml).toContain('Variáveis suportadas em todos os Infoboxes');
    expect(varsHtml).toContain('Imagem_Forma');
    expect(varsHtml).toContain('Progresso');
    expect(varsHtml).toContain('Rodapé');
  });

  it('detecta ausência de infobox em bios antigas para fallback automático', () => {
    expect(hasInfoboxInWikitext('= Usuario =\nTexto simples sem ficha.')).toBe(false);
    const fallback = buildDefaultUserInfoboxWikitext({
      uid: 'u_antigo',
      displayName: 'Editor_Antigo',
      role: 'moderador',
    });
    expect(hasInfoboxInWikitext(fallback)).toBe(true);
    expect(fallback).toContain('Cor = indigo');
  });
});
