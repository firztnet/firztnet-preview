import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Wrench, LayoutGrid, Users, FileBarChart, Ticket, Search,
  ChevronRight, CircleDot, TriangleAlert, ShieldCheck, Banknote,
  Printer, Plus, X, ArrowUpRight, ArrowDownRight, Loader2, Settings, LogOut, Camera, Trash2, Package, MessageSquare, CheckCircle2, XCircle, Flame, Eye, MapPin
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar
} from "recharts";

// ---------------------------------------------------------------------
// Cambia esto por la URL donde corra tu backend Flask
// (en local, con `python run.py`, es http://localhost:5000)
// ---------------------------------------------------------------------
const API_BASE = "https://firztnet-backend-production.up.railway.app/api";

const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap";

// Textura decorativa de "circuito" para el fondo de la cabecera del panel —
// líneas y nodos muy tenues, en azul, sobre transparente.
const PATRON_CIRCUITO = `url("data:image/svg+xml,${encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
  <g fill='none' stroke='#2563EB' stroke-width='1.2' opacity='0.08'>
    <path d='M0 40 H60 V80 H140' />
    <path d='M200 30 H150 V100 H90 V160' />
    <path d='M0 150 H50 V120' />
    <path d='M160 200 V150 H120 V60' />
    <path d='M40 0 V20' />
  </g>
  <g fill='#2563EB' opacity='0.14'>
    <circle cx='60' cy='40' r='3' />
    <circle cx='140' cy='80' r='3' />
    <circle cx='150' cy='30' r='3' />
    <circle cx='90' cy='100' r='3' />
    <circle cx='90' cy='160' r='3' />
    <circle cx='50' cy='150' r='3' />
    <circle cx='120' cy='150' r='3' />
    <circle cx='120' cy='60' r='3' />
  </g>
</svg>`)}")`;

const COLORS = {
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceRaised: "#F1F5F9",
  line: "#E2E8F0",
  text: "#0F172A",
  textDim: "#64748B",
  amber: "#2563EB",
  amberDim: "#06B6D4",
  teal: "#06B6D4",
  rust: "#EF4444",
  green: "#22C55E",
  statusAmber: "#F59E0B",
  statusBlue: "#3B82F6",
  sidebarBg: "#0F1B3D",
  sidebarText: "#E2E8F0",
  sidebarTextDim: "#8291B5",
  sidebarActiveBg: "#1B2C5C",
  violet: "#8B5CF6",
};

const STAGES_TALLER = [
  { key: "recibido", label: "Recibido", accent: COLORS.violet },
  { key: "diagnostico", label: "Diagnóstico", accent: COLORS.statusAmber },
  { key: "reparacion", label: "En reparación", accent: COLORS.statusBlue },
  { key: "listo", label: "Listo para entrega", accent: COLORS.green },
  { key: "entregado", label: "Entregado", accent: COLORS.teal },
  { key: "no_reparable", label: "No reparable", accent: COLORS.rust },
];

const STAGES_DOMICILIO = [
  { key: "contratado", label: "Contratado", accent: COLORS.violet },
  { key: "en_proceso", label: "En proceso", accent: COLORS.statusBlue },
  { key: "completado", label: "Completado", accent: COLORS.green },
  { key: "no_reparable", label: "No realizado", accent: COLORS.rust },
];

// Alias: la mayoría del código ya existente asume el flujo de taller —
// mantenemos STAGES apuntando ahí para no tener que tocar todos los usos.
const STAGES = STAGES_TALLER;

function stagesFor(tipoTrabajo) {
  return tipoTrabajo === "domicilio" ? STAGES_DOMICILIO : STAGES_TALLER;
}

// -------------------- helpers de API --------------------
let authToken = null;
let onSesionExpirada = null; // lo fija la app para volver a la pantalla de login

function cargarTokenGuardado() {
  try {
    return localStorage.getItem("firztnet_token");
  } catch (e) {
    return null;
  }
}
function guardarToken(token) {
  authToken = token;
  try {
    if (token) localStorage.setItem("firztnet_token", token);
    else localStorage.removeItem("firztnet_token");
  } catch (e) {
    /* almacenamiento no disponible, seguimos solo en memoria */
  }
}
function cabecerasAuth(extra = {}) {
  return authToken ? { ...extra, Authorization: `Bearer ${authToken}` } : extra;
}
function manejar401(res) {
  if (res.status === 401) {
    guardarToken(null);
    onSesionExpirada?.();
  }
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: cabecerasAuth() });
  manejar401(res);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}
async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: cabecerasAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  manejar401(res);
  if (!res.ok) throw new Error((await res.json()).error || `POST ${path} → ${res.status}`);
  return res.json();
}
async function apiPatch(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: cabecerasAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  manejar401(res);
  if (!res.ok) throw new Error((await res.json()).error || `PATCH ${path} → ${res.status}`);
  return res.json();
}

function fechaCorta(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}
function fechaLarga(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

function StageDot({ color }) {
  return <span style={{ width: 7, height: 7, borderRadius: 999, background: color, display: "inline-block", flexShrink: 0 }} />;
}

const CATEGORIAS_DOMICILIO = [
  { key: "redes", label: "Redes/Internet", checklist: ["Router revisado", "Cableado comprobado", "Velocidad testeada"] },
  { key: "camaras", label: "Cámaras CCTV/IP", checklist: ["Cámara 1 alineada", "Grabador configurado", "Acceso remoto probado"] },
  { key: "impresoras", label: "Impresoras/Periféricos", checklist: ["Impresora en red configurada", "Driver instalado", "Prueba de impresión OK"] },
  { key: "mantenimiento_empresas", label: "Mantenimiento empresas", checklist: ["Equipos revisados", "Copias de seguridad comprobadas"] },
];

function tiempoEnTaller(fechaRecepcion) {
  const horas = (Date.now() - new Date(fechaRecepcion).getTime()) / (1000 * 60 * 60);
  if (horas < 24) return { texto: "< 24h", color: "#22C55E", fondo: "#F0FDF4" };
  if (horas < 96) return { texto: `${Math.floor(horas / 24)} día${Math.floor(horas / 24) === 1 ? "" : "s"}`, color: "#F59E0B", fondo: "#FFFBEB" };
  return { texto: `${Math.floor(horas / 24)} días`, color: "#EF4444", fondo: "#FEF2F2" };
}

function tiempoRelativo(fecha) {
  const horas = Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60));
  if (horas < 1) return "ahora";
  if (horas < 24) return `${horas}h`;
  return `${Math.floor(horas / 24)}d`;
}

function iniciales(nombre) {
  if (!nombre) return "?";
  const partes = nombre.trim().split(" ");
  return ((partes[0]?.[0] || "") + (partes[1]?.[0] || "")).toUpperCase();
}

// -------------------- Reparaciones destacadas: En curso / Por entregar --------------------
function TarjetaDestacada({ t, onAbrir }) {
  const lista = stagesFor(t.tipo_trabajo);
  const stage = lista.find((s) => s.key === t.estado_actual) || lista[0];
  return (
    <button
      onClick={() => onAbrir(t)}
      style={{
        background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${stage.accent}`, borderRadius: 12,
        padding: "12px 14px", textAlign: "left", cursor: "pointer", width: "100%",
        display: "flex", alignItems: "center", gap: 10,
        boxShadow: `0 2px 6px ${stage.accent}18`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 4px 12px ${stage.accent}33`)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = `0 2px 6px ${stage.accent}18`)}
    >
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#FFFFFF", border: `2.5px solid ${stage.accent}`, color: stage.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
        {iniciales(t.cliente?.nombre)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: stage.accent, fontWeight: 700 }}>#{t.numero_orden}</span>
          {t.urgente && <Flame size={11} color={COLORS.rust} />}
          <span style={{ fontSize: 10, fontWeight: 600, color: stage.accent, background: `${stage.accent}18`, borderRadius: 999, padding: "1px 7px", marginLeft: "auto" }}>{tiempoRelativo(t.fecha_recepcion)}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.cliente?.nombre}</div>
        <div style={{ fontSize: 11.5, color: COLORS.textDim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.marca ? `${t.marca} ${t.modelo || ""}` : t.equipo}</div>
      </div>
      <Eye size={14} color={stage.accent} style={{ flexShrink: 0 }} />
    </button>
  );
}

function ReparacionesDestacadas({ reparaciones, onAbrir }) {
  const enCurso = reparaciones
    .filter((r) => ["diagnostico", "reparacion", "en_proceso"].includes(r.estado_actual))
    .sort((a, b) => (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0) || new Date(a.fecha_recepcion) - new Date(b.fecha_recepcion))
    .slice(0, 4);
  const porEntregar = reparaciones
    .filter((r) => r.estado_actual === "listo")
    .sort((a, b) => new Date(a.fecha_recepcion) - new Date(b.fecha_recepcion))
    .slice(0, 4);

  if (enCurso.length === 0 && porEntregar.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>Reparaciones destacadas</div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <StageDot color={COLORS.statusBlue} />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.4 }}>En curso</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {enCurso.length === 0 && <div style={{ fontSize: 12, color: COLORS.textDim }}>Nada en curso ahora mismo.</div>}
            {enCurso.map((t) => <TarjetaDestacada key={t.id} t={t} onAbrir={onAbrir} />)}
          </div>
        </div>
        <div style={{ flex: "1 1 260px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <StageDot color={COLORS.green} />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.4 }}>Por entregar</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {porEntregar.length === 0 && <div style={{ fontSize: 12, color: COLORS.textDim }}>Nada listo para entregar todavía.</div>}
            {porEntregar.map((t) => <TarjetaDestacada key={t.id} t={t} onAbrir={onAbrir} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function RepairTag({ t, onClick }) {
  const listaEstados = stagesFor(t.tipo_trabajo);
  const stage = listaEstados.find((s) => s.key === t.estado_actual) || listaEstados[0];
  const enTaller = !["entregado", "no_reparable", "completado"].includes(t.estado_actual) ? tiempoEnTaller(t.fecha_recepcion) : null;
  return (
    <button
      onClick={onClick}
      style={{
        background: COLORS.surfaceRaised,
        border: `1px solid ${COLORS.line}`,
        borderLeft: `4px solid ${stage.accent}`,
        borderRadius: 10,
        padding: "12px 14px 12px 12px",
        textAlign: "left",
        width: "100%",
        cursor: "pointer",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        boxShadow: `0 2px 5px ${stage.accent}15`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 4px 10px ${stage.accent}30`)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = `0 2px 5px ${stage.accent}15`)}
    >
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#FFFFFF", border: `2px solid ${stage.accent}`, color: stage.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, flexShrink: 0 }}>
        {iniciales(t.cliente?.nombre)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {t.urgente && <Flame size={12} color={COLORS.rust} />}
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: stage.accent, letterSpacing: 0.5, fontWeight: 700 }}>
              #{t.numero_orden}
            </span>
          </span>
          <span style={{ fontSize: 11, color: COLORS.textDim }}>{fechaCorta(t.fecha_recepcion)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginTop: 4 }}>
          <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 13.5, color: COLORS.text }}>
            {t.cliente?.nombre}
          </div>
          {enTaller && (
            <span
              title="Tiempo en el taller"
              style={{ fontSize: 10, fontWeight: 600, color: enTaller.color, background: enTaller.fondo, padding: "2px 6px", borderRadius: 999, flexShrink: 0, whiteSpace: "nowrap" }}
            >
              {enTaller.texto}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
          {t.tipo_trabajo === "domicilio" && <MapPin size={11} color={COLORS.statusBlue} />}
          {t.equipo}
        </div>
        {t.tipo_trabajo === "domicilio" && t.direccion_servicio && (
          <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{t.direccion_servicio}</div>
        )}
        {t.problema_reportado && (
          <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 4, fontStyle: "italic" }}>
            "{t.problema_reportado}"
          </div>
        )}
        {t.fecha_fin_garantia && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, color: COLORS.green, fontSize: 11 }}>
            <ShieldCheck size={12} /> Garantía hasta {fechaLarga(t.fecha_fin_garantia)}
          </div>
        )}
      </div>
    </button>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent, trend, destacada }) {
  if (destacada) {
    return (
      <div style={{ background: "#FFFFFF", border: `2px solid ${accent}`, borderRadius: 14, padding: "16px 18px", flex: 1, minWidth: 150, position: "relative", overflow: "hidden" }}>
        <span style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>{label}</span>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 30, color: COLORS.text, marginTop: 6, fontWeight: 700 }}>{value}</div>
        {sub && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11.5, color: trend === "up" ? COLORS.green : trend === "down" ? COLORS.rust : COLORS.textDim }}>
            {trend === "up" && <ArrowUpRight size={12} />}
            {trend === "down" && <ArrowDownRight size={12} />}
            {sub}
          </div>
        )}
        <div style={{ position: "absolute", right: 12, bottom: 10, width: 44, height: 44, borderRadius: 12, background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={22} color={accent} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: accent, borderRadius: 14, padding: "16px 18px", flex: 1, minWidth: 150, position: "relative", overflow: "hidden", boxShadow: `0 8px 20px -6px ${accent}80` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>{label}</span>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} color="#FFFFFF" />
        </div>
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 30, color: "#FFFFFF", marginTop: 8, fontWeight: 700 }}>{value}</div>
      {sub && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11.5, color: "rgba(255,255,255,0.9)" }}>
          {trend === "up" && <ArrowUpRight size={12} />}
          {trend === "down" && <ArrowDownRight size={12} />}
          {sub}
        </div>
      )}
    </div>
  );
}

function btnStyle(bg, color, border) {
  return {
    background: bg, color, border: border ? `1px solid ${border}` : "none",
    borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 600,
    display: "flex", alignItems: "center", gap: 6, cursor: "pointer", flex: 1,
    justifyContent: "center", fontFamily: "Inter",
  };
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
      <span style={{ color: COLORS.textDim }}>{label}</span>
      <span style={{ color: COLORS.text, textAlign: "right", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// -------------------- modal: detalle + cambio de estado --------------------
const TIPO_COMPROBANTE = {
  recibido: "recepcion", diagnostico: "recepcion", reparacion: "recepcion",
  listo: "recepcion", entregado: "entrega", no_reparable: "no_reparable",
  contratado: "recepcion", en_proceso: "recepcion", completado: "entrega",
};

// -------------------- pad de firma (reutilizable) --------------------
function PadFirma({ onGuardar, guardando, textoBoton = "Confirmar firma" }) {
  const canvasRef = useRef(null);
  const dibujando = useRef(false);
  const [haFirmado, setHaFirmado] = useState(false);

  function coordenadas(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const punto = e.touches ? e.touches[0] : e;
    return { x: punto.clientX - rect.left, y: punto.clientY - rect.top };
  }

  function empezar(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = coordenadas(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    dibujando.current = true;
  }
  function mover(e) {
    if (!dibujando.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = coordenadas(e, canvas);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.stroke();
    setHaFirmado(true);
  }
  function soltar() {
    dibujando.current = false;
  }
  function limpiar() {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHaFirmado(false);
  }
  function confirmar() {
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onGuardar(dataUrl);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={320}
        height={140}
        style={{ width: "100%", height: 140, background: "#FFFFFF", border: "1px dashed #CBD5E1", borderRadius: 8, touchAction: "none", cursor: "crosshair" }}
        onMouseDown={empezar}
        onMouseMove={mover}
        onMouseUp={soltar}
        onMouseLeave={soltar}
        onTouchStart={empezar}
        onTouchMove={mover}
        onTouchEnd={soltar}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={limpiar} type="button" style={{ ...btnStyle("transparent", "#64748B", "#E2E8F0"), flex: "none", padding: "8px 12px", fontSize: 12.5 }}>
          Borrar
        </button>
        <button onClick={confirmar} disabled={!haFirmado || guardando} type="button" style={{ ...btnStyle("#2563EB", "#FFFFFF"), flex: 1, padding: "8px 12px", fontSize: 12.5 }}>
          {guardando ? "Guardando..." : textoBoton}
        </button>
      </div>
    </div>
  );
}

function TicketModal({ t, onClose, onEstadoActualizado }) {
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [comprobante, setComprobante] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [errorComprobante, setErrorComprobante] = useState("");
  const [envioEmail, setEnvioEmail] = useState(null);
  const [viendoPdf, setViendoPdf] = useState(false);

  async function verPdf(comprobanteId) {
    // Abrimos la ventana YA, en el mismo instante del clic — si esperamos
    // a que termine la descarga, los navegadores bloquean la ventana por
    // considerarla un popup no solicitado.
    const ventana = window.open("", "_blank");
    setViendoPdf(true);
    try {
      const res = await fetch(`${API_BASE}/comprobantes/${comprobanteId}/pdf`, { headers: cabecerasAuth() });
      manejar401(res);
      if (!res.ok) throw new Error("No se pudo abrir el PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (ventana) {
        ventana.location.href = url;
      } else {
        setErrorComprobante("El navegador bloqueó la ventana. Permite las ventanas emergentes para este sitio.");
      }
    } catch (e) {
      ventana?.close();
      setErrorComprobante(e.message);
    } finally {
      setViendoPdf(false);
    }
  }
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoCobros, setCargandoCobros] = useState(true);
  const [montoCobro, setMontoCobro] = useState("");
  const [conceptoCobro, setConceptoCobro] = useState("Reparación");
  const [suplementoDesplazamiento, setSuplementoDesplazamiento] = useState(20);

  useEffect(() => {
    apiGet("/configuracion").then((c) => setSuplementoDesplazamiento(c.suplemento_desplazamiento ?? 20)).catch(() => {});
  }, []);
  const [metodoCobro, setMetodoCobro] = useState("efectivo");
  const [guardandoCobro, setGuardandoCobro] = useState(false);
  const [errorCobro, setErrorCobro] = useState("");
  const [viendoRecibo, setViendoRecibo] = useState(false);
  const [generandoFactura, setGenerandoFactura] = useState(false);
  const [facturaExistente, setFacturaExistente] = useState(null);
  const [errorPago, setErrorPago] = useState("");
  const [guardandoFecha, setGuardandoFecha] = useState(false);
  const [fotos, setFotos] = useState([]);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const [errorFotos, setErrorFotos] = useState("");
  const [repuestosUsados, setRepuestosUsados] = useState([]);
  const [listaRepuestos, setListaRepuestos] = useState([]);
  const [repuestoSeleccionado, setRepuestoSeleccionado] = useState("");
  const [cantidadRepuesto, setCantidadRepuesto] = useState(1);
  const [asignandoRepuesto, setAsignandoRepuesto] = useState(false);
  const [errorRepuesto, setErrorRepuesto] = useState("");
  const [checklist, setChecklist] = useState([]);
  const [nuevoItemChecklist, setNuevoItemChecklist] = useState("");
  const [guardandoChecklist, setGuardandoChecklist] = useState(false);

  async function añadirItemChecklist(texto) {
    if (!texto.trim()) return;
    setGuardandoChecklist(true);
    try {
      const item = await apiPost(`/reparaciones/${t.id}/checklist`, { texto });
      setChecklist((prev) => [...prev, item]);
      setNuevoItemChecklist("");
    } catch (e) {
      /* silencioso */
    } finally {
      setGuardandoChecklist(false);
    }
  }

  async function toggleItemChecklist(item) {
    setChecklist((prev) => prev.map((i) => (i.id === item.id ? { ...i, completado: !i.completado } : i)));
    try {
      const res = await fetch(`${API_BASE}/checklist/${item.id}`, {
        method: "PATCH",
        headers: cabecerasAuth({ "Content-Type": "application/json" }),
        body: JSON.stringify({ completado: !item.completado }),
      });
      manejar401(res);
    } catch (e) {
      setChecklist((prev) => prev.map((i) => (i.id === item.id ? { ...i, completado: item.completado } : i)));
    }
  }

  async function borrarItemChecklist(itemId) {
    try {
      const res = await fetch(`${API_BASE}/checklist/${itemId}`, { method: "DELETE", headers: cabecerasAuth() });
      manejar401(res);
      if (res.ok) setChecklist((prev) => prev.filter((i) => i.id !== itemId));
    } catch (e) {
      /* silencioso */
    }
  }

  async function usarPlantillaChecklist() {
    const cat = CATEGORIAS_DOMICILIO.find((c) => c.key === t.categoria);
    if (!cat) return;
    for (const texto of cat.checklist) {
      if (!checklist.some((i) => i.texto === texto)) {
        await añadirItemChecklist(texto);
      }
    }
  }
  const [presupuestoImporte, setPresupuestoImporte] = useState(t?.presupuesto_importe ?? "");
  const [presupuestoDescripcion, setPresupuestoDescripcion] = useState(t?.presupuesto_descripcion ?? "");
  const [guardandoPresupuesto, setGuardandoPresupuesto] = useState(false);
  const [errorPresupuesto, setErrorPresupuesto] = useState("");
  const [viendoPdfPresupuesto, setViendoPdfPresupuesto] = useState(false);
  const [mostrarFirmaEntrega, setMostrarFirmaEntrega] = useState(false);
  const [guardandoFirmaEntrega, setGuardandoFirmaEntrega] = useState(false);
  const [firmaEntregaHecha, setFirmaEntregaHecha] = useState(false);
  const [avisoPendiente, setAvisoPendiente] = useState(null);

  async function guardarPresupuesto() {
    if (!presupuestoImporte) {
      setErrorPresupuesto("Indica el importe antes de guardar.");
      return;
    }
    setGuardandoPresupuesto(true);
    setErrorPresupuesto("");
    try {
      const actualizado = await apiPost(`/reparaciones/${t.id}/presupuesto`, {
        importe: parseFloat(presupuestoImporte),
        descripcion: presupuestoDescripcion,
      });
      onEstadoActualizado(actualizado);
    } catch (e) {
      setErrorPresupuesto(e.message);
    } finally {
      setGuardandoPresupuesto(false);
    }
  }

  async function verPdfPresupuesto() {
    const ventana = window.open("", "_blank");
    setViendoPdfPresupuesto(true);
    try {
      const res = await fetch(`${API_BASE}/reparaciones/${t.id}/presupuesto/pdf`, { headers: cabecerasAuth() });
      manejar401(res);
      if (!res.ok) throw new Error("No se pudo abrir el presupuesto");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (ventana) ventana.location.href = url;
    } catch (e) {
      ventana?.close();
      setErrorPresupuesto(e.message);
    } finally {
      setViendoPdfPresupuesto(false);
    }
  }

  async function guardarFirmaEntrega(dataUrl) {
    setGuardandoFirmaEntrega(true);
    try {
      const res = await fetch(`${API_BASE}/reparaciones/${t.id}/firma-entrega`, {
        method: "POST",
        headers: cabecerasAuth({ "Content-Type": "application/json" }),
        body: JSON.stringify({ firma_png: dataUrl }),
      });
      manejar401(res);
      if (!res.ok) throw new Error("No se pudo guardar la firma");
      setFirmaEntregaHecha(true);
      setMostrarFirmaEntrega(false);
    } catch (e) {
      setErrorPago(e.message);
    } finally {
      setGuardandoFirmaEntrega(false);
    }
  }

  async function asignarRepuesto() {
    if (!repuestoSeleccionado) return;
    setAsignandoRepuesto(true);
    setErrorRepuesto("");
    try {
      const uso = await apiPost(`/reparaciones/${t.id}/repuestos`, {
        repuesto_id: parseInt(repuestoSeleccionado, 10),
        cantidad: parseInt(cantidadRepuesto, 10) || 1,
      });
      setRepuestosUsados((prev) => [...prev, uso]);
      setListaRepuestos((prev) =>
        prev.map((r) => (r.id === uso.repuesto.id ? { ...r, stock_actual: r.stock_actual - uso.cantidad } : r))
      );
      setRepuestoSeleccionado("");
      setCantidadRepuesto(1);
    } catch (e) {
      setErrorRepuesto(e.message);
    } finally {
      setAsignandoRepuesto(false);
    }
  }

  useEffect(() => {
    if (!t) return;
    apiGet(`/reparaciones/${t.id}/fotos`).then(setFotos).catch(() => {});
  }, [t?.id]);

  async function subirFotos(fileList) {
    if (!fileList || fileList.length === 0) return;
    setSubiendoFotos(true);
    setErrorFotos("");
    try {
      const formData = new FormData();
      Array.from(fileList).forEach((f) => formData.append("foto", f));
      const res = await fetch(`${API_BASE}/reparaciones/${t.id}/fotos`, {
        method: "POST",
        headers: cabecerasAuth(),
        body: formData,
      });
      manejar401(res);
      const nuevas = await res.json();
      if (!res.ok) throw new Error(nuevas.error || "No se pudieron subir las fotos");
      setFotos((prev) => [...prev, ...nuevas]);
    } catch (e) {
      setErrorFotos(e.message);
    } finally {
      setSubiendoFotos(false);
    }
  }

  async function borrarFoto(fotoId) {
    try {
      const res = await fetch(`${API_BASE}/fotos/${fotoId}`, { method: "DELETE", headers: cabecerasAuth() });
      manejar401(res);
      if (res.ok) setFotos((prev) => prev.filter((f) => f.id !== fotoId));
    } catch (e) {
      /* silencioso */
    }
  }

  async function actualizarFechaEstimada(valor) {
    const nueva = valor ? new Date(valor).toISOString() : null;
    if (nueva === (t.fecha_estimada || null)) return;
    setGuardandoFecha(true);
    try {
      const actualizado = await apiPatch(`/reparaciones/${t.id}`, { fecha_estimada: nueva });
      onEstadoActualizado(actualizado);
    } catch (e) {
      setErrorPago(e.message);
    } finally {
      setGuardandoFecha(false);
    }
  }

  useEffect(() => {
    if (!t) return;
    setCargandoCobros(true);
    apiGet(`/reparaciones/${t.id}`)
      .then((data) => {
        setMovimientos(data.movimientos || []);
        setRepuestosUsados(data.repuestos_usados || []);
        setChecklist(data.checklist || []);
      })
      .catch(() => {})
      .finally(() => setCargandoCobros(false));
    apiGet(`/facturas/reparacion/${t.id}`)
      .then((data) => setFacturaExistente(data[0] || null))
      .catch(() => {});
    apiGet("/repuestos").then(setListaRepuestos).catch(() => {});
  }, [t?.id]);

  // Olvida el comprobante anterior al abrir otra reparación, o al avanzar
  // de estado la misma (ej. de "listo" a "entregado") — así no se queda
  // mostrando el comprobante viejo (de recepción) en vez de dejar
  // generar el nuevo que corresponde (de entrega).
  useEffect(() => {
    setComprobante(null);
    setErrorComprobante("");
    setEnvioEmail(null);
  }, [t?.id, t?.estado_actual]);

  // Igual, pero para el presupuesto y la firma de entrega: al cambiar de
  // reparación hay que partir de los datos de ESA reparación, no dejar
  // lo que se estuviera escribiendo en la anterior.
  useEffect(() => {
    setPresupuestoImporte(t?.presupuesto_importe ?? "");
    setPresupuestoDescripcion(t?.presupuesto_descripcion ?? "");
    setErrorPresupuesto("");
    setMostrarFirmaEntrega(false);
    setFirmaEntregaHecha(false);
    setAvisoPendiente(null);
  }, [t?.id]);

  if (!t) return null;
  const listaEstados = stagesFor(t.tipo_trabajo);
  const stage = listaEstados.find((s) => s.key === t.estado_actual) || listaEstados[0];
  const esFinal = ["entregado", "no_reparable", "completado"].includes(t.estado_actual);

  const totalCobrado = movimientos.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + Number(m.monto), 0);

  async function abrirPdfDesdeUrl(url, ventanaPrevia) {
    const res = await fetch(url, { headers: cabecerasAuth() });
    manejar401(res);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "No se pudo generar el documento");
    }
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    if (ventanaPrevia) ventanaPrevia.location.href = objUrl;
    else window.open(objUrl, "_blank");
  }

  async function verRecibo() {
    setErrorPago("");
    const ventana = window.open("", "_blank");
    setViendoRecibo(true);
    try {
      await abrirPdfDesdeUrl(`${API_BASE}/recibos/reparacion/${t.id}/pdf`, ventana);
    } catch (e) {
      ventana?.close();
      setErrorPago(e.message);
    } finally {
      setViendoRecibo(false);
    }
  }

  async function emitirOVerFactura() {
    setErrorPago("");
    const ventana = window.open("", "_blank");
    setGenerandoFactura(true);
    try {
      let factura = facturaExistente;
      if (!factura) {
        factura = await apiPost("/facturas", { reparacion_id: t.id });
        setFacturaExistente(factura);
      }
      await abrirPdfDesdeUrl(`${API_BASE}/facturas/${factura.id}/pdf`, ventana);
    } catch (e) {
      ventana?.close();
      setErrorPago(e.message);
    } finally {
      setGenerandoFactura(false);
    }
  }

  async function registrarCobro() {
    setErrorCobro("");
    if (!montoCobro || parseFloat(montoCobro) <= 0) {
      setErrorCobro("Indica un importe válido.");
      return;
    }
    setGuardandoCobro(true);
    try {
      const nuevo = await apiPost("/finanzas", {
        reparacion_id: t.id,
        tipo: "ingreso",
        concepto: conceptoCobro,
        monto: parseFloat(montoCobro),
        metodo_pago: metodoCobro,
      });
      setMovimientos((prev) => [nuevo, ...prev]);
      setMontoCobro("");
    } catch (e) {
      setErrorCobro(e.message);
    } finally {
      setGuardandoCobro(false);
    }
  }

  async function generarComprobante() {
    setGenerando(true);
    setErrorComprobante("");
    try {
      const tipo = TIPO_COMPROBANTE[t.estado_actual] || "recepcion";
      const resultado = await apiPost("/comprobantes", { reparacion_id: t.id, tipo });
      setComprobante(resultado);
    } catch (e) {
      setErrorComprobante(e.message);
    } finally {
      setGenerando(false);
    }
  }

  async function enviarPorEmail() {
    if (!comprobante) return;
    setEnvioEmail("enviando");
    try {
      const resultado = await apiPost(`/comprobantes/${comprobante.id}/enviar-email`, {});
      setEnvioEmail(resultado.enviado ? "ok" : resultado.motivo || "error");
    } catch (e) {
      setEnvioEmail(e.message);
    }
  }

  async function avanzar(nuevoEstado) {
    setError("");
    if (nuevoEstado === "no_reparable" && !motivo.trim()) {
      setError("Indica el motivo antes de marcarlo como no reparable.");
      return;
    }
    setGuardando(true);
    try {
      const body = nuevoEstado === "no_reparable" ? { estado: nuevoEstado, motivo } : { estado: nuevoEstado };
      const actualizado = await apiPatch(`/reparaciones/${t.id}/estado`, body);
      onEstadoActualizado(actualizado);
      setAvisoPendiente(actualizado.aviso || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  const idx = listaEstados.findIndex((s) => s.key === t.estado_actual);
  const pasosLineales = t.tipo_trabajo === "domicilio" ? 3 : 5; // sin contar la rama "no_reparable" al final
  const siguiente = idx >= 0 && idx < pasosLineales - 1 ? listaEstados[idx + 1] : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="fn-modal-box" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, width: 400, maxWidth: "100%", maxHeight: "90vh", minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", padding: 24, position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: COLORS.textDim, cursor: "pointer" }}>
          <X size={18} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${COLORS.amber}`, flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: COLORS.amber }}>#{t.numero_orden}</div>
            <div style={{ fontFamily: "Oswald", fontSize: 18, color: COLORS.text }}>{stage.label}</div>
          </div>
        </div>

        <div style={{ borderTop: `1px dashed ${COLORS.line}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <Row label="Cliente" value={t.cliente?.nombre} />
          <Row label="Equipo" value={t.equipo} />
          {t.tipo_trabajo === "domicilio" && t.direccion_servicio && <Row label="Dirección" value={t.direccion_servicio} />}
          {t.tipo_trabajo === "domicilio" && t.categoria && (
            <Row label="Categoría" value={CATEGORIAS_DOMICILIO.find((c) => c.key === t.categoria)?.label || t.categoria} />
          )}
          <Row label="Problema reportado" value={t.problema_reportado || "—"} />
          <Row label="Fecha recepción" value={fechaLarga(t.fecha_recepcion)} />
          <Row label="Estado" value={stage.label} />
          {!esFinal ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: COLORS.textDim }}>Fecha estimada de entrega</span>
              <input
                type="date"
                defaultValue={t.fecha_estimada ? t.fecha_estimada.slice(0, 10) : ""}
                onBlur={(e) => actualizarFechaEstimada(e.target.value)}
                style={{ fontSize: 12.5, padding: "5px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }}
              />
            </div>
          ) : (
            t.fecha_estimada && <Row label="Fecha estimada era" value={fechaLarga(t.fecha_estimada)} />
          )}
          {t.fecha_fin_garantia && <Row label="Garantía hasta" value={fechaLarga(t.fecha_fin_garantia)} />}
        </div>

        {t.tipo_trabajo === "domicilio" && t.direccion_servicio && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(t.direccion_servicio)}`}
              target="_blank" rel="noreferrer"
              style={{ ...btnStyle("transparent", COLORS.statusBlue, COLORS.line), flex: 1, padding: "8px 10px", fontSize: 12, textDecoration: "none" }}
            >
              <MapPin size={13} /> Google Maps
            </a>
            <a
              href={`https://waze.com/ul?q=${encodeURIComponent(t.direccion_servicio)}&navigate=yes`}
              target="_blank" rel="noreferrer"
              style={{ ...btnStyle("transparent", "#33CCFF", COLORS.line), flex: 1, padding: "8px 10px", fontSize: 12, textDecoration: "none" }}
            >
              <MapPin size={13} /> Waze
            </a>
          </div>
        )}
        {guardandoFecha && <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>Guardando fecha...</div>}

        {t.tipo_trabajo === "domicilio" && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6 }}>Hoja de trabajo</div>
              {t.categoria && CATEGORIAS_DOMICILIO.some((c) => c.key === t.categoria) && (
                <button onClick={usarPlantillaChecklist} style={{ background: "none", border: "none", color: COLORS.statusBlue, fontSize: 11, cursor: "pointer", padding: 0 }}>
                  + Usar plantilla de {CATEGORIAS_DOMICILIO.find((c) => c.key === t.categoria)?.label}
                </button>
              )}
            </div>
            {checklist.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                {checklist.map((item) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" checked={item.completado} onChange={() => toggleItemChecklist(item)} style={{ width: 15, height: 15, cursor: "pointer", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: item.completado ? COLORS.textDim : COLORS.text, textDecoration: item.completado ? "line-through" : "none", flex: 1 }}>{item.texto}</span>
                    <button onClick={() => borrarItemChecklist(item.id)} style={{ background: "none", border: "none", color: COLORS.textDim, cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={nuevoItemChecklist}
                onChange={(e) => setNuevoItemChecklist(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") añadirItemChecklist(nuevoItemChecklist); }}
                placeholder="Añadir punto (ej. Cámara 2 alineada)"
                style={{ flex: 1, fontSize: 12.5, padding: "7px 9px", borderRadius: 7, border: `1px solid ${COLORS.line}` }}
              />
              <button disabled={guardandoChecklist} onClick={() => añadirItemChecklist(nuevoItemChecklist)} style={{ ...btnStyle(COLORS.statusBlue, "#FFFFFF"), flex: "none", padding: "7px 12px", fontSize: 12 }}>
                Añadir
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6 }}>Presupuesto</div>
            {t.presupuesto_estado && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                color: t.presupuesto_estado === "aceptado" ? COLORS.green : t.presupuesto_estado === "rechazado" ? COLORS.rust : COLORS.statusAmber,
                background: t.presupuesto_estado === "aceptado" ? "#F0FDF4" : t.presupuesto_estado === "rechazado" ? "#FEF2F2" : "#FFFBEB",
              }}>
                {t.presupuesto_estado === "aceptado" ? "Aceptado" : t.presupuesto_estado === "rechazado" ? "Rechazado" : "Pendiente"}
              </span>
            )}
          </div>
          {errorPresupuesto && <div style={{ fontSize: 12, color: COLORS.rust, marginBottom: 8 }}>{errorPresupuesto}</div>}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <input
              value={presupuestoDescripcion}
              onChange={(e) => setPresupuestoDescripcion(e.target.value)}
              placeholder="Descripción (ej. Cambio de pantalla)"
              style={{ flex: 1, fontSize: 12.5, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}` }}
            />
            <input
              type="number"
              value={presupuestoImporte}
              onChange={(e) => setPresupuestoImporte(e.target.value)}
              placeholder="Importe € *"
              style={{ width: 90, fontSize: 12.5, padding: "8px 10px", borderRadius: 7, border: `1px solid ${!presupuestoImporte ? COLORS.rust : COLORS.line}` }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button disabled={guardandoPresupuesto} onClick={guardarPresupuesto} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: 1, padding: "8px 12px", fontSize: 12.5 }}>
              {guardandoPresupuesto ? "Guardando..." : t.presupuesto_importe != null ? "Actualizar presupuesto" : "Crear presupuesto"}
            </button>
            {t.presupuesto_importe != null && (
              <button disabled={viendoPdfPresupuesto} onClick={verPdfPresupuesto} style={{ ...btnStyle("transparent", COLORS.text, COLORS.line), flex: "none", padding: "8px 12px", fontSize: 12.5 }}>
                Ver PDF
              </button>
            )}
          </div>
          {t.presupuesto_importe != null && t.presupuesto_estado === "pendiente" && (
            <a
              href={`https://wa.me/${(t.cliente?.telefono || "").replace(/\D/g, "")}?text=${encodeURIComponent(
                `Hola ${t.cliente?.nombre?.split(" ")[0] || ""}, ya tenemos el presupuesto de tu ${t.equipo}. Revísalo y fírmalo aquí: ${window.location.origin}/seguimiento?token=${t.token_seguimiento}`
              )}`}
              target="_blank"
              rel="noreferrer"
              style={{ ...btnStyle(COLORS.green, "#FFFFFF"), width: "100%", marginTop: 8, textDecoration: "none", boxSizing: "border-box", opacity: t.cliente?.telefono ? 1 : 0.5, pointerEvents: t.cliente?.telefono ? "auto" : "none" }}
            >
              Enviar presupuesto y pedir firma por WhatsApp
            </a>
          )}
          {t.presupuesto_importe != null && t.presupuesto_estado === "pendiente" && !t.cliente?.telefono && (
            <div style={{ fontSize: 11, color: COLORS.rust, marginTop: 4 }}>El cliente no tiene teléfono guardado — añádelo desde Clientes.</div>
          )}
        </div>

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6 }}>Fotos de recepción</div>
            <label style={{ fontSize: 11.5, color: COLORS.amber, cursor: "pointer" }}>
              {subiendoFotos ? "Subiendo..." : "+ Añadir foto"}
              <input
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={(e) => subirFotos(e.target.files)}
                style={{ display: "none" }}
                disabled={subiendoFotos}
              />
            </label>
          </div>
          {errorFotos && <div style={{ fontSize: 12, color: COLORS.rust, marginBottom: 8 }}>{errorFotos}</div>}
          {fotos.length === 0 ? (
            <div style={{ fontSize: 12, color: COLORS.textDim, display: "flex", alignItems: "center", gap: 6 }}>
              <Camera size={14} /> Sin fotos todavía — útil para dejar constancia de rayones o golpes previos.
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {fotos.map((f) => (
                <div key={f.id} style={{ position: "relative", width: 70, height: 70 }}>
                  <a href={`${API_BASE}/fotos/${f.id}/archivo`} target="_blank" rel="noreferrer">
                    <img
                      src={`${API_BASE}/fotos/${f.id}/archivo`}
                      alt="Foto de recepción"
                      style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 8, border: `1px solid ${COLORS.line}`, display: "block" }}
                    />
                  </a>
                  <button
                    onClick={() => borrarFoto(f.id)}
                    style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: COLORS.rust, color: "#FFF", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                    title="Eliminar foto"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
          <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Repuestos usados</div>
          {errorRepuesto && <div style={{ fontSize: 12, color: COLORS.rust, marginBottom: 8 }}>{errorRepuesto}</div>}
          {repuestosUsados.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {repuestosUsados.map((u) => (
                <div key={u.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.textDim }}>
                  <span>{u.cantidad}× {u.repuesto?.nombre}</span>
                  <span>{(u.cantidad * u.precio_aplicado).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</span>
                </div>
              ))}
            </div>
          )}
          {!esFinal && (
            <div style={{ display: "flex", gap: 6 }}>
              <select value={repuestoSeleccionado} onChange={(e) => setRepuestoSeleccionado(e.target.value)} style={{ flex: 1, fontSize: 12.5, padding: "7px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }}>
                <option value="">Elegir repuesto...</option>
                {listaRepuestos.map((r) => (
                  <option key={r.id} value={r.id} disabled={r.stock_actual <= 0}>
                    {r.nombre} (stock: {r.stock_actual})
                  </option>
                ))}
              </select>
              <input type="number" min="1" value={cantidadRepuesto} onChange={(e) => setCantidadRepuesto(e.target.value)} style={{ width: 50, fontSize: 12.5, padding: "7px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }} />
              <button disabled={asignandoRepuesto || !repuestoSeleccionado} onClick={asignarRepuesto} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "7px 12px", fontSize: 12 }}>
                Usar
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6 }}>Cobro</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13.5, color: totalCobrado > 0 ? COLORS.green : COLORS.textDim }}>
              {totalCobrado > 0 ? `Cobrado: ${totalCobrado.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €` : "Sin cobros registrados"}
            </div>
          </div>

          {!cargandoCobros && movimientos.filter((m) => m.tipo === "ingreso").length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {movimientos.filter((m) => m.tipo === "ingreso").map((m) => (
                <div key={m.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.textDim }}>
                  <span>{m.concepto} · {m.metodo_pago}</span>
                  <span style={{ color: COLORS.green }}>+{Number(m.monto).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</span>
                </div>
              ))}
            </div>
          )}

          {errorCobro && <div style={{ fontSize: 12, color: COLORS.rust, marginBottom: 8 }}>{errorCobro}</div>}

          {t.tipo_trabajo === "domicilio" && (
            <button
              type="button"
              onClick={() => { setConceptoCobro("Suplemento de desplazamiento"); setMontoCobro(String(suplementoDesplazamiento)); }}
              style={{ fontSize: 11.5, color: COLORS.statusBlue, background: "none", border: `1px dashed ${COLORS.statusBlue}`, borderRadius: 7, padding: "6px 10px", cursor: "pointer", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}
            >
              <MapPin size={12} /> + Añadir suplemento de desplazamiento ({Number(suplementoDesplazamiento).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €)
            </button>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <input
              value={conceptoCobro}
              onChange={(e) => setConceptoCobro(e.target.value)}
              placeholder="Concepto"
              style={{ flex: "1 1 120px", fontSize: 12.5, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box" }}
            />
            <input
              value={montoCobro}
              onChange={(e) => setMontoCobro(e.target.value)}
              type="number"
              placeholder="Importe (€)"
              style={{ width: 100, fontSize: 12.5, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box" }}
            />
            <select value={metodoCobro} onChange={(e) => setMetodoCobro(e.target.value)} style={{ fontSize: 12.5, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}` }}>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
          <button disabled={guardandoCobro} onClick={registrarCobro} style={{ ...btnStyle(COLORS.green, "#FFFFFF"), width: "100%", marginTop: 8, padding: "9px 12px" }}>
            {guardandoCobro ? "Registrando..." : "Registrar cobro"}
          </button>
        </div>

        {!esFinal && (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
            <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Avanzar reparación</div>
            {error && <div style={{ fontSize: 12, color: COLORS.rust, marginBottom: 8 }}>{error}</div>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {siguiente && (
                <button disabled={guardando} onClick={() => avanzar(siguiente.key)} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "8px 12px" }}>
                  {guardando ? <Loader2 size={13} className="spin" /> : `→ ${siguiente.label}`}
                </button>
              )}
            </div>
            <div style={{ marginTop: 10 }}>
              <input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder={t.tipo_trabajo === "domicilio" ? "Motivo si no se pudo realizar..." : "Motivo si no es reparable..."}
                style={{ width: "100%", fontSize: 12, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}`, marginBottom: 6, boxSizing: "border-box" }}
              />
              <button disabled={guardando} onClick={() => avanzar("no_reparable")} style={{ ...btnStyle("transparent", COLORS.rust, COLORS.line), width: "100%", padding: "8px 12px" }}>
                {t.tipo_trabajo === "domicilio" ? "Marcar no realizado" : "Marcar no reparable"}
              </button>
            </div>
          </div>
        )}

        {avisoPendiente && (
          <div style={{ marginTop: 14, background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11.5, color: COLORS.green, fontWeight: 600, marginBottom: 4 }}>Aviso listo para enviar</div>
            <div style={{ fontSize: 12.5, color: COLORS.text, marginBottom: 8 }}>{avisoPendiente.texto}</div>
            <div style={{ display: "flex", gap: 8 }}>
              {avisoPendiente.enlace_whatsapp ? (
                <a
                  href={avisoPendiente.enlace_whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setAvisoPendiente(null)}
                  style={{ ...btnStyle(COLORS.green, "#FFFFFF"), flex: 1, padding: "8px 12px", fontSize: 12.5, textDecoration: "none" }}
                >
                  Enviar por WhatsApp
                </a>
              ) : (
                <div style={{ fontSize: 11.5, color: COLORS.textDim }}>El cliente no tiene teléfono guardado.</div>
              )}
              <button onClick={() => setAvisoPendiente(null)} style={{ ...btnStyle("transparent", COLORS.textDim, COLORS.line), flex: "none", padding: "8px 12px", fontSize: 12.5 }}>
                Descartar
              </button>
            </div>
          </div>
        )}

        {["listo", "entregado", "completado"].includes(t.estado_actual) && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6 }}>
                {t.tipo_trabajo === "domicilio" ? "Firma de conformidad" : "Firma de recogida"}
              </div>
              {firmaEntregaHecha && <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 600 }}>✓ Firmada</span>}
            </div>
            {!mostrarFirmaEntrega ? (
              <button onClick={() => setMostrarFirmaEntrega(true)} style={{ ...btnStyle("transparent", COLORS.text, COLORS.line), width: "100%" }}>
                {firmaEntregaHecha ? "Firmar de nuevo" : t.tipo_trabajo === "domicilio" ? "El cliente firma aquí al terminar" : "El cliente firma aquí al recoger"}
              </button>
            ) : (
              <PadFirma onGuardar={guardarFirmaEntrega} guardando={guardandoFirmaEntrega} textoBoton={t.tipo_trabajo === "domicilio" ? "Confirmar conformidad" : "Confirmar recogida"} />
            )}
          </div>
        )}

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
          <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Comprobante</div>
          {errorComprobante && <div style={{ fontSize: 12, color: COLORS.rust, marginBottom: 8 }}>{errorComprobante}</div>}

          {!comprobante ? (
            <button disabled={generando} onClick={generarComprobante} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), width: "100%" }}>
              {generando ? "Generando PDF..." : <><Printer size={14} /> Generar comprobante</>}
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => verPdf(comprobante.id)}
                  disabled={viendoPdf}
                  style={{ ...btnStyle(COLORS.amber, "#FFFFFF") }}
                >
                  <Printer size={14} /> {viendoPdf ? "Abriendo..." : "Ver / imprimir PDF"}
                </button>
                {comprobante.enlace_whatsapp && (
                  <a
                    href={comprobante.enlace_whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    style={{ ...btnStyle("transparent", COLORS.green, COLORS.line), textDecoration: "none" }}
                  >
                    Enviar por WhatsApp
                  </a>
                )}
              </div>
              <button onClick={enviarPorEmail} disabled={envioEmail === "enviando"} style={{ ...btnStyle("transparent", COLORS.teal, COLORS.line), width: "100%" }}>
                {envioEmail === "enviando" ? "Enviando..." : "Enviar por email"}
              </button>
              {envioEmail && envioEmail !== "enviando" && (
                <div style={{ fontSize: 11.5, color: envioEmail === "ok" ? COLORS.green : COLORS.rust }}>
                  {envioEmail === "ok" ? "Email enviado correctamente." : envioEmail}
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
          <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Recibo y factura</div>
          {errorPago && <div style={{ fontSize: 12, color: COLORS.rust, marginBottom: 8 }}>{errorPago}</div>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={verRecibo} disabled={viendoRecibo || totalCobrado <= 0} style={{ ...btnStyle("transparent", COLORS.text, COLORS.line), flex: "1 1 130px" }}>
              {viendoRecibo ? "Abriendo..." : "Ver recibo"}
            </button>
            <button onClick={emitirOVerFactura} disabled={generandoFactura || totalCobrado <= 0} style={{ ...btnStyle("transparent", COLORS.text, COLORS.line), flex: "1 1 130px" }}>
              {generandoFactura ? "Generando..." : facturaExistente ? `Ver factura ${facturaExistente.numero}` : "Emitir factura"}
            </button>
          </div>
          {totalCobrado <= 0 && <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 6 }}>Registra un cobro antes de generar el recibo o la factura.</div>}
        </div>
      </div>
    </div>
  );
}

// -------------------- modal: nueva reparación --------------------
function NuevaReparacionModal({ onClose, onCreada }) {
  const [form, setForm] = useState({ nombreCliente: "", telefono: "", email: "", tipoTrabajo: "taller", direccionServicio: "", categoria: "", equipo: "", marca: "", modelo: "", urgente: false, problema: "", fechaEstimada: "" });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function guardar() {
    setError("");
    if (!form.nombreCliente.trim() || !form.equipo.trim()) {
      setError(form.tipoTrabajo === "domicilio" ? "Cliente y descripción del servicio son obligatorios." : "Cliente y equipo son obligatorios.");
      return;
    }
    setGuardando(true);
    try {
      const cliente = await apiPost("/clientes", { nombre: form.nombreCliente, telefono: form.telefono, email: form.email });
      const reparacion = await apiPost("/reparaciones", {
        cliente_id: cliente.id,
        equipo: form.equipo,
        tipo_trabajo: form.tipoTrabajo,
        direccion_servicio: form.direccionServicio,
        categoria: form.categoria,
        marca: form.marca,
        modelo: form.modelo,
        urgente: form.urgente,
        problema_reportado: form.problema,
        fecha_estimada: form.fechaEstimada ? new Date(form.fechaEstimada).toISOString() : null,
      });
      onCreada(reparacion);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  const inputStyle = { width: "100%", fontSize: 13, padding: "9px 11px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box", marginTop: 4 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="fn-modal-box" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, width: 380, maxWidth: "100%", maxHeight: "90vh", minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", padding: 24, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: COLORS.textDim, cursor: "pointer" }}>
          <X size={18} />
        </button>
        <div style={{ fontFamily: "Oswald", fontSize: 18, color: COLORS.text, marginBottom: 16 }}>Nueva reparación</div>

        {error && <div style={{ fontSize: 12, color: COLORS.rust, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, tipoTrabajo: "taller" }))}
            style={{ flex: 1, padding: "9px 10px", borderRadius: 8, border: `1.5px solid ${form.tipoTrabajo === "taller" ? COLORS.amber : COLORS.line}`, background: form.tipoTrabajo === "taller" ? "#EFF6FF" : COLORS.surface, color: form.tipoTrabajo === "taller" ? COLORS.amber : COLORS.textDim, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
          >
            En el taller
          </button>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, tipoTrabajo: "domicilio" }))}
            style={{ flex: 1, padding: "9px 10px", borderRadius: 8, border: `1.5px solid ${form.tipoTrabajo === "domicilio" ? COLORS.statusBlue : COLORS.line}`, background: form.tipoTrabajo === "domicilio" ? "#EFF6FF" : COLORS.surface, color: form.tipoTrabajo === "domicilio" ? COLORS.statusBlue : COLORS.textDim, fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
          >
            <MapPin size={13} /> A domicilio
          </button>
        </div>

        <label style={{ fontSize: 12, color: COLORS.textDim }}>Cliente
          <input style={inputStyle} value={form.nombreCliente} onChange={set("nombreCliente")} placeholder="Nombre y apellidos" />
        </label>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Teléfono
          <input style={inputStyle} value={form.telefono} onChange={set("telefono")} placeholder="600 000 000" />
        </label>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Email <span style={{ color: COLORS.textDim, fontWeight: 400 }}>(para enviarle el comprobante)</span>
          <input style={inputStyle} type="email" value={form.email} onChange={set("email")} placeholder="cliente@email.com" />
        </label>

        {form.tipoTrabajo === "domicilio" && (
          <>
            <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Dirección del servicio
              <input style={inputStyle} value={form.direccionServicio} onChange={set("direccionServicio")} placeholder="Calle, número, población" />
            </label>
            <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 10 }}>Categoría <span style={{ fontWeight: 400 }}>(opcional)</span></div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {CATEGORIAS_DOMICILIO.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, categoria: f.categoria === c.key ? "" : c.key }))}
                  style={{ fontSize: 11.5, fontWeight: 600, padding: "6px 10px", borderRadius: 999, border: `1px solid ${form.categoria === c.key ? COLORS.statusBlue : COLORS.line}`, background: form.categoria === c.key ? COLORS.statusBlue : COLORS.surface, color: form.categoria === c.key ? "#FFFFFF" : COLORS.textDim, cursor: "pointer" }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </>
        )}

        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>
          {form.tipoTrabajo === "domicilio" ? "Descripción del servicio" : "Equipo"}
          <input style={inputStyle} value={form.equipo} onChange={set("equipo")} placeholder={form.tipoTrabajo === "domicilio" ? "Ej. Instalación CCTV, 4 cámaras" : "Ej. HP Pavilion 15"} />
        </label>
        {form.tipoTrabajo === "taller" && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <label style={{ fontSize: 12, color: COLORS.textDim, flex: 1 }}>Marca <span style={{ fontWeight: 400 }}>(opcional)</span>
              <input style={inputStyle} value={form.marca} onChange={set("marca")} placeholder="HP" />
            </label>
            <label style={{ fontSize: 12, color: COLORS.textDim, flex: 1 }}>Modelo <span style={{ fontWeight: 400 }}>(opcional)</span>
              <input style={inputStyle} value={form.modelo} onChange={set("modelo")} placeholder="Pavilion 15" />
            </label>
          </div>
        )}
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Problema reportado
          <input style={inputStyle} value={form.problema} onChange={set("problema")} placeholder="Ej. No enciende" />
        </label>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Fecha estimada de entrega <span style={{ fontWeight: 400 }}>(opcional)</span>
          <input style={inputStyle} type="date" value={form.fechaEstimada} onChange={set("fechaEstimada")} />
        </label>
        <label style={{ fontSize: 12.5, color: COLORS.text, display: "flex", alignItems: "center", gap: 7, marginTop: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={form.urgente} onChange={(e) => setForm((f) => ({ ...f, urgente: e.target.checked }))} style={{ width: 15, height: 15 }} />
          Marcar como urgente
        </label>

        <button disabled={guardando} onClick={guardar} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), width: "100%", marginTop: 18, padding: "10px 12px" }}>
          {guardando ? "Guardando..." : "Dar de alta"}
        </button>
      </div>
    </div>
  );
}

// -------------------- vista: Clientes --------------------
function ClientesView() {
  const [clientes, setClientes] = useState([]);
  const [query, setQuery] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [formEdicion, setFormEdicion] = useState({ telefono: "", email: "" });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const cargar = useCallback(async (q) => {
    setCargando(true);
    try {
      const data = await apiGet(`/clientes${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      setClientes(data);
    } catch (e) {
      // silencioso: el aviso general del backend ya se muestra en la vista de Reparaciones
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => cargar(query), 300);
    return () => clearTimeout(t);
  }, [query, cargar]);

  async function verDetalle(cliente) {
    setSeleccionado(cliente);
    setDetalle(null);
    setEditando(false);
    try {
      const data = await apiGet(`/clientes/${cliente.id}`);
      setDetalle(data);
      setFormEdicion({ telefono: data.telefono || "", email: data.email || "", nif: data.nif || "" });
    } catch (e) {
      setDetalle({ error: e.message });
    }
  }

  async function guardarEdicion() {
    setGuardandoEdicion(true);
    try {
      const res = await fetch(`${API_BASE}/clientes/${detalle.id}`, {
        method: "PUT",
        headers: cabecerasAuth({ "Content-Type": "application/json" }),
        body: JSON.stringify({ telefono: formEdicion.telefono, email: formEdicion.email, nif: formEdicion.nif }),
      });
      manejar401(res);
      const actualizado = await res.json();
      setDetalle((d) => ({ ...d, ...actualizado }));
      setClientes((prev) => prev.map((c) => (c.id === actualizado.id ? { ...c, ...actualizado } : c)));
      setEditando(false);
    } catch (e) {
      // se puede mejorar con mensaje visible si hace falta
    } finally {
      setGuardandoEdicion(false);
    }
  }

  return (
    <div className="fn-content-flex" style={{ display: "flex", gap: 20 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="fn-search" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "8px 12px", maxWidth: 320 }}>
          <Search size={14} color={COLORS.textDim} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente por nombre..." style={{ background: "none", border: "none", outline: "none", color: COLORS.text, fontSize: 13, width: "100%" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cargando && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando clientes...</div>}
          {!cargando && clientes.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>No hay clientes todavía.</div>}
          {clientes.map((c) => (
            <button
              key={c.id}
              onClick={() => verDetalle(c)}
              style={{
                background: seleccionado?.id === c.id ? COLORS.surfaceRaised : COLORS.surface,
                border: `1px solid ${seleccionado?.id === c.id ? COLORS.amber : COLORS.line}`,
                borderRadius: 10, padding: "12px 14px", textAlign: "left", cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.amber }}>{c.codigo}</span>
                  <span style={{ fontWeight: 600, fontSize: 13.5, color: COLORS.text }}>{c.nombre}</span>
                </div>
                <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>{c.telefono || "Sin teléfono"}{c.email ? ` · ${c.email}` : ""}</div>
              </div>
              <ChevronRight size={16} color={COLORS.textDim} />
            </button>
          ))}
        </div>
      </div>

      <div className="fn-side-panel" style={{ width: 300, flexShrink: 0 }}>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 18, minHeight: 200 }}>
          {!seleccionado && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Selecciona un cliente para ver su historial.</div>}
          {seleccionado && !detalle && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>}
          {detalle && !detalle.error && (
            <>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.amber }}>{detalle.codigo}</div>
              <div style={{ fontFamily: "Oswald", fontSize: 16, color: COLORS.text, marginBottom: 4 }}>{detalle.nombre}</div>

              {!editando ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: COLORS.textDim }}>{detalle.telefono || "Sin teléfono"}{detalle.email ? ` · ${detalle.email}` : " · Sin email"}{detalle.nif ? ` · NIF ${detalle.nif}` : ""}</div>
                  <button onClick={() => setEditando(true)} style={{ background: "none", border: "none", color: COLORS.amber, fontSize: 11.5, cursor: "pointer", padding: 0 }}>Editar</button>
                </div>
              ) : (
                <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                  <input
                    value={formEdicion.telefono}
                    onChange={(e) => setFormEdicion((f) => ({ ...f, telefono: e.target.value }))}
                    placeholder="Teléfono"
                    style={{ fontSize: 12.5, padding: "7px 9px", borderRadius: 6, border: `1px solid ${COLORS.line}` }}
                  />
                  <input
                    value={formEdicion.email}
                    onChange={(e) => setFormEdicion((f) => ({ ...f, email: e.target.value }))}
                    placeholder="Email"
                    type="email"
                    style={{ fontSize: 12.5, padding: "7px 9px", borderRadius: 6, border: `1px solid ${COLORS.line}` }}
                  />
                  <input
                    value={formEdicion.nif}
                    onChange={(e) => setFormEdicion((f) => ({ ...f, nif: e.target.value }))}
                    placeholder="NIF (para factura)"
                    style={{ fontSize: 12.5, padding: "7px 9px", borderRadius: 6, border: `1px solid ${COLORS.line}` }}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button disabled={guardandoEdicion} onClick={guardarEdicion} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), padding: "6px 10px", fontSize: 11.5 }}>
                      {guardandoEdicion ? "Guardando..." : "Guardar"}
                    </button>
                    <button onClick={() => setEditando(false)} style={{ ...btnStyle("transparent", COLORS.textDim, COLORS.line), padding: "6px 10px", fontSize: 11.5 }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
                Historial ({detalle.reparaciones?.length || 0})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(detalle.reparaciones || []).map((r) => {
                  const listaHist = stagesFor(r.tipo_trabajo);
                  const st = listaHist.find((s) => s.key === r.estado_actual) || listaHist[0];
                  return (
                    <div key={r.id} style={{ borderLeft: `2px solid ${st.accent}`, paddingLeft: 8 }}>
                      <div style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: st.accent }}>#{r.numero_orden}</div>
                      <div style={{ fontSize: 12.5, color: COLORS.text }}>{r.equipo}</div>
                      <div style={{ fontSize: 11, color: COLORS.textDim }}>{st.label}</div>
                    </div>
                  );
                })}
                {detalle.reparaciones?.length === 0 && <div style={{ fontSize: 12, color: COLORS.textDim }}>Sin reparaciones registradas.</div>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------- vista: Reportes --------------------
// -------------------- Panel de próxima acción --------------------
const ACCION_POR_ESTADO = {
  recibido: "Enviar a diagnóstico",
  diagnostico: "Iniciar reparación (en taller)",
  reparacion: "Marcar como listo",
  listo: "Marcar como entregado",
  contratado: "Iniciar servicio",
  en_proceso: "Marcar como completado",
};

function PanelProximaAccion({ reparaciones, onAbrir }) {
  const prioritaria = useMemo(() => {
    const activas = reparaciones.filter((r) => !["entregado", "no_reparable", "completado"].includes(r.estado_actual));
    if (activas.length === 0) return null;
    return [...activas].sort(
      (a, b) => (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0) || new Date(a.fecha_recepcion) - new Date(b.fecha_recepcion)
    )[0];
  }, [reparaciones]);

  if (!prioritaria) return null;

  const enlaceWhatsapp = prioritaria.cliente?.telefono
    ? `https://wa.me/${prioritaria.cliente.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${prioritaria.cliente.nombre.split(" ")[0]}, te escribimos sobre tu reparación nº ${prioritaria.numero_orden}.`)}`
    : null;

  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontSize: 12, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 }}>Próxima acción</div>
      <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 600, marginTop: 6 }}>
        {prioritaria.urgente && <Flame size={12} color={COLORS.rust} style={{ marginRight: 4, verticalAlign: -1 }} />}
        {prioritaria.cliente?.nombre} · #{prioritaria.numero_orden}
      </div>
      <div style={{ fontSize: 11.5, color: COLORS.textDim }}>{prioritaria.equipo}</div>
      {prioritaria.problema_reportado && (
        <div style={{ fontSize: 11, color: COLORS.textDim, fontStyle: "italic", marginTop: 2, marginBottom: 12 }}>"{prioritaria.problema_reportado}"</div>
      )}
      {!prioritaria.problema_reportado && <div style={{ marginBottom: 12 }} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          onClick={() => onAbrir(prioritaria)}
          style={{ ...btnStyle(COLORS.green, "#FFFFFF"), padding: "11px 12px", fontSize: 12.5, borderRadius: 9, boxShadow: "0 4px 10px rgba(34,197,94,0.3)" }}
        >
          {ACCION_POR_ESTADO[prioritaria.estado_actual] || "Ver reparación"}
        </button>
        <a
          href={enlaceWhatsapp || undefined}
          target="_blank"
          rel="noreferrer"
          style={{ ...btnStyle(COLORS.statusAmber, "#FFFFFF"), padding: "11px 12px", fontSize: 12.5, borderRadius: 9, textDecoration: "none", opacity: enlaceWhatsapp ? 1 : 0.5, pointerEvents: enlaceWhatsapp ? "auto" : "none", boxShadow: enlaceWhatsapp ? "0 4px 10px rgba(245,158,11,0.3)" : "none" }}
        >
          Contactar cliente (WhatsApp)
        </a>
        <button
          onClick={() => onAbrir(prioritaria)}
          style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), padding: "11px 12px", fontSize: 12.5, borderRadius: 9, boxShadow: "0 4px 10px rgba(37,99,235,0.3)" }}
        >
          Generar presupuesto
        </button>
      </div>
    </div>
  );
}

function ReportesView({ reporteDiario, reporteMensual, contador, tendencia }) {
  const num = (v) => Number(v || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontFamily: "Oswald", fontSize: 16, color: COLORS.text, marginBottom: 4 }}>Últimos 7 días</div>
        <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 14 }}>Ingresos frente a gastos, día a día</div>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tendencia}>
              <XAxis dataKey="dia_semana" tick={{ fill: COLORS.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: COLORS.textDim, fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.line}`, borderRadius: 8, fontSize: 11 }}
                formatter={(value, name) => [`${Number(value).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`, name === "ingresos" ? "Ingresos" : "Gastos"]}
              />
              <Bar dataKey="ingresos" fill={COLORS.green} radius={[4, 4, 0, 0]} name="ingresos" />
              <Bar dataKey="gastos" fill={COLORS.rust} radius={[4, 4, 0, 0]} name="gastos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontFamily: "Oswald", fontSize: 16, color: COLORS.text, marginBottom: 14 }}>Hoy</div>
          <Row label="Equipos recibidos" value={reporteDiario.equipos_recibidos ?? 0} />
          <Row label="Equipos entregados" value={reporteDiario.equipos_entregados ?? 0} />
          <Row label="Ingresos" value={`${num(reporteDiario.ingresos)} €`} />
          <Row label="Gastos" value={`${num(reporteDiario.gastos)} €`} />
          <div style={{ borderTop: `1px solid ${COLORS.line}`, marginTop: 8, paddingTop: 8 }}>
            <Row label="Balance neto" value={`${num(reporteDiario.balance_neto)} €`} />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 260, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontFamily: "Oswald", fontSize: 16, color: COLORS.text, marginBottom: 14 }}>Este mes ({reporteMensual.mes})</div>
          <Row label="Reparaciones entregadas" value={reporteMensual.reparaciones_entregadas ?? 0} />
          <Row label="No reparables" value={reporteMensual.reparaciones_no_reparables ?? 0} />
          <Row label="Ticket medio" value={`${num(reporteMensual.ticket_medio)} €`} />
          <Row label="Ingresos" value={`${num(reporteMensual.ingresos)} €`} />
          <Row label="Gastos" value={`${num(reporteMensual.gastos)} €`} />
          <div style={{ borderTop: `1px solid ${COLORS.line}`, marginTop: 8, paddingTop: 8 }}>
            <Row label="Balance neto" value={`${num(reporteMensual.balance_neto)} €`} />
          </div>
        </div>
      </div>

      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontFamily: "Oswald", fontSize: 16, color: COLORS.text, marginBottom: 14 }}>Contador de reparaciones</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <StatCard label="Totales" value={contador.total} icon={Ticket} accent={COLORS.amber} destacada />
          <StatCard label="En curso" value={contador.en_curso} icon={CircleDot} accent={COLORS.teal} />
          <StatCard label="Entregadas" value={contador.entregadas} icon={ShieldCheck} accent={COLORS.green} />
          <StatCard label="No reparables" value={contador.no_reparables} icon={TriangleAlert} accent={COLORS.statusAmber} />
        </div>
      </div>
    </div>
  );
}

// -------------------- vista: Caja --------------------
function CajaView({ onMovimientoCreado }) {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ tipo: "gasto", concepto: "", monto: "", metodo_pago: "efectivo" });
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await apiGet("/finanzas");
      setMovimientos(data);
    } catch (e) {
      // el aviso general ya se ve en Reparaciones
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function guardar() {
    if (!form.monto) return;
    setGuardando(true);
    try {
      await apiPost("/finanzas", { ...form, monto: parseFloat(form.monto) });
      setForm({ tipo: "gasto", concepto: "", monto: "", metodo_pago: "efectivo" });
      setMostrarForm(false);
      cargar();
      onMovimientoCreado?.();
    } catch (e) {
      // silencioso, se puede mejorar con un mensaje visible si hace falta
    } finally {
      setGuardando(false);
    }
  }

  const inputStyle = { width: "100%", fontSize: 13, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={() => setMostrarForm((v) => !v)} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "9px 14px" }}>
          <Plus size={14} /> Nuevo movimiento
        </button>
      </div>

      {mostrarForm && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Tipo</div>
            <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} style={inputStyle}>
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Concepto</div>
            <input style={inputStyle} value={form.concepto} onChange={(e) => setForm((f) => ({ ...f, concepto: e.target.value }))} placeholder="Ej. Compra de repuestos" />
          </div>
          <div style={{ width: 110 }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Monto (€)</div>
            <input style={inputStyle} type="number" value={form.monto} onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))} placeholder="0.00" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Método</div>
            <select value={form.metodo_pago} onChange={(e) => setForm((f) => ({ ...f, metodo_pago: e.target.value }))} style={inputStyle}>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
          <button disabled={guardando} onClick={guardar} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "9px 16px" }}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      )}

      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, overflow: "hidden" }}>
        {cargando && <div style={{ padding: 16, fontSize: 12.5, color: COLORS.textDim }}>Cargando movimientos...</div>}
        {!cargando && movimientos.length === 0 && <div style={{ padding: 16, fontSize: 12.5, color: COLORS.textDim }}>Sin movimientos registrados todavía.</div>}
        {movimientos.map((m, i) => (
          <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: i === 0 ? "none" : `1px solid ${COLORS.line}` }}>
            <div>
              <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{m.concepto || (m.tipo === "ingreso" ? "Ingreso" : "Gasto")}</div>
              <div style={{ fontSize: 11.5, color: COLORS.textDim }}>{fechaLarga(m.fecha)}{m.metodo_pago ? ` · ${m.metodo_pago}` : ""}</div>
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13.5, color: m.tipo === "ingreso" ? COLORS.green : COLORS.rust }}>
              {m.tipo === "ingreso" ? "+" : "−"}{Number(m.monto).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------- vista: Ajustes (datos del negocio para el recibo) --------------------
// -------------------- vista: Inventario --------------------
function InventarioView() {
  const [repuestos, setRepuestos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", categoria: "", proveedor_id: "", stock_actual: 0, stock_minimo: 1, precio_compra: "", precio_venta: "" });
  const [guardando, setGuardando] = useState(false);
  const [reponiendo, setReponiendo] = useState({});

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [rep, prov] = await Promise.all([apiGet("/repuestos"), apiGet("/proveedores")]);
      setRepuestos(rep);
      setProveedores(prov);
    } catch (e) {
      /* el aviso general ya se ve en Reparaciones */
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crearRepuesto() {
    if (!form.nombre.trim()) return;
    setGuardando(true);
    try {
      await apiPost("/repuestos", {
        ...form,
        proveedor_id: form.proveedor_id || null,
        stock_actual: parseInt(form.stock_actual, 10) || 0,
        stock_minimo: parseInt(form.stock_minimo, 10) || 1,
        precio_compra: parseFloat(form.precio_compra) || 0,
        precio_venta: parseFloat(form.precio_venta) || 0,
      });
      setForm({ nombre: "", categoria: "", proveedor_id: "", stock_actual: 0, stock_minimo: 1, precio_compra: "", precio_venta: "" });
      setMostrarForm(false);
      cargar();
    } catch (e) {
      /* se puede mejorar con mensaje visible si hace falta */
    } finally {
      setGuardando(false);
    }
  }

  async function reponerStock(repuestoId, cantidad) {
    if (!cantidad) return;
    setReponiendo((prev) => ({ ...prev, [repuestoId]: true }));
    try {
      const actualizado = await apiPatch(`/repuestos/${repuestoId}/stock`, { cantidad: parseInt(cantidad, 10) });
      setRepuestos((prev) => prev.map((r) => (r.id === repuestoId ? actualizado : r)));
    } catch (e) {
      /* silencioso */
    } finally {
      setReponiendo((prev) => ({ ...prev, [repuestoId]: false }));
    }
  }

  const inputStyle = { fontSize: 12.5, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={() => setMostrarForm((v) => !v)} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "9px 14px" }}>
          <Plus size={14} /> Nuevo repuesto
        </button>
      </div>

      {mostrarForm && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 160px" }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Nombre</div>
            <input style={{ ...inputStyle, width: "100%" }} value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Ej. Pantalla 15.6 FHD" />
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Categoría</div>
            <input style={{ ...inputStyle, width: "100%" }} value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} placeholder="Pantallas" />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Proveedor</div>
            <select style={{ ...inputStyle, width: "100%" }} value={form.proveedor_id} onChange={(e) => setForm((f) => ({ ...f, proveedor_id: e.target.value }))}>
              <option value="">Sin proveedor</option>
              {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div style={{ width: 90 }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Stock inicial</div>
            <input style={{ ...inputStyle, width: "100%" }} type="number" value={form.stock_actual} onChange={(e) => setForm((f) => ({ ...f, stock_actual: e.target.value }))} />
          </div>
          <div style={{ width: 90 }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Stock mínimo</div>
            <input style={{ ...inputStyle, width: "100%" }} type="number" value={form.stock_minimo} onChange={(e) => setForm((f) => ({ ...f, stock_minimo: e.target.value }))} />
          </div>
          <div style={{ width: 100 }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Precio compra</div>
            <input style={{ ...inputStyle, width: "100%" }} type="number" value={form.precio_compra} onChange={(e) => setForm((f) => ({ ...f, precio_compra: e.target.value }))} placeholder="0.00" />
          </div>
          <div style={{ width: 100 }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Precio venta</div>
            <input style={{ ...inputStyle, width: "100%" }} type="number" value={form.precio_venta} onChange={(e) => setForm((f) => ({ ...f, precio_venta: e.target.value }))} placeholder="0.00" />
          </div>
          <button disabled={guardando} onClick={crearRepuesto} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "9px 16px" }}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      )}

      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, overflow: "hidden" }}>
        {cargando && <div style={{ padding: 16, fontSize: 12.5, color: COLORS.textDim }}>Cargando inventario...</div>}
        {!cargando && repuestos.length === 0 && <div style={{ padding: 16, fontSize: 12.5, color: COLORS.textDim }}>Sin repuestos registrados todavía.</div>}
        {repuestos.map((r, i) => (
          <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: i === 0 ? "none" : `1px solid ${COLORS.line}`, gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{r.nombre}</div>
              <div style={{ fontSize: 11.5, color: COLORS.textDim }}>{r.categoria || "Sin categoría"} · venta {Number(r.precio_venta).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {r.stock_bajo && <TriangleAlert size={14} color={COLORS.rust} />}
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: r.stock_bajo ? COLORS.rust : COLORS.text }}>
                {r.stock_actual} uds
              </span>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="number"
                placeholder="+cant."
                style={{ width: 70, fontSize: 12, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value) {
                    reponerStock(r.id, e.target.value);
                    e.target.value = "";
                  }
                }}
              />
              <span style={{ fontSize: 10.5, color: COLORS.textDim }}>{reponiendo[r.id] ? "..." : "Enter"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------- vista: Plantillas de mensaje --------------------
const NOMBRES_ESTADOS_PLANTILLA = {
  recibido: "Recibido", diagnostico: "En diagnóstico", reparacion: "En reparación",
  listo: "Listo para entrega", entregado: "Entregado", no_reparable: "No reparable",
};

function PlantillasView() {
  const [plantillas, setPlantillas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: "", texto: "", estado_disparador: "" });
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setPlantillas(await apiGet("/plantillas"));
    } catch (e) {
      /* el aviso general ya se ve en Reparaciones */
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function abrirNueva() {
    setEditando(null);
    setForm({ nombre: "", texto: "", estado_disparador: "" });
    setMostrarForm(true);
  }
  function abrirEdicion(p) {
    setEditando(p);
    setForm({ nombre: p.nombre, texto: p.texto, estado_disparador: p.estado_disparador || "" });
    setMostrarForm(true);
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.texto.trim()) return;
    setGuardando(true);
    try {
      const payload = { nombre: form.nombre, texto: form.texto, estado_disparador: form.estado_disparador || null };
      if (editando) {
        const res = await fetch(`${API_BASE}/plantillas/${editando.id}`, { method: "PUT", headers: cabecerasAuth({ "Content-Type": "application/json" }), body: JSON.stringify(payload) });
        manejar401(res);
      } else {
        await apiPost("/plantillas", payload);
      }
      setMostrarForm(false);
      cargar();
    } catch (e) {
      /* se puede mejorar con mensaje visible si hace falta */
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(id) {
    try {
      const res = await fetch(`${API_BASE}/plantillas/${id}`, { method: "DELETE", headers: cabecerasAuth() });
      manejar401(res);
      if (res.ok) setPlantillas((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      /* silencioso */
    }
  }

  const inputStyle = { width: "100%", fontSize: 12.5, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box", marginTop: 4 };

  return (
    <div>
      <div style={{ fontSize: 12.5, color: COLORS.textDim, marginBottom: 14 }}>
        Mensajes predefinidos para casos comunes. Si le asignas un estado, se prepara automáticamente (con el enlace de WhatsApp listo) cada vez que muevas una reparación a ese estado — usa <code>{"{cliente}"}</code>, <code>{"{equipo}"}</code>, <code>{"{numero_orden}"}</code>, <code>{"{estado}"}</code>, <code>{"{fecha_estimada}"}</code>, <code>{"{garantia}"}</code> en el texto.
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={abrirNueva} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "9px 14px" }}>
          <Plus size={14} /> Nueva plantilla
        </button>
      </div>

      {mostrarForm && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: COLORS.textDim }}>Nombre
            <input style={inputStyle} value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Ej. Equipo listo para retirar" />
          </label>
          <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Texto del mensaje
            <textarea style={{ ...inputStyle, minHeight: 70, fontFamily: "inherit", resize: "vertical" }} value={form.texto} onChange={(e) => setForm((f) => ({ ...f, texto: e.target.value }))} placeholder="Hola {cliente}, tu {equipo} ya está listo..." />
          </label>
          <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Enviar automáticamente al llegar a este estado <span style={{ fontWeight: 400 }}>(opcional)</span>
            <select style={inputStyle} value={form.estado_disparador} onChange={(e) => setForm((f) => ({ ...f, estado_disparador: e.target.value }))}>
              <option value="">Ninguno (solo uso manual)</option>
              {Object.entries(NOMBRES_ESTADOS_PLANTILLA).map(([codigo, nombre]) => (
                <option key={codigo} value={codigo}>{nombre}</option>
              ))}
            </select>
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button disabled={guardando} onClick={guardar} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: 1, padding: "9px 12px" }}>
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={() => setMostrarForm(false)} style={{ ...btnStyle("transparent", COLORS.textDim, COLORS.line), flex: "none", padding: "9px 14px" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, overflow: "hidden" }}>
        {cargando && <div style={{ padding: 16, fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>}
        {!cargando && plantillas.length === 0 && <div style={{ padding: 16, fontSize: 12.5, color: COLORS.textDim }}>Sin plantillas todavía.</div>}
        {plantillas.map((p, i) => (
          <div key={p.id} style={{ padding: "12px 16px", borderTop: i === 0 ? "none" : `1px solid ${COLORS.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{p.nombre}</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                {p.estado_disparador && (
                  <span style={{ fontSize: 10.5, color: COLORS.amber, background: "#FFFBEB", padding: "2px 7px", borderRadius: 999, whiteSpace: "nowrap" }}>
                    Auto: {NOMBRES_ESTADOS_PLANTILLA[p.estado_disparador]}
                  </span>
                )}
                <button onClick={() => abrirEdicion(p)} style={{ background: "none", border: "none", color: COLORS.amber, fontSize: 11.5, cursor: "pointer", padding: 0 }}>Editar</button>
                <button onClick={() => borrar(p.id)} style={{ background: "none", border: "none", color: COLORS.rust, cursor: "pointer", padding: 0, display: "flex" }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 4 }}>{p.texto}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AjustesView() {
  const [form, setForm] = useState({ nombre_negocio: "", eslogan: "", direccion: "", telefono: "", email: "", nif: "", iva_pct: 21, suplemento_desplazamiento: 20 });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/configuracion")
      .then((data) => setForm({
        nombre_negocio: data.nombre_negocio || "", eslogan: data.eslogan || "",
        direccion: data.direccion || "", telefono: data.telefono || "", email: data.email || "",
        nif: data.nif || "", iva_pct: data.iva_pct ?? 21, suplemento_desplazamiento: data.suplemento_desplazamiento ?? 20,
      }))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  function set(field) {
    return (e) => { setForm((f) => ({ ...f, [field]: e.target.value })); setGuardado(false); };
  }

  async function guardar() {
    setGuardando(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/configuracion`, {
        method: "PUT",
        headers: cabecerasAuth({ "Content-Type": "application/json" }),
        body: JSON.stringify({ ...form, iva_pct: parseFloat(form.iva_pct) || 21, suplemento_desplazamiento: parseFloat(form.suplemento_desplazamiento) || 0 }),
      });
      manejar401(res);
      if (!res.ok) throw new Error("No se pudo guardar");
      setGuardado(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  const inputStyle = { width: "100%", fontSize: 13, padding: "9px 11px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box", marginTop: 4 };

  if (cargando) return <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 440 }}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontFamily: "Oswald", fontSize: 16, color: COLORS.text, marginBottom: 4 }}>Datos del negocio</div>
        <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 16 }}>Aparecen en los comprobantes que generas para tus clientes.</div>

        {error && <div style={{ fontSize: 12, color: COLORS.rust, marginBottom: 10 }}>{error}</div>}

        <label style={{ fontSize: 12, color: COLORS.textDim }}>Nombre del negocio
          <input style={inputStyle} value={form.nombre_negocio} onChange={set("nombre_negocio")} placeholder="Firztnet" />
        </label>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Eslogan / descripción corta
          <input style={inputStyle} value={form.eslogan} onChange={set("eslogan")} placeholder="Reparación y soporte técnico" />
        </label>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Dirección
          <input style={inputStyle} value={form.direccion} onChange={set("direccion")} placeholder="Calle Mayor 12, Fuenlabrada" />
        </label>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Teléfono
          <input style={inputStyle} value={form.telefono} onChange={set("telefono")} placeholder="910 000 000" />
        </label>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Email
          <input style={inputStyle} value={form.email} onChange={set("email")} placeholder="info@firztnet.es" />
        </label>
        <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 18, marginBottom: 4, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
          Datos fiscales (para facturas)
        </div>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 8 }}>Tu NIF
          <input style={inputStyle} value={form.nif} onChange={set("nif")} placeholder="12345678Z" />
        </label>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>% de IVA que aplicas
          <input style={inputStyle} type="number" value={form.iva_pct} onChange={set("iva_pct")} placeholder="21" />
        </label>

        <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 18, marginBottom: 4, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
          Servicios a domicilio
        </div>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 8 }}>Suplemento de desplazamiento (€)
          <input style={inputStyle} type="number" value={form.suplemento_desplazamiento} onChange={set("suplemento_desplazamiento")} placeholder="20" />
        </label>

        <button disabled={guardando} onClick={guardar} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), width: "100%", marginTop: 18, padding: "10px 12px" }}>
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
        {guardado && <div style={{ fontSize: 12, color: COLORS.green, marginTop: 8 }}>Guardado. Los próximos comprobantes ya usarán estos datos.</div>}
      </div>
    </div>
  );
}

// -------------------- pantalla de login --------------------
function LoginScreen({ onEntrar }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setError("");
    setEntrando(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar sesión");
      guardarToken(data.token);
      onEntrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setEntrando(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <link rel="stylesheet" href={FONTS_URL} />
      <form onSubmit={entrar} style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 32, width: 320, maxWidth: "90vw" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22, justifyContent: "center" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: COLORS.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wrench size={18} color="#FFFFFF" />
          </div>
          <span style={{ fontFamily: "Oswald", fontSize: 20, letterSpacing: 0.5, color: COLORS.text }}>FIRZTNET</span>
        </div>

        {error && <div style={{ fontSize: 12.5, color: COLORS.rust, marginBottom: 12, textAlign: "center" }}>{error}</div>}

        <label style={{ fontSize: 12, color: COLORS.textDim }}>Usuario
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", fontSize: 13, padding: "9px 11px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box", marginTop: 4 }}
            autoFocus
          />
        </label>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 12 }}>Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", fontSize: 13, padding: "9px 11px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box", marginTop: 4 }}
          />
        </label>

        <button type="submit" disabled={entrando} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), width: "100%", marginTop: 20, padding: "10px 12px" }}>
          {entrando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

// -------------------- página pública de seguimiento (sin login) --------------------
function SeguimientoPublico() {
  const [numeroOrden, setNumeroOrden] = useState("");
  const [identificador, setIdentificador] = useState("");
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mostrarFirmaPresupuesto, setMostrarFirmaPresupuesto] = useState(false);
  const [guardandoRespuesta, setGuardandoRespuesta] = useState(false);

  const tokenDeUrl = useMemo(() => new URLSearchParams(window.location.search).get("token"), []);

  const consultar = useCallback(async (token) => {
    setCargando(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/seguimiento/${token}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se encontró esa reparación");
      setDatos(data);
    } catch (e) {
      setError(e.message);
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }, []);

  async function buscarPorNumero(e) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/seguimiento/buscar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero_orden: numeroOrden, identificador }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se encontró esa reparación");
      setDatos(data);
    } catch (e) {
      setError(e.message);
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }

  async function responderPresupuesto(aceptado, firmaPng) {
    const token = tokenDeUrl || datos?.token_seguimiento;
    setGuardandoRespuesta(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/seguimiento/${token}/presupuesto/firmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aceptado, firma_png: firmaPng || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar tu respuesta");
      setDatos(data);
      setMostrarFirmaPresupuesto(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardandoRespuesta(false);
    }
  }

  useEffect(() => {
    if (tokenDeUrl) consultar(tokenDeUrl);
  }, [tokenDeUrl, consultar]);

  const stage = datos && (stagesFor(datos.tipo_trabajo).find((s) => s.key === datos.estado_actual) || stagesFor(datos.tipo_trabajo)[0]);
  const ICONOS_ESTADO = { recibido: Package, diagnostico: Search, reparacion: Wrench, listo: CheckCircle2, entregado: ShieldCheck, no_reparable: XCircle, contratado: Package, en_proceso: Wrench, completado: ShieldCheck };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #EFF6FF 0%, #F8FAFC 45%, #F8FAFC 100%)", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <link rel="stylesheet" href={FONTS_URL} />
      <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "30px 26px", width: 400, maxWidth: "100%", boxShadow: "0 20px 50px -12px rgba(37,99,235,0.18), 0 4px 16px rgba(15,23,42,0.06)", border: "1px solid #EEF2F7" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 24, justifyContent: "center" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.amber}, #1D4ED8)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(37,99,235,0.35)" }}>
            <Wrench size={17} color="#FFFFFF" />
          </div>
          <span style={{ fontFamily: "Oswald", fontSize: 19, letterSpacing: 0.5, color: COLORS.text }}>FIRZTNET</span>
        </div>

        {!tokenDeUrl && !datos && (
          <form onSubmit={buscarPorNumero}>
            <div style={{ fontSize: 13.5, color: COLORS.textDim, marginBottom: 16, textAlign: "center" }}>
              Consulta el estado de tu reparación
            </div>
            <label style={{ fontSize: 12, color: COLORS.textDim, fontWeight: 500 }}>Nº de orden
              <input
                value={numeroOrden}
                onChange={(e) => setNumeroOrden(e.target.value)}
                placeholder="2026-0001"
                style={{ width: "100%", fontSize: 13.5, padding: "10px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0", boxSizing: "border-box", marginTop: 5, outline: "none" }}
                required
              />
            </label>
            <label style={{ fontSize: 12, color: COLORS.textDim, fontWeight: 500, display: "block", marginTop: 12 }}>Tu DNI o teléfono
              <input
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="Para confirmar que eres tú"
                style={{ width: "100%", fontSize: 13.5, padding: "10px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0", boxSizing: "border-box", marginTop: 5, outline: "none" }}
                required
              />
            </label>
            <button type="submit" disabled={cargando} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), width: "100%", marginTop: 18, padding: "11px 12px", borderRadius: 10, boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}>
              {cargando ? "Consultando..." : "Consultar"}
            </button>
          </form>
        )}

        {cargando && !datos && <div style={{ fontSize: 13, color: COLORS.textDim, textAlign: "center" }}>Consultando...</div>}
        {error && <div style={{ fontSize: 13, color: "#FFF", textAlign: "center", background: COLORS.rust, borderRadius: 9, padding: "8px 12px", marginTop: 8 }}>{error}</div>}

        {datos && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: COLORS.amber, fontWeight: 600, letterSpacing: 0.3 }}>#{datos.numero_orden}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.text, marginTop: 3 }}>{datos.equipo}</div>
              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10,
                  fontSize: 12, fontWeight: 700, color: stage.accent === COLORS.textDim ? "#475569" : stage.accent,
                  background: datos.estado_actual === "no_reparable" ? "#FEF2F2" : datos.estado_actual === "entregado" ? "#F0FDF4" : datos.estado_actual === "listo" ? "#F0FDF4" : "#EFF6FF",
                  padding: "5px 12px", borderRadius: 999,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "currentColor" }} />
                {datos.estado_label || stage.label}
              </div>
            </div>

            <div style={{ position: "relative", paddingLeft: 4 }}>
              {stagesFor(datos.tipo_trabajo).filter((s) => s.key !== "no_reparable").map((s, i, arr) => {
                const listaPublica = stagesFor(datos.tipo_trabajo);
                const idxActual = listaPublica.findIndex((x) => x.key === datos.estado_actual);
                const idxEsta = listaPublica.findIndex((x) => x.key === s.key);
                const completado = datos.estado_actual !== "no_reparable" && idxEsta <= idxActual;
                const esActual = datos.estado_actual !== "no_reparable" && idxEsta === idxActual;
                const Icono = ICONOS_ESTADO[s.key] || Package;
                const esUltimo = i === arr.length - 1;
                return (
                  <div key={s.key} style={{ display: "flex", gap: 12, position: "relative" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div
                        style={{
                          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: completado ? s.accent : "#F1F5F9",
                          color: completado ? "#FFFFFF" : "#94A3B8",
                          boxShadow: esActual ? `0 0 0 4px ${s.accent}33` : "none",
                          transition: "all .2s",
                        }}
                      >
                        <Icono size={15} />
                      </div>
                      {!esUltimo && (
                        <div style={{ width: 2, flex: 1, minHeight: 26, background: idxEsta < idxActual ? s.accent : "#E2E8F0", marginTop: 2, marginBottom: 2 }} />
                      )}
                    </div>
                    <div style={{ paddingTop: 5, paddingBottom: esUltimo ? 0 : 20 }}>
                      <div style={{ fontSize: 13.5, color: completado ? COLORS.text : "#94A3B8", fontWeight: esActual ? 700 : 500 }}>{s.label}</div>
                    </div>
                  </div>
                );
              })}
              {datos.estado_actual === "no_reparable" && (
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.rust, color: "#FFF" }}>
                    <XCircle size={15} />
                  </div>
                  <div style={{ paddingTop: 5 }}>
                    <div style={{ fontSize: 13.5, color: COLORS.text, fontWeight: 700 }}>No reparable</div>
                    {datos.motivo_no_reparable && (
                      <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 4 }}>{datos.motivo_no_reparable}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {datos.fecha_estimada && !datos.fecha_entrega && datos.estado_actual !== "no_reparable" && (
              <div style={{ marginTop: 6, fontSize: 12.5, color: COLORS.textDim, textAlign: "center", background: "#F8FAFC", borderRadius: 9, padding: "8px 10px" }}>
                Fecha estimada de entrega: <strong style={{ color: COLORS.text }}>{fechaLarga(datos.fecha_estimada)}</strong>
              </div>
            )}

            {datos.presupuesto && (
              <div style={{ marginTop: 18, background: "#F8FAFC", borderRadius: 14, padding: 16, borderLeft: `4px solid ${COLORS.amber}` }}>
                <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6, fontWeight: 600 }}>Presupuesto</div>
                <div style={{ fontSize: 13.5, color: COLORS.text, marginBottom: 4 }}>{datos.presupuesto.descripcion}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, color: COLORS.amber, fontWeight: 700 }}>
                  {datos.presupuesto.importe.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                </div>

                {datos.presupuesto.estado === "aceptado" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: COLORS.green, fontWeight: 700, marginTop: 8 }}>
                    <CheckCircle2 size={15} /> Aceptado, gracias
                  </div>
                )}
                {datos.presupuesto.estado === "rechazado" && (
                  <div style={{ fontSize: 12.5, color: COLORS.rust, fontWeight: 700, marginTop: 8 }}>Rechazado. Contáctanos si quieres comentarlo.</div>
                )}

                {datos.presupuesto.estado === "pendiente" && !mostrarFirmaPresupuesto && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button onClick={() => setMostrarFirmaPresupuesto(true)} style={{ ...btnStyle(COLORS.green, "#FFFFFF"), flex: 1, padding: "10px 12px", fontSize: 13, borderRadius: 9, boxShadow: "0 4px 10px rgba(34,197,94,0.3)" }}>
                      Aceptar y firmar
                    </button>
                    <button disabled={guardandoRespuesta} onClick={() => responderPresupuesto(false)} style={{ ...btnStyle("#FFFFFF", COLORS.rust, "#FCA5A5"), flex: "none", padding: "10px 14px", fontSize: 13, borderRadius: 9 }}>
                      Rechazar
                    </button>
                  </div>
                )}

                {datos.presupuesto.estado === "pendiente" && mostrarFirmaPresupuesto && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 6 }}>Firma aquí para aceptar:</div>
                    <PadFirma onGuardar={(png) => responderPresupuesto(true, png)} guardando={guardandoRespuesta} textoBoton="Aceptar presupuesto" />
                  </div>
                )}
              </div>
            )}

            {datos.fecha_fin_garantia && (
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 7, color: COLORS.green, fontSize: 12.5, background: "#F0FDF4", borderRadius: 9, padding: "9px 12px" }}>
                <ShieldCheck size={15} /> Garantía hasta {fechaLarga(datos.fecha_fin_garantia)}
              </div>
            )}

            {datos.enlace_whatsapp_negocio && (
              <a
                href={datos.enlace_whatsapp_negocio}
                target="_blank"
                rel="noreferrer"
                style={{ ...btnStyle(COLORS.green, "#FFFFFF"), width: "100%", marginTop: 16, textDecoration: "none", boxSizing: "border-box", borderRadius: 10, boxShadow: "0 4px 10px rgba(34,197,94,0.3)" }}
              >
                Escribir por WhatsApp
              </a>
            )}

            {!tokenDeUrl && (
              <button
                onClick={() => { setDatos(null); setNumeroOrden(""); setIdentificador(""); }}
                style={{ background: "none", border: "none", color: COLORS.textDim, fontSize: 12.5, cursor: "pointer", width: "100%", marginTop: 14 }}
              >
                Consultar otra reparación
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FirztnetApp() {
  const esPaginaSeguimiento = window.location.pathname.startsWith("/seguimiento");
  const [autenticado, setAutenticado] = useState(false);
  const [comprobando, setComprobando] = useState(true);

  useEffect(() => {
    const token = cargarTokenGuardado();
    if (token) {
      authToken = token;
      setAutenticado(true);
    }
    setComprobando(false);
    onSesionExpirada = () => setAutenticado(false);
  }, []);

  if (esPaginaSeguimiento) return <SeguimientoPublico />;
  if (comprobando) return null;
  if (!autenticado) return <LoginScreen onEntrar={() => setAutenticado(true)} />;

  return <FirztnetPanel onCerrarSesion={() => { guardarToken(null); setAutenticado(false); }} />;
}

function FirztnetPanel({ onCerrarSesion }) {
  const [reparaciones, setReparaciones] = useState([]);
  const [contador, setContador] = useState({ total: 0, en_curso: 0, entregadas: 0, no_reparables: 0 });
  const [reporteDiario, setReporteDiario] = useState({ balance_neto: 0 });
  const [reporteMensual, setReporteMensual] = useState({ ingresos: 0, gastos: 0, balance_neto: 0 });
  const [tendencia, setTendencia] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [query, setQuery] = useState("");
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [vista, setVista] = useState("reparaciones");

  const cargarTodo = useCallback(async () => {
    setErrorCarga("");
    try {
      const [reps, cont, diario, mensual, tend] = await Promise.all([
        apiGet("/reparaciones"),
        apiGet("/reportes/contador"),
        apiGet("/reportes/diario"),
        apiGet("/reportes/mensual"),
        apiGet("/reportes/tendencia"),
      ]);
      setReparaciones(reps);
      setContador(cont);
      setReporteDiario(diario);
      setReporteMensual(mensual);
      setTendencia(tend);
    } catch (e) {
      setErrorCarga("No se pudo conectar con el backend (" + API_BASE + "). ¿Está corriendo `python run.py`?");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroModelo, setFiltroModelo] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroHoy, setFiltroHoy] = useState(false);
  const [filtroUrgente, setFiltroUrgente] = useState(false);
  const [vistaTrabajo, setVistaTrabajo] = useState("taller"); // "taller" o "domicilio"

  const marcasDisponibles = useMemo(
    () => [...new Set(reparaciones.map((r) => r.marca).filter(Boolean))].sort(),
    [reparaciones]
  );
  const modelosDisponibles = useMemo(
    () => [...new Set(reparaciones.filter((r) => !filtroMarca || r.marca === filtroMarca).map((r) => r.modelo).filter(Boolean))].sort(),
    [reparaciones, filtroMarca]
  );
  const clientesDisponibles = useMemo(
    () => [...new Map(reparaciones.filter((r) => r.cliente).map((r) => [r.cliente.id, r.cliente])).values()].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [reparaciones]
  );
  const chipsMarca = useMemo(() => {
    const conteo = {};
    reparaciones.forEach((r) => { if (r.marca) conteo[r.marca] = (conteo[r.marca] || 0) + 1; });
    return Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([marca]) => marca);
  }, [reparaciones]);

  const filtered = useMemo(() => {
    const hoyStr = new Date().toDateString();
    return reparaciones.filter((t) => {
      if (query.trim()) {
        const q = query.toLowerCase();
        const coincideTexto =
          t.cliente?.nombre?.toLowerCase().includes(q) ||
          t.numero_orden?.includes(q) ||
          t.equipo?.toLowerCase().includes(q);
        if (!coincideTexto) return false;
      }
      if (filtroMarca && t.marca !== filtroMarca) return false;
      if (filtroModelo && t.modelo !== filtroModelo) return false;
      if (filtroCliente && String(t.cliente?.id) !== filtroCliente) return false;
      if (filtroHoy && new Date(t.fecha_recepcion).toDateString() !== hoyStr) return false;
      if (filtroUrgente && !t.urgente) return false;
      if ((t.tipo_trabajo || "taller") !== vistaTrabajo) return false;
      return true;
    });
  }, [query, reparaciones, filtroMarca, filtroModelo, filtroCliente, filtroHoy, filtroUrgente, vistaTrabajo]);

  function handleEstadoActualizado(actualizado) {
    setReparaciones((prev) => prev.map((r) => (r.id === actualizado.id ? actualizado : r)));
    setSelected(actualizado);
    cargarTodo();
  }

  function handleCreada(nueva) {
    setReparaciones((prev) => [nueva, ...prev]);
    setMostrarNueva(false);
    cargarTodo();
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.text, fontFamily: "Inter, sans-serif" }}>
      <link rel="stylesheet" href={FONTS_URL} />
      <style>{`
        @media (max-width: 768px) {
          .fn-sidebar {
            width: 100% !important;
            min-height: auto !important;
            flex-direction: row !important;
            justify-content: space-around !important;
            align-items: center !important;
            padding: 8px 6px !important;
            border-right: none !important;
            border-top: 1px solid ${COLORS.sidebarActiveBg};
            position: fixed !important;
            bottom: 0; left: 0; right: 0;
            background: ${COLORS.sidebarBg} !important;
            z-index: 40;
          }
          .fn-sidebar .fn-logo { display: none !important; }
          .fn-sidebar .fn-navitem { flex-direction: column !important; gap: 2px !important; font-size: 10px !important; padding: 6px 4px !important; margin-bottom: 0 !important; }
          .fn-sidebar .fn-navitem svg { width: 18px; height: 18px; }
          .fn-shell { flex-direction: column !important; }
          .fn-main { max-width: 100% !important; padding: 16px 14px 78px 14px !important; }
          .fn-header-row { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
          .fn-header-row button { width: 100% !important; }
          .fn-stat-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .fn-stat-grid > div { min-width: 0 !important; }
          .fn-content-flex { flex-direction: column !important; }
          .fn-side-panel { width: 100% !important; }
          .fn-search { max-width: 100% !important; }
          .fn-kanban-col { flex: 0 0 200px !important; min-width: 200px !important; }
          .fn-modal-box { width: 92vw !important; max-width: 92vw !important; padding: 18px !important; }
        }
      `}</style>

      <div className="fn-shell" style={{ display: "flex" }}>
        <aside className="fn-sidebar" style={{ width: 210, background: COLORS.sidebarBg, borderRight: "none", minHeight: "100vh", padding: "22px 16px", flexShrink: 0, display: "flex", flexDirection: "column" }}>
          <div className="fn-logo" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 30, paddingLeft: 4 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: COLORS.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wrench size={16} color="#FFFFFF" />
            </div>
            <span style={{ fontFamily: "Oswald", fontSize: 17, letterSpacing: 0.5, color: "#FFFFFF" }}>FIRZTNET</span>
          </div>
          {[
            { key: "reparaciones", icon: LayoutGrid, label: "Reparaciones" },
            { key: "clientes", icon: Users, label: "Clientes" },
            { key: "reportes", icon: FileBarChart, label: "Reportes" },
            { key: "inventario", icon: Package, label: "Inventario" },
            { key: "caja", icon: Banknote, label: "Caja" },
            { key: "plantillas", icon: MessageSquare, label: "Plantillas" },
            { key: "ajustes", icon: Settings, label: "Ajustes" },
          ].map((item) => (
            <div
              key={item.label}
              className="fn-navitem"
              onClick={() => setVista(item.key)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: vista === item.key ? COLORS.sidebarActiveBg : "transparent", color: vista === item.key ? "#FFFFFF" : COLORS.sidebarTextDim, fontSize: 13.5, fontWeight: 500 }}
            >
              <item.icon size={16} />
              {item.label}
            </div>
          ))}
          <div
            onClick={onCerrarSesion}
            className="fn-navitem"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, marginTop: "auto", cursor: "pointer", color: COLORS.sidebarTextDim, fontSize: 13.5, fontWeight: 500 }}
          >
            <LogOut size={16} />
            Cerrar sesión
          </div>
        </aside>

        <main className="fn-main" style={{ flex: 1, minWidth: 0, padding: "26px 32px", maxWidth: 1180 }}>
          <div style={vista === "reparaciones" ? { background: `${COLORS.bg} ${PATRON_CIRCUITO}`, backgroundSize: "200px 200px", borderRadius: 16, padding: "18px 20px", marginBottom: 4 } : undefined}>
          <div className="fn-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <div>
              <h1 style={{ fontFamily: "Oswald", fontSize: 24, margin: 0, letterSpacing: 0.3 }}>
                {vista === "reparaciones" && "Panel de reparaciones"}
                {vista === "clientes" && "Clientes"}
                {vista === "reportes" && "Reportes"}
                {vista === "inventario" && "Inventario"}
                {vista === "caja" && "Caja"}
                {vista === "plantillas" && "Plantillas"}
                {vista === "ajustes" && "Ajustes"}
              </h1>
              {vista === "reparaciones" && (
                <span style={{ color: COLORS.textDim, fontSize: 13 }}>{cargando ? "Cargando..." : `${reparaciones.length} reparaciones cargadas`}</span>
              )}
            </div>
            {vista === "reparaciones" && (
              <button onClick={() => setMostrarNueva(true)} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "10px 16px" }}>
                <Plus size={15} /> Nueva reparación
              </button>
            )}
          </div>

          {errorCarga && (
            <div style={{ background: "#FEF2F2", border: `1px solid ${COLORS.rust}`, color: "#991B1B", borderRadius: 8, padding: "10px 14px", fontSize: 12.5, marginBottom: 16 }}>
              {errorCarga}
            </div>
          )}

          {vista === "clientes" && <ClientesView />}
          {vista === "reportes" && <ReportesView reporteDiario={reporteDiario} reporteMensual={reporteMensual} contador={contador} tendencia={tendencia} />}
          {vista === "inventario" && <InventarioView />}
          {vista === "caja" && <CajaView onMovimientoCreado={cargarTodo} />}
          {vista === "plantillas" && <PlantillasView />}
          {vista === "ajustes" && <AjustesView />}

          {vista === "reparaciones" && (
          <div className="fn-stat-grid" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <StatCard label="Reparaciones totales" value={contador.total} icon={Ticket} accent={COLORS.amber} destacada />
            <StatCard label="En curso" value={contador.en_curso} icon={CircleDot} accent={COLORS.teal} />
            <StatCard label="Entregadas" value={contador.entregadas} icon={ShieldCheck} accent={COLORS.green} />
            <StatCard label="No reparables" value={contador.no_reparables} icon={TriangleAlert} accent={COLORS.statusAmber} />
          </div>
          )}
          </div>

          {vista === "reparaciones" && (
          <div className="fn-content-flex" style={{ display: "flex", gap: 20, marginTop: 22 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button
                  onClick={() => setVistaTrabajo("taller")}
                  style={{ padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${vistaTrabajo === "taller" ? COLORS.amber : COLORS.line}`, background: vistaTrabajo === "taller" ? COLORS.amber : COLORS.surface, color: vistaTrabajo === "taller" ? "#FFFFFF" : COLORS.textDim, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  En el taller
                </button>
                <button
                  onClick={() => setVistaTrabajo("domicilio")}
                  style={{ padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${vistaTrabajo === "domicilio" ? COLORS.statusBlue : COLORS.line}`, background: vistaTrabajo === "domicilio" ? COLORS.statusBlue : COLORS.surface, color: vistaTrabajo === "domicilio" ? "#FFFFFF" : COLORS.textDim, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <MapPin size={13} /> A domicilio
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <div className="fn-search" style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "8px 12px", flex: "1 1 200px", maxWidth: 320 }}>
                  <Search size={14} color={COLORS.textDim} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Todos: cliente, nº orden o equipo..." style={{ background: "none", border: "none", outline: "none", color: COLORS.text, fontSize: 13, width: "100%" }} />
                </div>
                {vistaTrabajo === "taller" && (
                <>
                <select value={filtroMarca} onChange={(e) => { setFiltroMarca(e.target.value); setFiltroModelo(""); }} style={{ fontSize: 12.5, padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.line}`, color: filtroMarca ? COLORS.text : COLORS.textDim, background: COLORS.surface }}>
                  <option value="">Marca</option>
                  {marcasDisponibles.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={filtroModelo} onChange={(e) => setFiltroModelo(e.target.value)} style={{ fontSize: 12.5, padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.line}`, color: filtroModelo ? COLORS.text : COLORS.textDim, background: COLORS.surface }}>
                  <option value="">Modelo</option>
                  {modelosDisponibles.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                </>
                )}
                <select value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)} style={{ fontSize: 12.5, padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.line}`, color: filtroCliente ? COLORS.text : COLORS.textDim, background: COLORS.surface }}>
                  <option value="">Cliente</option>
                  {clientesDisponibles.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <button
                  onClick={() => setFiltroHoy((v) => !v)}
                  style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999, border: `1px solid ${filtroHoy ? COLORS.amber : COLORS.line}`, background: filtroHoy ? COLORS.amber : COLORS.surface, color: filtroHoy ? "#FFFFFF" : COLORS.textDim, cursor: "pointer" }}
                >
                  Hoy
                </button>
                <button
                  onClick={() => setFiltroUrgente((v) => !v)}
                  style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999, border: `1px solid ${filtroUrgente ? COLORS.rust : COLORS.line}`, background: filtroUrgente ? COLORS.rust : COLORS.surface, color: filtroUrgente ? "#FFFFFF" : COLORS.textDim, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                >
                  <Flame size={11} /> Urgente
                </button>
                {vistaTrabajo === "taller" && chipsMarca.map((marca) => (
                  <button
                    key={marca}
                    onClick={() => setFiltroMarca((v) => (v === marca ? "" : marca))}
                    style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999, border: `1px solid ${filtroMarca === marca ? COLORS.amber : COLORS.line}`, background: filtroMarca === marca ? COLORS.amber : COLORS.surface, color: filtroMarca === marca ? "#FFFFFF" : COLORS.textDim, cursor: "pointer" }}
                  >
                    {marca}
                  </button>
                ))}
              </div>

              <ReparacionesDestacadas reparaciones={filtered} onAbrir={(t) => setSelected(t)} />

              <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
                {stagesFor(vistaTrabajo).map((stage) => {
                  const items = filtered.filter((t) => t.estado_actual === stage.key);
                  return (
                    <div key={stage.key} className="fn-kanban-col" style={{ minWidth: 240, flex: "0 0 240px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, padding: "0 2px" }}>
                        <StageDot color={stage.accent} />
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.text }}>{stage.label}</span>
                        <span style={{ fontSize: 11, color: COLORS.textDim, marginLeft: "auto", fontFamily: "'IBM Plex Mono', monospace" }}>{items.length}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {!cargando && items.length === 0 && <div style={{ fontSize: 11.5, color: COLORS.textDim, padding: "10px 4px" }}>Sin equipos aquí</div>}
                        {items.map((t) => (
                          <RepairTag key={t.id} t={t} onClick={() => setSelected(t)} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="fn-side-panel" style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>
              <PanelProximaAccion reparaciones={reparaciones} onAbrir={(t) => setSelected(t)} />

              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 18, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -10, right: -10, width: 64, height: 64, borderRadius: "50%", background: `${COLORS.amber}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wrench size={22} color={`${COLORS.amber}55`} style={{ marginBottom: 10, marginRight: 10 }} />
                </div>
                <div style={{ fontSize: 12, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Balance de hoy</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 24, color: COLORS.amber, fontWeight: 600 }}>
                  {reporteDiario.balance_neto >= 0 ? "+" : ""}{Number(reporteDiario.balance_neto || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                </div>
                <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
                  <div style={{ fontSize: 11, color: COLORS.textDim }}>Recibidas hoy: <strong style={{ color: COLORS.text }}>{reporteDiario.equipos_recibidos ?? 0}</strong></div>
                  <div style={{ fontSize: 11, color: COLORS.textDim }}>Clientes nuevos: <strong style={{ color: COLORS.text }}>{reporteDiario.nuevos_clientes ?? 0}</strong></div>
                </div>
                <div style={{ fontSize: 10.5, color: COLORS.textDim, marginTop: 8 }}>Tendencia de ingresos, últimos 7 días</div>
                <div style={{ height: 70, marginTop: 6, marginLeft: -8 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={tendencia.length ? tendencia : [{ dia_semana: "", ingresos: 0 }]}>
                      <defs>
                        <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={COLORS.amber} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={COLORS.amber} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="dia_semana" tick={{ fill: COLORS.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.line}`, borderRadius: 8, fontSize: 11 }}
                        formatter={(value) => [`${Number(value).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`, "Ingresos"]}
                      />
                      <Area type="monotone" dataKey="ingresos" stroke={COLORS.amber} strokeWidth={2} fill="url(#fill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 12, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Este mes</div>
                {[
                  { l: "Ingresos", v: reporteMensual.ingresos, c: COLORS.green },
                  { l: "Gastos", v: reporteMensual.gastos, c: COLORS.rust },
                  { l: "Balance neto", v: reporteMensual.balance_neto, c: COLORS.text },
                ].map((r) => (
                  <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "6px 0", borderBottom: `1px solid ${COLORS.line}` }}>
                    <span style={{ color: COLORS.textDim }}>{r.l}</span>
                    <span style={{ color: r.c, fontFamily: "'IBM Plex Mono', monospace" }}>{Number(r.v || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</span>
                  </div>
                ))}
                <button onClick={() => setVista("reportes")} style={{ ...btnStyle("transparent", COLORS.teal, COLORS.line), marginTop: 12, padding: "8px 10px" }}>
                  Ver informe completo <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
          )}
        </main>
      </div>

      <TicketModal t={selected} onClose={() => setSelected(null)} onEstadoActualizado={handleEstadoActualizado} />
      {mostrarNueva && <NuevaReparacionModal onClose={() => setMostrarNueva(false)} onCreada={handleCreada} />}
    </div>
  );
}
