import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const GOLD = "#c19432";
const BLUE = "#2563eb";

function getFriendlyAuthMessage(rawMessage: string) {
  const message = rawMessage.toLowerCase();
  if (message.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (message.includes("email not confirmed"))
    return "Confirme seu e-mail antes de acessar o painel.";
  if (message.includes("too many requests"))
    return "Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.";
  if (message.includes("user not found")) return "Nenhum usuário encontrado com esse e-mail.";
  return rawMessage;
}

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [showPass, setShowPass] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/admin" });
  }, [user, loading, navigate]);

  useEffect(() => {
    supabase
      .from("stores")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => {
        const exists = (count ?? 0) > 0;
        setAdminExists(exists);
        if (exists) setTab("signin");
      });
  }, []);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setBusy(false);
    if (error) toast.error(getFriendlyAuthMessage(error.message));
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: { emailRedirectTo: window.location.origin + "/admin" },
    });
    setBusy(false);
    if (error) toast.error(getFriendlyAuthMessage(error.message));
    else toast.success("Conta criada! Verifique seu e-mail para confirmar.");
  }

  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = resetEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Digite o e-mail do administrador.");
      return;
    }
    setResetBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetBusy(false);

    if (error) {
      toast.error(getFriendlyAuthMessage(error.message));
      return;
    }

    toast.success("Enviamos um link de redefinição para o e-mail informado.");
    setIsForgotOpen(false);
  }

  const inputStyle: React.CSSProperties = {
    background: "#111",
    border: "1px solid #333",
    color: "#fff",
    borderRadius: 8,
    padding: "12px 14px",
    width: "100%",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo / Monograma */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 80,
              height: 80,
              border: `2px solid ${GOLD}`,
              borderRadius: 12,
              marginBottom: 16,
              boxShadow: `0 0 24px ${GOLD}33`,
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: GOLD,
                letterSpacing: "-2px",
              }}
            >
              MM
            </span>
          </div>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: 0 }}>
            Mariano Mens Wear
          </h1>
          <p style={{ color: "#666", fontSize: 13, marginTop: 6 }}>Painel administrativo</p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#111",
            border: "1px solid #222",
            borderRadius: 16,
            padding: "32px 28px",
          }}
        >
          {/* Tabs — oculta "Criar conta" se já existe um admin */}
          {!adminExists && (
            <div
              style={{
                display: "flex",
                background: "#0a0a0a",
                borderRadius: 10,
                padding: 4,
                marginBottom: 28,
              }}
            >
              {(["signin", "signup"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    transition: "all 0.2s",
                    background: tab === t ? GOLD : "transparent",
                    color: tab === t ? "#000" : "#666",
                  }}
                >
                  {t === "signin" ? "Entrar" : "Criar conta"}
                </button>
              ))}
            </div>
          )}

          {tab === "signin" ? (
            <form
              onSubmit={handleSignIn}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <label
                  style={{
                    color: "#aaa",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  EMAIL
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="seu@email.com"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#333")}
                />
              </div>
              <div>
                <label
                  style={{
                    color: "#aaa",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  SENHA
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    name="password"
                    type={showPass ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#333")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#666",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={busy}
                style={{
                  marginTop: 8,
                  padding: "13px 0",
                  borderRadius: 10,
                  border: "none",
                  cursor: busy ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  background: busy ? "#555" : `linear-gradient(135deg, ${GOLD}, #a07820)`,
                  color: busy ? "#999" : "#000",
                  transition: "opacity 0.2s",
                  letterSpacing: 0.5,
                }}
              >
                {busy ? "Entrando..." : "Entrar"}
              </button>
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                style={{
                  marginTop: 4,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #1d4ed8",
                  background: "#0f172a",
                  color: "#93c5fd",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Esqueci minha senha
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleSignUp}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <label
                  style={{
                    color: "#aaa",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  EMAIL
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="seu@email.com"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#333")}
                />
              </div>
              <div>
                <label
                  style={{
                    color: "#aaa",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  SENHA
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    name="password"
                    type={showPass ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="mínimo 6 caracteres"
                    style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#333")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#666",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={busy}
                style={{
                  marginTop: 8,
                  padding: "13px 0",
                  borderRadius: 10,
                  border: "none",
                  cursor: busy ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  background: busy ? "#555" : `linear-gradient(135deg, ${GOLD}, #a07820)`,
                  color: busy ? "#999" : "#000",
                  transition: "opacity 0.2s",
                  letterSpacing: 0.5,
                }}
              >
                {busy ? "Criando conta..." : "Criar conta"}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: GOLD }}>
          Mariano Mens Wear © {new Date().getFullYear()}
        </p>
      </div>

      {isForgotOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 6, 23, 0.75)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 16,
              border: "1px solid #1e293b",
              background: "#0b1120",
              padding: 24,
              boxShadow: "0 24px 80px rgba(15, 23, 42, 0.45)",
            }}
          >
            <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 20, fontWeight: 700 }}>
              Redefinir senha
            </h2>
            <p style={{ margin: "8px 0 20px", color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>
              Informe o e-mail do administrador para receber o link de redefinição.
            </p>

            <form onSubmit={handleForgotPassword} style={{ display: "grid", gap: 14 }}>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="admin@seudominio.com"
                required
                style={{
                  ...inputStyle,
                  background: "#020617",
                  border: "1px solid #334155",
                  color: "#e2e8f0",
                }}
              />

              <button
                type="submit"
                disabled={resetBusy}
                style={{
                  height: 44,
                  borderRadius: 10,
                  border: "none",
                  cursor: resetBusy ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#eff6ff",
                  background: resetBusy ? "#1e3a8a" : `linear-gradient(135deg, ${BLUE}, #1d4ed8)`,
                }}
              >
                {resetBusy ? "Enviando..." : "Enviar link de redefinição"}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!resetBusy) {
                    setIsForgotOpen(false);
                  }
                }}
                style={{
                  height: 40,
                  borderRadius: 10,
                  border: "1px solid #334155",
                  background: "transparent",
                  color: "#cbd5e1",
                  fontWeight: 600,
                  cursor: resetBusy ? "not-allowed" : "pointer",
                }}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
