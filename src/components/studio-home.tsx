"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  LoaderCircle,
  RefreshCw,
  Wrench,
  Zap,
} from "lucide-react";
import {
  demoEditorialHubSnapshot,
  loadEditorialHubSnapshot,
  requestEditorialHubOperation,
  type EditorialHubAction,
  type EditorialHubQueueItem,
  type EditorialHubSnapshot,
} from "@/lib/editorial-hub-client";

function relativeSync(value: string | null) {
  if (!value) return "Sin sincronización registrada";
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  if (elapsed < 60_000) return "Sincronizado ahora";
  if (elapsed < 3_600_000) return `Sincronizado hace ${Math.max(1, Math.round(elapsed / 60_000))} min`;
  if (elapsed < 86_400_000) return `Sincronizado hace ${Math.round(elapsed / 3_600_000)} h`;
  return `Sincronizado hace ${Math.round(elapsed / 86_400_000)} d`;
}

function statusLabel(stage: EditorialHubQueueItem["stage"]) {
  if (stage === "review") return "Revisar";
  if (stage === "ready") return "Lista";
  if (stage === "published") return "Publicada";
  if (stage === "detected") return "Pendiente";
  return "Procesando";
}

function statusClass(stage: EditorialHubQueueItem["stage"]) {
  if (stage === "review") return "review";
  if (stage === "ready" || stage === "published") return "ready";
  return "processing";
}

function statusIcon(stage: EditorialHubQueueItem["stage"]) {
  if (stage === "review") return <CircleAlert size={16} />;
  if (stage === "ready" || stage === "published") return <CheckCircle2 size={16} />;
  return <Clock3 size={16} />;
}

export function StudioHome() {
  const [snapshot, setSnapshot] = useState<EditorialHubSnapshot>(() => demoEditorialHubSnapshot());
  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState<EditorialHubAction | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const today = useMemo(() => new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date()), []);

  const refresh = useCallback(async () => {
    const next = await loadEditorialHubSnapshot();
    setSnapshot(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  async function runOperation(action: EditorialHubAction) {
    if (runningAction) return;
    setRunningAction(action);
    setNotice(null);

    if (snapshot.mode === "demo") {
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      setSnapshot((current) => ({
        ...current,
        counts: {
          ...current.counts,
          automatic: action === "run_cycle" ? Math.max(0, current.counts.automatic - 1) : current.counts.automatic,
        },
        system: {
          ...current.system,
          lastSyncedAt: new Date().toISOString(),
          failedJobs: action === "repair_queue" ? 0 : current.system.failedJobs,
          staleJobs: action === "repair_queue" ? 0 : current.system.staleJobs,
          issueCount: action === "repair_queue" ? 0 : current.system.issueCount,
        },
      }));
      setNotice(action === "repair_queue"
        ? "Demo: la cola quedó reparada y lista para continuar."
        : "Demo: Instagram se sincronizó y avanzó una publicación.");
      setRunningAction(null);
      return;
    }

    const result = await requestEditorialHubOperation(action);
    if (!result.ok) {
      setNotice(result.reason === "not_authenticated"
        ? "Inicia sesión para ejecutar operaciones."
        : "No se pudo completar la operación. Revisa la configuración de Supabase.");
      setRunningAction(null);
      return;
    }

    const repair = result.data.repair;
    const processed = result.data.process?.processed === true;
    const created = result.data.sync?.created ?? 0;
    const repaired = (repair?.recovered_stale ?? 0) + (repair?.retried_failed ?? 0);
    const summary = [
      created ? `${created} post${created === 1 ? " nuevo" : "s nuevos"}` : null,
      processed ? "1 publicación procesada" : null,
      repaired ? `${repaired} proceso${repaired === 1 ? " reparado" : "s reparados"}` : null,
    ].filter(Boolean).join(" · ");
    setNotice(summary || "El sistema está al día; no había trabajo pendiente.");
    await refresh();
    setRunningAction(null);
  }

  const priority = snapshot.priority;
  const reviewHref = priority?.stage === "review" || priority?.stage === "ready"
    ? priority.href
    : "/instagram?estado=review";
  const issueCount = snapshot.system.issueCount;
  const systemHealthy = issueCount === 0 && snapshot.system.accountStatus === "connected";

  return (
    <div className="clean-dashboard live-hub">
      <header className="clean-dashboard-head live-hub-head">
        <div>
          <span className="clean-dashboard-date">{today}</span>
          <h1>Tu mesa editorial.</h1>
          <p>Decide lo humano. Deja que el sistema avance lo automático.</p>
        </div>
        <span className={`live-hub-mode ${snapshot.mode}`}>
          <i /> {snapshot.mode === "live" ? "Datos en vivo" : "Vista demo"}
        </span>
      </header>

      <section className="clean-metrics actionable-metrics" aria-label="Acciones editoriales prioritarias">
        <article className="actionable-metric human">
          <strong>{snapshot.counts.review}</strong>
          <div>
            <span>Necesitan revisión</span>
            <small>El cuello de botella humano</small>
            <Link href={reviewHref}>Revisar siguiente <ArrowRight size={13} /></Link>
          </div>
        </article>

        <article className="actionable-metric automatic">
          <strong>{snapshot.counts.automatic}</strong>
          <div>
            <span>Pendientes automáticos</span>
            <small>Posts que el sistema puede avanzar</small>
            <button type="button" onClick={() => void runOperation("run_cycle")} disabled={Boolean(runningAction)}>
              {runningAction === "run_cycle" ? <LoaderCircle size={13} className="spin" /> : <Zap size={13} />}
              {runningAction === "run_cycle" ? "Avanzando" : "Avanzar cola"}
            </button>
          </div>
        </article>

        <article className="actionable-metric outcome">
          <strong>{snapshot.counts.publishedToday}</strong>
          <div>
            <span>Publicadas hoy</span>
            <small>Resultado editorial terminado</small>
            <Link href="/">Ver sitio público <ArrowRight size={13} /></Link>
          </div>
        </article>
      </section>

      <section className={`live-operations ${systemHealthy ? "healthy" : "attention"}`} aria-label="Control del sistema">
        <div className="live-operations-status">
          <span><Activity size={15} /> OPERACIÓN EN VIVO</span>
          <h2>{systemHealthy ? "El flujo está al día." : `${issueCount} proceso${issueCount === 1 ? " necesita" : "s necesitan"} ayuda.`}</h2>
          <p>
            {relativeSync(snapshot.system.lastSyncedAt)}
            {snapshot.system.failedJobs ? ` · ${snapshot.system.failedJobs} intento(s) fallido(s)` : ""}
            {snapshot.system.staleJobs ? ` · ${snapshot.system.staleJobs} bloqueo(s) detenido(s)` : ""}
          </p>
        </div>
        <div className="live-operations-actions">
          {!systemHealthy ? (
            <button type="button" className="repair-action" onClick={() => void runOperation("repair_queue")} disabled={Boolean(runningAction)}>
              {runningAction === "repair_queue" ? <LoaderCircle size={15} className="spin" /> : <Wrench size={15} />}
              {runningAction === "repair_queue" ? "Reparando" : "Reparar automáticamente"}
            </button>
          ) : null}
          <button type="button" className="cycle-action" onClick={() => void runOperation("run_cycle")} disabled={Boolean(runningAction)}>
            {runningAction === "run_cycle" ? <LoaderCircle size={15} className="spin" /> : <RefreshCw size={15} />}
            {runningAction === "run_cycle" ? "Ejecutando ciclo" : "Actualizar y avanzar"}
          </button>
        </div>
      </section>

      {notice ? <div className="live-operation-notice" role="status">{notice}</div> : null}

      <section className="clean-priority" aria-labelledby="priority-heading">
        <div className="clean-section-heading">
          <div>
            <span>AHORA</span>
            <h2 id="priority-heading">La siguiente acción</h2>
          </div>
          <Link href="/instagram">Ver todos los posts <ArrowRight size={14} /></Link>
        </div>

        {priority ? (
          <Link
            href={priority.href}
            className="clean-priority-card"
            data-track-event="story_opened"
            data-track-id={`hub-priority-${priority.id}`}
            data-track-source="mi_mesa"
          >
            <div>
              <span className="clean-category">{statusLabel(priority.stage).toUpperCase()} · INSTAGRAM</span>
              <h3>{priority.title}</h3>
              <p>{priority.detail}{priority.presenter ? ` · ${priority.presenter}` : ""}</p>
            </div>
            <span className="clean-primary-action">
              {statusIcon(priority.stage)} {priority.stage === "review" ? "Revisar ahora" : priority.stage === "ready" ? "Abrir nota" : "Ver proceso"} <ArrowRight size={15} />
            </span>
          </Link>
        ) : (
          <div className="clean-empty-state">
            <CheckCircle2 size={18} />
            <div><strong>No hay decisiones pendientes.</strong><span>Ejecuta un ciclo para comprobar si Instagram publicó algo nuevo.</span></div>
            <button type="button" onClick={() => void runOperation("run_cycle")}>Actualizar ahora</button>
          </div>
        )}
      </section>

      <section className="clean-queue" aria-labelledby="queue-heading">
        <div className="clean-section-heading">
          <div>
            <span>EN CURSO</span>
            <h2 id="queue-heading">Lo que está avanzando</h2>
          </div>
        </div>

        <div className="clean-queue-list">
          {snapshot.queue.map((item) => (
            <Link
              href={item.href}
              key={item.id}
              className="clean-queue-row"
              data-track-event="story_opened"
              data-track-id={`instagram-${item.id}`}
              data-track-source="instagram_queue"
            >
              <span className={`clean-state ${statusClass(item.stage)}`} aria-hidden="true">
                {statusIcon(item.stage)}
              </span>
              <div>
                <span>{item.publishedAgo.toUpperCase()}</span>
                <strong>{item.title}</strong>
                <small>{item.detail}{item.presenter ? ` · ${item.presenter}` : ""}</small>
              </div>
              <span className={`clean-status-label ${statusClass(item.stage)}`}>{statusLabel(item.stage)}</span>
              <ArrowRight size={16} />
            </Link>
          ))}
          {!loading && !snapshot.queue.length ? <p className="clean-queue-empty">No hay publicaciones activas.</p> : null}
        </div>
      </section>
    </div>
  );
}
