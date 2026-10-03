const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Email inválido.',
  'auth/invalid-credential': 'Email ou senha incorretos.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/user-not-found': 'Conta não encontrada.',
  'auth/email-already-in-use': 'Este email já está cadastrado.',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
  'auth/network-request-failed': 'Sem conexão com a internet.',
  'auth/popup-closed-by-user': 'Login cancelado.',
  'auth/cancelled-popup-request': 'Login cancelado.',
  'auth/requires-recent-login': 'Por segurança, entre novamente antes de continuar.',
  'permission-denied': 'Você não tem permissão para esta ação.',
  unavailable: 'Serviço indisponível. Verifique sua conexão.',
};

export function friendlyError(e: unknown): string {
  const code = (e as { code?: string })?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  const msg = (e as Error)?.message;
  return msg && !msg.startsWith('Firebase') ? msg : 'Algo deu errado. Tente novamente.';
}
