import { useCallback, useEffect, useRef, useState } from "react";

const TIMEOUT_MS = 20 * 60 * 1000; // 20 minutos de inatividade
const WARN_BEFORE_MS = 60 * 1000; // aviso 1 minuto antes do logout
const THROTTLE_MS = 500; // throttle dos eventos de atividade

const ACTIVITY_EVENTS = ["mousemove", "click", "keydown", "scroll", "touchstart"] as const;

type Options = {
  onLogout: () => void;
};

export function useInactivityTimeout({ onLogout }: Options) {
  const [showWarning, setShowWarning] = useState(false);
  // Ref espelha o state para uso dentro dos event handlers sem closure stale
  const showWarningRef = useRef(false);

  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const throttleRef = useRef(0);
  const onLogoutRef = useRef(onLogout);
  useEffect(() => {
    onLogoutRef.current = onLogout;
  });

  const clearTimers = useCallback(() => {
    if (logoutTimerRef.current !== null) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (warnTimerRef.current !== null) {
      clearTimeout(warnTimerRef.current);
      warnTimerRef.current = null;
    }
  }, []);

  const startTimers = useCallback(() => {
    clearTimers();

    warnTimerRef.current = setTimeout(() => {
      showWarningRef.current = true;
      setShowWarning(true);
    }, TIMEOUT_MS - WARN_BEFORE_MS);

    logoutTimerRef.current = setTimeout(() => {
      showWarningRef.current = false;
      setShowWarning(false);
      onLogoutRef.current();
    }, TIMEOUT_MS);
  }, [clearTimers]);

  // Exposto para o botão "Continuar sessão" do dialog
  const continueSession = useCallback(() => {
    showWarningRef.current = false;
    setShowWarning(false);
    startTimers();
  }, [startTimers]);

  useEffect(() => {
    // Guard SSR: não registra listeners no servidor
    if (typeof window === "undefined") return;

    const handleActivity = () => {
      // Quando o aviso está visível, ignora atividade:
      // o usuário deve clicar explicitamente em "Continuar sessão" ou "Sair agora"
      if (showWarningRef.current) return;

      const now = Date.now();
      if (now - throttleRef.current < THROTTLE_MS) return;
      throttleRef.current = now;
      startTimers();
    };

    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    // Inicia os timers assim que o componente montar
    startTimers();

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, handleActivity));
    };
    // startTimers e clearTimers são estáveis (useCallback com deps estáveis)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { showWarning, continueSession };
}
