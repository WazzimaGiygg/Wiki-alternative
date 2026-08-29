# Wiki Zero

> O paradigma *Wiki Zero* vs. sistemas tradicionais de documentação colaborativa

[![Runtime](https://img.shields.io/badge/runtime-Bun-000000?logo=bun)](https://bun.sh)
[![Build](https://img.shields.io/badge/build-Vite-646CFF?logo=vite)](https://vitejs.dev)
[![Lang](https://img.shields.io/badge/lang-TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Backend](https://img.shields.io/badge/backend-Firebase-FFCA28?logo=firebase)](https://firebase.google.com)
[![Deploy](https://img.shields.io/badge/deploy-Vercel-000000?logo=vercel)](https://vercel.com)

---

## 📖 Sobre o Projeto

O **Wiki Zero** (referenciado no ecossistema GitHub como `Wiki-alternative`) é uma solução de documentação colaborativa construída sobre o template oficial `google-gemini/aistudio-repository-template`. O projeto adota o "triângulo de eficiência" composto por **TypeScript**, **Vite** e **Bun**, substituindo o Node.js tradicional para garantir maior velocidade de execução tanto em desenvolvimento quanto em produção.

Diferente das ferramentas de wiki tradicionais, o Wiki Zero propõe uma arquitetura *backend-less* e *serverless*, eliminando a necessidade de provisionar ou manter servidores próprios.

---

## 🆚 Wiki Zero vs. MediaWiki

O **MediaWiki** — motor por trás da Wikipédia — é o padrão histórico do setor, mas carrega uma complexidade operacional significativa por depender de uma pilha **LAMP/LEMP** (Linux, Apache/Nginx, MySQL/MariaDB, PHP), exigindo patches de segurança constantes e gerenciamento manual de dependências.

O Wiki Zero substitui esse modelo por uma persistência de dados descentralizada, oferecendo autonomia através da abstração total da infraestrutura — sem exigir um administrador de sistemas dedicado.

| Critério | Wiki Zero (Firebase/Vercel) | MediaWiki (Hospedagem Tradicional) |
|---|---|---|
| **Runtime Environment** | Bun / Vite | PHP / Apache ou Nginx |
| **Escalabilidade** | Automática e Nativa (Serverless) | Requer Load Balancers e Config. Manual |
| **Manutenção de Banco** | Gerenciada (Cloud Firestore) | Manual (MySQL/PostgreSQL) |
| **Facilidade de Deploy** | CI/CD Contínuo (Vercel/Git) | Complexa (Scripts de migração/Manual) |
| **Custo de Entrada** | Próximo a Zero (Nível Gratuito) | Elevado (Hospedagem Fixa/Servidor) |

---

## 🔥 Diferencial Firebase

A adoção do **Firebase** como backend elimina a fricção de gerenciamento de servidores, permitindo que a equipe de engenharia foque na entrega de valor em vez da manutenção de infraestrutura.

A análise dos arquivos de configuração do projeto revela uma implementação sofisticada:

- **`firestore.rules`** — Segurança declarativa movida para a "borda" (*edge*) do banco de dados, com lógica de autorização tratada nativamente pelo Firebase.
- **`firebase-blueprint.json`** — Estrutura de dashboard administrativo pré-configurada, permitindo estabelecer a governança da wiki imediatamente após o deploy.
- **`firebase-applet-config.json`** — Configuração adicional do applet integrado à plataforma.

> A sinergia entre Vite, TypeScript e o runtime Bun redefine a experiência de desenvolvimento, entregando uma aplicação otimizada para carregamento instantâneo.

---

## 💰 Eficiência e Custo Total de Propriedade (TCO)

O modelo *pay-per-use*, combinado ao deploy via **Vercel**, resulta em custo total de entrada virtualmente zero, permitindo que os custos escalem proporcionalmente à adoção da ferramenta.

- **MediaWiki:** o custo real está no "custo de oportunidade" e nas horas-homem gastas em *patch management* de PHP e SQL.
- **Wiki Zero:** essa carga é delegada aos provedores de nuvem (Google e Vercel), mantendo a infraestrutura sempre atualizada e segura.

---

## 🔒 Conformidade e Governança de Dados (LGPD / Marco Civil)

A conformidade legal é tratada como requisito arquitetural, não como um detalhe posterior.

Um ponto técnico de destaque é a **ferramenta de renomeação de usuários** (commit `777d770`). Em bancos NoSQL como o Firestore, manter a consistência de dados ao renomear uma entidade é tecnicamente desafiador devido à natureza desnormalizada dos dados — desafio que o Wiki Zero resolve nativamente.

Essa funcionalidade atende diretamente a:

- **LGPD** (Lei Geral de Proteção de Dados)
- **Marco Civil da Internet**
- **Direito ao Esquecimento** e anonimização de dados pessoais

Ter essa capacidade integrada nativamente elimina a dependência de plugins de terceiros para governança de dados.

---

## ✅ Recomendações de Uso

| Perfil | Adequação |
|---|---|
| **Startups e Scale-ups** | Ideal para baixo custo operacional e escalabilidade imediata |
| **Equipes de Engenharia** | Perfeito para documentação técnica interna integrada a fluxos Git |
| **Projetos com Rigor de Compliance** | Recomendado para controle estrito de dados de usuários (LGPD) |

---

## 🚀 Conclusão

O Wiki Zero integra a robustez do **TypeScript** com a agilidade do **Bun** e a escalabilidade do **Firebase**, propondo-se como uma alternativa moderna, *serverless* e economicamente vantajosa frente aos sistemas de wiki tradicionais — priorizando eficiência, segurança declarativa e performance.

---

## 📚 Fonte

Conteúdo adaptado do artigo original:
**"Análise Comparativa de Plataformas Wiki: O Paradigma Wiki Zero vs. Sistemas Tradicionais"** — [WazzimaGiygg](https://wazzimagiyggcore.blogspot.com/2026/08/analise-comparativa-de-plataformas-wiki.html), agosto de 2026.
