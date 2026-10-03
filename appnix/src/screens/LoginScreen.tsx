import { Compass, Eye, EyeOff, Lock, Mail, MailCheck, User } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Button, Segmented, cn } from '../components/ui';
import { useApp } from '../hooks/useApp';
import { friendlyError } from '../lib/errors';
import { LegalScreen, type LegalDoc } from './LegalScreen';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Field({ icon, error, children }: { icon: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div>
      <label
        className={cn(
          'flex h-13 items-center gap-3 rounded-control border bg-surface px-4 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15',
          error ? 'border-danger' : 'border-line',
        )}
      >
        <span className="text-muted">{icon}</span>
        {children}
      </label>
      {error && <p className="mt-1 pl-1 type-caption text-danger-ink">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function LoginScreen() {
  const { backend, toast } = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<'form' | 'google' | null>(null);
  const [legal, setLegal] = useState<LegalDoc | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === 'signup' && name.trim().length < 2) e.name = 'Informe seu nome.';
    if (!EMAIL_RE.test(email.trim())) e.email = 'Email inválido.';
    if (password.length < 6) e.password = 'Mínimo de 6 caracteres.';
    if (mode === 'signup' && !/(?=.*[A-Za-z])(?=.*\d)/.test(password)) e.password = 'Use letras e números.';
    if (mode === 'signup' && !accepted) e.terms = 'Aceite os termos para continuar.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading('form');
    try {
      if (mode === 'login') await backend.signIn(email, password);
      else {
        await backend.signUp(name, email, password);
        toast(backend.mode === 'firebase' ? 'Conta criada! Enviamos um link de verificação para seu email.' : 'Conta criada! Bem-vindo ao AppNix.', 'success');
      }
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setLoading(null);
    }
  };

  const google = async () => {
    setLoading('google');
    try {
      await backend.signInWithGoogle();
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setLoading(null);
    }
  };

  const forgot = async () => {
    if (!EMAIL_RE.test(email.trim())) return setErrors({ email: 'Digite seu email para recuperar a senha.' });
    try {
      await backend.resetPassword(email);
      toast('Enviamos um link de redefinição para seu email.', 'success');
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-bg no-scrollbar">
      <div className="relative px-gutter pt-safe pb-4">
        <div className="relative mt-6 flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-control bg-primary">
            <Compass className="size-6 text-white" />
          </div>
          <span className="type-logo">
            App<span className="text-primary">Nix</span>
          </span>
        </div>
        <h1 className="relative mt-8 type-display">
          {mode === 'login' ? 'Bem-vindo de volta, explorador.' : 'Sua cidade virou um jogo.'}
        </h1>
        <p className="relative mt-2 type-body text-muted">Visite lugares reais, faça check-in e acumule pontos.</p>
      </div>

      <div className="px-gutter pt-6 pb-8">
        <Segmented
          id="auth"
          value={mode}
          onChange={(m) => {
            setMode(m);
            setErrors({});
          }}
          className="mb-6"
          options={[
            { value: 'login', label: 'Entrar' },
            { value: 'signup', label: 'Cadastrar' },
          ]}
        />

        <form onSubmit={submit} className="space-y-3" noValidate>
          <AnimatePresence initial={false}>
            {mode === 'signup' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <Field icon={<User className="size-5" />} error={errors.name}>
                  <input className="h-full min-w-0 flex-1 bg-transparent type-body outline-none" placeholder="Seu nome" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>
          <Field icon={<Mail className="size-5" />} error={errors.email}>
            <input className="h-full min-w-0 flex-1 bg-transparent type-body outline-none" type="email" inputMode="email" placeholder="seu@email.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field icon={<Lock className="size-5" />} error={errors.password}>
            <input
              className="h-full min-w-0 flex-1 bg-transparent type-body outline-none"
              type={showPw ? 'text' : 'password'}
              placeholder="Senha"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShowPw((s) => !s)} className="text-muted" aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}>
              {showPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </Field>

          {mode === 'login' ? (
            <div className="flex justify-end">
              <button type="button" onClick={forgot} className="type-label text-primary-strong">
                Esqueci minha senha
              </button>
            </div>
          ) : (
            <div>
              <label className="flex items-start gap-3 pt-1 type-callout text-muted">
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--color-primary)]" />
                <span>
                  Li e aceito os{' '}
                  <button type="button" className="font-semibold text-ink underline" onClick={() => setLegal('terms')}>Termos de Uso</button> e a{' '}
                  <button type="button" className="font-semibold text-ink underline" onClick={() => setLegal('privacy')}>Política de Privacidade</button>.
                </span>
              </label>
              {errors.terms && <p className="mt-1 pl-8 type-caption text-danger-ink">{errors.terms}</p>}
            </div>
          )}

          <Button type="submit" className="mt-2 w-full" loading={loading === 'form'} disabled={!!loading}>
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 type-caption text-muted">
          <div className="h-px flex-1 bg-line-soft" /> ou <div className="h-px flex-1 bg-line-soft" />
        </div>

        <Button variant="secondary" className="w-full" onClick={google} loading={loading === 'google'} disabled={!!loading}>
          <GoogleIcon /> Continuar com Google
        </Button>

        {backend.mode === 'demo' && (
          <p className="mt-4 rounded-control bg-accent/25 px-4 py-3 type-caption text-ink">
            <strong>Modo demonstração:</strong> Firebase não configurado. Os dados ficam salvos apenas neste dispositivo.
          </p>
        )}

        <footer className="mt-8 text-center type-caption text-muted">
          Ao continuar, você concorda com nossos{' '}
          <button className="underline" onClick={() => setLegal('terms')}>Termos de Serviço</button>,{' '}
          <button className="underline" onClick={() => setLegal('privacy')}>Política de Privacidade</button> e{' '}
          <button className="underline" onClick={() => setLegal('cookies')}>Cookies</button>.
        </footer>
      </div>
      <LegalScreen doc={legal} onClose={() => setLegal(null)} />
    </div>
  );
}

/** Exibida após o cadastro por email até a verificação ser concluída. */
export function VerifyEmailScreen() {
  const { backend, authUser, setAuthUser, toast } = useApp();
  const [loading, setLoading] = useState<'check' | 'resend' | null>(null);

  const check = async () => {
    setLoading('check');
    try {
      const u = await backend.reloadUser();
      if (u?.emailVerified) setAuthUser(u);
      else toast('Ainda não identificamos a verificação. Confira sua caixa de entrada.', 'error');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setLoading(null);
    }
  };

  const resend = async () => {
    setLoading('resend');
    try {
      await backend.resendVerification();
      toast('Novo link enviado!', 'success');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center bg-bg px-8 text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-card bg-secondary">
        <MailCheck className="size-10 text-primary" />
      </div>
      <h1 className="type-title1">Verifique seu email</h1>
      <p className="mt-2 type-body text-muted">
        Enviamos um link de confirmação para <strong className="text-ink">{authUser?.email}</strong>. Abra-o para ativar sua conta.
      </p>
      <Button className="mt-8 w-full" onClick={check} loading={loading === 'check'}>
        Já verifiquei
      </Button>
      <Button variant="ghost" className="mt-2 w-full" onClick={resend} loading={loading === 'resend'}>
        Reenviar link
      </Button>
      <button className="mt-6 type-callout text-muted underline" onClick={() => backend.signOut()}>
        Usar outra conta
      </button>
    </div>
  );
}
