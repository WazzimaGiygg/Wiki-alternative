# WikiWorldWeb / WikiZero

**A Enciclopédia Livre, Rápida e Sem Anúncios**

[![Live Demo](https://img.shields.io/badge/Live-wikizero.wazzimagiygg.com-blue?style=for-the-badge)](https://wikizero.wazzimagiygg.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)

> Uma alternativa moderna, aberta e de alto desempenho à Wikipédia, MediaWiki, Wikidot e Fandom.  
> Construída para ser leve de configurar, barata de manter e poderosa de usar.

---

## ✨ Visão Geral

O **WikiWorldWeb** (também conhecido como **WikiZero**) é uma plataforma de enciclopédia colaborativa de nova geração. Diferente dos sistemas tradicionais baseados em PHP + MySQL, ele adota uma arquitetura **serverless** moderna com:

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Firebase (Authentication + Cloud Firestore)
- **IA nativa**: Integração profunda com Google Gemini
- **Runtime**: Bun / Node
- **Deploy**: Extremamente simples (Vercel, Cloud Run ou qualquer host estático + Firebase)

O resultado é uma wiki que carrega rápido, escala automaticamente, custa quase zero no início e exige manutenção mínima.

---

## 🚀 Principais Diferenciais

| Recurso                        | WikiWorldWeb / WikiZero          | MediaWiki / Wikipédia          |
|--------------------------------|----------------------------------|--------------------------------|
| Custo de entrada               | Próximo de zero                  | Servidor + manutenção constante|
| Configuração inicial           | Minutos                          | Horas / dias                   |
| Escalabilidade                 | Automática (serverless)          | Manual                         |
| Integração com IA              | Nativa (Gemini)                  | Quase inexistente              |
| Conformidade LGPD              | Nativa e profunda                | Via extensões                  |
| Experiência moderna (PWA)      | Sim                              | Limitada                       |
| Temas e personalização visual  | Rica e em tempo real             | Via skins                      |
| Editor                         | Wikitexto em tempo real + IA     | VisualEditor + wikitexto       |

---

## 🌟 Funcionalidades Principais

- **Editor de Wikitexto em tempo real** com validação de citações
- **Gemini Notebook** — assistente de IA integrado para criação e melhoria de conteúdo
- **Histórico de navegação estilo navegador** (Voltar / Avançar por UID)
- **Sistema de Extensões** com scanner de malware e quarentena
- **Wiki dos Livros** e **Wiki Universitário** (integração com fontes acadêmicas)
- **Jornal WazzimaGiygg** — edição digital e notícias em tempo real
- **Temas visuais** personalizáveis
- **Sincronização Cloud Firestore** em tempo real
- **Sistema de reputação e checklist diário** (gamificação)
- **Central de Dados (Meus Dados)** com portabilidade, retificação e anonimização (LGPD)
- **Verificação de idade** e conformidade com a Lei nº 13.709/2018
- **Mensagens diretas** em tempo real
- **PWA completo** (instalável, offline-capable)
- **Tradução universal** (i18n)
- **Ferramentas administrativas avançadas** (usuários, extensões, remoção de dados, etc.)

---

## 🛠 Stack Tecnológica

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS 4, Lucide React, Motion
- **Backend / Dados**: Firebase Authentication + Cloud Firestore
- **IA**: `@google/genai` (Gemini)
- **Servidor**: Express + tsx (desenvolvimento)
- **PWA**: vite-plugin-pwa
- **Outros**: jsPDF, html2canvas, JSZip, Recharts, canvas-confetti

---

## 📦 Como Rodar Localmente

### Pré-requisitos
- Node.js 20+ ou **Bun** (recomendado)
- Conta no Firebase
- Chave da API Gemini (Google AI Studio)

### 1. Clone o repositório
```bash
git clone https://github.com/WazzimaGiygg/Wiki-alternative.git
cd Wiki-alternative
