import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Wrench, LayoutGrid, Users, FileBarChart, Ticket, Search,
  ChevronRight, CircleDot, TriangleAlert, ShieldCheck, Banknote,
  Printer, Plus, X, ArrowUpRight, ArrowDownRight, Loader2, Settings, LogOut, Camera, Trash2, Package, MessageSquare, CheckCircle2, XCircle, Flame, Eye, MapPin, Bell, RotateCcw, MoreHorizontal, Truck, ChevronDown, Target
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
function nombreUsuarioDelToken() {
  // Solo para MOSTRAR el nombre en la esquina — no valida nada, la
  // seguridad real la hace siempre el backend en cada petición.
  try {
    const payload = JSON.parse(atob(authToken.split(".")[1]));
    return payload.sub || "Admin";
  } catch (e) {
    return "Admin";
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

function fechaLarga(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

const CHECKLIST_SALIDA_TALLER = ["Cargador incluido", "Teclado probado", "Pantalla probada", "Equipo limpio", "Accesorios devueltos"];

const CATEGORIAS_DOMICILIO = [
  { key: "redes", label: "Redes/Internet", checklist: ["Router revisado", "Cableado comprobado", "Velocidad testeada"], herramientas: ["Crimpadora", "Conectores RJ45", "Probador de red (cable tester)", "Cable UTP", "Latiguillos de repuesto"] },
  { key: "camaras", label: "Cámaras CCTV/IP", checklist: ["Cámara 1 alineada", "Firmware actualizado", "Contraseña por defecto cambiada", "Visión nocturna probada", "Grabación en bucle activa", "Acceso remoto probado"], herramientas: ["Crimpadora", "Conectores RJ45", "Cable UTP/coaxial", "Taladro y tacos", "Destornillador", "Escalera"] },
  { key: "impresoras", label: "Impresoras/Periféricos", checklist: ["Impresora en red configurada", "Driver instalado", "Prueba de impresión OK"], herramientas: ["Cable USB/red", "Cartuchos o tóner de prueba", "Pendrive con drivers"] },
  { key: "mantenimiento_empresas", label: "Mantenimiento empresas", checklist: ["Equipos revisados", "Copias de seguridad comprobadas"], herramientas: ["Kit de destornilladores", "Aire comprimido", "Pendrive de arranque", "Disco externo para copias"] },
];

function iniciales(nombre) {
  if (!nombre) return "?";
  const partes = nombre.trim().split(" ");
  return ((partes[0]?.[0] || "") + (partes[1]?.[0] || "")).toUpperCase();
}

function TablaOrdenesActivas({ reparaciones, onAbrir, onHover }) {
  const hoy = new Date().toDateString();
  const filas = reparaciones
    .filter((r) =>
      !["entregado", "no_reparable", "completado"].includes(r.estado_actual) ||
      (["entregado", "completado"].includes(r.estado_actual) && r.fecha_entrega && new Date(r.fecha_entrega).toDateString() === hoy)
    )
    .sort((a, b) => (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0) || new Date(a.fecha_recepcion) - new Date(b.fecha_recepcion));

  if (filas.length === 0) return null;

  function diasDesde(fecha) {
    return Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 2 }}>Órdenes activas</div>
      <div style={{ fontSize: 11.5, color: COLORS.textDim, marginBottom: 10 }}>Lo más urgente o antiguo entre todo lo activo, con acción rápida sin abrir la ficha — sin repetir lo que ya ves en el tablero de abajo.</div>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 60 }} />
            <col style={{ width: "auto" }} />
            <col style={{ width: 62 }} />
            <col style={{ width: 40 }} />
            <col style={{ width: 92 }} />
            <col style={{ width: 78 }} />
          </colgroup>
          <thead>
            <tr style={{ background: COLORS.surfaceRaised, textAlign: "left" }}>
              {["Orden", "Cliente / Equipo", "Tipo", "Días", "Estado", "Acción"].map((c) => (
                <th key={c} style={{ padding: "8px 6px", fontSize: 10, fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.3, position: "sticky", top: 0, background: COLORS.surfaceRaised, zIndex: 1 }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((t, i) => {
              const lista = stagesFor(t.tipo_trabajo);
              const stage = lista.find((s) => s.key === t.estado_actual) || lista[0];
              const esFinal = ["entregado", "completado"].includes(t.estado_actual);
              const dias = diasDesde(t.fecha_recepcion);
              const [anio, numero] = (t.numero_orden || "").split("-");
              return (
                <tr
                  key={t.id}
                  className="fn-fila-tabla"
                  onClick={() => onAbrir(t)}
                  onMouseEnter={() => onHover?.(t)}
                  onMouseLeave={() => onHover?.(null)}
                  style={{ borderTop: `1px solid ${COLORS.line}`, cursor: "pointer" }}
                >
                  <td style={{ padding: "8px 6px 8px 8px", fontWeight: 700, color: COLORS.text, lineHeight: 1.25, borderLeft: `3px solid ${stage.accent}` }}>
                    {t.urgente && <Flame size={10} color={COLORS.rust} style={{ marginRight: 2, verticalAlign: -1 }} />}
                    <div style={{ fontSize: 9.5, color: COLORS.textDim, fontWeight: 500 }}>{anio}</div>
                    <div>#{numero}</div>
                  </td>
                  <td style={{ padding: "8px 6px", overflow: "hidden" }}>
                    <div style={{ color: COLORS.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.cliente?.nombre}</div>
                    <div style={{ color: COLORS.textDim, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.equipo}</div>
                  </td>
                  <td style={{ padding: "8px 6px" }}>
                    <span style={{ fontSize: 9.5, fontWeight: 600, color: t.tipo_trabajo === "domicilio" ? COLORS.statusBlue : COLORS.textDim, background: t.tipo_trabajo === "domicilio" ? `${COLORS.statusBlue}18` : COLORS.surfaceRaised, borderRadius: 999, padding: "2px 6px", whiteSpace: "nowrap" }}>
                      {t.tipo_trabajo === "domicilio" ? "In-Situ" : "Taller"}
                    </span>
                  </td>
                  <td style={{ padding: "8px 6px", color: dias >= 5 ? COLORS.rust : COLORS.textDim, fontWeight: dias >= 5 ? 700 : 400 }}>{dias}d</td>
                  <td style={{ padding: "8px 6px" }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: stage.accent, background: `${stage.accent}18`, borderRadius: 999, padding: "3px 7px", whiteSpace: "nowrap", display: "inline-block" }}>
                      {stage.label}
                    </span>
                  </td>
                  <td style={{ padding: "8px 6px" }}>
                    {esFinal ? (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ventana = window.open("", "_blank");
                          try {
                            const facturas = await apiGet(`/facturas/reparacion/${t.id}`);
                            if (facturas.length > 0) {
                              const res = await fetch(`${API_BASE}/facturas/${facturas[0].id}/pdf`, { headers: cabecerasAuth() });
                              manejar401(res);
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              if (ventana) ventana.location.href = url;
                            } else {
                              ventana?.close();
                              onAbrir(t); // todavía no hay factura — abrimos la ficha para poder generarla
                            }
                          } catch (err) {
                            ventana?.close();
                          }
                        }}
                        style={{ ...btnStyle(COLORS.green, "#FFFFFF"), padding: "5px 8px", fontSize: 11, fontWeight: 700, width: "100%" }}
                      >
                        Factura
                      </button>
                    ) : t.cliente?.telefono ? (
                      <a
                        onClick={(e) => e.stopPropagation()}
                        href={`https://wa.me/${t.cliente.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${t.cliente.nombre.split(" ")[0]}, te escribimos sobre tu orden #${t.numero_orden} (${stage.label}).`)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ ...btnStyle(COLORS.statusBlue, "#FFFFFF"), padding: "5px 8px", fontSize: 11, fontWeight: 700, textDecoration: "none", display: "flex", justifyContent: "center" }}
                      >
                        Notificar
                      </a>
                    ) : (
                        <span style={{ fontSize: 11, color: COLORS.textDim }}>Sin teléfono</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TablaTableroCompleto({ reparaciones, tipoTrabajo, onAbrir, onHover, cargando }) {
  const etapas = stagesFor(tipoTrabajo);
  const ordenEtapa = Object.fromEntries(etapas.map((s, i) => [s.key, i]));

  function diasDesde(fecha) {
    return Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));
  }

  const filas = [...reparaciones].sort(
    (a, b) => (ordenEtapa[a.estado_actual] ?? 99) - (ordenEtapa[b.estado_actual] ?? 99) || new Date(a.fecha_recepcion) - new Date(b.fecha_recepcion)
  );

  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ maxHeight: 500, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 60 }} />
            <col style={{ width: "auto" }} />
            <col style={{ width: 62 }} />
            <col style={{ width: 40 }} />
            <col style={{ width: 92 }} />
            <col style={{ width: 78 }} />
          </colgroup>
          <thead>
            <tr style={{ background: COLORS.surfaceRaised, textAlign: "left" }}>
              {["Orden", "Cliente / Equipo", "Tipo", "Días", "Estado", "Acción"].map((c) => (
                <th key={c} style={{ padding: "8px 6px", fontSize: 10, fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.3, position: "sticky", top: 0, background: COLORS.surfaceRaised, zIndex: 1 }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!cargando && filas.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "20px 12px", textAlign: "center", fontSize: 12, color: COLORS.textDim }}>Sin equipos aquí.</td>
              </tr>
            )}
            {filas.map((t, i) => {
              const stage = etapas.find((s) => s.key === t.estado_actual) || etapas[0];
              const esFinal = ["entregado", "completado"].includes(t.estado_actual);
              const esNoReparable = t.estado_actual === "no_reparable";
              const dias = diasDesde(t.fecha_recepcion);
              const [anio, numero] = (t.numero_orden || "").split("-");
              return (
                <tr
                  key={t.id}
                  className="fn-fila-tabla"
                  onClick={() => onAbrir(t)}
                  onMouseEnter={() => onHover?.(t)}
                  onMouseLeave={() => onHover?.(null)}
                  style={{ borderTop: `1px solid ${COLORS.line}`, cursor: "pointer" }}
                >
                  <td style={{ padding: "8px 6px 8px 8px", fontWeight: 700, color: COLORS.text, lineHeight: 1.25, borderLeft: `3px solid ${stage.accent}` }}>
                    {t.urgente && <Flame size={10} color={COLORS.rust} style={{ marginRight: 2, verticalAlign: -1 }} />}
                    <div style={{ fontSize: 9.5, color: COLORS.textDim, fontWeight: 500 }}>{anio}</div>
                    <div>#{numero}</div>
                  </td>
                  <td style={{ padding: "8px 6px", overflow: "hidden" }}>
                    <div style={{ color: COLORS.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.cliente?.nombre}</div>
                    <div style={{ color: COLORS.textDim, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.equipo}</div>
                  </td>
                  <td style={{ padding: "8px 6px" }}>
                    <span style={{ fontSize: 9.5, fontWeight: 600, color: t.tipo_trabajo === "domicilio" ? COLORS.statusBlue : COLORS.textDim, background: t.tipo_trabajo === "domicilio" ? `${COLORS.statusBlue}18` : COLORS.surfaceRaised, borderRadius: 999, padding: "2px 6px", whiteSpace: "nowrap" }}>
                      {t.tipo_trabajo === "domicilio" ? "In-Situ" : "Taller"}
                    </span>
                  </td>
                  <td style={{ padding: "8px 6px", color: dias >= 5 ? COLORS.rust : COLORS.textDim, fontWeight: dias >= 5 ? 700 : 400 }}>{dias}d</td>
                  <td style={{ padding: "8px 6px" }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: stage.accent, background: `${stage.accent}18`, borderRadius: 999, padding: "3px 7px", whiteSpace: "nowrap", display: "inline-block" }}>
                      {stage.label}
                    </span>
                  </td>
                  <td style={{ padding: "8px 6px" }}>
                    {esFinal ? (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ventana = window.open("", "_blank");
                          try {
                            const facturas = await apiGet(`/facturas/reparacion/${t.id}`);
                            if (facturas.length > 0) {
                              const res = await fetch(`${API_BASE}/facturas/${facturas[0].id}/pdf`, { headers: cabecerasAuth() });
                              manejar401(res);
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              if (ventana) ventana.location.href = url;
                            } else {
                              ventana?.close();
                              onAbrir(t); // todavía no hay factura — abrimos la ficha para poder generarla
                            }
                          } catch (err) {
                            ventana?.close();
                          }
                        }}
                        style={{ ...btnStyle(COLORS.green, "#FFFFFF"), padding: "5px 8px", fontSize: 11, fontWeight: 700, width: "100%" }}
                      >
                        Factura
                      </button>
                    ) : esNoReparable ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAbrir(t); }}
                        style={{ ...btnStyle("transparent", COLORS.text, COLORS.line), padding: "5px 8px", fontSize: 11, fontWeight: 700, width: "100%" }}
                      >
                        Ver
                      </button>
                    ) : t.cliente?.telefono ? (
                      <a
                        onClick={(e) => e.stopPropagation()}
                        href={`https://wa.me/${t.cliente.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${t.cliente.nombre.split(" ")[0]}, te escribimos sobre tu orden #${t.numero_orden} (${stage.label}).`)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ ...btnStyle(COLORS.statusBlue, "#FFFFFF"), padding: "5px 8px", fontSize: 11, fontWeight: 700, textDecoration: "none", display: "flex", justifyContent: "center" }}
                      >
                        Notificar
                      </a>
                    ) : (
                      <span style={{ fontSize: 11, color: COLORS.textDim }}>Sin teléfono</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -------------------- Desplegable: En el taller / A domicilio --------------------
function SelectorTipoTrabajo({ valor, onCambiar }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function alClicarFuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener("mousedown", alClicarFuera);
    return () => document.removeEventListener("mousedown", alClicarFuera);
  }, []);

  const opciones = [
    { key: "taller", label: "Taller Físico", icon: Wrench, color: COLORS.amber },
    { key: "domicilio", label: "Servicio In-Situ / Domicilio", icon: Truck, color: COLORS.statusBlue },
  ];
  const actual = opciones.find((o) => o.key === valor) || opciones[0];

  return (
    <div ref={ref} style={{ position: "relative", marginBottom: 12 }}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 9, border: `1.5px solid ${actual.color}`, background: actual.color, color: "#FFFFFF", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
      >
        <actual.icon size={15} />
        {actual.label}
        <ChevronDown size={14} style={{ transform: abierto ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
      </button>
      {abierto && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 240, background: "#FFFFFF", border: `1px solid ${COLORS.line}`, borderRadius: 10, boxShadow: "0 12px 28px -8px rgba(0,0,0,0.18)", zIndex: 40, overflow: "hidden" }}>
          {opciones.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => { onCambiar(o.key); setAbierto(false); }}
              style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 14px", background: o.key === valor ? o.color : "#FFFFFF", color: o.key === valor ? "#FFFFFF" : COLORS.text, border: "none", cursor: "pointer", fontSize: 13, fontWeight: o.key === valor ? 600 : 500, textAlign: "left" }}
            >
              <o.icon size={15} />
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent, trend, destacada, onClick, activa }) {
  const [hover, setHover] = useState(false);
  if (destacada) {
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: "#FFFFFF", border: `2px solid ${accent}`, borderRadius: 14, padding: "16px 18px", flex: 1, minWidth: 150,
          position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : "default",
          boxShadow: activa ? `0 0 0 3px ${accent}40` : hover ? `0 6px 16px -4px ${accent}60` : "none",
          transform: hover ? "translateY(-2px)" : "translateY(0)",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
      >
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
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: accent, borderRadius: 14, padding: "16px 18px", flex: 1, minWidth: 150, position: "relative", overflow: "hidden",
        boxShadow: activa ? `0 0 0 3px rgba(255,255,255,0.7), 0 8px 20px -6px ${accent}80` : hover ? `0 12px 26px -6px ${accent}90` : `0 8px 20px -6px ${accent}80`,
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        cursor: onClick ? "pointer" : "default",
      }}
    >
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
// -------------------- escáner de código de barras/QR (cámara) --------------------
function BotonEscanear({ onLeido }) {
  const [activo, setActivo] = useState(false);
  const [soportado, setSoportado] = useState(true);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);

  async function iniciar() {
    if (!("BarcodeDetector" in window)) {
      setSoportado(false);
      return;
    }
    setError("");
    setActivo(true);
    try {
      detectorRef.current = new window.BarcodeDetector({ formats: ["code_128", "ean_13", "qr_code", "code_39", "upc_a", "upc_e"] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        buclearDeteccion();
      }
    } catch (e) {
      setError("No se pudo acceder a la cámara. Comprueba los permisos.");
      setActivo(false);
    }
  }

  function buclearDeteccion() {
    const paso = async () => {
      if (!videoRef.current || !detectorRef.current) return;
      try {
        const codigos = await detectorRef.current.detect(videoRef.current);
        if (codigos.length > 0) {
          onLeido(codigos[0].rawValue);
          detener();
          return;
        }
      } catch (e) {
        /* frame no válido, se intenta con el siguiente */
      }
      if (streamRef.current) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  function detener() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActivo(false);
  }

  useEffect(() => () => detener(), []);

  if (activo) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <video ref={videoRef} style={{ width: "90%", maxWidth: 420, borderRadius: 12 }} muted playsInline />
        <div style={{ color: "#FFF", fontSize: 13, marginTop: 14 }}>Apunta al código de barras o QR...</div>
        <button onClick={detener} style={{ ...btnStyle(COLORS.rust, "#FFFFFF"), marginTop: 16, padding: "9px 20px" }}>Cancelar</button>
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={iniciar} style={{ ...btnStyle("transparent", COLORS.statusBlue, COLORS.line), padding: "7px 12px", fontSize: 12 }}>
        <Camera size={13} /> Escanear
      </button>
      {!soportado && <div style={{ fontSize: 10.5, color: COLORS.textDim, marginTop: 4 }}>Tu navegador no soporta el escáner (funciona en Chrome/Android) — escribe el número a mano.</div>}
      {error && <div style={{ fontSize: 10.5, color: COLORS.rust, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

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

function CrearRecordatorio({ reparacion }) {
  const [texto, setTexto] = useState("");
  const [meses, setMeses] = useState("6");
  const [guardando, setGuardando] = useState(false);
  const [creado, setCreado] = useState(false);

  async function crear() {
    if (!texto.trim()) return;
    setGuardando(true);
    try {
      await apiPost("/recordatorios", {
        cliente_id: reparacion.cliente?.id,
        reparacion_id: reparacion.id,
        texto,
        meses: parseInt(meses, 10),
      });
      setCreado(true);
      setTexto("");
    } catch (e) {
      /* silencioso */
    } finally {
      setGuardando(false);
    }
  }

  if (creado) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5, color: COLORS.green }}>
        <span>✓ Recordatorio programado</span>
        <button onClick={() => setCreado(false)} style={{ background: "none", border: "none", color: COLORS.statusBlue, fontSize: 11.5, cursor: "pointer" }}>Añadir otro</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Ej. Revisión anual DVR/cámaras"
        style={{ flex: "1 1 160px", fontSize: 12.5, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}` }}
      />
      <select value={meses} onChange={(e) => setMeses(e.target.value)} style={{ fontSize: 12.5, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}` }}>
        <option value="6">En 6 meses</option>
        <option value="12">En 12 meses</option>
      </select>
      <button disabled={guardando || !texto.trim()} onClick={crear} style={{ ...btnStyle(COLORS.statusBlue, "#FFFFFF"), flex: "none", padding: "8px 14px", fontSize: 12.5 }}>
        Programar
      </button>
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
  const [rectificando, setRectificando] = useState(false);
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
  const [mostrarTrazabilidad, setMostrarTrazabilidad] = useState(false);
  const [numeroSerieRepuesto, setNumeroSerieRepuesto] = useState("");
  const [facturaCompraRepuesto, setFacturaCompraRepuesto] = useState("");
  const [fechaCompraRepuesto, setFechaCompraRepuesto] = useState("");
  const [checklist, setChecklist] = useState([]);
  const [firmasDetalle, setFirmasDetalle] = useState([]);
  const [sesionesInfo, setSesionesInfo] = useState({ minutos_totales: 0, coste_mano_obra: 0, hay_sesion_abierta: false, tarifa_hora: 25 });
  const [cronometroTexto, setCronometroTexto] = useState("00:00:00");
  const [guardandoSesion, setGuardandoSesion] = useState(false);

  async function cargarSesiones() {
    try {
      const info = await apiGet(`/reparaciones/${t.id}/sesiones`);
      setSesionesInfo(info);
    } catch (e) {
      /* silencioso */
    }
  }

  async function iniciarServicio() {
    setGuardandoSesion(true);
    try {
      await apiPost(`/reparaciones/${t.id}/sesiones/iniciar`, {});
      await cargarSesiones();
    } catch (e) {
      /* se puede mejorar con mensaje visible si hace falta */
    } finally {
      setGuardandoSesion(false);
    }
  }

  async function finalizarServicio() {
    setGuardandoSesion(true);
    try {
      await apiPost(`/reparaciones/${t.id}/sesiones/finalizar`, {});
      await cargarSesiones();
    } catch (e) {
      /* silencioso */
    } finally {
      setGuardandoSesion(false);
    }
  }

  // Actualiza el cronómetro en pantalla cada segundo mientras hay una
  // sesión abierta, sin tener que recargar del servidor a cada tic.
  useEffect(() => {
    if (!sesionesInfo.hay_sesion_abierta) {
      const mins = sesionesInfo.minutos_totales || 0;
      const h = Math.floor(mins / 60), m = Math.floor(mins % 60), s = Math.round((mins % 1) * 60);
      setCronometroTexto(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      return;
    }
    const sesionAbierta = sesionesInfo.sesiones?.find((s) => !s.fin);
    if (!sesionAbierta) return;
    const inicioMs = new Date(sesionAbierta.inicio).getTime();
    const minutosCerradas = sesionesInfo.sesiones.filter((s) => s.fin).reduce((acc, s) => acc + (new Date(s.fin) - new Date(s.inicio)) / 60000, 0);
    const intervalo = setInterval(() => {
      const segundosAbierta = (Date.now() - inicioMs) / 1000;
      const totalSegundos = minutosCerradas * 60 + segundosAbierta;
      const h = Math.floor(totalSegundos / 3600), m = Math.floor((totalSegundos % 3600) / 60), s = Math.floor(totalSegundos % 60);
      setCronometroTexto(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(intervalo);
  }, [sesionesInfo]);
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
    const lista = t.tipo_trabajo === "domicilio" ? CATEGORIAS_DOMICILIO.find((c) => c.key === t.categoria)?.checklist : CHECKLIST_SALIDA_TALLER;
    if (!lista) return;
    for (const texto of lista) {
      if (!checklist.some((i) => i.texto === texto)) {
        await añadirItemChecklist(texto);
      }
    }
  }
  const [presupuestoImporte, setPresupuestoImporte] = useState(t?.presupuesto_importe ?? "");
  const [presupuestoDescripcion, setPresupuestoDescripcion] = useState(t?.presupuesto_descripcion ?? "");
  const [mostrarEstimador, setMostrarEstimador] = useState(false);
  const [costePiezasEstimador, setCostePiezasEstimador] = useState("");
  const [resultadoEstimador, setResultadoEstimador] = useState(null);
  const [cargandoEstimador, setCargandoEstimador] = useState(false);
  const [guardandoPresupuesto, setGuardandoPresupuesto] = useState(false);
  const [errorPresupuesto, setErrorPresupuesto] = useState("");
  const [viendoPdfPresupuesto, setViendoPdfPresupuesto] = useState(false);
  const [mostrarFirmaEntrega, setMostrarFirmaEntrega] = useState(false);
  const [guardandoFirmaEntrega, setGuardandoFirmaEntrega] = useState(false);
  const [firmaEntregaHecha, setFirmaEntregaHecha] = useState(false);
  const [avisosPendientes, setAvisosPendientes] = useState([]);

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
        numero_serie: numeroSerieRepuesto || null,
        numero_factura_compra: facturaCompraRepuesto || null,
        fecha_compra: fechaCompraRepuesto || null,
      });
      setRepuestosUsados((prev) => [...prev, uso]);
      setListaRepuestos((prev) =>
        prev.map((r) => (r.id === uso.repuesto.id ? { ...r, stock_actual: r.stock_actual - uso.cantidad } : r))
      );
      setRepuestoSeleccionado("");
      setCantidadRepuesto(1);
      setNumeroSerieRepuesto("");
      setFacturaCompraRepuesto("");
      setFechaCompraRepuesto("");
      setMostrarTrazabilidad(false);
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
      if (nuevas.length < fileList.length) {
        setErrorFotos(`${fileList.length - nuevas.length} foto(s) no se subieron (formato no soportado o pesan más de 10 MB). El resto sí se guardó.`);
      }
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

  const [tecnicosDisponibles, setTecnicosDisponibles] = useState([]);
  const [telefonoBizum, setTelefonoBizum] = useState("");
  useEffect(() => {
    apiGet("/configuracion").then((c) => { setTecnicosDisponibles(c.tecnicos || []); setTelefonoBizum(c.telefono_bizum || ""); }).catch(() => {});
  }, []);

  async function actualizarTecnico(nombre) {
    try {
      const actualizado = await apiPatch(`/reparaciones/${t.id}`, { tecnico: nombre || null });
      onEstadoActualizado(actualizado);
    } catch (e) {
      /* silencioso */
    }
  }

  async function actualizarWifi(campo, valor) {
    if (valor === (t[campo] || "")) return;
    try {
      const actualizado = await apiPatch(`/reparaciones/${t.id}`, { [campo]: valor || null });
      onEstadoActualizado(actualizado);
    } catch (e) {
      /* silencioso */
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
        setFirmasDetalle(data.firmas || []);
      })
      .catch(() => {})
      .finally(() => setCargandoCobros(false));
    apiGet(`/facturas/reparacion/${t.id}`)
      .then((data) => setFacturaExistente(data[0] || null))
      .catch(() => {});
    apiGet("/repuestos").then(setListaRepuestos).catch(() => {});
    apiGet(`/reparaciones/${t.id}/sesiones`).then(setSesionesInfo).catch(() => {});
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
    setAvisosPendientes([]);
    setMostrarEstimador(false);
    setCostePiezasEstimador("");
    setResultadoEstimador(null);
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

  async function cobrarYFacturar() {
    setErrorCobro("");
    if (!montoCobro || parseFloat(montoCobro) <= 0) {
      setErrorCobro("Indica un importe válido.");
      return;
    }
    setGuardandoCobro(true);
    try {
      const resultado = await apiPost(`/reparaciones/${t.id}/cobrar-y-facturar`, {
        concepto: conceptoCobro,
        monto: parseFloat(montoCobro),
        metodo_pago: metodoCobro,
      });
      setMovimientos((prev) => [resultado.movimiento, ...prev]);
      setFacturaExistente(resultado.factura);
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
    const esCierre = ["entregado", "completado"].includes(nuevoEstado);
    if (esCierre && checklist.length > 0) {
      const pendientes = checklist.filter((i) => !i.completado);
      if (pendientes.length > 0) {
        const continuar = window.confirm(
          `Quedan ${pendientes.length} punto(s) sin marcar en el checklist:\n\n${pendientes.map((i) => "• " + i.texto).join("\n")}\n\n¿Cerrar el servicio de todos modos?`
        );
        if (!continuar) return;
      }
    }
    setGuardando(true);
    try {
      const body = nuevoEstado === "no_reparable" ? { estado: nuevoEstado, motivo } : { estado: nuevoEstado };
      const actualizado = await apiPatch(`/reparaciones/${t.id}/estado`, body);
      onEstadoActualizado(actualizado);
      setAvisosPendientes(actualizado.avisos || []);
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
          {t.tipo_trabajo === "domicilio" && ["redes", "camaras"].includes(t.categoria) && (
            <div style={{ display: "flex", gap: 6 }}>
              <input
                defaultValue={t.wifi_ssid || ""}
                onBlur={(e) => actualizarWifi("wifi_ssid", e.target.value)}
                placeholder="Red WiFi (SSID)"
                style={{ flex: 1, fontSize: 12, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }}
              />
              <input
                defaultValue={t.wifi_password || ""}
                onBlur={(e) => actualizarWifi("wifi_password", e.target.value)}
                placeholder="Contraseña WiFi"
                style={{ flex: 1, fontSize: 12, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }}
              />
            </div>
          )}
          <Row label="Problema reportado" value={t.problema_reportado || "—"} />
          <Row label="Fecha recepción" value={fechaLarga(t.fecha_recepcion)} />
          <button
            type="button"
            onClick={async () => {
              const ventana = window.open("", "_blank");
              try {
                const res = await fetch(`${API_BASE}/reparaciones/${t.id}/etiqueta-qr/pdf`, { headers: cabecerasAuth() });
                manejar401(res);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                if (ventana) ventana.location.href = url;
              } catch (e) {
                ventana?.close();
              }
            }}
            style={{ ...btnStyle("transparent", COLORS.text, COLORS.line), width: "100%", padding: "7px 10px", fontSize: 12, marginTop: -2 }}
          >
            🏷️ Imprimir etiqueta con QR (para pegar en el equipo)
          </button>
          <Row label="Estado" value={stage.label} />
          {tecnicosDisponibles.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: COLORS.textDim }}>Técnico responsable</span>
              <select
                value={t.tecnico || ""}
                onChange={(e) => actualizarTecnico(e.target.value)}
                style={{ fontSize: 12.5, padding: "5px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }}
              >
                <option value="">Sin asignar</option>
                {tecnicosDisponibles.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}
              </select>
            </div>
          )}
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

        {t.tipo_trabajo === "domicilio" && t.estado_actual === "contratado" && t.categoria && CATEGORIAS_DOMICILIO.some((c) => c.key === t.categoria) && (
          <div style={{ marginTop: 10, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 9, padding: 12 }}>
            <div style={{ fontSize: 11.5, color: COLORS.statusAmber, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
              <Wrench size={12} /> Antes de salir, ¿llevas esto?
            </div>
            <div style={{ fontSize: 12, color: "#78350F", lineHeight: 1.6 }}>
              {CATEGORIAS_DOMICILIO.find((c) => c.key === t.categoria)?.herramientas.join(" · ")}
            </div>
          </div>
        )}
        {guardandoFecha && <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>Guardando fecha...</div>}

        {t.cliente?.telefono && !esFinal && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
            <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Mensajes rápidos</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {t.tipo_trabajo === "domicilio" && t.direccion_servicio && (
                <button
                  type="button"
                  onClick={() => {
                    const minutos = window.prompt("¿Cuántos minutos estimas de llegada?", "20");
                    if (minutos === null) return;
                    const nombre = t.cliente.nombre.split(" ")[0];
                    const texto = `Hola ${nombre}, soy el técnico de FIRZTNET. Voy en camino a tu dirección (${t.direccion_servicio}). Llegada estimada: ${minutos} min.`;
                    window.open(`https://wa.me/${t.cliente.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`, "_blank");
                  }}
                  style={{ ...btnStyle("transparent", COLORS.statusBlue, COLORS.line), flex: "none", padding: "7px 12px", fontSize: 12 }}
                >
                  🚗 En camino
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const pieza = window.prompt("¿Qué repuesto/pieza falta?");
                  if (!pieza) return;
                  const horas = window.prompt("¿Tiempo estimado de llegada?", "48h") || "48h";
                  const nombre = t.cliente.nombre.split(" ")[0];
                  const texto = `Hola ${nombre}, hemos pedido el repuesto ${pieza} para tu equipo (orden ${t.numero_orden}). Tiempo estimado de llegada: ${horas}.`;
                  window.open(`https://wa.me/${t.cliente.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`, "_blank");
                }}
                style={{ ...btnStyle("transparent", COLORS.statusAmber, COLORS.line), flex: "none", padding: "7px 12px", fontSize: 12 }}
              >
                📦 Falta pieza
              </button>
              {telefonoBizum && (
                <button
                  type="button"
                  onClick={() => {
                    const sugerido = t.presupuesto_importe ?? "";
                    const monto = window.prompt("¿Importe a pedir por Bizum (€)?", sugerido !== "" ? String(sugerido) : "");
                    if (!monto) return;
                    const nombre = t.cliente.nombre.split(" ")[0];
                    const texto = `Hola ${nombre}, puedes hacerme un Bizum de ${monto}€ al ${telefonoBizum}, con el concepto "${t.numero_orden}". Cuando lo hagas, avísame y te lo registro. ¡Gracias!`;
                    window.open(`https://wa.me/${t.cliente.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`, "_blank");
                  }}
                  style={{ ...btnStyle("transparent", "#7C3AED", COLORS.line), flex: "none", padding: "7px 12px", fontSize: 12 }}
                >
                  💳 Solicitar por Bizum
                </button>
              )}
            </div>
          </div>
        )}

        {t.tipo_trabajo === "domicilio" && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
            <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Mano de obra</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: sesionesInfo.hay_sesion_abierta ? "#F0FDF4" : COLORS.surfaceRaised, border: `1px solid ${sesionesInfo.hay_sesion_abierta ? "#86EFAC" : COLORS.line}`, borderRadius: 9, padding: "10px 14px" }}>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontWeight: 700, color: sesionesInfo.hay_sesion_abierta ? COLORS.green : COLORS.text }}>{cronometroTexto}</div>
                <div style={{ fontSize: 10.5, color: COLORS.textDim, marginTop: 2 }}>
                  {sesionesInfo.coste_mano_obra?.toFixed(2)} € a {sesionesInfo.tarifa_hora}€/h
                </div>
              </div>
              {esFinal ? (
                <span style={{ fontSize: 11, color: COLORS.textDim, fontStyle: "italic" }}>Trabajo finalizado</span>
              ) : sesionesInfo.hay_sesion_abierta ? (
                <button disabled={guardandoSesion} onClick={finalizarServicio} style={{ ...btnStyle(COLORS.rust, "#FFFFFF"), flex: "none", padding: "9px 16px", fontSize: 12.5 }}>
                  Finalizar servicio
                </button>
              ) : (
                <button disabled={guardandoSesion} onClick={iniciarServicio} style={{ ...btnStyle(COLORS.green, "#FFFFFF"), flex: "none", padding: "9px 16px", fontSize: 12.5 }}>
                  Iniciar servicio
                </button>
              )}
            </div>
          </div>
        )}

        {(t.tipo_trabajo === "domicilio" || ["listo", "entregado"].includes(t.estado_actual)) && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6 }}>
                {t.tipo_trabajo === "domicilio" ? "Hoja de trabajo" : "Checklist de salida"}
              </div>
              {esFinal ? null : t.tipo_trabajo === "domicilio" ? (
                t.categoria && CATEGORIAS_DOMICILIO.some((c) => c.key === t.categoria) && (
                  <button onClick={usarPlantillaChecklist} style={{ background: "none", border: "none", color: COLORS.statusBlue, fontSize: 11, cursor: "pointer", padding: 0 }}>
                    + Usar plantilla de {CATEGORIAS_DOMICILIO.find((c) => c.key === t.categoria)?.label}
                  </button>
                )
              ) : (
                <button onClick={usarPlantillaChecklist} style={{ background: "none", border: "none", color: COLORS.statusBlue, fontSize: 11, cursor: "pointer", padding: 0 }}>
                  + Usar checklist estándar
                </button>
              )}
            </div>
            {checklist.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                {checklist.map((item) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" checked={item.completado} onChange={() => toggleItemChecklist(item)} disabled={esFinal} style={{ width: 15, height: 15, cursor: esFinal ? "default" : "pointer", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: item.completado ? COLORS.textDim : COLORS.text, textDecoration: item.completado ? "line-through" : "none", flex: 1 }}>{item.texto}</span>
                    {!esFinal && (
                      <button onClick={() => borrarItemChecklist(item.id)} style={{ background: "none", border: "none", color: COLORS.textDim, cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!esFinal && (
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={nuevoItemChecklist}
                onChange={(e) => setNuevoItemChecklist(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") añadirItemChecklist(nuevoItemChecklist); }}
                placeholder={t.tipo_trabajo === "domicilio" ? "Añadir punto (ej. Cámara 2 alineada)" : "Añadir punto (ej. Funda incluida)"}
                style={{ flex: 1, fontSize: 12.5, padding: "7px 9px", borderRadius: 7, border: `1px solid ${COLORS.line}` }}
              />
              <button disabled={guardandoChecklist} onClick={() => añadirItemChecklist(nuevoItemChecklist)} style={{ ...btnStyle(COLORS.statusBlue, "#FFFFFF"), flex: "none", padding: "7px 12px", fontSize: 12 }}>
                Añadir
              </button>
            </div>
            )}
          </div>
        )}

        {!esFinal && (
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
          {t.presupuesto_estado === "aceptado" && firmasDetalle.find((f) => f.tipo === "presupuesto") && (
            <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
              <ShieldCheck size={12} color={COLORS.green} />
              Firmado el {fechaLarga(firmasDetalle.find((f) => f.tipo === "presupuesto").fecha)}
              {firmasDetalle.find((f) => f.tipo === "presupuesto").ip_aceptacion && (
                <> · IP: {firmasDetalle.find((f) => f.tipo === "presupuesto").ip_aceptacion}</>
              )}
            </div>
          )}
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

          <button
            type="button"
            onClick={() => setMostrarEstimador((v) => !v)}
            style={{ background: "none", border: "none", color: COLORS.statusBlue, fontSize: 11, cursor: "pointer", padding: "0 0 8px 0", display: "block" }}
          >
            💡 {mostrarEstimador ? "Ocultar sugerencia de precio" : "Sugerir precio según mi historial"}
          </button>

          {mostrarEstimador && (
            <div style={{ background: COLORS.surfaceRaised, borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <input
                  type="number"
                  value={costePiezasEstimador}
                  onChange={(e) => setCostePiezasEstimador(e.target.value)}
                  placeholder="Coste de piezas € (opcional)"
                  style={{ flex: 1, fontSize: 12, padding: "7px 9px", borderRadius: 6, border: `1px solid ${COLORS.line}` }}
                />
                <button
                  disabled={cargandoEstimador}
                  onClick={async () => {
                    setCargandoEstimador(true);
                    try {
                      const params = new URLSearchParams({ tipo_trabajo: t.tipo_trabajo || "taller", coste_piezas: costePiezasEstimador || "0" });
                      if (t.categoria) params.set("categoria", t.categoria);
                      setResultadoEstimador(await apiGet(`/sugerencias/estimador?${params}`));
                    } catch (e) {
                      setResultadoEstimador(null);
                    } finally {
                      setCargandoEstimador(false);
                    }
                  }}
                  style={{ ...btnStyle(COLORS.statusBlue, "#FFFFFF"), flex: "none", padding: "7px 12px", fontSize: 12 }}
                >
                  {cargandoEstimador ? "Calculando..." : "Calcular"}
                </button>
              </div>
              {resultadoEstimador && (
                resultadoEstimador.encontradas === 0 ? (
                  <div style={{ fontSize: 11.5, color: COLORS.textDim }}>Todavía no hay suficiente historial de este tipo de trabajo para sugerir un precio.</div>
                ) : (
                  <div>
                    <div style={{ fontSize: 11.5, color: COLORS.textDim, marginBottom: 6 }}>
                      Basado en {resultadoEstimador.encontradas} trabajo(s) similar(es): ~{resultadoEstimador.horas_promedio}h de media × {sesionesInfo.tarifa_hora}€/h = {resultadoEstimador.coste_mano_obra_estimado.toFixed(2)}€ de mano de obra
                      {resultadoEstimador.coste_piezas > 0 && <> + {resultadoEstimador.coste_piezas.toFixed(2)}€ de piezas</>}
                      {resultadoEstimador.suplemento_desplazamiento > 0 && <> + {resultadoEstimador.suplemento_desplazamiento.toFixed(2)}€ de desplazamiento</>}.
                    </div>
                    <button
                      onClick={() => setPresupuestoImporte(String(resultadoEstimador.precio_sugerido))}
                      style={{ ...btnStyle(COLORS.green, "#FFFFFF"), width: "100%", padding: "7px 12px", fontSize: 12.5 }}
                    >
                      Usar {resultadoEstimador.precio_sugerido.toFixed(2)}€ como importe
                    </button>
                  </div>
                )
              )}
            </div>
          )}
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
        )}

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6 }}>Fotos de recepción</div>
            {!esFinal && (
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
            )}
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
                  {!esFinal && (
                    <button
                      onClick={() => borrarFoto(f.id)}
                      style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: COLORS.rust, color: "#FFF", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                      title="Eliminar foto"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {t.estado_actual !== "no_reparable" && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
          <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Repuestos usados</div>
          {errorRepuesto && <div style={{ fontSize: 12, color: COLORS.rust, marginBottom: 8 }}>{errorRepuesto}</div>}
          {repuestosUsados.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {repuestosUsados.map((u) => (
                <div key={u.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.textDim }}>
                  <span>{u.cantidad}× {u.repuesto?.nombre}{u.numero_serie && <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.statusBlue }}> · SN: {u.numero_serie}</span>}</span>
                  <span>{(u.cantidad * u.precio_aplicado).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</span>
                </div>
              ))}
            </div>
          )}
          {!esFinal && (
            <div>
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
              </div>
              <button type="button" onClick={() => setMostrarTrazabilidad((v) => !v)} style={{ background: "none", border: "none", color: COLORS.statusBlue, fontSize: 11, cursor: "pointer", padding: "6px 0", display: "block" }}>
                {mostrarTrazabilidad ? "− Ocultar trazabilidad" : "+ Añadir nº de serie / proveedor de compra (opcional)"}
              </button>
              {mostrarTrazabilidad && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8, background: COLORS.surfaceRaised, borderRadius: 8, padding: 10 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input value={numeroSerieRepuesto} onChange={(e) => setNumeroSerieRepuesto(e.target.value)} placeholder="Nº de serie" style={{ flex: 1, fontSize: 12, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }} />
                    <BotonEscanear onLeido={(valor) => setNumeroSerieRepuesto(valor)} />
                  </div>
                  <input value={facturaCompraRepuesto} onChange={(e) => setFacturaCompraRepuesto(e.target.value)} placeholder="Nº de factura de compra" style={{ fontSize: 12, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }} />
                  <input type="date" value={fechaCompraRepuesto} onChange={(e) => setFechaCompraRepuesto(e.target.value)} style={{ fontSize: 12, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }} />
                </div>
              )}
              <button disabled={asignandoRepuesto || !repuestoSeleccionado} onClick={asignarRepuesto} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), width: "100%", padding: "7px 12px", fontSize: 12 }}>
                Usar
              </button>
            </div>
          )}
        </div>
        )}

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
                <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: COLORS.textDim, gap: 8 }}>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.concepto} · {m.metodo_pago}</span>
                  <span style={{ color: COLORS.green, flexShrink: 0 }}>+{Number(m.monto).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</span>
                  <button
                    type="button"
                    onClick={async () => {
                      const ventana = window.open("", "_blank");
                      try {
                        const res = await fetch(`${API_BASE}/recibos/movimiento/${m.id}/pdf`, { headers: cabecerasAuth() });
                        manejar401(res);
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        if (ventana) ventana.location.href = url;
                      } catch (e) {
                        ventana?.close();
                      }
                    }}
                    style={{ background: "none", border: "none", color: COLORS.statusBlue, fontSize: 11, cursor: "pointer", padding: 0, flexShrink: 0 }}
                  >
                    Recibo
                  </button>
                </div>
              ))}
            </div>
          )}

          {errorCobro && <div style={{ fontSize: 12, color: COLORS.rust, marginBottom: 8 }}>{errorCobro}</div>}

          {esFinal ? (
            totalCobrado <= 0 && (
              <div style={{ fontSize: 11.5, color: COLORS.textDim, fontStyle: "italic" }}>Este trabajo ya está entregado sin ningún cobro registrado.</div>
            )
          ) : (
          <>
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
              <option value="bizum">Bizum</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button disabled={guardandoCobro} onClick={registrarCobro} style={{ ...btnStyle(COLORS.green, "#FFFFFF"), flex: 1, padding: "9px 12px" }}>
              {guardandoCobro ? "Registrando..." : "Registrar cobro"}
            </button>
            {!facturaExistente && (
              <button disabled={guardandoCobro} onClick={cobrarYFacturar} title="Registra el cobro y emite la factura de golpe" style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: 1, padding: "9px 12px", fontSize: 12.5 }}>
                Cobrar y facturar
              </button>
            )}
          </div>
          </>
          )}
          {!esFinal && (
          <button
            type="button"
            disabled={guardandoCobro || !montoCobro}
            onClick={async () => {
              setGuardandoCobro(true);
              try {
                const nuevo = await apiPost("/finanzas", { reparacion_id: t.id, tipo: "gasto", concepto: conceptoCobro || "Gasto de esta visita", monto: parseFloat(montoCobro), metodo_pago: metodoCobro });
                setMovimientos((prev) => [nuevo, ...prev]);
                setMontoCobro("");
              } catch (e) {
                setErrorCobro(e.message);
              } finally {
                setGuardandoCobro(false);
              }
            }}
            style={{ background: "none", border: "none", color: COLORS.rust, fontSize: 11, cursor: "pointer", padding: "6px 0", display: "block" }}
          >
            Registrar como gasto de esta visita (material, gasolina, peajes...) en vez de cobro
          </button>
          )}
        </div>

        {t.estado_actual === "no_reparable" && t.tipo_trabajo !== "domicilio" && (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
            <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Retirada del equipo</div>
            <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 8 }}>
              El equipo no se pudo reparar, pero sigue en el taller hasta que el cliente venga a recogerlo. Cuando pase, márcalo aquí (no se le aplicará garantía, ya que no se reparó nada).
            </div>
            {error && <div style={{ fontSize: 12, color: COLORS.rust, marginBottom: 8 }}>{error}</div>}
            <button disabled={guardando} onClick={() => avanzar("entregado")} style={{ ...btnStyle(COLORS.textDim, "#FFFFFF"), width: "100%", padding: "9px 12px" }}>
              {guardando ? <Loader2 size={13} className="spin" /> : "El cliente ha recogido el equipo (sin reparar)"}
            </button>
          </div>
        )}

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

        {avisosPendientes.length > 0 && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {avisosPendientes.map((aviso, i) => (
              <div key={i} style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11.5, color: COLORS.green, fontWeight: 600, marginBottom: 4 }}>{aviso.nombre || "Aviso listo para enviar"}</div>
                <div style={{ fontSize: 12.5, color: COLORS.text, marginBottom: 8 }}>{aviso.texto}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {aviso.enlace_whatsapp ? (
                    <a
                      href={aviso.enlace_whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setAvisosPendientes((prev) => prev.filter((_, idx) => idx !== i))}
                      style={{ ...btnStyle(COLORS.green, "#FFFFFF"), flex: 1, padding: "8px 12px", fontSize: 12.5, textDecoration: "none" }}
                    >
                      Enviar por WhatsApp
                    </a>
                  ) : (
                    <div style={{ fontSize: 11.5, color: COLORS.textDim }}>El cliente no tiene teléfono guardado.</div>
                  )}
                  <button onClick={() => setAvisosPendientes((prev) => prev.filter((_, idx) => idx !== i))} style={{ ...btnStyle("transparent", COLORS.textDim, COLORS.line), flex: "none", padding: "8px 12px", fontSize: 12.5 }}>
                    Descartar
                  </button>
                </div>
              </div>
            ))}
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

        {t.tipo_trabajo === "domicilio" && ["completado", "entregado"].includes(t.estado_actual) && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
            <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Parte de trabajo</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={async () => {
                  const ventana = window.open("", "_blank");
                  try {
                    const res = await fetch(`${API_BASE}/reparaciones/${t.id}/parte-trabajo/pdf`, { headers: cabecerasAuth() });
                    manejar401(res);
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    if (ventana) ventana.location.href = url;
                  } catch (e) {
                    ventana?.close();
                  }
                }}
                style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: 1, padding: "9px 12px", fontSize: 12.5 }}
              >
                Ver / descargar PDF
              </button>
              {t.cliente?.telefono && (
                <a
                  href={`https://wa.me/${t.cliente.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${t.cliente.nombre.split(" ")[0]}, te paso el parte del servicio realizado (orden ${t.numero_orden}). Descarga el PDF del enlace que te acabo de enviar por aquí y te lo adjunto.`)}`}
                  target="_blank" rel="noreferrer"
                  style={{ ...btnStyle(COLORS.green, "#FFFFFF"), flex: 1, padding: "9px 12px", fontSize: 12.5, textDecoration: "none" }}
                >
                  Avisar por WhatsApp
                </a>
              )}
            </div>
            <div style={{ fontSize: 10.5, color: COLORS.textDim, marginTop: 6 }}>
              Descarga el PDF y adjúntalo manualmente en WhatsApp — no se puede enviar el archivo directo desde aquí.
            </div>
          </div>
        )}

        {t.tipo_trabajo === "domicilio" && ["completado", "entregado"].includes(t.estado_actual) && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
            <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Recordatorio de mantenimiento</div>
            <CrearRecordatorio reparacion={t} />
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
          {facturaExistente && !facturaExistente.es_rectificativa && (
            <button
              type="button"
              disabled={rectificando}
              onClick={async () => {
                const motivo = window.prompt("¿Cuál es el motivo de la rectificación? (obligatorio, queda registrado en la factura)");
                if (!motivo) return;
                const nuevoTotalStr = window.prompt("¿Nuevo importe total en €? (deja en blanco si el error no era de importe, ej. solo el NIF)", String(facturaExistente.total));
                setRectificando(true);
                try {
                  const rectificativa = await apiPost(`/facturas/${facturaExistente.id}/rectificar`, {
                    motivo,
                    nuevo_total: nuevoTotalStr ? parseFloat(nuevoTotalStr) : null,
                  });
                  setFacturaExistente(rectificativa);
                  window.open(`${API_BASE}/facturas/${rectificativa.id}/pdf`, "_blank");
                } catch (e) {
                  setErrorPago(e.message);
                } finally {
                  setRectificando(false);
                }
              }}
              style={{ background: "none", border: "none", color: COLORS.rust, fontSize: 11, cursor: "pointer", padding: "6px 0", display: "block", marginTop: 4 }}
            >
              {rectificando ? "Generando rectificativa..." : "¿Error en esta factura? Emitir una rectificativa"}
            </button>
          )}
          {facturaExistente?.es_rectificativa && (
            <div style={{ fontSize: 11, color: COLORS.rust, marginTop: 6 }}>
              Esta es una factura rectificativa (corrige a {facturaExistente.factura_original_numero}).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------- modal: nueva reparación --------------------
function NuevaReparacionModal({ onClose, onCreada }) {
  const [form, setForm] = useState({ nombreCliente: "", telefono: "", email: "", tipoTrabajo: "taller", direccionServicio: "", categoria: "", equipo: "", marca: "", modelo: "", urgente: false, problema: "", fechaEstimada: "", tecnico: "" });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [alertaCliente, setAlertaCliente] = useState(null);
  const [tecnicos, setTecnicos] = useState([]);
  const [sugerenciasFallos, setSugerenciasFallos] = useState(null);
  const [buscandoSugerencias, setBuscandoSugerencias] = useState(false);

  useEffect(() => {
    apiGet("/configuracion").then((c) => setTecnicos(c.tecnicos || [])).catch(() => {});
  }, []);

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      if (field === "nombreCliente") {
        setClienteSeleccionado(null);
        setAlertaCliente(null);
      }
    };
  }

  useEffect(() => {
    if (clienteSeleccionado || form.nombreCliente.trim().length < 2) {
      setSugerencias([]);
      return;
    }
    const timer = setTimeout(() => {
      apiGet(`/clientes?q=${encodeURIComponent(form.nombreCliente)}`).then(setSugerencias).catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [form.nombreCliente, clienteSeleccionado]);

  async function elegirCliente(c) {
    setClienteSeleccionado(c);
    setForm((f) => ({ ...f, nombreCliente: c.nombre, telefono: c.telefono || "", email: c.email || "" }));
    setSugerencias([]);
    try {
      const detalle = await apiGet(`/clientes/${c.id}`);
      const partes = [];
      if (detalle.resumen?.sin_cobrar?.length > 0) {
        partes.push(`${detalle.resumen.sin_cobrar.length} reparación(es) entregada(s) sin cobrar (${detalle.resumen.sin_cobrar.map((r) => "#" + r.numero_orden).join(", ")})`);
      }
      if (detalle.resumen?.en_garantia?.length > 0) {
        partes.push(`${detalle.resumen.en_garantia.length} equipo(s) todavía en garantía: ${detalle.resumen.en_garantia.map((r) => `${r.equipo} (hasta ${fechaLarga(r.fecha_fin_garantia)})`).join("; ")}`);
      }
      setAlertaCliente(partes.length > 0 ? partes : null);
    } catch (e) {
      /* silencioso */
    }
  }

  async function guardar() {
    setError("");
    if (!form.nombreCliente.trim() || !form.equipo.trim()) {
      setError(form.tipoTrabajo === "domicilio" ? "Cliente y descripción del servicio son obligatorios." : "Cliente y equipo son obligatorios.");
      return;
    }
    setGuardando(true);
    try {
      const cliente = clienteSeleccionado || await apiPost("/clientes", { nombre: form.nombreCliente, telefono: form.telefono, email: form.email });
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
        tecnico: form.tecnico,
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

        <label style={{ fontSize: 12, color: COLORS.textDim, position: "relative", display: "block" }}>Cliente
          <input style={inputStyle} value={form.nombreCliente} onChange={set("nombreCliente")} placeholder="Nombre y apellidos" autoComplete="off" />
          {sugerencias.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#FFFFFF", border: `1px solid ${COLORS.line}`, borderRadius: 8, marginTop: 2, zIndex: 5, boxShadow: "0 6px 16px rgba(0,0,0,0.1)", maxHeight: 160, overflowY: "auto" }}>
              {sugerencias.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => elegirCliente(c)}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 11px", background: "none", border: "none", cursor: "pointer", fontSize: 12.5, borderBottom: `1px solid ${COLORS.line}` }}
                >
                  <div style={{ fontWeight: 600, color: COLORS.text }}>{c.nombre}</div>
                  <div style={{ fontSize: 11, color: COLORS.textDim }}>{c.codigo}{c.telefono ? ` · ${c.telefono}` : ""}</div>
                </button>
              ))}
            </div>
          )}
        </label>
        {clienteSeleccionado && (
          <div style={{ fontSize: 11, color: COLORS.green, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <CheckCircle2 size={12} /> Cliente existente ({clienteSeleccionado.codigo}) — no se creará uno nuevo.
          </div>
        )}
        {alertaCliente && (
          <div style={{ marginTop: 8, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: 10 }}>
            {alertaCliente.map((texto, i) => (
              <div key={i} style={{ fontSize: 11.5, color: "#78350F", display: "flex", gap: 6, marginBottom: i === alertaCliente.length - 1 ? 0 : 4 }}>
                <TriangleAlert size={13} color={COLORS.statusAmber} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{texto}</span>
              </div>
            ))}
          </div>
        )}
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
        {(form.marca || form.problema) && (
          <button
            type="button"
            onClick={async () => {
              setBuscandoSugerencias(true);
              try {
                const params = new URLSearchParams();
                if (form.marca) params.set("marca", form.marca);
                if (form.modelo) params.set("modelo", form.modelo);
                if (form.problema) params.set("problema", form.problema);
                setSugerenciasFallos(await apiGet(`/sugerencias/fallos-frecuentes?${params}`));
              } catch (e) {
                setSugerenciasFallos(null);
              } finally {
                setBuscandoSugerencias(false);
              }
            }}
            style={{ background: "none", border: "none", color: COLORS.statusBlue, fontSize: 11, cursor: "pointer", padding: "4px 0", display: "block" }}
          >
            {buscandoSugerencias ? "Buscando en tu historial..." : "Ver casos parecidos en tu historial"}
          </button>
        )}
        {sugerenciasFallos && (
          <div style={{ fontSize: 11.5, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: 10, marginBottom: 4 }}>
            {sugerenciasFallos.sugerencias.length === 0 ? (
              <span style={{ color: COLORS.textDim }}>Sin casos parecidos todavía.</span>
            ) : (
              <>
                <div style={{ color: COLORS.statusBlue, fontWeight: 600, marginBottom: 4 }}>Encontrados en {sugerenciasFallos.encontradas} caso(s) parecido(s):</div>
                {sugerenciasFallos.sugerencias.map((s, i) => (
                  <div key={i} style={{ color: COLORS.text }}>• {s.descripcion} <span style={{ color: COLORS.textDim }}>({s.veces_visto}×)</span></div>
                ))}
              </>
            )}
          </div>
        )}
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Fecha estimada de entrega <span style={{ fontWeight: 400 }}>(opcional)</span>
          <input style={inputStyle} type="date" value={form.fechaEstimada} onChange={set("fechaEstimada")} />
        </label>
        {tecnicos.length > 0 && (
          <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Técnico responsable <span style={{ fontWeight: 400 }}>(opcional)</span>
            <select style={inputStyle} value={form.tecnico} onChange={set("tecnico")}>
              <option value="">Sin asignar</option>
              {tecnicos.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}
            </select>
          </label>
        )}
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
  const [borrandoRgpd, setBorrandoRgpd] = useState(false);
  const [resultadoRgpd, setResultadoRgpd] = useState(null);

  async function ejercerDerechoAlOlvido() {
    if (!window.confirm(
      `Esto borrará PARA SIEMPRE el nombre, teléfono, email, NIF, fotos y firmas de "${detalle.nombre}" — no se puede deshacer.\n\nSe conservarán (por obligación fiscal): las facturas ya emitidas y el historial básico de reparaciones (equipo, fechas, cobros), sin ningún dato personal.\n\n¿Confirmas que quieres continuar?`
    )) {
      return;
    }
    const motivo = window.prompt("Motivo de la solicitud (queda registrado, por si hay que demostrar que se atendió):", "Solicitud del cliente");
    if (motivo === null) return;

    setBorrandoRgpd(true);
    setResultadoRgpd(null);
    try {
      const resultado = await apiPost(`/clientes/${detalle.id}/rgpd/olvidar`, { motivo });
      setResultadoRgpd(resultado);
      const actualizado = await apiGet(`/clientes/${detalle.id}`);
      setDetalle(actualizado);
      cargar(query);
    } catch (e) {
      setResultadoRgpd({ ok: false, error: e.message });
    } finally {
      setBorrandoRgpd(false);
    }
  }

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

              {detalle.resumen && (detalle.resumen.sin_cobrar?.length > 0 || detalle.resumen.en_garantia?.length > 0) && (
                <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  {detalle.resumen.sin_cobrar?.length > 0 && (
                    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 9, padding: 10, display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <TriangleAlert size={14} color={COLORS.rust} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontSize: 12, color: "#991B1B" }}>
                        <strong>{detalle.resumen.sin_cobrar.length}</strong> reparación{detalle.resumen.sin_cobrar.length === 1 ? "" : "es"} entregada{detalle.resumen.sin_cobrar.length === 1 ? "" : "s"} sin cobrar: {detalle.resumen.sin_cobrar.map((r) => `#${r.numero_orden}`).join(", ")}
                      </div>
                    </div>
                  )}
                  {detalle.resumen.en_garantia?.length > 0 && (
                    <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 9, padding: 10, display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <ShieldCheck size={14} color={COLORS.green} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontSize: 12, color: "#166534" }}>
                        <strong>{detalle.resumen.en_garantia.length}</strong> equipo{detalle.resumen.en_garantia.length === 1 ? "" : "s"} en garantía: {detalle.resumen.en_garantia.map((r) => `${r.equipo} (hasta ${fechaLarga(r.fecha_fin_garantia)})`).join("; ")}
                      </div>
                    </div>
                  )}
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

              {!detalle.nombre?.startsWith("Cliente eliminado (RGPD") && (
                <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
                  <button
                    type="button"
                    disabled={borrandoRgpd}
                    onClick={ejercerDerechoAlOlvido}
                    style={{ background: "none", border: `1px solid ${COLORS.rust}`, color: COLORS.rust, fontSize: 11.5, cursor: "pointer", padding: "7px 12px", borderRadius: 7, width: "100%" }}
                  >
                    {borrandoRgpd ? "Borrando..." : "🗑️ Ejercer derecho al olvido (RGPD)"}
                  </button>
                  {resultadoRgpd?.ok && (
                    <div style={{ fontSize: 11, color: COLORS.green, marginTop: 6 }}>
                      ✓ Hecho. Fotos borradas: {resultadoRgpd.fotos_borradas}, firmas borradas: {resultadoRgpd.firmas_borradas}. {resultadoRgpd.conservado}
                    </div>
                  )}
                  {resultadoRgpd?.error && <div style={{ fontSize: 11, color: COLORS.rust, marginTop: 6 }}>Error: {resultadoRgpd.error}</div>}
                </div>
              )}
              {detalle.nombre?.startsWith("Cliente eliminado (RGPD") && (
                <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${COLORS.line}`, fontSize: 11.5, color: COLORS.textDim, fontStyle: "italic" }}>
                  Los datos personales de este cliente ya fueron eliminados (derecho al olvido).
                </div>
              )}
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

// -------------------- Panel de alertas del negocio --------------------
// -------------------- Campanita de notificaciones (cabecera, global) --------------------
function CampanitaNotificaciones({ onIrVista, onAbrirTicket }) {
  const [abierta, setAbierta] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const [repuestos, todasReparaciones, abandonados, garantias, solicitudes] = await Promise.all([
        apiGet("/repuestos").catch(() => []),
        apiGet("/reparaciones").catch(() => []),
        apiGet("/reportes/abandonados?dias=30").catch(() => []),
        apiGet("/reportes/garantias-activas").catch(() => []),
        apiGet("/solicitudes").catch(() => []),
      ]);
      const nuevos = [];
      const stockBajo = repuestos.filter((r) => r.stock_bajo);
      if (stockBajo.length > 0) nuevos.push({ tipo: "stock", texto: `${stockBajo.length} repuesto(s) con stock bajo`, accion: () => onIrVista("inventario") });
      const rechazados = todasReparaciones.filter((r) => r.presupuesto_estado === "rechazado");
      rechazados.forEach((r) => nuevos.push({ tipo: "rechazo", texto: `Presupuesto rechazado — ${r.cliente?.nombre} #${r.numero_orden}`, accion: () => onAbrirTicket(r) }));
      abandonados.forEach((a) => nuevos.push({ tipo: "abandono", texto: `${a.cliente?.nombre}: equipo sin recoger hace ${a.dias_abandonado} días`, accion: () => { const rep = todasReparaciones.find((r) => r.id === a.id); if (rep) onAbrirTicket(rep); } }));
      const porCaducar = garantias.filter((g) => g.dias_restantes <= 15);
      if (porCaducar.length > 0) nuevos.push({ tipo: "garantia", texto: `${porCaducar.length} garantía(s) a punto de caducar`, accion: () => onIrVista("garantias") });
      const solicitudesPendientes = solicitudes.filter((s) => !s.atendida);
      if (solicitudesPendientes.length > 0) nuevos.push({ tipo: "solicitud", texto: `${solicitudesPendientes.length} solicitud(es) de servicio sin atender`, accion: () => onIrVista("solicitudes") });
      setItems(nuevos);
    } catch (e) {
      /* silencioso */
    }
  }, [onIrVista, onAbrirTicket]);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 60000); // refresca cada minuto, sin que haga falta recargar la página
    return () => clearInterval(intervalo);
  }, [cargar]);

  useEffect(() => {
    function alClicarFuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierta(false);
    }
    document.addEventListener("mousedown", alClicarFuera);
    return () => document.removeEventListener("mousedown", alClicarFuera);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: items.length > 0 ? "#FEF2F2" : COLORS.surface, border: `1px solid ${items.length > 0 ? "#FECACA" : COLORS.line}`, borderRadius: 999, padding: "7px 12px", cursor: "pointer", position: "relative" }}
      >
        <Bell size={15} color={items.length > 0 ? COLORS.rust : COLORS.textDim} />
        {items.length > 0 && (
          <span style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.rust }}>{items.length}</span>
        )}
      </button>
      {abierta && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 320, maxHeight: 400, overflowY: "auto", background: "#FFFFFF", border: `1px solid ${COLORS.line}`, borderRadius: 12, boxShadow: "0 12px 28px -8px rgba(0,0,0,0.18)", zIndex: 70 }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 12.5, fontWeight: 700, color: COLORS.text }}>Notificaciones</div>
          {items.length === 0 ? (
            <div style={{ padding: 16, fontSize: 12.5, color: COLORS.textDim, textAlign: "center" }}>Todo al día — sin avisos pendientes.</div>
          ) : (
            items.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { item.accion(); setAbierta(false); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 14px", background: "none", border: "none", borderBottom: i < items.length - 1 ? `1px solid ${COLORS.line}` : "none", cursor: "pointer", fontSize: 12.5, color: COLORS.text }}
              >
                {item.texto}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// -------------------- Insignia de usuario (cabecera, global) --------------------
function InsigniaUsuario({ onCerrarSesion }) {
  const [nombre] = useState(() => nombreUsuarioDelToken());
  return (
    <button
      type="button"
      onClick={onCerrarSesion}
      title="Cerrar sesión"
      style={{ display: "flex", alignItems: "center", gap: 7, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 999, padding: "6px 12px 6px 6px", cursor: "pointer" }}
    >
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: COLORS.sidebarBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Users size={12} color="#FFFFFF" />
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.text, textTransform: "capitalize" }}>{nombre}</span>
      <span style={{ fontSize: 11, color: COLORS.textDim, display: "flex", alignItems: "center", gap: 2 }}>
        <LogOut size={11} /> Salir
      </span>
    </button>
  );
}

function PanelAlertas({ reparaciones, onAbrir, onIrInventario, onIrGarantias }) {
  const [stockBajo, setStockBajo] = useState([]);
  const [abandonados, setAbandonados] = useState([]);
  const [garantiasPorCaducar, setGarantiasPorCaducar] = useState([]);

  useEffect(() => {
    apiGet("/repuestos").then((lista) => setStockBajo(lista.filter((r) => r.stock_bajo))).catch(() => {});
    apiGet("/reportes/abandonados?dias=30").then(setAbandonados).catch(() => {});
    apiGet("/reportes/garantias-activas").then((lista) => setGarantiasPorCaducar(lista.filter((g) => g.dias_restantes <= 15))).catch(() => {});
  }, []);

  const rechazados = reparaciones.filter((r) => r.presupuesto_estado === "rechazado");

  if (stockBajo.length === 0 && rechazados.length === 0 && abandonados.length === 0 && garantiasPorCaducar.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
      {rechazados.length > 0 && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 9, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <TriangleAlert size={14} /> {rechazados.length} presupuesto{rechazados.length === 1 ? "" : "s"} rechazado{rechazados.length === 1 ? "" : "s"}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {rechazados.map((r) => (
              <button key={r.id} onClick={() => onAbrir(r)} style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 999, border: "1px solid #FECACA", background: "#FFFFFF", color: "#991B1B", cursor: "pointer" }}>
                {r.cliente?.nombre} · #{r.numero_orden}
              </button>
            ))}
          </div>
        </div>
      )}
      {abandonados.length > 0 && (
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 9, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#78350F", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Bell size={14} /> {abandonados.length} equipo{abandonados.length === 1 ? "" : "s"} listo{abandonados.length === 1 ? "" : "s"} sin recoger hace 30+ días
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {abandonados.map((a) => (
              <button
                key={a.id}
                onClick={() => { const rep = reparaciones.find((r) => r.id === a.id); if (rep) onAbrir(rep); }}
                style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 999, border: "1px solid #FDE68A", background: "#FFFFFF", color: "#78350F", cursor: "pointer" }}
              >
                {a.cliente?.nombre} · {a.dias_abandonado} días
              </button>
            ))}
          </div>
        </div>
      )}
      {garantiasPorCaducar.length > 0 && (
        <button
          type="button"
          onClick={onIrGarantias}
          style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 9, padding: 12, cursor: "pointer", textAlign: "left", width: "100%" }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.statusBlue, display: "flex", alignItems: "center", gap: 6 }}>
            <ShieldCheck size={14} /> {garantiasPorCaducar.length} garantía{garantiasPorCaducar.length === 1 ? "" : "s"} a punto de caducar (15 días o menos): {garantiasPorCaducar.map((g) => g.cliente?.nombre).join(", ")}
          </div>
        </button>
      )}
      {stockBajo.length > 0 && (
        <button
          type="button"
          onClick={onIrInventario}
          style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 9, padding: 12, cursor: "pointer", textAlign: "left", width: "100%" }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", display: "flex", alignItems: "center", gap: 6 }}>
            <Package size={14} /> {stockBajo.length} repuesto{stockBajo.length === 1 ? "" : "s"} con stock bajo: {stockBajo.map((r) => r.nombre).join(", ")}
          </div>
        </button>
      )}
    </div>
  );
}

function PanelProximaAccion({ reparaciones, onAbrir, resaltada, onHover }) {
  const prioritaria = useMemo(() => {
    const activas = reparaciones.filter((r) => !["entregado", "no_reparable", "completado"].includes(r.estado_actual));
    if (activas.length === 0) return null;
    return [...activas].sort(
      (a, b) => (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0) || new Date(a.fecha_recepcion) - new Date(b.fecha_recepcion)
    )[0];
  }, [reparaciones]);

  const mostrada = resaltada || prioritaria;
  if (!mostrada) return null;

  const enlaceWhatsapp = mostrada.cliente?.telefono
    ? `https://wa.me/${mostrada.cliente.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${mostrada.cliente.nombre.split(" ")[0]}, te escribimos sobre tu reparación nº ${mostrada.numero_orden}.`)}`
    : null;

  return (
    <div
      className="fn-proxima-accion"
      onMouseEnter={() => { if (resaltada) onHover?.(resaltada); }}
      onMouseLeave={() => onHover?.(null)}
      style={{ background: COLORS.surface, borderTop: `1px solid ${resaltada ? COLORS.violet : COLORS.line}`, borderRight: `1px solid ${resaltada ? COLORS.violet : COLORS.line}`, borderBottom: `1px solid ${resaltada ? COLORS.violet : COLORS.line}`, borderLeft: `4px solid ${resaltada ? COLORS.violet : COLORS.statusAmber}`, borderRadius: 12, padding: 13, position: "relative", overflow: "hidden", transition: "border-color 0.2s ease" }}
    >
      <div style={{ position: "absolute", top: -8, right: -8, width: 60, height: 60, borderRadius: "50%", background: `${resaltada ? COLORS.violet : COLORS.statusAmber}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Target size={24} color={resaltada ? COLORS.violet : COLORS.statusAmber} style={{ marginBottom: 8, marginRight: 8, opacity: 0.85 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6 }}>Próxima acción</div>
        {resaltada && <span style={{ fontSize: 9.5, fontWeight: 600, color: COLORS.violet, background: `${COLORS.violet}18`, padding: "2px 6px", borderRadius: 999 }}>En vista previa</span>}
      </div>
      <div style={{ fontSize: 12.5, color: COLORS.text, fontWeight: 600, marginTop: 4 }}>
        {mostrada.urgente && <Flame size={11} color={COLORS.rust} style={{ marginRight: 4, verticalAlign: -1 }} />}
        {mostrada.cliente?.nombre} · #{mostrada.numero_orden}
      </div>
      <div style={{ fontSize: 11, color: COLORS.textDim }}>{mostrada.equipo}</div>
      {mostrada.problema_reportado && (
        <div style={{ fontSize: 10.5, color: COLORS.textDim, fontStyle: "italic", marginTop: 2, marginBottom: 8 }}>"{mostrada.problema_reportado}"</div>
      )}
      {!mostrada.problema_reportado && <div style={{ marginBottom: 8 }} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          onClick={() => onAbrir(mostrada)}
          style={{ ...btnStyle(COLORS.green, "#FFFFFF"), padding: "8px 12px", fontSize: 12, borderRadius: 8, boxShadow: "0 4px 10px rgba(34,197,94,0.3)" }}
        >
          {ACCION_POR_ESTADO[mostrada.estado_actual] || "Ver reparación"}
        </button>
        <a
          href={enlaceWhatsapp || undefined}
          target="_blank"
          rel="noreferrer"
          style={{ ...btnStyle(COLORS.statusAmber, "#FFFFFF"), padding: "8px 12px", fontSize: 12, borderRadius: 8, textDecoration: "none", opacity: enlaceWhatsapp ? 1 : 0.5, pointerEvents: enlaceWhatsapp ? "auto" : "none", boxShadow: enlaceWhatsapp ? "0 4px 10px rgba(245,158,11,0.3)" : "none" }}
        >
          Contactar cliente (WhatsApp)
        </a>
        <button
          onClick={() => onAbrir(mostrada)}
          style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), padding: "8px 12px", fontSize: 12, borderRadius: 8, boxShadow: "0 4px 10px rgba(37,99,235,0.3)" }}
        >
          Generar presupuesto
        </button>
      </div>
    </div>
  );
}

function ReportesView({ reporteDiario, reporteMensual, contador, tendencia, onFiltrarPorEstado }) {
  const num = (v) => Number(v || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 });
  const [mesExportar, setMesExportar] = useState(() => new Date().toISOString().slice(0, 7));
  const [exportando, setExportando] = useState(false);

  async function descargarCsv() {
    setExportando(true);
    try {
      const res = await fetch(`${API_BASE}/reportes/exportar?mes=${mesExportar}`, { headers: cabecerasAuth() });
      manejar401(res);
      if (!res.ok) throw new Error("No se pudo generar la exportación");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `resumen_${mesExportar}.csv`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      /* se puede mejorar con mensaje visible si hace falta */
    } finally {
      setExportando(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Exportar resumen contable (ingresos, gastos y facturas) de:</div>
        <input type="month" value={mesExportar} onChange={(e) => setMesExportar(e.target.value)} style={{ fontSize: 12.5, padding: "7px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}` }} />
        <button disabled={exportando} onClick={descargarCsv} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "8px 14px", fontSize: 12.5 }}>
          {exportando ? "Generando..." : "Descargar CSV"}
        </button>
      </div>

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
        <div style={{ flex: 1, minWidth: 260, background: COLORS.surface, borderTop: `1px solid ${COLORS.line}`, borderRight: `1px solid ${COLORS.line}`, borderBottom: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${reporteDiario.balance_neto >= 0 ? COLORS.green : COLORS.rust}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontFamily: "Oswald", fontSize: 16, color: COLORS.text, marginBottom: 14 }}>Hoy</div>
          <Row label="Equipos recibidos" value={reporteDiario.equipos_recibidos ?? 0} />
          <Row label="Equipos entregados" value={reporteDiario.equipos_entregados ?? 0} />
          <Row label="Ingresos" value={`${num(reporteDiario.ingresos)} €`} />
          <Row label="Gastos" value={`${num(reporteDiario.gastos)} €`} />
          <div style={{ borderTop: `1px solid ${COLORS.line}`, marginTop: 8, paddingTop: 8 }}>
            <Row label="Balance neto" value={`${num(reporteDiario.balance_neto)} €`} />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 260, background: COLORS.surface, borderTop: `1px solid ${COLORS.line}`, borderRight: `1px solid ${COLORS.line}`, borderBottom: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${COLORS.statusBlue}`, borderRadius: 12, padding: 20 }}>
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
          <StatCard label="Totales" value={contador.total} icon={Ticket} accent={COLORS.amber} destacada onClick={() => onFiltrarPorEstado(null)} />
          <StatCard label="En curso" value={contador.en_curso} icon={CircleDot} accent={COLORS.teal} onClick={() => onFiltrarPorEstado("en_curso")} />
          <StatCard label="Entregadas" value={contador.entregadas} icon={ShieldCheck} accent={COLORS.green} onClick={() => onFiltrarPorEstado("entregadas")} />
          <StatCard label="No reparables" value={contador.no_reparables} icon={TriangleAlert} accent={COLORS.statusAmber} onClick={() => onFiltrarPorEstado("no_reparables")} />
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
              <option value="bizum">Bizum</option>
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
// -------------------- vista: Garantías con proveedores (RMA) --------------------
const ETIQUETAS_RMA = { enviado: "Enviado", en_proceso: "En proceso", resuelto: "Resuelto", rechazado: "Rechazado" };
const COLORES_RMA = { enviado: COLORS.statusAmber, en_proceso: COLORS.statusBlue, resuelto: COLORS.green, rechazado: COLORS.rust };

// -------------------- vista: Rendimiento de técnicos --------------------
// -------------------- vista: Rentabilidad por línea de servicio --------------------
const NOMBRES_CATEGORIA_RENTABILIDAD = {
  reparacion_general: "Reparación general",
  redes: "Redes/Internet",
  camaras: "Cámaras CCTV/IP",
  impresoras: "Impresoras/Periféricos",
  mantenimiento_empresas: "Mantenimiento empresas",
};

function RentabilidadView() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    apiGet("/reportes/rentabilidad").then(setDatos).catch(() => {}).finally(() => setCargando(false));
  }, []);

  const maxIngresos = Math.max(1, ...datos.map((d) => d.ingresos));

  return (
    <div>
      <div style={{ fontSize: 12.5, color: COLORS.textDim, marginBottom: 16 }}>
        Ingresos, coste de piezas (a precio de compra) y margen, por línea de servicio — solo con trabajos ya entregados/completados.
      </div>
      {cargando && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>}
      {!cargando && datos.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Todavía no hay suficientes trabajos entregados para calcular esto.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {datos.map((d, i) => (
          <div key={d.categoria} style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.line}`, borderRight: `1px solid ${COLORS.line}`, borderBottom: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${[COLORS.green, COLORS.statusBlue, COLORS.violet, COLORS.statusAmber, COLORS.teal][i % 5]}`, borderRadius: 12, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{NOMBRES_CATEGORIA_RENTABILIDAD[d.categoria] || d.categoria}</div>
                <div style={{ fontSize: 11.5, color: COLORS.textDim }}>{d.trabajos} trabajo{d.trabajos === 1 ? "" : "s"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontWeight: 700, color: d.margen >= 0 ? COLORS.green : COLORS.rust }}>
                  {d.margen.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                </div>
                <div style={{ fontSize: 10.5, color: COLORS.textDim, textTransform: "uppercase" }}>Margen ({d.margen_pct}%)</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 11.5, color: COLORS.textDim, marginBottom: 8 }}>
              <span>Ingresos: <strong style={{ color: COLORS.text }}>{d.ingresos.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</strong></span>
              <span>Coste piezas: <strong style={{ color: COLORS.text }}>{d.coste_piezas.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</strong></span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: COLORS.surfaceRaised, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(d.ingresos / maxIngresos) * 100}%`, background: [COLORS.green, COLORS.statusBlue, COLORS.violet, COLORS.statusAmber, COLORS.teal][i % 5], borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RendimientoView() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/reportes/rendimiento")
      .then(setDatos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  const maxCompletados = Math.max(1, ...datos.map((d) => d.completados));

  return (
    <div>
      <div style={{ fontSize: 12.5, color: COLORS.textDim, marginBottom: 16 }}>
        Trabajos completados (entregados) y tiempo medio desde la recepción hasta la entrega, por técnico. Solo cuenta lo que tenga un técnico asignado — puedes asignarlo desde la ficha de cada reparación.
      </div>

      {cargando && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>}
      {error && <div style={{ fontSize: 12.5, color: COLORS.rust }}>{error}</div>}
      {!cargando && datos.length === 0 && (
        <div style={{ fontSize: 12.5, color: COLORS.textDim, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 16 }}>
          Todavía no hay datos. Asigna un técnico a tus reparaciones (al darlas de alta o desde la ficha) y, en cuanto entregues alguna, aparecerá aquí.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {datos.map((d, i) => (
          <div key={d.tecnico} style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.line}`, borderRight: `1px solid ${COLORS.line}`, borderBottom: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${[COLORS.amber, COLORS.violet, COLORS.green, COLORS.statusBlue, COLORS.statusAmber][i % 5]}`, borderRadius: 12, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{d.tecnico}</div>
              <div style={{ display: "flex", gap: 18 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontWeight: 700, color: COLORS.text }}>{d.completados}</div>
                  <div style={{ fontSize: 10.5, color: COLORS.textDim, textTransform: "uppercase" }}>Completados</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontWeight: 700, color: COLORS.text }}>{d.tiempo_promedio_horas}h</div>
                  <div style={{ fontSize: 10.5, color: COLORS.textDim, textTransform: "uppercase" }}>Tiempo medio</div>
                </div>
              </div>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: COLORS.surfaceRaised, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(d.completados / maxCompletados) * 100}%`, background: [COLORS.amber, COLORS.violet, COLORS.green, COLORS.statusBlue, COLORS.statusAmber][i % 5], borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------- vista: Garantías activas --------------------
function GarantiasActivasView({ onAbrir, reparaciones }) {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    apiGet("/reportes/garantias-activas").then(setLista).catch(() => {}).finally(() => setCargando(false));
  }, []);

  function colorPorDias(dias) {
    if (dias <= 15) return COLORS.rust;
    if (dias <= 30) return COLORS.statusAmber;
    return COLORS.green;
  }

  return (
    <div>
      <div style={{ fontSize: 12.5, color: COLORS.textDim, marginBottom: 16 }}>
        Todas las reparaciones que siguen dentro del plazo de garantía ahora mismo, de la que antes caduca a la que más tarda.
      </div>
      {cargando && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>}
      {!cargando && lista.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 16 }}>No hay ninguna garantía activa ahora mismo.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {lista.map((g) => (
          <div
            key={g.id}
            onClick={() => { const rep = reparaciones.find((r) => r.id === g.id); if (rep) onAbrir(rep); }}
            style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.line}`, borderRight: `1px solid ${COLORS.line}`, borderBottom: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${colorPorDias(g.dias_restantes)}`, borderRadius: 10, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, cursor: "pointer" }}
          >
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.text }}>{g.cliente?.nombre} · #{g.numero_orden}</div>
              <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>{g.equipo} — caduca el {fechaLarga(g.fecha_fin_garantia)}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#FFFFFF", background: colorPorDias(g.dias_restantes), borderRadius: 999, padding: "3px 10px", flexShrink: 0, whiteSpace: "nowrap" }}>
              {g.dias_restantes} día{g.dias_restantes === 1 ? "" : "s"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RmaView() {
  const [rmas, setRmas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ proveedor_id: "", repuesto_id: "", numero_orden: "", numero_serie: "", motivo: "" });
  const [guardando, setGuardando] = useState(false);
  const [buscarSerie, setBuscarSerie] = useState("");
  const [resultadoSerie, setResultadoSerie] = useState(null);
  const [errorSerie, setErrorSerie] = useState("");
  const [buscandoSerie, setBuscandoSerie] = useState(false);

  async function buscarPorSerie() {
    if (!buscarSerie.trim()) return;
    setBuscandoSerie(true);
    setErrorSerie("");
    setResultadoSerie(null);
    try {
      const data = await apiGet(`/reparaciones/buscar-serie/${encodeURIComponent(buscarSerie.trim())}`);
      setResultadoSerie(data);
    } catch (e) {
      setErrorSerie("No se encontró ningún repuesto con ese número de serie.");
    } finally {
      setBuscandoSerie(false);
    }
  }

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [listaRma, listaProv, listaRep] = await Promise.all([
        apiGet(`/rma${filtroEstado ? `?estado=${filtroEstado}` : ""}`),
        apiGet("/proveedores"),
        apiGet("/repuestos"),
      ]);
      setRmas(listaRma);
      setProveedores(listaProv);
      setRepuestos(listaRep);
    } catch (e) {
      /* el aviso general ya se ve en Reparaciones */
    } finally {
      setCargando(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crear() {
    if (!form.proveedor_id || !form.motivo.trim()) return;
    setGuardando(true);
    try {
      let reparacion_id = null;
      if (form.numero_orden.trim()) {
        const coincidencias = await apiGet(`/reparaciones?q=${encodeURIComponent(form.numero_orden.trim())}`).catch(() => []);
        const encontrada = (coincidencias || []).find((r) => r.numero_orden === form.numero_orden.trim());
        reparacion_id = encontrada?.id || null;
      }
      await apiPost("/rma", {
        proveedor_id: parseInt(form.proveedor_id, 10),
        repuesto_id: form.repuesto_id ? parseInt(form.repuesto_id, 10) : null,
        reparacion_id,
        numero_serie: form.numero_serie,
        motivo: form.motivo,
      });
      setForm({ proveedor_id: "", repuesto_id: "", numero_orden: "", numero_serie: "", motivo: "" });
      setMostrarForm(false);
      cargar();
    } catch (e) {
      /* se puede mejorar con mensaje visible si hace falta */
    } finally {
      setGuardando(false);
    }
  }

  async function actualizarEstado(id, cambios) {
    try {
      const res = await fetch(`${API_BASE}/rma/${id}`, { method: "PATCH", headers: cabecerasAuth({ "Content-Type": "application/json" }), body: JSON.stringify(cambios) });
      manejar401(res);
      const actualizado = await res.json();
      setRmas((prev) => prev.map((r) => (r.id === id ? actualizado : r)));
    } catch (e) {
      /* silencioso */
    }
  }

  const inputStyle = { fontSize: 12.5, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box" };

  return (
    <div>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, color: COLORS.textDim, marginBottom: 8 }}>Trazabilidad: busca en qué reparación se usó una pieza por su nº de serie</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={buscarSerie}
            onChange={(e) => setBuscarSerie(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") buscarPorSerie(); }}
            placeholder="Nº de serie..."
            style={{ ...inputStyle, flex: 1 }}
          />
          <button disabled={buscandoSerie} onClick={buscarPorSerie} style={{ ...btnStyle(COLORS.statusBlue, "#FFFFFF"), flex: "none", padding: "8px 16px" }}>
            Buscar
          </button>
        </div>
        {errorSerie && <div style={{ fontSize: 12, color: COLORS.rust, marginTop: 8 }}>{errorSerie}</div>}
        {resultadoSerie && (
          <div style={{ marginTop: 10, background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{resultadoSerie.repuesto?.nombre}</div>
            <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 4 }}>
              Proveedor: <strong>{resultadoSerie.proveedor_compra?.nombre || "—"}</strong> · Factura: <strong>{resultadoSerie.numero_factura_compra || "—"}</strong> · Comprado: <strong>{resultadoSerie.fecha_compra ? fechaLarga(resultadoSerie.fecha_compra) : "—"}</strong>
            </div>
            {resultadoSerie.reparacion && (
              <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 4 }}>
                Usado en orden <strong>#{resultadoSerie.reparacion.numero_orden}</strong> ({resultadoSerie.reparacion.cliente?.nombre}) — {resultadoSerie.reparacion.equipo}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["", "enviado", "en_proceso", "resuelto", "rechazado"].map((e) => (
            <button
              key={e || "todos"}
              onClick={() => setFiltroEstado(e)}
              style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999, border: `1px solid ${filtroEstado === e ? COLORS.amber : COLORS.line}`, background: filtroEstado === e ? COLORS.amber : COLORS.surface, color: filtroEstado === e ? "#FFFFFF" : COLORS.textDim, cursor: "pointer" }}
            >
              {e ? ETIQUETAS_RMA[e] : "Todos"}
            </button>
          ))}
        </div>
        <button onClick={() => setMostrarForm((v) => !v)} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "9px 14px" }}>
          <Plus size={14} /> Nueva devolución (RMA)
        </button>
      </div>

      {mostrarForm && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 180px" }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Proveedor *</div>
            <select style={{ ...inputStyle, width: "100%" }} value={form.proveedor_id} onChange={(e) => setForm((f) => ({ ...f, proveedor_id: e.target.value }))}>
              <option value="">Elegir...</option>
              {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Repuesto <span style={{ fontWeight: 400 }}>(opcional)</span></div>
            <select style={{ ...inputStyle, width: "100%" }} value={form.repuesto_id} onChange={(e) => setForm((f) => ({ ...f, repuesto_id: e.target.value }))}>
              <option value="">Sin repuesto concreto</option>
              {repuestos.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
          <div style={{ width: 130 }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Nº orden <span style={{ fontWeight: 400 }}>(opcional)</span></div>
            <input style={{ ...inputStyle, width: "100%" }} value={form.numero_orden} onChange={(e) => setForm((f) => ({ ...f, numero_orden: e.target.value }))} placeholder="2026-0007" />
          </div>
          <div style={{ width: 150 }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Nº de serie</div>
            <input style={{ ...inputStyle, width: "100%" }} value={form.numero_serie} onChange={(e) => setForm((f) => ({ ...f, numero_serie: e.target.value }))} placeholder="SN-12345" />
          </div>
          <div style={{ flex: "2 1 240px" }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Motivo *</div>
            <input style={{ ...inputStyle, width: "100%" }} value={form.motivo} onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))} placeholder="Ej. Pantalla con línea vertical" />
          </div>
          <button disabled={guardando || !form.proveedor_id || !form.motivo.trim()} onClick={crear} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "9px 16px" }}>
            {guardando ? "Guardando..." : "Registrar"}
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {cargando && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>}
        {!cargando && rmas.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Sin devoluciones registradas.</div>}
        {rmas.map((r) => (
          <div key={r.id} style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.line}`, borderRight: `1px solid ${COLORS.line}`, borderBottom: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${COLORES_RMA[r.estado]}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.text }}>
                  {r.repuesto?.nombre || "Repuesto sin especificar"} · {r.proveedor?.nombre}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>{r.motivo}</div>
                <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>
                  {r.numero_serie && <>Nº serie: {r.numero_serie} · </>}
                  Enviado: {fechaLarga(r.fecha_envio)}
                  {r.reparacion_numero_orden && <> · Orden #{r.reparacion_numero_orden}</>}
                </div>
                {r.resultado && (
                  <div style={{ fontSize: 12, color: COLORS.green, marginTop: 4 }}>
                    {r.resultado}{r.importe_recuperado != null && ` (${Number(r.importe_recuperado).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €)`}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#FFFFFF", background: COLORES_RMA[r.estado], borderRadius: 999, padding: "3px 10px", flexShrink: 0 }}>
                {ETIQUETAS_RMA[r.estado]}
              </span>
            </div>
            {!["resuelto", "rechazado"].includes(r.estado) && (
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {r.estado === "enviado" && (
                  <button onClick={() => actualizarEstado(r.id, { estado: "en_proceso" })} style={{ ...btnStyle("transparent", COLORS.statusBlue, COLORS.line), flex: "none", padding: "6px 12px", fontSize: 11.5 }}>
                    Marcar en proceso
                  </button>
                )}
                <button
                  onClick={() => {
                    const resultado = window.prompt("¿Cómo se resolvió? (ej. Sustituida por unidad nueva)");
                    if (resultado === null) return;
                    const importeStr = window.prompt("¿Importe recuperado en €? (deja en blanco si no aplica)");
                    actualizarEstado(r.id, { estado: "resuelto", resultado, importe_recuperado: importeStr ? parseFloat(importeStr) : null });
                  }}
                  style={{ ...btnStyle("transparent", COLORS.green, COLORS.line), flex: "none", padding: "6px 12px", fontSize: 11.5 }}
                >
                  Marcar resuelto
                </button>
                <button onClick={() => actualizarEstado(r.id, { estado: "rechazado" })} style={{ ...btnStyle("transparent", COLORS.rust, COLORS.line), flex: "none", padding: "6px 12px", fontSize: 11.5 }}>
                  Marcar rechazado
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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

// -------------------- vista: Base de conocimiento --------------------
function ConocimientoView() {
  const [articulos, setArticulos] = useState([]);
  const [query, setQuery] = useState("");
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ titulo: "", contenido: "", categoria: "" });
  const [guardando, setGuardando] = useState(false);

  const buscar = useCallback(async (q) => {
    setCargando(true);
    try {
      setArticulos(await apiGet(`/conocimiento${q ? `?q=${encodeURIComponent(q)}` : ""}`));
    } catch (e) {
      /* el aviso general ya se ve en Reparaciones */
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => buscar(query), 250);
    return () => clearTimeout(timer);
  }, [query, buscar]);

  function abrirNuevo() {
    setEditando(null);
    setForm({ titulo: "", contenido: "", categoria: "" });
    setMostrarForm(true);
  }
  function abrirEdicion(a) {
    setEditando(a);
    setForm({ titulo: a.titulo, contenido: a.contenido, categoria: a.categoria || "" });
    setMostrarForm(true);
  }

  async function guardar() {
    if (!form.titulo.trim() || !form.contenido.trim()) return;
    setGuardando(true);
    try {
      if (editando) {
        const res = await fetch(`${API_BASE}/conocimiento/${editando.id}`, { method: "PUT", headers: cabecerasAuth({ "Content-Type": "application/json" }), body: JSON.stringify(form) });
        manejar401(res);
      } else {
        await apiPost("/conocimiento", form);
      }
      setMostrarForm(false);
      buscar(query);
    } catch (e) {
      /* se puede mejorar con mensaje visible si hace falta */
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(id) {
    try {
      const res = await fetch(`${API_BASE}/conocimiento/${id}`, { method: "DELETE", headers: cabecerasAuth() });
      manejar401(res);
      if (res.ok) setArticulos((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      /* silencioso */
    }
  }

  const inputStyle = { width: "100%", fontSize: 13, padding: "9px 11px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box", marginTop: 4 };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "8px 12px", flex: 1, maxWidth: 380 }}>
          <Search size={14} color={COLORS.textDim} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar: IP de router, comandos, puertos..." style={{ background: "none", border: "none", outline: "none", color: COLORS.text, fontSize: 13, width: "100%" }} />
        </div>
        <button onClick={abrirNuevo} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "9px 14px" }}>
          <Plus size={14} /> Nuevo artículo
        </button>
      </div>

      {mostrarForm && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: COLORS.textDim }}>Título
            <input style={inputStyle} value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} placeholder="Ej. IP por defecto router Movistar" />
          </label>
          <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Categoría <span style={{ fontWeight: 400 }}>(opcional)</span>
            <select style={inputStyle} value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}>
              <option value="">Sin categoría</option>
              {CATEGORIAS_DOMICILIO.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Contenido
            <textarea style={{ ...inputStyle, minHeight: 90, fontFamily: "inherit", resize: "vertical" }} value={form.contenido} onChange={(e) => setForm((f) => ({ ...f, contenido: e.target.value }))} placeholder="192.168.1.1, usuario admin, contraseña en la etiqueta del router..." />
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

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {cargando && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Buscando...</div>}
        {!cargando && articulos.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Sin resultados. Añade tu primer artículo con "Nuevo artículo".</div>}
        {articulos.map((a) => (
          <div key={a.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.text }}>{a.titulo}</div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => abrirEdicion(a)} style={{ background: "none", border: "none", color: COLORS.amber, fontSize: 11.5, cursor: "pointer", padding: 0 }}>Editar</button>
                <button onClick={() => borrar(a.id)} style={{ background: "none", border: "none", color: COLORS.rust, cursor: "pointer", padding: 0, display: "flex" }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {a.categoria && (
              <span style={{ fontSize: 10, color: COLORS.statusBlue, background: `${COLORS.statusBlue}18`, borderRadius: 999, padding: "1px 8px", display: "inline-block", marginTop: 4 }}>
                {CATEGORIAS_DOMICILIO.find((c) => c.key === a.categoria)?.label || a.categoria}
              </span>
            )}
            <div style={{ fontSize: 12.5, color: COLORS.textDim, marginTop: 6, whiteSpace: "pre-wrap" }}>{a.contenido}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------- vista: Recordatorios de mantenimiento --------------------
// -------------------- vista: Solicitudes de servicio --------------------
function SolicitudesView({ onCrearReparacion }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [verTodas, setVerTodas] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setSolicitudes(await apiGet(`/solicitudes${verTodas ? "?todas=true" : ""}`));
    } catch (e) {
      /* el aviso general ya se ve en Reparaciones */
    } finally {
      setCargando(false);
    }
  }, [verTodas]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function marcarAtendida(id) {
    setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, atendida: true } : s)));
    try {
      const res = await fetch(`${API_BASE}/solicitudes/${id}`, { method: "PATCH", headers: cabecerasAuth({ "Content-Type": "application/json" }), body: JSON.stringify({ atendida: true }) });
      manejar401(res);
      if (!verTodas) cargar();
    } catch (e) {
      /* silencioso */
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={() => setVerTodas((v) => !v)} style={{ ...btnStyle("transparent", COLORS.textDim, COLORS.line), flex: "none", padding: "8px 14px", fontSize: 12.5 }}>
          {verTodas ? "Ver solo pendientes" : "Ver todas (incluye atendidas)"}
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {cargando && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>}
        {!cargando && solicitudes.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Sin solicitudes pendientes. Aparecerán aquí cuando un cliente pida un nuevo servicio desde su página de seguimiento.</div>}
        {solicitudes.map((s) => (
          <div key={s.id} style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.line}`, borderRight: `1px solid ${COLORS.line}`, borderBottom: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${s.atendida ? COLORS.green : s.origen === "nuevo_contacto" ? COLORS.violet : COLORS.statusBlue}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.text }}>{s.cliente?.nombre}</span>
                  {s.origen === "nuevo_contacto" && (
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.violet, background: `${COLORS.violet}18`, borderRadius: 999, padding: "2px 7px", textTransform: "uppercase", letterSpacing: 0.3 }}>
                      Nuevo contacto
                    </span>
                  )}
                </div>
                {s.cliente?.telefono && <div style={{ fontSize: 11.5, color: COLORS.textDim, marginTop: 1 }}>{s.cliente.telefono}</div>}
                <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>{s.mensaje || "Sin mensaje adicional"}</div>
                <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>{fechaLarga(s.fecha)}</div>
              </div>
              {!s.atendida && (
                <button onClick={() => marcarAtendida(s.id)} style={{ ...btnStyle(COLORS.green, "#FFFFFF"), flex: "none", padding: "7px 12px", fontSize: 11.5 }}>
                  Marcar atendida
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecordatoriosView() {
  const [recordatorios, setRecordatorios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [verTodos, setVerTodos] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setRecordatorios(await apiGet(`/recordatorios${verTodos ? "?todos=true" : ""}`));
    } catch (e) {
      /* el aviso general ya se ve en Reparaciones */
    } finally {
      setCargando(false);
    }
  }, [verTodos]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function marcarCumplido(id, cumplido) {
    setRecordatorios((prev) => prev.map((r) => (r.id === id ? { ...r, cumplido } : r)));
    try {
      const res = await fetch(`${API_BASE}/recordatorios/${id}`, { method: "PATCH", headers: cabecerasAuth({ "Content-Type": "application/json" }), body: JSON.stringify({ cumplido }) });
      manejar401(res);
      if (!verTodos && cumplido) cargar();
    } catch (e) {
      /* silencioso */
    }
  }

  function diasRestantes(fecha) {
    const dias = Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24));
    if (dias < 0) return { texto: `Vencido hace ${Math.abs(dias)} días`, color: COLORS.rust };
    if (dias === 0) return { texto: "Hoy", color: COLORS.statusAmber };
    if (dias <= 30) return { texto: `En ${dias} días`, color: COLORS.statusAmber };
    return { texto: `En ${dias} días`, color: COLORS.textDim };
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={() => setVerTodos((v) => !v)} style={{ ...btnStyle("transparent", COLORS.textDim, COLORS.line), flex: "none", padding: "8px 14px", fontSize: 12.5 }}>
          {verTodos ? "Ver solo pendientes" : "Ver todos (incluye cumplidos)"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {cargando && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>}
        {!cargando && recordatorios.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Sin recordatorios pendientes. Se crean desde la ficha de una reparación a domicilio ya completada.</div>}
        {recordatorios.map((r) => {
          const estado = diasRestantes(r.fecha_programada);
          return (
            <div key={r.id} style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.line}`, borderRight: `1px solid ${COLORS.line}`, borderBottom: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${r.cumplido ? COLORS.green : estado.color}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input type="checkbox" checked={r.cumplido} onChange={(e) => marcarCumplido(r.id, e.target.checked)} style={{ width: 17, height: 17, cursor: "pointer", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: r.cumplido ? COLORS.textDim : COLORS.text, textDecoration: r.cumplido ? "line-through" : "none" }}>{r.texto}</div>
                  <div style={{ fontSize: 12, color: COLORS.textDim }}>{r.cliente?.nombre} · {fechaLarga(r.fecha_programada)}</div>
                </div>
                {!r.cumplido && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: estado.color, background: `${estado.color}18`, borderRadius: 999, padding: "3px 9px", flexShrink: 0 }}>{estado.texto}</span>
                )}
              </div>
              {!r.cumplido && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COLORS.line}` }}>
                  <div style={{ fontSize: 11.5, color: COLORS.textDim, fontStyle: "italic", marginBottom: 8 }}>"{r.mensaje_sugerido}"</div>
                  {r.enlace_whatsapp ? (
                    <a
                      href={r.enlace_whatsapp}
                      target="_blank" rel="noreferrer"
                      style={{ ...btnStyle(COLORS.green, "#FFFFFF"), padding: "8px 14px", fontSize: 12, textDecoration: "none", flex: "none", display: "inline-flex" }}
                    >
                      Enviar por WhatsApp
                    </a>
                  ) : (
                    <span style={{ fontSize: 11, color: COLORS.rust }}>El cliente no tiene teléfono guardado.</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
        Mensajes predefinidos para casos comunes. Si le asignas un estado, se prepara automáticamente (con el enlace de WhatsApp listo) cada vez que muevas una reparación a ese estado — puedes tener varias plantillas activas en el mismo estado, todas se dispararán juntas. Usa <code>{"{cliente}"}</code>, <code>{"{equipo}"}</code>, <code>{"{numero_orden}"}</code>, <code>{"{estado}"}</code>, <code>{"{fecha_estimada}"}</code>, <code>{"{garantia}"}</code>, <code>{"{enlace_seguimiento}"}</code>, <code>{"{enlace_resena}"}</code> en el texto.
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
  const [form, setForm] = useState({ nombre_negocio: "", eslogan: "", direccion: "", telefono: "", email: "", nif: "", iva_pct: 21, suplemento_desplazamiento: 20, tarifa_hora: 25, enlace_resenas_google: "", coste_almacenamiento_diario: 1, telegram_chat_id: "", telefono_bizum: "" });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");
  const [tecnicos, setTecnicos] = useState([]);
  const [nuevoTecnico, setNuevoTecnico] = useState("");
  const [probandoTelegram, setProbandoTelegram] = useState(false);
  const [resultadoTelegram, setResultadoTelegram] = useState(null);
  const [descargandoBackup, setDescargandoBackup] = useState(false);
  const [enviandoBackupTelegram, setEnviandoBackupTelegram] = useState(false);
  const [resultadoBackupTelegram, setResultadoBackupTelegram] = useState(null);

  useEffect(() => {
    apiGet("/configuracion")
      .then((data) => {
        setForm({
          nombre_negocio: data.nombre_negocio || "", eslogan: data.eslogan || "",
          direccion: data.direccion || "", telefono: data.telefono || "", email: data.email || "",
          nif: data.nif || "", iva_pct: data.iva_pct ?? 21, suplemento_desplazamiento: data.suplemento_desplazamiento ?? 20,
          tarifa_hora: data.tarifa_hora ?? 25, enlace_resenas_google: data.enlace_resenas_google || "", coste_almacenamiento_diario: data.coste_almacenamiento_diario ?? 1, telegram_chat_id: data.telegram_chat_id || "", telefono_bizum: data.telefono_bizum || "",
        });
        setTecnicos(data.tecnicos || []);
      })
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
        body: JSON.stringify({ ...form, iva_pct: parseFloat(form.iva_pct) || 21, suplemento_desplazamiento: parseFloat(form.suplemento_desplazamiento) || 0, tarifa_hora: parseFloat(form.tarifa_hora) || 25, coste_almacenamiento_diario: parseFloat(form.coste_almacenamiento_diario) || 1, tecnicos }),
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
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Tarifa de mano de obra (€/hora)
          <input style={inputStyle} type="number" value={form.tarifa_hora} onChange={set("tarifa_hora")} placeholder="25" />
        </label>

        <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 18, marginBottom: 4, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
          Equipos sin recoger
        </div>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 8 }}>Coste de almacenamiento (€/día)
          <input style={inputStyle} type="number" value={form.coste_almacenamiento_diario} onChange={set("coste_almacenamiento_diario")} placeholder="1" />
        </label>
        <div style={{ fontSize: 10.5, color: COLORS.textDim, marginTop: 4 }}>
          Se usa para calcular el coste acumulado en el aviso a clientes con equipos listos hace 30+ días sin recoger. Confirma con un profesional el importe y la base legal antes de aplicarlo de verdad.
        </div>

        <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 18, marginBottom: 4, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
          Reseñas
        </div>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 8 }}>Enlace a tu ficha de Google <span style={{ fontWeight: 400 }}>(para pedir reseñas)</span>
          <input style={inputStyle} value={form.enlace_resenas_google} onChange={set("enlace_resenas_google")} placeholder="https://g.page/r/..." />
        </label>
        <div style={{ fontSize: 10.5, color: COLORS.textDim, marginTop: 4 }}>
          Búscate en Google Maps → "Compartir" → "Pedir reseñas" para conseguir este enlace. Úsalo en una plantilla con <code>{"{enlace_resena}"}</code>.
        </div>

        <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 18, marginBottom: 8, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
          Avisos por Telegram <span style={{ fontWeight: 400, textTransform: "none" }}>(gratis, sin cuenta de pago)</span>
        </div>
        <ol style={{ fontSize: 11.5, color: COLORS.textDim, paddingLeft: 18, margin: "0 0 10px 0", lineHeight: 1.7 }}>
          <li>En Telegram, busca <strong>@BotFather</strong> y escríbele <code>/newbot</code>, sigue los pasos y te dará un <strong>token</strong>.</li>
          <li>Pide a tu servidor (Railway → Variables) que añada <code>TELEGRAM_BOT_TOKEN</code> con ese valor.</li>
          <li>Busca <strong>@userinfobot</strong> en Telegram y escríbele cualquier cosa — te dirá tu <strong>chat_id</strong> (un número). Pégalo abajo.</li>
        </ol>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block" }}>Tu chat_id de Telegram
          <input style={inputStyle} value={form.telegram_chat_id} onChange={set("telegram_chat_id")} placeholder="123456789" />
        </label>
        <button
          type="button"
          disabled={probandoTelegram}
          onClick={async () => {
            setProbandoTelegram(true);
            setResultadoTelegram(null);
            try {
              const res = await fetch(`${API_BASE}/configuracion/telegram/probar`, { method: "POST", headers: cabecerasAuth() });
              const data = await res.json();
              setResultadoTelegram({ ok: res.ok, detalle: data.detalle });
            } catch (e) {
              setResultadoTelegram({ ok: false, detalle: e.message });
            } finally {
              setProbandoTelegram(false);
            }
          }}
          style={{ ...btnStyle("transparent", COLORS.statusBlue, COLORS.line), marginTop: 8, padding: "8px 14px", fontSize: 12.5 }}
        >
          {probandoTelegram ? "Probando..." : "Enviar mensaje de prueba"}
        </button>
        {resultadoTelegram && (
          <div style={{ fontSize: 11.5, color: resultadoTelegram.ok ? COLORS.green : COLORS.rust, marginTop: 6 }}>
            {resultadoTelegram.ok ? "✓ Enviado — revisa tu Telegram" : `✗ ${resultadoTelegram.detalle}`}
          </div>
        )}

        <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 18, marginBottom: 8, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
          Cobro por Bizum
        </div>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block" }}>Tu número de Bizum
          <input style={inputStyle} value={form.telefono_bizum} onChange={set("telefono_bizum")} placeholder="611222333" />
        </label>
        <div style={{ fontSize: 10.5, color: COLORS.textDim, marginTop: 4 }}>
          Esto NO cobra solo — el cliente te lo manda desde su propia app del banco, y tú confirmas el cobro a mano cuando lo veas llegar (elige "Bizum" al registrar el cobro en la ficha). Si más adelante quieres que se cobre automático con un QR real, hace falta contratarlo con un banco.
        </div>

        <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 18, marginBottom: 8, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
          Copia de seguridad
        </div>
        <div style={{ fontSize: 11.5, color: COLORS.textDim, marginBottom: 8 }}>
          Incluye toda la base de datos (clientes, reparaciones, facturas...), fotos y firmas. Se envía también automáticamente cada noche por Telegram si lo tienes configurado arriba.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={descargandoBackup}
            onClick={async () => {
              setDescargandoBackup(true);
              try {
                const res = await fetch(`${API_BASE}/backup/descargar`, { headers: cabecerasAuth() });
                manejar401(res);
                if (!res.ok) throw new Error("No se pudo generar el backup");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const enlace = document.createElement("a");
                enlace.href = url;
                enlace.download = `firztnet_backup_${new Date().toISOString().slice(0, 10)}.zip`;
                document.body.appendChild(enlace);
                enlace.click();
                enlace.remove();
                URL.revokeObjectURL(url);
              } catch (e) {
                /* silencioso */
              } finally {
                setDescargandoBackup(false);
              }
            }}
            style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "8px 14px", fontSize: 12.5 }}
          >
            {descargandoBackup ? "Generando..." : "Descargar ahora"}
          </button>
          <button
            type="button"
            disabled={enviandoBackupTelegram}
            onClick={async () => {
              setEnviandoBackupTelegram(true);
              setResultadoBackupTelegram(null);
              try {
                const res = await fetch(`${API_BASE}/backup/enviar-telegram`, { method: "POST", headers: cabecerasAuth() });
                const data = await res.json();
                setResultadoBackupTelegram({ ok: res.ok, detalle: data.detalle });
              } catch (e) {
                setResultadoBackupTelegram({ ok: false, detalle: e.message });
              } finally {
                setEnviandoBackupTelegram(false);
              }
            }}
            style={{ ...btnStyle("transparent", COLORS.statusBlue, COLORS.line), flex: "none", padding: "8px 14px", fontSize: 12.5 }}
          >
            {enviandoBackupTelegram ? "Enviando..." : "Enviar por Telegram ahora"}
          </button>
        </div>
        {resultadoBackupTelegram && (
          <div style={{ fontSize: 11.5, color: resultadoBackupTelegram.ok ? COLORS.green : COLORS.rust, marginTop: 6 }}>
            {resultadoBackupTelegram.ok ? "✓ Enviado — revisa tu Telegram" : `✗ ${resultadoBackupTelegram.detalle}`}
          </div>
        )}

        <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 18, marginBottom: 8, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
          Técnicos <span style={{ fontWeight: 400, textTransform: "none" }}>(para asignar y medir rendimiento — sin login propio de momento)</span>
        </div>
        {tecnicos.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {tecnicos.map((nombre) => (
              <span key={nombre} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 999, background: `${COLORS.statusBlue}18`, color: COLORS.statusBlue }}>
                {nombre}
                <button onClick={() => setTecnicos((prev) => prev.filter((n) => n !== nombre))} style={{ background: "none", border: "none", color: COLORS.statusBlue, cursor: "pointer", padding: 0, display: "flex" }}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={nuevoTecnico}
            onChange={(e) => setNuevoTecnico(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && nuevoTecnico.trim() && !tecnicos.includes(nuevoTecnico.trim())) {
                setTecnicos((prev) => [...prev, nuevoTecnico.trim()]);
                setNuevoTecnico("");
              }
            }}
            placeholder="Nombre del técnico"
            style={{ flex: 1, fontSize: 12.5, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}` }}
          />
          <button
            onClick={() => {
              if (nuevoTecnico.trim() && !tecnicos.includes(nuevoTecnico.trim())) {
                setTecnicos((prev) => [...prev, nuevoTecnico.trim()]);
                setNuevoTecnico("");
              }
            }}
            style={{ ...btnStyle(COLORS.statusBlue, "#FFFFFF"), flex: "none", padding: "8px 14px", fontSize: 12.5 }}
          >
            Añadir
          </button>
        </div>

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
  const [mostrarSolicitud, setMostrarSolicitud] = useState(false);
  const [mensajeSolicitud, setMensajeSolicitud] = useState("");
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
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

            {datos.wifi_ssid && (
              <div style={{ marginTop: 16, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 9, padding: 12 }}>
                <div style={{ fontSize: 11, color: COLORS.statusBlue, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Tu WiFi</div>
                <div style={{ fontSize: 13, color: COLORS.text }}>Red: <strong>{datos.wifi_ssid}</strong></div>
                {datos.wifi_password && <div style={{ fontSize: 13, color: COLORS.text }}>Contraseña: <strong style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{datos.wifi_password}</strong></div>}
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

            {!mostrarSolicitud ? (
              <button
                onClick={() => setMostrarSolicitud(true)}
                style={{ ...btnStyle("transparent", COLORS.statusBlue, COLORS.line), width: "100%", marginTop: 10, padding: "9px 12px", fontSize: 12.5 }}
              >
                Solicitar un nuevo servicio
              </button>
            ) : solicitudEnviada ? (
              <div style={{ marginTop: 10, fontSize: 12.5, color: COLORS.green, textAlign: "center" }}>✓ Solicitud enviada, nos pondremos en contacto</div>
            ) : (
              <div style={{ marginTop: 10 }}>
                <textarea
                  value={mensajeSolicitud}
                  onChange={(e) => setMensajeSolicitud(e.target.value)}
                  placeholder="Cuéntanos brevemente qué necesitas..."
                  style={{ width: "100%", fontSize: 13, padding: "9px 11px", borderRadius: 9, border: "1.5px solid #E2E8F0", boxSizing: "border-box", minHeight: 60, fontFamily: "inherit", resize: "vertical" }}
                />
                <button
                  disabled={enviandoSolicitud}
                  onClick={async () => {
                    setEnviandoSolicitud(true);
                    try {
                      const tok = tokenDeUrl || datos.token_seguimiento;
                      await fetch(`${API_BASE}/seguimiento/${tok}/solicitar-servicio`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ mensaje: mensajeSolicitud }),
                      });
                      setSolicitudEnviada(true);
                    } catch (e) {
                      /* silencioso */
                    } finally {
                      setEnviandoSolicitud(false);
                    }
                  }}
                  style={{ ...btnStyle(COLORS.statusBlue, "#FFFFFF"), width: "100%", marginTop: 8, padding: "9px 12px", fontSize: 12.5 }}
                >
                  {enviandoSolicitud ? "Enviando..." : "Enviar solicitud"}
                </button>
              </div>
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

// -------------------- Página pública: solicitar presupuesto (sin ser cliente todavía) --------------------
function SolicitarPresupuestoPublico() {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/seguimiento/solicitar-presupuesto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, telefono, email, mensaje }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar la solicitud");
      setEnviado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const inputStyle = { width: "100%", fontSize: 13.5, padding: "10px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0", boxSizing: "border-box", marginTop: 5, outline: "none" };

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

        {enviado ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <CheckCircle2 size={36} color={COLORS.green} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>¡Solicitud enviada!</div>
            <div style={{ fontSize: 13, color: COLORS.textDim }}>Te contactaremos en breve para hablar de tu presupuesto.</div>
          </div>
        ) : (
          <form onSubmit={enviar}>
            <div style={{ fontSize: 13.5, color: COLORS.textDim, marginBottom: 16, textAlign: "center" }}>
              Pide tu presupuesto sin compromiso — te contactamos nosotros.
            </div>
            <label style={{ fontSize: 12, color: COLORS.textDim, fontWeight: 500 }}>Nombre *
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" style={inputStyle} required />
            </label>
            <label style={{ fontSize: 12, color: COLORS.textDim, fontWeight: 500, display: "block", marginTop: 12 }}>Teléfono *
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="600 000 000" style={inputStyle} required />
            </label>
            <label style={{ fontSize: 12, color: COLORS.textDim, fontWeight: 500, display: "block", marginTop: 12 }}>Email <span style={{ fontWeight: 400 }}>(opcional)</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="tucorreo@email.com" style={inputStyle} />
            </label>
            <label style={{ fontSize: 12, color: COLORS.textDim, fontWeight: 500, display: "block", marginTop: 12 }}>¿Qué necesitas? <span style={{ fontWeight: 400 }}>(opcional)</span>
              <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Cuéntanos brevemente qué necesitas..." style={{ ...inputStyle, minHeight: 70, fontFamily: "inherit", resize: "vertical" }} />
            </label>
            {error && <div style={{ fontSize: 12, color: COLORS.rust, marginTop: 10 }}>{error}</div>}
            <button
              type="submit"
              disabled={enviando}
              style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), width: "100%", marginTop: 16, padding: "11px 12px", fontSize: 14, fontWeight: 600, boxSizing: "border-box" }}
            >
              {enviando ? "Enviando..." : "Solicitar presupuesto"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function FirztnetApp() {
  const esPaginaSeguimiento = window.location.pathname.startsWith("/seguimiento");
  const esPaginaPresupuesto = window.location.pathname.startsWith("/presupuesto");
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
  if (esPaginaPresupuesto) return <SolicitarPresupuestoPublico />;
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
  const [filtroEstadoResumen, setFiltroEstadoResumen] = useState(null); // null | "en_curso" | "entregadas" | "no_reparables" — desde las tarjetas de resumen
  const [filtroModelo, setFiltroModelo] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroHoy, setFiltroHoy] = useState(false);
  const [filtroUrgente, setFiltroUrgente] = useState(false);
  const [vistaTrabajo, setVistaTrabajo] = useState("taller"); // "taller" o "domicilio"
  const [hoverPreview, setHoverPreview] = useState(null); // reparación bajo el ratón, para "Próxima acción"
  const [hoverBalance, setHoverBalance] = useState(false);
  const [hoverMes, setHoverMes] = useState(false);
  const [mostrarMasMovil, setMostrarMasMovil] = useState(false); // hoja de "Más" secciones, solo en móvil
  const hoverTimeoutRef = useRef(null);

  // Al entrar en una tarjeta, se actualiza al instante. Al salir, se espera
  // un momento antes de olvidar la vista previa — así da tiempo a mover el
  // ratón hasta un botón del panel de "Próxima acción" sin que se cancele
  // a mitad de camino.
  const handleHoverPreview = useCallback((t) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (t) {
      setHoverPreview(t);
    } else {
      hoverTimeoutRef.current = setTimeout(() => setHoverPreview(null), 400);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

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
      if (filtroEstadoResumen === "en_curso" && ["entregado", "no_reparable", "completado"].includes(t.estado_actual)) return false;
      if (filtroEstadoResumen === "entregadas" && !["entregado", "completado"].includes(t.estado_actual)) return false;
      if (filtroEstadoResumen === "no_reparables" && t.estado_actual !== "no_reparable") return false;
      if ((t.tipo_trabajo || "taller") !== vistaTrabajo) return false;
      return true;
    });
  }, [query, reparaciones, filtroMarca, filtroModelo, filtroCliente, filtroHoy, filtroUrgente, filtroEstadoResumen, vistaTrabajo]);

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
    <div style={{
      minHeight: "100vh", color: COLORS.text, fontFamily: "Inter, sans-serif",
      background: `radial-gradient(circle at 15% 20%, ${COLORS.amber}4D, transparent 65%), radial-gradient(circle at 85% 15%, ${COLORS.violet}4D, transparent 65%), radial-gradient(circle at 50% 95%, ${COLORS.green}45, transparent 65%), ${COLORS.bg}`,
    }}>
      <link rel="stylesheet" href={FONTS_URL} />
      <style>{`
        @keyframes fnPuntoActivo {
          0%, 100% { box-shadow: 0 0 0 0 ${COLORS.green}55; }
          50% { box-shadow: 0 0 0 5px ${COLORS.green}00; }
        }
        .fn-punto-activo {
          animation: fnPuntoActivo 2s ease-in-out infinite;
        }
        @keyframes fnLogoGlow {
          0%, 100% { box-shadow: 0 0 0 0 ${COLORS.amber}55; }
          50% { box-shadow: 0 0 16px 3px ${COLORS.amber}66; }
        }
        .fn-logo-badge {
          animation: fnLogoGlow 3.2s ease-in-out infinite;
          transition: transform 0.3s ease;
        }
        .fn-logo-badge:hover {
          transform: rotate(-8deg) scale(1.08);
        }
        .fn-navitem {
          position: relative;
          transition: background-color 0.25s ease, padding-left 0.25s ease, color 0.25s ease;
          overflow: hidden;
        }
        .fn-navitem::before {
          content: "";
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: ${COLORS.amber};
          transform: scaleY(0);
          transition: transform 0.25s ease;
        }
        .fn-fila-tabla {
          transition: background-color 0.15s ease, box-shadow 0.15s ease;
        }
        .fn-fila-tabla:hover {
          background-color: ${COLORS.amber}14 !important;
          box-shadow: inset 4px 0 0 0 ${COLORS.amber};
        }
        .fn-navitem:hover {
          background-color: ${COLORS.sidebarActiveBg} !important;
          padding-left: 14px !important;
          color: #FFFFFF !important;
        }
        .fn-navitem:hover::before {
          transform: scaleY(1);
        }
        .fn-navitem svg {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .fn-navitem:hover svg {
          transform: scale(1.18) rotate(-6deg);
        }
        .fn-navitem-active::before {
          transform: scaleY(1);
        }
        .fn-navitem-boton-mas {
          display: none;
        }

        @media (max-width: 768px) {
          .fn-proxima-accion {
            display: none !important;
          }
          .fn-navitem-en-mas {
            display: none !important;
          }
          .fn-navitem-boton-mas {
            display: flex !important;
          }
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
          .fn-sidebar .fn-navitem { flex-direction: column !important; gap: 3px !important; font-size: 11px !important; padding: 8px 10px !important; margin-bottom: 0 !important; min-width: 56px; }
          .fn-sidebar .fn-navitem svg { width: 21px; height: 21px; }
          .fn-shell { flex-direction: column !important; }
          .fn-main { max-width: 100% !important; padding: 16px 14px 78px 14px !important; }
          .fn-header-row { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
          .fn-header-row button { width: 100% !important; }
          .fn-stat-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .fn-stat-grid > div { min-width: 0 !important; }
          .fn-content-flex { flex-direction: column !important; }
          .fn-side-panel { width: 100% !important; position: static !important; max-height: none !important; overflow-y: visible !important; }
          .fn-search { max-width: 100% !important; }
          .fn-kanban-col { flex: 0 0 200px !important; min-width: 200px !important; }
          .fn-modal-box { width: 92vw !important; max-width: 92vw !important; padding: 18px !important; }
        }
      `}</style>

      <div className="fn-shell" style={{ display: "flex" }}>
        <aside className="fn-sidebar" style={{ width: 210, background: COLORS.sidebarBg, borderRight: "none", minHeight: "100vh", padding: "22px 16px", flexShrink: 0, display: "flex", flexDirection: "column" }}>
          <div className="fn-logo" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 30, paddingLeft: 4 }}>
            <div className="fn-logo-badge" style={{ width: 30, height: 30, borderRadius: 8, background: COLORS.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wrench size={16} color="#FFFFFF" />
            </div>
            <span style={{ fontFamily: "Oswald", fontSize: 17, letterSpacing: 0.5, color: "#FFFFFF" }}>FIRZTNET</span>
          </div>
          {[
            { key: "reparaciones", icon: LayoutGrid, label: "Reparaciones", movil: "principal" },
            { key: "clientes", icon: Users, label: "Clientes", movil: "principal" },
            { key: "reportes", icon: FileBarChart, label: "Reportes", movil: "mas" },
            { key: "inventario", icon: Package, label: "Inventario", movil: "mas" },
            { key: "rma", icon: RotateCcw, label: "Garantías RMA", movil: "mas" },
            { key: "garantias", icon: ShieldCheck, label: "Garantías activas", movil: "mas" },
            { key: "rendimiento", icon: FileBarChart, label: "Rendimiento", movil: "mas" },
            { key: "rentabilidad", icon: FileBarChart, label: "Rentabilidad", movil: "mas" },
            { key: "caja", icon: Banknote, label: "Caja", movil: "principal" },
            { key: "plantillas", icon: MessageSquare, label: "Plantillas", movil: "mas" },
            { key: "conocimiento", icon: Search, label: "Base conocimiento", movil: "mas" },
            { key: "recordatorios", icon: Bell, label: "Recordatorios", movil: "mas" },
            { key: "solicitudes", icon: MessageSquare, label: "Solicitudes", movil: "mas" },
            { key: "ajustes", icon: Settings, label: "Ajustes", movil: "principal" },
          ].map((item) => (
            <div
              key={item.label}
              className={`fn-navitem${vista === item.key ? " fn-navitem-active" : ""}${item.movil === "mas" ? " fn-navitem-en-mas" : ""}`}
              onClick={() => { setVista(item.key); setMostrarMasMovil(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: vista === item.key ? COLORS.sidebarActiveBg : "transparent", color: vista === item.key ? "#FFFFFF" : COLORS.sidebarTextDim, fontSize: 13.5, fontWeight: 500 }}
            >
              <item.icon size={16} />
              {item.label}
            </div>
          ))}
          <div
            onClick={() => setMostrarMasMovil((v) => !v)}
            className={`fn-navitem fn-navitem-boton-mas${mostrarMasMovil ? " fn-navitem-active" : ""}`}
            style={{ alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, marginBottom: 4, cursor: "pointer", color: COLORS.sidebarTextDim, fontSize: 13.5, fontWeight: 500 }}
          >
            <MoreHorizontal size={16} />
            Más
          </div>

          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 9, background: COLORS.sidebarActiveBg }}>
            <div className="fn-punto-activo" style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.green, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#FFFFFF", textTransform: "capitalize", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nombreUsuarioDelToken()} activo</div>
              <div style={{ fontSize: 11, color: COLORS.sidebarTextDim }}>Sede Principal</div>
            </div>
          </div>
        </aside>

        {mostrarMasMovil && (
          <div className="fn-hoja-mas" onClick={() => setMostrarMasMovil(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 55 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: COLORS.sidebarBg, borderRadius: "16px 16px 0 0", padding: "16px 16px 90px 16px", maxHeight: "70vh", overflowY: "auto" }}>
              <div style={{ width: 36, height: 4, background: COLORS.sidebarActiveBg, borderRadius: 999, margin: "0 auto 16px" }} />
              {[
                { key: "reportes", icon: FileBarChart, label: "Reportes" },
                { key: "inventario", icon: Package, label: "Inventario" },
                { key: "rma", icon: RotateCcw, label: "Garantías RMA" },
                { key: "garantias", icon: ShieldCheck, label: "Garantías activas" },
                { key: "rendimiento", icon: FileBarChart, label: "Rendimiento" },
                { key: "rentabilidad", icon: FileBarChart, label: "Rentabilidad" },
                { key: "plantillas", icon: MessageSquare, label: "Plantillas" },
                { key: "conocimiento", icon: Search, label: "Base conocimiento" },
                { key: "recordatorios", icon: Bell, label: "Recordatorios" },
                { key: "solicitudes", icon: MessageSquare, label: "Solicitudes" },
              ].map((item) => (
                <div
                  key={item.label}
                  onClick={() => { setVista(item.key); setMostrarMasMovil(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 10px", borderRadius: 8, cursor: "pointer", color: vista === item.key ? "#FFFFFF" : COLORS.sidebarTextDim, background: vista === item.key ? COLORS.sidebarActiveBg : "transparent", fontSize: 14.5 }}
                >
                  <item.icon size={18} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        )}

        <main className="fn-main" style={{ flex: 1, minWidth: 0, padding: "26px 32px", maxWidth: 1180 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <CampanitaNotificaciones onIrVista={setVista} onAbrirTicket={(t) => setSelected(t)} />
            <InsigniaUsuario onCerrarSesion={onCerrarSesion} />
          </div>
          <div style={vista === "reparaciones" ? { background: `${COLORS.bg} ${PATRON_CIRCUITO}`, backgroundSize: "200px 200px", borderRadius: 16, padding: "18px 20px", marginBottom: 4 } : undefined}>
          <div className="fn-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <div>
              <h1 style={{ fontFamily: "Oswald", fontSize: 24, margin: 0, letterSpacing: 0.3 }}>
                {vista === "reparaciones" && "Panel de reparaciones"}
                {vista === "clientes" && "Clientes"}
                {vista === "reportes" && "Reportes"}
                {vista === "inventario" && "Inventario"}
                {vista === "rma" && "Garantías con proveedores (RMA)"}
                {vista === "garantias" && "Garantías activas de clientes"}
                {vista === "rendimiento" && "Rendimiento de técnicos"}
                {vista === "rentabilidad" && "Rentabilidad por línea de servicio"}
                {vista === "caja" && "Caja"}
                {vista === "plantillas" && "Plantillas"}
                {vista === "conocimiento" && "Base de conocimiento"}
                {vista === "recordatorios" && "Recordatorios"}
                {vista === "solicitudes" && "Solicitudes de servicio"}
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
          {vista === "reportes" && (
            <ReportesView
              reporteDiario={reporteDiario} reporteMensual={reporteMensual} contador={contador} tendencia={tendencia}
              onFiltrarPorEstado={(estado) => { setFiltroEstadoResumen(estado); setVista("reparaciones"); }}
            />
          )}
          {vista === "inventario" && <InventarioView />}
          {vista === "rma" && <RmaView />}
          {vista === "garantias" && <GarantiasActivasView onAbrir={(t) => setSelected(t)} reparaciones={reparaciones} />}
          {vista === "rendimiento" && <RendimientoView />}
          {vista === "rentabilidad" && <RentabilidadView />}
          {vista === "caja" && <CajaView onMovimientoCreado={cargarTodo} />}
          {vista === "plantillas" && <PlantillasView />}
          {vista === "conocimiento" && <ConocimientoView />}
          {vista === "recordatorios" && <RecordatoriosView />}
          {vista === "solicitudes" && <SolicitudesView />}
          {vista === "ajustes" && <AjustesView />}

          {vista === "reparaciones" && (
          <div className="fn-stat-grid" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <StatCard label="Reparaciones totales" value={contador.total} icon={Ticket} accent={COLORS.amber} destacada onClick={() => setFiltroEstadoResumen(null)} activa={filtroEstadoResumen === null} />
            <StatCard label="En curso" value={contador.en_curso} icon={CircleDot} accent={COLORS.teal} onClick={() => setFiltroEstadoResumen((v) => (v === "en_curso" ? null : "en_curso"))} activa={filtroEstadoResumen === "en_curso"} />
            <StatCard label="Entregadas" value={contador.entregadas} icon={ShieldCheck} accent={COLORS.green} onClick={() => setFiltroEstadoResumen((v) => (v === "entregadas" ? null : "entregadas"))} activa={filtroEstadoResumen === "entregadas"} />
            <StatCard label="No reparables" value={contador.no_reparables} icon={TriangleAlert} accent={COLORS.statusAmber} onClick={() => setFiltroEstadoResumen((v) => (v === "no_reparables" ? null : "no_reparables"))} activa={filtroEstadoResumen === "no_reparables"} />
          </div>
          )}
          </div>

          {vista === "reparaciones" && (
          <div className="fn-content-flex" style={{ display: "flex", gap: 20, marginTop: 22 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <SelectorTipoTrabajo valor={vistaTrabajo} onCambiar={setVistaTrabajo} />

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

              <TablaOrdenesActivas reparaciones={reparaciones} onAbrir={(t) => setSelected(t)} onHover={handleHoverPreview} />

              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginTop: 24, marginBottom: 10, paddingTop: 20, borderTop: `1px solid ${COLORS.line}` }}>
                Tablero completo
              </div>
              <TablaTableroCompleto reparaciones={filtered} tipoTrabajo={vistaTrabajo} onAbrir={(t) => setSelected(t)} onHover={handleHoverPreview} cargando={cargando} />
            </div>

            <div className="fn-side-panel" style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 20, alignSelf: "flex-start", maxHeight: "calc(100vh - 40px)", overflowY: "auto" }}>
              <PanelAlertas reparaciones={reparaciones} onAbrir={(t) => setSelected(t)} onIrInventario={() => setVista("inventario")} onIrGarantias={() => setVista("garantias")} />
              <PanelProximaAccion reparaciones={reparaciones} onAbrir={(t) => setSelected(t)} resaltada={hoverPreview} onHover={handleHoverPreview} />

              <div
                onMouseEnter={() => setHoverBalance(true)}
                onMouseLeave={() => setHoverBalance(false)}
                style={{ background: COLORS.surface, borderTop: `1px solid ${hoverBalance ? (reporteDiario.balance_neto >= 0 ? COLORS.green : COLORS.rust) : COLORS.line}`, borderRight: `1px solid ${hoverBalance ? (reporteDiario.balance_neto >= 0 ? COLORS.green : COLORS.rust) : COLORS.line}`, borderBottom: `1px solid ${hoverBalance ? (reporteDiario.balance_neto >= 0 ? COLORS.green : COLORS.rust) : COLORS.line}`, borderLeft: `4px solid ${reporteDiario.balance_neto >= 0 ? COLORS.green : COLORS.rust}`, borderRadius: 12, padding: 18, position: "relative", overflow: "hidden", boxShadow: `0 2px 8px ${reporteDiario.balance_neto >= 0 ? COLORS.green : COLORS.rust}18`, transition: "border-color 0.2s ease" }}
              >
                <div style={{ position: "absolute", top: -8, right: -8, width: 60, height: 60, borderRadius: "50%", background: `${COLORS.amber}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wrench size={24} color={COLORS.amber} style={{ marginBottom: 8, marginRight: 8, opacity: 0.85 }} />
                </div>
                <div style={{ fontSize: 12, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Balance de hoy</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 24, color: reporteDiario.balance_neto >= 0 ? COLORS.green : COLORS.rust, fontWeight: 600 }}>
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

              <div
                onMouseEnter={() => setHoverMes(true)}
                onMouseLeave={() => setHoverMes(false)}
                style={{ background: COLORS.surface, borderTop: `1px solid ${hoverMes ? COLORS.statusBlue : COLORS.line}`, borderRight: `1px solid ${hoverMes ? COLORS.statusBlue : COLORS.line}`, borderBottom: `1px solid ${hoverMes ? COLORS.statusBlue : COLORS.line}`, borderLeft: `4px solid ${COLORS.statusBlue}`, borderRadius: 12, padding: 18, position: "relative", overflow: "hidden", transition: "border-color 0.2s ease" }}
              >
                <div style={{ position: "absolute", top: -8, right: -8, width: 60, height: 60, borderRadius: "50%", background: `${COLORS.statusBlue}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileBarChart size={24} color={COLORS.statusBlue} style={{ marginBottom: 8, marginRight: 8, opacity: 0.85 }} />
                </div>
                <div style={{ fontSize: 12, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Este mes</div>
                {[
                  { l: "Ingresos", v: reporteMensual.ingresos, c: COLORS.green },
                  { l: "Gastos", v: reporteMensual.gastos, c: COLORS.rust },
                  { l: "Balance neto", v: reporteMensual.balance_neto, c: reporteMensual.balance_neto >= 0 ? COLORS.green : COLORS.rust },
                ].map((r) => (
                  <div key={r.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, padding: "7px 8px", marginBottom: 4, borderRadius: 7, background: `${r.c}0F`, borderLeft: `3px solid ${r.c}` }}>
                    <span style={{ color: COLORS.textDim }}>{r.l}</span>
                    <span style={{ color: r.c, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>{Number(r.v || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</span>
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
