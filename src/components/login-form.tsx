"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function login(formData: FormData) {
    setLoading(true); setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase aún no está conectado. Usa el acceso DEMO para probar el producto.");
      setLoading(false); return;
    }
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMessage(error.message); setLoading(false); return; }
    router.push("/mi-dia"); router.refresh();
  }

  function enterDemo() {
    localStorage.setItem("facto_demo_session", "true");
    router.push("/mi-dia");
  }

  return (
    <div className="login-card">
      <div className="login-heading"><span className="demo-pill">ACCESO INTERNO</span><h1>Tu redacción, sin fricción.</h1><p>Organiza evidencia, verifica afirmaciones y lleva cada historia hasta publicación.</p></div>
      <form action={login} className="form-stack">
        <label>Correo<Input name="email" type="email" placeholder="nombre@factomedia.mx" required /></label>
        <label>Contraseña<Input name="password" type="password" placeholder="••••••••" required /></label>
        {message && <p className="form-message" role="alert">{message}</p>}
        <Button type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={18} /> : <>Entrar <ArrowRight size={18} /></>}</Button>
      </form>
      <div className="divider"><span>o prueba la experiencia</span></div>
      <Button variant="secondary" onClick={enterDemo}>Entrar en modo DEMO</Button>
      <p className="fine-print">El modo DEMO guarda borradores únicamente en este navegador.</p>
    </div>
  );
}
