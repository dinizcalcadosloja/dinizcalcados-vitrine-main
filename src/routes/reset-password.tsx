import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

const BLUE = "#2563eb";

function mapResetError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("same as the old password")) {
    return "Use uma senha diferente da senha atual.";
  }
  if (lower.includes("auth session missing") || lower.includes("jwt")) {
    return "Seu link expirou. Solicite um novo link de redefinição.";
  }
  if (lower.includes("expired") || lower.includes("invalid")) {
    return "Link inválido ou expirado. Solicite um novo link.";
  }
  return message;
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkingToken, setCheckingToken] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [busy, setBusy] = useState(false);

  const hashErrorMessage = useMemo(() => {
    if (typeof window === "undefined") return null;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const rawHashError = hashParams.get("error_description") || hashParams.get("error");
    return rawHashError ? decodeURIComponent(rawHashError.replace(/\+/g, " ")) : null;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function validateRecoverySession() {
      try {
        if (hashErrorMessage) {
          if (mounted) {
            setHasValidSession(false);
            toast.error("Seu link de recuperação expirou. Gere um novo no login.");
          }
          return;
        }

        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setSessionError && mounted) {
            setHasValidSession(false);
            toast.error("Não foi possível validar o link de recuperação.");
            return;
          }
        }

        const { data, error } = await supabase.auth.getSession();
        if (error && mounted) {
          setHasValidSession(false);
          toast.error(mapResetError(error.message));
          return;
        }

        if (mounted) {
          setHasValidSession(Boolean(data.session));
          if (!data.session) {
            toast.error("Link inválido ou expirado. Solicite um novo link.");
          }
        }
      } finally {
        if (mounted) {
          setCheckingToken(false);
        }
      }
    }

    validateRecoverySession();

    return () => {
      mounted = false;
    };
  }, [hashErrorMessage]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextPassword = password.trim();
    const repeatedPassword = confirmPassword.trim();

    if (!nextPassword || !repeatedPassword) {
      toast.error("Preencha os campos de senha para continuar.");
      return;
    }
    if (nextPassword.length < 8) {
      toast.error("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (nextPassword !== repeatedPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({
      password: nextPassword,
    });
    setBusy(false);

    if (error) {
      toast.error(mapResetError(error.message));
      return;
    }

    toast.success("Senha atualizada com sucesso. Faça login novamente.");
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 10%, rgba(37, 99, 235, 0.16), transparent 32%), #020617",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 18,
          border: "1px solid #1e293b",
          background: "#0b1120",
          padding: "30px 24px",
          boxShadow: "0 25px 90px rgba(2, 6, 23, 0.55)",
        }}
      >
        <p
          style={{ margin: 0, color: "#93c5fd", fontSize: 12, fontWeight: 700, letterSpacing: 0.7 }}
        >
          RECUPERAÇÃO DE ACESSO
        </p>
        <h1 style={{ margin: "8px 0 10px", color: "#f8fafc", fontSize: 26, lineHeight: 1.15 }}>
          Definir nova senha
        </h1>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
          Escolha uma senha forte para proteger o painel administrativo.
        </p>

        {checkingToken ? (
          <p style={{ marginTop: 22, color: "#cbd5e1", fontSize: 14 }}>Validando seu link...</p>
        ) : hasValidSession ? (
          <form onSubmit={handleSubmit} style={{ marginTop: 20, display: "grid", gap: 14 }}>
            <div>
              <label
                style={{
                  color: "#94a3b8",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                NOVA SENHA
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="mínimo 8 caracteres"
                minLength={8}
                required
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 10,
                  border: "1px solid #334155",
                  background: "#020617",
                  color: "#f8fafc",
                  padding: "0 14px",
                  outline: "none",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label
                style={{
                  color: "#94a3b8",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                CONFIRMAR SENHA
              </label>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                placeholder="repita a nova senha"
                minLength={8}
                required
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 10,
                  border: "1px solid #334155",
                  background: "#020617",
                  color: "#f8fafc",
                  padding: "0 14px",
                  outline: "none",
                  fontSize: 14,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              style={{
                marginTop: 4,
                height: 46,
                borderRadius: 10,
                border: "none",
                cursor: busy ? "not-allowed" : "pointer",
                color: "#eff6ff",
                fontWeight: 700,
                fontSize: 14,
                background: busy ? "#1e3a8a" : `linear-gradient(135deg, ${BLUE}, #1d4ed8)`,
              }}
            >
              {busy ? "Atualizando..." : "Salvar nova senha"}
            </button>
          </form>
        ) : (
          <div style={{ marginTop: 22, borderTop: "1px solid #1e293b", paddingTop: 16 }}>
            <p style={{ margin: 0, color: "#cbd5e1", fontSize: 14, lineHeight: 1.5 }}>
              Seu link de redefinição não é mais válido. Volte para o login e solicite um novo
              e-mail.
            </p>
            <Link
              to="/auth"
              style={{
                marginTop: 14,
                display: "inline-flex",
                color: "#93c5fd",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Voltar para o login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
