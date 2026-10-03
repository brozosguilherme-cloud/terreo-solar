# AppNix — Spec de Design

Referência única para quem desenha ou codifica telas do AppNix. Os tokens moram em `src/index.css` (bloco `@theme` + utilitários `type-*`) e os componentes base em `src/components/ui.tsx`.

> **Regra de ouro:** nenhuma tela usa px, hex ou tamanho de fonte avulso. Se um valor não existe aqui, ou ele vira token, ou o desenho se ajusta ao token mais próximo.

---

## 1. Princípios

1. **Uma ação principal por tela.** Ela é sempre o botão laranja (`Button` primary). Ações secundárias são brancas com borda, e terciárias são ghost ou link.
2. **O usuário nunca fica sem saber o que falta.** Botão desativado vem com uma frase dizendo o motivo (ex.: "Aproxime-se: faltam 120 m"). Validações aparecem embaixo do campo, nunca só como toast.
3. **Hierarquia por tamanho e peso, não por cor.** Texto principal em `ink` e secundário em `muted`. Laranja é para ação e destaque, nunca para texto corrido.
4. **Respiro generoso e previsível.** Toda tela tem a mesma margem lateral (20), o mesmo espaço entre seções (32) e o mesmo padding de card (16).
5. **Carregamento com forma.** Listas carregando mostram skeletons com o formato do conteúdo, não um spinner solto.

---

## 2. Tipografia

Duas famílias, com papéis fixos:

- **Outfit** é para títulos e marca (peso 600/700).
- **Inter** é para todo o resto, incluindo números, badges, botões e metadados (peso 400/500/600).

| Token | Família | Tamanho/linha | Peso | Uso |
|---|---|---|---|---|
| `type-display` | Outfit | 32/38 | 700 | Hero do login, sucesso do check-in, splash |
| `type-title1` | Outfit | 28/34 | 700 | Título de tela (`ScreenHeader`), título de missão no sheet |
| `type-title2` | Outfit | 22/28 | 600 | Título de seção, título de bottom sheet, nome no perfil |
| `type-title3` | Outfit | 18/24 | 600 | Título de card (missão, trilha, post, etapa) |
| `type-body` | Inter | 15/22 | 400 | Texto corrido, descrições, legendas de post |
| `type-body-strong` | Inter | 15/22 | 600 | Nome em linha de lista, label de botão grande |
| `type-callout` | Inter | 14/20 | 400 | Subtítulos, textos de apoio, comentários |
| `type-label` | Inter | 14/20 | 600 | Botões médios, chips, abas, banners de status |
| `type-caption` | Inter | 12/16 | 500 | Metadados (distância, tempo, contadores) |
| `type-overline` | Inter | 11/14 | 600, CAIXA ALTA, +6% | Categoria, "NÍVEL 3", rótulos de grupo |
| `type-stat` | Inter | 20/28 | 600, tabular | Números de estatística (pontos, missões) |
| `type-number` | Inter | herda | 600, tabular | Modificador para qualquer número que muda |

Regras:

- Números que mudam (pontos, contadores, ranking) sempre usam `tabular-nums` (`type-number` ou `type-stat`), para não "pular" de largura.
- Não use opacidade em texto (`text-ink/80`). Para hierarquia, use `text-ink` ou `text-muted`. Sobre fundo escuro, use `text-white` e `text-white/60`.
- Máximo de **3 níveis tipográficos por card**: título, corpo e metadado.

---

## 3. Cores

### Marca
| Token | Hex | Uso |
|---|---|---|
| `primary` | `#E9A34D` | Ação principal, FAB, progresso, indicador ativo |
| `primary-strong` | `#C9842F` | Texto e ícone laranja sobre fundo claro (contraste AA) |
| `secondary` | `#FFF6EE` | Fundos suaves, hero blocks, item ativo da nav |
| `accent` | `#FFD166` | Pontos e recompensas (`PointsPill`), coroa, nível alto |
| `success` | `#00D084` | Concluído, check-in feito, aceitar |

### Neutros
| Token | Hex | Uso |
|---|---|---|
| `bg` | `#FAFAFA` | Fundo de tela |
| `surface` | `#FFFFFF` | Cards, sheets, inputs |
| `surface-muted` | `#F4EFE9` | Trilho de progresso, segmentado, botão desativado, skeleton |
| `ink` | `#222222` | Texto principal, chip ativo, card de nível |
| `muted` | `#717171` | Texto secundário, ícones inativos |
| `line` | `#DDDDDD` | Borda de input e de botão secundário |
| `line-soft` | `#EEEAE5` | Divisores e bordas de linhas de lista |

### Semânticas (sempre em par: fundo suave + tinta legível)
| Par | Uso |
|---|---|
| `success-soft` / `success-ink` | "Você está no local", "No raio", concluída |
| `danger-soft` / `danger-ink` | Fora do raio, excluir, erros de campo |
| `secondary` / `ink` | Aviso neutro de marca (`StatusBanner tone="brand"`) |

### Categorias
| Categoria | Cor | Suave |
|---|---|---|
| Turismo | `turismo` `#E9A34D` | `turismo-soft` |
| Gastronomia | `gastronomia` `#E5735A` | `gastronomia-soft` |
| Explorador | `explorador` `#3FA58A` | `explorador-soft` |

Imagens sem foto usam o gradiente da categoria com o ícone em branco (`MissionImage`).

---

## 4. Espaçamento

Grid de **4 pt**. Use só estes valores: **4 · 8 · 12 · 16 · 20 · 24 · 32 · 40**.

| Token | Valor | Onde |
|---|---|---|
| `gutter` (`px-gutter`) | 20 | Margem lateral de **toda** tela, header, sheet e lista |
| `card` (`p-card`) | 16 | Padding interno de cards |
| `section` (`mt-section`, `space-y-section`) | 32 | Entre seções de uma tela |
| `nav` (`pb-nav`) | 120 | Respiro no fim de telas roláveis (bottom nav flutuante) |

Ritmo vertical padrão de uma tela:

```
safe-area + 16      ← pt-safe
Header (título 28)
20                  ← pb-5 do ScreenHeader
Bloco principal / hero
24                  ← entre hero e filtros
Filtros (chips 40)
32                  ← mt-section
Título de seção (22)
12                  ← mb-3
Lista (cards com gap 12; linhas compactas com gap 8)
120                 ← pb-nav
```

Dentro de cards: 12 entre grupos e 4–8 entre linhas de um mesmo grupo.

---

## 5. Raios e elevação

| Token | Valor | Uso |
|---|---|---|
| `rounded-control` | 16 | Botões, inputs, icon buttons, thumbnails, banners |
| `rounded-card` | 24 | Cards, linhas de lista com fundo, blocos |
| `rounded-sheet` | 32 | Bottom sheets, hero blocks (topo/fundo), bottom nav |
| `rounded-full` | — | Chips, pills, avatares, botões `sm` |

| Sombra | Uso |
|---|---|
| `shadow-card` | Cards e icon buttons sobre o fundo |
| `shadow-float` | Elementos flutuantes: bottom nav, sheets, card do mapa, toasts |
| `shadow-primary` | Só no botão primário e no FAB |

Card com sombra **não** tem borda. Borda é para inputs, botões secundários e itens selecionáveis dentro de sheets.

---

## 6. Componentes

| Componente | Especificação |
|---|---|
| `Button` | Alturas `lg` 52 · `md` 44 · `sm` 36 (pill). Ícone 20/16/16. Variantes `primary`, `secondary`, `ghost`, `danger`, `dark`. Desativado fica sólido em `surface-muted` + `muted`, nunca transparente. |
| `IconButton` | 44×44, `rounded-control`, `surface` + `shadow-card`. `label` obrigatório. Badge numérico opcional. |
| `Chip` | Altura 40, pill. Ativo: fundo `ink` e texto branco. Inativo: `surface` com borda `line`. Ícone 16 na cor da categoria. |
| `Segmented` | Trilho `surface-muted`, altura 48 (40 + 4 + 4). Indicador branco animado (`layoutId`). |
| `Input` | Altura 52, `rounded-control`, borda `line`. Foco: borda `primary` + anel de 4 px `primary/15`. Erro: borda `danger` e mensagem `type-caption` `danger-ink` abaixo. |
| `ScreenHeader` | Título `type-title1` + subtítulo `type-callout`. `leading` (voltar) e `trailing` (avatar/ação) são opcionais. |
| `SectionHeader` | `type-title2` à esquerda, contagem `type-callout` `muted` à direita. |
| `Card` | `surface`, `rounded-card`, `shadow-card`, `p-card`. |
| `MissionCard` | Thumbnail 72 + categoria (overline) + pontos à direita, título (title3) e metadados (caption). Concluída fica com opacidade 70% e selo verde. |
| `StatusBanner` | `rounded-control`, `type-label`, ícone 16. Tons `success`, `danger`, `neutral`, `brand`. |
| `PointsPill` | Altura 28, `accent`, número tabular. "2x" em `ink`. |
| `Avatar` | Tamanhos **32 · 40 · 48 · 64 · 96**. Anel de progresso do nível (laranja; dourado do nível 7 em diante). Sem foto, mostra a inicial. |
| `BottomSheet` | `rounded-sheet` no topo, puxador 40×4, título `type-title2`, rodapé fixo para ações. Fecha ao arrastar, ao tocar fora ou com Esc. |
| `BottomNav` | Flutuante, `rounded-sheet`, blur. 4 abas + FAB central de check-in (56). Labels de 11 px/600, com uma palavra só. |
| `Skeleton` | `surface-muted` com brilho. Mesmo formato do conteúdo final. |

Ícones (lucide): **16** inline com texto · **20** padrão em botões e nav · **24** destaque. Traço padrão.

---

## 7. Padrões de UX

- **Check-in em 3 etapas numeradas:** 1 Local, 2 Foto (opcional), 3 Avaliação. Cada etapa vira um check verde quando completa. O botão "Confirmar" fica fixo acima da nav, com a frase do que falta.
- **Estados de distância:** verde "Você está no local (12 m)" e vermelho "Você está a 1,2 km. Libera a até 150 m". Nunca bloqueie sem dizer a distância.
- **Toques:** área mínima 44×44, `active:scale-[0.97]` em botões, vibração curta no kudos.
- **Movimento:** 150–250 ms. Sheets usam spring (damping 32). Listas entram com fade + 8–12 px. Respeite `prefers-reduced-motion`.
- **Feedback:**
  - toast para resultado de ação (sucesso ou erro de rede);
  - banner inline para estado persistente;
  - mensagem sob o campo para validação.
- **Vazio:** ícone em quadrado `secondary` 64, título `type-title3`, texto `type-callout`, e uma ação quando houver.
- **Escrita:** português direto, segunda pessoa ("Você está no local"), verbos nos botões ("Fazer check-in", "Traçar rota"), sem jargão técnico.

---

## 8. Checklist para novas telas

- [ ] Usa `ScreenHeader` (ou header equivalente com `pt-safe` e `px-gutter`).
- [ ] Margem lateral `px-gutter`, seções separadas por `section`, fim com `pb-nav`.
- [ ] Só tokens `type-*`, sem `text-sm`, `text-[Npx]` ou `font-bold` avulsos.
- [ ] Só raios `control`, `card`, `sheet` ou `full`.
- [ ] Cores por token, sem hex nos componentes (exceção: canvas e confete).
- [ ] Uma ação primária. Desativada, sempre explica o motivo.
- [ ] Estado de carregamento (skeleton), estado vazio e estado de erro desenhados.
- [ ] Alvos de toque de 44 px ou mais e `aria-label` em botões só com ícone.
