import { Cookie, FileText, Shield, type LucideIcon } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/ui';

export type LegalDoc = 'terms' | 'privacy' | 'cookies';

const UPDATED = '03/10/2026';
const CONTACT = 'privacidade@appnix.com.br';

interface Section {
  h: string;
  p: string[];
}

export const LEGAL_DOCS: Record<LegalDoc, { title: string; icon: LucideIcon; sections: Section[] }> = {
  terms: {
    title: 'Termos de Uso',
    icon: FileText,
    sections: [
      { h: '1. Aceitação', p: ['Ao criar uma conta ou utilizar o AppNix você concorda com estes Termos e com a Política de Privacidade. Se não concordar, não utilize o aplicativo.'] },
      { h: '2. O serviço', p: ['O AppNix é uma plataforma de turismo e exploração urbana gamificada. Você ganha pontos ao realizar check-ins geolocalizados em locais cadastrados, pode publicar fotos e avaliações no feed e interagir com outros exploradores.'] },
      { h: '3. Conta', p: ['Você deve ter pelo menos 13 anos (menores de 18 com consentimento dos responsáveis), fornecer informações verdadeiras e manter sua senha em sigilo. Você é responsável pela atividade realizada em sua conta.'] },
      { h: '4. Check-ins e pontos', p: ['Check-ins só são válidos quando realizados presencialmente, dentro do raio do local. É proibido falsificar localização (GPS falso, emuladores), automatizar ações ou explorar falhas. Pontos não possuem valor monetário e podem ser ajustados ou removidos em caso de fraude.'] },
      { h: '5. Conteúdo do usuário', p: ['Você mantém os direitos sobre fotos e textos que publica e nos concede licença não exclusiva e gratuita para exibi-los dentro do aplicativo. Não publique conteúdo ilegal, ofensivo, discriminatório, com nudez ou que viole direitos de terceiros. Podemos remover conteúdo e suspender contas que violem estas regras.'] },
      { h: '6. Segurança no mundo real', p: ['Respeite leis de trânsito, propriedades privadas, horários de funcionamento e normas locais. Nunca use o aplicativo enquanto dirige. O AppNix não se responsabiliza por acidentes ocorridos durante as visitas.'] },
      { h: '7. Encerramento', p: ['Você pode excluir sua conta a qualquer momento em Perfil → Configurações → Excluir conta. Podemos encerrar contas que violem estes Termos.'] },
      { h: '8. Alterações e foro', p: ['Estes Termos podem ser atualizados; avisaremos mudanças relevantes no app. Aplica-se a legislação brasileira, incluindo o Código de Defesa do Consumidor e o Marco Civil da Internet.'] },
    ],
  },
  privacy: {
    title: 'Política de Privacidade',
    icon: Shield,
    sections: [
      { h: '1. Controlador', p: [`O AppNix é o controlador dos seus dados pessoais nos termos da Lei nº 13.709/2018 (LGPD). Contato do Encarregado (DPO): ${CONTACT}.`] },
      { h: '2. Dados que coletamos', p: ['• Cadastro: nome, email, foto de perfil (ou da conta Google) e senha (armazenada de forma criptografada pelo Firebase Authentication).', '• Localização: coordenadas GPS no momento do check-in e, com o app aberto, para calcular distâncias. Não rastreamos sua localização em segundo plano.', '• Conteúdo: fotos, avaliações, comentários e curtidas que você publica.', '• Técnicos: token de notificação push, modelo do dispositivo e registros de erro.'] },
      { h: '3. Finalidades e bases legais', p: ['• Prestar o serviço, validar check-ins e calcular pontos — execução de contrato (Art. 7º, V).', '• Exibir seu perfil, ranking e publicações para outros usuários — execução de contrato.', '• Enviar notificações push — consentimento (Art. 7º, I), revogável nas configurações do Android.', '• Prevenir fraudes e garantir segurança — legítimo interesse (Art. 7º, IX).'] },
      { h: '4. Compartilhamento', p: ['Utilizamos o Google Firebase (autenticação, banco de dados e armazenamento) e serviços de mapas (OpenStreetMap/Nominatim e Google Maps Platform) como operadores. Os dados podem ser armazenados em servidores fora do Brasil, com salvaguardas adequadas (Art. 33). Não vendemos seus dados.'] },
      { h: '5. O que é público', p: ['Nome, foto de perfil, nível, pontos, posição no ranking e publicações do feed ficam visíveis para outros usuários autenticados. As coordenadas exatas dos seus check-ins não são exibidas publicamente.'] },
      { h: '6. Seus direitos (Art. 18)', p: ['Você pode confirmar a existência de tratamento, acessar, corrigir, solicitar portabilidade, revogar consentimentos e solicitar a eliminação dos seus dados. A exclusão definitiva da conta está disponível em Perfil → Configurações → Excluir conta e remove perfil, check-ins, fotos, publicações, comentários, amizades e notificações.', `Para outros pedidos, escreva para ${CONTACT}. Você também pode peticionar à ANPD.`] },
      { h: '7. Retenção', p: ['Mantemos os dados enquanto sua conta estiver ativa. Após a exclusão, os dados são apagados imediatamente dos sistemas ativos; cópias de segurança são sobrescritas em até 30 dias, salvo obrigação legal de guarda (ex.: registros de acesso por 6 meses, Marco Civil da Internet).'] },
      { h: '8. Segurança', p: ['Usamos criptografia em trânsito (HTTPS/TLS), regras de acesso no banco de dados e autenticação gerenciada pelo Firebase. Em caso de incidente relevante, comunicaremos os titulares e a ANPD.'] },
    ],
  },
  cookies: {
    title: 'Política de Cookies',
    icon: Cookie,
    sections: [
      { h: '1. O que usamos', p: ['No aplicativo Android não usamos cookies de publicidade. Usamos armazenamento local do dispositivo (IndexedDB e Preferences) estritamente necessário para manter sua sessão, guardar preferências e permitir uso offline do conteúdo já carregado.'] },
      { h: '2. Versão web', p: ['Na versão web, utilizamos armazenamento local e cookies essenciais do Firebase Authentication para manter você conectado. Não utilizamos cookies de rastreamento de terceiros nem de publicidade.'] },
      { h: '3. Mapas', p: ['Os blocos de mapa são carregados do OpenStreetMap (ou Google Maps, quando configurado). Esses provedores podem registrar seu endereço IP conforme suas próprias políticas.'] },
      { h: '4. Como gerenciar', p: ['Você pode limpar os dados do app em Configurações do Android → Apps → AppNix → Armazenamento, ou limpar os dados do site no seu navegador. Isso encerrará sua sessão.'] },
    ],
  },
};

export function LegalContent({ doc }: { doc: LegalDoc }) {
  const d = LEGAL_DOCS[doc];
  return (
    <article className="px-6 pb-8 text-[15px] leading-relaxed text-ink/90">
      <p className="mb-5 text-xs text-muted">Última atualização: {UPDATED}</p>
      {d.sections.map((s) => (
        <section key={s.h} className="mb-5">
          <h3 className="mb-1.5 text-base font-semibold text-ink">{s.h}</h3>
          {s.p.map((p, i) => (
            <p key={i} className="mb-1.5 text-muted">
              {p}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}

/** Tela/modal de documentos legais exibida como bottom sheet. */
export function LegalScreen({ doc, onClose }: { doc: LegalDoc | null; onClose: () => void }) {
  const d = doc ? LEGAL_DOCS[doc] : null;
  const Icon = d?.icon ?? FileText;
  return (
    <BottomSheet
      open={!!doc}
      onClose={onClose}
      maxHeight="92%"
      title={
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary">
            <Icon className="size-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">{d?.title}</h2>
        </div>
      }
      footer={
        <Button className="w-full" variant="dark" onClick={onClose}>
          Entendi
        </Button>
      }
    >
      {doc && <LegalContent doc={doc} />}
    </BottomSheet>
  );
}
