# 🎨 Guia de Design & Sistema Visual — AppNix

Este é o guia oficial **"Warm Nomad & Playful Travel"**, mapeado para o código. Os tokens estão em `src/index.css` (`@theme` + utilitários `type-*`) e os componentes em `src/components/ui.tsx`.

> **Regra de ouro:** as telas usam só tokens e componentes daqui. Se um valor não existe, ele vira token ou o desenho se ajusta ao mais próximo.

---

## 1. Filosofia

- **Acolhedor e curado.** Tons quentes (laranja terra e âmbar dourado) sobre fundo quase branco `#FAFAFA`, com a sensação de um guia de viagens premium.
- **Formas orgânicas e confortáveis.** Cantos de 24 a 36 px, cards sem bordas pesadas, sombras difusas.
- **Micro-interações vivas.**
  - Tudo encolhe ao toque (`active:scale-95`; em cards, `active:scale-[0.98]`).
  - A tab bar desliza com uma pílula elástica.
  - O kudos dá um "pop" ao ser tocado.
  - O check-in explode em confetes.

Regras de clareza que valem junto:

- Uma ação principal (laranja) por tela.
- Botão desabilitado sempre diz o motivo (ex.: "Aproxime-se: faltam 120 m").
- Uma informação aparece uma vez por bloco, sem repetição.

---

## 2. Paleta & tokens

| Token | Hex | Classe | Uso |
|---|---|---|---|
| Primary | `#E9A34D` | `bg-primary` · `text-primary` | Botões principais, ícone ativo na tab bar, destaques |
| Primary strong | `#C9842F` | `text-primary-strong` | Texto laranja **pequeno** sobre branco (overline, tags), para garantir contraste |
| Secondary | `#FFF6EE` | `bg-secondary` | Fundo de tags e badges suaves, hero do perfil |
| Accent | `#FFD166` | `bg-accent` | Pontos/XP (`PointsPill`), estrelas, fim do gradiente de progresso |
| Success | `#00D084` | `bg-success` | Check-in confirmado, "Concluída" |
| Background | `#FAFAFA` | `bg-bg` | Fundo geral |
| Surface | `#FFFFFF` | `bg-surface` | Cards, modais, sheets |
| Text (Carbon) | `#222222` | `text-ink` | Títulos e textos de alto contraste |
| Muted | `#717171` | `text-muted` | Subtítulos, distâncias, timestamps |
| Border | `#DDDDDD` | `border-line` (`/50`, `/80`) | Divisórias e bordas finas |
| Desabilitado | `#F4F4F5` / `#A1A1AA` / `#E4E4E7` | `disabled-bg` / `disabled-ink` / `disabled-line` | Botão fora do raio etc. |
| Pódio | `#F59E0B` / `#94A3B8` / `#D97706` | `gold` / `silver` / `bronze` | 1º, 2º e 3º lugares |

Semânticas em par (fundo suave + tinta legível): `success-soft`/`success-ink` e `danger-soft`/`danger-ink`. O ponto de não lido usa `danger` (`#EF4444`).

As categorias usam tons suaves só nas miniaturas sem foto: turismo `#FFF1DE`, gastronomia `#FDE8E2`, explorador `#DFF3EC`, com o ícone na cor da categoria. A **tag** de categoria é sempre `bg-secondary` + `text-primary-strong`, igual para todas.

---

## 3. Tipografia

- **Outfit:** títulos e logotipo.
- **Inter:** corpo e números.

As duas vêm empacotadas no app via `@fontsource-variable` (mesmos pesos do Google Fonts), para o APK funcionar offline.

| Papel no guia | Token | Especificação |
|---|---|---|
| Logo / Brand | `type-logo` | Outfit 24/32, 800, tracking-tight |
| Hero (login, sucesso) | `type-display` | Outfit 32/38, 700 |
| Cabeçalho de tela (H1) | `type-title1` | Outfit 24/32, 700, tracking-tight. Ex.: "Olá, Guilherme", "Comunidade" |
| Título de seção / sheet | `type-title2` | Outfit 20/28, 700 |
| Título de card (H2) | `type-title3` (+ `leading-snug`) | Outfit 18/24, 700 |
| Corpo | `type-body` / `type-body-strong` | Inter 15/22, 400 / 600 |
| Apoio | `type-callout` | Inter 14/20, 400 |
| Botões | `type-label` | Inter 14/20, 700 (bold, text-sm) |
| Subtítulo / muted | `type-caption` | Inter 12/16, 500, tracking-wide |
| Overline / categoria | `type-overline` | Inter 11/14, 700, caixa alta, tracking-widest, `text-primary-strong` |
| Tag de categoria | `type-tag` | Inter 10/14, 700, caixa alta, tracking-wider |
| Pontos / badges | `type-points` | Inter 14/20, **900**, tracking-tight, tabular |
| Estatística | `type-stat` | Inter 22/28, 900, tabular |

---

## 4. Espaçamento, raios e sombras

| Token | Valor | Uso |
|---|---|---|
| `px-gutter` | 20 | Margem lateral de todas as telas e sheets |
| `p-card` / `p-5` | 20 | Padding do card-nomad |
| `section` | 32 | Entre seções |
| `pb-nav` | 128 (`pb-32`) | Fim das telas roláveis. A tab bar flutua a 24 px da borda |
| `rounded-control` | 16 (`rounded-2xl`) | Botões, inputs |
| `rounded-photo` | 20 | Fotos do feed |
| `rounded-card` | 24 | Cards |
| `rounded-sheet` | 32 | Tab bar, hero do perfil |
| `rounded-modal` | 36 | Topo do bottom sheet |
| `shadow-card` | borda `#DDD`/50 + `0 4px 20px rgba(0,0,0,.03)` | card-nomad |
| `shadow-card-hover` | borda + `0 8px 30px rgba(0,0,0,.06)` | Hover de card clicável |
| `shadow-float` | borda `zinc-200/80` + `0 12px 40px rgba(0,0,0,.12)` | Tab bar, card do mapa |
| `shadow-primary` | `shadow-lg` primary/20 | Botão primário |

---

## 5. Componentes

**A. Tab bar flutuante (`BottomNav`)**
- Centralizada a 24 px da borda (+ safe area): `bg-white/95`, `backdrop-blur-xl`, `rounded-[32px]`, `p-2`, `gap-2`, `shadow-float`.
- Pílula ativa `motion.div layoutId="active-nav-pill"` em `bg-primary/10 rounded-[24px]`.
- O ativo expande para **72 px**, com ícone e rótulo laranja. Os inativos ficam com **54 px**, só ícone.
- O check-in é um botão laranja fixo de 54 px.

**B. Card de missão e trilha (card-nomad)**
- `rounded-card bg-surface shadow-card`, hover mais profundo e `active:scale-[0.98]` (classe `cardInteractive`).
- Missão: miniatura 64 + `CategoryTag` + `PointsPill`, título `type-title3`, uma linha de metadados.
- Trilha: banner suave com "+N bônus", título, descrição `line-clamp-2` e progresso com gradiente primary → accent.

**C. Botões (`Button`)**

| Variante | Estilo |
|---|---|
| Primário | `bg-primary text-white`, bold sm, `h-13 rounded-2xl`, `shadow-primary`, `hover:brightness-105`, `active:scale-95` |
| Secundário / cancelar | `bg-white border-line/80`, `hover:bg-surface-muted` |
| Desabilitado | `bg-disabled-bg text-disabled-ink border-disabled-line`, `cursor-not-allowed` |

Tamanhos: `lg` 52 · `md` 44 · `sm` 36 (pill).

**D. Bottom sheet (`BottomSheet`)**
- Backdrop `bg-black/40` com blur leve.
- Folha com `max-h 85%`, `rounded-t-[36px]`, `shadow-sheet`.
- Puxador `w-12 h-1.5 bg-handle rounded-full`.
- Fecha ao arrastar para baixo, ao tocar fora ou com Esc. Ações ficam no rodapé fixo.

**E. Avatar com anel de nível (`Avatar`)**
- Circular, `border-2 border-white shadow-sm`, inicial quando não há foto.
- Anel de progresso do XP em **gradiente primary → accent**.
- Tamanhos 32 · 40 · 48 · 64 · 96.

**F. Outros**
- `IconButton`: redondo de 44 px, branco, ponto vermelho de não lido.
- `Chip`: pílula de filtro.
- `Segmented`: abas com pílula elástica.
- `StatusBanner`: estado inline.
- `Skeleton`: carregamento.
- `EmptyState`: estado vazio.

---

## 6. Padrões de layout

- **Header padrão (Home):** "Olá, Guilherme" (`type-title1`) com o título de nível em `type-caption` muted abaixo. Sino com ponto vermelho e avatar com anel à direita.
- **Filtros por pílulas:** `overflow-x-auto no-scrollbar flex gap-2 py-2`.
  - Selecionada: `bg-ink text-white rounded-full px-4 py-2 text-xs font-semibold`.
  - Não selecionada: `bg-white border-line text-muted text-xs font-medium hover:border-ink`.
- **Feed social:** posts em card-nomad, foto **4:5** com `rounded-photo` (20).
  - Kudos com `whileTap={{ scale: 1.2 }}`.
  - Curtido: `bg-primary/10 text-primary` com brilho suave.
- **Ranking / pódio:**
  - Colunas de alturas diferentes: 1º no centro e mais alto, 2º à esquerda, 3º à direita.
  - Coroas e cores metálicas (ouro, prata e bronze).
  - O restante em cards, com "(você)" destacado por anel laranja.
- **Check-in:** 3 etapas em cards numerados (Local, Foto, Avaliação). O botão "Confirmar" fica fixo acima da tab bar, com a frase do que falta.

---

## 7. Checklist de qualidade visual

- [ ] Nada de bordas pretas rígidas: use `border-line/50` (ou `shadow-card`) com sombras sutis.
- [ ] Todo elemento tocável tem `active:scale-95` (cards: `active:scale-[0.98]`).
- [ ] Telas roláveis terminam com `pb-nav` (128 px): nada fica escondido atrás da tab bar.
- [ ] Sem rolagem horizontal indesejada: `body` com `overflow-x-hidden`, chips com `no-scrollbar`.
- [ ] Só tokens `type-*`, raios do guia e cores por token (exceção: canvas do mapa e confete).
- [ ] Uma ação primária por tela. Desabilitada, sempre explica o motivo.
- [ ] Estados de carregamento (skeleton), vazio e erro desenhados.
- [ ] Alvos de toque de 44 px ou mais e `aria-label` em botões só com ícone.
