# MAINTAINERS.md

## Sobre este arquivo

Este documento existe para facilitar a continuidade do projeto **Wiki-alternative** (também conhecido como WikiWorldWeb / WikiZero) caso o mantenedor original não possa mais continuar o desenvolvimento.

O objetivo é deixar registrado:
- A intenção do projeto
- O estado atual
- O que é prioritário
- Como alguém pode assumir a manutenção com o menor atrito possível

---

## Intenção do Projeto

O Wiki-alternative nasceu como uma alternativa moderna, leve e de baixo custo à Wikipédia/MediaWiki, com foco em:

- Arquitetura serverless (React + TypeScript + Firebase)
- Integração nativa com IA (Google Gemini)
- Conformidade com a LGPD
- Experiência de usuário moderna (PWA, temas, etc.)
- Sistema de extensões
- Baixo custo de manutenção e deploy simples

O projeto prioriza **clareza, performance e independência** em relação a sistemas legados pesados.

---

## Mantenedor Original

- **Usuário GitHub:** [WazzimaGiygg](https://github.com/WazzimaGiygg)
- **Repositório principal:** https://github.com/WazzimaGiygg/Wiki-alternative

Caso o mantenedor original não possa mais continuar, este arquivo serve como ponto de partida para quem desejar assumir a responsabilidade.

---

## Estado Atual do Projeto (resumo)

### Já implementado
- Frontend em React 19 + TypeScript + Vite + Tailwind
- Backend com Firebase (Authentication + Firestore)
- Integração com Google Gemini
- Sistema de páginas e histórico
- Sistema de extensões (com scanner de malware)
- Painéis administrativos
- Recursos de LGPD (remoção de dados, consentimento, etc.)
- PWA
- Diversas ferramentas auxiliares (biblioteca, acadêmico, jornal, etc.)

### Problemas conhecidos e prioritários
1. **Segurança do Firestore (crítico)**  
   As regras atuais ainda permitem que usuários autenticados criem e atualizem versões de páginas (histórico não é imutável). Isso precisa ser corrigido com urgência.

2. **Infraestrutura de Bots**  
   Existe a intenção de criar um sistema de bots (anti-vandalismo, verificação de citações, qualidade, LGPD, etc.), mas ainda não está implementado.

3. **Documentação técnica**  
   Ainda precisa ser expandida para facilitar a entrada de novos contribuidores.

---

## Como assumir a manutenção

Qualquer pessoa interessada pode:

1. Fazer um **fork** do repositório
2. Entrar em contato pelo GitHub (Issues ou Discussions)
3. Propor-se como mantenedor

Recomenda-se que quem assumir:
- Mantenha o espírito do projeto (leveza, modernidade e independência)
- Preserve a conformidade com a LGPD
- Continue priorizando a segurança do histórico de edições
- Documente as mudanças importantes

---

## Prioridades recomendadas para novos mantenedores

### Fase 1 – Segurança (urgente)
- [ ] Corrigir `firestore.rules` para tornar o histórico imutável
- [ ] Restringir escritas em coleções sensíveis (extensões, telemetria, etc.)
- [ ] Revisar permissões de criação/edição de páginas

### Fase 2 – Infraestrutura de Bots
- [ ] Criar extensão de gerenciamento de bots
- [ ] Implementar sistema de Bot Users
- [ ] Desenvolver bots prioritários (anti-vandalismo e verificação de citações)

### Fase 3 – Estabilidade e documentação
- [ ] Melhorar documentação de arquitetura
- [ ] Organizar issues e roadmap
- [ ] Facilitar o onboarding de novos contribuidores

---

## Contato e Transição

Se você deseja assumir a manutenção deste projeto, abra uma Issue com o título:

**[Manutenção] Interesse em assumir o projeto**

Descreva brevemente sua experiência e motivação.

---

## Licença

O projeto deve continuar sob uma licença de código aberto.  
Verifique o arquivo `LICENSE` do repositório para os termos atuais.

---

**Nota final:**  
Este projeto foi construído com esforço e intenção de ser útil.  
Que quem continuar o trabalho o faça com o mesmo respeito pela ideia original.
