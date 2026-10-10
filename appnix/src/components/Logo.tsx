import { cn } from './ui';

/**
 * Logo Nix — símbolo (pin com setas de "subir de nível") + marca "nix".
 * Fonte: canvas "Nix — Landing page". Cores da marca ficam aqui (asset de marca).
 */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 120 120" className={cn('block shrink-0', className)}>
      <rect width="120" height="120" rx="28" fill="#E9A34D" />
      <path d="M60 16 C 39 16 25 31 25 51 C 25 76 60 104 60 104 C 60 104 95 76 95 51 C 95 31 81 16 60 16 Z" fill="#18181B" />
      <path d="M46 47 L60 35 L74 47" fill="none" stroke="#FFD166" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M46 63 L60 51 L74 63" fill="none" stroke="#E9A34D" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Símbolo + marca. `tone="dark"` para fundos escuros (marca branca, subtítulo laranja).
 * Tamanhos do canvas: mark 40 / "nix" 30 / subtítulo 12 (cabeçalho); 32 / 26 / 11 (rodapé).
 */
export function Logo({ size = 40, tone = 'light', tagline = true, className }: { size?: number; tone?: 'light' | 'dark'; tagline?: boolean; className?: string }) {
  const word = Math.round(size * 0.75);
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)} role="img" aria-label="Nix experiências">
      <LogoMark size={size} />
      <span className="flex flex-col gap-[3px]">
        <span className="font-display font-extrabold" style={{ fontSize: word, letterSpacing: '-0.05em', lineHeight: 0.8, color: tone === 'dark' ? '#FFFFFF' : '#222222' }}>
          nix
        </span>
        {tagline && (
          <span className="font-display font-medium" style={{ fontSize: Math.max(11, Math.round(size * 0.3)), lineHeight: 1, color: tone === 'dark' ? '#E9A34D' : '#7A4710' }}>
            experiências
          </span>
        )}
      </span>
    </span>
  );
}
