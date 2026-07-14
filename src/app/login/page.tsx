import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <Link href="/" className="public-logo public-logo-light">EL FACTO<span>NOTICIAS</span></Link>
        <div>
          <span className="eyebrow eyebrow-light">REDACCIÓN</span>
          <h2>La historia completa vive en un solo lugar.</h2>
          <p>Fuentes, versiones, decisiones y resultados editoriales con trazabilidad desde el primer dato.</p>
        </div>
        <p className="login-quote">“Claridad para trabajar mejor. Control para publicar con confianza.”</p>
      </section>
      <section className="login-form-panel"><LoginForm /></section>
    </main>
  );
}
