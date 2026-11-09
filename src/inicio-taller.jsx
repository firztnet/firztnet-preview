// Pantalla principal de Reparaciones: saludo, dinero del mes, por dónde va cada equipo,
// cifras clave y lo que pide atención hoy. Con cuatro temas que se recuerdan en este navegador.
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Flame, Users, CalendarCheck, Package, Clock, LayoutGrid } from "lucide-react";
import "./inicio-taller.css";

export const TEMAS_INICIO = [
  { key: "noche", nombre: "Noche", muestra: "linear-gradient(135deg,#070B16 50%,#F59E0B 50%)" },
  { key: "aurora", nombre: "Aurora", muestra: "linear-gradient(135deg,#7C3AED 50%,#2DD4BF 50%)" },
  { key: "grafito", nombre: "Grafito", muestra: "linear-gradient(135deg,#18181B 50%,#F97316 50%)" },
  { key: "dia", nombre: "Día", muestra: "linear-gradient(135deg,#EEF2F8 50%,#1D4ED8 50%)" },
];

export function temaGuardado() {
  try { const t = localStorage.getItem("fz-tema-inicio"); if (TEMAS_INICIO.some((x) => x.key === t)) return t; } catch { /* sin almacenamiento */ }
  return "noche";
}

export function FondoInicio() {
  return <div className="fz-fondo" aria-hidden="true"><i /><i /><i /></div>;
}

const COLOR_ETAPA = {
  recibido: "var(--vio)", contratado: "var(--vio)", diagnostico: "var(--warn)", reparacion: "var(--info)", en_proceso: "var(--info)",
  listo: "var(--ok)", entregado: "var(--tx2)", completado: "var(--ok)",
};
const FINALES = ["entregado", "completado", "no_reparable"];
const euros = (n) => `${Number(n || 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const iniciales = (nombre) => (nombre || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const equipoDe = (r) => [r.equipo, r.marca, r.modelo].filter(Boolean).join(" ") || "Equipo";
const diasDesde = (fecha) => (fecha ? Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000)) : null);

function Curva({ puntos }) {
  const vals = puntos.length ? puntos : [0, 0];
  const max = Math.max(...vals, 1);
  const paso = 400 / Math.max(vals.length - 1, 1);
  const xy = vals.map((v, i) => [i * paso, 78 - (v / max) * 64]);
  const linea = xy.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
  const [ux, uy] = xy[xy.length - 1];
  return (
    <svg viewBox="0 0 400 84" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="fzCurva" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--ac)" stopOpacity=".45" /><stop offset="1" stopColor="var(--ac)" stopOpacity="0" /></linearGradient></defs>
      <path d={`${linea} L400,84 L0,84Z`} fill="url(#fzCurva)" />
      <path d={linea} fill="none" stroke="var(--ac)" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={ux} cy={uy} r="4" fill="var(--ac)" />
    </svg>
  );
}

export default function InicioTaller({
  nombre, tema, onTema, reparaciones, etapas, vistaTrabajo, selectorTrabajo,
  reporteMensual, reporteDiario, tendencia, retrasadasLista, tiempoMedioDias, numClientes, resumenMant, stockBajo,
  onNueva, onBuscar, onIrVista, onAbrir, onEtapa, cargando,
}) {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setAhora(new Date()), 30000); return () => clearInterval(t); }, []);

  const h = ahora.getHours();
  const saludo = h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
  const nombreBonito = (nombre || "").charAt(0).toUpperCase() + (nombre || "").slice(1);

  const delTipo = useMemo(() => reparaciones.filter((r) => (r.tipo_trabajo || "taller") === vistaTrabajo), [reparaciones, vistaTrabajo]);
  const mesActual = ahora.toISOString().slice(0, 7);
  const conteo = useMemo(() => {
    const c = {};
    for (const r of delTipo) {
      if (FINALES.includes(r.estado_actual)) {
        if (r.estado_actual !== "no_reparable" && (r.fecha_entrega || "").startsWith(mesActual)) c[r.estado_actual] = (c[r.estado_actual] || 0) + 1;
      } else c[r.estado_actual] = (c[r.estado_actual] || 0) + 1;
    }
    return c;
  }, [delTipo, mesActual]);
  const etapasVisibles = etapas.filter((e) => e.key !== "no_reparable");
  const enTaller = delTipo.filter((r) => !FINALES.includes(r.estado_actual)).length;
  const maxEtapa = Math.max(1, ...etapasVisibles.map((e) => conteo[e.key] || 0));

  const listos = delTipo.filter((r) => r.estado_actual === "listo" || (vistaTrabajo === "domicilio" && r.estado_actual === "completado" && !r.fecha_entrega));
  const atencion = retrasadasLista.filter((r) => (r.tipo_trabajo || "taller") === vistaTrabajo);

  const frase = cargando ? "Cargando tu taller…" : (() => {
    const partes = [];
    if (listos.length) partes.push(<b key="l">{listos.length} {listos.length === 1 ? "equipo listo" : "equipos listos"} para entregar</b>);
    if (atencion.length) partes.push(<b key="a" style={{ color: "var(--bad)" }}>{atencion.length} {atencion.length === 1 ? "que va" : "que van"} con retraso</b>);
    if (!partes.length) return enTaller ? <>Tienes <b>{enTaller} {enTaller === 1 ? "equipo" : "equipos"} en el taller</b> y todo va en orden.</> : <>El taller está despejado. Buen momento para registrar la siguiente reparación.</>;
    return <>Hoy tienes {partes.reduce((acc, p, i) => (i ? [...acc, " y ", p] : [p]), [])}.{enTaller ? ` En total, ${enTaller} en el taller.` : ""}</>;
  })();

  const ingresos7 = (tendencia || []).map((d) => Number(d.ingresos) || 0);
  const ingresosSemana = ingresos7.reduce((a, b) => a + b, 0);
  const ingresosMes = Number(reporteMensual?.ingresos || 0);
  const [entero, decimales] = euros(ingresosMes).replace(" €", "").split(",");
  const nombreMes = ahora.toLocaleDateString("es-ES", { month: "long" });

  const kpis = [
    { t: "Retrasadas", v: atencion.length, s: "urgentes o +5 días", c: atencion.length ? "var(--bad)" : "var(--ok)", Icono: Flame, color: atencion.length ? "var(--bad)" : undefined, ir: () => document.getElementById("fz-atencion")?.scrollIntoView({ behavior: "smooth", block: "center" }) },
    { t: "Clientes", v: numClientes ?? "—", s: "en tu fichero", c: "var(--info)", Icono: Users, ir: () => onIrVista("clientes") },
    { t: "Mantenimientos", v: resumenMant ? resumenMant.activos : "—", s: !resumenMant ? "contratos activos" : resumenMant.sinCobrar ? `${resumenMant.sinCobrar} cuota(s) sin cobrar` : "contratos activos", c: "var(--vio)", Icono: CalendarCheck, ir: () => onIrVista("mantenimientos") },
    { t: "Stock", v: stockBajo ?? "—", s: stockBajo === null || stockBajo === undefined ? "comprobando…" : stockBajo ? "repuestos por pedir" : "todo en orden", c: stockBajo ? "var(--warn)" : "var(--ok)", Icono: Package, ir: () => onIrVista("inventario") },
    { t: "Tiempo medio", v: tiempoMedioDias == null ? "—" : <>{tiempoMedioDias.toFixed(1).replace(".", ",")}<small style={{ fontSize: 14 }}> d</small></>, s: "de entrada a entrega", c: "var(--ok)", Icono: Clock, ir: () => onIrVista("rendimiento") },
    { t: "Sistemas", v: "Ver", s: "sistemas.firztnet.es", c: "var(--ac)", Icono: LayoutGrid, ir: () => window.open("https://sistemas.firztnet.es", "_blank", "noopener") },
  ];

  return (
    <div className="fz-inicio">
      <section className="fz-hero">
        <div className="fz-saludo fz-vidrio fz-entra">
          <div className="fz-reloj"><b className="fz-num">{ahora.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</b>
            <span>{ahora.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</span></div>
          <small>{vistaTrabajo === "domicilio" ? "Trabajos in situ" : "Taller físico"} · Firztnet</small>
          <h1>{saludo}{nombreBonito ? <>, <em>{nombreBonito}</em></> : ""}</h1>
          <p>{frase}</p>
          <div className="fz-acciones">
            <button type="button" className="fz-btn pri" onClick={onNueva}><Plus size={16} /> Nueva reparación</button>
            <button type="button" className="fz-btn" onClick={onBuscar}><Search size={15} /> Buscar</button>
            {selectorTrabajo}
            <div className="fz-temas" role="group" aria-label="Tema de la pantalla">
              {TEMAS_INICIO.map((t) => (
                <button key={t.key} type="button" className={tema === t.key ? "on" : ""} style={{ background: t.muestra }} title={`Tema ${t.nombre}`} aria-label={`Tema ${t.nombre}`} aria-pressed={tema === t.key} onClick={() => onTema(t.key)} />
              ))}
            </div>
          </div>
        </div>
        <div className="fz-dinero fz-vidrio fz-entra" style={{ animationDelay: ".06s" }} onClick={() => onIrVista("reportes")} title="Ver reportes">
          <div className="fz-et"><span>Ingresos de {nombreMes}</span><span className="fz-pastilla">Hoy {Number(reporteDiario?.balance_neto || 0) >= 0 ? "+" : ""}{euros(reporteDiario?.balance_neto)}</span></div>
          <div className="fz-gr fz-num">{entero}<small>,{decimales} €</small></div>
          <div className="fz-mini"><span>Gastos <b className="fz-num">{euros(reporteMensual?.gastos)}</b></span>
            <span>Balance <b className="fz-num" style={{ color: Number(reporteMensual?.balance_neto) >= 0 ? "var(--ok)" : "var(--bad)" }}>{euros(reporteMensual?.balance_neto)}</b></span>
            <span>Últimos 7 días <b className="fz-num">{euros(ingresosSemana)}</b></span></div>
          <Curva puntos={ingresos7} />
        </div>
      </section>

      <section className="fz-bloque fz-vidrio fz-entra" style={{ animationDelay: ".12s" }}>
        <div className="fz-cab"><h2>Por dónde va cada equipo</h2><span>{enTaller} {vistaTrabajo === "domicilio" ? "trabajos abiertos" : "en el taller"} · pulsa una etapa para verlos</span></div>
        <div className="fz-etapas" style={{ "--n": etapasVisibles.length }}>
          {etapasVisibles.map((e) => {
            const n = conteo[e.key] || 0;
            const final = FINALES.includes(e.key);
            return (
              <button key={e.key} type="button" className="fz-etapa" style={{ "--c": COLOR_ETAPA[e.key] || "var(--ac)" }} onClick={() => onEtapa(e.key)}>
                <span className="l">{final ? `${e.label} este mes` : e.label}</span>
                <span className="n fz-num">{n}</span>
                <span className="fz-barra" style={{ display: "block" }}><i style={{ width: `${Math.round((n / maxEtapa) * 100)}%` }} /></span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="fz-rejilla">
        {kpis.map((k, i) => (
          <button key={k.t} type="button" className="fz-kpi fz-vidrio fz-entra" style={{ "--c": k.c, animationDelay: `${0.16 + i * 0.03}s` }} onClick={k.ir}>
            <span className="t">{k.t}<i><k.Icono size={14} /></i></span>
            <span className="v fz-num" style={k.color ? { color: k.color } : undefined}>{k.v}</span>
            <span className="s">{k.s}</span>
          </button>
        ))}
      </section>

      <section className="fz-dos">
        <div className="fz-lista fz-vidrio fz-entra" style={{ animationDelay: ".34s" }}>
          <div className="fz-cab"><h2>Listos para entregar</h2><span>{listos.length}</span></div>
          {listos.length === 0 && <div className="fz-vacio">Ninguno esperando ahora mismo.</div>}
          {listos.slice(0, 5).map((r) => (
            <div key={r.id} className="fz-item" style={{ "--c": "var(--ok)" }} onClick={() => onAbrir(r)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onAbrir(r)}>
              <span className="fz-av">{iniciales(r.cliente?.nombre)}</span>
              <div><b>{r.cliente?.nombre || "Sin cliente"}</b><small>{equipoDe(r)} · #{r.numero_orden}</small></div>
              <em className="fz-num">{r.presupuesto_importe != null ? euros(r.presupuesto_importe) : "Avisar"}</em>
            </div>
          ))}
        </div>
        <div id="fz-atencion" className="fz-lista fz-vidrio fz-entra" style={{ animationDelay: ".38s" }}>
          <div className="fz-cab"><h2>Necesitan atención</h2><span>{atencion.length}</span></div>
          {atencion.length === 0 && <div className="fz-vacio">Nada retrasado. Todo en plazo.</div>}
          {atencion.slice(0, 5).map((r) => {
            const d = diasDesde(r.fecha_recepcion);
            return (
              <div key={r.id} className="fz-item" style={{ "--c": r.urgente ? "var(--bad)" : "var(--warn)" }} onClick={() => onAbrir(r)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onAbrir(r)}>
                <span className="fz-av">{iniciales(r.cliente?.nombre)}</span>
                <div><b>{r.cliente?.nombre || "Sin cliente"}</b><small>{equipoDe(r)} · {(etapas.find((e) => e.key === r.estado_actual) || {}).label || r.estado_actual}</small></div>
                <em className="fz-num">{r.urgente ? "Urgente" : d != null ? `${d} d` : ""}</em>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
