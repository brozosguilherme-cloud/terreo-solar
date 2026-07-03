# Nix — Landing Page B2B (Parceiros Oficiais)

Landing page comercial estática para atrair lojistas, restaurantes e estabelecimentos
a se tornarem Parceiros Oficiais no mapa do Nix.

**Stack:** React 18 + Vite + Tailwind CSS + Framer Motion + Lucide React.

Toda a interface está em um único arquivo de página: [`src/NixLandingPage.jsx`](src/NixLandingPage.jsx).

## Rodar localmente

```bash
cd landing
npm install
npm run dev        # http://localhost:5173
```

## Build estático

```bash
npm run build      # gera landing/dist/ pronto para hospedar
npm run preview    # testa o build localmente
```

O `vite.config.js` usa `base: './'`, então a pasta `dist/` pode ser hospedada em
qualquer caminho (GitHub Pages, Netlify, Vercel, S3, etc.) sem configuração extra.
