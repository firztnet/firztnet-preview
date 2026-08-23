import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Wrench, LayoutGrid, Users, FileBarChart, Ticket, Search,
  ChevronRight, CircleDot, TriangleAlert, ShieldCheck, Banknote,
  Printer, Plus, X, ArrowUpRight, ArrowDownRight, Loader2
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, Tooltip
} from "recharts";

// ---------------------------------------------------------------------
// Cambia esto por la URL donde corra tu backend Flask
// (en local, con `python run.py`, es http://localhost:5000)
// ---------------------------------------------------------------------
const API_BASE = "https://firztnet-backend-production.up.railway.app/api";

const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap";

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
};

const STAGES = [
  { key: "recibido", label: "Recibido", accent: COLORS.textDim },
  { key: "diagnostico", label: "Diagnóstico", accent: COLORS.statusAmber },
  { key: "reparacion", label: "En reparación", accent: COLORS.statusBlue },
  { key: "listo", label: "Listo para entrega", accent: COLORS.green },
  { key: "entregado", label: "Entregado", accent: COLORS.textDim },
  { key: "no_reparable", label: "No reparable", accent: COLORS.rust },
];

const TREND = [
  { d: "L", v: 0 }, { d: "M", v: 0 }, { d: "X", v: 0 },
  { d: "J", v: 0 }, { d: "V", v: 0 }, { d: "S", v: 0 }, { d: "D", v: 0 },
];

// -------------------- helpers de API --------------------
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}
async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error || `POST ${path} → ${res.status}`);
  return res.json();
}
async function apiPatch(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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

function RepairTag({ t, onClick }) {
  const stage = STAGES.find((s) => s.key === t.estado_actual) || STAGES[0];
  return (
    <button
      onClick={onClick}
      style={{
        background: COLORS.surfaceRaised,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 10,
        padding: "12px 14px 12px 12px",
        textAlign: "left",
        width: "100%",
        cursor: "pointer",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = stage.accent)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = COLORS.line)}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 2 }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${COLORS.line}`, background: COLORS.bg }} />
        <div style={{ width: 1, flex: 1, background: COLORS.line, marginTop: 4 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: stage.accent, letterSpacing: 0.5 }}>
            #{t.numero_orden}
          </span>
          <span style={{ fontSize: 11, color: COLORS.textDim }}>{fechaCorta(t.fecha_recepcion)}</span>
        </div>
        <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 13.5, color: COLORS.text, marginTop: 4 }}>
          {t.cliente?.nombre}
        </div>
        <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>{t.equipo}</div>
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

function StatCard({ label, value, sub, icon: Icon, accent, trend }) {
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: "16px 18px", flex: 1, minWidth: 150 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 500 }}>{label}</span>
        <Icon size={16} color={accent} />
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, color: COLORS.text, marginTop: 8, fontWeight: 600 }}>{value}</div>
      {sub && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11.5, color: trend === "up" ? COLORS.green : trend === "down" ? COLORS.rust : COLORS.textDim }}>
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
};

function TicketModal({ t, onClose, onEstadoActualizado }) {
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [comprobante, setComprobante] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [envioEmail, setEnvioEmail] = useState(null);

  if (!t) return null;
  const stage = STAGES.find((s) => s.key === t.estado_actual) || STAGES[0];

  async function generarComprobante() {
    setGenerando(true);
    setError("");
    try {
      const tipo = TIPO_COMPROBANTE[t.estado_actual] || "recepcion";
      const resultado = await apiPost("/comprobantes", { reparacion_id: t.id, tipo });
      setComprobante(resultado);
    } catch (e) {
      setError(e.message);
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
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  const idx = STAGES.findIndex((s) => s.key === t.estado_actual);
  const siguiente = idx >= 0 && idx < 3 ? STAGES[idx + 1] : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="fn-modal-box" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, width: 400, maxWidth: "100%", padding: 24, position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: COLORS.textDim, cursor: "pointer" }}>
          <X size={18} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${COLORS.amber}`, flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: COLORS.amber }}>#{t.numero_orden}</div>
            <div style={{ fontFamily: "Oswald", fontSize: 18, color: COLORS.text }}>Comprobante de recepción</div>
          </div>
        </div>

        <div style={{ borderTop: `1px dashed ${COLORS.line}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <Row label="Cliente" value={t.cliente?.nombre} />
          <Row label="Equipo" value={t.equipo} />
          <Row label="Problema reportado" value={t.problema_reportado || "—"} />
          <Row label="Fecha recepción" value={fechaLarga(t.fecha_recepcion)} />
          <Row label="Estado" value={stage.label} />
          {t.fecha_fin_garantia && <Row label="Garantía hasta" value={fechaLarga(t.fecha_fin_garantia)} />}
        </div>

        {!["entregado", "no_reparable"].includes(t.estado_actual) && (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
            <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Avanzar reparación</div>
            {error && <div style={{ fontSize: 12, color: COLORS.rust, marginBottom: 8 }}>{error}</div>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {siguiente && (
                <button disabled={guardando} onClick={() => avanzar(siguiente.key)} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "8px 12px" }}>
                  {guardando ? <Loader2 size={13} className="spin" /> : `→ ${siguiente.label}`}
                </button>
              )}
              <button disabled={guardando} onClick={() => avanzar("listo")} style={{ ...btnStyle("transparent", COLORS.green, COLORS.line), flex: "none", padding: "8px 12px" }}>
                Marcar listo
              </button>
            </div>
            <div style={{ marginTop: 10 }}>
              <input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Motivo si no es reparable..."
                style={{ width: "100%", fontSize: 12, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}`, marginBottom: 6, boxSizing: "border-box" }}
              />
              <button disabled={guardando} onClick={() => avanzar("no_reparable")} style={{ ...btnStyle("transparent", COLORS.rust, COLORS.line), width: "100%", padding: "8px 12px" }}>
                Marcar no reparable
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.line}` }}>
          <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Comprobante</div>

          {!comprobante ? (
            <button disabled={generando} onClick={generarComprobante} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), width: "100%" }}>
              {generando ? "Generando PDF..." : <><Printer size={14} /> Generar comprobante</>}
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={`${API_BASE}/comprobantes/${comprobante.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), textDecoration: "none" }}
                >
                  <Printer size={14} /> Ver / imprimir PDF
                </a>
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
      </div>
    </div>
  );
}

// -------------------- modal: nueva reparación --------------------
function NuevaReparacionModal({ onClose, onCreada }) {
  const [form, setForm] = useState({ nombreCliente: "", telefono: "", equipo: "", problema: "" });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function guardar() {
    setError("");
    if (!form.nombreCliente.trim() || !form.equipo.trim()) {
      setError("Cliente y equipo son obligatorios.");
      return;
    }
    setGuardando(true);
    try {
      const cliente = await apiPost("/clientes", { nombre: form.nombreCliente, telefono: form.telefono });
      const reparacion = await apiPost("/reparaciones", {
        cliente_id: cliente.id,
        equipo: form.equipo,
        problema_reportado: form.problema,
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
      <div onClick={(e) => e.stopPropagation()} className="fn-modal-box" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, width: 380, maxWidth: "100%", padding: 24, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: COLORS.textDim, cursor: "pointer" }}>
          <X size={18} />
        </button>
        <div style={{ fontFamily: "Oswald", fontSize: 18, color: COLORS.text, marginBottom: 16 }}>Nueva reparación</div>

        {error && <div style={{ fontSize: 12, color: COLORS.rust, marginBottom: 10 }}>{error}</div>}

        <label style={{ fontSize: 12, color: COLORS.textDim }}>Cliente
          <input style={inputStyle} value={form.nombreCliente} onChange={set("nombreCliente")} placeholder="Nombre y apellidos" />
        </label>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Teléfono
          <input style={inputStyle} value={form.telefono} onChange={set("telefono")} placeholder="600 000 000" />
        </label>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Equipo
          <input style={inputStyle} value={form.equipo} onChange={set("equipo")} placeholder="Ej. HP Pavilion 15" />
        </label>
        <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginTop: 10 }}>Problema reportado
          <input style={inputStyle} value={form.problema} onChange={set("problema")} placeholder="Ej. No enciende" />
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
    try {
      const data = await apiGet(`/clientes/${cliente.id}`);
      setDetalle(data);
    } catch (e) {
      setDetalle({ error: e.message });
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
                <div style={{ fontWeight: 600, fontSize: 13.5, color: COLORS.text }}>{c.nombre}</div>
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
              <div style={{ fontFamily: "Oswald", fontSize: 16, color: COLORS.text, marginBottom: 4 }}>{detalle.nombre}</div>
              <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 14 }}>{detalle.telefono || "Sin teléfono"}{detalle.email ? ` · ${detalle.email}` : ""}</div>
              <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
                Historial ({detalle.reparaciones?.length || 0})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(detalle.reparaciones || []).map((r) => {
                  const st = STAGES.find((s) => s.key === r.estado_actual) || STAGES[0];
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
function ReportesView({ reporteDiario, reporteMensual, contador }) {
  const num = (v) => Number(v || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
          <StatCard label="Totales" value={contador.total} icon={Ticket} accent={COLORS.amber} />
          <StatCard label="En curso" value={contador.en_curso} icon={CircleDot} accent={COLORS.teal} />
          <StatCard label="Entregadas" value={contador.entregadas} icon={ShieldCheck} accent={COLORS.green} />
          <StatCard label="No reparables" value={contador.no_reparables} icon={TriangleAlert} accent={COLORS.rust} />
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

export default function FirztnetPanel() {
  const [reparaciones, setReparaciones] = useState([]);
  const [contador, setContador] = useState({ total: 0, en_curso: 0, entregadas: 0, no_reparables: 0 });
  const [reporteDiario, setReporteDiario] = useState({ balance_neto: 0 });
  const [reporteMensual, setReporteMensual] = useState({ ingresos: 0, gastos: 0, balance_neto: 0 });
  const [selected, setSelected] = useState(null);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [query, setQuery] = useState("");
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [vista, setVista] = useState("reparaciones");

  const cargarTodo = useCallback(async () => {
    setErrorCarga("");
    try {
      const [reps, cont, diario, mensual] = await Promise.all([
        apiGet("/reparaciones"),
        apiGet("/reportes/contador"),
        apiGet("/reportes/diario"),
        apiGet("/reportes/mensual"),
      ]);
      setReparaciones(reps);
      setContador(cont);
      setReporteDiario(diario);
      setReporteMensual(mensual);
    } catch (e) {
      setErrorCarga("No se pudo conectar con el backend (" + API_BASE + "). ¿Está corriendo `python run.py`?");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const filtered = useMemo(() => {
    if (!query.trim()) return reparaciones;
    const q = query.toLowerCase();
    return reparaciones.filter(
      (t) =>
        t.cliente?.nombre?.toLowerCase().includes(q) ||
        t.numero_orden?.includes(q) ||
        t.equipo?.toLowerCase().includes(q)
    );
  }, [query, reparaciones]);

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
            border-top: 1px solid ${COLORS.line};
            position: fixed !important;
            bottom: 0; left: 0; right: 0;
            background: ${COLORS.surface} !important;
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
        <aside className="fn-sidebar" style={{ width: 210, background: COLORS.surface, borderRight: `1px solid ${COLORS.line}`, minHeight: "100vh", padding: "22px 16px", flexShrink: 0, display: "flex", flexDirection: "column" }}>
          <div className="fn-logo" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 30, paddingLeft: 4 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: COLORS.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wrench size={16} color="#FFFFFF" />
            </div>
            <span style={{ fontFamily: "Oswald", fontSize: 17, letterSpacing: 0.5 }}>FIRZTNET</span>
          </div>
          {[
            { key: "reparaciones", icon: LayoutGrid, label: "Reparaciones" },
            { key: "clientes", icon: Users, label: "Clientes" },
            { key: "reportes", icon: FileBarChart, label: "Reportes" },
            { key: "caja", icon: Banknote, label: "Caja" },
          ].map((item) => (
            <div
              key={item.label}
              className="fn-navitem"
              onClick={() => setVista(item.key)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: vista === item.key ? COLORS.surfaceRaised : "transparent", color: vista === item.key ? COLORS.amber : COLORS.textDim, fontSize: 13.5, fontWeight: 500 }}
            >
              <item.icon size={16} />
              {item.label}
            </div>
          ))}
        </aside>

        <main className="fn-main" style={{ flex: 1, minWidth: 0, padding: "26px 32px", maxWidth: 1180 }}>
          <div className="fn-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <div>
              <h1 style={{ fontFamily: "Oswald", fontSize: 24, margin: 0, letterSpacing: 0.3 }}>
                {vista === "reparaciones" && "Panel de reparaciones"}
                {vista === "clientes" && "Clientes"}
                {vista === "reportes" && "Reportes"}
                {vista === "caja" && "Caja"}
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
          {vista === "reportes" && <ReportesView reporteDiario={reporteDiario} reporteMensual={reporteMensual} contador={contador} />}
          {vista === "caja" && <CajaView onMovimientoCreado={cargarTodo} />}

          {vista === "reparaciones" && (
          <div className="fn-stat-grid" style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
            <StatCard label="Reparaciones totales" value={contador.total} icon={Ticket} accent={COLORS.amber} />
            <StatCard label="En curso" value={contador.en_curso} icon={CircleDot} accent={COLORS.teal} />
            <StatCard label="Entregadas" value={contador.entregadas} icon={ShieldCheck} accent={COLORS.green} />
            <StatCard label="No reparables" value={contador.no_reparables} icon={TriangleAlert} accent={COLORS.rust} />
          </div>
          )}

          {vista === "reparaciones" && (
          <div className="fn-content-flex" style={{ display: "flex", gap: 20 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="fn-search" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "8px 12px", maxWidth: 320 }}>
                <Search size={14} color={COLORS.textDim} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por cliente, nº orden o equipo..." style={{ background: "none", border: "none", outline: "none", color: COLORS.text, fontSize: 13, width: "100%" }} />
              </div>

              <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
                {STAGES.map((stage) => {
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
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 12, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Balance de hoy</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 24, color: COLORS.amber, fontWeight: 600 }}>
                  {reporteDiario.balance_neto >= 0 ? "+" : ""}{Number(reporteDiario.balance_neto || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                </div>
                <div style={{ height: 70, marginTop: 10, marginLeft: -8 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={TREND}>
                      <defs>
                        <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={COLORS.amber} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={COLORS.amber} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="d" tick={{ fill: COLORS.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.line}`, borderRadius: 8, fontSize: 11 }} />
                      <Area type="monotone" dataKey="v" stroke={COLORS.amber} strokeWidth={2} fill="url(#fill)" />
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
