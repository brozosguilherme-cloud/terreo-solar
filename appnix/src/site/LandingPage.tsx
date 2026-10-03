import { Camera, Compass, MapPin, Shield, Trophy, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DeviceFrame } from '../components/DeviceFrame';

const FEATURES = [
  { icon: MapPin, title: 'Missões no mundo real', text: 'Pontos turísticos, restaurantes e lugares escondidos viram missões com pontos.' },
  { icon: Camera, title: 'Check-in com foto', text: 'Validado por GPS: só vale se você estiver lá. Registre o momento e avalie.' },
  { icon: Trophy, title: '10 níveis de explorador', text: 'Do “Passaporte em Branco” à “Lenda do Mapa”, com trilhas que dão bônus.' },
  { icon: Users, title: 'Comunidade', text: 'Feed com kudos e comentários, ranking semanal e lista de amigos.' },
];

const MOBILE_QUERY = '(max-width: 767px)';

/** Site (apenas build web). No celular abre o app em tela cheia como PWA. */
export function LandingPage() {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const on = () => setMobile(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  if (mobile) return <DeviceFrame isEmbedded={false} />;

  return (
    <div className="min-h-dvh bg-secondary">
      <div className="mx-auto flex min-h-dvh max-w-6xl items-center gap-16 px-10 py-12">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="flex size-11 items-center justify-center rounded-control bg-primary">
              <Compass className="size-6 text-white" />
            </div>
            <span className="type-title2">
              App<span className="text-primary">Nix</span>
            </span>
          </div>
          <h1 className="mt-10 font-display text-6xl leading-[1.05] font-bold tracking-[-0.03em]">
            Sua cidade é o <span className="text-primary">mapa do tesouro</span>.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-7 text-muted">
            Turismo, gastronomia e exploração urbana gamificada. Visite lugares reais, faça check-ins fotográficos e suba no ranking.
          </p>
          <div className="mt-10 grid max-w-xl grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-card bg-surface p-5 shadow-card">
                <f.icon className="size-6 text-primary" />
                <h3 className="mt-3 type-title3">{f.title}</h3>
                <p className="mt-1 type-callout text-muted">{f.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 flex items-center gap-2 type-callout text-muted">
            <Shield className="size-4" /> Em conformidade com a LGPD · Disponível para Android
          </p>
        </div>
        <DeviceFrame isEmbedded />
      </div>
    </div>
  );
}
