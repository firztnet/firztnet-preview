import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Wrench, LayoutGrid, Users, FileBarChart, Ticket, Search,
  ChevronRight, CircleDot, TriangleAlert, ShieldCheck, Banknote,
  Printer, Plus, X, ArrowUpRight, ArrowDownRight, Loader2, Settings, LogOut, Camera, Trash2, Package, MessageSquare, CheckCircle2, XCircle, Flame, Eye, MapPin, Bell, RotateCcw, MoreHorizontal, Truck, ChevronDown, Target, TrendingUp, Clock, Menu, User, Lock, EyeOff, UserPlus,
  PhoneOff, UserX, FileText, MoreVertical, Pencil, Paperclip, Calendar, Tag, Check, Layers, CalendarCheck, LifeBuoy, Activity, Server, Globe, RefreshCw, Pause, Play, Car, Gauge, Store, PanelLeftClose, PanelLeftOpen, BellRing
} from "lucide-react";
import { createPortal } from "react-dom";
import InicioTaller, { FondoInicio, temaGuardado, TEMAS_INICIO } from "./inicio-taller.jsx";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar
} from "recharts";

// ---------------------------------------------------------------------
// Cambia esto por la URL donde corra tu backend Flask
// (en local, con `python run.py`, es http://localhost:5000)
// ---------------------------------------------------------------------
const API_BASE = import.meta.env.VITE_API_BASE || "https://firztnet-backend-production.up.railway.app/api";
// Dirección del panel que reciben los clientes en los enlaces (seguimiento, firma del presupuesto...)
const PANEL_URL = "https://reparaciones.firztnet.es";


const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Orbitron:wght@700;800;900&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap";

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
  // Menú lateral: fondo blanco y letras azules
  menuBg: "#FFFFFF",
  menuTexto: "#1D4ED8",
  menuActivoBg: "#DBEAFE",
  menuHoverBg: "#EFF6FF",
  menuBorde: "#E2E8F0",
  violet: "#8B5CF6",
  pink: "#EC4899",
  slate: "#334155",
  brown: "#92400E",
  fuchsia: "#C026D3",
  // Avisos (fondo suave + letra) que cambian con el tema
  tintRojo: "#FEF2F2", tintRojoTx: "#991B1B",
  tintAmbar: "#FFFBEB", tintAmbarTx: "#78350F",
  tintVerde: "#F0FDF4", tintVerdeTx: "#166534",
  tintAzul: "#EFF6FF", tintAzulTx: "#1E40AF",
};

// Temas del panel (se eligen en la pantalla principal). «Día» es el panel claro de siempre.
// Los colores se cambian en COLORS antes de pintar, así todo el panel cambia a la vez.
const OSCURO_BASE = {
  tintRojo: "#3A1619", tintRojoTx: "#FCA5A5", tintAmbar: "#352A10", tintAmbarTx: "#FCD34D",
  tintVerde: "#0F2E20", tintVerdeTx: "#86EFAC", tintAzul: "#14284A", tintAzulTx: "#93C5FD",
  slate: "#64748B", brown: "#B45309", rust: "#F87171", green: "#34D399", statusBlue: "#60A5FA", statusAmber: "#FBBF24", violet: "#A78BFA",
};
const PALETAS = {
  dia: { ...COLORS },
  noche: { ...OSCURO_BASE, bg: "#0B1222", surface: "#111A2E", surfaceRaised: "#18233B", line: "#26324A", text: "#E6EDF7", textDim: "#94A3B8",
    amber: "#3B82F6", amberDim: "#22D3EE", teal: "#22D3EE", menuBg: "#0F1830", menuTexto: "#BFDBFE", menuActivoBg: "#1E2E52", menuHoverBg: "#17233F", menuBorde: "#26324A", sidebarActiveBg: "#1E2E52" },
  aurora: { ...OSCURO_BASE, bg: "#0E0A1F", surface: "#191334", surfaceRaised: "#211A42", line: "#342A5C", text: "#F1EDFF", textDim: "#A99FCB",
    amber: "#8B5CF6", amberDim: "#2DD4BF", teal: "#2DD4BF", menuBg: "#150F2C", menuTexto: "#DDD6FE", menuActivoBg: "#2A1F55", menuHoverBg: "#201846", menuBorde: "#342A5C", sidebarActiveBg: "#2A1F55" },
  grafito: { ...OSCURO_BASE, bg: "#0C0C0E", surface: "#18181B", surfaceRaised: "#202024", line: "#2F2F35", text: "#F4F4F5", textDim: "#A1A1AA",
    amber: "#EA580C", amberDim: "#FB923C", teal: "#2DD4BF", menuBg: "#131315", menuTexto: "#FED7AA", menuActivoBg: "#2A1D14", menuHoverBg: "#1F1F23", menuBorde: "#2F2F35", sidebarActiveBg: "#2A1D14" },
};
function aplicarPaleta(tema) {
  Object.assign(COLORS, PALETAS.dia, PALETAS[tema] || {});
}

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
// Fecha de hoy (AAAA-MM-DD) en la hora de este ordenador, no en hora universal:
// con toISOString(), entre las 00:00 y las 02:00 de Madrid salía todavía "ayer".
function hoyLocalISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE", headers: cabecerasAuth() });
  manejar401(res);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `DELETE ${path} → ${res.status}`);
  return res.json();
}
async function apiPatch(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: cabecerasAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  manejar401(res);
  if (!res.ok) {
    const datos = await res.json().catch(() => ({}));
    const err = new Error(datos.error || `PATCH ${path} → ${res.status}`);
    err.status = res.status;
    err.data = datos;
    throw err;
  }
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

// Cabecera de las tablas de órdenes: fondo azul, letras blancas en negrita y un icono por columna.
// Es "pegajosa" al hacer scroll; la línea de abajo va con sombra interior porque los bordes no se pegan con ella.
const estiloTh = {
  padding: "12px 8px", fontSize: 12, fontWeight: 700, color: "#FFFFFF",
  whiteSpace: "nowrap", textAlign: "left",
  position: "sticky", top: 0, zIndex: 1,
  background: COLORS.amber, boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.15)",
};

// Logo de WhatsApp (los iconos de lucide no incluyen marcas)
function IconoWhatsApp({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.852L0 24l6.335-1.611A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.003-1.37l-.36-.213-3.76.956.996-3.671-.234-.377A9.78 9.78 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z" />
    </svg>
  );
}

// -------------------- Miniatura de foto de una reparación --------------------
// El servidor exige la sesión para ver cada foto, pero una <img> normal no la manda
// (por eso antes salían rotas). Aquí se descarga la foto con la sesión y se enseña.
// Al pulsarla se abre en grande en otra pestaña.
function FotoConSesion({ fotoId }) {
  const [url, setUrl] = useState(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    let urlCreada = null;
    fetch(`${API_BASE}/fotos/${fotoId}/archivo`, { headers: cabecerasAuth() })
      .then((res) => {
        manejar401(res);
        if (!res.ok) throw new Error("no disponible");
        return res.blob();
      })
      .then((blob) => {
        urlCreada = URL.createObjectURL(blob);
        if (cancelado) URL.revokeObjectURL(urlCreada);
        else setUrl(urlCreada);
      })
      .catch(() => { if (!cancelado) setFallo(true); });
    return () => {
      cancelado = true;
      if (urlCreada) URL.revokeObjectURL(urlCreada);
    };
  }, [fotoId]);

  const caja = { width: 70, height: 70, borderRadius: 8, border: `1px solid ${COLORS.line}`, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.surfaceRaised, color: COLORS.textDim, fontSize: 10, textAlign: "center" };
  if (fallo) return <div style={caja}>Foto no disponible</div>;
  if (!url) return <div style={caja}>Cargando…</div>;
  return (
    <a href={url} target="_blank" rel="noreferrer" title="Ver en grande">
      <img src={url} alt="Foto de recepción" style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 8, border: `1px solid ${COLORS.line}`, display: "block" }} />
    </a>
  );
}

// -------------------- Tablas de órdenes (Órdenes activas y Tablero completo) --------------------

function telefonoDe(t) {
  return (t.cliente?.telefono || "").replace(/\D/g, "");
}

function enlaceWhatsApp(t, stage) {
  const telefono = telefonoDe(t);
  if (!telefono) return null;
  const nombre = (t.cliente?.nombre || "").split(" ")[0];
  const mensaje = `Hola ${nombre}, te escribimos sobre tu orden #${t.numero_orden} (${stage.label}).`;
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}

// Abre en otra pestaña un PDF que pide la sesión (factura, etiqueta...).
// La pestaña se abre al momento del clic (si no, el navegador la bloquea) y luego se carga.
async function abrirPdfEnPestana(url, ventana) {
  const res = await fetch(url, { headers: cabecerasAuth() });
  manejar401(res);
  if (!res.ok) throw new Error("No se pudo abrir el PDF");
  const blob = await res.blob();
  const enlace = URL.createObjectURL(blob);
  if (ventana) ventana.location.href = enlace;
  else window.alert("El navegador ha bloqueado la ventana nueva. Permite las ventanas emergentes para este panel y vuelve a pulsar.");
}

// Botón "Factura": si la orden ya tiene factura, abre directamente su PDF (la más reciente:
// si hubo rectificativa, la rectificativa). Si no tiene, devuelve "sin_factura" para que se
// muestre el diálogo de emitirla, en vez de mandarte a la ficha general.
async function abrirFacturaDe(t) {
  const ventana = window.open("", "_blank");
  try {
    const facturas = await apiGet(`/facturas/reparacion/${t.id}`);
    if (facturas.length === 0) {
      ventana?.close();
      return "sin_factura";
    }
    await abrirPdfEnPestana(`${API_BASE}/facturas/${facturas[0].id}/pdf`, ventana);
    return "abierta";
  } catch (err) {
    ventana?.close();
    window.alert(`No se pudo abrir la factura: ${err.message}`);
    return "error";
  }
}

// Abre el PDF de la etiqueta con QR (el mismo botón que hay dentro de la ficha).
async function imprimirEtiquetaDe(t) {
  const ventana = window.open("", "_blank");
  try {
    await abrirPdfEnPestana(`${API_BASE}/reparaciones/${t.id}/etiqueta-qr/pdf`, ventana);
  } catch (e) {
    ventana?.close();
    window.alert(`No se pudo abrir la etiqueta: ${e.message}`);
  }
}

// Sube fotos a la reparación (el mismo envío que usa la ficha en su apartado de fotos).
async function subirFotosDe(t, fileList) {
  if (!fileList || fileList.length === 0) return;
  try {
    const formData = new FormData();
    Array.from(fileList).forEach((f) => formData.append("foto", f));
    const res = await fetch(`${API_BASE}/reparaciones/${t.id}/fotos`, { method: "POST", headers: cabecerasAuth(), body: formData });
    manejar401(res);
    const nuevas = await res.json();
    if (!res.ok) throw new Error(nuevas.error || "No se pudieron subir las fotos");
    if (nuevas.length < fileList.length) {
      window.alert(`Se subieron ${nuevas.length} de ${fileList.length} foto(s). Las demás no tienen un formato válido o pesan más de 10 MB.`);
    } else {
      window.alert(nuevas.length === 1 ? `Foto adjuntada a la orden #${t.numero_orden}.` : `${nuevas.length} fotos adjuntadas a la orden #${t.numero_orden}.`);
    }
  } catch (e) {
    window.alert(`No se pudieron adjuntar: ${e.message}`);
  }
}

// Ventana flotante para los diálogos del menú ⋮. Se dibuja fuera de la tabla y frena
// los clics para que no abran la ficha de la fila que hay debajo.
function VentanaDialogo({ titulo, subtitulo, onCerrar, children, ancho = 480 }) {
  useEffect(() => {
    function tecla(e) { if (e.key === "Escape") onCerrar(); }
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [onCerrar]);
  return createPortal(
    <div
      onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) onCerrar(); }}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "Inter, sans-serif" }}
    >
      <div role="dialog" aria-modal="true" aria-label={titulo} style={{ width: "100%", maxWidth: ancho, maxHeight: "90vh", overflowY: "auto", background: COLORS.surface, borderRadius: 14, boxShadow: "0 24px 60px rgba(15,23,42,0.3)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "16px 18px", borderBottom: `1px solid ${COLORS.line}` }}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: COLORS.text }}>{titulo}</div>
            {subtitulo && <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>{subtitulo}</div>}
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" style={{ border: "none", background: "none", color: COLORS.textDim, cursor: "pointer", padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

// Diálogo cuando la orden todavía no tiene factura: enseña lo cobrado y deja emitirla
// y abrirla en un paso. Si no hay cobros, lo explica (sin mandarte a otra pantalla).
function DialogoEmitirFactura({ t, onCerrar, onCambio }) {
  const [cobrado, setCobrado] = useState(null);
  const [error, setError] = useState("");
  const [emitiendo, setEmitiendo] = useState(false);
  const numero = (t.numero_orden || "").split("-")[1] || t.numero_orden;

  useEffect(() => {
    apiGet(`/reparaciones/${t.id}`)
      .then((d) => setCobrado((d.movimientos || []).filter((m) => m.tipo === "ingreso").reduce((s, m) => s + Number(m.monto), 0)))
      .catch((e) => setError(e.message));
  }, [t.id]);

  async function emitir() {
    const ventana = window.open("", "_blank"); // se abre ya, con el clic, para que no la bloquee el navegador
    setEmitiendo(true);
    setError("");
    try {
      const factura = await apiPost("/facturas", { reparacion_id: t.id });
      await abrirPdfEnPestana(`${API_BASE}/facturas/${factura.id}/pdf`, ventana);
      onCambio?.();
      onCerrar();
    } catch (e) {
      ventana?.close();
      setError(e.message);
    } finally {
      setEmitiendo(false);
    }
  }

  const euros = (n) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <VentanaDialogo titulo={`Factura de la orden #${numero}`} subtitulo={`${t.cliente?.nombre || "Sin cliente"} · ${t.equipo || ""}`} onCerrar={onCerrar}>
      {cobrado === null && !error && <div style={{ fontSize: 13, color: COLORS.textDim }}>Comprobando los cobros…</div>}
      {cobrado !== null && cobrado <= 0 && (
        <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.5 }}>
          Esta orden todavía <strong>no tiene ningún cobro registrado</strong>, así que no se puede facturar. La factura se emite por lo cobrado: registra primero el cobro en la ficha de la orden (apartado <em>Cobro</em>).
        </div>
      )}
      {cobrado !== null && cobrado > 0 && (
        <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.5 }}>
          Esta orden todavía <strong>no tiene factura</strong>. Se emitirá por el total cobrado:
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text, margin: "10px 0 4px" }}>{euros(cobrado)} €</div>
          <div style={{ fontSize: 11.5, color: COLORS.textDim }}>IVA incluido. Una factura emitida no se puede borrar; si luego hay un error, se corrige con una factura rectificativa.</div>
        </div>
      )}
      {error && <div style={{ marginTop: 12, fontSize: 12.5, color: COLORS.rust, background: `${COLORS.rust}12`, borderRadius: 8, padding: "9px 11px" }}>{error}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <button type="button" onClick={onCerrar} style={{ ...btnStyle(COLORS.surface, COLORS.text, COLORS.line), flex: "none", padding: "9px 14px" }}>Cancelar</button>
        {cobrado !== null && cobrado > 0 && (
          <button type="button" disabled={emitiendo} onClick={emitir} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "9px 14px" }}>
            <FileText size={14} /> {emitiendo ? "Emitiendo…" : "Emitir y abrir factura"}
          </button>
        )}
      </div>
    </VentanaDialogo>
  );
}

// Diálogo "Editar": solo los datos de la orden, ya rellenos, para corregirlos y guardar.
// Lo demás (estado, cobros, presupuesto, fotos...) tiene su propio sitio en la ficha.
function DialogoEditarOrden({ t, onCerrar, onCambio }) {
  const domicilio = t.tipo_trabajo === "domicilio";
  const inicial = {
    equipo: t.equipo || "",
    marca: t.marca || "",
    modelo: t.modelo || "",
    categoria: t.categoria || "",
    direccion_servicio: t.direccion_servicio || "",
    problema_reportado: t.problema_reportado || "",
    accesorios_entregados: t.accesorios_entregados || "",
    estado_entrada: t.estado_entrada || "",
    tecnico: t.tecnico || "",
    urgente: !!t.urgente,
    fecha_estimada: t.fecha_estimada ? t.fecha_estimada.slice(0, 10) : "",
    wifi_ssid: t.wifi_ssid || "",
    wifi_password: t.wifi_password || "",
  };
  const [form, setForm] = useState(inicial);
  const [tecnicos, setTecnicos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const numero = (t.numero_orden || "").split("-")[1] || t.numero_orden;

  useEffect(() => {
    apiGet("/configuracion").then((c) => setTecnicos(c.tecnicos || [])).catch(() => {});
  }, []);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function guardar() {
    if (!form.equipo.trim()) { setError(domicilio ? "La descripción del servicio no puede quedar vacía." : "El equipo no puede quedar vacío."); return; }
    // Solo se envía lo que has cambiado
    const cambios = {};
    for (const campo of Object.keys(inicial)) {
      if (form[campo] === inicial[campo]) continue;
      if (campo === "fecha_estimada") cambios.fecha_estimada = form.fecha_estimada ? new Date(form.fecha_estimada).toISOString() : null;
      else if (campo === "urgente") cambios.urgente = form.urgente;
      else cambios[campo] = typeof form[campo] === "string" ? form[campo].trim() : form[campo];
    }
    if (Object.keys(cambios).length === 0) { onCerrar(); return; }
    setGuardando(true);
    setError("");
    try {
      await apiPatch(`/reparaciones/${t.id}`, cambios);
      onCambio?.();
      onCerrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  const etiqueta = { fontSize: 11.5, fontWeight: 600, color: COLORS.textDim, marginBottom: 4, display: "block" };
  const campo = { width: "100%", fontSize: 13, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box", fontFamily: "inherit", background: COLORS.surface, color: COLORS.text };
  const fila = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 12 };

  return (
    <VentanaDialogo titulo={`Editar orden #${numero}`} subtitulo={`${t.cliente?.nombre || "Sin cliente"} · ${domicilio ? "A domicilio" : "Taller"}`} onCerrar={onCerrar} ancho={620}>
      <div style={{ marginBottom: 12 }}>
        <label style={etiqueta}>{domicilio ? "Descripción del servicio" : "Equipo"}</label>
        <input style={campo} value={form.equipo} onChange={set("equipo")} maxLength={120} autoFocus />
      </div>
      {domicilio ? (
        <div style={fila}>
          <div>
            <label style={etiqueta}>Tipo de servicio</label>
            <select style={campo} value={form.categoria} onChange={set("categoria")}>
              <option value="">— Sin indicar —</option>
              {CATEGORIAS_DOMICILIO.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              {form.categoria && !CATEGORIAS_DOMICILIO.some((c) => c.key === form.categoria) && <option value={form.categoria}>{form.categoria}</option>}
            </select>
          </div>
          <div>
            <label style={etiqueta}>Dirección del servicio</label>
            <input style={campo} value={form.direccion_servicio} onChange={set("direccion_servicio")} maxLength={200} />
          </div>
        </div>
      ) : (
        <div style={fila}>
          <div>
            <label style={etiqueta}>Marca</label>
            <input style={campo} value={form.marca} onChange={set("marca")} maxLength={60} />
          </div>
          <div>
            <label style={etiqueta}>Modelo</label>
            <input style={campo} value={form.modelo} onChange={set("modelo")} maxLength={60} />
          </div>
        </div>
      )}
      <div style={{ marginBottom: 12 }}>
        <label style={etiqueta}>Problema que indica el cliente</label>
        <textarea style={{ ...campo, minHeight: 64, resize: "vertical" }} value={form.problema_reportado} onChange={set("problema_reportado")} maxLength={5000} />
      </div>
      {!domicilio && (
        <div style={fila}>
          <div>
            <label style={etiqueta}>Accesorios entregados</label>
            <input style={campo} value={form.accesorios_entregados} onChange={set("accesorios_entregados")} maxLength={255} placeholder="Ej. cargador, funda" />
          </div>
          <div>
            <label style={etiqueta}>Estado al recibirlo</label>
            <input style={campo} value={form.estado_entrada} onChange={set("estado_entrada")} maxLength={5000} placeholder="Ej. rayón en la tapa" />
          </div>
        </div>
      )}
      {domicilio && (
        <div style={fila}>
          <div>
            <label style={etiqueta}>Nombre de la WiFi</label>
            <input style={campo} value={form.wifi_ssid} onChange={set("wifi_ssid")} maxLength={80} />
          </div>
          <div>
            <label style={etiqueta}>Contraseña de la WiFi</label>
            <input style={campo} value={form.wifi_password} onChange={set("wifi_password")} maxLength={120} />
          </div>
        </div>
      )}
      <div style={fila}>
        <div>
          <label style={etiqueta}>Técnico</label>
          <select style={campo} value={form.tecnico} onChange={set("tecnico")}>
            <option value="">— Sin asignar —</option>
            {tecnicos.map((n) => <option key={n} value={n}>{n}</option>)}
            {form.tecnico && !tecnicos.includes(form.tecnico) && <option value={form.tecnico}>{form.tecnico}</option>}
          </select>
        </div>
        <div>
          <label style={etiqueta}>Fecha estimada de entrega</label>
          <input type="date" style={campo} value={form.fecha_estimada} onChange={set("fecha_estimada")} />
        </div>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: COLORS.text, cursor: "pointer" }}>
        <input type="checkbox" checked={form.urgente} onChange={set("urgente")} /> <Flame size={14} color={COLORS.rust} /> Urgente
      </label>
      {error && <div style={{ marginTop: 12, fontSize: 12.5, color: COLORS.rust, background: `${COLORS.rust}12`, borderRadius: 8, padding: "9px 11px" }}>{error}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <button type="button" onClick={onCerrar} style={{ ...btnStyle(COLORS.surface, COLORS.text, COLORS.line), flex: "none", padding: "9px 14px" }}>Cancelar</button>
        <button type="button" disabled={guardando} onClick={guardar} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "9px 14px" }}>
          <Pencil size={14} /> {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </VentanaDialogo>
  );
}

// Columna "WhatsApp": botón verde con el texto, o gris si el cliente no tiene teléfono.
function CeldaWhatsApp({ t, stage }) {
  const enlace = enlaceWhatsApp(t, stage);
  const base = { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700, boxSizing: "border-box", whiteSpace: "nowrap" };
  if (!enlace) {
    return (
      <span style={{ ...base, background: COLORS.surfaceRaised, color: COLORS.textDim, fontWeight: 500, fontSize: 11 }}>
        <PhoneOff size={13} /> Sin teléfono
      </span>
    );
  }
  return (
    <a
      onClick={(e) => e.stopPropagation()}
      href={enlace}
      target="_blank"
      rel="noreferrer"
      title={`Escribir a ${t.cliente?.nombre || "el cliente"} por WhatsApp`}
      style={{ ...base, background: "#16C35A", color: "#FFFFFF", textDecoration: "none" }}
    >
      <IconoWhatsApp size={15} /> WhatsApp
    </a>
  );
}

// Borra la orden (después de pedir que se escriba su número, para evitar sustos).
// El servidor no deja borrar una orden con factura o con cobros, y explica por qué.
async function eliminarOrdenDe(t, onCambio) {
  const numero = (t.numero_orden || "").split("-")[1] || t.numero_orden;
  const escrito = window.prompt(
    `Vas a BORRAR PARA SIEMPRE la orden #${numero} (${t.cliente?.nombre || "sin cliente"} — ${t.equipo || ""}).\n\n` +
    `Se borrarán también sus fotos, firmas, comprobantes, checklist y recordatorios, y los repuestos que tuviera volverán al stock.\n\n` +
    `Para confirmar, escribe el número de la orden: ${numero}`
  );
  if (escrito === null) return; // pulsó Cancelar
  if (escrito.trim().replace(/^#/, "") !== numero) {
    window.alert("El número no coincide. No se ha borrado nada.");
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/reparaciones/${t.id}`, { method: "DELETE", headers: cabecerasAuth() });
    manejar401(res);
    const datos = await res.json().catch(() => ({}));
    if (res.status === 405) {
      window.alert("El servidor todavía no tiene la opción de eliminar. Sube primero el archivo nuevo del backend.");
      return;
    }
    if (!res.ok) {
      window.alert(datos.mensaje || datos.error || "No se pudo eliminar la orden.");
      return;
    }
    window.alert(
      `Orden #${numero} eliminada.` +
      (datos.repuestos_devueltos ? ` Se devolvieron ${datos.repuestos_devueltos} repuesto(s) al stock.` : "")
    );
    onCambio?.();
  } catch (e) {
    window.alert(`No se pudo eliminar: ${e.message}`);
  }
}

// Botón ⋮ de la columna "Acciones" con su menú desplegable.
// El menú se dibuja fuera de la tabla (con un "portal") para que no lo corte el scroll de la tabla.
function MenuAccionesOrden({ t, stage, esFinal, onAbrir, onCambio }) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const botonRef = useRef(null);
  const menuRef = useRef(null);
  const inputFotosRef = useRef(null);
  const [dialogo, setDialogo] = useState(null); // null | "editar" | "factura"

  const ANCHO = 190;
  const ALTO = 300;

  function abrir(e) {
    e.stopPropagation();
    if (abierto) { setAbierto(false); return; }
    const r = botonRef.current.getBoundingClientRect();
    const haciaArriba = r.bottom + ALTO > window.innerHeight - 8;
    setPos({
      top: haciaArriba ? Math.max(8, r.top - ALTO - 4) : r.bottom + 4,
      left: Math.max(8, Math.min(r.right - ANCHO, window.innerWidth - ANCHO - 8)),
    });
    setAbierto(true);
  }

  useEffect(() => {
    if (!abierto) return;
    function cerrarSiFuera(e) {
      if (menuRef.current?.contains(e.target) || botonRef.current?.contains(e.target)) return;
      setAbierto(false);
    }
    function cerrar() { setAbierto(false); }
    function tecla(e) { if (e.key === "Escape") setAbierto(false); }
    document.addEventListener("mousedown", cerrarSiFuera);
    document.addEventListener("keydown", tecla);
    window.addEventListener("scroll", cerrar, true);
    window.addEventListener("resize", cerrar);
    return () => {
      document.removeEventListener("mousedown", cerrarSiFuera);
      document.removeEventListener("keydown", tecla);
      window.removeEventListener("scroll", cerrar, true);
      window.removeEventListener("resize", cerrar);
    };
  }, [abierto]);

  const enlace = enlaceWhatsApp(t, stage);

  const opciones = [
    { icono: Eye, texto: "Ver orden", accion: () => onAbrir(t) },
    { icono: Pencil, texto: "Editar", accion: () => setDialogo("editar") },
    { icono: MessageSquare, texto: "WhatsApp", accion: () => window.open(enlace, "_blank", "noreferrer"), desactivada: !enlace, motivo: "El cliente no tiene teléfono" },
    { icono: FileText, texto: "Factura", accion: async () => { if ((await abrirFacturaDe(t)) === "sin_factura") setDialogo("factura"); }, desactivada: !esFinal, motivo: "Solo cuando está entregada o completada" },
    { icono: Printer, texto: "Imprimir etiqueta", accion: () => imprimirEtiquetaDe(t) },
    { icono: Paperclip, texto: "Adjuntar fotos", accion: () => inputFotosRef.current?.click() },
    { separador: true },
    { icono: Trash2, texto: "Eliminar", peligro: true, accion: () => eliminarOrdenDe(t, onCambio) },
  ];

  return (
    <>
      <button
        ref={botonRef}
        onClick={abrir}
        title="Acciones"
        aria-label={`Acciones de la orden #${t.numero_orden}`}
        aria-expanded={abierto}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, margin: "0 auto", borderRadius: 999, border: `1px solid ${COLORS.line}`, background: abierto ? COLORS.surfaceRaised : COLORS.surface, color: COLORS.text, cursor: "pointer" }}
      >
        <MoreVertical size={16} />
      </button>
      <input
        ref={inputFotosRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => { const archivos = e.target.files; subirFotosDe(t, archivos).finally(() => { e.target.value = ""; }); }}
      />
      {abierto && createPortal(
        <div
          ref={menuRef}
          role="menu"
          onClick={(e) => e.stopPropagation()}
          style={{ position: "fixed", top: pos.top, left: pos.left, width: ANCHO, zIndex: 200, fontFamily: "Inter, sans-serif", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, boxShadow: "0 12px 32px rgba(15,23,42,0.18)", padding: 6 }}
        >
          {opciones.map((o, i) => {
            if (o.separador) return <div key={`sep-${i}`} style={{ height: 1, background: COLORS.line, margin: "4px 2px" }} />;
            const Icono = o.icono;
            const color = o.desactivada ? COLORS.textDim : o.peligro ? COLORS.rust : COLORS.text;
            return (
              <button
                key={o.texto}
                role="menuitem"
                disabled={o.desactivada}
                title={o.desactivada ? o.motivo : undefined}
                onClick={() => { setAbierto(false); o.accion?.(); }}
                className="fn-menu-accion"
                style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 10px", border: "none", borderRadius: 7, background: "none", color, opacity: o.desactivada ? 0.5 : 1, fontSize: 12.5, textAlign: "left", cursor: o.desactivada ? "not-allowed" : "pointer" }}
              >
                <Icono size={14} /> {o.texto}
              </button>
            );
          })}
        </div>,
        document.body
      )}
      {dialogo === "editar" && <DialogoEditarOrden t={t} onCerrar={() => setDialogo(null)} onCambio={onCambio} />}
      {dialogo === "factura" && <DialogoEmitirFactura t={t} onCerrar={() => setDialogo(null)} onCambio={onCambio} />}
    </>
  );
}

// Servicios in situ con fecha de visita: lo que importa es el día de la visita, no el día
// en que se dio de alta (una visita del mes que viene se crea con un mes de antelación).
function fechaVisita(t) {
  return t?.tipo_trabajo === "domicilio" && t.fecha_estimada ? new Date(t.fecha_estimada) : null;
}
function fechaReferencia(t) {
  return fechaVisita(t) || (t?.fecha_recepcion ? new Date(t.fecha_recepcion) : new Date(0));
}
// Días naturales entre hoy y una fecha (positivo = ya pasó; negativo = todavía falta).
function diasNaturalesDesde(fecha) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const dia = new Date(fecha); dia.setHours(0, 0, 0, 0);
  return Math.round((hoy - dia) / (1000 * 60 * 60 * 24));
}

function diasDesde(fecha) {
  return Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));
}

// Cabecera de cada bloque: icono verde, título, subtítulo y el contador de órdenes a la derecha.
function CabeceraBloqueOrdenes({ icono: Icono, titulo, subtitulo, total, iconoContador: IconoContador, fondo }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: fondo, borderBottom: `1px solid ${COLORS.line}`, flexWrap: "wrap" }}>
      <div style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #22C55E, #10B981)", color: "#FFFFFF", boxShadow: "0 4px 10px rgba(16,185,129,0.3)" }}>
        <Icono size={21} />
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>{titulo}</div>
        <div style={{ fontSize: 12.5, color: COLORS.textDim, marginTop: 2 }}>{subtitulo}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 999, background: `${COLORS.amber}14`, color: COLORS.amber, fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>
        <IconoContador size={15} /> {total} {total === 1 ? "orden" : "órdenes"}
      </div>
    </div>
  );
}

// La tabla en sí. La usan los dos bloques; cada uno le pasa sus filas ya filtradas y ordenadas.
// Solo se ven `filasVisibles` órdenes a la vez; las demás aparecen al girar la rueda del ratón
// (o deslizando el dedo en el móvil). La barra de desplazamiento está oculta a propósito, y cuando
// quedan más órdenes por debajo se ve un ligero degradado al pie de la tabla como pista.
function TablaOrdenes({ filas, etapasDe, onAbrir, onHover, onCambio, mensajeVacio, filasVisibles = 6 }) {
  const cajaRef = useRef(null);
  const [alto, setAlto] = useState(undefined);
  const [quedanMas, setQuedanMas] = useState(false);

  const comprobarSiQuedanMas = useCallback(() => {
    const caja = cajaRef.current;
    if (!caja) return;
    setQuedanMas(caja.scrollTop + caja.clientHeight < caja.scrollHeight - 2);
  }, []);

  // Mide la cabecera + las primeras filas para que la caja tenga justo ese alto.
  React.useLayoutEffect(() => {
    function medir() {
      const caja = cajaRef.current;
      if (!caja) return;
      const filasDom = caja.querySelectorAll("tbody tr");
      if (filasDom.length <= filasVisibles) {
        setAlto(undefined);
      } else {
        const arriba = caja.querySelector("table").getBoundingClientRect().top;
        const abajo = filasDom[filasVisibles - 1].getBoundingClientRect().bottom;
        setAlto(Math.ceil(abajo - arriba));
      }
      requestAnimationFrame(comprobarSiQuedanMas);
    }
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [filas, filasVisibles, comprobarSiQuedanMas]);

  const columnas = [
    { texto: "# Orden", icono: null },
    { texto: "Fecha", icono: Calendar },
    { texto: "Cliente / Equipo", icono: User },
    { texto: "Tipo", icono: Tag },
    { texto: "Días", icono: Clock },
    { texto: "Estado", icono: CircleDot },
    { texto: "WhatsApp", icono: MessageSquare },
    { texto: "Acciones", icono: MoreVertical, centrado: true, fija: true },
  ];

  return (
    <div style={{ position: "relative" }}>
    <div ref={cajaRef} className="fn-sin-barra" onScroll={comprobarSiQuedanMas} style={{ maxHeight: alto, overflow: "auto", overscrollBehaviorY: "auto" }}>
      {/* Cabe entera desde 1024 px de ancho; si aun así no cabe, «Acciones» queda fija a la derecha */}
      <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse", fontSize: 12.5, tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: 84 }} />
          <col style={{ width: 84 }} />
          <col style={{ width: "auto" }} />
          <col style={{ width: 78 }} />
          <col style={{ width: 134 }} />
          <col style={{ width: 150 }} />
          <col style={{ width: 116 }} />
          <col style={{ width: 84 }} />
        </colgroup>
        <thead>
          <tr>
            {columnas.map((c, i) => {
              const Icono = c.icono;
              return (
                <th key={i} style={{ ...estiloTh, paddingLeft: i === 0 ? 16 : 8, textAlign: c.centrado ? "center" : "left", ...(c.fija ? { position: "sticky", right: 0, zIndex: 2 } : null) }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {Icono && <Icono size={14} color="#FFFFFF" />}{c.texto}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 && (
            <tr>
              <td colSpan={columnas.length} style={{ padding: "20px 12px", textAlign: "center", fontSize: 12, color: COLORS.textDim }}>{mensajeVacio}</td>
            </tr>
          )}
          {filas.map((t) => {
            const lista = etapasDe(t);
            const stage = lista.find((s) => s.key === t.estado_actual) || lista[0];
            const esFinal = ["entregado", "completado"].includes(t.estado_actual);
            const numero = (t.numero_orden || "").split("-")[1] || t.numero_orden;
            const domicilio = t.tipo_trabajo === "domicilio";
            // In situ con fecha de visita: se enseña el día de la visita y cuánto falta (o cuánto se ha pasado).
            const visita = fechaVisita(t);
            const fecha = visita || (t.fecha_recepcion ? new Date(t.fecha_recepcion) : null);
            const anio = visita ? "Visita" : fecha ? fecha.getFullYear() : "";
            const diaMes = fecha ? `${String(fecha.getDate()).padStart(2, "0")}/${String(fecha.getMonth() + 1).padStart(2, "0")}` : "—";
            const diasVisita = visita && !esFinal ? diasNaturalesDesde(visita) : null;
            const dias = diasVisita !== null ? diasVisita : diasDesde(t.fecha_recepcion);
            const futura = diasVisita !== null && diasVisita < 0;
            const retrasada = diasVisita !== null ? diasVisita >= 1 : dias >= 5;
            const textoDias = diasVisita === null ? `${dias} ${dias === 1 ? "día" : "días"}`
              : diasVisita === 0 ? "Hoy"
              : futura ? `En ${-diasVisita} ${diasVisita === -1 ? "día" : "días"}`
              : `${diasVisita} ${diasVisita === 1 ? "día" : "días"} tarde`;
            return (
              <tr
                key={t.id}
                className="fn-fila-tabla"
                onClick={() => onAbrir(t)}
                onMouseEnter={() => onHover?.(t)}
                onMouseLeave={() => onHover?.(null)}
                style={{ borderTop: `1px solid ${COLORS.line}`, cursor: "pointer" }}
              >
                <td style={{ padding: "10px 8px 10px 12px", borderLeft: `4px solid ${stage.accent}` }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, background: COLORS.surfaceRaised, color: COLORS.text, fontWeight: 800, fontSize: 13, whiteSpace: "nowrap" }}>
                    {t.urgente && <Flame size={12} color={COLORS.rust} />}#{numero}
                  </span>
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Calendar size={16} color={COLORS.slate} style={{ flexShrink: 0 }} />
                    <div style={{ lineHeight: 1.25 }}>
                      <div style={{ fontSize: 10.5, color: COLORS.textDim }}>{anio}</div>
                      <div style={{ fontSize: 12, color: COLORS.text, fontWeight: 600 }}>{diaMes}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "10px 8px", overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.surfaceRaised, color: COLORS.amber }}>
                      <User size={15} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: COLORS.text, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.cliente?.nombre}</div>
                      <div style={{ color: COLORS.textDim, fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.equipo}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <span style={{ display: "inline-block", fontSize: 11.5, fontWeight: 600, color: domicilio ? COLORS.amber : COLORS.slate, background: domicilio ? `${COLORS.amber}14` : COLORS.surfaceRaised, borderRadius: 999, padding: "5px 12px", whiteSpace: "nowrap" }}>
                    {domicilio ? "In Situ" : "Taller"}
                  </span>
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: futura || diasVisita === 0 ? COLORS.amber : retrasada ? COLORS.rust : COLORS.textDim, background: futura || diasVisita === 0 ? `${COLORS.amber}14` : retrasada ? `${COLORS.rust}14` : COLORS.surfaceRaised, borderRadius: 999, padding: "5px 10px", whiteSpace: "nowrap", maxWidth: "100%", boxSizing: "border-box", overflow: "hidden", textOverflow: "ellipsis" }} title={textoDias}>
                    <Clock size={12} style={{ flexShrink: 0 }} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{textoDias}</span>
                  </span>
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: COLORS.text, background: `${stage.accent}1A`, borderRadius: 999, padding: "5px 11px", whiteSpace: "nowrap", maxWidth: "100%", boxSizing: "border-box" }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: stage.accent, flexShrink: 0 }} />
                    {stage.label}
                  </span>
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <CeldaWhatsApp t={t} stage={stage} />
                </td>
                <td style={{ padding: "10px 8px", position: "sticky", right: 0, zIndex: 1, background: COLORS.surface }}>
                  {/* Menú ⋮ (Ver, Editar, WhatsApp, Factura, Etiqueta, Fotos, Eliminar), siempre a la vista */}
                  <MenuAccionesOrden t={t} stage={stage} esFinal={esFinal} onAbrir={onAbrir} onCambio={onCambio} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    {quedanMas && (
      <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 26, pointerEvents: "none", background: `linear-gradient(to bottom, transparent, ${COLORS.surface})` }} />
    )}
    </div>
  );
}

const estiloBloqueOrdenes = () => ({ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" });

function TablaOrdenesActivas({ reparaciones, onAbrir, onHover, onCambio }) {
  const hoy = new Date().toDateString();
  const filas = reparaciones
    .filter((r) =>
      !["entregado", "no_reparable", "completado"].includes(r.estado_actual) ||
      (["entregado", "completado"].includes(r.estado_actual) && r.fecha_entrega && new Date(r.fecha_entrega).toDateString() === hoy)
    )
    .sort((a, b) => (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0) || fechaReferencia(a) - fechaReferencia(b));

  if (filas.length === 0) return null;

  return (
    <div style={{ ...estiloBloqueOrdenes(), marginBottom: 20 }}>
      <CabeceraBloqueOrdenes
        icono={Calendar}
        titulo="Tablero de órdenes - Pendientes / En curso"
        subtitulo="Aquí puedes ver las órdenes activas y su estado actual."
        total={filas.length}
        iconoContador={Clock}
        fondo={`linear-gradient(90deg, ${COLORS.tintAzul}, ${COLORS.surface})`}
      />
      <TablaOrdenes filas={filas} etapasDe={(t) => stagesFor(t.tipo_trabajo)} onAbrir={onAbrir} onHover={onHover} onCambio={onCambio} mensajeVacio="" />
    </div>
  );
}

function TablaTableroCompleto({ reparaciones, tipoTrabajo, onAbrir, onHover, onCambio, cargando, titulo = "Tablero completo", subtitulo = "Todas las órdenes del sistema, con su estado actual.", mensajeVacio = "Sin equipos aquí." }) {
  // tipoTrabajo "todos" (pantalla Buscar): taller e in situ juntos, cada orden con sus propias etapas
  const mezclado = tipoTrabajo === "todos";
  const etapas = stagesFor(mezclado ? "taller" : tipoTrabajo);
  const posicionEtapa = (t) => {
    const lista = mezclado ? stagesFor(t.tipo_trabajo) : etapas;
    const i = lista.findIndex((s) => s.key === t.estado_actual);
    return i === -1 ? 99 : i;
  };
  // Las órdenes de clientes eliminados (RGPD) no se muestran en el tablero. Se pueden ver
  // pulsando el enlace de abajo, por si hiciera falta consultar alguna.
  const [verEliminados, setVerEliminados] = useState(false);

  const ordenadas = [...reparaciones].sort(
    (a, b) => posicionEtapa(a) - posicionEtapa(b) || fechaReferencia(a) - fechaReferencia(b)
  );
  const deEliminados = ordenadas.filter((t) => esClienteEliminado(t.cliente));
  const filas = verEliminados ? ordenadas : ordenadas.filter((t) => !esClienteEliminado(t.cliente));

  return (
    <div style={estiloBloqueOrdenes()}>
      <CabeceraBloqueOrdenes
        icono={Check}
        titulo={titulo}
        subtitulo={subtitulo}
        total={filas.length}
        iconoContador={Layers}
        fondo={`linear-gradient(90deg, ${COLORS.tintVerde}, ${COLORS.surface})`}
      />
      <TablaOrdenes filas={cargando ? [] : filas} etapasDe={(t) => (mezclado ? stagesFor(t.tipo_trabajo) : etapas)} onAbrir={onAbrir} onHover={onHover} onCambio={onCambio} mensajeVacio={cargando ? "Cargando..." : mensajeVacio} />
      {!cargando && deEliminados.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 16px", borderTop: `1px solid ${COLORS.line}`, background: COLORS.surfaceRaised, fontSize: 12, color: COLORS.textDim }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <UserX size={14} />
            {verEliminados
              ? `Mostrando también ${deEliminados.length} ${deEliminados.length === 1 ? "orden" : "órdenes"} de clientes eliminados (RGPD).`
              : `${deEliminados.length} ${deEliminados.length === 1 ? "orden oculta" : "órdenes ocultas"} de clientes eliminados (RGPD).`}
          </span>
          <button type="button" onClick={() => setVerEliminados((v) => !v)} style={{ border: "none", background: "none", color: COLORS.amber, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0, whiteSpace: "nowrap" }}>
            {verEliminados ? "Ocultarlas" : "Ver"}
          </button>
        </div>
      )}
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
    <div ref={ref} style={{ position: "relative" }}>
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
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 240, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, boxShadow: "0 12px 28px -8px rgba(0,0,0,0.18)", zIndex: 40, overflow: "hidden" }}>
          {opciones.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => { onCambiar(o.key); setAbierto(false); }}
              style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 14px", background: o.key === valor ? o.color : COLORS.surface, color: o.key === valor ? "#FFFFFF" : COLORS.text, border: "none", cursor: "pointer", fontSize: 13, fontWeight: o.key === valor ? 600 : 500, textAlign: "left" }}
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

// Formato de dinero y tamaño de letra de las cifras largas: así "+1.234,56 €" no se corta
// dentro de una tarjeta estrecha (la letra monoespaciada mide ~0,6 veces su tamaño por carácter).
const fmtEur = (n) => `${Number(n || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`;
const tamDinero = (texto) => Math.min(24, Math.floor(125 / (String(texto).length * 0.6)));

// -------------------- Logo animado del menú lateral --------------------
// Mismo efecto que las tarjetas: al pasar el ratón el logo se levanta, crece con un rebote,
// le sale un resplandor azul y un brillo lo cruza (recortado con la forma de las letras).
// Al abrir el menú, además, el logo aparece enfocándose.
// Logo de Firztnet: la tuerca de oro animada (public/logo-firztnet-animado.svg) y la marca al lado
function LogoAnimado() {
  const [encima, setEncima] = useState(false);
  return (
    <div
      className="fn-logo-entrada"
      onMouseEnter={() => setEncima(true)}
      onMouseLeave={() => setEncima(false)}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0", width: "100%", maxWidth: 220, margin: "0 auto" }}
    >
      <img
        src="/logo-firztnet-animado.svg" alt="" width={54} height={54}
        style={{
          flex: "none", borderRadius: 16, display: "block",
          transform: encima ? "translateY(-3px) scale(1.07) rotate(-3deg)" : "none",
          filter: encima ? "drop-shadow(0 10px 16px rgba(217,164,65,0.55))" : "drop-shadow(0 4px 10px rgba(0,0,0,0.25))",
          transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.35s ease",
        }}
      />
      <div style={{ textAlign: "left", lineHeight: 1 }}>
        <div style={{ fontFamily: "Sora, Inter, sans-serif", fontWeight: 800, fontSize: 23, letterSpacing: "-0.02em", color: COLORS.text }}>
          Firzt<span style={{ color: "#D4A03A" }}>net</span>
        </div>
        <div style={{ marginTop: 5, fontSize: 10.5, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C8902E" }}>Reparaciones</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent, trend, destacada, onClick, activa, alta, tamValor, clase }) {
  const [hover, setHover] = useState(false);
  if (destacada) {
    return (
      <div
        className={clase}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: COLORS.surface, border: `2px solid ${accent}`, borderRadius: 14, padding: alta ? "14px 16px" : "16px 18px", flex: 1, minWidth: 150,
          position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : "default",
          ...(alta ? { minHeight: 104, display: "flex", flexDirection: "column", justifyContent: "space-between" } : {}),
          boxShadow: activa ? `0 0 0 3px ${accent}40` : hover ? `0 6px 16px -4px ${accent}60` : "none",
          transform: hover ? "translateY(-2px)" : "translateY(0)",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
      >
        <span style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>{label}</span>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: tamValor ?? (alta ? 32 : 30), color: COLORS.text, marginTop: alta ? 4 : 6, lineHeight: alta ? 1.1 : undefined, fontWeight: 700 }}>{value}</div>
          {sub && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: alta ? 2 : 4, lineHeight: alta ? 1.25 : undefined, fontSize: 11.5, color: trend === "up" ? COLORS.green : trend === "down" ? COLORS.rust : COLORS.textDim }}>
              {trend === "up" && <ArrowUpRight size={12} />}
              {trend === "down" && <ArrowDownRight size={12} />}
              {sub}
            </div>
          )}
        </div>
        <div style={{ position: "absolute", right: 12, bottom: 10, width: 44, height: 44, borderRadius: 12, background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={22} color={accent} />
        </div>
      </div>
    );
  }
  return (
    <div
      className={`fn-tarjeta-color${hover ? " fn-tarjeta-hover" : ""}${clase ? " " + clase : ""}`}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: accent, borderRadius: 14, padding: alta ? "14px 16px" : "16px 18px", flex: 1, minWidth: 150, position: "relative", overflow: "hidden",
        ...(alta ? { minHeight: 104, display: "flex", flexDirection: "column", justifyContent: "space-between" } : {}),
        // Efecto al pasar el ratón: la tarjeta se levanta, crece un poco, su sombra de color
        // se hace grande y se ilumina; además un brillo la cruza (ver .fn-tarjeta-color en los estilos).
        backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 55%, rgba(0,0,0,0.10) 100%)",
        boxShadow: activa
          ? `0 0 0 3px #FFFFFF, 0 0 0 5px ${accent}, 0 ${hover ? "22px 40px" : "8px 20px"} -8px ${accent}${hover ? "CC" : "80"}`
          : hover ? `0 22px 40px -8px ${accent}CC, 0 0 0 1px rgba(255,255,255,0.35) inset` : `0 8px 20px -6px ${accent}80`,
        transform: hover ? "translateY(-7px) scale(1.035)" : "translateY(0) scale(1)",
        filter: hover ? "brightness(1.08) saturate(1.1)" : "none",
        transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease, filter 0.35s ease",
        zIndex: hover ? 2 : 1,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>{label}</span>
        {/* Icono de la tarjeta: más grande para que se vea bien */}
        <div className="fn-icono-tarjeta" style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.24)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 8, marginTop: -4 }}>
          <Icon size={23} color="#FFFFFF" strokeWidth={2.2} />
        </div>
      </div>
      <div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: tamValor ?? (alta ? 32 : 30), color: "#FFFFFF", marginTop: alta ? 4 : 8, lineHeight: alta ? 1.1 : undefined, fontWeight: 700 }}>{value}</div>
        {sub && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: alta ? 2 : 4, lineHeight: alta ? 1.25 : undefined, fontSize: 11.5, color: "rgba(255,255,255,0.9)" }}>
            {trend === "up" && <ArrowUpRight size={12} />}
            {trend === "down" && <ArrowDownRight size={12} />}
            {sub}
          </div>
        )}
      </div>
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

// onDatosCambiados: avisa al panel de que hay cobros/gastos/facturas nuevos, para que
// recargue las tarjetas (Balance de hoy, Este mes...) sin tener que recargar la página.
function TicketModal({ t, onClose, onEstadoActualizado, onDatosCambiados }) {
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
  // En un servicio in situ el concepto por defecto es "Servicio"; en el taller, "Reparación".
  const conceptoPorDefecto = t?.tipo_trabajo === "domicilio" ? "Servicio" : "Reparación";
  useEffect(() => { setConceptoCobro(conceptoPorDefecto); }, [t?.id, conceptoPorDefecto]);
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
  // Servicio in situ / a domicilio: la ficha oculta lo que es solo de taller
  // (etiqueta QR, fotos de recepción, presupuesto, repuestos, "falta pieza"),
  // salvo que esa orden ya tenga algo apuntado ahí, para no esconder datos.
  const enSitu = t.tipo_trabajo === "domicilio";


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
        onDatosCambiados?.();
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
      setConceptoCobro(conceptoPorDefecto); // el siguiente cobro no hereda el concepto (p. ej. el suplemento)
      onDatosCambiados?.();
    } catch (e) {
      setErrorCobro(e.message);
    } finally {
      setGuardandoCobro(false);
    }
  }

  // Anular un cobro mal apuntado desde la propia ficha (igual que en Caja: no se borra,
  // se compensa con un apunte en negativo y queda el motivo).
  async function anularCobro(m) {
    const importe = Number(m.monto).toLocaleString("es-ES", { minimumFractionDigits: 2 });
    const motivo = window.prompt(`Vas a ANULAR el cobro "${m.concepto || "Cobro"}" de ${importe} €.\n\nNo se borra: se añade un apunte que lo compensa y queda constancia.\n\n¿Por qué lo anulas? (por ejemplo: "cobrado por error")`);
    if (motivo === null) return;
    if (!motivo.trim()) { setErrorCobro("Hay que indicar el motivo para anular un cobro."); return; }
    setErrorCobro("");
    try {
      const enviar = (confirmar) => fetch(`${API_BASE}/finanzas/${m.id}/anular`, { method: "POST", headers: cabecerasAuth({ "Content-Type": "application/json" }), body: JSON.stringify({ motivo, confirmar }) });
      let res = await enviar(false);
      manejar401(res);
      let datos = await res.json().catch(() => ({}));
      if (res.status === 409 && datos.requiere_confirmacion) {
        if (!window.confirm(datos.mensaje)) return;
        res = await enviar(true);
        manejar401(res);
        datos = await res.json().catch(() => ({}));
      }
      if (res.status === 404 || res.status === 405) { setErrorCobro("El servidor todavía no tiene la opción de anular. Sube primero el backend nuevo."); return; }
      if (!res.ok) { setErrorCobro(datos.mensaje || datos.error || "No se pudo anular el cobro."); return; }
      const data = await apiGet(`/reparaciones/${t.id}`);
      setMovimientos(data.movimientos || []);
      onDatosCambiados?.();
    } catch (e) {
      setErrorCobro(`No se pudo anular: ${e.message}`);
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
      setConceptoCobro(conceptoPorDefecto);
      onDatosCambiados?.();
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

  async function avanzar(nuevoEstado, opciones) {
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
      const body = nuevoEstado === "no_reparable" ? { estado: nuevoEstado, motivo } : { estado: nuevoEstado, ...opciones };
      const actualizado = await apiPatch(`/reparaciones/${t.id}/estado`, body);
      onEstadoActualizado(actualizado);
      setAvisosPendientes(actualizado.avisos || []);
    } catch (e) {
      if (nuevoEstado === "entregado" && e.status === 409 && e.data?.error === "pago_parcial") {
        const continuar = window.confirm(e.data.mensaje);
        if (continuar) {
          await avanzar("entregado", { confirmar_pago_parcial: true });
        }
        return;
      }
      setError(e.data?.mensaje || e.message);
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
          <Row label={enSitu ? "Servicio" : "Equipo"} value={t.equipo} />
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
          {(!enSitu || t.problema_reportado) && <Row label={enSitu ? "Qué pide el cliente" : "Problema reportado"} value={t.problema_reportado || "—"} />}
          <Row label={enSitu ? "Fecha de alta" : "Fecha recepción"} value={fechaLarga(t.fecha_recepcion)} />
          {!enSitu && (
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
          )}
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
              <span style={{ fontSize: 13, color: COLORS.textDim }}>{enSitu ? "Fecha de la visita" : "Fecha estimada de entrega"}</span>
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
          <div style={{ marginTop: 10, background: COLORS.tintAmbar, border: "1px solid #FDE68A", borderRadius: 9, padding: 12 }}>
            <div style={{ fontSize: 11.5, color: COLORS.statusAmber, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
              <Wrench size={12} /> Antes de salir, ¿llevas esto?
            </div>
            <div style={{ fontSize: 12, color: COLORS.tintAmbarTx, lineHeight: 1.6 }}>
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
              {!enSitu && (
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
              )}
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

        {!esFinal && (!enSitu || t.presupuesto_importe != null) && (
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
                `Hola ${t.cliente?.nombre?.split(" ")[0] || ""}, ya tenemos el presupuesto de tu ${t.equipo}. Revísalo y fírmalo aquí: ${PANEL_URL}/seguimiento?token=${t.token_seguimiento}`
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

        {(!enSitu || fotos.length > 0) && (
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
                  <FotoConSesion fotoId={f.id} />
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
        )}

        {t.estado_actual !== "no_reparable" && (!enSitu || repuestosUsados.length > 0) && (
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

          {!cargandoCobros && movimientos.filter((m) => m.tipo === "ingreso" && !m.anulado && !m.anula_a_id).length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {/* Los cobros anulados (y su apunte de corrección) no se listan aquí; se ven en Caja. */}
              {movimientos.filter((m) => m.tipo === "ingreso" && !m.anulado && !m.anula_a_id).map((m) => (
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
                  <button
                    type="button"
                    onClick={() => anularCobro(m)}
                    title="Anular este cobro (queda constancia del motivo)"
                    style={{ background: "none", border: "none", color: COLORS.rust, fontSize: 11, cursor: "pointer", padding: 0, flexShrink: 0 }}
                  >
                    Anular
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
                setConceptoCobro(conceptoPorDefecto);
                onDatosCambiados?.();
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
            <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>{enSitu ? "Avanzar servicio" : "Avanzar reparación"}</div>
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
              <div key={i} style={{ background: COLORS.tintVerde, border: "1px solid #86EFAC", borderRadius: 10, padding: 12 }}>
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
      apiGet(`/clientes?q=${encodeURIComponent(form.nombreCliente)}&incluir_contactos=true`).then(setSugerencias).catch(() => {});
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
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 8, marginTop: 2, zIndex: 5, boxShadow: "0 6px 16px rgba(0,0,0,0.1)", maxHeight: 160, overflowY: "auto" }}>
              {sugerencias.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => elegirCliente(c)}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 11px", background: "none", border: "none", cursor: "pointer", fontSize: 12.5, borderBottom: `1px solid ${COLORS.line}` }}
                >
                  <div style={{ fontWeight: 600, color: COLORS.text }}>{c.nombre}</div>
                  <div style={{ fontSize: 11, color: COLORS.textDim }}>{c.es_contacto ? "Contacto web" : c.codigo}{c.telefono ? ` · ${c.telefono}` : ""}</div>
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
          <div style={{ marginTop: 8, background: COLORS.tintAmbar, border: "1px solid #FDE68A", borderRadius: 8, padding: 10 }}>
            {alertaCliente.map((texto, i) => (
              <div key={i} style={{ fontSize: 11.5, color: COLORS.tintAmbarTx, display: "flex", gap: 6, marginBottom: i === alertaCliente.length - 1 ? 0 : 4 }}>
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
          <div style={{ fontSize: 11.5, background: COLORS.tintAzul, border: "1px solid #BFDBFE", borderRadius: 8, padding: 10, marginBottom: 4 }}>
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
// Negocios a los que puede pertenecer un cliente (un mismo cliente puede ser de los dos).
const NEGOCIOS_CLIENTE = [
  { key: "firztnet", nombre: "Firztnet", color: COLORS.amber },
  { key: "firztweb", nombre: "Firztweb", color: COLORS.violet },
];

function InsigniasNegocio({ negocios }) {
  const lista = negocios && negocios.length ? negocios : ["firztnet"];
  return (
    <>
      {NEGOCIOS_CLIENTE.filter((n) => lista.includes(n.key)).map((n) => (
        <span key={n.key} style={{ fontSize: 9.5, fontWeight: 700, color: n.color, border: `1px solid ${n.color}`, borderRadius: 999, padding: "2px 7px", whiteSpace: "nowrap" }}>
          {n.nombre}
        </span>
      ))}
    </>
  );
}

// Un cliente "eliminado" es el que ejerció el derecho al olvido (RGPD): sus datos personales
// se borraron y su nombre pasó a ser "Cliente eliminado (RGPD #...)".
function esClienteEliminado(c) {
  return (c?.nombre || "").startsWith("Cliente eliminado (RGPD");
}

function ClientesView() {
  const [clientes, setClientes] = useState([]);
  const [query, setQuery] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [formEdicion, setFormEdicion] = useState({ telefono: "", email: "", nif: "", negocios: ["firztnet"] });
  const [filtroNegocio, setFiltroNegocio] = useState(""); // "", "firztnet" o "firztweb"
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [borrandoRgpd, setBorrandoRgpd] = useState(false);
  const [resultadoRgpd, setResultadoRgpd] = useState(null);
  const [seccion, setSeccion] = useState("activos"); // "activos" o "eliminados"

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
      setSeleccionado(actualizado);
      setSeccion("eliminados"); // el cliente pasa a la sección de eliminados: se la enseñamos
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
      setFormEdicion({ telefono: data.telefono || "", email: data.email || "", nif: data.nif || "", negocios: data.negocios || ["firztnet"] });
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
        body: JSON.stringify({ telefono: formEdicion.telefono, email: formEdicion.email, nif: formEdicion.nif, negocios: formEdicion.negocios }),
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

  const delNegocio = (cliente, key) => (cliente.negocios || ["firztnet"]).includes(key);
  // Los activos y los eliminados (RGPD) van en secciones separadas.
  const activos = clientes.filter((cl) => !esClienteEliminado(cl));
  const eliminados = clientes.filter(esClienteEliminado);
  const clientesVisibles = filtroNegocio ? activos.filter((cl) => delNegocio(cl, filtroNegocio)) : activos;

  function cambiarSeccion(nueva) {
    if (nueva === seccion) return;
    setSeccion(nueva);
    setSeleccionado(null);
    setDetalle(null);
    setEditando(false);
    setResultadoRgpd(null);
  }

  // En la ficha, un cliente no puede quedarse sin ningún negocio: la última etiqueta no se puede quitar.
  function alternarNegocio(key) {
    setFormEdicion((f) => {
      const actual = f.negocios || ["firztnet"];
      const nuevo = actual.includes(key) ? actual.filter((k) => k !== key) : [...actual, key];
      return nuevo.length ? { ...f, negocios: nuevo } : f;
    });
  }

  return (
    <div className="fn-content-flex" style={{ display: "flex", gap: 20 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="fn-search" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "8px 12px", maxWidth: 320 }}>
          <Search size={14} color={COLORS.textDim} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente por nombre..." style={{ background: "none", border: "none", outline: "none", color: COLORS.text, fontSize: 13, width: "100%" }} />
        </div>

        {/* Dos secciones: clientes activos y clientes eliminados por el derecho al olvido (RGPD) */}
        <div role="tablist" style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: 12, background: COLORS.surface, border: `1px solid ${COLORS.line}`, marginBottom: 14 }}>
          {[
            { key: "activos", texto: "Clientes activos", cuantos: activos.length, icono: Users, color: COLORS.amber },
            { key: "eliminados", texto: "Eliminados (RGPD)", cuantos: eliminados.length, icono: UserX, color: COLORS.slate },
          ].map((op) => {
            const activo = seccion === op.key;
            const Icono = op.icono;
            return (
              <button
                key={op.key}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => cambiarSeccion(op.key)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: activo ? op.color : "transparent", color: activo ? "#FFFFFF" : COLORS.textDim, transition: "background-color 0.2s ease" }}
              >
                <Icono size={15} /> {op.texto}
                <span style={{ fontSize: 11.5, fontWeight: 700, padding: "1px 8px", borderRadius: 999, background: activo ? "rgba(255,255,255,0.25)" : COLORS.surfaceRaised, color: activo ? "#FFFFFF" : COLORS.textDim }}>{op.cuantos}</span>
              </button>
            );
          })}
        </div>

        {seccion === "activos" && (
        <>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {[{ key: "", nombre: "Todos", color: COLORS.slate, cuantos: activos.length }, ...NEGOCIOS_CLIENTE.map((n) => ({ ...n, cuantos: activos.filter((cl) => delNegocio(cl, n.key)).length }))].map((op) => {
            const activo = filtroNegocio === op.key;
            return (
              <button
                key={op.key || "todos"}
                type="button"
                aria-pressed={activo}
                onClick={() => setFiltroNegocio(op.key)}
                style={{ fontSize: 12, fontWeight: 600, padding: "6px 13px", borderRadius: 999, cursor: "pointer", border: `1px solid ${activo ? op.color : COLORS.line}`, background: activo ? op.color : COLORS.surface, color: activo ? "#FFFFFF" : COLORS.textDim }}
              >
                {op.nombre} ({op.cuantos})
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cargando && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando clientes...</div>}
          {!cargando && activos.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>{query ? "Ningún cliente activo coincide con la búsqueda." : "No hay clientes todavía."}</div>}
          {!cargando && activos.length > 0 && clientesVisibles.length === 0 && (
            <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Ningún cliente de {NEGOCIOS_CLIENTE.find((n) => n.key === filtroNegocio)?.nombre} todavía.</div>
          )}
          {clientesVisibles.map((c) => (
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
                  <InsigniasNegocio negocios={c.negocios} />
                </div>
                <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>{c.telefono || "Sin teléfono"}{c.email ? ` · ${c.email}` : ""}</div>
              </div>
              <ChevronRight size={16} color={COLORS.textDim} />
            </button>
          ))}
        </div>
        </>
        )}

        {seccion === "eliminados" && (
          <div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12.5, color: COLORS.text, lineHeight: 1.5, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${COLORS.slate}`, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
              <ShieldCheck size={18} color={COLORS.slate} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                Clientes que ejercieron el <strong>derecho al olvido</strong>. Sus datos personales ya no existen. Se conservan solo sus <strong>facturas</strong> y el <strong>historial de reparaciones</strong>, por obligación fiscal. No cuentan como clientes en la tarjeta del panel.
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cargando && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>}
              {!cargando && eliminados.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>No hay ningún cliente eliminado.</div>}
              {eliminados.map((c) => (
                <button
                  key={c.id}
                  onClick={() => verDetalle(c)}
                  style={{
                    background: seleccionado?.id === c.id ? COLORS.surfaceRaised : "#F8FAFC",
                    border: `1px dashed ${seleccionado?.id === c.id ? COLORS.slate : "#CBD5E1"}`,
                    borderRadius: 10, padding: "12px 14px", textAlign: "left", cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.surfaceRaised, color: COLORS.textDim }}>
                      <UserX size={15} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.textDim }}>{c.codigo}</span>
                        <span style={{ fontWeight: 600, fontSize: 13.5, color: COLORS.textDim }}>{c.nombre}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: COLORS.textDim, marginTop: 2 }}>Datos personales borrados</div>
                    </div>
                  </div>
                  <ChevronRight size={16} color={COLORS.textDim} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fn-side-panel" style={{ width: 300, flexShrink: 0 }}>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 18, minHeight: 200 }}>
          {!seleccionado && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Selecciona un cliente para ver su historial.</div>}
          {seleccionado && !detalle && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>}
          {detalle && !detalle.error && (
            <>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.amber }}>{detalle.codigo}</div>
              <div style={{ fontFamily: "Oswald", fontSize: 16, color: COLORS.text, marginBottom: 4 }}>{detalle.nombre}</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                <InsigniasNegocio negocios={detalle.negocios} />
              </div>

              {!editando ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: COLORS.textDim }}>{detalle.telefono || "Sin teléfono"}{detalle.email ? ` · ${detalle.email}` : " · Sin email"}{detalle.nif ? ` · NIF ${detalle.nif}` : ""}</div>
                  {!esClienteEliminado(detalle) && (
                    <button onClick={() => setEditando(true)} style={{ background: "none", border: "none", color: COLORS.amber, fontSize: 11.5, cursor: "pointer", padding: 0 }}>Editar</button>
                  )}
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
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11.5, color: COLORS.textDim }}>Negocio:</span>
                    {NEGOCIOS_CLIENTE.map((n) => {
                      const activo = (formEdicion.negocios || []).includes(n.key);
                      return (
                        <button
                          key={n.key}
                          type="button"
                          aria-pressed={activo}
                          onClick={() => alternarNegocio(n.key)}
                          style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 11px", borderRadius: 999, cursor: "pointer", border: `1px solid ${activo ? n.color : COLORS.line}`, background: activo ? n.color : COLORS.surface, color: activo ? "#FFFFFF" : COLORS.textDim }}
                        >
                          {n.nombre}
                        </button>
                      );
                    })}
                  </div>
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
                    <div style={{ background: COLORS.tintRojo, border: "1px solid #FECACA", borderRadius: 9, padding: 10, display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <TriangleAlert size={14} color={COLORS.rust} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontSize: 12, color: COLORS.tintRojoTx }}>
                        <strong>{detalle.resumen.sin_cobrar.length}</strong> reparación{detalle.resumen.sin_cobrar.length === 1 ? "" : "es"} entregada{detalle.resumen.sin_cobrar.length === 1 ? "" : "s"} sin cobrar: {detalle.resumen.sin_cobrar.map((r) => `#${r.numero_orden}`).join(", ")}
                      </div>
                    </div>
                  )}
                  {detalle.resumen.en_garantia?.length > 0 && (
                    <div style={{ background: COLORS.tintVerde, border: "1px solid #86EFAC", borderRadius: 9, padding: 10, display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <ShieldCheck size={14} color={COLORS.green} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontSize: 12, color: COLORS.tintVerdeTx }}>
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
// Webs que cuentan visitas
const SITIOS_WEB = [
  { key: "firztnet", label: "Firztnet", accent: COLORS.amber, icon: Wrench },
  { key: "firztweb", label: "Firztweb", accent: COLORS.violet, icon: LayoutGrid },
  { key: "afiliados", label: "TechCompara", accent: COLORS.green, icon: Package },
];

// El servidor guarda las fechas en UTC; aquí se pasan a la hora local de quien mira el panel.
function fechaUtc(iso) {
  if (!iso) return null;
  return new Date(/[zZ]$|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + "Z");
}

function tiempoRelativo(iso, ahora = Date.now()) {
  const d = fechaUtc(iso);
  if (!d) return "";
  const seg = Math.max(0, Math.floor((ahora - d.getTime()) / 1000));
  if (seg < 60) return "hace un momento";
  const min = Math.floor(seg / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const dias = Math.floor(h / 24);
  if (dias < 7) return `hace ${dias} día${dias === 1 ? "" : "s"}`;
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function fechaHoraLocal(iso) {
  const d = fechaUtc(iso);
  return d ? d.toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
}

// "https://www.google.com/" -> "google.com"
function dominioDe(referido) {
  if (!referido || referido === "directo") return "directo";
  try {
    return new URL(referido).hostname.replace(/^www\./, "");
  } catch (e) {
    return referido;
  }
}

// "boton_amazon_lenovo_ideapad" -> "amazon lenovo ideapad"
const limpiarEtiqueta = (etiqueta) => String(etiqueta || "").replace(/^(boton_|seccion_)/, "").replace(/_/g, " ");

// Texto del aviso de la campana (o null si no hay nada nuevo)
function textoNovedades(nov) {
  if (!nov) return null;
  const visitas = nov.total_visitas || 0;
  const clics = nov.total_clics || 0;
  if (visitas === 0 && clics === 0) return null;
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
  if (visitas === 0) return `${plural(clics, "clic nuevo", "clics nuevos")} en tus webs`;
  const porSitio = SITIOS_WEB.filter((s) => (nov.sitios?.[s.key]?.visitas || 0) > 0).map((s) => `${s.label} ${nov.sitios[s.key].visitas}`).join(" · ");
  return `${plural(visitas, "visita nueva", "visitas nuevas")} en tus webs${porSitio ? ` (${porSitio})` : ""}${clics > 0 ? ` · ${plural(clics, "clic", "clics")}` : ""}`;
}

function CampanitaNotificaciones({ onIrVista, onAbrirTicket }) {
  const [abierta, setAbierta] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const [repuestos, todasReparaciones, abandonados, garantias, solicitudes, novedadesWeb, contratosMant, ayudas, salud, clientesSis, informesMes, riesgo, cobros, copias, avisosFlota] = await Promise.all([
        apiGet("/repuestos").catch(() => []),
        apiGet("/reparaciones").catch(() => []),
        apiGet("/reportes/abandonados?dias=30").catch(() => []),
        apiGet("/reportes/garantias-activas").catch(() => []),
        apiGet("/solicitudes").catch(() => []),
        apiGet("/estadisticas/novedades").catch(() => null),
        apiGet("/mantenimientos/contratos").catch(() => []),
        apiGet("/central/ayuda").catch(() => []),
        apiGet("/central/salud").catch(() => null),
        apiGet("/central/clientes").catch(() => []),
        apiGet("/central/informes").catch(() => null),
        apiGet("/central/riesgo").catch(() => []),
        apiGet("/central/cobros").catch(() => []),
        apiGet("/central/copias").catch(() => []),
        apiGet("/flota/avisos").catch(() => []),
      ]);
      const nuevos = [];
      const stockBajo = repuestos.filter((r) => r.stock_bajo);
      if (stockBajo.length > 0) nuevos.push({ tipo: "stock", texto: `${stockBajo.length} repuesto(s) con stock bajo`, accion: () => onIrVista("inventario") });
      const rechazados = todasReparaciones.filter((r) => r.presupuesto_estado === "rechazado");
      rechazados.forEach((r) => nuevos.push({ tipo: "rechazo", texto: `Presupuesto rechazado — ${r.cliente?.nombre} #${r.numero_orden}`, accion: () => onAbrirTicket(r) }));
      abandonados.forEach((a) => nuevos.push({ tipo: "abandono", texto: `${a.cliente?.nombre}: equipo sin recoger hace ${a.dias_abandonado} días`, accion: () => { const rep = todasReparaciones.find((r) => r.id === a.id); if (rep) onAbrirTicket(rep); } }));
      const porCaducar = garantias.filter((g) => g.dias_restantes <= 15);
      if (porCaducar.length > 0) nuevos.push({ tipo: "garantia", texto: `${porCaducar.length} garantía(s) a punto de caducar`, accion: () => onIrVista("garantias") });
      // Firztnet Central (fase 2): sistemas caídos y candados HTTPS a punto de caducar
      (salud?.sistemas || []).filter((x) => x.activo && x.estado === "caido").forEach((x) => nuevos.push({
        tipo: "caido",
        texto: `🔴 ${x.nombre} NO RESPONDE desde ${new Date(x.caido_desde).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} · ${x.error || ""}`,
        accion: () => onIrVista("estado-sistemas"),
      }));
      // Alarma de silencio: sistemas que llevan rato sin enviar datos a Central
      (salud?.silencios || []).forEach((x) => nuevos.push({
        tipo: "silencio",
        texto: `🔕 ${x.nombre} lleva ${x.minutos >= 120 ? `${Math.round(x.minutos / 60)} h` : `${x.minutos} min`} sin enviar datos a Central`,
        accion: () => onIrVista("estado-sistemas"),
      }));
      (salud?.sistemas || []).filter((x) => x.activo && x.ssl_dias !== null && x.ssl_dias <= 14).forEach((x) => nuevos.push({
        tipo: "ssl", texto: `🔒 El candado HTTPS de ${x.nombre} caduca en ${x.ssl_dias} día(s)`, accion: () => onIrVista("estado-sistemas"),
      }));
      // Firztnet Central (fase 3): pruebas que terminan y renovaciones vencidas de tus clientes
      (clientesSis || []).filter((c) => c.estado === "prueba" && c.dias !== null && c.dias <= 3).forEach((c) => nuevos.push({
        tipo: "prueba", texto: `⏳ La prueba de ${c.nombre} termina ${c.dias === 0 ? "hoy" : c.dias === 1 ? "mañana" : `en ${c.dias} días`}`, accion: () => onIrVista("clientes-sistemas"),
      }));
      (clientesSis || []).filter((c) => c.estado === "prueba_vencida").forEach((c) => nuevos.push({
        tipo: "prueba", texto: `⌛ ${c.nombre}: la prueba ya terminó y no puede entrar`, accion: () => onIrVista("clientes-sistemas"),
      }));
      (clientesSis || []).filter((c) => c.estado === "activo" && c.renovacion_vencida).forEach((c) => nuevos.push({
        tipo: "prueba", texto: `💶 ${c.nombre}: renovación vencida`, accion: () => onIrVista("clientes-sistemas"),
      }));
      const riesgoAlto = (riesgo || []).filter((c) => c.nivel === "alto").length;
      if ((riesgo || []).length) nuevos.push({ tipo: "riesgo", texto: `⚠️ ${riesgo.length} cliente(s) en riesgo${riesgoAlto ? ` (${riesgoAlto} alto)` : ""}: llámales antes de que se vayan`, accion: () => onIrVista("riesgo") });
      const cobrosUrgentes = (cobros || []).filter((c) => c.vencida || c.dias <= 3);
      if (cobrosUrgentes.length) nuevos.push({ tipo: "cobro", texto: `💶 ${cobrosUrgentes.length} cuota(s) vencida(s) o que se renueva(n) en 3 días`, accion: () => onIrVista("cobros") });
      const copiasMal = (copias || []).filter((c) => c.estado === "atrasada");
      if (copiasMal.length) nuevos.push({ tipo: "copia", texto: `💾 Copias de seguridad atrasadas: ${copiasMal.map((c) => c.nombre).join(", ")}`, accion: () => onIrVista("estado-sistemas") });
      // Informes de visitas preparados que esperan tu revisión
      const informesPendientes = (informesMes?.informes || []).filter((i) => i.estado === "preparado").length;
      if (informesPendientes) nuevos.push({ tipo: "informe", texto: `📈 ${informesPendientes} informe(s) de visitas de ${nombreMes(informesMes.mes)} esperan tu revisión`, accion: () => onIrVista("informes-mensuales") });
      // Firztnet Central: cada petición de ayuda nueva de tus sistemas, una por una (las urgentes primero).
      // Quedan guardadas para siempre en «Ayuda a clientes»; aquí salen mientras estén sin atender.
      const ayudaNuevas = (ayudas || []).filter((p) => p.estado === "nueva")
        .sort((a, b) => Number(b.urgente) - Number(a.urgente) || String(b.fecha).localeCompare(String(a.fecha)));
      const NOMBRE_SIS = { hosteleria: "Hostelería", peluquerias: "Peluquerías", reformas: "Reformas", logistica: "Logística", reciclaje: "Reciclaje" };
      ayudaNuevas.slice(0, 8).forEach((p) => nuevos.push({
        tipo: "ayuda",
        texto: `${p.urgente ? "🚨 URGENTE · " : "🛟 "}${p.negocio} (${NOMBRE_SIS[p.sistema] || p.sistema}) pide ayuda: ${(p.mensaje || "").slice(0, 70)}${(p.mensaje || "").length > 70 ? "…" : ""} · ${p.referencia}`,
        accion: () => onIrVista("ayuda"),
      }));
      if (ayudaNuevas.length > 8) nuevos.push({ tipo: "ayuda", texto: `…y ${ayudaNuevas.length - 8} petición(es) de ayuda más`, accion: () => onIrVista("ayuda") });
      const solicitudesPendientes = solicitudes.filter((s) => !s.atendida);
      if (solicitudesPendientes.length > 0) nuevos.push({ tipo: "solicitud", texto: `${solicitudesPendientes.length} solicitud(es) de servicio sin atender`, accion: () => onIrVista("solicitudes") });
      // Mantenimientos: ya has ido este mes pero la cuota sigue sin cobrar
      (contratosMant || []).filter((c) => c.estado === "activo" && c.mes_actual && c.mes_actual.num_visitas > 0 && !c.mes_actual.cuota_pagada)
        .forEach((c) => nuevos.push({ tipo: "cuota", texto: `Cuota de ${c.mes_actual.nombre.split(" ")[0]} sin cobrar — ${c.cliente?.nombre}`, accion: () => onIrVista("mantenimientos") }));
      // Flota: ITV, seguro o mantenimiento vencidos o a 30 días / 1.000 km
      (avisosFlota || []).forEach((a) => nuevos.push({ tipo: "flota", texto: `${a.texto} — ${a.matricula}`, accion: () => onIrVista("flota") }));
      const textoVisitas = textoNovedades(novedadesWeb);
      if (textoVisitas) nuevos.push({ tipo: "visitas", texto: textoVisitas, accion: () => onIrVista("visitas-web") });
      const prioridad = { caido: 6, silencio: 6, ayuda: 5, copia: 4, cobro: 3, riesgo: 3, prueba: 2, ssl: 1 };
      nuevos.sort((a, b) => (prioridad[b.tipo] || 0) - (prioridad[a.tipo] || 0));
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
    window.addEventListener("fn:notificaciones-actualizar", cargar);
    return () => window.removeEventListener("fn:notificaciones-actualizar", cargar);
  }, [cargar]);

  useEffect(() => {
    function alClicarFuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierta(false);
    }
    document.addEventListener("mousedown", alClicarFuera);
    return () => document.removeEventListener("mousedown", alClicarFuera);
  }, []);

  // Cada aviso con su grupo, su icono y si es urgente; el texto sin el emoji del principio (ya lleva icono)
  const avisos = items.map((it) => {
    const estilo = ESTILO_AVISO[it.tipo] || ESTILO_AVISO.otro;
    const urgente = AVISOS_URGENTES.includes(it.tipo) || it.texto.startsWith("🚨");
    return { ...it, ...estilo, urgente, limpio: it.texto.replace(/^(🚨 URGENTE · |🔴|🔕|🔒|⏳|⌛|💶|⚠️|💾|📈|🛟)\s*/u, "") };
  });
  const urgentes = avisos.filter((a) => a.urgente).length;
  const revisar = avisos.length - urgentes;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className={`fz-avisos${avisos.length ? "" : " fz-avisos-ok"}`} onClick={() => setAbierta((v) => !v)} aria-expanded={abierta} title="Avisos">
        <span className="fz-avisos-camp">{avisos.length ? <BellRing size={16} /> : <Bell size={16} />}</span>
        <span className="fz-avisos-txt">
          <b>{avisos.length ? `${avisos.length} ${avisos.length === 1 ? "aviso" : "avisos"}` : "Sin avisos"}</b>
          <small>{avisos.length ? "pulsa para verlos" : "todo al día"}</small>
        </span>
        {avisos.length > 0 && <span className="fz-avisos-num">{avisos.length}</span>}
        {avisos.length > 0 && (
          <span className="fz-avisos-chips">
            {urgentes > 0 && <i style={{ "--c": COLORS.rust }}>{urgentes} {urgentes === 1 ? "urgente" : "urgentes"}</i>}
            {revisar > 0 && <i style={{ "--c": "#F59E0B" }}>{revisar} revisar</i>}
          </span>
        )}
      </button>
      {abierta && (
        <div className="fz-desp fz-desp-avisos" role="menu">
          <div className="fz-desp-cab"><b>Centro de avisos</b><span>{avisos.length ? `${urgentes} urgentes · ${revisar} a revisar` : ""}</span></div>
          {avisos.length === 0 ? (
            <div className="fz-desp-vacio">Todo al día — sin avisos pendientes.</div>
          ) : (
            ["Taller", "Mi empresa", "Firztnet"].map((grupo) => {
              const lista = avisos.filter((a) => a.grupo === grupo);
              if (!lista.length) return null;
              return (
                <div key={grupo}>
                  <div className="fz-desp-grupo">{grupo}</div>
                  {lista.map((a, k) => {
                    const Icono = a.icono;
                    return (
                      <button key={k} type="button" role="menuitem" className="fz-aviso" style={{ "--c": a.urgente ? COLORS.rust : a.color }} onClick={() => { a.accion(); setAbierta(false); }}>
                        <span className="fz-aviso-ic"><Icono size={15} /></span>
                        <span className="fz-aviso-tx">{a.limpio}{a.urgente && <em>Urgente</em>}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// Grupo, icono y color de cada tipo de aviso de la campana
const ESTILO_AVISO = {
  stock: { grupo: "Taller", icono: Package, color: "#F59E0B" },
  rechazo: { grupo: "Taller", icono: XCircle, color: "#F87171" },
  abandono: { grupo: "Taller", icono: Clock, color: "#F59E0B" },
  garantia: { grupo: "Taller", icono: ShieldCheck, color: "#3B82F6" },
  solicitud: { grupo: "Taller", icono: MessageSquare, color: "#3B82F6" },
  cuota: { grupo: "Taller", icono: CalendarCheck, color: "#F59E0B" },
  flota: { grupo: "Mi empresa", icono: Car, color: "#10B981" },
  caido: { grupo: "Firztnet", icono: Server, color: "#F87171" },
  silencio: { grupo: "Firztnet", icono: Activity, color: "#F87171" },
  ssl: { grupo: "Firztnet", icono: Lock, color: "#3B82F6" },
  prueba: { grupo: "Firztnet", icono: Clock, color: "#F59E0B" },
  riesgo: { grupo: "Firztnet", icono: TriangleAlert, color: "#F59E0B" },
  cobro: { grupo: "Firztnet", icono: Banknote, color: "#F59E0B" },
  copia: { grupo: "Firztnet", icono: RefreshCw, color: "#F87171" },
  informe: { grupo: "Firztnet", icono: FileBarChart, color: "#3B82F6" },
  ayuda: { grupo: "Firztnet", icono: LifeBuoy, color: "#8B5CF6" },
  visitas: { grupo: "Firztnet", icono: Globe, color: "#10B981" },
  otro: { grupo: "Taller", icono: Bell, color: "#94A3B8" },
};
// Lo que se cuenta como urgente: sistemas caídos, copias atrasadas, cobros y ayudas marcadas urgentes
const AVISOS_URGENTES = ["caido", "silencio", "copia", "cobro"];

// -------------------- Semáforo de tus sistemas y webs (lee el vigilante de Central) --------------------
function SemaforoSistemas({ onIrVista }) {
  const [salud, setSalud] = useState(null); // null = cargando; false = sin datos
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    let vivo = true;
    const cargar = () => apiGet("/central/salud").then((d) => { if (vivo) setSalud(d); }).catch(() => { if (vivo) setSalud(false); });
    cargar();
    const t = setInterval(cargar, 120000); // el vigilante comprueba cada 2 minutos
    return () => { vivo = false; clearInterval(t); };
  }, []);
  useEffect(() => {
    const fuera = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  const lista = ((salud && salud.sistemas) || []).filter((x) => x.activo);
  const caidos = lista.filter((x) => x.estado === "caido");
  const lentos = lista.filter((x) => x.estado === "lento");
  const callados = (salud && salud.silencios) || [];
  const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "");
  let color = "#94A3B8", texto = "Comprobando…", sub = "";
  if (salud === false) { texto = "Sin datos"; sub = "no se pudo consultar"; }
  else if (salud && !lista.length) { texto = "Sin vigilar"; sub = "añade sistemas"; }
  else if (caidos.length) { color = COLORS.rust; texto = caidos.length === 1 ? `${caidos[0].nombre} caído` : `${caidos.length} caídos`; sub = caidos[0].caido_desde ? `desde las ${hora(caidos[0].caido_desde)}` : ""; }
  else if (lentos.length || callados.length) {
    color = "#F59E0B"; texto = "Revisar";
    sub = [lentos.length && `${lentos.length} ${lentos.length === 1 ? "lento" : "lentos"}`, callados.length && `${callados.length} sin enviar datos`].filter(Boolean).join(" · ");
  }
  else if (lista.length) { color = "#10B981"; texto = "Todo en marcha"; sub = `${lista.length} sistemas`; }
  const ultima = lista.map((x) => x.ultima_comprobacion).filter(Boolean).sort().pop();
  const minutos = ultima ? Math.max(0, Math.round((Date.now() - new Date(ultima).getTime()) / 60000)) : null;
  const COLOR = { ok: "#10B981", lento: "#F59E0B", caido: COLORS.rust };
  const TEXTO = { ok: "Funciona", lento: "Lento", caido: "Caído", desconocido: "Sin comprobar" };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className="fz-semaforo" style={{ "--sc": color }} onClick={() => setAbierto((v) => !v)} aria-expanded={abierto} title="Estado de tus sistemas y webs">
        <i />
        <span className="fz-semaforo-txt">{texto}</span>
        {sub && <small>· {sub}</small>}
      </button>
      {abierto && (
        <div className="fz-desp fz-desp-semaforo">
          <div className="fz-desp-cab"><b>Tus sistemas y webs</b><span>{minutos === null ? "" : minutos === 0 ? "comprobado ahora" : `comprobado hace ${minutos} min`}</span></div>
          {!lista.length && <div className="fz-desp-vacio">{salud === false ? "No se ha podido consultar el vigilante de Central." : "Todavía no hay sistemas vigilados."}</div>}
          {lista.map((x) => (
            <div key={x.id} className="fz-sis" style={{ "--sc": COLOR[x.estado] || "#94A3B8" }} title={x.url}>
              <span className="fz-sis-p" />
              <b>{x.nombre}</b>
              {x.estado === "caido"
                ? <em className="fz-sis-error">{x.error || "No responde"}</em>
                : <span className="fz-sis-ms">{x.ms != null ? `${(x.ms / 1000).toFixed(2).replace(".", ",")} s` : "—"}</span>}
              <em>{TEXTO[x.estado] || x.estado}</em>
            </div>
          ))}
          {callados.length > 0 && (
            <>
              <div className="fz-desp-grupo">Sin enviar datos a Central</div>
              {callados.map((x) => (
                <div key={x.sistema} className="fz-sis" style={{ "--sc": "#F59E0B" }}>
                  <span className="fz-sis-p" />
                  <b>{x.nombre}</b>
                  <em>{x.minutos >= 120 ? `${Math.round(x.minutos / 60)} h` : `${x.minutos} min`} callado</em>
                </div>
              ))}
            </>
          )}
          <button type="button" className="fz-desp-pie" onClick={() => { onIrVista("estado-sistemas"); setAbierto(false); }}>Ver Estado de sistemas</button>
        </div>
      )}
    </div>
  );
}

// -------------------- Insignia de usuario (cabecera, global) --------------------
function InsigniaUsuario({ onCerrarSesion, onIrVista, tema, onTema }) {
  const [nombre] = useState(() => nombreUsuarioDelToken());
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const fuera = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);
  const inicial = (nombre || "?").charAt(0).toUpperCase();
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className="fz-usuario" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto} title="Tu cuenta">
        <span className="fz-ava">{inicial}</span>
        <span className="fz-usuario-txt"><b>{nombre}</b><small>Administrador</small></span>
        <ChevronDown size={15} className="fz-usuario-chev" />
      </button>
      {abierto && (
        <div className="fz-desp fz-desp-usuario" role="menu">
          <div className="fz-u-cab"><span className="fz-ava fz-ava-g">{inicial}</span><div><b>{nombre}</b><small>Administrador · Sede principal</small></div></div>
          <div className="fz-desp-sep" />
          {onIrVista && <button type="button" role="menuitem" className="fz-op" onClick={() => { onIrVista("ajustes"); setAbierto(false); }}><Settings size={16} /> Ajustes y manual de uso</button>}
          {onIrVista && <button type="button" role="menuitem" className="fz-op" onClick={() => { onIrVista("estado-sistemas"); setAbierto(false); }}><Activity size={16} /> Estado de sistemas</button>}
          {onTema && (
            <>
              <div className="fz-desp-grupo">Tema de la pantalla</div>
              <div className="fz-temas-mini">
                {TEMAS_INICIO.map((t) => (
                  <button key={t.key} type="button" title={`Tema ${t.nombre}`} aria-label={`Tema ${t.nombre}`} aria-pressed={tema === t.key} className={tema === t.key ? "on" : ""} style={{ background: t.muestra }} onClick={() => onTema(t.key)} />
                ))}
              </div>
            </>
          )}
          <div className="fz-desp-sep" />
          <button type="button" role="menuitem" className="fz-op fz-op-salir" onClick={onCerrarSesion}><LogOut size={16} /> Cerrar sesión</button>
        </div>
      )}
    </div>
  );
}

function AlertaStockBajo({ onIrInventario }) {
  const [stockBajo, setStockBajo] = useState([]);

  useEffect(() => {
    apiGet("/repuestos").then((lista) => setStockBajo(lista.filter((r) => r.stock_bajo))).catch(() => {});
  }, []);

  if (stockBajo.length === 0) return null;

  return (
    <button
      type="button"
      onClick={onIrInventario}
      style={{ background: COLORS.tintRojo, border: "1px solid #FECACA", borderRadius: 9, padding: 12, cursor: "pointer", textAlign: "left", width: "100%", marginBottom: 14 }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.tintRojoTx, display: "flex", alignItems: "center", gap: 6 }}>
        <Package size={14} /> {stockBajo.length} repuesto{stockBajo.length === 1 ? "" : "s"} con stock bajo: {stockBajo.map((r) => r.nombre).join(", ")}
      </div>
    </button>
  );
}

function PanelAlertas({ reparaciones, onAbrir, onIrInventario, onIrGarantias, ocultarStockBajo }) {
  const [stockBajo, setStockBajo] = useState([]);
  const [abandonados, setAbandonados] = useState([]);
  const [garantiasPorCaducar, setGarantiasPorCaducar] = useState([]);

  useEffect(() => {
    if (!ocultarStockBajo) apiGet("/repuestos").then((lista) => setStockBajo(lista.filter((r) => r.stock_bajo))).catch(() => {});
    apiGet("/reportes/abandonados?dias=30").then(setAbandonados).catch(() => {});
    apiGet("/reportes/garantias-activas").then((lista) => setGarantiasPorCaducar(lista.filter((g) => g.dias_restantes <= 15))).catch(() => {});
  }, [ocultarStockBajo]);

  const rechazados = reparaciones.filter((r) => r.presupuesto_estado === "rechazado");

  if (stockBajo.length === 0 && rechazados.length === 0 && abandonados.length === 0 && garantiasPorCaducar.length === 0) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10, alignItems: "start", marginBottom: 14 }}>
      {rechazados.length > 0 && (
        <div style={{ background: COLORS.tintRojo, border: "1px solid #FECACA", borderRadius: 9, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.tintRojoTx, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <TriangleAlert size={14} /> {rechazados.length} presupuesto{rechazados.length === 1 ? "" : "s"} rechazado{rechazados.length === 1 ? "" : "s"}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {rechazados.map((r) => (
              <button key={r.id} onClick={() => onAbrir(r)} style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 999, border: "1px solid #FECACA", background: COLORS.surface, color: COLORS.tintRojoTx, cursor: "pointer" }}>
                {r.cliente?.nombre} · #{r.numero_orden}
              </button>
            ))}
          </div>
        </div>
      )}
      {abandonados.length > 0 && (
        <div style={{ background: COLORS.tintAmbar, border: "1px solid #FDE68A", borderRadius: 9, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.tintAmbarTx, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Bell size={14} /> {abandonados.length} equipo{abandonados.length === 1 ? "" : "s"} listo{abandonados.length === 1 ? "" : "s"} sin recoger hace 30+ días
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {abandonados.map((a) => (
              <button
                key={a.id}
                onClick={() => { const rep = reparaciones.find((r) => r.id === a.id); if (rep) onAbrir(rep); }}
                style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 999, border: "1px solid #FDE68A", background: COLORS.surface, color: COLORS.tintAmbarTx, cursor: "pointer" }}
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
          style={{ background: COLORS.tintAzul, border: "1px solid #BFDBFE", borderRadius: 9, padding: 12, cursor: "pointer", textAlign: "left", width: "100%" }}
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
          style={{ background: COLORS.tintRojo, border: "1px solid #FECACA", borderRadius: 9, padding: 12, cursor: "pointer", textAlign: "left", width: "100%" }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.tintRojoTx, display: "flex", alignItems: "center", gap: 6 }}>
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
  const [mesExportar, setMesExportar] = useState(() => hoyLocalISO().slice(0, 7));
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
  const [errorCaja, setErrorCaja] = useState("");

  // Anular un movimiento mal apuntado: no se borra, se compensa con un apunte en negativo.
  async function anular(m) {
    const texto = `${m.tipo === "ingreso" ? "cobro" : "gasto"} de ${Number(m.monto).toLocaleString("es-ES", { minimumFractionDigits: 2 })} € (${m.concepto || "sin concepto"})`;
    const motivo = window.prompt(`Vas a ANULAR el ${texto}.\n\nNo se borra: se añade un apunte que lo compensa y queda constancia.\n\n¿Por qué lo anulas? (por ejemplo: "importe mal escrito")`);
    if (motivo === null) return;
    if (!motivo.trim()) { window.alert("Hay que indicar el motivo. No se ha anulado nada."); return; }
    setErrorCaja("");
    try {
      let res = await fetch(`${API_BASE}/finanzas/${m.id}/anular`, { method: "POST", headers: cabecerasAuth({ "Content-Type": "application/json" }), body: JSON.stringify({ motivo }) });
      manejar401(res);
      let datos = await res.json().catch(() => ({}));
      if (res.status === 409 && datos.requiere_confirmacion) {
        if (!window.confirm(datos.mensaje)) return;
        res = await fetch(`${API_BASE}/finanzas/${m.id}/anular`, { method: "POST", headers: cabecerasAuth({ "Content-Type": "application/json" }), body: JSON.stringify({ motivo, confirmar: true }) });
        manejar401(res);
        datos = await res.json().catch(() => ({}));
      }
      if (res.status === 404 || res.status === 405) { setErrorCaja("El servidor todavía no tiene la opción de anular. Sube primero el backend nuevo."); return; }
      if (!res.ok) { setErrorCaja(datos.mensaje || datos.error || "No se pudo anular."); return; }
      cargar();
      onMovimientoCreado?.();
    } catch (e) {
      setErrorCaja(`No se pudo anular: ${e.message}`);
    }
  }

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
      setErrorCaja("");
      await apiPost("/finanzas", { ...form, monto: parseFloat(form.monto) });
      setForm({ tipo: "gasto", concepto: "", monto: "", metodo_pago: "efectivo" });
      setMostrarForm(false);
      cargar();
      onMovimientoCreado?.();
    } catch (e) {
      setErrorCaja(e.message);
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

      {errorCaja && (
        <div style={{ background: `${COLORS.rust}12`, color: COLORS.rust, border: `1px solid ${COLORS.rust}40`, borderRadius: 10, padding: "10px 14px", fontSize: 12.5, marginBottom: 12 }}>{errorCaja}</div>
      )}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, overflow: "hidden" }}>
        {cargando && <div style={{ padding: 16, fontSize: 12.5, color: COLORS.textDim }}>Cargando movimientos...</div>}
        {!cargando && movimientos.length === 0 && <div style={{ padding: 16, fontSize: 12.5, color: COLORS.textDim }}>Sin movimientos registrados todavía.</div>}
        {movimientos.map((m, i) => {
          // Signo real en caja: un ingreso suma, un gasto resta; las anulaciones van al revés.
          const efecto = (m.tipo === "ingreso" ? 1 : -1) * Math.sign(Number(m.monto) || 0);
          const esCorreccion = !!m.anula_a_id;
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: i === 0 ? "none" : `1px solid ${COLORS.line}`, opacity: m.anulado ? 0.6 : 1 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 500, textDecoration: m.anulado ? "line-through" : "none" }}>{m.concepto || (m.tipo === "ingreso" ? "Ingreso" : "Gasto")}</div>
                <div style={{ fontSize: 11.5, color: COLORS.textDim }}>{fechaLarga(m.fecha)}{m.metodo_pago ? ` · ${m.metodo_pago}` : ""}</div>
                {(m.anulado || esCorreccion) && m.motivo_anulacion && (
                  <div style={{ fontSize: 11, color: COLORS.rust, marginTop: 2 }}>{m.anulado ? "Anulado" : "Corrección"}: {m.motivo_anulacion}</div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13.5, color: efecto >= 0 ? COLORS.green : COLORS.rust, textDecoration: m.anulado ? "line-through" : "none" }}>
                  {efecto >= 0 ? "+" : "−"}{Math.abs(Number(m.monto)).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                </div>
                {!m.anulado && !esCorreccion && (
                  <button type="button" onClick={() => anular(m)} title="Anular este movimiento (queda constancia)" style={{ border: `1px solid ${COLORS.line}`, background: COLORS.surface, color: COLORS.textDim, borderRadius: 7, padding: "4px 9px", fontSize: 11.5, cursor: "pointer" }}>
                    Anular
                  </button>
                )}
              </div>
            </div>
          );
        })}
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

// -------------------- Visitas web --------------------
// -------------------- Ventas (Firztweb / Afiliados) --------------------
function VentasView() {
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [filtroNegocio, setFiltroNegocio] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);

  const [negocio, setNegocio] = useState("firztweb");
  const [tipo, setTipo] = useState("web");
  const [clienteNombre, setClienteNombre] = useState("");
  const [producto, setProducto] = useState("");
  const [importeTotalVenta, setImporteTotalVenta] = useState("");
  const [porcentajeComision, setPorcentajeComision] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [importe, setImporte] = useState("");
  const [cobrado, setCobrado] = useState(true);
  const [enlaceNota, setEnlaceNota] = useState("");
  const [fecha, setFecha] = useState(() => hoyLocalISO());
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [avisoGuardado, setAvisoGuardado] = useState("");
  const esAfiliado = tipo === "afiliado";
  const comisionCalculada = esAfiliado && importeTotalVenta && porcentajeComision
    ? (parseFloat(importeTotalVenta) * parseFloat(porcentajeComision) / 100)
    : null;

  const cargar = useCallback(async () => {
    try {
      const [listaVentas, res] = await Promise.all([
        apiGet(`/ventas${filtroNegocio ? `?negocio=${filtroNegocio}` : ""}`),
        apiGet("/ventas/resumen"),
      ]);
      setVentas(listaVentas);
      setResumen(res);
    } catch (e) {
      setErrorCarga(e.message);
    } finally {
      setCargando(false);
    }
  }, [filtroNegocio]);

  useEffect(() => { cargar(); }, [cargar]);

  async function registrarVenta() {
    setErrorForm("");
    setAvisoGuardado("");

    let cuerpo = { negocio, tipo, descripcion, cobrado, enlace_nota: enlaceNota, fecha };

    if (esAfiliado) {
      if (!producto.trim()) { setErrorForm("Falta el producto"); return; }
      if (importeTotalVenta === "" || isNaN(parseFloat(importeTotalVenta)) || parseFloat(importeTotalVenta) < 0) { setErrorForm("El importe total de la venta no es válido"); return; }
      if (porcentajeComision === "" || isNaN(parseFloat(porcentajeComision)) || parseFloat(porcentajeComision) < 0 || parseFloat(porcentajeComision) > 100) { setErrorForm("El porcentaje de comisión debe estar entre 0 y 100"); return; }
      cuerpo = { ...cuerpo, producto, importe_total_venta: parseFloat(importeTotalVenta), porcentaje_comision: parseFloat(porcentajeComision), cliente_nombre: clienteNombre };
    } else {
      if (!clienteNombre.trim()) { setErrorForm("Falta el nombre del cliente"); return; }
      if (importe === "" || parseFloat(importe) < 0 || isNaN(parseFloat(importe))) { setErrorForm("El importe no es válido"); return; }
      cuerpo = { ...cuerpo, cliente_nombre: clienteNombre, importe: parseFloat(importe) };
    }

    setGuardando(true);
    try {
      await apiPost("/ventas", cuerpo);
      setClienteNombre(""); setDescripcion(""); setImporte(""); setEnlaceNota(""); setCobrado(true);
      setProducto(""); setImporteTotalVenta(""); setPorcentajeComision("");
      setMostrarForm(false);
      setAvisoGuardado("✓ Venta guardada correctamente");
      setTimeout(() => setAvisoGuardado(""), 4000);
      cargar();
    } catch (e) {
      setErrorForm(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function alternarCobrado(venta) {
    try {
      await apiPatch(`/ventas/${venta.id}`, { cobrado: !venta.cobrado });
      cargar();
    } catch (e) { /* silencioso */ }
  }

  async function borrar(venta) {
    if (!window.confirm(`¿Borrar la venta a "${venta.cliente_nombre}"? No se puede deshacer.`)) return;
    try {
      const res = await fetch(`${API_BASE}/ventas/${venta.id}`, { method: "DELETE", headers: cabecerasAuth() });
      manejar401(res);
      cargar();
    } catch (e) { /* silencioso */ }
  }

  if (cargando) return <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>;
  if (errorCarga) return <div style={{ fontSize: 12.5, color: COLORS.rust }}>No se pudo cargar: {errorCarga}</div>;

  const NEGOCIOS = [
    { key: "firztnet", label: "Firztnet", accent: COLORS.amber },
    { key: "firztweb", label: "Firztweb", accent: COLORS.violet },
    { key: "afiliados", label: "Afiliados", accent: COLORS.green },
  ];
  const TIPOS = [
    { key: "web", label: "Web" },
    { key: "app", label: "App" },
    { key: "sistema", label: "Sistema a medida" },
    { key: "afiliado", label: "Producto afiliado" },
    { key: "otro", label: "Otro" },
  ];

  const inputStyle = { width: "100%", fontSize: 12.5, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Ventas de tus otros negocios — webs, apps, sistemas a medida, y productos de afiliados.</div>
        <button onClick={() => setMostrarForm((v) => !v)} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "8px 14px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Registrar venta
        </button>
      </div>

      {avisoGuardado && (
        <div style={{ background: `${COLORS.green}18`, color: COLORS.green, fontSize: 12.5, fontWeight: 600, borderRadius: 8, padding: "9px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
          <CheckCircle2 size={15} /> {avisoGuardado}
        </div>
      )}

      {mostrarForm && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <label style={{ fontSize: 11.5, color: COLORS.textDim }}>Negocio
              <select value={negocio} onChange={(e) => setNegocio(e.target.value)} style={{ ...inputStyle, marginTop: 4 }}>
                {NEGOCIOS.map((n) => <option key={n.key} value={n.key}>{n.label}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 11.5, color: COLORS.textDim }}>Tipo
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ ...inputStyle, marginTop: 4 }}>
                {TIPOS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            {esAfiliado ? (
              <>
                <label style={{ fontSize: 11.5, color: COLORS.textDim }}>Producto
                  <input value={producto} onChange={(e) => setProducto(e.target.value)} placeholder="Ej. Portátil HP Pavilion" style={{ ...inputStyle, marginTop: 4 }} />
                </label>
                <label style={{ fontSize: 11.5, color: COLORS.textDim }}>Importe total de la venta (€)
                  <input value={importeTotalVenta} onChange={(e) => setImporteTotalVenta(e.target.value)} type="number" placeholder="0.00" style={{ ...inputStyle, marginTop: 4 }} />
                </label>
              </>
            ) : (
              <>
                <label style={{ fontSize: 11.5, color: COLORS.textDim }}>Cliente
                  <input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Nombre del cliente" style={{ ...inputStyle, marginTop: 4 }} />
                </label>
                <label style={{ fontSize: 11.5, color: COLORS.textDim }}>Importe (€)
                  <input value={importe} onChange={(e) => setImporte(e.target.value)} type="number" placeholder="0.00" style={{ ...inputStyle, marginTop: 4 }} />
                </label>
              </>
            )}
          </div>
          {esAfiliado && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <label style={{ fontSize: 11.5, color: COLORS.textDim }}>% de comisión
                <input value={porcentajeComision} onChange={(e) => setPorcentajeComision(e.target.value)} type="number" step="0.1" placeholder="Ej. 2.5" style={{ ...inputStyle, marginTop: 4 }} />
              </label>
              <div style={{ fontSize: 11.5, color: COLORS.textDim }}>Comisión calculada
                <div style={{ marginTop: 4, padding: "8px 10px", borderRadius: 7, background: COLORS.surfaceRaised, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, color: comisionCalculada !== null ? COLORS.green : COLORS.textDim }}>
                  {comisionCalculada !== null ? `${comisionCalculada.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €` : "— completa importe y %"}
                </div>
              </div>
            </div>
          )}
          <label style={{ fontSize: 11.5, color: COLORS.textDim, display: "block", marginBottom: 10 }}>Descripción <span style={{ fontWeight: 400 }}>(opcional)</span>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Qué le vendiste" style={{ ...inputStyle, marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 11.5, color: COLORS.textDim, display: "block", marginBottom: 10 }}>Enlace o nota <span style={{ fontWeight: 400 }}>(opcional — ej. el enlace de afiliado)</span>
            <input value={enlaceNota} onChange={(e) => setEnlaceNota(e.target.value)} placeholder="https://... o cualquier nota" style={{ ...inputStyle, marginTop: 4 }} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <label style={{ fontSize: 11.5, color: COLORS.textDim }}>Fecha
              <input value={fecha} onChange={(e) => setFecha(e.target.value)} type="date" style={{ ...inputStyle, marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 12.5, color: COLORS.text, display: "flex", alignItems: "center", gap: 7, marginTop: 18 }}>
              <input type="checkbox" checked={cobrado} onChange={(e) => setCobrado(e.target.checked)} style={{ width: 15, height: 15 }} />
              Ya está cobrado
            </label>
          </div>
          {errorForm && <div style={{ fontSize: 12, color: COLORS.rust, marginBottom: 10 }}>{errorForm}</div>}
          <button disabled={guardando} onClick={registrarVenta} style={{ ...btnStyle(COLORS.green, "#FFFFFF"), padding: "9px 16px", fontSize: 12.5 }}>
            {guardando ? "Guardando..." : "Guardar venta"}
          </button>
        </div>
      )}

      {resumen && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          {NEGOCIOS.map((n) => (
            <div key={n.key} style={{ flex: "1 1 200px", background: COLORS.surface, borderTop: `1px solid ${COLORS.line}`, borderRight: `1px solid ${COLORS.line}`, borderBottom: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${n.accent}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>{n.label}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 21, fontWeight: 700, color: COLORS.text }}>{resumen[n.key]?.total.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</div>
              <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>
                {resumen[n.key]?.num_ventas} venta{resumen[n.key]?.num_ventas === 1 ? "" : "s"} · <span style={{ color: COLORS.green }}>{resumen[n.key]?.cobrado.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€ cobrado</span>
                {resumen[n.key]?.pendiente > 0 && <> · <span style={{ color: COLORS.statusAmber }}>{resumen[n.key]?.pendiente.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€ pendiente</span></>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => setFiltroNegocio("")} style={{ fontSize: 11.5, padding: "5px 12px", borderRadius: 999, border: `1px solid ${filtroNegocio === "" ? COLORS.amber : COLORS.line}`, background: filtroNegocio === "" ? COLORS.amber : "#FFFFFF", color: filtroNegocio === "" ? "#FFFFFF" : COLORS.textDim, cursor: "pointer" }}>Todas</button>
        {NEGOCIOS.map((n) => (
          <button key={n.key} onClick={() => setFiltroNegocio(n.key)} style={{ fontSize: 11.5, padding: "5px 12px", borderRadius: 999, border: `1px solid ${filtroNegocio === n.key ? n.accent : COLORS.line}`, background: filtroNegocio === n.key ? n.accent : "#FFFFFF", color: filtroNegocio === n.key ? "#FFFFFF" : COLORS.textDim, cursor: "pointer" }}>{n.label}</button>
        ))}
      </div>

      {ventas.length === 0 ? (
        <div style={{ fontSize: 12.5, color: COLORS.textDim, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 16 }}>Sin ventas registradas todavía.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ventas.map((v) => {
            const negocioInfo = NEGOCIOS.find((n) => n.key === v.negocio) || NEGOCIOS[1];
            const tipoInfo = TIPOS.find((t) => t.key === v.tipo);
            return (
              <div key={v.id} style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.line}`, borderRight: `1px solid ${COLORS.line}`, borderBottom: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${negocioInfo.accent}`, borderRadius: 10, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.text }}>{v.tipo === "afiliado" ? v.producto : v.cliente_nombre}</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: negocioInfo.accent, border: `1px solid ${negocioInfo.accent}`, borderRadius: 999, padding: "2px 7px" }}>{negocioInfo.label}</span>
                    <span style={{ fontSize: 9.5, color: COLORS.textDim, background: COLORS.surfaceRaised, borderRadius: 999, padding: "2px 7px" }}>{tipoInfo?.label || v.tipo}</span>
                  </div>
                  {v.tipo === "afiliado" && v.importe_total_venta != null && (
                    <div style={{ fontSize: 11.5, color: COLORS.textDim, marginTop: 3 }}>
                      Venta de {v.importe_total_venta.toLocaleString("es-ES", { minimumFractionDigits: 2 })} € × {v.porcentaje_comision}% comisión
                    </div>
                  )}
                  {v.descripcion && <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 4 }}>{v.descripcion}</div>}
                  {v.enlace_nota && <div style={{ fontSize: 11, color: COLORS.statusBlue, marginTop: 2, wordBreak: "break-all" }}>{v.enlace_nota}</div>}
                  <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>{fechaLarga(v.fecha)}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>{v.importe.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button onClick={() => alternarCobrado(v)} style={{ fontSize: 10.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, border: "none", cursor: "pointer", background: v.cobrado ? `${COLORS.green}18` : `${COLORS.statusAmber}18`, color: v.cobrado ? COLORS.green : COLORS.statusAmber }}>
                      {v.cobrado ? "✓ Cobrado" : "Pendiente"}
                    </button>
                    <button onClick={() => borrar(v)} style={{ background: "none", border: "none", color: COLORS.textDim, cursor: "pointer", padding: 4, display: "flex" }} title="Borrar">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Une dos listas de actividad sin repetir elementos, de más nuevo a más antiguo
function mezclarActividad(nuevos, previos) {
  const mapa = new Map();
  [...nuevos, ...previos].forEach((x) => mapa.set(`${x.clase}-${x.id}`, x));
  return [...mapa.values()].sort((a, b) => fechaUtc(b.fecha) - fechaUtc(a.fecha) || b.id - a.id);
}

const TIPOS_ACTIVIDAD = {
  visita: { texto: "Visita", color: COLORS.statusBlue },
  clic: { texto: "Clic", color: COLORS.pink },
  seccion_vista: { texto: "Sección", color: COLORS.teal },
};

// Detalle de cada visita, clic y sección que ven tus webs, con lo nuevo resaltado.
function ActividadReciente({ desde }) {
  const [filtroSitio, setFiltroSitio] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [items, setItems] = useState([]);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState("");
  const [ahora, setAhora] = useState(Date.now());
  const [version, setVersion] = useState(0); // al pulsar "Actualizar"

  const consultar = useCallback(
    (extra = {}) => {
      const p = new URLSearchParams({ limite: "40", ...extra });
      if (filtroSitio) p.set("sitio", filtroSitio);
      if (filtroTipo) p.set("tipo", filtroTipo);
      return apiGet(`/estadisticas/recientes?${p.toString()}`);
    },
    [filtroSitio, filtroTipo]
  );

  // Primera página y, después, refresco automático cada 30 s (sin perder lo que ya hayas desplegado más abajo)
  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setItems([]);
    async function cargar(primera) {
      try {
        const r = await consultar();
        if (cancelado) return;
        setError("");
        setItems((prev) => (primera ? r.items : mezclarActividad(r.items, prev)));
        if (primera) setHayMas(r.hay_mas);
      } catch (e) {
        if (!cancelado) setError(e.message);
      } finally {
        if (!cancelado && primera) setCargando(false);
      }
    }
    cargar(true);
    const t = setInterval(() => { cargar(false); setAhora(Date.now()); }, 30000);
    return () => { cancelado = true; clearInterval(t); };
  }, [consultar, version]);

  async function cargarMas() {
    if (items.length === 0) return;
    setCargandoMas(true);
    try {
      const r = await consultar({ antes: items[items.length - 1].fecha });
      setItems((prev) => mezclarActividad(r.items, prev));
      setHayMas(r.hay_mas);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargandoMas(false);
    }
  }

  const umbralNuevo = fechaUtc(desde);
  const esNuevo = (x) => !!umbralNuevo && fechaUtc(x.fecha) > umbralNuevo;
  const pastilla = (activo, color) => ({ fontSize: 11.5, fontWeight: 600, padding: "5px 12px", borderRadius: 999, cursor: "pointer", border: `1px solid ${activo ? color : COLORS.line}`, background: activo ? color : COLORS.surface, color: activo ? "#FFFFFF" : COLORS.textDim });

  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, marginBottom: 32, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.line}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>Actividad reciente</div>
          <button type="button" onClick={() => setVersion((v) => v + 1)} style={{ background: "none", border: "none", color: COLORS.amber, fontSize: 11.5, cursor: "pointer", padding: 0 }}>
            Actualizar (se refresca sola cada 30 s)
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {[{ key: "", label: "Todas las webs", accent: COLORS.slate }, ...SITIOS_WEB].map((s) => (
            <button key={s.key || "todas"} type="button" aria-pressed={filtroSitio === s.key} onClick={() => setFiltroSitio(s.key)} style={pastilla(filtroSitio === s.key, s.accent)}>{s.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[{ key: "", label: "Todo", color: COLORS.slate }, { key: "visita", label: "Visitas", color: TIPOS_ACTIVIDAD.visita.color }, { key: "clic", label: "Clics", color: TIPOS_ACTIVIDAD.clic.color }, { key: "seccion_vista", label: "Secciones vistas", color: TIPOS_ACTIVIDAD.seccion_vista.color }].map((t) => (
            <button key={t.key || "todo"} type="button" aria-pressed={filtroTipo === t.key} onClick={() => setFiltroTipo(t.key)} style={pastilla(filtroTipo === t.key, t.color)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxHeight: 520, overflowY: "auto" }}>
        {error && <div role="alert" title={error} style={{ padding: "10px 16px", fontSize: 12.5, color: COLORS.rust }}>No se pudo cargar la actividad. Pulsa «Actualizar» para reintentar.</div>}
        {cargando && <div style={{ padding: 16, fontSize: 12.5, color: COLORS.textDim }}>Cargando actividad...</div>}
        {!cargando && !error && items.length === 0 && (
          <div style={{ padding: 16, fontSize: 12.5, color: COLORS.textDim }}>
            {filtroSitio || filtroTipo ? "No hay actividad con estos filtros." : "Todavía no hay actividad registrada."}
          </div>
        )}
        {items.map((x) => {
          const sitio = SITIOS_WEB.find((s) => s.key === x.sitio);
          const tipo = TIPOS_ACTIVIDAD[x.clase] || TIPOS_ACTIVIDAD.visita;
          const nuevo = esNuevo(x);
          return (
            <div key={`${x.clase}-${x.id}`} data-nuevo={nuevo ? "si" : "no"} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 16px 10px 13px", borderBottom: `1px solid ${COLORS.line}`, borderLeft: `3px solid ${nuevo ? sitio?.accent || COLORS.amber : "transparent"}`, background: nuevo ? `${sitio?.accent || COLORS.amber}0F` : "none" }}>
              <div style={{ width: 86, flexShrink: 0 }}>
                <div style={{ fontSize: 11.5, color: COLORS.text }}>{tiempoRelativo(x.fecha, ahora)}</div>
                <div style={{ fontSize: 10, color: COLORS.textDim }}>{fechaHoraLocal(x.fecha)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  {sitio && <span style={{ fontSize: 9.5, fontWeight: 700, color: sitio.accent, border: `1px solid ${sitio.accent}`, borderRadius: 999, padding: "2px 7px" }}>{sitio.label}</span>}
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: tipo.color, background: `${tipo.color}18`, borderRadius: 999, padding: "2px 7px", textTransform: "uppercase", letterSpacing: 0.3 }}>{tipo.texto}</span>
                  {nuevo && <span style={{ fontSize: 9, fontWeight: 800, color: "#FFFFFF", background: COLORS.rust, borderRadius: 999, padding: "2px 6px", letterSpacing: 0.4 }}>NUEVO</span>}
                </div>
                <div style={{ fontSize: 12.5, color: COLORS.text, marginTop: 4, overflowWrap: "anywhere" }}>
                  {x.clase === "visita" && (
                    <>
                      <strong>{x.ruta}</strong>
                      <span style={{ color: COLORS.textDim }}> · desde {dominioDe(x.referido)} · {x.dispositivo === "movil" ? "📱 móvil" : x.dispositivo === "escritorio" ? "💻 escritorio" : x.dispositivo}</span>
                    </>
                  )}
                  {x.clase === "clic" && <>Pulsó: <strong>{limpiarEtiqueta(x.etiqueta)}</strong></>}
                  {x.clase === "seccion_vista" && <>Vio la sección: <strong>{limpiarEtiqueta(x.etiqueta)}</strong></>}
                </div>
              </div>
            </div>
          );
        })}
        {hayMas && !cargando && (
          <div style={{ padding: 12, textAlign: "center" }}>
            <button type="button" onClick={cargarMas} disabled={cargandoMas} style={{ ...btnStyle("transparent", COLORS.textDim, COLORS.line), flex: "none", padding: "7px 16px", fontSize: 12 }}>
              {cargandoMas ? "Cargando..." : "Cargar más"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function VisitasWebView() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [novedades, setNovedades] = useState(null); // lo que había de nuevo al entrar (para resaltarlo)

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [resumen, nov] = await Promise.all([apiGet("/estadisticas/resumen"), apiGet("/estadisticas/novedades").catch(() => null)]);
        if (cancelado) return;
        setDatos(resumen);
        setNovedades(nov);
        // Lo que había hasta ahora pasa a contar como visto: la campana se apaga, pero aquí abajo
        // se sigue viendo resaltado qué era nuevo.
        apiPost("/estadisticas/marcar-vistas", {})
          .then(() => window.dispatchEvent(new Event("fn:notificaciones-actualizar")))
          .catch(() => {});
      } catch (e) {
        if (!cancelado) setErrorCarga(e.message);
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => { cancelado = true; };
  }, []);

  if (cargando) return <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>;
  if (errorCarga) return <div style={{ fontSize: 12.5, color: COLORS.rust }}>No se pudo cargar: {errorCarga}</div>;

  const sitios = SITIOS_WEB;

  const DIAS_ORDEN = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  const tarjetaEstilo = { background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 14, flex: "1 1 260px", minWidth: 220 };
  const tituloTarjeta = { fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 };

  return (
    <div>
      <div style={{ fontSize: 12.5, color: COLORS.textDim, marginBottom: 18 }}>
        Contador propio, sin cookies ni datos personales — solo cuenta visitas, no identifica a nadie.
      </div>

      {novedades && (novedades.total_visitas > 0 || novedades.total_clics > 0 || novedades.total_secciones > 0) && (
        <div role="status" style={{ background: `${COLORS.statusBlue}12`, border: `1px solid ${COLORS.statusBlue}55`, borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>Desde tu última revisión ({tiempoRelativo(novedades.desde)})</div>
          <div style={{ fontSize: 12.5, color: COLORS.text, marginTop: 3 }}>
            {novedades.total_visitas} visita{novedades.total_visitas === 1 ? "" : "s"} · {novedades.total_clics} clic{novedades.total_clics === 1 ? "" : "s"} · {novedades.total_secciones} secci{novedades.total_secciones === 1 ? "ón vista" : "ones vistas"}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {SITIOS_WEB.filter((s) => (novedades.sitios?.[s.key]?.visitas || 0) + (novedades.sitios?.[s.key]?.clics || 0) > 0).map((s) => (
              <span key={s.key} style={{ fontSize: 11, fontWeight: 600, color: s.accent, border: `1px solid ${s.accent}`, borderRadius: 999, padding: "2px 9px" }}>
                {s.label}: {novedades.sitios[s.key].visitas} visita{novedades.sitios[s.key].visitas === 1 ? "" : "s"}, {novedades.sitios[s.key].clics} clic{novedades.sitios[s.key].clics === 1 ? "" : "s"}
              </span>
            ))}
          </div>
        </div>
      )}

      <ActividadReciente desde={novedades?.desde} />
      {sitios.map((sitio) => {
        const d = datos?.[sitio.key];
        if (!d) return null;

        const totalDispositivos = d.dispositivos.reduce((s, x) => s + x.visitas, 0);

        // Rellena las 24 horas (aunque no haya datos en algunas) para que la barra no salga descuadrada
        const horasCompletas = Array.from({ length: 24 }, (_, h) => {
          const clave = String(h).padStart(2, "0");
          return { hora: clave, visitas: d.por_hora[clave] || 0 };
        });
        const maxHora = Math.max(1, ...horasCompletas.map((h) => h.visitas));

        // Reordena los días de la semana empezando en lunes, rellenando los que falten con 0
        const diasCompletos = DIAS_ORDEN.map((dia) => {
          const encontrado = d.por_dia_semana.find((x) => x.dia === dia);
          return { dia, visitas: encontrado ? encontrado.visitas : 0 };
        });
        const maxDia = Math.max(1, ...diasCompletos.map((x) => x.visitas));

        return (
          <div key={sitio.key} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <sitio.icon size={16} color={sitio.accent} />
              <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{sitio.label}</span>
              <span style={{ marginLeft: "auto", fontSize: 11.5, color: COLORS.textDim }}>{d.ultima_visita ? `Última visita ${tiempoRelativo(d.ultima_visita)}` : "Sin visitas todavía"}</span>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <StatCard label="Hoy" value={d.hoy} icon={Eye} accent={sitio.accent} />
              <StatCard label="Esta semana" value={d.semana} icon={Eye} accent={sitio.accent} />
              <StatCard label="Este mes" value={d.mes} icon={Eye} accent={sitio.accent} />
              <StatCard label="Total histórico" value={d.total} icon={Eye} accent={sitio.accent} destacada />
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
              {d.top_paginas?.length > 0 && (
                <div style={tarjetaEstilo}>
                  <div style={tituloTarjeta}>Páginas más vistas (30 días)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {d.top_paginas.map((p, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12.5 }}>
                        <span style={{ color: COLORS.text, overflowWrap: "anywhere" }}>{p.ruta}</span>
                        <span style={{ color: COLORS.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>{p.visitas}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {d.top_referidos.length > 0 && (
                <div style={tarjetaEstilo}>
                  <div style={tituloTarjeta}>De dónde viene la gente (7 días)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {d.top_referidos.map((r, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: COLORS.text }}>{r.referido}</span>
                        <span style={{ color: COLORS.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>{r.visitas}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalDispositivos > 0 && (
                <div style={tarjetaEstilo}>
                  <div style={tituloTarjeta}>Dispositivo (30 días)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {d.dispositivos.map((dv, i) => {
                      const pct = Math.round((dv.visitas / totalDispositivos) * 100);
                      return (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                            <span style={{ color: COLORS.text, textTransform: "capitalize" }}>{dv.dispositivo === "movil" ? "📱 Móvil" : dv.dispositivo === "escritorio" ? "💻 Escritorio" : dv.dispositivo}</span>
                            <span style={{ color: COLORS.textDim }}>{pct}%</span>
                          </div>
                          <div style={{ background: COLORS.surfaceRaised, borderRadius: 999, height: 6, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: sitio.accent, borderRadius: 999 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {d.top_eventos.length > 0 && (
                <div style={tarjetaEstilo}>
                  <div style={tituloTarjeta}>Qué tocan más (30 días)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {d.top_eventos.map((ev, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                        <span style={{ color: COLORS.text }}>{ev.etiqueta.replace(/^seccion_/, "👁 ").replace(/^boton_/, "").replace(/_/g, " ")}</span>
                        <span style={{ color: COLORS.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>{ev.veces}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{ ...tarjetaEstilo, flex: "2 1 380px" }}>
                <div style={tituloTarjeta}>Por hora del día (30 días)</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 60 }}>
                  {horasCompletas.map((h) => (
                    <div key={h.hora} title={`${h.hora}h: ${h.visitas} visitas`} style={{ flex: 1, height: `${Math.max(3, (h.visitas / maxHora) * 100)}%`, background: h.visitas > 0 ? sitio.accent : COLORS.line, borderRadius: 2 }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: COLORS.textDim, marginTop: 4 }}>
                  <span>00h</span><span>12h</span><span>23h</span>
                </div>
              </div>

              <div style={{ ...tarjetaEstilo, flex: "1 1 260px" }}>
                <div style={tituloTarjeta}>Por día de la semana (30 días)</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
                  {diasCompletos.map((x) => (
                    <div key={x.dia} title={`${x.dia}: ${x.visitas} visitas`} style={{ flex: 1, height: `${Math.max(3, (x.visitas / maxDia) * 100)}%`, background: x.visitas > 0 ? sitio.accent : COLORS.line, borderRadius: 2 }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: COLORS.textDim, marginTop: 4 }}>
                  <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
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
          <div style={{ marginTop: 10, background: COLORS.tintVerde, border: "1px solid #86EFAC", borderRadius: 8, padding: 12 }}>
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
  const [ventaAbierta, setVentaAbierta] = useState(null); // id del repuesto con el formulario de venta abierto
  const [formVenta, setFormVenta] = useState({ cantidad: "1", precio: "", metodo_pago: "efectivo" });
  const [vendiendo, setVendiendo] = useState(false);
  const [errorVenta, setErrorVenta] = useState("");
  const [avisoVenta, setAvisoVenta] = useState("");
  const [editandoId, setEditandoId] = useState(null); // id del repuesto que se está editando ahora mismo
  const [formEdicion, setFormEdicion] = useState({ nombre: "", categoria: "", stock_minimo: "", precio_compra: "", precio_venta: "" });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState("");
  const [resumenCapital, setResumenCapital] = useState(null);
  const [dandoBaja, setDandoBaja] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [rep, prov, resumen] = await Promise.all([apiGet("/repuestos"), apiGet("/proveedores"), apiGet("/repuestos/resumen-capital")]);
      setRepuestos(rep);
      setProveedores(prov);
      setResumenCapital(resumen);
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
      apiGet("/repuestos/resumen-capital").then(setResumenCapital).catch(() => {});
    } catch (e) {
      /* silencioso */
    } finally {
      setReponiendo((prev) => ({ ...prev, [repuestoId]: false }));
    }
  }

  function abrirVenta(repuesto) {
    setVentaAbierta(repuesto.id);
    setEditandoId(null);
    setFormVenta({ cantidad: "1", precio: String(repuesto.precio_venta || ""), metodo_pago: "efectivo" });
    setErrorVenta("");
  }

  async function confirmarVenta(repuesto) {
    setErrorVenta("");
    const cantidad = parseInt(formVenta.cantidad, 10);
    if (!cantidad || cantidad <= 0) { setErrorVenta("Cantidad no válida"); return; }
    if (cantidad > repuesto.stock_actual) { setErrorVenta(`Solo quedan ${repuesto.stock_actual} en stock`); return; }
    const precio = parseFloat(formVenta.precio);
    if (isNaN(precio) || precio < 0) { setErrorVenta("Precio no válido"); return; }

    setVendiendo(true);
    try {
      const res = await apiPost(`/repuestos/${repuesto.id}/vender`, {
        cantidad, precio_unitario: precio, metodo_pago: formVenta.metodo_pago,
      });
      setRepuestos((prev) => prev.map((r) => (r.id === repuesto.id ? res.repuesto : r)));
      setVentaAbierta(null);
      setAvisoVenta(`✓ Vendidas ${cantidad} ud. de "${repuesto.nombre}" por ${res.movimiento.monto.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`);
      setTimeout(() => setAvisoVenta(""), 5000);
      apiGet("/repuestos/resumen-capital").then(setResumenCapital).catch(() => {});
    } catch (e) {
      setErrorVenta(e.message);
    } finally {
      setVendiendo(false);
    }
  }

  function abrirEdicion(repuesto) {
    setEditandoId(repuesto.id);
    setVentaAbierta(null);
    setFormEdicion({
      nombre: repuesto.nombre,
      categoria: repuesto.categoria || "",
      stock_minimo: String(repuesto.stock_minimo ?? ""),
      precio_compra: String(repuesto.precio_compra ?? ""),
      precio_venta: String(repuesto.precio_venta ?? ""),
    });
    setErrorEdicion("");
  }

  async function guardarEdicion(repuestoId) {
    setErrorEdicion("");
    if (!formEdicion.nombre.trim()) { setErrorEdicion("El nombre no puede quedar vacío"); return; }
    const precioCompra = parseFloat(formEdicion.precio_compra);
    const precioVenta = parseFloat(formEdicion.precio_venta);
    const stockMinimo = parseInt(formEdicion.stock_minimo, 10);
    if (isNaN(precioCompra) || precioCompra < 0) { setErrorEdicion("Precio de compra no válido"); return; }
    if (isNaN(precioVenta) || precioVenta < 0) { setErrorEdicion("Precio de venta no válido"); return; }
    if (isNaN(stockMinimo) || stockMinimo < 0) { setErrorEdicion("Stock mínimo no válido"); return; }

    setGuardandoEdicion(true);
    try {
      const actualizado = await apiPatch(`/repuestos/${repuestoId}`, {
        nombre: formEdicion.nombre.trim(),
        categoria: formEdicion.categoria,
        precio_compra: precioCompra,
        precio_venta: precioVenta,
        stock_minimo: stockMinimo,
      });
      setRepuestos((prev) => prev.map((r) => (r.id === repuestoId ? actualizado : r)));
      setEditandoId(null);
      apiGet("/repuestos/resumen-capital").then(setResumenCapital).catch(() => {}); // los precios cambiaron, hay que recalcular
    } catch (e) {
      setErrorEdicion(e.message);
    } finally {
      setGuardandoEdicion(false);
    }
  }

  async function darDeBaja(repuesto) {
    if (!window.confirm(`¿Dar de baja "${repuesto.nombre}"? Dejará de aparecer en el inventario activo, pero no se borra — puedes reactivarlo cuando quieras.`)) return;
    setDandoBaja(repuesto.id);
    try {
      await fetch(`${API_BASE}/repuestos/${repuesto.id}`, { method: "DELETE", headers: cabecerasAuth() }).then(manejar401);
      setRepuestos((prev) => prev.filter((r) => r.id !== repuesto.id));
      apiGet("/repuestos/resumen-capital").then(setResumenCapital).catch(() => {});
    } catch (e) {
      /* silencioso */
    } finally {
      setDandoBaja(null);
    }
  }

  const inputStyle = { fontSize: 12.5, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box" };

  return (
    <div>
      {avisoVenta && (
        <div style={{ background: `${COLORS.green}18`, color: COLORS.green, fontSize: 12.5, fontWeight: 600, borderRadius: 8, padding: "9px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
          <CheckCircle2 size={15} /> {avisoVenta}
        </div>
      )}
      {resumenCapital && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <StatCard label="Capital invertido" value={`${resumenCapital.capital_invertido.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`} sub={`${resumenCapital.num_productos_activos} productos activos`} icon={Package} accent={COLORS.amber} destacada />
          <StatCard label="Ganancia potencial" value={`${resumenCapital.ganancia_potencial.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`} sub="si se vendiera todo el stock actual" icon={TrendingUp} accent={COLORS.green} />
        </div>
      )}
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
          <div key={r.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${COLORS.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", gap: 10, flexWrap: "wrap" }}>
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
                <button
                  onClick={() => (editandoId === r.id ? setEditandoId(null) : abrirEdicion(r))}
                  style={{ ...btnStyle(editandoId === r.id ? COLORS.textDim : COLORS.statusBlue, "#FFFFFF"), padding: "6px 12px", fontSize: 11.5, flex: "none" }}
                  title="Corregir nombre, categoría, precios o stock mínimo"
                >
                  {editandoId === r.id ? "Cancelar" : "Editar"}
                </button>
                <button
                  onClick={() => (ventaAbierta === r.id ? setVentaAbierta(null) : abrirVenta(r))}
                  disabled={r.stock_actual <= 0}
                  style={{ ...btnStyle(ventaAbierta === r.id ? COLORS.textDim : COLORS.green, "#FFFFFF"), padding: "6px 12px", fontSize: 11.5, flex: "none", opacity: r.stock_actual <= 0 ? 0.4 : 1 }}
                  title={r.stock_actual <= 0 ? "Sin stock" : "Vender suelto, sin reparación"}
                >
                  {ventaAbierta === r.id ? "Cancelar" : "Vender"}
                </button>
                <button
                  onClick={() => darDeBaja(r)}
                  disabled={dandoBaja === r.id}
                  style={{ ...btnStyle("transparent", COLORS.rust, COLORS.rust), padding: "6px 12px", fontSize: 11.5, flex: "none" }}
                  title="Dar de baja (no se borra, solo deja de aparecer en el inventario activo)"
                >
                  {dandoBaja === r.id ? "..." : "Dar de baja"}
                </button>
              </div>
            </div>
            {editandoId === r.id && (
              <div style={{ padding: "0 16px 14px", display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", background: COLORS.surfaceRaised }}>
                <div>
                  <div style={{ fontSize: 10.5, color: COLORS.textDim, marginBottom: 3 }}>Nombre</div>
                  <input value={formEdicion.nombre} onChange={(e) => setFormEdicion((f) => ({ ...f, nombre: e.target.value }))} style={{ width: 160, fontSize: 12, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }} />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: COLORS.textDim, marginBottom: 3 }}>Categoría</div>
                  <input value={formEdicion.categoria} onChange={(e) => setFormEdicion((f) => ({ ...f, categoria: e.target.value }))} style={{ width: 110, fontSize: 12, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }} />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: COLORS.textDim, marginBottom: 3 }}>Precio compra (€)</div>
                  <input type="number" value={formEdicion.precio_compra} onChange={(e) => setFormEdicion((f) => ({ ...f, precio_compra: e.target.value }))} style={{ width: 90, fontSize: 12, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }} />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: COLORS.textDim, marginBottom: 3 }}>Precio venta (€)</div>
                  <input type="number" value={formEdicion.precio_venta} onChange={(e) => setFormEdicion((f) => ({ ...f, precio_venta: e.target.value }))} style={{ width: 90, fontSize: 12, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }} />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: COLORS.textDim, marginBottom: 3 }}>Stock mínimo</div>
                  <input type="number" value={formEdicion.stock_minimo} onChange={(e) => setFormEdicion((f) => ({ ...f, stock_minimo: e.target.value }))} style={{ width: 80, fontSize: 12, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }} />
                </div>
                <button disabled={guardandoEdicion} onClick={() => guardarEdicion(r.id)} style={{ ...btnStyle(COLORS.statusBlue, "#FFFFFF"), padding: "7px 14px", fontSize: 12 }}>
                  {guardandoEdicion ? "Guardando..." : "Guardar cambios"}
                </button>
                {errorEdicion && <div style={{ fontSize: 11.5, color: COLORS.rust, width: "100%" }}>{errorEdicion}</div>}
              </div>
            )}
            {ventaAbierta === r.id && (
              <div style={{ padding: "0 16px 14px", display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", background: COLORS.surfaceRaised }}>
                <div>
                  <div style={{ fontSize: 10.5, color: COLORS.textDim, marginBottom: 3 }}>Cantidad</div>
                  <input type="number" value={formVenta.cantidad} onChange={(e) => setFormVenta((f) => ({ ...f, cantidad: e.target.value }))} style={{ width: 70, fontSize: 12, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }} />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: COLORS.textDim, marginBottom: 3 }}>Precio unidad (€)</div>
                  <input type="number" value={formVenta.precio} onChange={(e) => setFormVenta((f) => ({ ...f, precio: e.target.value }))} style={{ width: 90, fontSize: 12, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }} />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: COLORS.textDim, marginBottom: 3 }}>Método de pago</div>
                  <select value={formVenta.metodo_pago} onChange={(e) => setFormVenta((f) => ({ ...f, metodo_pago: e.target.value }))} style={{ fontSize: 12, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.line}` }}>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="bizum">Bizum</option>
                  </select>
                </div>
                <button disabled={vendiendo} onClick={() => confirmarVenta(r)} style={{ ...btnStyle(COLORS.green, "#FFFFFF"), padding: "7px 14px", fontSize: 12 }}>
                  {vendiendo ? "Vendiendo..." : "Confirmar venta"}
                </button>
                {errorVenta && <div style={{ fontSize: 11.5, color: COLORS.rust, width: "100%" }}>{errorVenta}</div>}
              </div>
            )}
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
  const [convirtiendo, setConvirtiendo] = useState(null); // id del cliente que se está convirtiendo
  const [errorConversion, setErrorConversion] = useState("");

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

  // Pasa un contacto (alguien que escribió desde una web) a cliente de verdad. Todas las
  // solicitudes de esa misma persona se actualizan a la vez.
  async function convertirEnCliente(s) {
    setErrorConversion("");
    setConvirtiendo(s.cliente_id);
    try {
      const cliente = await apiPost(`/clientes/${s.cliente_id}/convertir`, {});
      setSolicitudes((prev) => prev.map((x) => (x.cliente_id === s.cliente_id ? { ...x, cliente } : x)));
    } catch (e) {
      setErrorConversion(`No se pudo convertir en cliente: ${e.message}`);
    } finally {
      setConvirtiendo(null);
    }
  }

  return (
    <div>
      {errorConversion && (
        <div role="alert" style={{ marginBottom: 12, fontSize: 12.5, color: COLORS.rust, background: `${COLORS.rust}12`, borderRadius: 8, padding: "9px 12px" }}>{errorConversion}</div>
      )}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.text }}>{s.cliente?.nombre}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: s.negocio === "firztweb" ? COLORS.violet : COLORS.amber, border: `1px solid ${s.negocio === "firztweb" ? COLORS.violet : COLORS.amber}`, borderRadius: 999, padding: "2px 7px" }}>
                    {s.negocio === "firztweb" ? "Firztweb" : "Firztnet"}
                  </span>
                  {s.origen === "nuevo_contacto" && s.cliente?.es_contacto && (
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.violet, background: `${COLORS.violet}18`, borderRadius: 999, padding: "2px 7px", textTransform: "uppercase", letterSpacing: 0.3 }}>
                      Nuevo contacto
                    </span>
                  )}
                  {s.origen === "nuevo_contacto" && !s.cliente?.es_contacto && (
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.green, background: `${COLORS.green}18`, borderRadius: 999, padding: "2px 7px", textTransform: "uppercase", letterSpacing: 0.3 }}>
                      Cliente{s.cliente?.codigo ? ` ${s.cliente.codigo}` : ""}
                    </span>
                  )}
                </div>
                {s.cliente?.telefono && <div style={{ fontSize: 11.5, color: COLORS.textDim, marginTop: 1 }}>{s.cliente.telefono}</div>}
                <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>{s.mensaje || "Sin mensaje adicional"}</div>
                <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>{fechaLarga(s.fecha)}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                {s.cliente?.es_contacto && (
                  <button
                    onClick={() => convertirEnCliente(s)}
                    disabled={convirtiendo === s.cliente_id}
                    style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "7px 12px", fontSize: 11.5, opacity: convirtiendo === s.cliente_id ? 0.7 : 1 }}
                  >
                    <UserPlus size={13} /> {convirtiendo === s.cliente_id ? "Convirtiendo..." : "Convertir en cliente"}
                  </button>
                )}
                {!s.atendida && (
                  <button onClick={() => marcarAtendida(s.id)} style={{ ...btnStyle(COLORS.green, "#FFFFFF"), flex: "none", padding: "7px 12px", fontSize: 11.5 }}>
                    Marcar atendida
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------- vista: Ayuda a clientes (Firztnet Central) --------------------
// Los locales que usan tus otros sistemas (hostelería, peluquerías...) piden ayuda desde su
// panel con «Pedir ayuda». Aquí las ves, cambias el estado y les respondes: tu respuesta
// les aparece en su panel. Las notas internas solo las ves tú.
const SISTEMAS_AYUDA = {
  hosteleria: { label: "Hostelería", color: "#D97706" },
  peluquerias: { label: "Peluquerías", color: "#C2457A" },
  reformas: { label: "Reformas", color: "#1E3A5F" },
  logistica: { label: "Logística", color: "#2563EB" },
  reciclaje: { label: "Reciclaje", color: "#EA580C" },
  pos: { label: "Punto de venta", color: "#0F766E" },
};
const TIPOS_AYUDA = {
  impresora: "🖨️ No imprime", datafono: "💳 Datáfono", aparato: "📱 Aparato o pantalla",
  acceso: "🔑 No puede entrar", internet: "📶 Internet", otro: "💬 Otra cosa",
};
const ESTADOS_AYUDA = [
  { key: "nueva", label: "Nueva", color: COLORS.statusBlue },
  { key: "en_curso", label: "En marcha", color: COLORS.statusAmber },
  { key: "resuelta", label: "Resuelta", color: COLORS.green },
];

function hace(iso) {
  if (!iso) return "";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(iso).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function enlaceWhatsapp(telefono, texto) {
  const digitos = (telefono || "").replace(/\D/g, "");
  if (digitos.length < 9) return null;
  const numero = digitos.length === 9 ? `34${digitos}` : digitos;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

function TarjetaAyuda({ p, onGuardar, plantillas = [] }) {
  const [respuesta, setRespuesta] = useState(p.respuesta || "");
  const [notas, setNotas] = useState(p.notas || "");
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState("");
  const sistema = SISTEMAS_AYUDA[p.sistema] || { label: p.sistema, color: COLORS.slate };
  const estado = ESTADOS_AYUDA.find((e) => e.key === p.estado) || ESTADOS_AYUDA[0];
  const cambios = respuesta !== (p.respuesta || "") || notas !== (p.notas || "");
  const whatsapp = enlaceWhatsapp(p.telefono, `Hola, te escribimos de Firztnet por tu petición ${p.referencia}: `);

  async function guardar(extra = {}) {
    setGuardando(true);
    setAviso("");
    try {
      await onGuardar(p.id, { respuesta, notas, ...extra });
      setAviso("Guardado");
      setTimeout(() => setAviso(""), 2000);
    } catch (e) {
      setAviso(`No se pudo guardar: ${e.message}`);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.line}`, borderRight: `1px solid ${COLORS.line}`, borderBottom: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${p.urgente && p.estado !== "resuelta" ? COLORS.rust : estado.color}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{p.negocio}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: sistema.color, border: `1px solid ${sistema.color}`, borderRadius: 999, padding: "2px 8px" }}>{sistema.label}</span>
            {p.urgente && p.estado !== "resuelta" && (
              <span style={{ fontSize: 10, fontWeight: 800, color: "#FFFFFF", background: COLORS.rust, borderRadius: 999, padding: "2px 8px", textTransform: "uppercase", letterSpacing: 0.4 }}>Urgente</span>
            )}
            <span style={{ fontSize: 11, color: COLORS.textDim }}>{p.referencia} · {hace(p.fecha)}</span>
          </div>
          <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 3 }}>
            {p.persona || "—"}{p.puesto ? ` · ${p.puesto}` : ""}{p.empresa ? ` · ${p.empresa}` : ""}
          </div>
          {p.direccion_web && <div style={{ fontSize: 11.5, color: COLORS.textDim }}>{p.direccion_web}</div>}
        </div>
        <div style={{ display: "flex", gap: 4, background: COLORS.surfaceRaised, borderRadius: 999, padding: 3 }}>
          {ESTADOS_AYUDA.map((e) => (
            <button
              key={e.key}
              onClick={() => guardar({ estado: e.key })}
              disabled={guardando}
              style={{ border: "none", borderRadius: 999, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "Inter", background: p.estado === e.key ? e.color : "transparent", color: p.estado === e.key ? "#FFFFFF" : COLORS.textDim }}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 13.5, color: COLORS.text, background: COLORS.surfaceRaised, borderRadius: 10, padding: "10px 12px" }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textDim, marginBottom: 4 }}>{TIPOS_AYUDA[p.tipo] || p.tipo}{p.pagina ? ` · pantalla «${p.pagina}»` : ""}</div>
        {p.mensaje}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {p.telefono && (
          <a href={`tel:${p.telefono}`} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", textDecoration: "none", padding: "7px 12px", fontSize: 12 }}>📞 Llamar · {p.telefono}</a>
        )}
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle("#16A34A", "#FFFFFF"), flex: "none", textDecoration: "none", padding: "7px 12px", fontSize: 12 }}>WhatsApp</a>
        )}
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11.5, fontWeight: 700, color: COLORS.textDim }}>
        <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>Respuesta para el cliente (la ve en su panel)
          {plantillas.length > 0 && (
            <select value="" onChange={(e) => { const t = plantillas.find((x) => String(x.id) === e.target.value); if (t) setRespuesta((r) => (r ? r + "\n" + t.texto : t.texto)); }}
              style={{ border: "1px solid " + COLORS.line, borderRadius: 6, padding: "3px 6px", fontSize: 12, fontFamily: "Inter", fontWeight: 600, color: COLORS.text }}>
              <option value="">⚡ Respuesta rápida…</option>
              {plantillas.map((t) => <option key={t.id} value={t.id}>{t.titulo}</option>)}
            </select>
          )}
        </span>
        <textarea value={respuesta} onChange={(e) => setRespuesta(e.target.value)} rows={2} maxLength={2000} placeholder="Por ejemplo: pasamos esta tarde a las 17:00 a revisar la impresora" style={{ border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, fontFamily: "Inter", resize: "vertical", color: COLORS.text }} />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11.5, fontWeight: 700, color: COLORS.textDim }}>
        Notas internas (solo las ves tú)
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={1} maxLength={2000} placeholder="Qué era, qué cambiaste, piezas..." style={{ border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, fontFamily: "Inter", resize: "vertical", color: COLORS.text }} />
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => guardar()} disabled={guardando || !cambios} style={{ ...btnStyle(cambios ? COLORS.amber : COLORS.surfaceRaised, cambios ? "#FFFFFF" : COLORS.textDim), flex: "none", padding: "8px 14px", opacity: guardando ? 0.7 : 1 }}>
          {guardando ? "Guardando..." : "Guardar respuesta y notas"}
        </button>
        {p.respuesta_fecha && <span style={{ fontSize: 11.5, color: COLORS.textDim }}>Respondida {hace(p.respuesta_fecha)}</span>}
        {aviso && <span style={{ fontSize: 12, fontWeight: 600, color: aviso.startsWith("No") ? COLORS.rust : COLORS.green }}>{aviso}</span>}
      </div>
    </div>
  );
}

function AyudaClientesView() {
  const [peticiones, setPeticiones] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [gestionando, setGestionando] = useState(false);
  const [estad, setEstad] = useState(null);
  const cargarPlantillas = useCallback(() => apiGet("/central/plantillas-ayuda").then(setPlantillas).catch(() => {}), []);
  useEffect(() => { cargarPlantillas(); apiGet("/central/ayuda-estadisticas").then(setEstad).catch(() => {}); }, [cargarPlantillas]);
  const [cargando, setCargando] = useState(true);
  const [verTodas, setVerTodas] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setPeticiones(await apiGet(`/central/ayuda${verTodas ? "?todas=true" : ""}`));
    } catch (e) {
      setError("No se pudieron cargar las peticiones de ayuda.");
    } finally {
      setCargando(false);
    }
  }, [verTodas]);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 60000);
    return () => clearInterval(t);
  }, [cargar]);

  async function guardar(id, cambios) {
    const actualizada = await apiPatch(`/central/ayuda/${id}`, cambios);
    setPeticiones((prev) => prev.map((p) => (p.id === id ? actualizada : p)).filter((p) => verTodas || p.estado !== "resuelta"));
  }

  const sistemas = [...new Set(peticiones.map((p) => p.sistema))];
  const lista = peticiones.filter((p) => filtro === "todos" || p.sistema === filtro);
  const nuevas = peticiones.filter((p) => p.estado === "nueva").length;
  const urgentes = peticiones.filter((p) => p.urgente && p.estado !== "resuelta").length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
        <StatCard label="Nuevas" value={nuevas} icon={LifeBuoy} accent={COLORS.statusBlue} />
        <StatCard label="Urgentes sin resolver" value={urgentes} icon={Flame} accent={COLORS.rust} />
        <StatCard label={verTodas ? "En la lista" : "Abiertas"} value={peticiones.length} icon={MessageSquare} accent={COLORS.amber} />
        <StatCard label="Respondes de media en" value={estad?.respuesta_media_min == null ? "—" : estad.respuesta_media_min < 60 ? `${estad.respuesta_media_min} min` : `${Math.round(estad.respuesta_media_min / 60)} h`} sub="últimos 90 días" icon={Clock} accent={COLORS.teal} />
        <StatCard label="Resuelves de media en" value={estad?.resolucion_media_h == null ? "—" : `${String(estad.resolucion_media_h).replace(".", ",")} h`} sub={estad ? `${estad.resueltas} resueltas` : ""} icon={CheckCircle2} accent={COLORS.green} />
      </div>
      {gestionando ? <GestionPlantillas plantillas={plantillas} onCambio={cargarPlantillas} onCerrar={() => setGestionando(false)} />
        : <div style={{ marginBottom: 12 }}><button onClick={() => setGestionando(true)} style={{ ...btnStyle("transparent", COLORS.text, COLORS.line), flex: "none", padding: "6px 12px", fontSize: 12 }}>⚡ Gestionar respuestas rápidas ({plantillas.length})</button></div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["todos", ...sistemas].map((s) => (
            <button key={s} onClick={() => setFiltro(s)} style={{ ...btnStyle(filtro === s ? COLORS.amber : "transparent", filtro === s ? "#FFFFFF" : COLORS.textDim, filtro === s ? null : COLORS.line), flex: "none", padding: "6px 12px", fontSize: 12 }}>
              {s === "todos" ? "Todos los sistemas" : SISTEMAS_AYUDA[s]?.label || s}
            </button>
          ))}
        </div>
        <button onClick={() => setVerTodas((v) => !v)} style={{ ...btnStyle("transparent", COLORS.textDim, COLORS.line), flex: "none", padding: "8px 14px", fontSize: 12.5 }}>
          {verTodas ? "Ver solo abiertas" : "Ver todas (incluye resueltas)"}
        </button>
      </div>
      {error && <div role="alert" style={{ marginBottom: 12, fontSize: 12.5, color: COLORS.rust }}>{error}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {cargando && peticiones.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>}
        {!cargando && lista.length === 0 && (
          <div style={{ fontSize: 13, color: COLORS.textDim, background: COLORS.surface, border: `1px dashed ${COLORS.line}`, borderRadius: 12, padding: 18 }}>
            Sin peticiones {verTodas ? "" : "abiertas"}. Aquí llegan las que hacen los locales con el botón «Pedir ayuda» de hostelería y peluquerías, y te avisa también por Telegram.
          </div>
        )}
        {lista.map((p) => <TarjetaAyuda key={`${p.id}-${p.respuesta_fecha || ""}-${p.estado}`} p={p} onGuardar={guardar} plantillas={plantillas} />)}
      </div>
    </div>
  );
}

// -------------------- vista: Estado de los sistemas (Firztnet Central, fase 2) --------------------
// Reparaciones abre cada 2 minutos tus sistemas y webs y anota si responden. Si uno se cae,
// te avisa por Telegram y en la campana; aquí ves el semáforo, el historial y lo que tardan.
const ESTADO_SALUD = {
  ok: { label: "Funciona", color: "#16A34A", fondo: "#DCFCE7" },
  lento: { label: "Lento", color: "#D97706", fondo: "#FEF3C7" },
  caido: { label: "Caído", color: "#DC2626", fondo: "#FEE2E2" },
  desconocido: { label: "Comprobando…", color: "#64748B", fondo: "#F1F5F9" },
  pausado: { label: "En pausa", color: "#94A3B8", fondo: "#F1F5F9" },
};

function haceCorto(iso) {
  if (!iso) return "nunca";
  const seg = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seg < 60) return "hace un momento";
  const min = Math.round(seg / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`;
}
const horaCorta = (iso) => new Date(iso).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const duracionTexto = (min) => (min < 60 ? `${min} min` : min < 1440 ? `${Math.floor(min / 60)} h ${min % 60 ? `${min % 60} min` : ""}` : `${Math.floor(min / 1440)} d ${Math.floor((min % 1440) / 60)} h`);

function TarjetaSistema({ s, onPausar, onBorrar }) {
  const e = ESTADO_SALUD[s.estado] || ESTADO_SALUD.desconocido;
  const sslMal = s.ssl_dias !== null && s.ssl_dias <= 14;
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${s.estado === "caido" ? "#FCA5A5" : COLORS.line}`, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 10, boxShadow: s.estado === "caido" ? "0 10px 24px -12px rgba(220,38,38,0.45)" : "none", opacity: s.activo ? 1 : 0.65 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className={s.estado === "ok" ? "fn-punto-activo" : undefined} style={{ width: 12, height: 12, borderRadius: "50%", background: e.color, flexShrink: 0, boxShadow: `0 0 0 4px ${e.fondo}` }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.text, display: "flex", alignItems: "center", gap: 6 }}>
            {s.tipo === "web" ? <Globe size={14} color={COLORS.textDim} /> : <Server size={14} color={COLORS.textDim} />}
            {s.nombre}
          </div>
          <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, color: COLORS.textDim, textDecoration: "none", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.url.replace(/^https?:\/\//, "")}</a>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: e.color, background: e.fondo, borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" }}>{e.label}</span>
      </div>
      {s.estado === "caido" && (
        <div style={{ fontSize: 12, color: COLORS.tintRojoTx, background: COLORS.tintRojo, borderRadius: 8, padding: "7px 10px" }}>
          Caído desde {horaCorta(s.caido_desde)} · {s.error}
        </div>
      )}
      {s.estado !== "caido" && s.error && s.activo && (
        <div style={{ fontSize: 11.5, color: COLORS.textDim }}>Último intento falló ({s.error}); se vuelve a probar en 2 min.</div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        {[
          ["Responde en", !s.ms ? "—" : s.ms < 1000 ? `${s.ms} ms` : `${(s.ms / 1000).toLocaleString("es-ES", { maximumFractionDigits: 1 })} s`],
          ["30 días", `${s.disponibilidad_30d.toLocaleString("es-ES")} %`],
          ["Candado", s.ssl_dias === null ? "—" : `${s.ssl_dias} días`],
        ].map(([k, v], i) => (
          <div key={k} style={{ background: COLORS.surfaceRaised, borderRadius: 8, padding: "6px 8px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>{k}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: i === 2 && sslMal ? COLORS.rust : i === 1 && s.disponibilidad_30d < 99 ? COLORS.statusAmber : COLORS.text }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 11, color: COLORS.textDim }}>Comprobado {haceCorto(s.ultima_comprobacion)}</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onPausar(s)} title={s.activo ? "Dejar de vigilar por ahora" : "Volver a vigilar"} style={{ ...btnStyle("transparent", COLORS.textDim, COLORS.line), flex: "none", padding: "5px 9px", fontSize: 11 }}>
            {s.activo ? <><Pause size={12} /> Pausar</> : <><Play size={12} /> Vigilar</>}
          </button>
          <button onClick={() => onBorrar(s)} title="Quitar de la lista" style={{ ...btnStyle("transparent", COLORS.rust, COLORS.line), flex: "none", padding: "5px 9px", fontSize: 11 }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function EstadoSistemasView() {
  const [datos, setDatos] = useState(null);
  const [comprobando, setComprobando] = useState(false);
  const [error, setError] = useState("");
  const [nuevo, setNuevo] = useState({ nombre: "", url: "https://", tipo: "sistema" });
  const [anadiendo, setAnadiendo] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setDatos(await apiGet("/central/salud"));
      setError("");
    } catch (e) {
      setError("No se pudo cargar el estado de los sistemas.");
    }
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 30000);
    return () => clearInterval(t);
  }, [cargar]);

  async function comprobarAhora() {
    setComprobando(true);
    try {
      setDatos(await apiPost("/central/salud/comprobar", {}));
      window.dispatchEvent(new Event("fn:notificaciones-actualizar"));
    } catch (e) {
      setError(`No se pudo comprobar: ${e.message}`);
    } finally {
      setComprobando(false);
    }
  }

  async function pausar(s) {
    try {
      await apiPatch(`/central/salud/sistemas/${s.id}`, { activo: !s.activo });
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function borrar(s) {
    if (!window.confirm(`¿Quitar «${s.nombre}» de la vigilancia? Se borra también su historial de caídas.`)) return;
    try {
      const res = await fetch(`${API_BASE}/central/salud/sistemas/${s.id}`, { method: "DELETE", headers: cabecerasAuth() });
      manejar401(res);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function anadir(ev) {
    ev.preventDefault();
    setAnadiendo(true);
    try {
      await apiPost("/central/salud/sistemas", nuevo);
      setNuevo({ nombre: "", url: "https://", tipo: "sistema" });
      await comprobarAhora();
    } catch (e) {
      setError(e.message);
    } finally {
      setAnadiendo(false);
    }
  }

  if (!datos) return <div style={{ fontSize: 12.5, color: COLORS.textDim }}>{error || "Cargando..."}</div>;

  const activos = datos.sistemas.filter((s) => s.activo);
  const caidos = activos.filter((s) => s.estado === "caido");
  const lentos = activos.filter((s) => s.estado === "lento");
  const sistemas = datos.sistemas.filter((s) => s.tipo !== "web" && s.origen !== "auto");
  const webs = datos.sistemas.filter((s) => s.tipo === "web" && s.origen !== "auto");
  const websClientes = datos.sistemas.filter((s) => s.origen === "auto");
  const caidasClientes = websClientes.filter((s) => s.activo && s.estado === "caido").length;
  const inputEstilo = { border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, fontFamily: "Inter", color: COLORS.text, background: COLORS.surface };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16, padding: "16px 18px", borderRadius: 14, color: "#FFFFFF", background: caidos.length ? "linear-gradient(135deg, #EF4444, #B91C1C)" : lentos.length ? "linear-gradient(135deg, #F59E0B, #D97706)" : "linear-gradient(135deg, #22C55E, #15803D)" }}>
        <Activity size={30} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            {caidos.length ? `${caidos.length} sistema${caidos.length > 1 ? "s" : ""} caído${caidos.length > 1 ? "s" : ""}: ${caidos.map((s) => s.nombre).join(", ")}`
              : lentos.length ? `Todo responde, pero ${lentos.map((s) => s.nombre).join(", ")} va${lentos.length > 1 ? "n" : ""} lento`
                : `Todo funciona · ${activos.length} de ${activos.length}`}
          </div>
          <div style={{ fontSize: 12.5, opacity: 0.9 }}>Se comprueba solo cada {datos.intervalo_min} minutos. Si algo se cae, te llega un Telegram y un aviso en la campana.</div>
        </div>
        <button onClick={comprobarAhora} disabled={comprobando} style={{ ...btnStyle("rgba(255,255,255,0.18)", "#FFFFFF", "rgba(255,255,255,0.5)"), flex: "none", padding: "9px 14px" }}>
          <RefreshCw size={14} className={comprobando ? "fn-girando" : undefined} /> {comprobando ? "Comprobando..." : "Comprobar ahora"}
        </button>
      </div>
      {error && <div role="alert" style={{ marginBottom: 12, fontSize: 12.5, color: COLORS.rust }}>{error}</div>}

      <h3 style={{ fontSize: 13, fontWeight: 800, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.5, margin: "4px 0 10px" }}>Sistemas</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 18 }}>
        {sistemas.map((s) => <TarjetaSistema key={s.id} s={s} onPausar={pausar} onBorrar={borrar} />)}
      </div>
      {webs.length > 0 && (
        <>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.5, margin: "4px 0 10px" }}>Webs</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 18 }}>
            {webs.map((s) => <TarjetaSistema key={s.id} s={s} onPausar={pausar} onBorrar={borrar} />)}
          </div>
        </>
      )}

      <CopiasSeguridad />

      {websClientes.length > 0 && (
        <>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.5, margin: "4px 0 4px" }}>
            Webs de tus clientes · {websClientes.length}{caidasClientes ? <span style={{ color: COLORS.rust }}> · {caidasClientes} caída{caidasClientes > 1 ? "s" : ""}</span> : null}
          </h3>
          <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 10 }}>Se añaden y se quitan solas con tus clientes en prueba o activos. Se comprueban cada {datos.intervalo_auto_min || 5} minutos; si caen varias de la misma plataforma a la vez, te llega un solo aviso.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 8, marginBottom: 18 }}>
            {websClientes.map((s) => {
              const e = ESTADO_SALUD[s.estado] || ESTADO_SALUD.desconocido;
              const plataforma = SISTEMAS_AYUDA[s.sistema_cliente]?.label || s.sistema_cliente;
              return (
                <div key={s.id} title={s.error || ""} style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.surface, border: `1px solid ${s.estado === "caido" ? "#FCA5A5" : COLORS.line}`, borderRadius: 10, padding: "8px 10px", opacity: s.activo ? 1 : 0.6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.nombre}</div>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: COLORS.textDim, textDecoration: "none" }}>{plataforma} · {s.estado === "caido" ? `caída desde ${horaCorta(s.caido_desde)}` : s.ms ? `${s.ms} ms` : e.label}</a>
                  </div>
                  <button onClick={() => pausar(s)} title={s.activo ? "Dejar de vigilar por ahora" : "Volver a vigilar"} style={{ border: "none", background: "transparent", cursor: "pointer", color: COLORS.textDim, padding: 4 }}>
                    {s.activo ? <Pause size={13} /> : <Play size={13} />}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>Historial de caídas</div>
          {datos.incidencias.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Ninguna caída registrada. 🎉</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {datos.incidencias.map((i) => (
              <div key={i.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5, padding: "7px 10px", borderRadius: 8, background: i.abierta ? "#FEF2F2" : COLORS.surfaceRaised }}>
                <span style={{ minWidth: 0 }}><strong style={{ color: i.abierta ? COLORS.rust : COLORS.text }}>{i.sistema}</strong> <span style={{ color: COLORS.textDim }}>· {horaCorta(i.inicio)} · {i.motivo}</span></span>
                <span style={{ fontWeight: 700, whiteSpace: "nowrap", color: i.abierta ? COLORS.rust : COLORS.textDim }}>{i.abierta ? "Sigue caído" : duracionTexto(i.minutos)}</span>
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={anadir} style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>Vigilar otra dirección</div>
          <div style={{ fontSize: 12, color: COLORS.textDim }}>Un sistema nuevo, la web de un cliente… Se comprueba igual que los demás.</div>
          <input value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} placeholder="Nombre (por ejemplo: Punto de venta)" maxLength={80} required style={inputEstilo} />
          <input value={nuevo.url} onChange={(e) => setNuevo({ ...nuevo, url: e.target.value })} placeholder="https://..." maxLength={300} required style={inputEstilo} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={nuevo.tipo} onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })} style={{ ...inputEstilo, flex: 1 }}>
              <option value="sistema">Sistema de gestión</option>
              <option value="web">Web</option>
            </select>
            <button type="submit" disabled={anadiendo} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "9px 14px" }}>
              <Plus size={14} /> {anadiendo ? "Añadiendo..." : "Añadir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------- vista: Clientes de sistemas (Firztnet Central, fase 3) --------------------
// La ficha única de cada cliente de tus plataformas (hostelería, peluquerías...): estado, prueba o
// renovación, contacto, uso del sistema, aparatos y sus peticiones de ayuda. Llega solo cada 10 minutos.
const ESTADO_LOCAL = {
  prueba: { label: "En prueba", color: "#2563EB", fondo: "#DBEAFE" },
  activo: { label: "Activo", color: "#15803D", fondo: "#DCFCE7" },
  suspendido: { label: "Suspendido", color: "#B91C1C", fondo: "#FEE2E2" },
  prueba_vencida: { label: "Prueba terminada", color: "#B45309", fondo: "#FEF3C7" },
  baja: { label: "De baja", color: "#64748B", fondo: "#F1F5F9" },
};
const TIPO_APARATO = { mostrador: "🧾 TPV / recepción", comandero: "📱 Móvil", cocina: "👨‍🍳 Cocina" };
const euros = (c) => ((c || 0) / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
const fechaCorta = (iso) => (iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "—");

function textoPlazo(l) {
  if (l.estado === "prueba" && l.dias !== null) return l.dias === 0 ? "Termina hoy" : l.dias === 1 ? "Termina mañana" : `Quedan ${l.dias} días`;
  if (l.estado === "prueba_vencida") return `Terminó el ${fechaCorta(l.prueba_hasta)}`;
  if (l.estado === "activo" && l.renueva) return l.renovacion_vencida ? `Renovación vencida (${fechaCorta(l.renueva)})` : `Renueva el ${fechaCorta(l.renueva)}`;
  if (l.estado === "suspendido") return l.motivo_suspension || "Suspendido";
  return "";
}

// -------------------- Informe mensual de visitas (Firztnet Central, fase 4) --------------------
// Dentro de la ficha de cada cliente: cuánta gente ha entrado en su web este mes, desde dónde y
// con qué aparato, y cuántas reservas ha recibido por internet. Se imprime (o guarda en PDF) con
// tu marca, o se le manda un resumen por WhatsApp o correo.
const nombreMes = (mes) => new Date(`${mes}-15T12:00:00`).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
const escHtml = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function textoCambio(inf) {
  if (inf.cambio_pct === null) return inf.visitas ? "primer mes con datos" : "";
  if (inf.cambio_pct === 0) return "igual que el mes anterior";
  return `${inf.cambio_pct > 0 ? "+" : ""}${inf.cambio_pct} % que el mes anterior`;
}

function resumenTexto(inf) {
  const lineas = [
    `Hola ${inf.local.contacto_nombre || ""}, te mandamos el resumen de la web de ${inf.local.nombre} de ${nombreMes(inf.mes)}:`,
    `• ${inf.visitas} visitas (${textoCambio(inf) || "sin comparación"})`,
  ];
  if (inf.movil_pct !== null) lineas.push(`• ${inf.movil_pct} % desde el móvil`);
  if (inf.origenes.length) lineas.push(`• Llegan sobre todo por: ${inf.origenes.slice(0, 3).map((o) => `${o.nombre} (${o.pct} %)`).join(", ")}`);
  if (inf.mejor_dia_semana) lineas.push(`• El día con más visitas suele ser el ${inf.mejor_dia_semana}`);
  if (inf.reservas_tipo) lineas.push(`• ${inf.reservas_web} ${inf.reservas_tipo} hechas por internet`);
  lineas.push("", "Un saludo, Firztnet");
  return lineas.join("\n");
}

function imprimirInforme(inf) {
  const max = Math.max(1, ...inf.por_dia.map((d) => d.visitas));
  const ancho = 640, alto = 160, paso = ancho / inf.por_dia.length;
  const barras = inf.por_dia.map((d, i) => {
    const h = Math.round((d.visitas / max) * (alto - 20));
    return `<rect x="${(i * paso + 1).toFixed(1)}" y="${alto - h}" width="${Math.max(2, paso - 3).toFixed(1)}" height="${h}" rx="2" fill="#2563EB"/>`
      + (i % 5 === 0 ? `<text x="${(i * paso + paso / 2).toFixed(1)}" y="${alto + 14}" font-size="10" text-anchor="middle" fill="#64748B">${Number(d.fecha.slice(8))}</text>` : "");
  }).join("");
  const origenes = inf.origenes.map((o) => `<tr><td>${escHtml(o.nombre)}</td><td class="n">${o.visitas}</td><td class="bar"><span style="width:${o.pct}%"></span></td><td class="n">${o.pct} %</td></tr>`).join("");
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe de visitas · ${escHtml(inf.local.nombre)} · ${escHtml(nombreMes(inf.mes))}</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif; color: #0F172A; margin: 0; padding: 24px; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #2563EB; padding-bottom: 12px; margin-bottom: 20px; }
  .marca { font-size: 22px; font-weight: 800; letter-spacing: 0.04em; } .marca span { color: #F59E0B; }
  h1 { font-size: 24px; margin: 0 0 4px; } .sub { color: #64748B; font-size: 13px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
  .kpi { border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px; } .kpi b { display: block; font-size: 24px; } .kpi small { color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  h2 { font-size: 15px; margin: 22px 0 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; } td { padding: 6px 4px; border-bottom: 1px solid #F1F5F9; }
  td.n { text-align: right; width: 60px; font-weight: 700; } td.bar { width: 40%; } td.bar span { display: block; height: 10px; border-radius: 6px; background: #2563EB; }
  .nota { margin-top: 26px; padding: 12px 14px; background: #EFF6FF; border-radius: 10px; font-size: 12.5px; color: #1E3A8A; }
  footer { margin-top: 28px; font-size: 11px; color: #94A3B8; text-align: center; }
</style></head><body>
<header><div><h1>Informe de visitas de tu web</h1><div class="sub">${escHtml(inf.local.nombre)} · ${escHtml(inf.local.direccion_web || "")} · ${escHtml(nombreMes(inf.mes))}</div></div>
<div class="marca">FIRZT<span>NET</span></div></header>
<div class="kpis">
  <div class="kpi"><small>Visitas</small><b>${inf.visitas}</b><span class="sub">${escHtml(textoCambio(inf))}</span></div>
  <div class="kpi"><small>Media al día</small><b>${String(inf.media_diaria).replace(".", ",")}</b></div>
  <div class="kpi"><small>Desde el móvil</small><b>${inf.movil_pct ?? "—"}${inf.movil_pct !== null ? " %" : ""}</b></div>
  ${inf.reservas_tipo ? `<div class="kpi"><small>${escHtml(inf.reservas_tipo)} por internet</small><b>${inf.reservas_web}</b><span class="sub">mes anterior: ${inf.reservas_web_mes_anterior}</span></div>` : `<div class="kpi"><small>Mejor día</small><b>${inf.mejor_dia_semana ? escHtml(inf.mejor_dia_semana) : "—"}</b></div>`}
</div>
<h2>Visitas cada día</h2>
<svg viewBox="0 0 ${ancho} ${alto + 20}" width="100%" role="img" aria-label="Visitas por día">${barras}</svg>
<h2>Cómo llegan a tu web</h2>
<table>${origenes || '<tr><td>Todavía no hay visitas este mes.</td></tr>'}</table>
${inf.mejor_dia ? `<div class="nota">📈 El día con más visitas fue el <b>${new Date(`${inf.mejor_dia.fecha}T12:00:00`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</b> (${inf.mejor_dia.visitas} visitas), y el día de la semana que más gente entra suele ser el <b>${escHtml(inf.mejor_dia_semana)}</b>: buen día para publicar en redes o lanzar una oferta.</div>` : ""}
<footer>Informe preparado por Firztnet · contacto@firztnet.es · Las visitas se cuentan sin cookies ni datos personales de tus clientes.</footer>
<script>window.onload = () => setTimeout(() => window.print(), 300);</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) { alert("El navegador ha bloqueado la ventana. Permite las ventanas emergentes para imprimir el informe."); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function InformeVisitas({ local }) {
  const [inf, setInf] = useState(null);
  const [mes, setMes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet(`/central/clientes/${local.id}/informe${mes ? `?mes=${mes}` : ""}`)
      .then((d) => { setInf(d); if (!mes) setMes(d.mes); })
      .catch(() => setError("No se pudo cargar el informe."));
  }, [local.id, mes]);

  if (error) return <div style={{ fontSize: 12.5, color: COLORS.rust }}>{error}</div>;
  if (!inf) return <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando el informe...</div>;
  const whatsapp = enlaceWhatsapp(local.contacto_telefono, resumenTexto(inf));
  const correo = local.contacto_email ? `mailto:${local.contacto_email}?subject=${encodeURIComponent(`Visitas de tu web · ${nombreMes(inf.mes)}`)}&body=${encodeURIComponent(resumenTexto(inf))}` : null;
  const meses = inf.meses.length ? inf.meses : [inf.mes];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <select value={mes} onChange={(e) => setMes(e.target.value)} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "6px 10px", fontSize: 13, fontFamily: "Inter", textTransform: "capitalize" }}>
          {meses.map((m) => <option key={m} value={m}>{nombreMes(m)}</option>)}
        </select>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={() => imprimirInforme(inf)} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "6px 10px", fontSize: 11.5 }}><Printer size={13} /> Imprimir o guardar PDF</button>
          {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle("#16A34A", "#FFFFFF"), flex: "none", textDecoration: "none", padding: "6px 10px", fontSize: 11.5 }}>Enviar resumen por WhatsApp</a>}
          {correo && <a href={correo} style={{ ...btnStyle("transparent", COLORS.text, COLORS.line), flex: "none", textDecoration: "none", padding: "6px 10px", fontSize: 11.5 }}>✉️ Por correo</a>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginBottom: 10 }}>
        {[
          ["Visitas", inf.visitas, textoCambio(inf), inf.cambio_pct !== null && inf.cambio_pct < 0 ? COLORS.rust : COLORS.green],
          ["Media al día", String(inf.media_diaria).replace(".", ","), "", null],
          ["Desde el móvil", inf.movil_pct === null ? "—" : `${inf.movil_pct} %`, "", null],
          ...(inf.reservas_tipo ? [[`${inf.reservas_tipo} por internet`, inf.reservas_web, `mes anterior: ${inf.reservas_web_mes_anterior}`, null]] : []),
        ].map(([k, v, sub, color]) => (
          <div key={k} style={{ background: COLORS.surface, borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase" }}>{k}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>{v}</div>
            {sub && <div style={{ fontSize: 11, color: color || COLORS.textDim, fontWeight: color ? 700 : 400 }}>{sub}</div>}
          </div>
        ))}
      </div>
      {inf.visitas === 0 ? (
        <div style={{ fontSize: 12.5, color: COLORS.textDim, padding: "8px 0" }}>Todavía no hay visitas contadas este mes. Se empiezan a contar desde que se activó el contador.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
          <div style={{ background: COLORS.surface, borderRadius: 8, padding: 10, height: 190 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textDim, marginBottom: 4 }}>Visitas cada día</div>
            <ResponsiveContainer width="100%" height={155}>
              <BarChart data={inf.por_dia.map((d) => ({ dia: Number(d.fecha.slice(8)), visitas: d.visitas }))}>
                <XAxis dataKey="dia" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} width={28} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, "Visitas"]} labelFormatter={(d) => `Día ${d}`} />
                <Bar dataKey="visitas" fill={COLORS.amber} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: COLORS.surface, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textDim, marginBottom: 6 }}>Cómo llegan</div>
            {inf.origenes.map((o) => (
              <div key={o.origen} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span>{o.nombre}</span><strong>{o.visitas} · {o.pct} %</strong></div>
                <div style={{ height: 6, borderRadius: 4, background: COLORS.surfaceRaised }}><div style={{ width: `${o.pct}%`, height: "100%", borderRadius: 4, background: COLORS.amber }} /></div>
              </div>
            ))}
            {inf.mejor_dia_semana && <div style={{ fontSize: 11.5, color: COLORS.textDim, marginTop: 8 }}>📈 El día que más entran suele ser el <strong>{inf.mejor_dia_semana}</strong>.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function CuotaCliente({ f, onGuardada }) {
  const [valor, setValor] = useState(f.cuota_manual_cents === null || f.cuota_manual_cents === undefined ? "" : String(f.cuota_manual_cents / 100).replace(".", ","));
  const [aviso, setAviso] = useState("");
  async function guardar() {
    const texto = valor.trim().replace(",", ".");
    const cents = texto === "" ? null : Math.round(Number(texto) * 100);
    if (cents !== null && (!Number.isFinite(cents) || cents < 0)) { setAviso("Escribe un importe, por ejemplo 39 o 39,90"); return; }
    try {
      onGuardada(await apiPatch(`/central/clientes/${f.id}`, { cuota_manual_cents: cents }));
      setAviso("Guardado");
      setTimeout(() => setAviso(""), 2000);
    } catch (e) { setAviso(e.message); }
  }
  return (
    <div style={{ background: COLORS.surface, borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase" }}>Cuánto te paga al mes</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
        <input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder={f.ingreso_mes_cents ? String(f.ingreso_mes_cents / 100).replace(".", ",") : "0"} style={{ width: 90, border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: "5px 8px", fontSize: 13, fontFamily: "Inter" }} />
        <span style={{ fontSize: 13 }}>€</span>
        <button onClick={guardar} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "5px 10px", fontSize: 11.5 }}>Guardar</button>
        {aviso && <span style={{ fontSize: 11.5, color: aviso === "Guardado" ? COLORS.green : COLORS.rust }}>{aviso}</span>}
      </div>
      <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>
        {f.cuota_manual_cents !== null && f.cuota_manual_cents !== undefined ? "Puesto por ti." : f.ingreso_mes_cents ? `Según su sistema: ${euros(f.ingreso_mes_cents)} al mes. Escríbelo solo si es distinto.` : "Su sistema no lo indica: escríbelo para que cuente en tus ingresos."}
      </div>
    </div>
  );
}

function FichaCliente({ id, onCerrar }) {
  const [f, setF] = useState(null);
  const [notas, setNotas] = useState("");
  const [guardado, setGuardado] = useState("");

  useEffect(() => {
    apiGet(`/central/clientes/${id}`).then((d) => { setF(d); setNotas(d.notas || ""); }).catch(() => setGuardado("No se pudo cargar la ficha"));
  }, [id]);

  async function guardarNotas() {
    try {
      const d = await apiPatch(`/central/clientes/${id}`, { notas });
      setF(d);
      setGuardado("Notas guardadas");
      setTimeout(() => setGuardado(""), 2000);
    } catch (e) {
      setGuardado(`No se pudo guardar: ${e.message}`);
    }
  }

  if (!f) return <div style={{ padding: 16, fontSize: 12.5, color: COLORS.textDim }}>{guardado || "Cargando la ficha..."}</div>;
  const e = ESTADO_LOCAL[f.estado] || ESTADO_LOCAL.baja;
  const sistema = SISTEMAS_AYUDA[f.sistema] || { label: f.sistema, color: COLORS.slate };
  const whatsapp = enlaceWhatsapp(f.contacto_telefono, `Hola ${f.contacto_nombre || ""}, te escribimos de Firztnet: `);
  const caja = { background: COLORS.surfaceRaised, borderRadius: 10, padding: 12 };
  const titulo = { fontSize: 11.5, fontWeight: 800, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 };

  return (
    <div style={{ borderTop: `1px solid ${COLORS.line}`, marginTop: 12, paddingTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
      <div style={caja}>
        <div style={titulo}>Contacto</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.text }}>{f.contacto_nombre || "—"}</div>
        <div style={{ fontSize: 12.5, color: COLORS.textDim, marginTop: 2 }}>{f.contacto_email || "Sin correo"}</div>
        <div style={{ fontSize: 12.5, color: COLORS.textDim }}>{f.contacto_telefono || "Sin teléfono"}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {f.contacto_telefono && <a href={`tel:${f.contacto_telefono}`} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", textDecoration: "none", padding: "6px 10px", fontSize: 11.5 }}>📞 Llamar</a>}
          {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle("#16A34A", "#FFFFFF"), flex: "none", textDecoration: "none", padding: "6px 10px", fontSize: 11.5 }}>WhatsApp</a>}
          {f.contacto_email && <a href={`mailto:${f.contacto_email}`} style={{ ...btnStyle("transparent", COLORS.text, COLORS.line), flex: "none", textDecoration: "none", padding: "6px 10px", fontSize: 11.5 }}>✉️ Correo</a>}
          {f.direccion_web && <a href={`https://${f.direccion_web}`} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle("transparent", COLORS.text, COLORS.line), flex: "none", textDecoration: "none", padding: "6px 10px", fontSize: 11.5 }}>🌐 Su web</a>}
        </div>
      </div>
      <div style={caja}>
        <div style={titulo}>Contrato</div>
        <CuotaCliente f={f} onGuardada={(d) => setF(d)} />
        <div style={{ fontSize: 12.5, color: COLORS.text, lineHeight: 1.7 }}>
          <div>Sistema: <strong style={{ color: sistema.color }}>{sistema.label}</strong></div>
          <div>Estado: <strong style={{ color: e.color }}>{e.label}</strong>{textoPlazo(f) ? ` · ${textoPlazo(f)}` : ""}</div>
          <div>Alta: <strong>{fechaCorta(f.alta)}</strong></div>
          {f.prueba_hasta && <div>Prueba hasta: <strong>{fechaCorta(f.prueba_hasta)}</strong></div>}
          {f.renueva && <div>Renovación: <strong>{fechaCorta(f.renueva)}</strong></div>}
          <div>Negocios: <strong>{(f.negocios || []).map((n) => n.nombre).join(", ") || "—"}</strong></div>
        </div>
        {f.uso?.empresa && (
          <div style={{ fontSize: 12.5, color: COLORS.text, lineHeight: 1.7, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${COLORS.line}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase" }}>Su empresa (para tu factura)</div>
            <div>Razón social: <strong>{f.uso.empresa.razon_social || "—"}</strong></div>
            <div>NIF: {f.uso.nif_pendiente || !f.uso.empresa.nif
              ? <strong style={{ color: COLORS.statusAmber }}>⚠ Pendiente (aún no lo ha puesto en su panel)</strong>
              : <strong>{f.uso.empresa.nif}</strong>}</div>
            {f.uso.empresa.direccion && <div>Dirección fiscal: <strong>{f.uso.empresa.direccion}</strong></div>}
          </div>
        )}
      </div>
      <div style={caja}>
        <div style={titulo}>Uso este mes</div>
        {f.uso ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ...(f.uso.ventas_mes_cents !== undefined ? [["Ventas", euros(f.uso.ventas_mes_cents)], ["Tickets", f.uso.tickets_mes], [f.sistema === "peluquerias" ? "Citas" : "Personal", f.sistema === "peluquerias" ? f.uso.citas_mes : f.uso.personal]] : []),
              ...(f.uso.paquetes_mes !== undefined ? [["Paquetes este mes", f.uso.paquetes_mes], ["Repartidores", f.uso.repartidores], ["Solicitudes por la web", f.uso.solicitudes_web_mes]] : []),
              ...(f.uso.obras_activas !== undefined ? [["Obras en curso", f.uso.obras_activas], ["Presupuestos este mes", f.uso.presupuestos_mes], ["Solicitudes por la web", f.uso.solicitudes_web_mes], ["Operarios", f.uso.empleados]] : []),
              ...(f.uso.cuota_cents !== undefined ? [["Cuota", f.uso.cuota_cents ? `${euros(f.uso.cuota_cents)} ${f.uso.periodo || ""}` : "Sin cuota"]] : []),
              ...(f.uso.ultimo_pago !== undefined ? [["Último pago", f.uso.ultimo_pago ? `${euros(f.uso.ultimo_pago.importe_cents)} · ${fechaCorta(f.uso.ultimo_pago.fecha)}` : "—"]] : []),
              ...(f.visitas_mes !== undefined ? [["Visitas web", f.visitas_mes]] : []),
              ["Último uso", f.ultimo_uso ? haceCorto(f.ultimo_uso) : "nunca"],
            ].map(([k, v]) => (
              <div key={k} style={{ background: COLORS.surface, borderRadius: 8, padding: "6px 8px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase" }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.text }}>{v}</div>
              </div>
            ))}
          </div>
        ) : <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Sin datos de uso todavía.</div>}
        {f.uso?.tiene_web === false && <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 8 }}>Esta empresa no tiene la web activada.</div>}
        {f.uso?.titular_sin_estrenar && <div style={{ fontSize: 12, color: COLORS.statusAmber, fontWeight: 700, marginTop: 8 }}>⚠ El titular todavía no ha entrado nunca con su clave.</div>}
      </div>
      <div style={caja}>
        <div style={titulo}>Aparatos ({f.aparatos.length})</div>
        {f.aparatos.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Ningún aparato autorizado todavía.</div>}
        {f.aparatos.map((a, i) => {
          const viejo = !a.ultima_conexion || Date.now() - new Date(a.ultima_conexion).getTime() > 7 * 86400000;
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12.5, padding: "5px 0", borderBottom: i < f.aparatos.length - 1 ? `1px solid ${COLORS.line}` : "none" }}>
              <span>{TIPO_APARATO[a.tipo] || a.tipo} · <strong>{a.nombre || "Sin nombre"}</strong>{f.negocios?.length > 1 ? <span style={{ color: COLORS.textDim }}> · {a.negocio}</span> : null}</span>
              <span style={{ whiteSpace: "nowrap", color: viejo ? COLORS.statusAmber : COLORS.textDim, fontWeight: viejo ? 700 : 400 }}>{a.ultima_conexion ? haceCorto(a.ultima_conexion) : "nunca"}</span>
            </div>
          );
        })}
      </div>
      <div style={{ ...caja, gridColumn: "1 / -1" }}>
        <div style={titulo}>Informe de visitas de su web</div>
        <InformeVisitas local={f} />
      </div>
      <div style={{ ...caja, gridColumn: "1 / -1" }}>
        <div style={titulo}>Peticiones de ayuda ({f.ayudas.length})</div>
        {f.ayudas.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Nunca ha pedido ayuda.</div>}
        {f.ayudas.slice(0, 15).map((p) => {
          const est = ESTADOS_AYUDA.find((x) => x.key === p.estado) || ESTADOS_AYUDA[0];
          return (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5, padding: "6px 0", borderBottom: `1px solid ${COLORS.line}` }}>
              <span style={{ minWidth: 0 }}><strong>{p.referencia}</strong> · {TIPOS_AYUDA[p.tipo] || p.tipo} · {p.mensaje.slice(0, 90)}{p.mensaje.length > 90 ? "…" : ""} <span style={{ color: COLORS.textDim }}>· {horaCorta(p.fecha)}</span></span>
              <span style={{ fontWeight: 700, color: est.color, whiteSpace: "nowrap" }}>{est.label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ ...caja, gridColumn: "1 / -1" }}>
        <div style={titulo}>Tus notas sobre este cliente (solo las ves tú)</div>
        <textarea value={notas} onChange={(ev) => setNotas(ev.target.value)} rows={3} maxLength={4000} placeholder="Qué tiene instalado, cuánto paga, acuerdos, cosas a tener en cuenta..." style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, fontFamily: "Inter", resize: "vertical" }} />
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
          <button onClick={guardarNotas} disabled={notas === (f.notas || "")} style={{ ...btnStyle(notas === (f.notas || "") ? COLORS.surface : COLORS.amber, notas === (f.notas || "") ? COLORS.textDim : "#FFFFFF", COLORS.line), flex: "none", padding: "7px 12px" }}>Guardar notas</button>
          <button onClick={onCerrar} style={{ ...btnStyle("transparent", COLORS.textDim, COLORS.line), flex: "none", padding: "7px 12px" }}>Cerrar ficha</button>
          {guardado && <span style={{ fontSize: 12, color: guardado.startsWith("No") ? COLORS.rust : COLORS.green, fontWeight: 600 }}>{guardado}</span>}
        </div>
        <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 8 }}>Datos actualizados {haceCorto(f.sincronizado)}. Llegan solos de su plataforma cada 10 minutos.</div>
      </div>
    </div>
  );
}

function ClientesSistemasView() {
  const [lista, setLista] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [buscar, setBuscar] = useState("");
  const [abierta, setAbierta] = useState(null);

  const cargar = useCallback(async () => {
    try { setLista(await apiGet("/central/clientes")); } catch (e) { setLista([]); }
  }, []);
  useEffect(() => { cargar(); const t = setInterval(cargar, 120000); return () => clearInterval(t); }, [cargar]);

  if (!lista) return <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>;
  const vivos = lista.filter((l) => l.estado !== "baja");
  const cuenta = (fn) => vivos.filter(fn).length;
  const filtros = [
    ["todos", "Todos", vivos.length],
    ["activo", "Activos", cuenta((l) => l.estado === "activo")],
    ["prueba", "En prueba", cuenta((l) => l.estado === "prueba")],
    ["atencion", "Necesitan atención", cuenta((l) => (l.estado === "prueba" && l.dias !== null && l.dias <= 3) || l.estado === "prueba_vencida" || l.renovacion_vencida || l.ayudas_abiertas > 0)],
    ["suspendido", "Suspendidos", cuenta((l) => l.estado === "suspendido")],
    ["baja", "De baja", lista.length - vivos.length],
  ];
  const t = buscar.trim().toLowerCase();
  const visibles = lista.filter((l) => {
    if (t && !`${l.nombre} ${l.contacto_nombre || ""} ${l.contacto_email || ""} ${l.contacto_telefono || ""} ${l.slug}`.toLowerCase().includes(t)) return false;
    if (filtro === "todos") return l.estado !== "baja";
    if (filtro === "atencion") return l.estado !== "baja" && ((l.estado === "prueba" && l.dias !== null && l.dias <= 3) || l.estado === "prueba_vencida" || l.renovacion_vencida || l.ayudas_abiertas > 0);
    return l.estado === filtro;
  });
  const ventasMes = vivos.reduce((s, l) => s + (l.uso?.ventas_mes_cents || 0), 0);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 16 }}>
        <StatCard label="Clientes" value={vivos.length} icon={Users} accent={COLORS.amber} />
        <StatCard label="Activos" value={cuenta((l) => l.estado === "activo")} icon={CheckCircle2} accent={COLORS.green} />
        <StatCard label="En prueba" value={cuenta((l) => l.estado === "prueba")} icon={Clock} accent={COLORS.statusBlue} />
        <StatCard label="Ventas de tus clientes este mes" value={euros(ventasMes)} icon={TrendingUp} accent={COLORS.violet} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {filtros.map(([k, label, n]) => (
            <button key={k} onClick={() => setFiltro(k)} style={{ ...btnStyle(filtro === k ? COLORS.amber : "transparent", filtro === k ? "#FFFFFF" : COLORS.textDim, filtro === k ? null : COLORS.line), flex: "none", padding: "6px 12px", fontSize: 12 }}>
              {label} · {n}
            </button>
          ))}
        </div>
        <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar cliente, contacto, teléfono..." style={{ border: `1px solid ${COLORS.line}`, borderRadius: 999, padding: "8px 14px", fontSize: 13, fontFamily: "Inter", minWidth: 240 }} />
      </div>
      {lista.length === 0 && (
        <div style={{ fontSize: 13, color: COLORS.textDim, background: COLORS.surface, border: `1px dashed ${COLORS.line}`, borderRadius: 12, padding: 18 }}>
          Todavía no ha llegado ningún cliente. Las plataformas de hostelería y peluquerías mandan su lista sola cada 10 minutos.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visibles.map((l) => {
          const e = ESTADO_LOCAL[l.estado] || ESTADO_LOCAL.baja;
          const sistema = SISTEMAS_AYUDA[l.sistema] || { label: l.sistema, color: COLORS.slate };
          const urgente = (l.estado === "prueba" && l.dias !== null && l.dias <= 3) || l.estado === "prueba_vencida" || l.renovacion_vencida;
          return (
            <div key={l.id} style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.line}`, borderRight: `1px solid ${COLORS.line}`, borderBottom: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${sistema.color}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", cursor: "pointer" }} onClick={() => setAbierta(abierta === l.id ? null : l.id)}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{l.nombre}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: sistema.color, border: `1px solid ${sistema.color}`, borderRadius: 999, padding: "2px 8px" }}>{sistema.label}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: e.color, background: e.fondo, borderRadius: 999, padding: "2px 8px" }}>{e.label}</span>
                    {textoPlazo(l) && <span style={{ fontSize: 11.5, fontWeight: urgente ? 800 : 500, color: urgente ? COLORS.rust : COLORS.textDim }}>{urgente ? "⏳ " : ""}{textoPlazo(l)}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 3 }}>
                    {l.contacto_nombre || "—"}{l.contacto_telefono ? ` · ${l.contacto_telefono}` : ""} · {l.direccion_web}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center", fontSize: 12, color: COLORS.textDim }}>
                  {l.visitas_mes !== undefined && <span title="Visitas de su web este mes">👁 <strong style={{ color: COLORS.text }}>{l.visitas_mes}</strong> visitas</span>}
                  {l.uso && l.uso.ventas_mes_cents !== undefined && <span title="Ventas este mes"><strong style={{ color: COLORS.text }}>{euros(l.uso.ventas_mes_cents)}</strong> este mes</span>}
                  <span title="Aparatos">🖥 {l.num_aparatos}{l.aparatos_sin_conexion ? <span style={{ color: COLORS.statusAmber, fontWeight: 700 }}> ({l.aparatos_sin_conexion} sin conectar)</span> : ""}</span>
                  <span title="Peticiones de ayuda abiertas" style={{ color: l.ayudas_abiertas ? COLORS.rust : COLORS.textDim, fontWeight: l.ayudas_abiertas ? 800 : 400 }}>🛟 {l.ayudas_abiertas}</span>
                  <ChevronDown size={16} style={{ transform: abierta === l.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </div>
              </div>
              {abierta === l.id && <FichaCliente id={l.id} onCerrar={() => { setAbierta(null); cargar(); }} />}
            </div>
          );
        })}
        {lista.length > 0 && visibles.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Ningún cliente con ese filtro.</div>}
      </div>
    </div>
  );
}

// -------------------- vista: Cuadro de mando (Firztnet Central) --------------------
// Cómo va tu negocio de un vistazo: ingresos fijos al mes, clientes que pagan y en prueba,
// conversión de pruebas, altas y bajas, lo que vence pronto, la ayuda y la salud de todo.
const EVENTO_TEXTO = {
  alta: ["🆕", "Nuevo cliente"], activo: ["✅", "Pasa a cliente que paga"], prueba: ["🧪", "Vuelve a prueba"],
  prueba_vencida: ["⌛", "Termina la prueba sin pagar"], suspendido: ["⛔", "Suspendido"], baja: ["👋", "Se da de baja"],
};

function Kpi({ titulo, valor, sub, color, grande }) {
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.4 }}>{titulo}</div>
      <div style={{ fontSize: grande ? 30 : 24, fontWeight: 800, color: color || COLORS.text, lineHeight: 1.1 }}>{valor}</div>
      {sub && <div style={{ fontSize: 12, color: COLORS.textDim }}>{sub}</div>}
    </div>
  );
}

function CuadroMandoView({ onIrVista }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try { setD(await apiGet("/central/cuadro")); setError(""); } catch (e) { setError("No se pudo cargar el cuadro de mando."); }
  }, []);
  useEffect(() => { cargar(); const t = setInterval(cargar, 120000); return () => clearInterval(t); }, [cargar]);

  if (!d) return <div style={{ fontSize: 12.5, color: error ? COLORS.rust : COLORS.textDim }}>{error || "Cargando..."}</div>;

  const cambio = d.ingresos_hace_30_cents === null ? null : d.ingresos_mes_cents - d.ingresos_hace_30_cents;
  const historia = d.historia.map((h) => ({ dia: new Date(`${h.fecha}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short" }), euros: h.ingresos_mes_cents / 100, pagando: h.pagando }));
  const caja = { background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 16 };
  const titulo = { fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 10 };
  const maxSistema = Math.max(1, ...d.por_sistema.map((s) => s.ingresos_mes_cents));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginBottom: 16, padding: "20px 22px", borderRadius: 16, color: "#FFFFFF",
        background: "radial-gradient(500px circle at 0% 0%, rgba(255,255,255,0.18), transparent 60%), linear-gradient(135deg, #1D4ED8, #0F1B3D)" }}>
        <TrendingUp size={34} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", opacity: 0.85 }}>Ingresos fijos al mes</div>
          <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1 }}>{euros(d.ingresos_mes_cents)}</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            {cambio === null ? "Se compara con el mes pasado cuando haya 30 días de datos" : cambio === 0 ? "Igual que hace 30 días" : `${cambio > 0 ? "▲ +" : "▼ "}${euros(cambio)} respecto a hace 30 días`}
            {" · "}{euros(d.ingresos_anual_cents)} al año
          </div>
          {d.prueba_potencial_cents > 0 && (
            <div style={{ display: "inline-block", marginTop: 8, padding: "4px 10px", borderRadius: 999, background: "rgba(134,239,172,0.18)", border: "1px solid rgba(134,239,172,0.45)", fontSize: 13, fontWeight: 700 }}>
              🌱 +{euros(d.prueba_potencial_cents)} al mes si se quedan {d.prueba_con_cuota === 1 ? "el que está" : `los ${d.prueba_con_cuota} que están`} en prueba → {euros(d.ingresos_mes_cents + d.prueba_potencial_cents)}
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: "4px 22px", fontSize: 13 }}>
          {[["Clientes que pagan", d.pagando], ["En prueba", d.en_prueba], ["Ticket medio", euros(d.ticket_medio_cents)]].map(([k, v]) => (
            <div key={k}><div style={{ opacity: 0.8, fontSize: 11.5 }}>{k}</div><div style={{ fontSize: 20, fontWeight: 800 }}>{v}</div></div>
          ))}
        </div>
      </div>

      {d.sin_cuota > 0 && (
        <div onClick={() => onIrVista?.("clientes-sistemas")} style={{ cursor: "pointer", marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: COLORS.tintAmbar, border: "1px solid #FCD34D", fontSize: 13, color: COLORS.tintAmbarTx }}>
          💡 {d.sin_cuota} cliente{d.sin_cuota > 1 ? "s" : ""} que paga{d.sin_cuota > 1 ? "n" : ""} no tiene{d.sin_cuota > 1 ? "n" : ""} cuota apuntada, y no cuenta{d.sin_cuota > 1 ? "n" : ""} en tus ingresos. Ábrelos en «Clientes de sistemas» y pon «Cuánto te paga al mes».
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 16 }}>
        <Kpi titulo="Si se quedan los de prueba" valor={`+${euros(d.prueba_potencial_cents || 0)}`} color={d.prueba_potencial_cents ? COLORS.green : COLORS.text}
          sub={d.en_prueba ? (d.prueba_con_cuota < d.en_prueba ? `al mes · ${d.en_prueba - d.prueba_con_cuota} en prueba sin cuota puesta` : "al mes más") : "nadie en prueba ahora"} />
        <Kpi titulo="Altas este mes" valor={d.altas_mes} color={COLORS.green} />
        <Kpi titulo="Bajas este mes" valor={d.bajas_mes} color={d.bajas_mes ? COLORS.rust : COLORS.text} />
        <Kpi titulo="Pruebas que pagan" valor={d.conversion_pct === null ? "—" : `${d.conversion_pct} %`} sub="últimos 90 días" />
        <Kpi titulo="Pruebas que acaban en 7 días" valor={d.pruebas_7_dias} color={d.pruebas_7_dias ? COLORS.statusBlue : COLORS.text} sub="buen momento para llamar" />
        <Kpi titulo="Renovaciones vencidas" valor={d.renovaciones_vencidas} color={d.renovaciones_vencidas ? COLORS.rust : COLORS.text} />
        <Kpi titulo="Ayudas abiertas" valor={d.ayudas_abiertas} sub={d.respuesta_media_min === null ? "" : `respondes en ${d.respuesta_media_min < 60 ? `${d.respuesta_media_min} min` : `${Math.round(d.respuesta_media_min / 60)} h`} de media`} color={d.ayudas_abiertas ? COLORS.statusAmber : COLORS.text} />
        <Kpi titulo="Sistemas y webs" valor={d.salud.caidos ? `${d.salud.caidos} caído${d.salud.caidos > 1 ? "s" : ""}` : "Todo bien"} sub={`${d.salud.total} vigilados`} color={d.salud.caidos ? COLORS.rust : COLORS.green} />
        <div onClick={() => onIrVista?.("riesgo")} style={{ cursor: "pointer" }}><Kpi titulo="Clientes en riesgo" valor={d.en_riesgo ?? 0} color={d.en_riesgo ? COLORS.rust : COLORS.green} sub="pulsa para verlos" /></div>
        <Kpi titulo="Visitas a webs de clientes" valor={d.visitas_webs_mes.toLocaleString("es-ES")} sub="este mes" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: 14 }}>
        <div style={caja}>
          <div style={titulo}>Evolución de tus ingresos fijos</div>
          {historia.length < 2 ? (
            <div style={{ fontSize: 12.5, color: COLORS.textDim, padding: "30px 0", textAlign: "center" }}>La gráfica se va dibujando sola: cada día se guarda una foto de tus ingresos.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={historia}>
                <defs><linearGradient id="fnIngresos" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.amber} stopOpacity={0.35} /><stop offset="100%" stopColor={COLORS.amber} stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="dia" tick={{ fontSize: 10 }} minTickGap={24} />
                <YAxis tick={{ fontSize: 10 }} width={44} tickFormatter={(v) => `${v} €`} />
                <Tooltip formatter={(v, n) => (n === "euros" ? [`${Number(v).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`, "Ingresos al mes"] : [v, "Clientes que pagan"])} />
                <Area type="monotone" dataKey="euros" stroke={COLORS.amber} strokeWidth={2.5} fill="url(#fnIngresos)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={caja}>
          <div style={titulo}>Por sistema</div>
          {d.por_sistema.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Todavía no hay clientes.</div>}
          {d.por_sistema.map((s) => {
            const info = SISTEMAS_AYUDA[s.sistema] || { label: s.sistema, color: COLORS.slate };
            return (
              <div key={s.sistema} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span><strong style={{ color: info.color }}>{info.label}</strong> <span style={{ color: COLORS.textDim }}>{s.clientes ? `· ${s.pagando} pagan · ${s.prueba} en prueba` : "· sin clientes todavía"}</span></span>
                  <strong>{euros(s.ingresos_mes_cents)}</strong>
                </div>
                <div style={{ height: 8, borderRadius: 6, background: COLORS.surfaceRaised, marginTop: 4 }}>
                  <div style={{ width: `${Math.max(2, (s.ingresos_mes_cents * 100) / maxSistema)}%`, height: "100%", borderRadius: 6, background: info.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
        <div style={caja}>
          <div style={titulo}>Lo que vence en los próximos 14 días</div>
          {d.proximos.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Nada urgente. 👌</div>}
          {d.proximos.map((p) => {
            const info = SISTEMAS_AYUDA[p.sistema] || { label: p.sistema, color: COLORS.slate };
            const wa = enlaceWhatsapp(p.telefono, "Hola, te escribimos de Firztnet: ");
            const texto = p.tipo === "prueba" ? (p.dias === 0 ? "La prueba termina hoy" : `La prueba termina en ${p.dias} día${p.dias > 1 ? "s" : ""}`)
              : p.tipo === "vencida" ? "Renovación vencida" : `Renueva en ${p.dias} día${p.dias !== 1 ? "s" : ""}${p.importe_cents ? ` · ${euros(p.importe_cents)}` : ""}`;
            return (
              <div key={`${p.id}-${p.tipo}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${COLORS.line}` }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: info.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>
                  <strong>{p.nombre}</strong> <span style={{ color: COLORS.textDim }}>· {info.label}</span>
                  <div style={{ color: p.tipo === "vencida" || p.dias <= 2 ? COLORS.rust : COLORS.textDim, fontWeight: p.dias <= 2 ? 700 : 400 }}>{texto}</div>
                </div>
                {wa && <a href={wa} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle("#16A34A", "#FFFFFF"), flex: "none", textDecoration: "none", padding: "5px 9px", fontSize: 11 }}>WhatsApp</a>}
              </div>
            );
          })}
        </div>
        <div style={caja}>
          <div style={titulo}>Últimos movimientos de clientes</div>
          {d.recientes.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Aquí irán apareciendo las altas, las pruebas que pasan a pagar y las bajas.</div>}
          {d.recientes.map((e, i) => {
            const [ico, texto] = EVENTO_TEXTO[e.tipo] || ["•", e.tipo];
            return (
              <div key={i} style={{ display: "flex", gap: 10, fontSize: 12.5, padding: "6px 0", borderBottom: `1px solid ${COLORS.line}` }}>
                <span>{ico}</span>
                <span style={{ flex: 1 }}><strong>{e.nombre}</strong> · {texto} <span style={{ color: COLORS.textDim }}>· {SISTEMAS_AYUDA[e.sistema]?.label || e.sistema}</span></span>
                <span style={{ color: COLORS.textDim, whiteSpace: "nowrap" }}>{haceCorto(e.fecha)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -------------------- vista: Informes mensuales (Firztnet Central) --------------------
// El día 1 se preparan solos los informes de visitas del mes anterior. Aquí los revisas
// (cómo le llega el correo a cada cliente) y SOLO se envían los que aceptas.
const ESTADO_INFORME = {
  preparado: ["Pendiente de tu revisión", COLORS.statusBlue],
  enviado: ["Enviado", COLORS.green],
  descartado: ["No se envía", COLORS.textDim],
  error: ["No se pudo enviar", COLORS.rust],
};

function InformesMensualesView() {
  const [d, setD] = useState(null);
  const [mes, setMes] = useState("");
  const [marcados, setMarcados] = useState(new Set());
  const [vista, setVista] = useState(null); // { id, html, asunto, email }
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async (m) => {
    try {
      const datos = await apiGet(`/central/informes${m ? `?mes=${m}` : ""}`);
      setD(datos);
      if (!m) setMes(datos.mes);
      setMarcados(new Set(datos.informes.filter((i) => i.estado === "preparado").map((i) => i.id)));
    } catch (e) { setAviso("No se pudieron cargar los informes."); }
  }, []);
  useEffect(() => { cargar(mes); }, [cargar, mes]);

  async function preparar() {
    setOcupado(true); setAviso("");
    try {
      const r = await apiPost("/central/informes/preparar", { mes });
      setAviso(r.preparados ? `Preparados ${r.preparados} informe(s). Revísalos antes de enviarlos.` : "Ningún cliente con correo y visitas ese mes. (Las visitas se cuentan desde el 8 de noviembre de 2026.)");
      await cargar(mes);
    } catch (e) { setAviso(e.message); } finally { setOcupado(false); }
  }

  async function verInforme(i) {
    try { setVista({ id: i.id, ...(await apiGet(`/central/informes/${i.id}/vista`)) }); } catch (e) { setAviso(e.message); }
  }

  async function cambiar(i, cambios) {
    try { await apiPatch(`/central/informes/${i.id}`, cambios); await cargar(mes); } catch (e) { setAviso(e.message); }
  }

  async function enviar(ids) {
    if (!ids.length) return;
    if (!window.confirm(`¿Aceptas y envías ${ids.length} informe(s) por correo a tus clientes?`)) return;
    setOcupado(true); setAviso("");
    try {
      const r = await apiPost("/central/informes/enviar", { ids });
      setAviso(`✓ Enviados: ${r.enviados}${r.fallos.length ? ` · No se pudieron enviar: ${r.fallos.length} (mira el motivo en cada uno)` : ""}`);
      setVista(null);
      await cargar(mes);
    } catch (e) { setAviso(e.message); } finally { setOcupado(false); }
  }

  if (!d) return <div style={{ fontSize: 12.5, color: COLORS.textDim }}>{aviso || "Cargando..."}</div>;
  const pendientes = d.informes.filter((i) => i.estado === "preparado" || i.estado === "error");
  // Siempre se pueden elegir el mes pasado y el mes en curso (este, para ver cómo va antes de que acabe)
  const mesActual = new Date().toISOString().slice(0, 7);
  const meses = Array.from(new Set([mesActual, d.mes, ...d.meses])).sort().reverse();

  return (
    <div>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 16, marginBottom: 14, fontSize: 13, color: COLORS.textDim, lineHeight: 1.6 }}>
        📈 <strong style={{ color: COLORS.text }}>Cómo funciona:</strong> el <strong>día 1 de cada mes</strong> se preparan solos los informes de visitas del mes anterior para tus clientes en prueba o activos que tienen correo y visitas, y te llega un aviso. <strong>No sale ningún correo hasta que tú lo aceptes aquí.</strong>
        {!d.correo_listo && <div style={{ marginTop: 8, color: COLORS.rust, fontWeight: 700 }}>⚠ Falta configurar el envío de correos (RESEND_API_KEY en Railway). Puedes preparar y revisar los informes, pero todavía no enviarlos.</div>}
        {d.correo_listo && d.remitente === "onboarding@resend.dev" && <div style={{ marginTop: 8, color: COLORS.statusAmber, fontWeight: 700 }}>⚠ Los correos salen todavía desde la dirección de pruebas de Resend: solo llegan a tu propia cuenta. Para que lleguen a tus clientes hay que verificar firztnet.es en Resend.</div>}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <select value={mes} onChange={(e) => setMes(e.target.value)} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "Inter" }}>
          {meses.map((m) => <option key={m} value={m}>{nombreMes(m)}</option>)}
        </select>
        <button onClick={preparar} disabled={ocupado} style={{ ...btnStyle("transparent", COLORS.text, COLORS.line), flex: "none", padding: "7px 12px" }}>
          <RefreshCw size={13} /> {d.informes.length ? "Volver a preparar" : "Preparar ahora"}
        </button>
        <div style={{ flex: 1 }} />
        {pendientes.length > 0 && (
          <button onClick={() => enviar([...marcados])} disabled={ocupado || !marcados.size || !d.correo_listo} style={{ ...btnStyle(COLORS.green, "#FFFFFF"), flex: "none", padding: "9px 14px", opacity: !marcados.size || !d.correo_listo ? 0.5 : 1 }}>
            <CheckCircle2 size={14} /> Aceptar y enviar los marcados ({marcados.size})
          </button>
        )}
      </div>
      {aviso && <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 600, color: aviso.startsWith("✓") || aviso.startsWith("Preparados") ? COLORS.green : COLORS.rust }}>{aviso}</div>}

      {d.informes.length === 0 && (
        <div style={{ fontSize: 13, color: COLORS.textDim, background: COLORS.surface, border: `1px dashed ${COLORS.line}`, borderRadius: 12, padding: 18 }}>
          No hay informes de {nombreMes(mes)}. Se preparan solos el día 1; si quieres verlos ya, pulsa «Preparar ahora».
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {d.informes.map((i) => {
          const [texto, color] = ESTADO_INFORME[i.estado] || ESTADO_INFORME.preparado;
          const info = SISTEMAS_AYUDA[i.sistema] || { label: i.sistema, color: COLORS.slate };
          const editable = i.estado === "preparado" || i.estado === "error";
          return (
            <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${info.color}`, borderRadius: 12, padding: "10px 14px", opacity: i.estado === "descartado" ? 0.6 : 1 }}>
              {editable && <input type="checkbox" checked={marcados.has(i.id)} aria-label={`Enviar el informe de ${i.cliente}`}
                onChange={(e) => setMarcados((prev) => { const n = new Set(prev); if (e.target.checked) n.add(i.id); else n.delete(i.id); return n; })} />}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{i.cliente} <span style={{ fontSize: 11, color: info.color, fontWeight: 700 }}>· {info.label}</span></div>
                <div style={{ fontSize: 12, color: COLORS.textDim }}>
                  {editable ? (
                    <input defaultValue={i.email} onBlur={(e) => e.target.value.trim() !== i.email && cambiar(i, { email: e.target.value.trim() })} aria-label="Correo del cliente"
                      style={{ border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: "2px 6px", fontSize: 12, fontFamily: "Inter", width: 230 }} />
                  ) : i.email}
                  {" · "}{i.visitas} visitas{i.cambio_pct !== null ? ` (${i.cambio_pct > 0 ? "+" : ""}${i.cambio_pct} %)` : ""}
                </div>
                {i.error && <div style={{ fontSize: 11.5, color: COLORS.rust }}>{i.error}</div>}
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 800, color }}>{texto}{i.enviado ? ` · ${haceCorto(i.enviado)}` : ""}</span>
              <button onClick={() => verInforme(i)} style={{ ...btnStyle("transparent", COLORS.text, COLORS.line), flex: "none", padding: "6px 10px", fontSize: 12 }}><Eye size={13} /> Ver correo</button>
              {i.estado === "preparado" && <button onClick={() => cambiar(i, { estado: "descartado" })} style={{ ...btnStyle("transparent", COLORS.textDim, COLORS.line), flex: "none", padding: "6px 10px", fontSize: 12 }}>No enviar</button>}
              {i.estado === "descartado" && <button onClick={() => cambiar(i, { estado: "preparado" })} style={{ ...btnStyle("transparent", COLORS.textDim, COLORS.line), flex: "none", padding: "6px 10px", fontSize: 12 }}>Recuperar</button>}
            </div>
          );
        })}
      </div>

      {vista && (
        <div role="dialog" aria-modal="true" onClick={() => setVista(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 90, display: "grid", placeItems: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.surface, borderRadius: 14, width: "min(680px, 100%)", maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 13 }}>
              <div><strong>Para:</strong> {vista.email}</div>
              <div><strong>Asunto:</strong> {vista.asunto}</div>
            </div>
            <iframe title="Vista del correo" srcDoc={vista.html} sandbox="" style={{ border: 0, width: "100%", height: "65vh" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 12, borderTop: `1px solid ${COLORS.line}` }}>
              <button onClick={() => setVista(null)} style={{ ...btnStyle("transparent", COLORS.textDim, COLORS.line), flex: "none", padding: "8px 14px" }}>Cerrar</button>
              {d.informes.find((x) => x.id === vista.id && (x.estado === "preparado" || x.estado === "error")) && (
                <button onClick={() => enviar([vista.id])} disabled={ocupado || !d.correo_listo} style={{ ...btnStyle(COLORS.green, "#FFFFFF"), flex: "none", padding: "8px 14px", opacity: d.correo_listo ? 1 : 0.5 }}>
                  <CheckCircle2 size={14} /> Aceptar y enviar este
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------- vista: Clientes en riesgo (Firztnet Central) --------------------
// Quién podrías perder y por qué, para llamarle antes de que se vaya.
function RiesgoView() {
  const [lista, setLista] = useState(null);
  const cargar = useCallback(async () => { try { setLista(await apiGet("/central/riesgo")); } catch (e) { setLista([]); } }, []);
  useEffect(() => { cargar(); }, [cargar]);

  async function contactado(c, dias) {
    try { await apiPost(`/central/riesgo/${c.id}/contactado`, { dias }); cargar(); window.dispatchEvent(new Event("fn:notificaciones-actualizar")); } catch (e) { alert(e.message); }
  }

  if (!lista) return <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>;
  const altos = lista.filter((c) => c.nivel === "alto").length;
  const enJuego = lista.reduce((s, c) => s + c.ingreso_mes_cents, 0);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 14 }}>
        <StatCard label="Clientes en riesgo" value={lista.length} icon={TriangleAlert} accent={COLORS.statusAmber} />
        <StatCard label="Riesgo alto" value={altos} icon={Flame} accent={COLORS.rust} />
        <StatCard label="Ingresos al mes en juego" value={euros(enJuego)} icon={Banknote} accent={COLORS.violet} />
      </div>
      <div style={{ fontSize: 12.5, color: COLORS.textDim, marginBottom: 12 }}>
        Sale aquí quien lleva días sin usar el sistema, no ha cobrado nada este mes, tiene la renovación vencida, pierde visitas o pide ayuda a menudo. Llámale, y pulsa «Ya le he llamado»: dejará de salir unos días.
      </div>
      {lista.length === 0 && <div style={{ fontSize: 13, color: COLORS.textDim, background: COLORS.surface, border: `1px dashed ${COLORS.line}`, borderRadius: 12, padding: 18 }}>Ningún cliente en riesgo ahora mismo. 🎉</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lista.map((c) => {
          const info = SISTEMAS_AYUDA[c.sistema] || { label: c.sistema, color: COLORS.slate };
          const wa = enlaceWhatsapp(c.contacto_telefono, `Hola ${(c.contacto_nombre || "").split(/[ ,]/)[0]}, te escribimos de Firztnet para ver qué tal te va con el sistema. ¿Necesitas algo?`);
          return (
            <div key={c.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${c.nivel === "alto" ? COLORS.rust : COLORS.statusAmber}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{c.nombre}</span>{" "}
                  <span style={{ fontSize: 11, fontWeight: 700, color: info.color }}>· {info.label}</span>{" "}
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: "#FFFFFF", background: c.nivel === "alto" ? COLORS.rust : COLORS.statusAmber, borderRadius: 999, padding: "2px 8px", textTransform: "uppercase" }}>Riesgo {c.nivel}</span>
                  <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>{c.contacto_nombre || "—"}{c.contacto_telefono ? ` · ${c.contacto_telefono}` : ""}{c.ingreso_mes_cents ? ` · te paga ${euros(c.ingreso_mes_cents)} al mes` : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-start" }}>
                  {c.contacto_telefono && <a href={`tel:${c.contacto_telefono}`} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", textDecoration: "none", padding: "6px 10px", fontSize: 11.5 }}>📞 Llamar</a>}
                  {wa && <a href={wa} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle("#16A34A", "#FFFFFF"), flex: "none", textDecoration: "none", padding: "6px 10px", fontSize: 11.5 }}>WhatsApp</a>}
                  <button onClick={() => contactado(c, 14)} style={{ ...btnStyle("transparent", COLORS.text, COLORS.line), flex: "none", padding: "6px 10px", fontSize: 11.5 }}><Check size={13} /> Ya le he llamado</button>
                </div>
              </div>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13 }}>{c.motivos.map((m) => <li key={m}>{m}</li>)}</ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------- vista: Cobros (Firztnet Central) --------------------
// Las cuotas que se renuevan en los próximos 30 días y las vencidas, con el recordatorio preparado.
function CobrosView() {
  const [lista, setLista] = useState(null);
  const [aviso, setAviso] = useState("");
  const cargar = useCallback(async () => { try { setLista(await apiGet("/central/cobros")); } catch (e) { setLista([]); } }, []);
  useEffect(() => { cargar(); }, [cargar]);

  async function porCorreo(c) {
    if (!window.confirm(`¿Enviar el recordatorio de cobro por correo a ${c.contacto_email}?`)) return;
    try { await apiPost(`/central/cobros/${c.id}/correo`, {}); setAviso(`✓ Recordatorio enviado a ${c.contacto_email}`); } catch (e) { setAviso(e.message); }
  }
  async function registrar(c) {
    const cuotas = window.prompt(`¿Cuántas cuotas te ha pagado ${c.nombre}?`, "1");
    if (cuotas === null) return;
    const n = Math.max(1, parseInt(cuotas, 10) || 1);
    const valor = window.prompt(`¿Cuánto te ha pagado en total? (€)`, c.importe_cents ? String((c.importe_cents * n) / 100).replace(".", ",") : "");
    if (valor === null) return;
    const metodo = window.prompt("¿Cómo ha pagado? (Bizum, transferencia, efectivo…)", "Bizum") || "";
    try {
      const r = await apiPost(`/central/cobros/${c.id}/registrar`, { importe: valor, metodo, cuotas: n });
      setAviso(r.sistema_actualizado
        ? `✓ Cobro apuntado en «Ventas» y su sistema ya está al día: ${c.nombre} renueva el ${fechaCorta(r.renueva)}.`
        : `✓ Cobro apuntado en «Ventas»: ${c.nombre}. ${r.motivo || "Su sistema no se ha podido actualizar"}: cambia la fecha de renovación en su panel.`);
      cargar();
    } catch (e) { setAviso(e.message); }
  }

  if (!lista) return <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>;
  const vencidas = lista.filter((c) => c.vencida);
  const total = lista.reduce((s, c) => s + c.importe_cents, 0);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 14 }}>
        <StatCard label="Por cobrar (30 días)" value={euros(total)} icon={Banknote} accent={COLORS.green} />
        <StatCard label="Renovaciones" value={lista.length} icon={Calendar} accent={COLORS.amber} />
        <StatCard label="Vencidas" value={vencidas.length} icon={Flame} accent={COLORS.rust} />
      </div>
      <div style={{ fontSize: 12.5, color: COLORS.textDim, marginBottom: 12 }}>Cada mañana a las 9:00 te llega un Telegram con las cuotas que se renuevan en 3 días o ya vencidas. Aquí tienes el mensaje preparado para cada cliente: por WhatsApp o por correo (solo sale cuando pulsas).</div>
      {aviso && <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 600, color: aviso.startsWith("✓") ? COLORS.green : COLORS.rust }}>{aviso}</div>}
      {lista.length === 0 && <div style={{ fontSize: 13, color: COLORS.textDim, background: COLORS.surface, border: `1px dashed ${COLORS.line}`, borderRadius: 12, padding: 18 }}>Ninguna renovación en los próximos 30 días. (Solo salen los clientes activos con fecha de renovación en su sistema.)</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {lista.map((c) => {
          const info = SISTEMAS_AYUDA[c.sistema] || { label: c.sistema, color: COLORS.slate };
          return (
            <div key={c.id} style={{ background: COLORS.surface, border: `1px solid ${c.vencida ? "#FCA5A5" : COLORS.line}`, borderLeft: `4px solid ${info.color}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <strong>{c.nombre}</strong> <span style={{ fontSize: 11, color: info.color, fontWeight: 700 }}>· {info.label}</span>
                  <div style={{ fontSize: 12.5, color: c.vencida || c.dias <= 3 ? COLORS.rust : COLORS.textDim, fontWeight: c.vencida || c.dias <= 3 ? 700 : 400 }}>
                    {c.vencida ? `Vencida el ${fechaCorta(c.renueva)}` : c.dias === 0 ? "Se renueva hoy" : `Se renueva el ${fechaCorta(c.renueva)} (en ${c.dias} día${c.dias > 1 ? "s" : ""})`}
                    {c.importe_cents ? ` · ${euros(c.importe_cents)}` : " · sin cuota apuntada"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {c.whatsapp && <a href={c.whatsapp} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle("#16A34A", "#FFFFFF"), flex: "none", textDecoration: "none", padding: "6px 10px", fontSize: 11.5 }}>Recordar por WhatsApp</a>}
                  {c.contacto_email && <button onClick={() => porCorreo(c)} style={{ ...btnStyle("transparent", COLORS.text, COLORS.line), flex: "none", padding: "6px 10px", fontSize: 11.5 }}>✉️ Por correo</button>}
                  <button onClick={() => registrar(c)} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "6px 10px", fontSize: 11.5 }}><CheckCircle2 size={13} /> Apuntar cobro</button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: COLORS.textDim, background: COLORS.surfaceRaised, borderRadius: 8, padding: "6px 9px", marginTop: 8 }}>{c.texto}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------- vista: Punto de venta (Firztnet POS en las tiendas) --------------------
// Alta de tiendas con su código de activación, cuota o pago único, cobros, ordenadores y copias.
const ESTADO_TIENDA = {
  prueba: ["En prueba", "#2563EB"], activa: ["Activa", "#16A34A"], suspendida: ["Suspendida", "#DC2626"], baja: ["De baja", "#64748B"],
};
const TIENDA_VACIA = { nombre: "", nif: "", contacto_nombre: "", contacto_telefono: "", contacto_email: "", modo: "cuota", cuota: "", max_equipos: 1, dias_gracia: 7, dias_sin_conexion: 15, notas: "" };

function haceCuanto(iso) {
  if (!iso) return "nunca";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 2) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  if (min < 48 * 60) return `hace ${Math.round(min / 60)} h`;
  return `hace ${Math.round(min / 1440)} días`;
}

function FormTienda({ inicial, onGuardar, onCancelar }) {
  const [f, setF] = useState({ ...TIENDA_VACIA, ...inicial, cuota: inicial?.cuota ? String(inicial.cuota).replace(".", ",") : "" });
  const [error, setError] = useState("");
  const inputStyle = { width: "100%", fontSize: 13, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box", marginTop: 4, fontFamily: "inherit" };
  const campo = (k, label, props = {}) => (
    <label style={{ fontSize: 12, color: COLORS.textDim, fontWeight: 600 }}>{label}
      <input style={inputStyle} value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} {...props} />
    </label>
  );
  return (
    <form onSubmit={async (e) => { e.preventDefault(); setError(""); try { await onGuardar(f); } catch (err) { setError(err.message); } }}
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
        {campo("nombre", "Nombre de la tienda *", { required: true })}
        {campo("nif", "NIF")}
        {campo("contacto_nombre", "Persona de contacto")}
        {campo("contacto_telefono", "Teléfono")}
        {campo("contacto_email", "Correo", { type: "email" })}
        <label style={{ fontSize: 12, color: COLORS.textDim, fontWeight: 600 }}>Cómo paga
          <select style={inputStyle} value={f.modo} onChange={(e) => setF({ ...f, modo: e.target.value })}>
            <option value="cuota">Cuota mensual</option>
            <option value="unico">Pago único</option>
          </select>
        </label>
        {campo("cuota", f.modo === "cuota" ? "Cuota al mes (€)" : "Precio pagado (€)", { inputMode: "decimal" })}
        {campo("max_equipos", "Ordenadores con el programa", { type: "number", min: 1, max: 20 })}
        {f.modo === "cuota" && campo("dias_gracia", "Días de margen si no paga", { type: "number", min: 0, max: 60 })}
        {f.modo === "cuota" && campo("dias_sin_conexion", "Días máximo sin internet", { type: "number", min: 3, max: 90 })}
      </div>
      <label style={{ fontSize: 12, color: COLORS.textDim, fontWeight: 600, display: "block", marginTop: 10 }}>Notas
        <textarea style={{ ...inputStyle, minHeight: 50 }} value={f.notas ?? ""} onChange={(e) => setF({ ...f, notas: e.target.value })} />
      </label>
      {error && <div style={{ color: COLORS.rust, fontSize: 12.5, fontWeight: 600, marginTop: 8 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button type="submit" style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none" }}>Guardar</button>
        <button type="button" onClick={onCancelar} style={{ ...btnStyle("transparent", COLORS.text, COLORS.line), flex: "none" }}>Cancelar</button>
      </div>
    </form>
  );
}

function PuntoVentaView() {
  const [tiendas, setTiendas] = useState(null);
  const [config, setConfig] = useState(null);
  const [nueva, setNueva] = useState(false);
  const [editando, setEditando] = useState(null);
  const [abierta, setAbierta] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [aviso, setAviso] = useState("");
  const [codigo, setCodigo] = useState(null);
  const [licencia, setLicencia] = useState(null);
  const [rescate, setRescate] = useState(null);

  const cargar = useCallback(async () => {
    try { setTiendas(await apiGet("/central/pos/tiendas")); } catch (e) { setTiendas([]); }
  }, []);
  useEffect(() => { cargar(); apiGet("/central/pos/estado").then(setConfig).catch(() => setConfig(null)); }, [cargar]);
  useEffect(() => { if (abierta) apiGet(`/central/pos/tiendas/${abierta}`).then(setDetalle).catch(() => setDetalle(null)); else setDetalle(null); }, [abierta, tiendas]);

  async function crear(f) {
    const r = await apiPost("/central/pos/tiendas", f);
    setNueva(false);
    setCodigo({ nombre: r.nombre, codigo: r.codigo });
    await cargar();
  }
  async function guardar(t, f) {
    await apiPatch(`/central/pos/tiendas/${t.id}`, f);
    setEditando(null);
    setAviso(`✓ Guardado: ${f.nombre}`);
    await cargar();
  }
  async function nuevoCodigo(t) {
    if (!window.confirm(`¿Crear un código nuevo para ${t.nombre}? El anterior deja de valer (los ordenadores ya activados siguen funcionando).`)) return;
    try { const r = await apiPost(`/central/pos/tiendas/${t.id}/codigo`, {}); setCodigo({ nombre: t.nombre, codigo: r.codigo }); } catch (e) { setAviso(e.message); }
  }
  async function pago(t) {
    const meses = t.modo === "cuota" ? window.prompt(`¿Cuántos meses te ha pagado ${t.nombre}?`, "1") : "1";
    if (meses === null) return;
    const importe = window.prompt("¿Cuánto en total? (€)", String((t.cuota || 0) * (Number(meses) || 1)).replace(".", ","));
    if (importe === null) return;
    const metodo = window.prompt("¿Cómo ha pagado? (Bizum, transferencia, efectivo…)", "Bizum") || "";
    try {
      const r = await apiPost(`/central/pos/tiendas/${t.id}/pago`, { meses, importe, metodo });
      setAviso(`✓ Pago apuntado en «Ventas»${r.pagado_hasta ? `. Pagado hasta el ${fechaCorta(r.pagado_hasta)}` : ""}. La tienda lo recibe en su próxima conexión.`);
      await cargar();
    } catch (e) { setAviso(e.message); }
  }
  async function cambiarEstado(t, estado) {
    const textos = { suspendida: `¿Suspender ${t.nombre}? En su próxima conexión dejará de poder vender (podrá consultar sus datos).`, activa: `¿Reactivar ${t.nombre}?`, baja: `¿Dar de baja ${t.nombre}?` };
    if (!window.confirm(textos[estado])) return;
    try { await apiPatch(`/central/pos/tiendas/${t.id}`, { estado }); await cargar(); } catch (e) { setAviso(e.message); }
  }
  async function borrar(t) {
    const vivos = t.equipos.filter((e) => e.activo).length;
    const texto = `¿Borrar la tienda «${t.nombre}»?\n\n`
      + "Se borran de tu panel: la tienda, sus ordenadores y sus copias de seguridad guardadas aquí. "
      + "Los cobros ya apuntados en «Ventas» se quedan.\n\n"
      + (vivos ? `⚠️ Tiene ${vivos} ordenador(es) activado(s): dejarán de informarte, pero el programa NO se bloquea solo. Si quieres que deje de vender, pulsa «Cancelar» y usa antes «Suspender».\n\n` : "")
      + "Esto no se puede deshacer.";
    if (!window.confirm(texto)) return;
    try {
      await apiDelete(`/central/pos/tiendas/${t.id}`);
      setAbierta(null);
      setAviso(`✓ Tienda borrada: ${t.nombre}`);
      await cargar();
    } catch (e) { setAviso(e.message); }
  }
  async function licenciaManual(t) {
    const id = window.prompt(`Licencia sin internet para ${t.nombre}.\nEscribe el ID del equipo (12 cifras) que sale en su pantalla de activación, pestaña «Sin internet»:`);
    if (!id) return;
    try { const r = await apiPost(`/central/pos/tiendas/${t.id}/licencia-manual`, { machine_id: id }); setLicencia({ nombre: t.nombre, texto: r.licencia }); } catch (e) { setAviso(e.message); }
  }
  async function codigoRescate(t, e) {
    const usuario = window.prompt(`Contraseña olvidada en «${e.nombre}» (${t.nombre}).
Escribe el usuario del punto de venta (normalmente «admin»):`, "admin");
    if (!usuario) return;
    try { const r = await apiPost(`/central/pos/equipos/${e.id}/rescate`, { usuario }); setRescate({ ...r, tienda: t.nombre }); setCodigo(null); setLicencia(null); }
    catch (err) { setAviso(err.message); }
  }
  async function desactivar(e) {
    if (!window.confirm(`¿Desactivar el ordenador «${e.nombre}»? Dejará de informar y tendrá que activarse con un código nuevo.`)) return;
    try { await apiPost(`/central/pos/equipos/${e.id}/desactivar`, {}); await cargar(); } catch (err) { setAviso(err.message); }
  }
  async function descargar(e, nombre) {
    try {
      const res = await fetch(`${API_BASE}/central/pos/equipos/${e.id}/copias/${nombre}`, { headers: cabecerasAuth() });
      manejar401(res);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "No se pudo descargar");
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url; a.download = `pos-${detalle?.slug || "tienda"}-${nombre.slice(0, 15)}.db`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) { setAviso(err.message); }
  }

  if (!tiendas) return <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>;
  const activas = tiendas.filter((t) => t.estado === "activa");
  const mensual = activas.filter((t) => t.modo === "cuota").reduce((s, t) => s + (t.cuota || 0), 0);
  const impagos = tiendas.filter((t) => t.impago);
  const sinNoticias = tiendas.filter((t) => ["activa", "prueba"].includes(t.estado) && t.equipos.some((e) => e.activo && (e.sin_noticias_horas === null || e.sin_noticias_horas > 24)));
  const caja = { background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14, marginBottom: 12 };
  const boton = (bg, color, borde) => ({ ...btnStyle(bg, color, borde), flex: "none", padding: "6px 10px", fontSize: 11.5 });

  return (
    <div>
      {config && !config.licencias && (
        <div style={{ ...caja, borderColor: "#FCA5A5", background: "#FEF2F2", color: "#991B1B", fontSize: 13 }}>
          ⚠️ Falta poner en Railway la variable <strong>POS_CLAVE_PRIVADA</strong> (está en el archivo «PRIVADO-claves-punto-de-venta.txt»). Sin ella las tiendas no se pueden activar.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 14 }}>
        <StatCard label="Tiendas activas" value={activas.length} icon={Store} accent={COLORS.green} />
        <StatCard label="En prueba" value={tiendas.filter((t) => t.estado === "prueba").length} icon={Calendar} accent={COLORS.amber} />
        <StatCard label="Cuotas al mes" value={mensual.toLocaleString("es-ES", { style: "currency", currency: "EUR" })} icon={Banknote} accent={COLORS.green} />
        <StatCard label="Impagos" value={impagos.length} icon={Flame} accent={COLORS.rust} />
        <StatCard label="Sin noticias +24 h" value={sinNoticias.length} icon={Activity} accent={COLORS.rust} />
      </div>
      <div style={{ fontSize: 12.5, color: COLORS.textDim, marginBottom: 12 }}>
        Cada tienda funciona en su ordenador aunque no tenga internet. Cuando hay conexión, cada 10 minutos te manda sus ventas del día (solo totales), su versión y su copia de seguridad cifrada, y recoge su licencia. Si un día deja de pagar, en su siguiente conexión deja de poder vender (pero puede consultar sus datos).
      </div>
      {aviso && <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 600, color: aviso.startsWith("✓") ? COLORS.green : COLORS.rust }}>{aviso}</div>}

      {codigo && (
        <div style={{ ...caja, borderColor: COLORS.green, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: COLORS.textDim }}>Código de activación de <strong>{codigo.nombre}</strong></div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 4, fontFamily: "monospace", margin: "8px 0", color: COLORS.text }}>{codigo.codigo}</div>
          <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 8 }}>Apúntalo ahora: por seguridad no se vuelve a mostrar. En la tienda: pantalla de activación → «Tengo un código».</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={() => { navigator.clipboard?.writeText(codigo.codigo); setAviso("✓ Código copiado"); }} style={boton(COLORS.amber, "#FFFFFF")}>Copiar</button>
            <button onClick={() => setCodigo(null)} style={boton("transparent", COLORS.text, COLORS.line)}>Ya lo tengo</button>
          </div>
        </div>
      )}
      {rescate && (
        <div style={{ ...caja, borderColor: COLORS.amber, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: COLORS.textDim }}>Código para restablecer la contraseña de <strong>{rescate.usuario}</strong> en <strong>{rescate.equipo}</strong> ({rescate.tienda})</div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 4, fontFamily: "monospace", margin: "8px 0", color: COLORS.text }}>{rescate.codigo}</div>
          <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 8 }}>Díctaselo por teléfono. Vale unos {rescate.minutos} minutos y una sola vez. En la tienda: pantalla de entrada → «¿Has olvidado la contraseña?» → usuario, código y contraseña nueva. Funciona aunque no tenga internet.</div>
          {rescate.aviso && <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.rust, marginBottom: 8 }}>⚠️ {rescate.aviso}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={() => { navigator.clipboard?.writeText(rescate.codigo); setAviso("✓ Código copiado"); }} style={boton(COLORS.amber, "#FFFFFF")}>Copiar</button>
            <button onClick={() => setRescate(null)} style={boton("transparent", COLORS.text, COLORS.line)}>Cerrar</button>
          </div>
        </div>
      )}
      {licencia && (
        <div style={caja}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Licencia sin internet para <strong>{licencia.nombre}</strong>: pégala en su pantalla de activación → «Sin internet».</div>
          <textarea readOnly value={licencia.texto} style={{ width: "100%", minHeight: 80, fontFamily: "monospace", fontSize: 11, boxSizing: "border-box" }} onFocus={(e) => e.target.select()} />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button onClick={() => { navigator.clipboard?.writeText(licencia.texto); setAviso("✓ Licencia copiada"); }} style={boton(COLORS.amber, "#FFFFFF")}>Copiar</button>
            <button onClick={() => setLicencia(null)} style={boton("transparent", COLORS.text, COLORS.line)}>Cerrar</button>
          </div>
        </div>
      )}

      {nueva ? <FormTienda onGuardar={crear} onCancelar={() => setNueva(false)} />
        : <button onClick={() => { setNueva(true); setCodigo(null); }} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", marginBottom: 12 }}><Plus size={14} /> Nueva tienda</button>}

      {tiendas.length === 0 && <div style={{ fontSize: 13, color: COLORS.textDim, background: COLORS.surface, border: `1px dashed ${COLORS.line}`, borderRadius: 12, padding: 18 }}>Todavía no hay tiendas. Da de alta la primera con «Nueva tienda» y te saldrá su código de activación. Las que empiecen la prueba gratis desde el programa aparecerán aquí solas.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tiendas.map((t) => {
          const [estadoTxt, estadoColor] = ESTADO_TIENDA[t.estado] || ESTADO_TIENDA.baja;
          const equiposVivos = t.equipos.filter((e) => e.activo);
          const ventasHoy = equiposVivos.reduce((s, e) => s + (e.datos?.ventas_hoy_cents || 0), 0);
          if (editando === t.id) return <FormTienda key={t.id} inicial={t} onGuardar={(f) => guardar(t, f)} onCancelar={() => setEditando(null)} />;
          return (
            <div key={t.id} style={{ background: COLORS.surface, border: `1px solid ${t.impago ? "#FCA5A5" : COLORS.line}`, borderLeft: `4px solid ${estadoColor}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ fontSize: 14.5 }}>{t.nombre}</strong>{" "}
                  <span style={{ fontSize: 11, fontWeight: 700, color: estadoColor }}>· {estadoTxt}</span>
                  {t.impago && <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.rust }}> · Cuota vencida</span>}
                  <div style={{ fontSize: 12.5, color: COLORS.textDim, marginTop: 2 }}>
                    {t.modo === "cuota" ? `Cuota ${(t.cuota || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}/mes` : "Pago único"}
                    {t.estado === "prueba" && t.prueba_hasta && ` · prueba hasta el ${fechaCorta(t.prueba_hasta)}`}
                    {t.modo === "cuota" && t.pagado_hasta && t.estado !== "prueba" && ` · pagado hasta el ${fechaCorta(t.pagado_hasta)}`}
                    {` · ${equiposVivos.length}/${t.max_equipos} ordenador(es)`}
                    {equiposVivos.length > 0 && ` · hoy ${euros(ventasHoy)}`}
                    {t.contacto_telefono && ` · ☎ ${t.contacto_telefono}`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => pago(t)} style={boton(COLORS.amber, "#FFFFFF")}><CheckCircle2 size={13} /> Apuntar pago</button>
                  <button onClick={() => setAbierta(abierta === t.id ? null : t.id)} style={boton("transparent", COLORS.text, COLORS.line)}>{abierta === t.id ? "Cerrar" : "Ver"}</button>
                  <button onClick={() => setEditando(t.id)} style={boton("transparent", COLORS.text, COLORS.line)}><Pencil size={12} /> Editar</button>
                </div>
              </div>
              {abierta === t.id && (
                <div style={{ marginTop: 10, borderTop: `1px solid ${COLORS.line}`, paddingTop: 10 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                    <button onClick={() => nuevoCodigo(t)} style={boton("transparent", COLORS.text, COLORS.line)}>🔑 Código de activación{t.codigo_pista ? ` (…${t.codigo_pista})` : ""}</button>
                    <button onClick={() => licenciaManual(t)} style={boton("transparent", COLORS.text, COLORS.line)}>📄 Licencia sin internet</button>
                    {t.estado === "suspendida" || t.estado === "baja"
                      ? <button onClick={() => cambiarEstado(t, "activa")} style={boton("transparent", COLORS.green, COLORS.green)}>Reactivar</button>
                      : <button onClick={() => cambiarEstado(t, "suspendida")} style={boton("transparent", COLORS.rust, "#FCA5A5")}>Suspender</button>}
                    <button onClick={() => borrar(t)} style={{ ...boton(COLORS.rust, "#FFFFFF"), marginLeft: "auto" }}><Trash2 size={12} /> Borrar tienda</button>
                  </div>
                  {t.notas && <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 8 }}>📝 {t.notas}</div>}
                  {(detalle?.id === t.id ? detalle.equipos : t.equipos).map((e) => (
                    <div key={e.id} style={{ background: COLORS.surfaceRaised, borderRadius: 9, padding: "9px 11px", marginBottom: 6, opacity: e.activo ? 1 : 0.55 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 12.5 }}>
                          <strong>🖥️ {e.nombre || "Ordenador"}</strong> <span style={{ color: COLORS.textDim }}>· ID {e.machine_id} · versión {e.version || "—"}</span>
                          {!e.activo && <span style={{ color: COLORS.rust, fontWeight: 700 }}> · desactivado</span>}
                          <div style={{ color: e.sin_noticias_horas > 24 ? COLORS.rust : COLORS.textDim, fontWeight: e.sin_noticias_horas > 24 ? 700 : 400 }}>
                            Último parte: {haceCuanto(e.ultimo_parte)} · Copia: {haceCuanto(e.ultima_copia)}
                            {e.datos?.tickets_hoy !== undefined && ` · hoy ${e.datos.tickets_hoy} tickets, ${euros(e.datos.ventas_hoy_cents)}`}
                            {e.datos?.productos !== undefined && ` · ${e.datos.productos} productos`}
                            {e.reloj_atrasado && " · ⚠️ reloj mal puesto"}
                            {e.datos?.bloqueado && " · ⛔ bloqueado (no puede vender)"}
                          </div>
                          {e.datos?.errores?.length > 0 && <div style={{ color: COLORS.rust, fontSize: 11.5, marginTop: 3 }}>Errores: {e.datos.errores.slice(-3).join(" · ")}</div>}
                          {e.actualizacion && (
                            <div style={{ fontSize: 11.5, marginTop: 3, fontWeight: 600, color: e.actualizacion.estado === "fallida" ? COLORS.rust : e.actualizacion.estado === "instalada" ? "#16A34A" : "#D97706" }}>
                              {e.actualizacion.estado === "instalada" && `✓ Actualizado a la ${e.actualizacion.version} ${haceCuanto(e.actualizacion.fecha)}`}
                              {e.actualizacion.estado === "descargada" && `⏳ Versión ${e.actualizacion.version} descargada: esperando a que la tienda pulse «Actualizar»`}
                              {e.actualizacion.estado === "fallida" && `⚠️ La ${e.actualizacion.version} no arrancó y volvió a la anterior: ${e.actualizacion.detalle || ""}`}
                            </div>
                          )}
                        </div>
                        {e.activo && <button onClick={() => codigoRescate(t, e)} style={boton("transparent", COLORS.text, COLORS.line)}>Contraseña olvidada</button>}
                        {e.activo && <button onClick={() => desactivar(e)} style={boton("transparent", COLORS.rust, "#FCA5A5")}>Desactivar</button>}
                      </div>
                      {e.copias?.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                          <span style={{ fontSize: 11.5, color: COLORS.textDim }}>💾 Copias:</span>
                          {e.copias.slice(0, 7).map((c) => (
                            <button key={c} onClick={() => descargar(e, c)} style={boton("transparent", COLORS.text, COLORS.line)} title="Descargar el archivo pos.db de ese día">
                              {`${c.slice(6, 8)}/${c.slice(4, 6)} ${c.slice(9, 11)}:${c.slice(11, 13)}`}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {t.equipos.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Aún no hay ningún ordenador activado. En la tienda: pantalla de activación → «Tengo un código».</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <ActualizacionesPos tiendas={tiendas || []} onCambio={cargar} />
    </div>
  );
}

// -------------------- Actualizaciones a distancia del punto de venta --------------------
// Subes el .zip de compilar.ps1 con sus novedades; Central lo firma. Lo mandas a una tienda de prueba
// o a todas; cada ordenador lo descarga solo y la tienda ve el aviso con las novedades.
function ActualizacionesPos({ tiendas, onCambio }) {
  const [datos, setDatos] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [version, setVersion] = useState("");
  const [notas, setNotas] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState("");
  const cargar = useCallback(() => apiGet("/central/pos/versiones").then(setDatos).catch(() => setDatos({ versiones: [] })), []);
  useEffect(() => { cargar(); }, [cargar]);

  function elegir(f) {
    setArchivo(f || null);
    const m = f && f.name.match(/(\d+\.\d+\.\d+)/);
    if (m) setVersion(m[1]);
  }
  async function subir() {
    if (!archivo) { setAviso("Elige el archivo .zip que hace compilar.ps1 (carpeta «salida»)."); return; }
    setSubiendo(true); setAviso("");
    try {
      const fd = new FormData();
      fd.append("paquete", archivo);
      fd.append("version", version.trim());
      fd.append("notas", notas);
      const res = await fetch(`${API_BASE}/central/pos/versiones`, { method: "POST", headers: cabecerasAuth(), body: fd });
      manejar401(res);
      const r = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(r.error || `Error ${res.status}`);
      setAviso(`✓ Versión ${r.version} subida y firmada. Elige a quién se la mandas y pulsa «Publicar».`);
      setArchivo(null); setVersion(""); setNotas("");
      cargar();
    } catch (e) { setAviso(e.message); } finally { setSubiendo(false); }
  }
  async function cambiar(v, cambios, texto) {
    if (texto && !window.confirm(texto)) return;
    try { await apiPatch(`/central/pos/versiones/${v.id}`, cambios); setAviso(""); cargar(); onCambio?.(); } catch (e) { setAviso(e.message); }
  }
  async function borrar(v) {
    if (!window.confirm(`¿Borrar la versión ${v.version}? Las tiendas que aún no la tengan dejarán de recibirla.`)) return;
    try { await apiDelete(`/central/pos/versiones/${v.id}`); cargar(); } catch (e) { setAviso(e.message); }
  }

  const caja = { background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginTop: 14 };
  const entrada = { width: "100%", boxSizing: "border-box", fontSize: 13, padding: "9px 11px", borderRadius: 8, border: `1px solid ${COLORS.line}`, background: COLORS.surface, color: COLORS.text };
  const boton = (fondo, color, borde) => ({ background: fondo, color, border: `1px solid ${borde || fondo}`, borderRadius: 8, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" });
  const ESTADO = { borrador: ["Sin publicar", "#64748B"], publicada: ["Publicada", "#16A34A"], retirada: ["Retirada", "#DC2626"] };

  return (
    <div style={{ marginTop: 26 }}>
      <h2 style={{ fontSize: 17, margin: "0 0 4px", color: COLORS.text }}>🚀 Actualizaciones</h2>
      <div style={{ fontSize: 12.5, color: COLORS.textDim, marginBottom: 6 }}>
        Sube el paquete de <b>compilar.ps1</b> con sus novedades. Central lo firma; cada ordenador lo descarga solo, comprueba la firma
        y la tienda ve un aviso con las novedades para actualizar (si algo falla, vuelve sola a la versión anterior).
      </div>
      {datos && !datos.firma_lista && <div style={{ ...caja, color: COLORS.rust, fontSize: 12.5 }}>Falta la variable POS_CLAVE_PRIVADA en Railway: sin ella no se pueden firmar las actualizaciones.</div>}
      <div style={caja}>
        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10, color: COLORS.text }}>Subir una versión nueva</div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 10 }}>
          <label style={{ fontSize: 12, color: COLORS.textDim }}>Paquete (.zip de la carpeta «salida»)
            <input type="file" accept=".zip" onChange={(e) => elegir(e.target.files?.[0])} style={{ ...entrada, marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 12, color: COLORS.textDim }}>Versión
            <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="2.1.0" style={{ ...entrada, marginTop: 4 }} />
          </label>
        </div>
        <label style={{ display: "block", fontSize: 12, color: COLORS.textDim, marginTop: 10 }}>Novedades que verá la tienda (una por línea)
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={4} placeholder={"Tickets más rápidos al imprimir\nNuevo informe de ventas por mes\nCorrecciones y mejoras de seguridad"} style={{ ...entrada, marginTop: 4, resize: "vertical", fontFamily: "inherit" }} />
        </label>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
          <button onClick={subir} disabled={subiendo} style={boton(COLORS.amber, "#FFFFFF")}>{subiendo ? "Subiendo y firmando…" : "Subir y firmar"}</button>
          {aviso && <span style={{ fontSize: 12.5, color: aviso.startsWith("✓") ? "#16A34A" : COLORS.rust }}>{aviso}</span>}
        </div>
      </div>

      {(datos?.versiones || []).map((v) => {
        const [textoEstado, colorEstado] = ESTADO[v.estado] || ESTADO.borrador;
        return (
          <div key={v.id} style={caja}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <strong style={{ fontSize: 15, color: COLORS.text }}>Versión {v.version}</strong>
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: `${colorEstado}22`, color: colorEstado }}>{textoEstado}</span>
              <span style={{ fontSize: 12, color: COLORS.textDim }}>{(v.tamano / 1048576).toFixed(1).replace(".", ",")} MB · subida {haceCuanto(v.subida)}</span>
              {v.estado === "publicada" && (
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>
                  · {v.equipos_al_dia} de {v.equipos_destino} ordenador(es) ya la tienen{v.fallidas ? ` · ⚠️ ${v.fallidas} fallida(s)` : ""}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.textDim, margin: "8px 0", whiteSpace: "pre-wrap" }}>{v.notas || "Sin novedades escritas (la tienda verá «Mejoras de funcionamiento y seguridad»)."}</div>
            {v.estado === "publicada" && (v.ordenadores || []).length > 0 && (
              <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 10, margin: "4px 0 10px", overflow: "hidden" }}>
                {[...v.ordenadores].sort((a, b) => (a.estado === "al_dia") - (b.estado === "al_dia")).map((o) => {
                  const color = { al_dia: COLORS.green, fallida: COLORS.rust, sin_noticias: COLORS.rust, manual: COLORS.amber, aceptar: COLORS.amber }[o.estado] || COLORS.textDim;
                  const icono = { al_dia: "✓", fallida: "✕", sin_noticias: "⚠", manual: "⚠", aceptar: "⏳", descargando: "⬇", pendiente: "…" }[o.estado] || "…";
                  return (
                    <div key={o.id} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "8px 12px", borderTop: `1px solid ${COLORS.line}`, fontSize: 12.5, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800, color, width: 16 }}>{icono}</span>
                      <strong style={{ color: COLORS.text, minWidth: 180 }}>{o.tienda} · {o.equipo}</strong>
                      <span style={{ color: COLORS.textDim, minWidth: 90 }}>tiene la {o.version || "?"}</span>
                      <span style={{ color, fontWeight: o.estado === "al_dia" ? 600 : 700, flex: 1 }}>{o.texto}</span>
                      <span style={{ color: COLORS.textDim, fontSize: 11.5 }}>{o.ultimo_parte ? `conectado ${haceCuanto(o.ultimo_parte)}` : "nunca conectado"}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", fontSize: 12.5, color: COLORS.text }}>
              <label><input type="radio" checked={v.destino === "prueba"} onChange={() => cambiar(v, { destino: "prueba" })} /> Solo tiendas de prueba:</label>
              {v.destino === "prueba" && tiendas.map((t) => (
                <label key={t.id} style={{ color: COLORS.textDim }}>
                  <input type="checkbox" checked={v.tiendas.includes(t.id)} onChange={(e) => cambiar(v, { tiendas: e.target.checked ? [...v.tiendas, t.id] : v.tiendas.filter((x) => x !== t.id) })} /> {t.nombre}
                </label>
              ))}
              <label><input type="radio" checked={v.destino === "todas"} onChange={() => cambiar(v, { destino: "todas" })} /> Todas las tiendas</label>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {v.estado !== "publicada" && (
                <button onClick={() => cambiar(v, { estado: "publicada" }, `¿Publicar la versión ${v.version} para ${v.destino === "todas" ? "TODAS las tiendas" : "las tiendas de prueba elegidas"}? Los ordenadores la descargarán en su próxima conexión (máximo 10 minutos) y la tienda verá el aviso.`)}
                  style={boton("#16A34A", "#FFFFFF")}>Publicar</button>
              )}
              {v.estado === "publicada" && (
                <button onClick={() => cambiar(v, { estado: "retirada" }, `¿Retirar la versión ${v.version}? Los ordenadores que aún no la hayan instalado dejarán de verla (los que ya la tienen se quedan con ella).`)}
                  style={boton("transparent", COLORS.rust, "#FCA5A5")}>Retirar</button>
              )}
              <button onClick={() => borrar(v)} style={boton("transparent", COLORS.textDim, COLORS.line)}>Borrar</button>
            </div>
          </div>
        );
      })}
      {datos && datos.versiones.length === 0 && <div style={{ ...caja, fontSize: 12.5, color: COLORS.textDim }}>Todavía no has subido ninguna versión.</div>}
    </div>
  );
}

// -------------------- Copias de seguridad vigiladas (dentro de «Estado de sistemas») --------------------
const ESTADO_COPIA = {
  ok: ["Al día", "#16A34A"], atrasada: ["Atrasada", "#DC2626"], sin_copias: ["Sin copias automáticas", "#D97706"], desconocido: ["Sin datos todavía", "#64748B"],
};
function CopiasSeguridad() {
  const [lista, setLista] = useState(null);
  useEffect(() => { apiGet("/central/copias").then(setLista).catch(() => setLista([])); }, []);
  if (!lista) return null;
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>💾 Copias de seguridad</div>
      <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 10 }}>Cada sistema dice cuándo hizo su última copia. Si alguno lleva más de un día sin copia, te llega un Telegram por la mañana.</div>
      {lista.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Los datos llegan con la próxima lista de clientes de cada sistema (cada 10 minutos).</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
        {lista.map((c) => {
          const [texto, color] = ESTADO_COPIA[c.estado] || ESTADO_COPIA.desconocido;
          return (
            <div key={c.sistema} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "8px 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}><strong style={{ fontSize: 13 }}>{c.nombre}</strong><span style={{ fontSize: 11.5, fontWeight: 800, color }}>{texto}</span></div>
              <div style={{ fontSize: 11.5, color: COLORS.textDim }}>{c.ultima ? `Última: ${haceCorto(c.ultima)}` : c.detalle || "—"}</div>
              {c.clientes_sin_copia?.length > 0 && <div style={{ fontSize: 11.5, color: COLORS.rust }}>Sin copia reciente: {c.clientes_sin_copia.join(", ")}</div>}
              {c.estado === "sin_copias" && <div style={{ fontSize: 11, color: COLORS.textDim }}>{c.detalle}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------- Respuestas rápidas (dentro de «Ayuda a clientes») --------------------
function GestionPlantillas({ plantillas, onCambio, onCerrar }) {
  const [nueva, setNueva] = useState({ titulo: "", texto: "" });
  const [error, setError] = useState("");
  async function guardar(p, cambios) {
    try { await apiPatch(`/central/plantillas-ayuda/${p.id}`, cambios); onCambio(); } catch (e) { setError(e.message); }
  }
  async function borrar(p) {
    if (!window.confirm(`¿Borrar la respuesta rápida «${p.titulo}»?`)) return;
    try {
      const res = await fetch(`${API_BASE}/central/plantillas-ayuda/${p.id}`, { method: "DELETE", headers: cabecerasAuth() });
      manejar401(res);
      onCambio();
    } catch (e) { setError(e.message); }
  }
  async function crear(e) {
    e.preventDefault();
    try { await apiPost("/central/plantillas-ayuda", nueva); setNueva({ titulo: "", texto: "" }); onCambio(); } catch (err) { setError(err.message); }
  }
  const campo = { border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "7px 9px", fontSize: 13, fontFamily: "Inter", width: "100%", boxSizing: "border-box" };
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <strong>⚡ Respuestas rápidas</strong>
        <button onClick={onCerrar} style={{ ...btnStyle("transparent", COLORS.textDim, COLORS.line), flex: "none", padding: "5px 10px", fontSize: 12 }}>Cerrar</button>
      </div>
      {error && <div style={{ color: COLORS.rust, fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {plantillas.map((p) => (
          <div key={p.id} style={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 8, alignItems: "start" }}>
            <input defaultValue={p.titulo} onBlur={(e) => e.target.value !== p.titulo && guardar(p, { titulo: e.target.value })} style={campo} aria-label="Título" />
            <textarea defaultValue={p.texto} rows={2} onBlur={(e) => e.target.value !== p.texto && guardar(p, { texto: e.target.value })} style={{ ...campo, resize: "vertical" }} aria-label="Texto" />
            <button onClick={() => borrar(p)} title="Borrar" style={{ border: "none", background: "transparent", cursor: "pointer", color: COLORS.rust, padding: 6 }}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      <form onSubmit={crear} style={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 8, marginTop: 12, alignItems: "start" }}>
        <input value={nueva.titulo} onChange={(e) => setNueva({ ...nueva, titulo: e.target.value })} placeholder="Título (p. ej. «Datáfono»)" maxLength={80} style={campo} />
        <textarea value={nueva.texto} onChange={(e) => setNueva({ ...nueva, texto: e.target.value })} placeholder="Texto de la respuesta" rows={2} maxLength={2000} style={{ ...campo, resize: "vertical" }} />
        <button type="submit" style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "8px 12px" }}><Plus size={14} /> Añadir</button>
      </form>
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

// ---------------------------------------------------------------------
// MANTENIMIENTOS: contratos con cuota fija mensual y visitas libres.
// Cada mes es independiente: sus visitas y el cobro de su cuota (sin factura).
// ---------------------------------------------------------------------
const ESTADOS_CONTRATO_UI = {
  activo: { label: "Activo", color: COLORS.green },
  pendiente: { label: "Pendiente de confirmar", color: COLORS.statusAmber },
  baja: { label: "Dado de baja", color: COLORS.textDim },
};
const ORDEN_ESTADO_CONTRATO = { activo: 0, pendiente: 1, baja: 2 };

function eurosMant(n) {
  return `${Number(n || 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
// "2026-10-12" → "12/10/2026" (sin pasar por Date para que no cambie el día)
function fechaDia(iso) {
  if (!iso) return "";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}
function fechaLargaDia(iso) {
  if (!iso) return "";
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}
function horaDe(iso) {
  return iso ? new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "";
}
function periodoActualLocal() {
  return hoyLocalISO().slice(0, 7);
}
function mayusculaInicial(t) {
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}
async function borrarEnApi(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE", headers: cabecerasAuth() });
  manejar401(res);
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(datos.mensaje || datos.error || `No se pudo borrar (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return datos;
}

function InsigniaEstadoContrato({ estado }) {
  const e = ESTADOS_CONTRATO_UI[estado] || ESTADOS_CONTRATO_UI.activo;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: e.color, background: `${e.color}1A`, borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" }}>{e.label}</span>
  );
}

function MantenimientosView({ onCambio }) {
  const [contratos, setContratos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [abiertoId, setAbiertoId] = useState(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setContratos(await apiGet("/mantenimientos/contratos"));
    } catch (e) {
      setError(String(e.message).includes("404")
        ? "El servidor todavía no tiene la sección de mantenimientos. Sube primero el backend nuevo."
        : `No se pudieron cargar los mantenimientos: ${e.message}`);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (abiertoId) {
    return (
      <FichaContratoMantenimiento
        id={abiertoId}
        onVolver={() => { setAbiertoId(null); cargar(); }}
        onCambio={onCambio}
      />
    );
  }

  const ordenados = [...contratos].sort((a, b) =>
    (ORDEN_ESTADO_CONTRATO[a.estado] ?? 9) - (ORDEN_ESTADO_CONTRATO[b.estado] ?? 9) ||
    (a.cliente?.nombre || "").localeCompare(b.cliente?.nombre || "", "es"));
  const activos = contratos.filter((c) => c.estado === "activo");
  const cuotaMensual = activos.reduce((s, c) => s + Number(c.cuota || 0), 0);
  const pendientesCobro = activos.filter((c) => c.mes_actual && !c.mes_actual.cuota_pagada).length;

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: COLORS.textDim }}>
          {activos.length} {activos.length === 1 ? "contrato activo" : "contratos activos"} · {eurosMant(cuotaMensual)} al mes
          {pendientesCobro > 0 && <span style={{ color: COLORS.statusAmber, fontWeight: 600 }}> · {pendientesCobro} {pendientesCobro === 1 ? "cuota" : "cuotas"} de este mes sin cobrar</span>}
        </div>
        {!creando && (
          <button onClick={() => setCreando(true)} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "9px 16px", fontSize: 13 }}>
            <Plus size={15} /> Nuevo contrato
          </button>
        )}
      </div>

      {creando && (
        <FormularioContrato
          onCancelar={() => setCreando(false)}
          onGuardado={(c) => { setCreando(false); onCambio?.(); setAbiertoId(c.id); }}
        />
      )}

      {error && <div style={{ fontSize: 12.5, color: COLORS.rust, marginBottom: 10 }}>{error}</div>}
      {cargando && contratos.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>}
      {!cargando && !error && contratos.length === 0 && !creando && (
        <div style={{ background: COLORS.surface, border: `1px dashed ${COLORS.line}`, borderRadius: 12, padding: 22, fontSize: 13, color: COLORS.textDim, textAlign: "center" }}>
          Aún no hay contratos de mantenimiento. Pulsa <b>Nuevo contrato</b> para crear el primero.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {ordenados.map((c) => {
          const est = ESTADOS_CONTRATO_UI[c.estado] || ESTADOS_CONTRATO_UI.activo;
          const mes = c.mes_actual;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setAbiertoId(c.id)}
              className="fn-tarjeta-mant"
              style={{ textAlign: "left", cursor: "pointer", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${est.color}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 8, opacity: c.estado === "baja" ? 0.7 : 1, font: "inherit", color: COLORS.text }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.cliente?.nombre || "Sin cliente"}</div>
                  <div style={{ fontSize: 12.5, color: COLORS.textDim }}>{c.servicio}</div>
                </div>
                <InsigniaEstadoContrato estado={c.estado} />
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 700, color: COLORS.amber }}>
                {eurosMant(c.cuota)}<span style={{ fontSize: 12, color: COLORS.textDim, fontWeight: 500 }}> /mes</span>
              </div>
              {mes ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 12 }}>
                  <span style={{ background: COLORS.surfaceRaised, borderRadius: 999, padding: "3px 9px", color: COLORS.text }}>
                    {mayusculaInicial(mes.nombre)}: {mes.num_visitas} {mes.num_visitas === 1 ? "visita" : "visitas"}
                  </span>
                  <span style={{ borderRadius: 999, padding: "3px 9px", fontWeight: 600, color: mes.cuota_pagada ? COLORS.green : COLORS.statusAmber, background: mes.cuota_pagada ? `${COLORS.green}1A` : `${COLORS.statusAmber}1A` }}>
                    {mes.cuota_pagada ? "Cuota cobrada" : "Cuota sin cobrar"}
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: COLORS.textDim }}>
                  {c.estado === "pendiente" ? "Cuando lo confirmes, cámbialo a Activo y empezará a contar los meses." : "Sin actividad este mes."}
                </div>
              )}
              <div style={{ fontSize: 11.5, color: COLORS.textDim }}>
                {c.ultima_visita ? `Última visita: ${fechaDia(c.ultima_visita)}` : "Todavía sin visitas"}
                {c.proxima_visita && <span style={{ color: COLORS.amber, fontWeight: 600 }}> · Próxima: {fechaDia(c.proxima_visita)}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Crear o editar un contrato. Con "inicial" edita; sin él, crea (y deja pasar una orden in situ ya hecha).
function FormularioContrato({ inicial, onCancelar, onGuardado }) {
  const editando = !!inicial;
  const [clientes, setClientes] = useState([]);
  const [buscar, setBuscar] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [ordenesCliente, setOrdenesCliente] = useState([]);
  const [adoptarId, setAdoptarId] = useState("");
  const [adoptarMes, setAdoptarMes] = useState("");
  const [f, setF] = useState({
    servicio: inicial?.servicio || "Mantenimiento informático",
    cuota: inicial ? String(inicial.cuota).replace(".", ",") : "",
    direccion: inicial?.direccion || "",
    wifi_ssid: inicial?.wifi_ssid || "",
    wifi_password: inicial?.wifi_password || "",
    tareas: (inicial?.tareas || []).join("\n"),
    notas: inicial?.notas || "",
    estado: inicial?.estado || "activo",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const cambiar = (campo) => (e) => setF((prev) => ({ ...prev, [campo]: e.target.value }));
  const inputStyle = { width: "100%", fontSize: 13, padding: "9px 11px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box", marginTop: 4, fontFamily: "inherit" };
  const etiqueta = { fontSize: 12, color: COLORS.textDim, fontWeight: 600 };

  useEffect(() => {
    if (editando) return;
    apiGet("/clientes?incluir_contactos=true")
      .then((lista) => setClientes((lista || []).filter((c) => !esClienteEliminado(c))))
      .catch(() => setError("No se pudo cargar la lista de clientes."));
  }, [editando]);

  useEffect(() => {
    setOrdenesCliente([]);
    setAdoptarId("");
    if (!clienteId) return;
    apiGet(`/clientes/${clienteId}`)
      .then((d) => setOrdenesCliente((d.reparaciones || []).filter((r) => r.tipo_trabajo === "domicilio" && !r.contrato_id)))
      .catch(() => {});
  }, [clienteId]);

  function elegirOrden(id) {
    setAdoptarId(id);
    const orden = ordenesCliente.find((o) => String(o.id) === String(id));
    if (!orden) return;
    setF((prev) => ({
      ...prev,
      direccion: prev.direccion || orden.direccion_servicio || "",
      servicio: !prev.servicio.trim() || prev.servicio === "Mantenimiento informático" ? (orden.equipo || prev.servicio).slice(0, 100) : prev.servicio,
    }));
  }

  const filtrados = clientes.filter((c) => normalizar(c.nombre).includes(normalizar(buscar))).slice(0, 200);

  async function guardar() {
    setError("");
    if (!editando && !clienteId) { setError("Elige el cliente."); return; }
    if (!f.servicio.trim()) { setError("Escribe qué servicio es."); return; }
    const cuota = parseFloat(String(f.cuota).replace(",", "."));
    if (!(cuota >= 0)) { setError("Escribe la cuota mensual (precio final)."); return; }
    setGuardando(true);
    try {
      const datos = { ...f, cuota };
      let resultado;
      if (editando) {
        resultado = await apiPatch(`/mantenimientos/contratos/${inicial.id}`, datos);
      } else {
        resultado = await apiPost("/mantenimientos/contratos", {
          ...datos,
          cliente_id: Number(clienteId),
          ...(adoptarId ? { adoptar_reparacion_id: Number(adoptarId) } : {}),
          ...(adoptarId && adoptarMes ? { adoptar_periodo: adoptarMes } : {}),
        });
      }
      onGuardado(resultado);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{editando ? "Editar contrato" : "Nuevo contrato de mantenimiento"}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {!editando && (
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={etiqueta}>Cliente</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input placeholder="Buscar por nombre..." value={buscar} onChange={(e) => setBuscar(e.target.value)} style={{ ...inputStyle, flex: "1 1 180px", width: "auto" }} />
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} style={{ ...inputStyle, flex: "2 1 240px", width: "auto" }} aria-label="Cliente">
                <option value="">— Elige el cliente —</option>
                {filtrados.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.telefono ? ` · ${c.telefono}` : ""}</option>)}
              </select>
            </div>
          </div>
        )}
        {!editando && ordenesCliente.length > 0 && (
          <div style={{ gridColumn: "1 / -1", background: COLORS.surfaceRaised, borderRadius: 9, padding: 12 }}>
            <label style={etiqueta}>¿Pasar a este contrato una orden in situ que ya tienes?</label>
            <select value={adoptarId} onChange={(e) => elegirOrden(e.target.value)} style={inputStyle}>
              <option value="">No, empezar de cero</option>
              {ordenesCliente.map((o) => <option key={o.id} value={o.id}>#{o.numero_orden} · {o.equipo}</option>)}
            </select>
            {adoptarId && (
              <div style={{ marginTop: 8 }}>
                <label style={etiqueta}>Mes al que corresponde (si lo dejas vacío, el mes en que la cobraste)</label>
                <input type="month" value={adoptarMes} onChange={(e) => setAdoptarMes(e.target.value)} style={{ ...inputStyle, maxWidth: 220 }} />
                <div style={{ fontSize: 11.5, color: COLORS.textDim, marginTop: 6 }}>
                  Esa orden deja de salir en el tablero de reparaciones y sus cobros pasan a ser la cuota de ese mes.
                </div>
              </div>
            )}
          </div>
        )}
        <div>
          <label style={etiqueta}>Servicio</label>
          <input value={f.servicio} onChange={cambiar("servicio")} maxLength={100} style={inputStyle} />
        </div>
        <div>
          <label style={etiqueta}>Cuota mensual (precio final, €)</label>
          <input value={f.cuota} onChange={cambiar("cuota")} inputMode="decimal" placeholder="40" style={inputStyle} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={etiqueta}>Dirección</label>
          <input value={f.direccion} onChange={cambiar("direccion")} maxLength={200} style={inputStyle} />
        </div>
        <div>
          <label style={etiqueta}>WiFi (nombre)</label>
          <input value={f.wifi_ssid} onChange={cambiar("wifi_ssid")} maxLength={80} style={inputStyle} />
        </div>
        <div>
          <label style={etiqueta}>WiFi (contraseña)</label>
          <input value={f.wifi_password} onChange={cambiar("wifi_password")} maxLength={120} style={inputStyle} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={etiqueta}>Tareas incluidas (una por línea)</label>
          <textarea value={f.tareas} onChange={cambiar("tareas")} rows={4} placeholder={"Copias de seguridad\nActualizaciones de Windows\nRevisar antivirus"} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <div>
          <label style={etiqueta}>Estado</label>
          <select value={f.estado} onChange={cambiar("estado")} style={inputStyle}>
            <option value="activo">Activo</option>
            <option value="pendiente">Pendiente de confirmar</option>
            {editando && <option value="baja">Dado de baja</option>}
          </select>
        </div>
        <div>
          <label style={etiqueta}>Notas</label>
          <input value={f.notas} onChange={cambiar("notas")} style={inputStyle} />
        </div>
      </div>
      {error && <div style={{ fontSize: 12.5, color: COLORS.rust, marginTop: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
        <button onClick={onCancelar} style={{ ...btnStyle("transparent", COLORS.textDim, COLORS.line), flex: "none", padding: "9px 16px" }}>Cancelar</button>
        <button disabled={guardando} onClick={guardar} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "9px 18px" }}>
          {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear contrato"}
        </button>
      </div>
    </div>
  );
}

function FichaContratoMantenimiento({ id, onVolver, onCambio }) {
  const [contrato, setContrato] = useState(null);
  const [error, setError] = useState("");
  const [periodo, setPeriodo] = useState(null);
  const [editando, setEditando] = useState(false);

  const cargar = useCallback(async (periodoDeseado) => {
    try {
      const datos = await apiGet(`/mantenimientos/contratos/${id}`);
      setContrato(datos);
      setPeriodo((actual) => {
        const quiero = periodoDeseado || actual;
        if (quiero && datos.meses.some((m) => m.periodo === quiero)) return quiero;
        const hoy = periodoActualLocal();
        return datos.meses.some((m) => m.periodo === hoy) ? hoy : datos.meses[0]?.periodo || null;
      });
    } catch (e) {
      setError(`No se pudo abrir el contrato: ${e.message}`);
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  const refrescar = (p) => { cargar(p); onCambio?.(); };

  async function eliminarContrato() {
    if (!window.confirm("¿Borrar este contrato? Solo es para contratos creados por error. Si ya no lo haces, mejor cámbialo a «Dado de baja».")) return;
    try {
      await borrarEnApi(`/mantenimientos/contratos/${id}`);
      onCambio?.();
      onVolver();
    } catch (e) {
      window.alert(e.message);
    }
  }

  const volver = (
    <button onClick={onVolver} style={{ background: "none", border: "none", color: COLORS.amber, cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
      ← Todos los mantenimientos
    </button>
  );

  if (error) return <div>{volver}<div style={{ fontSize: 13, color: COLORS.rust }}>{error}</div></div>;
  if (!contrato) return <div>{volver}<div style={{ fontSize: 13, color: COLORS.textDim }}>Cargando...</div></div>;

  const telefono = (contrato.cliente?.telefono || "").replace(/\D/g, "");
  const mes = contrato.meses.find((m) => m.periodo === periodo);
  const tarjeta = { background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16 };

  return (
    <div>
      {volver}
      {editando ? (
        <FormularioContrato
          inicial={contrato}
          onCancelar={() => setEditando(false)}
          onGuardado={() => { setEditando(false); refrescar(); }}
        />
      ) : (
        <div style={{ ...tarjeta, marginBottom: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>{contrato.cliente?.nombre}</span>
                <InsigniaEstadoContrato estado={contrato.estado} />
              </div>
              <div style={{ fontSize: 13, color: COLORS.textDim, marginTop: 2 }}>
                {contrato.servicio} · <b style={{ color: COLORS.amber }}>{eurosMant(contrato.cuota)} al mes</b> (precio final, sin factura)
                {contrato.fecha_inicio && <> · desde {fechaDia(contrato.fecha_inicio)}</>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {telefono && (
                <a href={`https://wa.me/${telefono}`} target="_blank" rel="noreferrer" style={{ ...btnStyle(COLORS.green, "#FFFFFF"), flex: "none", padding: "8px 12px", fontSize: 12.5, textDecoration: "none" }}>
                  <IconoWhatsApp size={14} /> WhatsApp
                </a>
              )}
              {contrato.direccion && (
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contrato.direccion)}`} target="_blank" rel="noreferrer" style={{ ...btnStyle("transparent", COLORS.amber, COLORS.line), flex: "none", padding: "8px 12px", fontSize: 12.5, textDecoration: "none" }}>
                  <MapPin size={14} /> Cómo llegar
                </a>
              )}
              <button onClick={() => setEditando(true)} style={{ ...btnStyle("transparent", COLORS.text, COLORS.line), flex: "none", padding: "8px 12px", fontSize: 12.5 }}>
                <Pencil size={14} /> Editar
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 14, fontSize: 12.5 }}>
            <div>
              <div style={{ color: COLORS.textDim, fontWeight: 600, marginBottom: 3 }}>Dirección</div>
              <div>{contrato.direccion || "—"}</div>
            </div>
            <div>
              <div style={{ color: COLORS.textDim, fontWeight: 600, marginBottom: 3 }}>WiFi</div>
              <div>{contrato.wifi_ssid || "—"}{contrato.wifi_password && <> · <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{contrato.wifi_password}</span></>}</div>
            </div>
            <div>
              <div style={{ color: COLORS.textDim, fontWeight: 600, marginBottom: 3 }}>Tareas incluidas</div>
              <div>{contrato.tareas.length ? contrato.tareas.join(" · ") : "—"}</div>
            </div>
            {contrato.notas && (
              <div>
                <div style={{ color: COLORS.textDim, fontWeight: 600, marginBottom: 3 }}>Notas</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{contrato.notas}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Meses: cada uno con lo suyo */}
      <div style={{ fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Meses</div>
      {contrato.meses.length === 0 ? (
        <div style={{ ...tarjeta, fontSize: 13, color: COLORS.textDim, marginBottom: 14 }}>
          {contrato.estado === "pendiente" ? "El contrato está pendiente de confirmar. Cuando lo cambies a Activo aparecerá el mes en curso." : "Todavía no hay meses."}
          {contrato.estado !== "baja" && <div style={{ marginTop: 10 }}><NuevaVisitaMantenimiento contrato={contrato} onCreada={(p) => refrescar(p)} /></div>}
        </div>
      ) : (
        <div className="fn-sin-barra" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 12 }}>
          {contrato.meses.map((m) => {
            const activo = m.periodo === periodo;
            return (
              <button
                key={m.periodo}
                onClick={() => setPeriodo(m.periodo)}
                style={{ flexShrink: 0, textAlign: "left", cursor: "pointer", borderRadius: 10, padding: "8px 12px", border: `1.5px solid ${activo ? COLORS.amber : COLORS.line}`, background: activo ? `${COLORS.amber}10` : COLORS.surface, font: "inherit", color: COLORS.text }}
              >
                <div style={{ fontSize: 13, fontWeight: 700 }}>{mayusculaInicial(m.nombre)}</div>
                <div style={{ fontSize: 11, color: COLORS.textDim }}>
                  {m.num_visitas} {m.num_visitas === 1 ? "visita" : "visitas"} · <span style={{ color: m.cuota_pagada ? COLORS.green : COLORS.statusAmber, fontWeight: 600 }}>{m.cuota_pagada ? "cobrado" : "sin cobrar"}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {mes && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, alignItems: "start" }}>
          <CuotaDelMes contrato={contrato} mes={mes} onCambio={() => refrescar(mes.periodo)} />
          <div style={tarjeta}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Visitas de {mes.nombre}</div>
              <NuevaVisitaMantenimiento contrato={contrato} periodo={mes.periodo} onCreada={(p) => refrescar(p)} />
            </div>
            {mes.visitas.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Sin visitas este mes. Las visitas van incluidas en la cuota (no se cobran aparte).</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {mes.visitas.map((v) => (
                <VisitaMantenimientoTarjeta key={v.id} visita={v} tareas={contrato.tareas} onCambio={(p) => refrescar(p || mes.periodo)} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 22, textAlign: "right" }}>
        <button onClick={eliminarContrato} style={{ background: "none", border: "none", color: COLORS.rust, fontSize: 12, cursor: "pointer" }}>
          Borrar contrato (solo si se creó por error)
        </button>
      </div>
    </div>
  );
}

function NuevaVisitaMantenimiento({ contrato, periodo, onCreada }) {
  const hoy = hoyLocalISO();
  // Si estás mirando otro mes, propone el día 1 de ese mes; si es el mes en curso, hoy.
  const porDefecto = periodo && periodo !== hoy.slice(0, 7) ? `${periodo}-01` : hoy;
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(porDefecto);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setFecha(porDefecto); }, [porDefecto]);

  async function crear() {
    setError("");
    setGuardando(true);
    try {
      const v = await apiPost(`/mantenimientos/contratos/${contrato.id}/visitas`, { fecha });
      setAbierto(false);
      onCreada?.(v.fecha.slice(0, 7));
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "7px 12px", fontSize: 12.5 }}>
        <Plus size={14} /> Nueva visita
      </button>
    );
  }
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} aria-label="Fecha de la visita" style={{ fontSize: 12.5, padding: "6px 8px", borderRadius: 7, border: `1px solid ${COLORS.line}` }} />
      <button disabled={guardando || !fecha} onClick={crear} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "7px 12px", fontSize: 12.5 }}>{guardando ? "..." : "Añadir"}</button>
      <button onClick={() => setAbierto(false)} style={{ background: "none", border: "none", color: COLORS.textDim, cursor: "pointer" }} aria-label="Cancelar"><X size={15} /></button>
      {error && <div style={{ width: "100%", fontSize: 12, color: COLORS.rust }}>{error}</div>}
    </div>
  );
}

function CuotaDelMes({ contrato, mes, onCambio }) {
  const cuotaMes = mes.cuota ?? contrato.cuota; // la cuota acordada para ese mes
  const pendiente = Math.max(0, Math.round((cuotaMes - mes.cobrado) * 100) / 100);
  const [monto, setMonto] = useState(String(pendiente || cuotaMes).replace(".", ","));
  const [metodo, setMetodo] = useState("efectivo");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setMonto(String(pendiente || cuotaMes).replace(".", ",")); setError(""); }, [mes.periodo, pendiente, cuotaMes]);

  async function cobrar() {
    setError("");
    const importe = parseFloat(String(monto).replace(",", "."));
    if (!(importe > 0)) { setError("Indica un importe válido."); return; }
    setGuardando(true);
    try {
      await apiPost("/finanzas", {
        reparacion_id: mes.reparacion_id,
        tipo: "ingreso",
        concepto: `Cuota ${contrato.servicio} · ${mes.nombre}`,
        monto: importe,
        metodo_pago: metodo,
      });
      onCambio();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function verRecibo(m) {
    const ventana = window.open("", "_blank");
    try {
      await abrirPdfEnPestana(`${API_BASE}/recibos/movimiento/${m.id}/pdf`, ventana);
    } catch (e) {
      ventana?.close();
      setError("No se pudo abrir el recibo.");
    }
  }

  async function anular(m) {
    const motivo = window.prompt(`Vas a ANULAR el cobro de ${eurosMant(m.monto)}.\n\nNo se borra: se añade un apunte que lo compensa y queda constancia.\n\n¿Por qué lo anulas? (por ejemplo: "cobrado por error")`);
    if (motivo === null) return;
    if (!motivo.trim()) { setError("Hay que indicar el motivo para anular un cobro."); return; }
    setError("");
    const enviar = (confirmar) => fetch(`${API_BASE}/finanzas/${m.id}/anular`, { method: "POST", headers: cabecerasAuth({ "Content-Type": "application/json" }), body: JSON.stringify({ motivo, confirmar }) });
    try {
      let res = await enviar(false);
      manejar401(res);
      let datos = await res.json().catch(() => ({}));
      if (res.status === 409 && datos.requiere_confirmacion) {
        if (!window.confirm(datos.mensaje)) return;
        res = await enviar(true);
        manejar401(res);
        datos = await res.json().catch(() => ({}));
      }
      if (!res.ok) { setError(datos.mensaje || datos.error || "No se pudo anular el cobro."); return; }
      onCambio();
    } catch (e) {
      setError(`No se pudo anular: ${e.message}`);
    }
  }

  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderTop: `4px solid ${mes.cuota_pagada ? COLORS.green : COLORS.statusAmber}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Cuota de {mes.nombre}</div>
        <div style={{ fontSize: 11, color: COLORS.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>{mes.numero_orden}</div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "8px 0 12px" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 22, fontWeight: 700, color: mes.cuota_pagada ? COLORS.green : COLORS.text }}>{eurosMant(mes.cobrado)}</span>
        <span style={{ fontSize: 12.5, color: COLORS.textDim }}>de {eurosMant(cuotaMes)}</span>
        <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: "3px 9px", color: mes.cuota_pagada ? COLORS.green : COLORS.statusAmber, background: mes.cuota_pagada ? `${COLORS.green}1A` : `${COLORS.statusAmber}1A` }}>
          {mes.cuota_pagada ? "Cobrada" : "Sin cobrar"}
        </span>
      </div>

      {mes.cobros.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {mes.cobros.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, background: COLORS.surfaceRaised, borderRadius: 8, padding: "7px 10px" }}>
              <span style={{ flex: 1, minWidth: 0, color: COLORS.textDim }}>{m.fecha ? fechaLarga(m.fecha) : ""} · {m.metodo_pago}</span>
              <span style={{ color: COLORS.green, fontWeight: 600 }}>+{eurosMant(m.monto)}</span>
              <button onClick={() => verRecibo(m)} style={{ background: "none", border: "none", color: COLORS.statusBlue, fontSize: 11.5, cursor: "pointer", padding: 0 }}>Recibo</button>
              <button onClick={() => anular(m)} style={{ background: "none", border: "none", color: COLORS.rust, fontSize: 11.5, cursor: "pointer", padding: 0 }}>Anular</button>
            </div>
          ))}
        </div>
      )}

      {!mes.cuota_pagada && (
        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input value={monto} onChange={(e) => setMonto(e.target.value)} inputMode="decimal" aria-label="Importe a cobrar" style={{ flex: "1 1 90px", fontSize: 13, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}`, minWidth: 0 }} />
            <select value={metodo} onChange={(e) => setMetodo(e.target.value)} style={{ flex: "1 1 120px", fontSize: 12.5, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}` }}>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="bizum">Bizum</option>
            </select>
          </div>
          <button disabled={guardando} onClick={cobrar} style={{ ...btnStyle(COLORS.green, "#FFFFFF"), width: "100%", marginTop: 8, padding: "9px 12px" }}>
            {guardando ? "Registrando..." : `Cobrar cuota de ${mes.nombre}`}
          </button>
        </div>
      )}
      {error && <div style={{ fontSize: 12, color: COLORS.rust, marginTop: 8 }}>{error}</div>}
      <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 10 }}>Precio final con todo incluido. Sin factura; puedes dar el recibo.</div>
    </div>
  );
}

function VisitaMantenimientoTarjeta({ visita, tareas, onCambio }) {
  const [notas, setNotas] = useState(visita.notas || "");
  const [hechas, setHechas] = useState(visita.tareas_hechas || []);
  const [firmando, setFirmando] = useState(false);
  const [nombreFirmante, setNombreFirmante] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setNotas(visita.notas || ""); setHechas(visita.tareas_hechas || []); }, [visita.id, visita.notas, visita.tareas_hechas]);

  async function patch(datos, recargar = true) {
    setError("");
    try {
      const v = await apiPatch(`/mantenimientos/visitas/${visita.id}`, datos);
      if (recargar) onCambio(v.fecha?.slice(0, 7));
      return v;
    } catch (e) {
      setError(e.message);
    }
  }

  function marcarTarea(tarea, marcada) {
    const nuevas = marcada ? [...hechas, tarea] : hechas.filter((t) => t !== tarea);
    setHechas(nuevas);
    patch({ tareas_hechas: nuevas }, false);
  }

  async function firmar(dataUrl) {
    setGuardando(true);
    setError("");
    try {
      await apiPost(`/mantenimientos/visitas/${visita.id}/firma`, { firma_png: dataUrl, nombre_firmante: nombreFirmante });
      setFirmando(false);
      onCambio();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function borrar() {
    if (!window.confirm(`¿Borrar la visita del ${fechaDia(visita.fecha)}?`)) return;
    try {
      await borrarEnApi(`/mantenimientos/visitas/${visita.id}`);
      onCambio();
    } catch (e) {
      setError(e.message);
    }
  }

  let estado;
  if (visita.fin) estado = { texto: `Hecha · ${horaDe(visita.inicio)}–${horaDe(visita.fin)}${visita.minutos != null ? ` (${visita.minutos} min)` : ""}`, color: COLORS.green };
  else if (visita.inicio) estado = { texto: `En curso desde las ${horaDe(visita.inicio)}`, color: COLORS.statusBlue };
  else estado = { texto: "Sin empezar", color: COLORS.textDim };

  // Tareas del contrato + las que se marcaron antes y ya no están en el contrato
  const todasTareas = [...tareas, ...hechas.filter((t) => !tareas.includes(t))];

  return (
    <div style={{ border: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${estado.color}`, borderRadius: 10, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Calendar size={15} color={COLORS.textDim} />
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>{fechaLargaDia(visita.fecha)}</span>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: estado.color }}>{estado.texto}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {!visita.inicio && (
            <button onClick={() => patch({ empezar: true })} style={{ ...btnStyle(COLORS.statusBlue, "#FFFFFF"), flex: "none", padding: "6px 11px", fontSize: 12 }}>Empezar</button>
          )}
          {!visita.fin && (
            <button onClick={() => patch({ terminar: true })} style={{ ...btnStyle(COLORS.green, "#FFFFFF"), flex: "none", padding: "6px 11px", fontSize: 12 }}>Terminar</button>
          )}
          <button onClick={borrar} title="Borrar visita" aria-label="Borrar visita" style={{ background: "none", border: "none", color: COLORS.textDim, cursor: "pointer", padding: 4 }}><Trash2 size={15} /></button>
        </div>
      </div>

      {todasTareas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
          {todasTareas.map((t) => (
            <label key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, cursor: "pointer" }}>
              <input type="checkbox" checked={hechas.includes(t)} onChange={(e) => marcarTarea(t, e.target.checked)} style={{ width: 16, height: 16 }} />
              <span style={{ color: hechas.includes(t) ? COLORS.textDim : COLORS.text, textDecoration: hechas.includes(t) ? "line-through" : "none" }}>{t}</span>
            </label>
          ))}
        </div>
      )}

      <textarea
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        onBlur={() => { if ((notas || "") !== (visita.notas || "")) patch({ notas }, false); }}
        placeholder="Notas de la visita (qué se hizo, qué queda pendiente...)"
        rows={2}
        style={{ width: "100%", boxSizing: "border-box", marginTop: 10, fontSize: 12.5, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}`, resize: "vertical", fontFamily: "inherit" }}
      />

      <div style={{ marginTop: 8 }}>
        {visita.firmada && !firmando ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: COLORS.green }}>
            <CheckCircle2 size={14} /> Firmada{visita.nombre_firmante ? ` por ${visita.nombre_firmante}` : ""}
            <button onClick={() => setFirmando(true)} style={{ background: "none", border: "none", color: COLORS.textDim, fontSize: 11.5, cursor: "pointer", textDecoration: "underline" }}>Volver a firmar</button>
          </div>
        ) : firmando ? (
          <div>
            <input value={nombreFirmante} onChange={(e) => setNombreFirmante(e.target.value)} placeholder="Nombre de quien firma" style={{ width: "100%", boxSizing: "border-box", fontSize: 12.5, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}`, marginBottom: 8 }} />
            <PadFirma onGuardar={firmar} guardando={guardando} textoBoton="Guardar firma" />
            <button onClick={() => setFirmando(false)} style={{ background: "none", border: "none", color: COLORS.textDim, fontSize: 12, cursor: "pointer", marginTop: 4 }}>Cancelar</button>
          </div>
        ) : (
          <button onClick={() => setFirmando(true)} style={{ ...btnStyle("transparent", COLORS.amber, COLORS.line), flex: "none", padding: "6px 11px", fontSize: 12 }}>
            <Pencil size={13} /> Firma del cliente
          </button>
        )}
      </div>
      {error && <div style={{ fontSize: 12, color: COLORS.rust, marginTop: 6 }}>{error}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------
// FLOTA: vehículos de la empresa (ITV, seguro, mantenimiento, gastos, combustible).
// ---------------------------------------------------------------------
const TIPOS_REGISTRO_FLOTA = [
  { key: "itv", label: "ITV", color: COLORS.statusBlue },
  { key: "mantenimiento", label: "Mantenimiento", color: COLORS.green },
  { key: "combustible", label: "Repostaje", color: COLORS.statusAmber },
  { key: "reparacion", label: "Reparación", color: COLORS.rust },
  { key: "seguro", label: "Seguro", color: COLORS.violet },
  { key: "impuesto", label: "Impuesto", color: COLORS.teal },
  { key: "otro", label: "Otro gasto", color: COLORS.textDim },
];
const TIPO_FLOTA = Object.fromEntries(TIPOS_REGISTRO_FLOTA.map((t) => [t.key, t]));
const COMBUSTIBLES_FLOTA = [
  ["", "—"], ["diesel", "Diésel"], ["gasolina", "Gasolina"], ["hibrido", "Híbrido"], ["electrico", "Eléctrico"], ["glp", "GLP"],
];

function kmTexto(n) {
  return n == null ? "—" : `${Number(n).toLocaleString("es-ES")} km`;
}
function sumarDiasISO(iso, dias) {
  const [a, m, d] = iso.split("-").map(Number);
  const f = new Date(a, m - 1, d + dias);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}
function sumarMesesISO(iso, meses) {
  const [a, m, d] = iso.split("-").map(Number);
  const f = new Date(a, m - 1 + meses, 1);
  const ultimo = new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate();
  f.setDate(Math.min(d, ultimo));
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}
// Días que faltan hasta una fecha "AAAA-MM-DD" (negativo si ya pasó)
function diasHasta(iso) {
  if (!iso) return null;
  const [a, m, d] = iso.split("-").map(Number);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  return Math.round((new Date(a, m - 1, d) - hoy) / 86400000);
}

// Matrícula con aspecto de placa española
function PlacaMatricula({ matricula, grande }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "stretch", border: "1.5px solid #1F2937", borderRadius: 5, overflow: "hidden", background: "#FFFFFF", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: grande ? 17 : 13.5, letterSpacing: 1, lineHeight: 1, flexShrink: 0 }}>
      <span style={{ background: "#1D4ED8", color: "#FFFFFF", fontSize: grande ? 9 : 7.5, padding: grande ? "3px 4px" : "2px 3px", display: "flex", alignItems: "flex-end", fontFamily: "inherit", letterSpacing: 0 }}>E</span>
      <span style={{ padding: grande ? "5px 9px" : "4px 7px", color: "#111827" }}>{matricula}</span>
    </span>
  );
}

// Una de las tres "fechas clave" de un vehículo (ITV, seguro, mantenimiento) con su color
function EstadoFechaFlota({ titulo, fecha, kmFaltan, icono: Icono }) {
  const dias = diasHasta(fecha);
  let color = COLORS.green;
  let texto;
  if (fecha == null && kmFaltan == null) { color = COLORS.textDim; texto = "Sin fecha"; }
  else {
    const vencidoFecha = dias != null && dias < 0;
    const prontoFecha = dias != null && dias <= 30;
    const vencidoKm = kmFaltan != null && kmFaltan < 0;
    const prontoKm = kmFaltan != null && kmFaltan <= 1000;
    if (vencidoFecha || vencidoKm) color = COLORS.rust;
    else if (prontoFecha || prontoKm) color = COLORS.statusAmber;
    const partes = [];
    if (fecha) partes.push(dias < 0 ? `vencida hace ${-dias} d` : dias === 0 ? "hoy" : `en ${dias} d · ${fechaDia(fecha)}`);
    if (kmFaltan != null) partes.push(kmFaltan < 0 ? `pasado ${(-kmFaltan).toLocaleString("es-ES")} km` : `faltan ${kmFaltan.toLocaleString("es-ES")} km`);
    texto = partes.join(" · ");
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: `${color}12`, border: `1px solid ${color}40`, borderRadius: 9, padding: "7px 10px", minWidth: 0 }}>
      <Icono size={15} color={color} style={{ flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.4 }}>{titulo}</div>
        <div style={{ fontSize: 12, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{texto}</div>
      </div>
    </div>
  );
}

function FechasClaveFlota({ v, enColumna }) {
  const kmFaltan = v.proximo_mant_km ? v.proximo_mant_km - (v.km_actuales || 0) : null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: enColumna ? "1fr" : "repeat(auto-fit, minmax(190px, 1fr))", gap: enColumna ? 6 : 8 }}>
      <EstadoFechaFlota titulo="ITV" fecha={v.proxima_itv} icono={ShieldCheck} />
      <EstadoFechaFlota titulo="Seguro" fecha={v.seguro_vence} icono={FileText} />
      <EstadoFechaFlota titulo="Mantenimiento" fecha={v.proximo_mant_fecha} kmFaltan={kmFaltan} icono={Wrench} />
    </div>
  );
}

function FlotaView({ onCambio }) {
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [abiertoId, setAbiertoId] = useState(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setVehiculos(await apiGet("/flota/vehiculos"));
    } catch (e) {
      setError(String(e.message).includes("404")
        ? "El servidor todavía no tiene la sección de flota. Sube primero el backend nuevo."
        : `No se pudieron cargar los vehículos: ${e.message}`);
    } finally {
      setCargando(false);
    }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  if (abiertoId) {
    return <FichaVehiculo id={abiertoId} onVolver={() => { setAbiertoId(null); cargar(); }} onCambio={onCambio} />;
  }

  const enUso = vehiculos.filter((v) => v.activo);
  const gastoAnio = enUso.reduce((s, v) => s + (v.gasto_anio || 0), 0);
  const conAvisos = enUso.filter((v) => v.avisos.length > 0).length;

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: COLORS.textDim }}>
          {enUso.length} {enUso.length === 1 ? "vehículo" : "vehículos"} · {eurosMant(gastoAnio)} de gasto este año
          {conAvisos > 0 && <span style={{ color: COLORS.rust, fontWeight: 600 }}> · {conAvisos} con avisos</span>}
        </div>
        {!creando && (
          <button onClick={() => setCreando(true)} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "9px 16px", fontSize: 13 }}>
            <Plus size={15} /> Añadir vehículo
          </button>
        )}
      </div>

      {creando && (
        <FormularioVehiculo
          onCancelar={() => setCreando(false)}
          onGuardado={(v) => { setCreando(false); onCambio?.(); setAbiertoId(v.id); }}
        />
      )}

      {error && <div style={{ fontSize: 12.5, color: COLORS.rust, marginBottom: 10 }}>{error}</div>}
      {cargando && vehiculos.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Cargando...</div>}
      {!cargando && !error && vehiculos.length === 0 && !creando && (
        <div style={{ background: COLORS.surface, border: `1px dashed ${COLORS.line}`, borderRadius: 12, padding: 22, fontSize: 13, color: COLORS.textDim, textAlign: "center" }}>
          Aún no hay vehículos. Pulsa <b>Añadir vehículo</b> para dar de alta el de la empresa.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
        {vehiculos.map((v) => {
          const peor = v.avisos.some((a) => a.nivel === "vencido") ? COLORS.rust : v.avisos.length ? COLORS.statusAmber : COLORS.green;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setAbiertoId(v.id)}
              className="fn-tarjeta-mant"
              style={{ textAlign: "left", cursor: "pointer", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${v.activo ? peor : COLORS.textDim}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10, opacity: v.activo ? 1 : 0.65, font: "inherit", color: COLORS.text }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <PlacaMatricula matricula={v.matricula} />
                  <span style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{[v.marca, v.modelo].filter(Boolean).join(" ") || "Vehículo"}</span>
                </div>
                {!v.activo && <span style={{ fontSize: 11, color: COLORS.textDim, fontWeight: 600 }}>De baja</span>}
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 12.5, color: COLORS.textDim, flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Gauge size={14} /> {kmTexto(v.km_actuales)}</span>
                <span>{eurosMant(v.gasto_anio)} este año</span>
              </div>
              {v.activo && <FechasClaveFlota v={v} enColumna />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FormularioVehiculo({ inicial, onCancelar, onGuardado }) {
  const editando = !!inicial;
  const [f, setF] = useState({
    matricula: inicial?.matricula || "",
    marca: inicial?.marca || "",
    modelo: inicial?.modelo || "",
    anio: inicial?.anio ?? "",
    combustible: inicial?.combustible || "",
    km_actuales: inicial?.km_actuales ?? "",
    fecha_matriculacion: inicial?.fecha_matriculacion || "",
    proxima_itv: inicial?.proxima_itv || "",
    seguro_compania: inicial?.seguro_compania || "",
    seguro_poliza: inicial?.seguro_poliza || "",
    seguro_vence: inicial?.seguro_vence || "",
    intervalo_mant_km: inicial?.intervalo_mant_km ?? "",
    intervalo_mant_meses: inicial?.intervalo_mant_meses ?? "",
    proximo_mant_fecha: inicial?.proximo_mant_fecha || "",
    proximo_mant_km: inicial?.proximo_mant_km ?? "",
    notas: inicial?.notas || "",
    activo: inicial ? inicial.activo : true,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const cambiar = (campo) => (e) => setF((p) => ({ ...p, [campo]: e.target.value }));
  const inputStyle = { width: "100%", fontSize: 13, padding: "9px 11px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box", marginTop: 4, fontFamily: "inherit", background: "#FFFFFF" };
  const etiqueta = { fontSize: 12, color: COLORS.textDim, fontWeight: 600 };
  const grupo = { fontSize: 11.5, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6, gridColumn: "1 / -1", marginTop: 8, paddingTop: 10, borderTop: `1px solid ${COLORS.line}` };
  const Campo = ({ campo, texto, tipo = "text", ...resto }) => (
    <div>
      <label style={etiqueta}>{texto}</label>
      <input type={tipo} value={f[campo]} onChange={cambiar(campo)} style={inputStyle} {...resto} />
    </div>
  );

  async function guardar() {
    setError("");
    if (!f.matricula.trim()) { setError("Escribe la matrícula."); return; }
    setGuardando(true);
    try {
      const datos = { ...f };
      const res = editando ? await apiPatch(`/flota/vehiculos/${inicial.id}`, datos) : await apiPost("/flota/vehiculos", datos);
      onGuardado(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{editando ? "Editar vehículo" : "Nuevo vehículo"}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
        {Campo({ campo: "matricula", texto: "Matrícula", placeholder: "1234ABC", maxLength: 15 })}
        {Campo({ campo: "marca", texto: "Marca", placeholder: "Citroën" })}
        {Campo({ campo: "modelo", texto: "Modelo", placeholder: "Berlingo" })}
        {Campo({ campo: "anio", texto: "Año", inputMode: "numeric" })}
        <div>
          <label style={etiqueta}>Combustible</label>
          <select value={f.combustible} onChange={cambiar("combustible")} style={inputStyle}>
            {COMBUSTIBLES_FLOTA.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        {Campo({ campo: "km_actuales", texto: "Kilómetros actuales", inputMode: "numeric" })}
        {Campo({ campo: "fecha_matriculacion", texto: "Fecha de matriculación", tipo: "date" })}

        <div style={grupo}>ITV y seguro</div>
        {Campo({ campo: "proxima_itv", texto: "Próxima ITV (la pone la pegatina)", tipo: "date" })}
        {Campo({ campo: "seguro_compania", texto: "Compañía del seguro" })}
        {Campo({ campo: "seguro_poliza", texto: "Nº de póliza" })}
        {Campo({ campo: "seguro_vence", texto: "El seguro vence el", tipo: "date" })}

        <div style={grupo}>Mantenimiento</div>
        {Campo({ campo: "intervalo_mant_km", texto: "Cada cuántos km (ej. 15000)", inputMode: "numeric" })}
        {Campo({ campo: "intervalo_mant_meses", texto: "o cada cuántos meses (ej. 12)", inputMode: "numeric" })}
        {Campo({ campo: "proximo_mant_km", texto: "Próximo mantenimiento a los km", inputMode: "numeric" })}
        {Campo({ campo: "proximo_mant_fecha", texto: "Próximo mantenimiento (fecha)", tipo: "date" })}

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={etiqueta}>Notas (neumáticos, tipo de aceite, llaves...)</label>
          <textarea value={f.notas} onChange={cambiar("notas")} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        {editando && (
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={f.activo} onChange={(e) => setF((p) => ({ ...p, activo: e.target.checked }))} style={{ width: 16, height: 16 }} />
            En uso (quítalo si ya no es de la empresa)
          </label>
        )}
      </div>
      {!editando && <div style={{ fontSize: 11.5, color: COLORS.textDim, marginTop: 10 }}>Si pones «cada cuántos km» y no el próximo, se calcula solo desde los km actuales.</div>}
      {error && <div style={{ fontSize: 12.5, color: COLORS.rust, marginTop: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
        <button onClick={onCancelar} style={{ ...btnStyle("transparent", COLORS.textDim, COLORS.line), flex: "none", padding: "9px 16px" }}>Cancelar</button>
        <button disabled={guardando} onClick={guardar} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "9px 18px" }}>
          {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Añadir vehículo"}
        </button>
      </div>
    </div>
  );
}

function FichaVehiculo({ id, onVolver, onCambio }) {
  const [v, setV] = useState(null);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(false);
  const [registrando, setRegistrando] = useState(null); // tipo de registro abierto
  const [filtro, setFiltro] = useState("");
  const [kmNuevo, setKmNuevo] = useState("");
  const [guardandoKm, setGuardandoKm] = useState(false);

  const cargar = useCallback(async () => {
    try { setV(await apiGet(`/flota/vehiculos/${id}`)); }
    catch (e) { setError(`No se pudo abrir el vehículo: ${e.message}`); }
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  async function guardarKm() {
    const km = parseInt(String(kmNuevo).replace(/\D/g, ""), 10);
    if (!(km >= 0)) return;
    if (km < v.km_actuales && !window.confirm(`Pones menos km (${km.toLocaleString("es-ES")}) de los que tenía (${v.km_actuales.toLocaleString("es-ES")}). ¿Seguro?`)) return;
    setGuardandoKm(true);
    try { setV(await apiPatch(`/flota/vehiculos/${id}`, { km_actuales: km })); setKmNuevo(""); onCambio?.(); }
    catch (e) { window.alert(e.message); }
    finally { setGuardandoKm(false); }
  }

  async function borrarRegistro(r) {
    const extra = r.en_caja ? "\n\nSu gasto en Caja se ANULARÁ (queda constancia, no se borra)." : "";
    if (!window.confirm(`¿Borrar este registro de ${TIPO_FLOTA[r.tipo]?.label || r.tipo} del ${fechaDia(r.fecha)}?${extra}`)) return;
    try { const res = await borrarEnApi(`/flota/registros/${r.id}`); setV(res.vehiculo); onCambio?.(); }
    catch (e) { window.alert(e.message); }
  }

  async function eliminarVehiculo() {
    if (!window.confirm("¿Borrar este vehículo? Solo es para vehículos añadidos por error. Si ya no es de la empresa, mejor edítalo y quita «En uso».")) return;
    try { await borrarEnApi(`/flota/vehiculos/${id}`); onCambio?.(); onVolver(); }
    catch (e) { window.alert(e.message); }
  }

  const volver = (
    <button onClick={onVolver} style={{ background: "none", border: "none", color: COLORS.amber, cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 12 }}>
      ← Todos los vehículos
    </button>
  );
  if (error) return <div>{volver}<div style={{ fontSize: 13, color: COLORS.rust }}>{error}</div></div>;
  if (!v) return <div>{volver}<div style={{ fontSize: 13, color: COLORS.textDim }}>Cargando...</div></div>;

  const tarjeta = { background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16 };
  const registros = filtro ? v.registros.filter((r) => r.tipo === filtro) : v.registros;
  const tiposConGasto = Object.entries(v.gasto_anio_por_tipo || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      {volver}
      {editando ? (
        <FormularioVehiculo inicial={v} onCancelar={() => setEditando(false)} onGuardado={(nuevo) => { setEditando(false); setV(nuevo); onCambio?.(); }} />
      ) : (
        <div style={{ ...tarjeta, marginBottom: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", minWidth: 0 }}>
              <PlacaMatricula matricula={v.matricula} grande />
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{[v.marca, v.modelo].filter(Boolean).join(" ") || "Vehículo"}{!v.activo && <span style={{ fontSize: 12, color: COLORS.textDim, fontWeight: 600 }}> · De baja</span>}</div>
                <div style={{ fontSize: 12.5, color: COLORS.textDim }}>
                  {[v.anio, COMBUSTIBLES_FLOTA.find(([k]) => k === v.combustible)?.[1], v.seguro_compania && `Seguro: ${v.seguro_compania}${v.seguro_poliza ? ` (${v.seguro_poliza})` : ""}`].filter((x) => x && x !== "—").join(" · ")}
                </div>
              </div>
            </div>
            <button onClick={() => setEditando(true)} style={{ ...btnStyle("transparent", COLORS.text, COLORS.line), flex: "none", padding: "8px 12px", fontSize: 12.5 }}>
              <Pencil size={14} /> Editar
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "flex-end", margin: "16px 0 14px" }}>
            <div>
              <div style={{ fontSize: 11.5, color: COLORS.textDim, fontWeight: 600 }}>KILÓMETROS</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 24, fontWeight: 700 }}>{(v.km_actuales || 0).toLocaleString("es-ES")}</div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input value={kmNuevo} onChange={(e) => setKmNuevo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && guardarKm()} inputMode="numeric" placeholder="Km de hoy" aria-label="Kilómetros de hoy" style={{ width: 120, fontSize: 13, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}` }} />
              <button disabled={guardandoKm || !kmNuevo} onClick={guardarKm} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "8px 12px", fontSize: 12.5 }}>Actualizar km</button>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: COLORS.textDim, fontWeight: 600 }}>GASTO ESTE AÑO</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontWeight: 700, color: COLORS.amber }}>{eurosMant(v.gasto_anio)}</div>
            </div>
            {v.consumo_medio != null && (
              <div>
                <div style={{ fontSize: 11.5, color: COLORS.textDim, fontWeight: 600 }}>CONSUMO MEDIO</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontWeight: 700 }}>{String(v.consumo_medio).replace(".", ",")} <span style={{ fontSize: 12, color: COLORS.textDim }}>l/100 km</span></div>
              </div>
            )}
          </div>

          <FechasClaveFlota v={v} />
          {(v.intervalo_mant_km || v.intervalo_mant_meses) && (
            <div style={{ fontSize: 11.5, color: COLORS.textDim, marginTop: 8 }}>
              Mantenimiento cada {[v.intervalo_mant_km && kmTexto(v.intervalo_mant_km), v.intervalo_mant_meses && `${v.intervalo_mant_meses} meses`].filter(Boolean).join(" o ")} (lo que llegue antes).
            </div>
          )}
          {tiposConGasto.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
              {tiposConGasto.map(([tipo, total]) => (
                <span key={tipo} style={{ fontSize: 11.5, borderRadius: 999, padding: "3px 9px", background: `${TIPO_FLOTA[tipo]?.color || COLORS.textDim}18`, color: TIPO_FLOTA[tipo]?.color || COLORS.textDim, fontWeight: 600 }}>
                  {TIPO_FLOTA[tipo]?.label || tipo}: {eurosMant(total)}
                </span>
              ))}
            </div>
          )}
          {v.notas && <div style={{ fontSize: 12.5, marginTop: 12, whiteSpace: "pre-wrap", color: COLORS.textDim }}>{v.notas}</div>}
        </div>
      )}

      {/* Registrar algo */}
      <div style={{ ...tarjeta, marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Registrar</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TIPOS_REGISTRO_FLOTA.map((t) => (
            <button key={t.key} onClick={() => setRegistrando(registrando === t.key ? null : t.key)}
              style={{ ...btnStyle(registrando === t.key ? t.color : "transparent", registrando === t.key ? "#FFFFFF" : t.color, t.color), flex: "none", padding: "7px 12px", fontSize: 12.5 }}>
              {t.label}
            </button>
          ))}
        </div>
        {registrando && (
          <FormularioRegistroVehiculo
            key={registrando}
            tipo={registrando}
            vehiculo={v}
            onCancelar={() => setRegistrando(null)}
            onGuardado={(nuevo) => { setRegistrando(null); setV(nuevo); onCambio?.(); }}
          />
        )}
      </div>

      {/* Historial */}
      <div style={tarjeta}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Historial</div>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar historial" style={{ fontSize: 12.5, padding: "6px 9px", borderRadius: 7, border: `1px solid ${COLORS.line}` }}>
            <option value="">Todo</option>
            {TIPOS_REGISTRO_FLOTA.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
        {registros.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.textDim }}>Nada registrado todavía.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {registros.map((r) => {
            const t = TIPO_FLOTA[r.tipo] || { label: r.tipo, color: COLORS.textDim };
            const detalles = [
              r.km != null && kmTexto(r.km),
              r.litros != null && `${String(r.litros).replace(".", ",")} l`,
              r.resultado && `Resultado: ${r.resultado}`,
              r.lugar,
            ].filter(Boolean).join(" · ");
            return (
              <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", borderLeft: `3px solid ${t.color}`, background: COLORS.surfaceRaised, borderRadius: 8, padding: "9px 12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.label}</span>
                    <span style={{ fontSize: 12, color: COLORS.textDim }}>{fechaDia(r.fecha)}</span>
                    {r.en_caja && <span style={{ fontSize: 10.5, fontWeight: 600, color: COLORS.green, background: `${COLORS.green}18`, borderRadius: 999, padding: "1px 7px" }}>En Caja</span>}
                  </div>
                  {detalles && <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>{detalles}</div>}
                  {r.descripcion && <div style={{ fontSize: 12.5, marginTop: 3, whiteSpace: "pre-wrap" }}>{r.descripcion}</div>}
                </div>
                {r.coste != null && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>{eurosMant(r.coste)}</span>}
                <button onClick={() => borrarRegistro(r)} title="Borrar registro" aria-label="Borrar registro" style={{ background: "none", border: "none", color: COLORS.textDim, cursor: "pointer", padding: 2 }}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 22, textAlign: "right" }}>
        <button onClick={eliminarVehiculo} style={{ background: "none", border: "none", color: COLORS.rust, fontSize: 12, cursor: "pointer" }}>
          Borrar vehículo (solo si se añadió por error)
        </button>
      </div>
    </div>
  );
}

function FormularioRegistroVehiculo({ tipo, vehiculo, onCancelar, onGuardado }) {
  const hoy = hoyLocalISO();
  const sugerenciaProxima = () => {
    if (tipo === "itv") return sumarDiasISO(hoy, 365);
    if (tipo === "seguro") return sumarDiasISO(hoy, 365);
    if (tipo === "mantenimiento" && vehiculo.intervalo_mant_meses) return sumarMesesISO(hoy, vehiculo.intervalo_mant_meses);
    return "";
  };
  const [f, setF] = useState({
    fecha: hoy,
    km: "",
    coste: "",
    litros: "",
    resultado: "favorable",
    lugar: "",
    descripcion: "",
    proxima_fecha: sugerenciaProxima(),
    proximo_km: "",
    seguro_compania: vehiculo.seguro_compania || "",
    apuntar_en_caja: true,
    metodo_pago: "tarjeta",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const cambiar = (campo) => (e) => setF((p) => ({ ...p, [campo]: e.target.value }));
  const inputStyle = { width: "100%", fontSize: 13, padding: "8px 10px", borderRadius: 7, border: `1px solid ${COLORS.line}`, boxSizing: "border-box", marginTop: 4, fontFamily: "inherit", background: "#FFFFFF" };
  const etiqueta = { fontSize: 12, color: COLORS.textDim, fontWeight: 600 };
  const t = TIPO_FLOTA[tipo];

  // ITV desfavorable: hay 2 meses para volver; con resultado favorable, la próxima suele ser en 1 o 2 años
  function cambiarResultado(e) {
    const resultado = e.target.value;
    setF((p) => ({ ...p, resultado, proxima_fecha: resultado === "favorable" ? sumarDiasISO(p.fecha, 365) : sumarMesesISO(p.fecha, 2) }));
  }
  // Mantenimiento: al escribir los km, propone el próximo según "cada cuántos km"
  const kmPropuesto = tipo === "mantenimiento" && vehiculo.intervalo_mant_km
    ? (parseInt(String(f.km).replace(/\D/g, ""), 10) || vehiculo.km_actuales || 0) + vehiculo.intervalo_mant_km
    : null;

  async function guardar() {
    setError("");
    if (tipo === "combustible" && !f.litros && !f.coste) { setError("Pon al menos los litros o el importe."); return; }
    setGuardando(true);
    try {
      const datos = {
        tipo,
        fecha: f.fecha,
        km: f.km.trim() ? f.km.replace(/\D/g, "") : null,
        coste: f.coste.trim() ? f.coste : null,
        litros: tipo === "combustible" && f.litros.trim() ? f.litros : null,
        resultado: tipo === "itv" ? f.resultado : null,
        lugar: f.lugar,
        descripcion: f.descripcion,
        proxima_fecha: ["itv", "seguro", "mantenimiento"].includes(tipo) ? f.proxima_fecha || null : null,
        proximo_km: tipo === "mantenimiento" ? (f.proximo_km.trim() ? f.proximo_km.replace(/\D/g, "") : null) : null,
        seguro_compania: tipo === "seguro" ? f.seguro_compania : undefined,
        apuntar_en_caja: f.apuntar_en_caja,
        metodo_pago: f.metodo_pago,
      };
      const res = await apiPost(`/flota/vehiculos/${vehiculo.id}/registros`, datos);
      onGuardado(res.vehiculo);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  const lugarTexto = { itv: "Estación ITV", mantenimiento: "Taller", reparacion: "Taller", combustible: "Gasolinera", seguro: "", impuesto: "Ayuntamiento", otro: "Dónde" }[tipo];

  return (
    <div style={{ marginTop: 14, borderTop: `3px solid ${t.color}`, background: COLORS.surfaceRaised, borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: t.color, marginBottom: 10 }}>{t.label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        <div><label style={etiqueta}>Fecha</label><input type="date" value={f.fecha} max={hoy} onChange={cambiar("fecha")} style={inputStyle} /></div>
        {tipo !== "seguro" && tipo !== "impuesto" && (
          <div><label style={etiqueta}>Km del vehículo</label><input value={f.km} onChange={cambiar("km")} inputMode="numeric" placeholder={String(vehiculo.km_actuales || "")} style={inputStyle} /></div>
        )}
        {tipo === "combustible" && (
          <div><label style={etiqueta}>Litros</label><input value={f.litros} onChange={cambiar("litros")} inputMode="decimal" style={inputStyle} /></div>
        )}
        <div><label style={etiqueta}>{tipo === "combustible" ? "Importe (€)" : "Coste (€)"}</label><input value={f.coste} onChange={cambiar("coste")} inputMode="decimal" placeholder="0" style={inputStyle} /></div>
        {tipo === "itv" && (
          <div>
            <label style={etiqueta}>Resultado</label>
            <select value={f.resultado} onChange={cambiarResultado} style={inputStyle}>
              <option value="favorable">Favorable</option>
              <option value="desfavorable">Desfavorable (hay que volver)</option>
              <option value="negativa">Negativa</option>
            </select>
          </div>
        )}
        {tipo === "seguro" && (
          <div><label style={etiqueta}>Compañía</label><input value={f.seguro_compania} onChange={cambiar("seguro_compania")} style={inputStyle} /></div>
        )}
        {lugarTexto && <div><label style={etiqueta}>{lugarTexto}</label><input value={f.lugar} onChange={cambiar("lugar")} maxLength={100} style={inputStyle} /></div>}
        {["itv", "seguro", "mantenimiento"].includes(tipo) && (
          <div>
            <label style={etiqueta}>{tipo === "itv" ? "Próxima ITV" : tipo === "seguro" ? "El seguro nuevo vence el" : "Próximo mantenimiento (fecha)"}</label>
            <input type="date" value={f.proxima_fecha} onChange={cambiar("proxima_fecha")} style={inputStyle} />
          </div>
        )}
        {tipo === "mantenimiento" && (
          <div>
            <label style={etiqueta}>Próximo mantenimiento (km)</label>
            <input value={f.proximo_km} onChange={cambiar("proximo_km")} inputMode="numeric" placeholder={kmPropuesto ? `${kmPropuesto.toLocaleString("es-ES")} (automático)` : ""} style={inputStyle} />
          </div>
        )}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={etiqueta}>{tipo === "mantenimiento" || tipo === "reparacion" ? "Qué se hizo" : "Notas"}</label>
          <textarea value={f.descripcion} onChange={cambiar("descripcion")} rows={2} placeholder={tipo === "mantenimiento" ? "Aceite, filtros, pastillas de freno..." : ""} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
      </div>
      {tipo === "itv" && <div style={{ fontSize: 11.5, color: COLORS.textDim, marginTop: 8 }}>La fecha de la próxima ITV viene en la pegatina y en el informe. Si es desfavorable, hay 2 meses para volver.</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, cursor: "pointer" }}>
          <input type="checkbox" checked={f.apuntar_en_caja} onChange={(e) => setF((p) => ({ ...p, apuntar_en_caja: e.target.checked }))} style={{ width: 16, height: 16 }} />
          Apuntar el coste como gasto en Caja
        </label>
        {f.apuntar_en_caja && (
          <select value={f.metodo_pago} onChange={cambiar("metodo_pago")} aria-label="Cómo se pagó" style={{ fontSize: 12.5, padding: "6px 9px", borderRadius: 7, border: `1px solid ${COLORS.line}` }}>
            <option value="tarjeta">Tarjeta</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="bizum">Bizum</option>
          </select>
        )}
      </div>
      {error && <div style={{ fontSize: 12.5, color: COLORS.rust, marginTop: 8 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
        <button onClick={onCancelar} style={{ ...btnStyle("transparent", COLORS.textDim, COLORS.line), flex: "none", padding: "8px 14px" }}>Cancelar</button>
        <button disabled={guardando} onClick={guardar} style={{ ...btnStyle(t.color, "#FFFFFF"), flex: "none", padding: "8px 16px" }}>{guardando ? "Guardando..." : "Guardar"}</button>
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
                  <span style={{ fontSize: 10.5, color: COLORS.amber, background: COLORS.tintAmbar, padding: "2px 7px", borderRadius: 999, whiteSpace: "nowrap" }}>
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

// -------------------- Manual de uso (se ve en Ajustes) --------------------
// Cada apartado tiene bloques: "p" (párrafo), "pasos" (lista numerada), "lista" (puntos) y "nota" (aviso destacado).
// Para cambiar el manual basta con editar estos textos.
const MANUAL_SECCIONES = [
  {
    id: "inicio", icono: "🚀", titulo: "Primeros pasos",
    bloques: [
      { t: "p", x: "Este panel sirve para llevar todo el negocio desde un solo sitio: las reparaciones del taller, los servicios a domicilio, los clientes, los cobros, las facturas, el inventario y los avisos." },
      { t: "pasos", titulo: "Antes de empezar a trabajar", x: [
        "Entra en Ajustes y rellena los Datos del negocio: nombre, dirección, teléfono, email, tu NIF y el % de IVA. Sin NIF y dirección no se pueden emitir facturas.",
        "Añade los técnicos (aunque solo seas tú) en el apartado Técnicos de Ajustes.",
        "Configura los avisos por Telegram (te llegan los avisos urgentes, las solicitudes de la web y la copia de seguridad diaria).",
        "Si cobras por Bizum, escribe tu número de Bizum.",
        "Pulsa Guardar cambios.",
      ] },
      { t: "lista", titulo: "Cómo moverte", x: [
        "Botón ☰ (arriba a la izquierda): abre el menú lateral con todas las secciones.",
        "Nombre FIRZTNET (al lado del ☰): te devuelve a la pantalla principal desde cualquier sitio.",
        "Campanita 🔔 (arriba a la derecha): avisos pendientes. Al pulsar un aviso te lleva a lo que corresponde.",
        "Tu nombre y Salir (arriba a la derecha): cierra la sesión.",
        "En el móvil, el menú está en la barra de abajo; las secciones que no caben están en Más.",
      ] },
      { t: "nota", x: "La sesión dura 14 días. Pasado ese tiempo, el panel te pide otra vez usuario y contraseña." },
    ],
  },
  {
    id: "principal", icono: "🏠", titulo: "La pantalla principal",
    bloques: [
      { t: "p", x: "Es la pantalla de Reparaciones. Arriba eliges si ves el Taller Físico o el Servicio In-Situ / Domicilio con el botón azul de la derecha." },
      { t: "lista", titulo: "Las 10 tarjetas", x: [
        "Reparaciones totales, En curso y Entregadas: al pulsarlas filtran las tablas de abajo. Vuelve a pulsar para quitar el filtro.",
        "Clientes: número de clientes activos (sin contar los eliminados). Al pulsarla vas a Clientes.",
        "Retrasadas / urgentes: órdenes marcadas como urgentes o con más de 5 días sin terminar.",
        "Mantenimientos: contratos de mantenimiento activos y cuántas cuotas del mes quedan sin cobrar. Al pulsarla vas a Mantenimientos.",
        "Sistemas: abre sistemas.firztnet.es (tus otros sistemas) en una pestaña nueva. El balance del día sigue en Reportes.",
        "Este mes: ingresos y gastos del mes. Al pulsarla vas a Reportes.",
        "Stock: repuestos con stock bajo. Al pulsarla vas a Inventario.",
        "Nueva reparación: abre el formulario para dar de alta un equipo o un servicio.",
      ] },
      { t: "lista", titulo: "Buscar órdenes (la lupa de arriba, junto a la campana)", x: [
        "Abre una pantalla con el buscador y su tablero con los resultados.",
        "Busca por nombre del cliente, teléfono, número de orden, equipo, marca o modelo (da igual las tildes).",
        "Filtros: Taller e In Situ (o solo uno de los dos), Marca y Modelo, Cliente, Estado, Hoy (recibido hoy) y Urgente.",
        "Quitar filtros: deja la búsqueda como al principio.",
      ] },
      { t: "p", x: "Debajo de las tablas pueden salir avisos: equipos listos sin recoger hace más de 30 días, presupuestos rechazados y garantías a punto de caducar. Si no hay avisos, no sale nada." },
    ],
  },
  {
    id: "tablas", icono: "📋", titulo: "Las tablas de órdenes",
    bloques: [
      { t: "lista", titulo: "Hay dos tablas", x: [
        "Tablero de órdenes - Pendientes / En curso: todo lo que no está terminado (y lo entregado hoy), primero lo urgente y después lo más antiguo. Incluye taller y domicilio.",
        "Tablero completo: todas las órdenes del tipo que tengas elegido (taller o domicilio), según los filtros de arriba.",
      ] },
      { t: "p", x: "Cada tabla enseña 6 órdenes. Para ver las siguientes, pon el ratón encima de la tabla y gira la rueda (en el móvil, desliza con el dedo). Un ligero degradado abajo indica que hay más." },
      { t: "lista", titulo: "Columnas", x: [
        "# Orden: número de la orden. La llamita 🔥 indica urgente. La raya de color a la izquierda es el color del estado.",
        "Fecha: día en que se recibió (en las visitas in situ, el día de la visita).",
        "Días: días desde que se recibió. En rojo a partir de 5 días. En las visitas in situ con fecha: cuánto falta (En 30 días), Hoy, o los días de retraso.",
        "Estado: en qué punto está.",
        "WhatsApp: abre el chat con el cliente y un mensaje ya escrito. Sale en gris si no tiene teléfono.",
        "Factura: solo aparece cuando la orden está entregada o completada.",
      ] },
      { t: "p", x: "Al pulsar cualquier fila se abre la ficha de la orden." },
      { t: "lista", titulo: "Menú ⋮ de Acciones", x: [
        "Ver orden: abre la ficha completa.",
        "Editar: abre una ventana solo con los datos de la orden (equipo, marca, modelo, problema, accesorios, técnico, fecha estimada, urgente...) para corregirlos.",
        "WhatsApp: abre el chat con el cliente.",
        "Factura: si ya tiene, abre el PDF directamente. Si no, te enseña lo cobrado y te deja emitirla.",
        "Imprimir etiqueta: PDF de la etiqueta con código QR para pegar en el equipo.",
        "Adjuntar fotos: sube fotos a la orden sin abrir la ficha.",
        "Eliminar: borra la orden (ver el apartado Eliminar una orden).",
      ] },
      { t: "nota", x: "Las órdenes de clientes eliminados (RGPD) no se ven en el Tablero completo. Al pie de la tabla hay un enlace Ver para mostrarlas si hace falta." },
    ],
  },
  {
    id: "nueva", icono: "➕", titulo: "Dar de alta una reparación",
    bloques: [
      { t: "pasos", x: [
        "Pulsa la tarjeta Nueva reparación.",
        "Elige Taller o Domicilio.",
        "Escribe el nombre del cliente. Si ya existe, aparecerá en la lista: elígelo y se rellenan sus datos (y te avisa si tiene equipos en garantía o trabajos sin cobrar). Si es nuevo, pon su teléfono y, si quieres, su email (para enviarle el comprobante).",
        "En taller: equipo, marca, modelo y el problema que cuenta el cliente. A domicilio: descripción del servicio, categoría (redes, cámaras, impresoras, mantenimiento) y dirección.",
        "Opcional: marca Urgente, pon la fecha estimada de entrega y el técnico responsable.",
        "Guarda. La orden recibe su número automático (por ejemplo 2026-0012).",
      ] },
      { t: "p", x: "El botón Ver casos parecidos en tu historial te enseña reparaciones anteriores parecidas, para orientarte con el diagnóstico y el precio." },
      { t: "nota", x: "Si marcas una orden como Urgente, te llega un aviso por Telegram." },
    ],
  },
  {
    id: "ficha", icono: "🗂️", titulo: "La ficha de una orden",
    bloques: [
      { t: "p", x: "Se abre al pulsar una fila de las tablas. Reúne todo lo de esa orden. Lo que ves depende de si es de taller o a domicilio y del estado en que está." },
      { t: "lista", titulo: "Datos y documentos", x: [
        "Imprimir etiqueta con QR: para pegar en el equipo y encontrarlo rápido.",
        "Técnico responsable y Fecha estimada de entrega: se cambian ahí mismo.",
        "WiFi (solo a domicilio): nombre de la red y contraseña del cliente.",
        "Fotos de recepción: fotos de rayones o golpes al recibir el equipo, para evitar discusiones después.",
        "Repuestos usados: elige un repuesto del inventario y se descuenta del stock. Puedes apuntar el número de serie (o escanearlo con la cámara del móvil) y la factura de compra, para las garantías.",
        "Comprobante: genera el PDF para el cliente (de recepción, de entrega o de no reparable, según el estado). Se puede ver, mandar por WhatsApp o por email.",
      ] },
      { t: "lista", titulo: "Mensajes rápidos por WhatsApp", x: [
        "🚗 En camino (a domicilio): avisa de que vas y en cuántos minutos llegas.",
        "📦 Falta pieza (solo taller): avisa de que has pedido un repuesto y cuándo llega.",
        "💳 Solicitar por Bizum: pide el pago con tu número de Bizum (solo si lo has puesto en Ajustes).",
      ] },
      { t: "lista", titulo: "Trabajo a domicilio", x: [
        "Mano de obra: pulsa Iniciar servicio al empezar y Finalizar servicio al terminar. El panel cuenta el tiempo y calcula el coste con tu tarifa por hora.",
        "Hoja de trabajo: lista de puntos a revisar. Hay plantillas por tipo de servicio. Si cierras con puntos sin marcar, te avisa.",
        "Parte de trabajo (al completar): PDF con el servicio realizado, para mandárselo al cliente.",
        "Recordatorio de mantenimiento (al completar): programa un aviso para dentro de 6 o 12 meses.",
        "En los servicios in situ no salen la etiqueta QR, las fotos de recepción, el presupuesto ni los repuestos (salvo que esa orden ya tenga alguno apuntado).",
      ] },
      { t: "p", x: "En taller hay un Checklist de salida (cargador incluido, teclado probado, pantalla probada...) para no olvidar nada al entregar." },
    ],
  },
  {
    id: "estados", icono: "🔄", titulo: "Estados y cómo avanzar",
    bloques: [
      { t: "lista", titulo: "Taller", x: [
        "Recibido → Diagnóstico → En reparación → Listo para entrega → Entregado.",
        "No reparable: cuando no tiene arreglo (hay que escribir el motivo).",
      ] },
      { t: "lista", titulo: "A domicilio", x: [
        "Contratado → En proceso → Completado.",
        "No realizado: cuando no se pudo hacer (con motivo).",
      ] },
      { t: "p", x: "En la ficha, el apartado Avanzar reparación tiene un botón con el siguiente paso. Para No reparable / No realizado, escribe primero el motivo." },
      { t: "lista", titulo: "Reglas importantes", x: [
        "No se puede entregar un equipo sin ningún cobro registrado.",
        "Si lo cobrado es menos que el presupuesto, el panel pregunta antes de entregar.",
        "Al entregar o completar empieza la garantía de 6 meses.",
        "Si un equipo No reparable se lo lleva el cliente, usa El cliente ha recogido el equipo (sin reparar): se entrega sin garantía.",
        "Al llegar a Listo, Entregado o Completado puedes pedir la firma del cliente en la pantalla (firma de recogida o de conformidad).",
      ] },
      { t: "nota", x: "Si tienes plantillas de mensaje asignadas a un estado (ver Plantillas), al llegar a ese estado aparece el mensaje ya escrito con un botón para enviarlo por WhatsApp." },
    ],
  },
  {
    id: "presupuesto", icono: "📝", titulo: "Presupuestos y firma del cliente",
    bloques: [
      { t: "pasos", x: [
        "En la ficha, apartado Presupuesto, escribe la descripción y el importe.",
        "Si dudas del precio, pulsa Sugerir precio según mi historial: calcula un precio con tus trabajos anteriores parecidos.",
        "Pulsa Crear presupuesto. Puedes verlo en PDF.",
        "Pulsa Enviar presupuesto y pedir firma por WhatsApp: al cliente le llega un enlace a su página de seguimiento.",
        "El cliente lo acepta firmando con el dedo en su móvil, o lo rechaza.",
      ] },
      { t: "lista", x: [
        "Si lo acepta: queda guardada su firma, la fecha y la IP, y la orden pasa sola al siguiente paso (de Diagnóstico a En reparación, o de Contratado a En proceso).",
        "Si lo rechaza: aparece un aviso en la pantalla principal y en la campanita.",
        "Si cambias el presupuesto, vuelve a quedar pendiente y hay que pedir que lo acepte de nuevo.",
      ] },
    ],
  },
  {
    id: "cobros", icono: "💶", titulo: "Cobros, recibos y facturas",
    bloques: [
      { t: "pasos", titulo: "Registrar un cobro", x: [
        "En la ficha, apartado Cobro, escribe el concepto y el importe.",
        "Elige cómo pagó: efectivo, tarjeta, transferencia o Bizum.",
        "Pulsa Registrar cobro. Si además quieres factura, pulsa Cobrar y facturar.",
      ] },
      { t: "nota", x: "¿Te has equivocado al cobrar? Pulsa Anular junto a ese cobro (en la propia ficha o en Caja) y escribe el motivo. No se borra: se compensa y queda constancia." },
      { t: "lista", x: [
        "A domicilio: el botón + Añadir suplemento de desplazamiento rellena solo el importe que tengas en Ajustes.",
        "Si en vez de un cobro es un gasto de esa orden (material, gasolina, peajes...), usa Registrar como gasto de esta visita.",
      ] },
      { t: "lista", titulo: "Recibo y factura", x: [
        "Recibo: justificante del pago, para el cliente que no pide factura.",
        "Factura: se emite por el total cobrado de la orden, IVA incluido. Lleva tus datos y los del cliente.",
        "Tus datos (nombre, NIF y dirección) quedan copiados en cada factura al emitirla: aunque luego los cambies en Ajustes, la factura no cambia.",
      ] },
      { t: "nota", x: "Una factura emitida no se puede borrar ni modificar. Si hay un error, pulsa ¿Error en esta factura? Emitir una rectificativa, indica el motivo y, si cambia, el importe correcto. Si el error era el NIF del cliente, corrígelo antes en su ficha de Clientes." },
    ],
  },
  {
    id: "eliminar", icono: "🗑️", titulo: "Eliminar una orden",
    bloques: [
      { t: "pasos", x: [
        "En la tabla, abre el menú ⋮ de la orden y pulsa Eliminar.",
        "Escribe el número de la orden para confirmar.",
      ] },
      { t: "lista", x: [
        "Se borra con sus fotos, firmas, comprobantes, checklist y recordatorios. Los repuestos que tuviera vuelven al stock.",
        "No se puede eliminar una orden con factura (obligación fiscal) ni con cobros en Caja. En ese caso el panel explica qué hacer: márcala como No reparable o anula el cobro.",
        "El número de una orden eliminada no se vuelve a usar.",
      ] },
      { t: "nota", x: "Borrar no se puede deshacer. Si dudas, mejor márcala como No reparable." },
    ],
  },
  {
    id: "clientes", icono: "👥", titulo: "Clientes",
    bloques: [
      { t: "lista", x: [
        "Hay dos secciones: Clientes activos y Eliminados (RGPD).",
        "En activos puedes filtrar por negocio: Firztnet (reparaciones) o Firztweb (diseño web).",
        "Al pulsar un cliente ves su ficha: teléfono, email, NIF, sus reparaciones, equipos en garantía y trabajos entregados sin cobrar.",
        "Editar: corrige teléfono, email, NIF y negocios.",
      ] },
      { t: "pasos", titulo: "Derecho al olvido (si un cliente pide borrar sus datos)", x: [
        "Abre su ficha y pulsa Ejercer derecho al olvido (RGPD).",
        "Confirma y escribe el motivo (queda registrado).",
      ] },
      { t: "p", x: "Se borran para siempre su nombre, teléfono, email, NIF, fotos, firmas, dirección y WiFi. Se conservan sus facturas y el historial de reparaciones, porque la ley obliga a guardarlos. El cliente pasa a la sección Eliminados y ya no se puede editar." },
    ],
  },
  {
    id: "mantenimientos", icono: "🗓️", titulo: "Mantenimientos (cuota mensual)",
    bloques: [
      { t: "p", x: "Para los clientes a los que vas todos los meses por una cuota fija. No salen en el tablero de reparaciones: tienen su propia sección en el menú, Mantenimientos." },
      { t: "pasos", titulo: "Crear un contrato", x: [
        "Pulsa Nuevo contrato.",
        "Elige el cliente, el servicio y la cuota mensual (precio final, sin factura).",
        "Rellena dirección, WiFi y las tareas que incluye (una por línea). Las tareas salen luego como casillas en cada visita.",
        "Estado: Activo, o Pendiente de confirmar si aún no está cerrado.",
        "Si ya tenías una orden in situ de ese cliente, puedes pasarla al contrato: sus cobros cuentan como la cuota de ese mes y deja de salir en el tablero.",
      ] },
      { t: "lista", x: [
        "Cada mes va por separado: arriba eliges el mes y solo ves sus visitas y su cuota.",
        "El mes en curso se crea solo en los contratos activos. Los meses anteriores quedan como historial.",
        "Visitas: puedes ir las veces que haga falta; no se cobran aparte. En cada visita: Empezar, Terminar, marcar tareas, notas y la firma del cliente.",
        "Si te equivocas de día, borra la visita (icono de papelera) y créala de nuevo con la fecha buena.",
        "Cuota: pulsa Cobrar cuota. El importe ya viene puesto. Puedes sacar el Recibo o Anular un cobro mal apuntado.",
        "Los cobros de las cuotas cuentan en Caja e Informes como cualquier otro cobro.",
        "La campanita te avisa si ya has ido ese mes y la cuota sigue sin cobrar.",
        "Si dejas de hacer un mantenimiento, edítalo y ponlo en Dado de baja (se guarda su historial). Borrar el contrato solo se puede si no tiene cobros.",
      ] },
    ],
  },
  {
    id: "flota", icono: "🚐", titulo: "Flota (vehículos de la empresa)",
    bloques: [
      { t: "p", x: "Para tener controlado el vehículo de la empresa: ITV, seguro, mantenimiento, reparaciones, combustible y lo que cuesta al año." },
      { t: "pasos", titulo: "Dar de alta un vehículo", x: [
        "Menú Flota → Añadir vehículo.",
        "Matrícula, marca, modelo, año, combustible y los km que tiene ahora.",
        "Próxima ITV (viene en la pegatina) y cuándo vence el seguro.",
        "Mantenimiento: cada cuántos km y/o cada cuántos meses (lo dice el libro de mantenimiento o tu taller).",
      ] },
      { t: "lista", titulo: "En la ficha del vehículo", x: [
        "Tres avisos de color: ITV, Seguro y Mantenimiento. Verde = bien, naranja = faltan 30 días o 1.000 km o menos, rojo = pasado.",
        "Actualizar km: escribe los km del cuentakilómetros de vez en cuando para que el aviso del mantenimiento por km sea exacto.",
        "Registrar: ITV, Mantenimiento, Repostaje, Reparación, Seguro, Impuesto u Otro gasto.",
        "Al registrar una ITV se pone la fecha de la próxima. Si sale desfavorable, propone volver en 2 meses.",
        "Al registrar un mantenimiento, el próximo se calcula solo (km + cada cuántos km, fecha + cada cuántos meses). Puedes cambiarlo.",
        "Al renovar el seguro, pon la nueva fecha de vencimiento y deja de avisar.",
        "Repostajes con km y litros: calcula el consumo medio (litros cada 100 km).",
        "Apuntar el coste como gasto en Caja: viene marcado; así los gastos del vehículo cuentan en Caja e Informes.",
        "Si borras un registro que estaba en Caja, su gasto se anula (no se borra) para que cuadren las cuentas.",
        "La campanita avisa de la ITV, el seguro y el mantenimiento cuando están cerca o pasados.",
        "Si el vehículo deja de ser de la empresa, edítalo y quita «En uso»: se guarda su historial y deja de avisar.",
      ] },
    ],
  },
  {
    id: "caja", icono: "🏦", titulo: "Caja",
    bloques: [
      { t: "p", x: "Todos los cobros y gastos del negocio: los de las reparaciones y los que apuntes a mano (por ejemplo, la compra de material)." },
      { t: "pasos", titulo: "Apuntar un movimiento", x: [
        "Pulsa Nuevo movimiento.",
        "Elige gasto o ingreso, el concepto, el importe (mayor que 0) y el método de pago.",
        "Pulsa Guardar.",
      ] },
      { t: "pasos", titulo: "Corregir un movimiento mal apuntado", x: [
        "Pulsa Anular en ese movimiento y escribe el motivo.",
        "El movimiento queda tachado y aparece un apunte de corrección que lo compensa. Los totales ya no lo cuentan.",
      ] },
      { t: "nota", x: "Nada se borra: queda constancia de qué se anuló y por qué. Si el cobro ya tenía factura, el panel te avisa de que tendrás que hacer una rectificativa." },
    ],
  },
  {
    id: "inventario", icono: "📦", titulo: "Inventario y garantías con proveedores",
    bloques: [
      { t: "lista", titulo: "Inventario", x: [
        "Nuevo repuesto: nombre, categoría, proveedor, stock inicial, stock mínimo y precios de compra y venta.",
        "Reponer stock: escribe la cantidad en la casilla +cant. del repuesto y pulsa Enter.",
        "Editar (lápiz): corrige nombre, categoría, precios o stock mínimo.",
        "Vender suelto: vende un repuesto sin reparación de por medio; se descuenta del stock y el ingreso va a Caja.",
        "Dar de baja: deja de aparecer, pero no se borra (para no perder el historial).",
        "Arriba ves el capital invertido y la ganancia si vendieras todo el stock.",
        "Cuando un repuesto baja de su stock mínimo, sale aviso en la tarjeta Stock.",
      ] },
      { t: "lista", titulo: "Garantías RMA (devoluciones a proveedores)", x: [
        "Nueva devolución (RMA): proveedor, repuesto, número de serie, orden relacionada y motivo.",
        "Ve cambiando su estado: Enviado, En proceso, Resuelto o Rechazado, y apunta lo recuperado.",
        "Trazabilidad: busca por número de serie en qué reparación se usó una pieza, a quién se compró y con qué factura.",
      ] },
      { t: "p", x: "Garantías activas muestra los equipos de tus clientes que siguen en garantía, empezando por los que caducan antes." },
    ],
  },
  {
    id: "avisos", icono: "🔔", titulo: "Mensajes, recordatorios y solicitudes",
    bloques: [
      { t: "lista", titulo: "Plantillas", x: [
        "Mensajes ya escritos para casos comunes (equipo listo, esperando repuesto...).",
        "Puedes usar huecos que se rellenan solos: {cliente}, {equipo}, {numero_orden}, {estado}, {fecha_estimada}, {garantia}, {enlace_seguimiento} y {enlace_resena}.",
        "Si le asignas un estado, el mensaje se prepara solo al llegar la orden a ese estado.",
      ] },
      { t: "lista", titulo: "Recordatorios", x: [
        "Avisos de mantenimiento futuros (revisión de cámaras, baterías...). Se crean desde la ficha de un servicio a domicilio completado.",
        "Desde aquí avisas al cliente con Enviar por WhatsApp y lo marcas como cumplido con la casilla.",
      ] },
      { t: "lista", titulo: "Solicitudes", x: [
        "Peticiones que llegan de tu web (formulario de presupuesto) o de la página de seguimiento de un cliente. También te llegan por Telegram.",
        "Si quien escribe todavía no es cliente, pulsa Convertir en cliente. Si le abres una reparación, se convierte solo.",
        "Márcalas como atendidas cuando las resuelvas.",
      ] },
      { t: "p", x: "Base conocimiento: tus apuntes técnicos (IPs de routers, comandos, configuraciones...) con buscador y categorías." },
    ],
  },
  {
    id: "informes", icono: "📊", titulo: "Informes y estadísticas",
    bloques: [
      { t: "lista", x: [
        "Reportes: resumen de hoy y del mes, contador de reparaciones y gráfica de ingresos y gastos de los últimos 7 días.",
        "Exportar resumen contable: elige el mes y descarga un archivo para Excel con movimientos y facturas, listo para tu gestoría.",
        "Rendimiento: trabajos completados y tiempo medio por técnico.",
        "Rentabilidad: ingresos, coste de piezas y margen por tipo de servicio.",
        "Ventas: ventas de tus otros negocios (webs, apps, sistemas a medida, productos de afiliados).",
        "Visitas web: visitas de tus webs, de dónde llegan, desde qué dispositivo, a qué horas y qué botones pulsan.",
      ] },
    ],
  },
  {
    id: "clientefinal", icono: "📱", titulo: "Lo que ve el cliente",
    bloques: [
      { t: "lista", x: [
        "Página de seguimiento: cada orden tiene un enlace propio (va en el comprobante y en los mensajes). El cliente ve el estado, la fecha estimada, la garantía y el presupuesto, y puede firmarlo o pedir otro servicio.",
        "Si pierde el enlace, puede buscar su orden con el número de orden y su DNI o su teléfono completo.",
        "Formulario de presupuesto: la dirección de tu panel terminada en /presupuesto (reparaciones.firztnet.es/presupuesto). Cualquiera puede pedirte presupuesto sin ser cliente; tu web también lo usa.",
      ] },
      { t: "nota", x: "En la página de seguimiento nunca salen precios de otros clientes ni datos de tu negocio que no sean públicos." },
    ],
  },
  {
    id: "seguridad", icono: "🛡️", titulo: "Seguridad y copias de seguridad",
    bloques: [
      { t: "lista", x: [
        "Copia de seguridad automática: cada noche, de madrugada, te llega por Telegram un archivo con la base de datos, las fotos y las firmas. Guárdalo fuera (Google Drive, un pendrive...).",
        "Si la copia falla o pesa demasiado para Telegram, te llega un aviso.",
        "En Ajustes puedes descargarla en cualquier momento (Descargar ahora) o pedir que te la mande (Enviar por Telegram ahora).",
        "Si alguien intenta entrar con una contraseña equivocada, te llega un aviso por Telegram. Tras varios fallos seguidos, esa conexión queda bloqueada un tiempo.",
      ] },
      { t: "nota", x: "Revisa de vez en cuando que la copia diaria te llega por Telegram. Es tu seguro si algo falla en el servidor." },
    ],
  },
  {
    id: "problemas", icono: "🧰", titulo: "Si algo no funciona",
    bloques: [
      { t: "lista", x: [
        "\"No se pudo conectar con el backend\": el servidor no responde. Espera un minuto y recarga la página. Si sigue, mira en Railway que el servidor esté en marcha.",
        "Un PDF no se abre: el navegador bloqueó la ventana nueva. Permite las ventanas emergentes para este panel.",
        "No puedo entregar un equipo: falta registrar el cobro.",
        "No puedo emitir una factura: rellena tu NIF y dirección en Ajustes, y registra antes un cobro.",
        "No puedo eliminar una orden: tiene factura o cobros. Mira el apartado Eliminar una orden.",
        "No me llegan avisos de Telegram: en Ajustes pulsa Enviar mensaje de prueba.",
        "Me ha sacado de la sesión: han pasado 14 días o la sesión caducó. Vuelve a entrar.",
      ] },
    ],
  },
];

function textoBloque(b) {
  return [b.titulo || "", Array.isArray(b.x) ? b.x.join(" ") : b.x].join(" ");
}

function normalizar(texto) {
  // Quita las tildes (para que "garantia" encuentre "garantía")
  return Array.from((texto || "").toLowerCase().normalize("NFD"))
    .filter((letra) => { const codigo = letra.charCodeAt(0); return codigo < 0x300 || codigo > 0x36f; })
    .join("");
}

function BloqueManual({ b }) {
  const estiloTitulo = { fontSize: 12.5, fontWeight: 700, color: COLORS.text, margin: "10px 0 4px" };
  const estiloTexto = { fontSize: 13, color: COLORS.text, lineHeight: 1.6, margin: "6px 0" };
  if (b.t === "p") return <p style={estiloTexto}>{b.x}</p>;
  if (b.t === "nota") {
    return (
      <div style={{ display: "flex", gap: 8, fontSize: 12.5, lineHeight: 1.55, color: "#1E3A8A", background: COLORS.tintAzul, border: "1px solid #BFDBFE", borderRadius: 9, padding: "9px 12px", margin: "10px 0" }}>
        <span aria-hidden="true">💡</span><span>{b.x}</span>
      </div>
    );
  }
  const Lista = b.t === "pasos" ? "ol" : "ul";
  return (
    <div>
      {b.titulo && <div style={estiloTitulo}>{b.titulo}</div>}
      <Lista style={{ ...estiloTexto, paddingLeft: 22, margin: "4px 0 8px" }}>
        {b.x.map((linea, i) => <li key={i} style={{ marginBottom: 3 }}>{linea}</li>)}
      </Lista>
    </div>
  );
}

// Versión para imprimir o guardar en PDF (se abre en una pestaña nueva).
function imprimirManual() {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const cuerpo = MANUAL_SECCIONES.map((s) => {
    const bloques = s.bloques.map((b) => {
      if (b.t === "p") return `<p>${esc(b.x)}</p>`;
      if (b.t === "nota") return `<div class="nota">💡 ${esc(b.x)}</div>`;
      const tag = b.t === "pasos" ? "ol" : "ul";
      return `${b.titulo ? `<h3>${esc(b.titulo)}</h3>` : ""}<${tag}>${b.x.map((l) => `<li>${esc(l)}</li>`).join("")}</${tag}>`;
    }).join("");
    return `<section><h2>${s.icono} ${esc(s.titulo)}</h2>${bloques}</section>`;
  }).join("");
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Manual del panel Firztnet</title>
<style>body{font-family:Arial,Helvetica,sans-serif;color:#0F172A;max-width:760px;margin:30px auto;padding:0 20px;line-height:1.55;font-size:13.5px}
h1{color:#2563EB;margin-bottom:2px}.sub{color:#64748B;margin-top:0}h2{color:#1D4ED8;border-bottom:2px solid #DBEAFE;padding-bottom:4px;margin-top:28px}
h3{font-size:13.5px;margin:12px 0 4px}li{margin-bottom:3px}.nota{background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:8px 12px;margin:10px 0;color:#1E3A8A}
section{page-break-inside:avoid}@media print{body{margin:0}}</style></head>
<body><h1>Manual del panel Firztnet</h1><p class="sub">Gestión de reparaciones, clientes, cobros e inventario</p>${cuerpo}</body></html>`;
  const ventana = window.open("", "_blank");
  if (!ventana) { window.alert("El navegador ha bloqueado la ventana nueva. Permite las ventanas emergentes para este panel."); return; }
  ventana.document.write(html);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 400);
}

function ManualUso() {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [abiertas, setAbiertas] = useState(() => new Set(["inicio"]));

  const termino = normalizar(busqueda.trim());
  const secciones = termino
    ? MANUAL_SECCIONES.filter((s) => normalizar(s.titulo + " " + s.bloques.map(textoBloque).join(" ")).includes(termino))
    : MANUAL_SECCIONES;

  function alternar(id) {
    setAbiertas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id); else nuevo.add(id);
      return nuevo;
    });
  }
  function irA(id) {
    setAbiertas((prev) => new Set(prev).add(id));
    setTimeout(() => document.getElementById(`manual-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#FFFFFF", fontSize: 21 }} aria-hidden="true">📖</div>
          <div>
            <div style={{ fontFamily: "Oswald", fontSize: 17, color: COLORS.text }}>Manual de uso</div>
            <div style={{ fontSize: 12, color: COLORS.textDim }}>Cómo funciona cada parte del panel, paso a paso.</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {abierto && (
            <button type="button" onClick={imprimirManual} style={{ ...btnStyle(COLORS.surface, COLORS.text, COLORS.line), flex: "none", padding: "8px 12px" }}>
              <Printer size={14} /> Imprimir / PDF
            </button>
          )}
          <button type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto} style={{ ...btnStyle(COLORS.amber, "#FFFFFF"), flex: "none", padding: "8px 14px" }}>
            {abierto ? "Cerrar manual" : "Abrir manual"}
          </button>
        </div>
      </div>

      {abierto && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.bg, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
            <Search size={14} color={COLORS.textDim} />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar en el manual: factura, cobro, garantía..." style={{ background: "none", border: "none", outline: "none", fontSize: 13, width: "100%", color: COLORS.text }} />
            {busqueda && <button type="button" onClick={() => setBusqueda("")} aria-label="Borrar búsqueda" style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.textDim, padding: 0, display: "flex" }}><X size={14} /></button>}
          </div>

          {!termino && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {MANUAL_SECCIONES.map((s) => (
                <button key={s.id} type="button" onClick={() => irA(s.id)} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 999, border: `1px solid ${COLORS.line}`, background: COLORS.surface, color: COLORS.text, cursor: "pointer" }}>
                  {s.icono} {s.titulo}
                </button>
              ))}
            </div>
          )}

          {termino && secciones.length === 0 && <div style={{ fontSize: 13, color: COLORS.textDim, padding: "10px 0" }}>No hay nada en el manual sobre “{busqueda}”.</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {secciones.map((s) => {
              const visible = termino || abiertas.has(s.id);
              return (
                <div key={s.id} id={`manual-${s.id}`} style={{ border: `1px solid ${visible ? "#BFDBFE" : COLORS.line}`, borderRadius: 10, overflow: "hidden", scrollMarginTop: 16 }}>
                  <button type="button" onClick={() => alternar(s.id)} aria-expanded={!!visible} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 10, padding: "11px 14px", border: "none", background: visible ? "#EFF6FF" : COLORS.surface, cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}><span aria-hidden="true" style={{ marginRight: 8 }}>{s.icono}</span>{s.titulo}</span>
                    <ChevronDown size={16} color={COLORS.textDim} style={{ transform: visible ? "rotate(180deg)" : "none", transition: "transform 0.2s ease", flexShrink: 0 }} />
                  </button>
                  {visible && (
                    <div style={{ padding: "4px 16px 12px" }}>
                      {s.bloques.map((b, i) => <BloqueManual key={i} b={b} />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
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
    <div>
    <div style={{ maxWidth: 860 }}>
      <ManualUso />
    </div>
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
                enlace.download = `firztnet_backup_${hoyLocalISO()}.zip`;
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
    </div>
  );
}

// -------------------- pantalla de login --------------------
function LoginScreen({ onEntrar }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [foco, setFoco] = useState(null);
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

  const estiloCampo = (nombre) => ({
    display: "flex", alignItems: "center", gap: 12,
    height: 54, padding: "0 16px", boxSizing: "border-box",
    borderRadius: 16, background: "#FFFFFF",
    border: `1.5px solid ${foco === nombre ? COLORS.amber : "#C9D0DE"}`,
    boxShadow: foco === nombre ? `0 0 0 4px ${COLORS.amber}22` : "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  });
  const estiloInput = {
    flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent",
    fontSize: 15, color: COLORS.text, fontFamily: "Inter, sans-serif",
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #EEF3FB 0%, #E3E9F6 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, boxSizing: "border-box", fontFamily: "Inter, sans-serif" }}>
      <link rel="stylesheet" href={FONTS_URL} />
      <form onSubmit={entrar} style={{ background: "#FFFFFF", borderRadius: 28, padding: "38px 32px 26px", width: 400, maxWidth: "100%", boxSizing: "border-box", boxShadow: "0 14px 40px -10px rgba(15,27,61,0.28), 0 2px 6px rgba(15,27,61,0.08)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30 }}>
          <img src="/logo-firztnet-animado.svg" alt="" width={112} height={112} style={{ display: "block", borderRadius: 28, boxShadow: "0 18px 36px -16px rgba(120,80,10,0.55)" }} />
          <div style={{ marginTop: 14, fontFamily: "Sora, Inter, sans-serif", fontWeight: 800, fontSize: 30, letterSpacing: "-0.02em", color: "#1C160B" }}>
            Firzt<span style={{ color: "#B8802A" }}>net</span>
          </div>
          <div style={{ fontSize: 14, color: COLORS.textDim, marginTop: 6 }}>Gestión de reparaciones</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={estiloCampo("usuario")}>
            <User size={20} color={COLORS.textDim} style={{ flexShrink: 0 }} />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFoco("usuario")}
              onBlur={() => setFoco(null)}
              placeholder="Usuario"
              aria-label="Usuario"
              autoComplete="username"
              style={estiloInput}
              autoFocus
            />
          </div>
          <div style={estiloCampo("password")}>
            <Lock size={20} color={COLORS.textDim} style={{ flexShrink: 0 }} />
            <input
              type={verPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFoco("password")}
              onBlur={() => setFoco(null)}
              placeholder="Contraseña"
              aria-label="Contraseña"
              autoComplete="current-password"
              style={estiloInput}
            />
            <button
              type="button"
              onClick={() => setVerPassword((v) => !v)}
              aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              style={{ background: "none", border: "none", padding: 4, cursor: "pointer", display: "flex", color: COLORS.textDim, flexShrink: 0 }}
            >
              {verPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" style={{ marginTop: 14, fontSize: 13, color: COLORS.rust, background: `${COLORS.rust}12`, borderRadius: 12, padding: "10px 14px", textAlign: "center" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={entrando}
          style={{
            width: "100%", height: 54, marginTop: 22, border: "none", borderRadius: 999,
            background: `linear-gradient(135deg, ${COLORS.amber}, #1D4ED8)`, color: "#FFFFFF",
            fontSize: 14, fontWeight: 700, letterSpacing: 0.8, fontFamily: "Inter, sans-serif",
            cursor: entrando ? "default" : "pointer", opacity: entrando ? 0.75 : 1,
            boxShadow: `0 8px 18px -6px ${COLORS.amber}99`,
          }}
        >
          {entrando ? "ENTRANDO..." : "ENTRAR"}
        </button>

        <div style={{ textAlign: "center", fontSize: 12, color: COLORS.textDim, marginTop: 22 }}>Firztnet</div>
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
        body: JSON.stringify({ nombre, telefono, email, mensaje, negocio: "firztnet" }),
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

// -------------------- Menú --------------------
// 13 opciones en 3 apartados (antes eran 26). Las pantallas parecidas van juntas como pestañas de una
// misma opción; cada pantalla conserva su nombre interno (vista), así los avisos siguen llevando a su sitio.
const MENU_GRUPOS = [
  { seccion: "Taller", key: "reparaciones", icon: LayoutGrid, label: "Reparaciones", movil: "principal",
    pestanas: [["reparaciones", "Órdenes"], ["solicitudes", "Solicitudes web"], ["garantias", "En garantía"]] },
  { seccion: "Taller", key: "clientes", icon: Users, label: "Clientes del taller", corto: "Clientes", movil: "principal", pestanas: [["clientes", "Clientes"]] },
  { seccion: "Taller", key: "mantenimientos", icon: CalendarCheck, label: "Mantenimientos", movil: "mas",
    pestanas: [["mantenimientos", "Contratos"], ["recordatorios", "Recordatorios"]] },
  { seccion: "Taller", key: "inventario", icon: Package, label: "Inventario", movil: "mas",
    pestanas: [["inventario", "Piezas"], ["rma", "Devoluciones a proveedor"]] },
  { seccion: "Taller", key: "informes", icon: FileBarChart, label: "Informes", movil: "mas",
    pestanas: [["reportes", "Resumen y exportar"], ["rendimiento", "Técnicos"], ["rentabilidad", "Rentabilidad"]] },
  { seccion: "Taller", key: "recursos", icon: MessageSquare, label: "Recursos", movil: "mas",
    pestanas: [["plantillas", "Mensajes"], ["conocimiento", "Base de conocimiento"]] },
  { seccion: "Mi empresa", key: "caja", icon: Banknote, label: "Caja", movil: "principal", pestanas: [["caja", "Caja"]] },
  { seccion: "Mi empresa", key: "flota", icon: Car, label: "Flota", movil: "mas", pestanas: [["flota", "Flota"]] },
  // Ajustes no sale en el menú: se abre desde el menú del usuario (arriba a la derecha), junto a los temas
  { seccion: "Mi empresa", key: "ajustes", icon: Settings, label: "Ajustes", movil: "mas", oculto: true, pestanas: [["ajustes", "Ajustes"]] },
  { seccion: "Firztnet", key: "negocio", icon: TrendingUp, label: "Negocio", movil: "mas",
    pestanas: [["cuadro", "Cuadro de mando"], ["cobros", "Cobros"], ["ventas", "Ventas"]] },
  { seccion: "Firztnet", key: "clientes-sistemas", icon: Layers, label: "Clientes de sistemas", movil: "mas",
    pestanas: [["clientes-sistemas", "Todos"], ["riesgo", "En riesgo"], ["punto-venta", "Tiendas (punto de venta)"]] },
  { seccion: "Firztnet", key: "soporte", icon: LifeBuoy, label: "Soporte", movil: "mas",
    pestanas: [["ayuda", "Peticiones de ayuda"], ["estado-sistemas", "Estado de sistemas y webs"]] },
  { seccion: "Firztnet", key: "webs", icon: Globe, label: "Webs", movil: "mas",
    pestanas: [["visitas-web", "Tus visitas"], ["informes-mensuales", "Informes mensuales"]] },
];
const grupoDeVista = (v) => MENU_GRUPOS.find((g) => g.pestanas.some(([k]) => k === v));
const SECCIONES_MENU = [...new Set(MENU_GRUPOS.map((g) => g.seccion))];

// Cada sección del menú con su color e icono, para que se distingan de las opciones
const ESTILO_SECCION = {
  "Taller": { color: "#3B82F6", icono: Wrench },
  "Mi empresa": { color: "#10B981", icono: Store },
  "Firztnet": { color: "#F59E0B", icono: ShieldCheck },
};
function TituloSeccionMenu({ seccion, primera, className, compacto }) {
  const { color, icono: Icono } = ESTILO_SECCION[seccion] || { color: COLORS.textDim, icono: null };
  return (
    <div
      className={className}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        margin: primera ? "0 0 8px" : compacto ? "14px 0 6px" : "20px 0 8px",
        padding: "7px 10px", borderRadius: 8,
        background: `${color}1F`, borderLeft: `3px solid ${color}`,
        color, fontSize: 11.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
      }}
    >
      {Icono && <Icono size={14} strokeWidth={2.4} />}
      <span>{seccion}</span>
      <span aria-hidden="true" style={{ flex: 1, height: 1, background: `${color}55`, marginLeft: 4 }} />
    </div>
  );
}

// Pestañas de la opción en la que estás (solo si tiene más de una pantalla)
function PestanasGrupo({ vista, onIr }) {
  const g = grupoDeVista(vista);
  if (!g || g.pestanas.length < 2) return null;
  return (
    <div className="fn-pestanas-grupo" role="tablist" aria-label={g.label}
      style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${COLORS.line}` }}>
      {g.pestanas.map(([k, nombre]) => (
        <button key={k} type="button" role="tab" aria-selected={vista === k} onClick={() => onIr(k)}
          style={{ ...btnStyle(vista === k ? COLORS.amber : "transparent", vista === k ? "#FFFFFF" : COLORS.text, vista === k ? COLORS.amber : COLORS.line),
            flex: "none", padding: "7px 14px", fontSize: 13, borderRadius: 999, fontWeight: vista === k ? 700 : 600 }}>
          {nombre}
        </button>
      ))}
    </div>
  );
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

  // Dos métricas de eficiencia, calculadas al vuelo de las reparaciones ya cargadas —
  // no dependen de ninguna ruta nueva del backend.
  const metricasEficiencia = useMemo(() => {
    const HOY = new Date();
    const DIAS_RETRASO = 5; // más de 5 días sin moverse, sin estar entregada/no reparable, cuenta como retrasada

    const activas = reparaciones.filter((r) => !["entregado", "no_reparable", "completado"].includes(r.estado_actual));
    const retrasadasLista = activas.filter((r) => {
      if (r.urgente) return true;
      // Visita in situ con fecha: solo cuenta como retrasada si ese día ya pasó
      if (fechaVisita(r)) return diasNaturalesDesde(fechaVisita(r)) >= 1;
      if (!r.fecha_recepcion) return false;
      const dias = (HOY - new Date(r.fecha_recepcion)) / (1000 * 60 * 60 * 24);
      return dias > DIAS_RETRASO;
    });
    const retrasadas = retrasadasLista.length;

    // Tiempo medio: reparaciones entregadas en los últimos 30 días (así no se queda vacío a principio de mes)
    const hace30Dias = HOY.getTime() - 30 * 24 * 60 * 60 * 1000;
    const completadasEsteMes = reparaciones.filter((r) => {
      if (!r.fecha_recepcion || !r.fecha_entrega) return false;
      const entrega = new Date(r.fecha_entrega).getTime();
      return entrega >= hace30Dias && entrega <= HOY.getTime();
    });
    let tiempoMedioDias = null;
    if (completadasEsteMes.length > 0) {
      const sumaDias = completadasEsteMes.reduce((acc, r) => acc + (new Date(r.fecha_entrega) - new Date(r.fecha_recepcion)) / (1000 * 60 * 60 * 24), 0);
      tiempoMedioDias = sumaDias / completadasEsteMes.length;
    }

    return { retrasadas, retrasadasLista, tiempoMedioDias };
  }, [reparaciones]);

  const [numClientes, setNumClientes] = useState(null); // tarjeta "Clientes" (sin los eliminados por RGPD)
  const [resumenMant, setResumenMant] = useState(null); // tarjeta "Mantenimientos": contratos activos y cuotas del mes sin cobrar
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
      // Tarjeta "Clientes": cuenta todos menos los eliminados por el derecho al olvido (RGPD).
      // Va aparte para que, si fallara, no impida cargar el resto del panel.
      apiGet("/clientes")
        .then((lista) => setNumClientes(lista.filter((c) => !esClienteEliminado(c)).length))
        .catch(() => setNumClientes(null));
      // Tarjeta "Mantenimientos" (también aparte, por si el servidor aún no tiene la sección)
      apiGet("/mantenimientos/contratos")
        .then((lista) => {
          const activos = lista.filter((c) => c.estado === "activo");
          setResumenMant({
            activos: activos.length,
            sinCobrar: activos.filter((c) => c.mes_actual && !c.mes_actual.cuota_pagada).length,
            pendientes: lista.filter((c) => c.estado === "pendiente").length,
          });
        })
        .catch(() => setResumenMant(null));
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
  const [filtroEstado, setFiltroEstado] = useState(""); // etapa concreta: recibido, diagnóstico, en reparación...
  const [filtroUrgente, setFiltroUrgente] = useState(false);
  const [vistaTrabajo, setVistaTrabajo] = useState("taller"); // "taller" o "domicilio"
  // Pantalla Buscar: "todos", "taller" o "domicilio" (independiente del selector de la pantalla principal)
  const [tipoBusqueda, setTipoBusqueda] = useState("todos");
  useEffect(() => { setFiltroEstado(""); if (tipoBusqueda === "domicilio") { setFiltroMarca(""); setFiltroModelo(""); } }, [tipoBusqueda]);
  function limpiarBusqueda() {
    setQuery(""); setFiltroMarca(""); setFiltroModelo(""); setFiltroCliente(""); setFiltroEstado("");
    setFiltroHoy(false); setFiltroUrgente(false); setTipoBusqueda("todos");
  }
  const [hoverPreview, setHoverPreview] = useState(null); // reparación bajo el ratón, para "Próxima acción"
  const [mostrarMasMovil, setMostrarMasMovil] = useState(false); // hoja de "Más" secciones, solo en móvil
  const [menuAbierto, setMenuAbierto] = useState(false); // menú lateral plegable, solo en escritorio (oculto por defecto)
  // Menú «Estudio»: barra de iconos fija a la izquierda (útil en pantallas pequeñas o la tele), secciones plegadas y buscador
  const [menuIconos, setMenuIconos] = useState(() => { try { return localStorage.getItem("fz-menu-iconos") === "1"; } catch { return false; } });
  const [opcionAbierta, setOpcionAbierta] = useState(null); // opción del menú con sus pantallas desplegadas
  const [seccionesPlegadas, setSeccionesPlegadas] = useState(() => { try { return JSON.parse(localStorage.getItem("fz-menu-plegadas") || "[]"); } catch { return []; } });
  useEffect(() => { if (!menuAbierto) setOpcionAbierta(null); }, [menuAbierto]);
  const cambiarMenuIconos = (v) => { setMenuIconos(v); try { localStorage.setItem("fz-menu-iconos", v ? "1" : "0"); } catch { /* sin almacenamiento */ } };
  const plegarSeccion = (nombre) => setSeccionesPlegadas((prev) => {
    const nuevas = prev.includes(nombre) ? prev.filter((x) => x !== nombre) : [...prev, nombre];
    try { localStorage.setItem("fz-menu-plegadas", JSON.stringify(nuevas)); } catch { /* sin almacenamiento */ }
    return nuevas;
  });

  useEffect(() => {
    if (!menuAbierto) return;
    const cerrarConEscape = (e) => { if (e.key === "Escape") setMenuAbierto(false); };
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [menuAbierto]);

  const [stockBajoTarjeta, setStockBajoTarjeta] = useState(null); // null = aún cargando
  const [temaInicio, setTemaInicio] = useState(temaGuardado);
  aplicarPaleta(temaInicio);
  useEffect(() => () => aplicarPaleta("dia"), []); // al salir (p. ej. cerrar sesión), vuelve el claro
  const cambiarTemaInicio = (t) => { setTemaInicio(t); try { localStorage.setItem("fz-tema-inicio", t); } catch { /* sin almacenamiento */ } };
  useEffect(() => {
    if (vista !== "reparaciones") return;
    apiGet("/repuestos").then((lista) => setStockBajoTarjeta(lista.filter((r) => r.stock_bajo).length)).catch(() => {});
  }, [vista]);
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

  // Tablero completo de la pantalla principal: solo el tipo (taller / in situ) y el filtro de las tarjetas.
  const tableroPrincipal = useMemo(() => reparaciones.filter((t) => {
    if ((t.tipo_trabajo || "taller") !== vistaTrabajo) return false;
    if (filtroEstadoResumen === "en_curso" && ["entregado", "no_reparable", "completado"].includes(t.estado_actual)) return false;
    if (filtroEstadoResumen === "entregadas" && !["entregado", "completado"].includes(t.estado_actual)) return false;
    if (filtroEstadoResumen === "no_reparables" && t.estado_actual !== "no_reparable") return false;
    return true;
  }), [reparaciones, vistaTrabajo, filtroEstadoResumen]);

  // Pantalla Buscar: buscador + filtros
  const hayFiltrosBusqueda = !!(query.trim() || filtroMarca || filtroModelo || filtroCliente || filtroEstado || filtroHoy || filtroUrgente || tipoBusqueda !== "todos");
  const filtered = useMemo(() => {
    const hoyStr = new Date().toDateString();
    return reparaciones.filter((t) => {
      if (query.trim()) {
        const q = normalizar(query.trim());
        const digitos = query.replace(/\D/g, "");
        const coincideTexto =
          normalizar(t.cliente?.nombre).includes(q) ||
          normalizar(t.numero_orden).includes(q) ||
          normalizar(t.equipo).includes(q) ||
          normalizar(t.marca).includes(q) ||
          normalizar(t.modelo).includes(q) ||
          (digitos.length >= 3 && (t.cliente?.telefono || "").replace(/\D/g, "").includes(digitos));
        if (!coincideTexto) return false;
      }
      if (filtroMarca && t.marca !== filtroMarca) return false;
      if (filtroModelo && t.modelo !== filtroModelo) return false;
      if (filtroCliente && String(t.cliente?.id) !== filtroCliente) return false;
      if (filtroHoy && new Date(t.fecha_recepcion).toDateString() !== hoyStr) return false;
      if (filtroUrgente && !t.urgente) return false;
      if (filtroEstado && t.estado_actual !== filtroEstado) return false;
      if (tipoBusqueda !== "todos" && (t.tipo_trabajo || "taller") !== tipoBusqueda) return false;
      return true;
    });
  }, [query, reparaciones, filtroMarca, filtroModelo, filtroCliente, filtroHoy, filtroUrgente, filtroEstado, tipoBusqueda]);
  // Estados posibles en la búsqueda (con "Todos", los del taller y los de in situ sin repetir)
  const estadosBusqueda = useMemo(() => {
    if (tipoBusqueda !== "todos") return stagesFor(tipoBusqueda);
    const vistos = new Map();
    [...STAGES_TALLER, ...STAGES_DOMICILIO].forEach((s) => {
      if (!vistos.has(s.key)) vistos.set(s.key, { ...s });
      else if (vistos.get(s.key).label !== s.label) vistos.get(s.key).label += ` / ${s.label}`;
    });
    return [...vistos.values()];
  }, [tipoBusqueda]);

  const textoBalanceHoy = `${reporteDiario.balance_neto >= 0 ? "+" : ""}${fmtEur(reporteDiario.balance_neto)}`;
  const textoBalanceMes = fmtEur(reporteMensual.balance_neto);

  // Todos los campos de filtro comparten ancho y alto; solo la búsqueda es más larga.
  const estiloFiltro = (activo) => ({
    width: "100%", minWidth: 0, height: 36, boxSizing: "border-box",
    fontSize: 12.5, padding: "0 8px", borderRadius: 8,
    border: `1px solid ${activo ? COLORS.amber : COLORS.line}`,
    color: activo ? COLORS.text : COLORS.textDim, background: COLORS.surface,
    cursor: "pointer",
  });
  const estiloFiltroBoton = (activo, color) => ({
    ...estiloFiltro(false),
    display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontWeight: 600,
    border: `1px solid ${activo ? color : COLORS.line}`,
    background: activo ? color : COLORS.surface,
    color: activo ? "#FFFFFF" : COLORS.textDim,
  });

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
    <div className="fz-raiz" data-tema={temaInicio} style={{ colorScheme: temaInicio === "dia" ? "light" : "dark",
      minHeight: "100vh", color: COLORS.text, fontFamily: "Inter, sans-serif",
      background: `radial-gradient(circle at 15% 20%, ${COLORS.amber}4D, transparent 65%), radial-gradient(circle at 85% 15%, ${COLORS.violet}4D, transparent 65%), radial-gradient(circle at 50% 95%, ${COLORS.green}45, transparent 65%), ${COLORS.bg}`,
    }}>
      <link rel="stylesheet" href={FONTS_URL} />
      <FondoInicio />
      <style>{`
        .fn-navitem-corto { display: none; }
        @keyframes fnPuntoActivo {
          0%, 100% { box-shadow: 0 0 0 0 ${COLORS.green}55; }
          50% { box-shadow: 0 0 0 5px ${COLORS.green}00; }
        }
        .fn-punto-activo {
          animation: fnPuntoActivo 2s ease-in-out infinite;
        }
        @keyframes fnGirando { to { transform: rotate(360deg); } }
        .fn-girando { animation: fnGirando 0.9s linear infinite; }
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
        /* Página sin barra de desplazamiento a la vista (se sigue bajando con la rueda o el dedo) */
        html, body { scrollbar-width: none; -ms-overflow-style: none; }
        html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
        .fn-sin-barra { scrollbar-width: none; -ms-overflow-style: none; }
        .fn-tarjeta-mant { transition: transform .18s ease, box-shadow .18s ease; }
        .fn-tarjeta-mant:hover { transform: translateY(-3px); box-shadow: 0 14px 30px -12px rgba(37,99,235,.35); }
        .fn-sin-barra::-webkit-scrollbar { display: none; }
        /* Nombre "FIRZTNET" de arriba a la izquierda */
        .fn-marca {
          font-family: "Orbitron", "Oswald", sans-serif; font-size: 20px; font-weight: 800;
          letter-spacing: 1.5px; cursor: pointer; user-select: none; display: inline-block;
          background: none; border: none; padding: 4px 2px; margin: 0; border-radius: 6px; line-height: 1.2;
          transition: letter-spacing 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .fn-marca-firzt, .fn-marca-net {
          background-size: 250% 100%;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent; color: transparent;
          animation: fn-marca-brillo 3.5s linear infinite;
        }
        .fn-marca-firzt { background-image: linear-gradient(100deg, #1D4ED8 0%, #2563EB 40%, #93C5FD 50%, #2563EB 60%, #1D4ED8 100%); }
        .fn-marca-net { background-image: linear-gradient(100deg, #D97706 0%, #F59E0B 40%, #FDE68A 50%, #F59E0B 60%, #D97706 100%); animation-delay: 0.25s; }
        @keyframes fn-marca-brillo { 0% { background-position: 150% 0; } 100% { background-position: -50% 0; } }
        .fn-marca:hover { letter-spacing: 4px; transform: scale(1.05); }
        .fn-marca:active { transform: scale(0.97); }
        .fn-marca:focus-visible { outline: 2px solid ${COLORS.amber}; outline-offset: 3px; }
        .fn-marca:hover .fn-marca-firzt, .fn-marca:hover .fn-marca-net { animation-duration: 1.2s; filter: drop-shadow(0 0 6px rgba(37,99,235,0.45)); }
        @media (prefers-reduced-motion: reduce) {
          .fn-marca, .fn-marca * { animation: none !important; transition: none !important; }
        }
        /* Logo del menú: entrada con rebote y destello que recorre las letras */
        .fn-logo-entrada { animation: fn-logo-aparece 1.1s cubic-bezier(0.22, 1.2, 0.36, 1) both; }
        @keyframes fn-logo-aparece {
          0%   { opacity: 0; transform: translateY(-14px) scale(0.82); filter: blur(10px); letter-spacing: 0; }
          60%  { opacity: 1; transform: translateY(2px) scale(1.04); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        .fn-logo-destello {
          background: linear-gradient(105deg, transparent 0%, transparent 38%, rgba(255,255,255,0.95) 48%, rgba(147,197,253,0.9) 52%, transparent 62%, transparent 100%);
          background-size: 250% 100%;
          background-position: 130% 0;
          mix-blend-mode: screen;
        }
        .fn-logo-hover .fn-logo-destello { animation: fn-logo-brillo 0.8s ease forwards; }
        @keyframes fn-logo-brillo { 0% { background-position: 130% 0; } 100% { background-position: -30% 0; } }
        @media (prefers-reduced-motion: reduce) {
          .fn-logo-entrada, .fn-logo-destello { animation: none !important; }
        }
        /* Tarjetas de color: brillo que las cruza y el icono que salta al pasar el ratón */
        .fn-tarjeta-color::after {
          content: ""; position: absolute; top: 0; bottom: 0; left: -75%; width: 50%;
          background: linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%);
          transform: skewX(-20deg); pointer-events: none; opacity: 0;
        }
        .fn-tarjeta-hover::after { animation: fn-brillo-tarjeta 0.8s ease forwards; }
        @keyframes fn-brillo-tarjeta { 0% { left: -75%; opacity: 1; } 100% { left: 130%; opacity: 1; } }
        .fn-tarjeta-color .fn-icono-tarjeta { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease; }
        .fn-tarjeta-hover .fn-icono-tarjeta { transform: scale(1.22) rotate(-10deg); background-color: rgba(255,255,255,0.38) !important; }
        @media (prefers-reduced-motion: reduce) {
          .fn-tarjeta-color, .fn-tarjeta-color * { transition: none !important; animation: none !important; }
        }
        .fn-menu-accion:not(:disabled):hover { background: ${COLORS.surfaceRaised} !important; }
        .fn-fila-tabla:hover {
          background-color: ${COLORS.amber}14 !important;
          box-shadow: inset 4px 0 0 0 ${COLORS.amber};
        }
        .fn-navitem:not(.fz-mi):hover {
          background-color: ${COLORS.menuHoverBg} !important;
          padding-left: 14px !important;
          color: ${COLORS.menuTexto} !important;
        }
        .fn-navitem-active:hover { background-color: ${COLORS.menuActivoBg} !important; }
        .fn-navitem:not(.fz-mi):hover::before {
          transform: scaleY(1);
        }
        .fn-navitem svg {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .fn-navitem:not(.fz-mi):hover svg {
          transform: scale(1.18) rotate(-6deg);
        }
        .fn-navitem-active:not(.fz-mi)::before {
          transform: scaleY(1);
        }
        .fn-navitem-boton-mas {
          display: none;
        }
        /* ---- Zona superior derecha: semáforo, lupa, avisos y usuario ---- */
        .fz-semaforo, .fz-lupa, .fz-avisos, .fz-usuario { font-family: inherit; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); cursor: pointer; }
        .fz-semaforo { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 14px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--sc) 35%, transparent); background: color-mix(in srgb, var(--sc) 13%, transparent); color: var(--sc); font-size: 12.5px; font-weight: 800; white-space: nowrap; }
        .fz-semaforo i { width: 8px; height: 8px; border-radius: 50%; background: var(--sc); animation: fzLate 2s infinite; flex-shrink: 0; }
        .fz-semaforo small { font-size: 11.5px; font-weight: 600; opacity: .8; }
        @keyframes fzLate { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--sc) 60%, transparent); } 70% { box-shadow: 0 0 0 8px transparent; } 100% { box-shadow: 0 0 0 0 transparent; } }
        .fz-lupa { width: 42px; height: 42px; border-radius: 14px; border: 1px solid ${COLORS.line}; background: ${COLORS.surface}; color: ${COLORS.textDim}; display: grid; place-items: center; transition: transform .15s, color .15s; }
        .fz-lupa:hover { color: ${COLORS.text}; transform: translateY(-1px); }
        .fz-lupa.fz-on { color: ${COLORS.amber}; border-color: ${COLORS.amber}; }
        .fz-avisos { display: flex; align-items: center; gap: 10px; height: 46px; padding: 5px 14px 5px 5px; border-radius: 999px; border: 1px solid ${COLORS.line}; background: ${COLORS.surface}; color: ${COLORS.text}; }
        .fz-avisos-camp { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: ${COLORS.rust}22; color: ${COLORS.rust}; flex-shrink: 0; }
        .fz-avisos:not(.fz-avisos-ok) .fz-avisos-camp svg { animation: fzCampana 3s ease-in-out infinite; transform-origin: 50% 0; }
        .fz-avisos-ok .fz-avisos-camp { background: #10B98122; color: #10B981; }
        @keyframes fzCampana { 0%, 88%, 100% { transform: rotate(0); } 90% { transform: rotate(14deg); } 93% { transform: rotate(-12deg); } 96% { transform: rotate(8deg); } }
        .fz-avisos-txt { display: flex; flex-direction: column; text-align: left; line-height: 1.2; }
        .fz-avisos-txt b { font-size: 13px; }
        .fz-avisos-txt small { font-size: 11px; color: ${COLORS.textDim}; }
        .fz-avisos-num { display: none; }
        .fz-avisos-chips { display: flex; gap: 4px; }
        .fz-avisos-chips i { font-style: normal; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: color-mix(in srgb, var(--c) 18%, transparent); color: var(--c); white-space: nowrap; }
        .fz-usuario { display: flex; align-items: center; gap: 10px; height: 46px; padding: 5px 12px 5px 5px; border-radius: 999px; border: 1px solid ${COLORS.line}; background: ${COLORS.surface}; color: ${COLORS.text}; }
        .fz-usuario:hover, .fz-avisos:hover { border-color: ${COLORS.amber}88; }
        .fz-usuario-txt { display: flex; flex-direction: column; text-align: left; line-height: 1.2; }
        .fz-usuario-txt b { font-size: 13px; text-transform: capitalize; }
        .fz-usuario-txt small { font-size: 11px; color: ${COLORS.textDim}; }
        .fz-usuario-chev { color: ${COLORS.textDim}; }
        .fz-ava { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; font-size: 14px; color: #fff; background: linear-gradient(135deg, #3B82F6, #F59E0B); position: relative; flex-shrink: 0; }
        .fz-ava::after { content: ""; position: absolute; right: -1px; bottom: -1px; width: 10px; height: 10px; border-radius: 50%; background: #10B981; border: 2px solid ${COLORS.surface}; }
        .fz-ava-g { width: 42px; height: 42px; font-size: 16px; }
        .fz-desp { position: absolute; top: calc(100% + 10px); right: 0; z-index: 80; background: ${COLORS.surface}; border: 1px solid ${COLORS.line}; border-radius: 16px; box-shadow: 0 24px 50px -18px rgba(0,0,0,.5); padding: 8px; animation: fzAparece .16s ease; color: ${COLORS.text}; }
        @keyframes fzAparece { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        .fz-desp-avisos { width: 400px; max-height: 70vh; overflow-y: auto; }
        .fz-desp-semaforo { width: 360px; left: 0; right: auto; }
        .fz-desp-usuario { width: 270px; }
        .fz-desp-cab { display: flex; align-items: baseline; gap: 10px; padding: 8px 10px 10px; }
        .fz-desp-cab b { font-size: 14px; }
        .fz-desp-cab span { margin-left: auto; font-size: 11.5px; color: ${COLORS.textDim}; }
        .fz-desp-grupo { font-size: 10.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: ${COLORS.textDim}; padding: 10px 10px 4px; }
        .fz-desp-vacio { padding: 18px 10px; text-align: center; font-size: 12.5px; color: ${COLORS.textDim}; }
        .fz-desp-sep { height: 1px; background: ${COLORS.line}; margin: 6px 4px; }
        .fz-desp-pie { display: block; width: 100%; margin-top: 6px; padding: 10px; border: 0; border-top: 1px solid ${COLORS.line}; background: none; color: ${COLORS.amber}; font: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; }
        .fz-aviso { display: flex; align-items: flex-start; gap: 11px; width: 100%; padding: 9px 10px; border: 0; border-radius: 12px; background: none; text-align: left; font: inherit; color: ${COLORS.text}; cursor: pointer; }
        .fz-aviso:hover { background: ${COLORS.amber}12; }
        .fz-aviso-ic { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; flex-shrink: 0; background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
        .fz-aviso-tx { font-size: 12.8px; font-weight: 600; line-height: 1.4; padding-top: 6px; }
        .fz-aviso-tx em { font-style: normal; margin-left: 8px; font-size: 10.5px; font-weight: 800; padding: 1px 7px; border-radius: 999px; background: ${COLORS.rust}22; color: ${COLORS.rust}; }
        .fz-sis { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px; font-size: 13px; }
        .fz-sis:hover { background: ${COLORS.amber}10; }
        .fz-sis-p { width: 9px; height: 9px; border-radius: 50%; background: var(--sc); flex-shrink: 0; }
        .fz-sis b { flex: 1; font-weight: 700; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fz-sis-ms { font-family: "JetBrains Mono", monospace; font-size: 11.5px; color: ${COLORS.textDim}; }
        .fz-sis em { font-style: normal; font-size: 11px; font-weight: 800; color: var(--sc); white-space: nowrap; }
        .fz-sis em.fz-sis-error { font-weight: 600; max-width: 130px; overflow: hidden; text-overflow: ellipsis; }
        .fz-u-cab { display: flex; align-items: center; gap: 11px; padding: 8px 10px 10px; }
        .fz-u-cab b { display: block; font-size: 14px; text-transform: capitalize; }
        .fz-u-cab small { font-size: 11.5px; color: ${COLORS.textDim}; }
        .fz-op { display: flex; align-items: center; gap: 11px; width: 100%; padding: 10px; border: 0; border-radius: 10px; background: none; font: inherit; font-size: 13.5px; font-weight: 600; color: ${COLORS.text}; text-align: left; cursor: pointer; }
        .fz-op:hover { background: ${COLORS.amber}12; }
        .fz-op svg { color: ${COLORS.textDim}; }
        .fz-op-salir, .fz-op-salir svg { color: ${COLORS.rust}; }
        .fz-temas-mini { display: flex; gap: 8px; padding: 4px 10px 8px; }
        .fz-temas-mini button { width: 30px; height: 30px; border-radius: 9px; border: 2px solid transparent; cursor: pointer; }
        .fz-temas-mini button.on { border-color: ${COLORS.text}; }
        /* Pantallas medianas (portátil pequeño, tele a 1024): se recogen los textos para que todo quepa */
        @media (max-width: 1180px) {
          .fz-avisos-chips, .fz-semaforo small { display: none; }
        }
        @media (max-width: 960px) {
          .fz-usuario-txt, .fz-usuario-chev, .fz-avisos-txt, .fz-semaforo-txt { display: none; }
          .fz-semaforo { width: 40px; padding: 0; justify-content: center; }
          .fz-avisos { padding: 5px; }
          .fz-avisos-num { display: grid; place-items: center; min-width: 20px; height: 20px; padding: 0 6px; margin-right: 4px; border-radius: 999px; background: ${COLORS.rust}; color: #fff; font-size: 11px; font-weight: 800; }
          .fz-usuario { padding: 5px; }
          .fz-desp-avisos, .fz-desp-semaforo { position: fixed; top: 70px; left: 12px; right: 12px; width: auto; }
        }
        /* ---- Menú «Estudio» (escritorio): cristal, buscador, secciones plegables, pantallas y avisos ---- */
        .fz-menu .fz-mi::before { display: none; }
        @media (min-width: 769px) {
          .fz-menu .fz-menu-cab { display: flex; align-items: center; gap: 8px; padding: 2px 2px 14px; }
          .fz-menu .fz-menu-logo { flex: 1; min-width: 0; border: 0; background: none; padding: 0; cursor: pointer; display: flex; justify-content: center; }
          .fz-menu-plegar, .fz-menu-salir { width: 32px; height: 32px; flex-shrink: 0; border-radius: 9px; border: 1px solid ${COLORS.menuBorde}; background: ${COLORS.menuHoverBg}; color: ${COLORS.textDim}; display: grid; place-items: center; cursor: pointer; transition: color .15s, background .15s; }
          .fz-menu-plegar:hover, .fz-menu-salir:hover { color: ${COLORS.menuTexto}; background: ${COLORS.menuActivoBg}; }
          .fz-menu-sec-t { display: flex; align-items: center; gap: 8px; width: 100%; border: 0; background: none; cursor: pointer; padding: 14px 8px 6px; color: var(--c); font-size: 10.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
          .fz-menu-sec-t span { flex: 1; text-align: left; }
          .fz-menu-chev { opacity: .7; transition: transform .2s; }
          .fz-plegada .fz-menu-chev { transform: rotate(-90deg); }
          .fz-plegada .fz-mi, .fz-plegada .fz-mi-subs { display: none !important; }
          .fz-mi { display: flex; align-items: center; gap: 11px; padding: 7px 9px; margin-bottom: 2px; border-radius: 11px; cursor: pointer; color: ${COLORS.menuTexto}; font-size: 13.5px; font-weight: 600; position: relative; transition: background .15s; outline: none; overflow: visible !important; }
          .fz-mi:hover, .fz-mi:focus-visible { background: ${COLORS.menuHoverBg}; }
          .fz-mi-ico { width: 30px; height: 30px; flex-shrink: 0; border-radius: 9px; display: grid; place-items: center; background: color-mix(in srgb, var(--c) 15%, transparent); color: var(--c); transition: transform .2s; }
          .fz-mi:hover .fz-mi-ico { transform: scale(1.06); }
          .fz-mi.fz-on { background: linear-gradient(90deg, color-mix(in srgb, var(--c) 20%, transparent), transparent 85%); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 28%, transparent); font-weight: 700; }
          .fz-mi.fz-on::after { content: ""; position: absolute; left: -6px; top: 9px; bottom: 9px; width: 4px; border-radius: 0 4px 4px 0; background: var(--c); box-shadow: 0 0 14px var(--c); }
          .fz-mi.fz-on .fz-mi-ico { background: var(--c); color: #fff; }
          .fz-mi .fn-navitem-largo { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .fz-mi-aviso { flex-shrink: 0; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: color-mix(in srgb, var(--av) 18%, transparent); color: var(--av); }
          .fz-mi-chev { flex-shrink: 0; color: ${COLORS.textDim}; transform: rotate(-90deg); transition: transform .2s; }
          .fz-mi-chev.fz-abierta { transform: none; }
          .fz-menu-iconos .fz-mi-chev { display: none; }
          .fz-mi-subs { margin: 0 0 6px 24px; padding-left: 15px; border-left: 1px solid ${COLORS.menuBorde}; }
          .fz-mi-sub { display: block; width: 100%; text-align: left; border: 0; background: none; padding: 7px 10px; border-radius: 8px; font: inherit; font-size: 12.8px; font-weight: 600; color: ${COLORS.textDim}; cursor: pointer; }
          .fz-mi-sub:hover { background: ${COLORS.menuHoverBg}; color: ${COLORS.menuTexto}; }
          .fz-mi-sub.fz-on { color: var(--c); background: color-mix(in srgb, var(--c) 11%, transparent); }
          .fz-menu-vacio { padding: 14px 8px; font-size: 12.5px; color: ${COLORS.textDim}; }
          .fz-menu-pie { margin-top: auto; padding: 10px; border-radius: 14px; background: ${COLORS.menuHoverBg}; border: 1px solid ${COLORS.menuBorde}; display: flex; align-items: center; gap: 10px; }
          /* El pie (usuario y cerrar sesión) siempre a la vista: lo que se desplaza es solo la lista de opciones */
          .fn-sidebar.fz-menu { overflow: hidden !important; box-sizing: border-box; height: 100vh; height: 100dvh; min-height: 0 !important; }
          .fz-menu .fz-menu-nav { flex: 1 1 auto !important; min-height: 0; overflow-y: auto; overscroll-behavior: contain; margin: 0 -6px 10px; padding: 0 6px 4px; scrollbar-width: thin; scrollbar-color: ${COLORS.menuBorde} transparent; }
          .fz-menu .fz-menu-pie { flex-shrink: 0; margin-top: 0; }
          .fz-menu-pie .fz-menu-salir { margin-left: auto; background: transparent; }
          .fz-menu-avatar { width: 36px; height: 36px; flex-shrink: 0; border-radius: 11px; display: grid; place-items: center; font-weight: 800; color: #fff; background: linear-gradient(135deg, ${COLORS.amber}, #F59E0B); position: relative; }
          .fz-menu-avatar::after { content: ""; position: absolute; right: -2px; bottom: -2px; width: 10px; height: 10px; border-radius: 50%; background: ${COLORS.green}; border: 2px solid ${COLORS.menuBg}; }
          /* Barra de iconos fija (se activa desde el menú y se recuerda en este equipo) */
          .fn-sidebar.fz-menu-iconos { transform: none !important; visibility: visible !important; width: 78px !important; box-sizing: border-box; padding: 14px 10px !important; box-shadow: none; scrollbar-width: none; }
          .fz-menu-iconos .fz-menu-logo,
          .fz-menu-iconos .fz-menu-sec-t span, .fz-menu-iconos .fz-menu-chev, .fz-menu-iconos .fn-navitem-largo,
          .fz-menu-iconos .fz-mi-subs, .fz-menu-iconos .fz-menu-pie > div, .fz-menu-iconos .fz-menu-salir, .fz-menu-iconos .fz-menu-vacio { display: none !important; }
          .fz-menu-iconos .fz-menu-cab { justify-content: center; }
          .fz-menu-iconos .fz-menu-sec-t { justify-content: center; padding: 12px 0 5px; pointer-events: none; }
          .fz-menu-iconos .fz-plegada .fz-mi { display: flex !important; }
          .fz-menu-iconos .fz-mi { justify-content: center; padding: 6px; }
          .fz-menu-iconos .fz-mi.fz-on::after { left: -6px; }
          .fz-menu-iconos .fz-mi-aviso { position: absolute; top: 1px; right: 2px; padding: 0 5px; font-size: 9.5px; line-height: 15px; background: var(--av); color: #fff; }
          .fz-menu-iconos .fz-menu-pie { justify-content: center; padding: 8px; }
          .fn-shell.fz-con-iconos { padding-left: 78px; }
        }
        @media (max-width: 768px) {
          .fz-menu-cab, .fz-mi-subs, .fz-mi-chev, .fz-menu-pie, .fz-menu-vacio, .fz-menu-sec-t { display: none !important; }
          .fz-menu-nav, .fz-menu-sec, .fz-mi-ico { display: contents !important; }
          .fz-mi { display: flex; align-items: center; border-radius: 8px; cursor: pointer; color: ${COLORS.menuTexto}; font-weight: 500; }
          .fz-mi.fz-on { background: ${COLORS.menuActivoBg}; font-weight: 700; }
        }
        /* Columna derecha: si no hay ningún aviso dentro, desaparece y el contenido usa todo el ancho */
        .fn-side-panel:empty { display: none !important; }
        .fn-avisos-abajo:empty { display: none !important; }
        /* Fila de filtros: ocupa todo el ancho, igual que el bloque de tarjetas.
           La búsqueda mide el doble que cada uno de los demás campos, que son todos iguales entre sí. */
        .fn-filtros {
          display: grid;
          gap: 8px;
          align-items: center;
          grid-template-columns: minmax(230px, 2fr) repeat(var(--n, 6), minmax(0, 1fr));
        }
        @media (max-width: 1016px) {
          .fn-filtros { grid-template-columns: repeat(var(--n, 6), minmax(0, 1fr)); }
          .fn-filtro-buscar { grid-column: 1 / -1; }
        }
        .fn-stat-grid > div { min-width: 0 !important; }
        @media (min-width: 769px) and (max-width: 900px) {
          .fn-stat-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }

        /* Menú lateral plegable — solo escritorio. Oculto por defecto, se abre con el botón ☰ */
        @media (min-width: 769px) {
          .fn-sidebar {
            position: fixed !important;
            top: 0; left: 0; bottom: 0;
            height: 100vh;
            overflow-y: auto;
            overscroll-behavior: contain;
            scrollbar-width: thin;
            scrollbar-color: ${COLORS.menuBorde} transparent;
            z-index: 60;
            transform: translateX(-100%);
            visibility: hidden;
            transition: transform 0.25s ease, visibility 0s linear 0.25s;
          }
          .fn-sidebar.fn-sidebar-abierto {
            transform: translateX(0);
            visibility: visible;
            transition: transform 0.25s ease, visibility 0s;
            box-shadow: 8px 0 30px rgba(15,23,42,0.18);
          }
          /* Sin esto, las opciones (que tienen overflow:hidden) se encogen para caber
             en vez de desbordar, y el menú nunca llega a tener scroll. */
          .fn-sidebar > * { flex-shrink: 0; }
          .fn-main { margin: 0 auto; }
        }
        .fn-menu-hamburguesa {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px; height: 38px;
          border-radius: 9px;
          border: 1px solid ${COLORS.line};
          background: ${COLORS.surface};
          color: ${COLORS.text};
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .fn-menu-hamburguesa:hover { background: ${COLORS.sidebarActiveBg}; color: #FFFFFF; }

        @media (max-width: 768px) {
          .fn-menu-izquierda { display: none !important; }
          .fn-menu-overlay { display: none !important; }
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
            border-top: 1px solid ${COLORS.menuBorde} !important;
            box-shadow: 0 -4px 14px rgba(15,23,42,0.06);
            position: fixed !important;
            bottom: 0; left: 0; right: 0;
            background: ${COLORS.menuBg} !important;
            z-index: 40;
          }
          .fn-sidebar .fn-logo { display: none !important; }
          .fn-sidebar .fn-seccion-menu, .fn-sidebar .fn-navitem-num, .fn-sidebar .fn-navitem-largo:has(+ .fn-navitem-corto) { display: none !important; }
          .fn-sidebar .fn-navitem-corto { display: inline !important; }
          .fn-sidebar .fn-navitem { flex-direction: column !important; gap: 3px !important; font-size: 11px !important; padding: 8px 10px !important; margin-bottom: 0 !important; min-width: 56px; }
          .fn-sidebar .fn-navitem svg { width: 21px; height: 21px; }
          .fn-shell { flex-direction: column !important; }
          .fn-main { max-width: 100% !important; padding: 16px 14px 78px 14px !important; }
          .fn-header-row { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
          .fn-header-row button { width: 100% !important; }
          .fn-header-actions { flex-direction: column !important; align-items: stretch !important; width: 100% !important; }
          .fn-stat-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .fn-stat-grid > div { min-width: 0 !important; min-height: 100px !important; }
          .fn-icono-tarjeta { width: 34px !important; height: 34px !important; margin-left: 4px !important; }
          .fn-icono-tarjeta svg { width: 19px; height: 19px; }
          .fn-tarjeta-nueva { order: -1; }
          .fn-content-flex { flex-direction: column !important; }
          .fn-side-panel { width: 100% !important; position: static !important; max-height: none !important; overflow-y: visible !important; }
          .fn-search { max-width: 100% !important; }
          .fn-filtros { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .fn-kanban-col { flex: 0 0 200px !important; min-width: 200px !important; }
          .fn-modal-box { width: 92vw !important; max-width: 92vw !important; padding: 18px !important; }
        }
      `}</style>

      <div className={`fn-shell${menuIconos ? " fz-con-iconos" : ""}`} key={temaInicio} style={{ display: "flex" }}>
        {menuAbierto && (
          <div className="fn-menu-overlay" onClick={() => setMenuAbierto(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 59 }} />
        )}
        <aside
          className={`fn-sidebar fz-menu${menuAbierto ? " fn-sidebar-abierto" : ""}${menuIconos && !menuAbierto ? " fz-menu-iconos" : ""}`}
          style={{ width: 288, background: `linear-gradient(180deg, ${COLORS.menuBg}F7, ${COLORS.menuBg}EB)`, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRight: `1px solid ${COLORS.menuBorde}`, minHeight: "100vh", padding: "16px 14px 14px", flexShrink: 0, display: "flex", flexDirection: "column" }}
        >
          <div className="fn-logo fz-menu-cab">
            <button type="button" className="fz-menu-logo" onClick={() => { setVista("reparaciones"); setMenuAbierto(false); }} title="Ir a la pantalla principal">
              <LogoAnimado key={menuAbierto ? "abierto" : "cerrado"} />
            </button>
            <button
              type="button"
              className="fz-menu-plegar"
              onClick={() => { if (menuAbierto) { cambiarMenuIconos(!menuIconos); setMenuAbierto(false); } else setMenuAbierto(true); }}
              title={menuAbierto ? (menuIconos ? "Quitar la barra de iconos fija" : "Dejar fija una barra de iconos a la izquierda") : "Abrir el menú completo"}
              aria-label={menuAbierto ? "Cambiar a barra de iconos" : "Abrir el menú completo"}
            >
              {menuAbierto ? (menuIconos ? <X size={16} /> : <PanelLeftClose size={16} />) : <PanelLeftOpen size={16} />}
            </button>
          </div>

          <nav className="fz-menu-nav">
            {SECCIONES_MENU.map((seccion) => {
              const items = MENU_GRUPOS.filter((g) => g.seccion === seccion && !g.oculto);
              if (!items.length) return null;
              const { color, icono: IconoSeccion } = ESTILO_SECCION[seccion];
              const plegada = seccionesPlegadas.includes(seccion);
              return (
                <div key={seccion} className={`fz-menu-sec${plegada ? " fz-plegada" : ""}`} style={{ "--c": color }}>
                  <button type="button" className="fn-seccion-menu fz-menu-sec-t" onClick={() => plegarSeccion(seccion)} aria-expanded={!plegada} title={plegada ? `Mostrar ${seccion}` : `Plegar ${seccion}`}>
                    <IconoSeccion size={13} strokeWidth={2.4} />
                    <span>{seccion}</span>
                    <ChevronDown size={14} className="fz-menu-chev" />
                  </button>
                  {items.map((item) => {
                    const activo = grupoDeVista(vista)?.key === item.key;
                    const varias = item.pestanas.length > 1;
                    const desplegada = opcionAbierta === item.key;
                    // Con varias pantallas, la opción despliega su lista y esperas a elegir; con una sola, va directa.
                    // En el móvil y en la barra de iconos no hay lista: se va a la primera pantalla.
                    const pulsar = () => {
                      const sinLista = !menuAbierto || window.matchMedia("(max-width: 768px)").matches;
                      if (varias && !sinLista) { setOpcionAbierta(desplegada ? null : item.key); return; }
                      setVista(item.pestanas[0][0]); setMostrarMasMovil(false); setMenuAbierto(false);
                    };
                    return (
                      <React.Fragment key={item.key}>
                        <div
                          className={`fn-navitem fz-mi${activo ? " fn-navitem-active fz-on" : ""}${item.movil === "mas" ? " fn-navitem-en-mas" : ""}`}
                          onClick={pulsar}
                          title={item.label}
                          role="button"
                          tabIndex={0}
                          aria-expanded={varias ? desplegada : undefined}
                          onKeyDown={(e) => { if (e.key === "Enter") pulsar(); }}
                        >
                          <span className="fz-mi-ico"><item.icon size={16} /></span>
                          <span className="fn-navitem-largo">{item.label}</span>
                          {item.corto && <span className="fn-navitem-corto">{item.corto}</span>}
                          {varias && <ChevronDown size={14} className={`fz-mi-chev${desplegada ? " fz-abierta" : ""}`} />}
                        </div>
                        {desplegada && varias && (
                          <div className="fz-mi-subs">
                            {item.pestanas.map(([k, nombre]) => (
                              <button key={k} type="button" className={`fz-mi-sub${vista === k ? " fz-on" : ""}`} onClick={() => { setVista(k); setMenuAbierto(false); }}>
                                {nombre}
                              </button>
                            ))}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })}
          </nav>
          <div
            onClick={() => setMostrarMasMovil((v) => !v)}
            className={`fn-navitem fn-navitem-boton-mas${mostrarMasMovil ? " fn-navitem-active" : ""}`}
            style={{ alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, marginBottom: 4, cursor: "pointer", color: COLORS.menuTexto, fontSize: 13.5, fontWeight: 500 }}
          >
            <MoreHorizontal size={16} />
            Más
          </div>

          <div className="fz-menu-pie">
            <span className="fz-menu-avatar">{(nombreUsuarioDelToken() || "?").charAt(0).toUpperCase()}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.menuTexto, textTransform: "capitalize", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nombreUsuarioDelToken()}</div>
              <div style={{ fontSize: 11, color: COLORS.textDim }}>Activo · Sede principal</div>
            </div>
            {onCerrarSesion && (
              <button type="button" className="fz-menu-salir" onClick={onCerrarSesion} title="Cerrar sesión" aria-label="Cerrar sesión">
                <LogOut size={15} />
              </button>
            )}
          </div>
        </aside>

        {mostrarMasMovil && (
          <div className="fn-hoja-mas" onClick={() => setMostrarMasMovil(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 55 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: COLORS.menuBg, borderRadius: "16px 16px 0 0", padding: "16px 16px 90px 16px", maxHeight: "70vh", overflowY: "auto" }}>
              <div style={{ width: 36, height: 4, background: COLORS.menuBorde, borderRadius: 999, margin: "0 auto 16px" }} />
              {MENU_GRUPOS.filter((g) => g.movil === "mas" && !g.oculto).map((item, i, lista) => {
                const activo = grupoDeVista(vista)?.key === item.key;
                const nuevaSeccion = i === 0 || lista[i - 1].seccion !== item.seccion;
                return (
                  <React.Fragment key={item.key}>
                    {nuevaSeccion && <TituloSeccionMenu seccion={item.seccion} primera={i === 0} compacto />}
                    <div
                      onClick={() => { setVista(item.pestanas[0][0]); setMostrarMasMovil(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 10px", borderRadius: 8, cursor: "pointer", color: COLORS.menuTexto, background: activo ? COLORS.menuActivoBg : "transparent", fontWeight: activo ? 700 : 500, fontSize: 14.5 }}
                    >
                      <item.icon size={18} />
                      {item.label}
                      {item.pestanas.length > 1 && <span style={{ marginLeft: "auto", fontSize: 11, color: COLORS.textDim }}>{item.pestanas.length}</span>}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        <main className="fn-main" style={{ flex: 1, minWidth: 0, padding: "26px 32px", maxWidth: 1180 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div className="fn-menu-izquierda" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                className="fn-menu-hamburguesa"
                onClick={() => setMenuAbierto((v) => !v)}
                aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={menuAbierto}
              >
                <Menu size={20} />
              </button>
              {/* Nombre junto al botón ☰: letra tecnológica (Orbitron) con un brillo que recorre
                  las letras sin parar; al pasar el ratón, las letras se separan y se iluminan. */}
              {/* Además, al pulsarlo te lleva a la pantalla principal (Reparaciones), estés donde estés. */}
              <button
                type="button"
                className="fn-marca"
                onClick={() => {
                  setVista("reparaciones");
                  setMenuAbierto(false);
                  setMostrarMasMovil(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                title="Ir a la pantalla principal"
                aria-label="Firztnet: ir a la pantalla principal"
              >
                <span className="fn-marca-firzt">FIRZT</span><span className="fn-marca-net">NET</span>
              </button>
            </div>
            <div className="fz-cabecera-der" style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
              <SemaforoSistemas onIrVista={setVista} />
              <button
                type="button"
                className={`fn-boton-buscar fz-lupa${vista === "buscar" ? " fz-on" : ""}`}
                onClick={() => { setVista("buscar"); setMenuAbierto(false); setMostrarMasMovil(false); }}
                aria-label="Buscar órdenes"
                title="Buscar órdenes"
              >
                <Search size={18} />
              </button>
              <CampanitaNotificaciones onIrVista={setVista} onAbrirTicket={(t) => setSelected(t)} />
              <InsigniaUsuario onCerrarSesion={onCerrarSesion} onIrVista={setVista} tema={temaInicio} onTema={cambiarTemaInicio} />
            </div>
          </div>
          <div>
          {vista !== "reparaciones" && (
          <div className="fn-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <div>
              <h1 style={{ fontFamily: "Oswald", fontSize: 24, margin: 0, letterSpacing: 0.3 }}>
                {vista === "reparaciones" && "Panel de reparaciones"}
                {vista === "clientes" && "Clientes"}
                {vista === "mantenimientos" && "Mantenimientos"}
                {vista === "flota" && "Flota"}
                {vista === "buscar" && "Buscar órdenes"}
                {vista === "reportes" && "Reportes"}
                {vista === "inventario" && "Inventario"}
                {vista === "rma" && "Garantías con proveedores (RMA)"}
                {vista === "garantias" && "Garantías activas de clientes"}
                {vista === "ventas" && "Ventas de tus otros negocios"}
                {vista === "visitas-web" && "Visitas de tus webs"}
                {vista === "rendimiento" && "Rendimiento de técnicos"}
                {vista === "rentabilidad" && "Rentabilidad por línea de servicio"}
                {vista === "caja" && "Caja"}
                {vista === "plantillas" && "Plantillas"}
                {vista === "conocimiento" && "Base de conocimiento"}
                {vista === "recordatorios" && "Recordatorios"}
                {vista === "cuadro" && "Cuadro de mando de tu negocio"}
                {vista === "clientes-sistemas" && "Clientes de tus sistemas"}
                {vista === "informes-mensuales" && "Informes mensuales de visitas"}
                {vista === "riesgo" && "Clientes que podrías perder"}
                {vista === "cobros" && "Cobros de cuotas"}
                {vista === "punto-venta" && "Punto de venta: tus tiendas"}
                {vista === "estado-sistemas" && "Estado de tus sistemas y webs"}
                {vista === "ayuda" && "Ayuda a clientes de tus sistemas"}
                {vista === "solicitudes" && "Solicitudes de servicio"}
                {vista === "ajustes" && "Ajustes"}
              </h1>
              {vista === "reparaciones" && (
                <span style={{ color: COLORS.textDim, fontSize: 13 }}>{cargando ? "Cargando..." : `${reparaciones.length} reparaciones cargadas`}</span>
              )}
            </div>
          </div>
          )}

          <PestanasGrupo vista={vista} onIr={setVista} />

          {errorCarga && (
            <div style={{ background: COLORS.tintRojo, border: `1px solid ${COLORS.rust}`, color: COLORS.tintRojoTx, borderRadius: 8, padding: "10px 14px", fontSize: 12.5, marginBottom: 16 }}>
              {errorCarga}
            </div>
          )}

          {vista === "clientes" && <ClientesView />}
          {vista === "mantenimientos" && <MantenimientosView onCambio={cargarTodo} />}
          {vista === "flota" && <FlotaView onCambio={cargarTodo} />}
          {vista === "reportes" && (
            <ReportesView
              reporteDiario={reporteDiario} reporteMensual={reporteMensual} contador={contador} tendencia={tendencia}
              onFiltrarPorEstado={(estado) => { setFiltroEstadoResumen(estado); setVista("reparaciones"); }}
            />
          )}
          {vista === "inventario" && <InventarioView />}
          {vista === "rma" && <RmaView />}
          {vista === "garantias" && <GarantiasActivasView onAbrir={(t) => setSelected(t)} reparaciones={reparaciones} />}
          {vista === "ventas" && <VentasView />}
          {vista === "visitas-web" && <VisitasWebView />}
          {vista === "rendimiento" && <RendimientoView />}
          {vista === "rentabilidad" && <RentabilidadView />}
          {vista === "caja" && <CajaView onMovimientoCreado={cargarTodo} />}
          {vista === "plantillas" && <PlantillasView />}
          {vista === "conocimiento" && <ConocimientoView />}
          {vista === "recordatorios" && <RecordatoriosView />}
          {vista === "cuadro" && <CuadroMandoView onIrVista={setVista} />}
          {vista === "clientes-sistemas" && <ClientesSistemasView />}
          {vista === "informes-mensuales" && <InformesMensualesView />}
          {vista === "riesgo" && <RiesgoView />}
          {vista === "cobros" && <CobrosView />}
          {vista === "punto-venta" && <PuntoVentaView />}
          {vista === "estado-sistemas" && <EstadoSistemasView />}
          {vista === "ayuda" && <AyudaClientesView />}
          {vista === "solicitudes" && <SolicitudesView />}
          {vista === "ajustes" && <AjustesView />}

          {vista === "reparaciones" && (
            <InicioTaller
              nombre={nombreUsuarioDelToken()}
              tema={temaInicio}
              onTema={cambiarTemaInicio}
              reparaciones={reparaciones}
              etapas={stagesFor(vistaTrabajo)}
              vistaTrabajo={vistaTrabajo}
              selectorTrabajo={<SelectorTipoTrabajo valor={vistaTrabajo} onCambiar={setVistaTrabajo} />}
              reporteMensual={reporteMensual}
              reporteDiario={reporteDiario}
              tendencia={tendencia}
              retrasadasLista={metricasEficiencia.retrasadasLista}
              tiempoMedioDias={metricasEficiencia.tiempoMedioDias}
              numClientes={numClientes}
              resumenMant={resumenMant}
              stockBajo={stockBajoTarjeta}
              cargando={cargando}
              onNueva={() => setMostrarNueva(true)}
              onBuscar={() => { setVista("buscar"); setMenuAbierto(false); }}
              onIrVista={setVista}
              onAbrir={(t) => setSelected(t)}
              onEtapa={(key) => { setFiltroEstado(key); setVista("buscar"); }}
            />
          )}
          </div>

          {vista === "reparaciones" && (
          <>
          <div style={{ height: 4 }} />
          {/* Las tablas ocupan todo el ancho; los avisos van debajo (antes iban en una columna a la derecha y estrechaban las tablas) */}
          <div className="fz-tablas" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ minWidth: 0 }}>
              <TablaOrdenesActivas reparaciones={reparaciones} onAbrir={(t) => setSelected(t)} onHover={handleHoverPreview} onCambio={cargarTodo} />

              <TablaTableroCompleto reparaciones={tableroPrincipal} tipoTrabajo={vistaTrabajo} onAbrir={(t) => setSelected(t)} onHover={handleHoverPreview} onCambio={cargarTodo} cargando={cargando} />
            </div>

            <div className="fn-avisos-abajo" style={{ minWidth: 0 }}>
              <PanelAlertas reparaciones={reparaciones} onAbrir={(t) => setSelected(t)} onIrInventario={() => setVista("inventario")} onIrGarantias={() => setVista("garantias")} ocultarStockBajo />
            </div>
          </div>
          </>
          )}
          {/* Pantalla Buscar: se llega con la lupa de arriba, junto a la campana */}
          {vista === "buscar" && (
          <>
          <div className="fn-filtros" style={{ "--n": String(tipoBusqueda === "domicilio" ? 5 : 7), marginTop: 6, marginBottom: 10 }}>
              <div className="fn-search fn-filtro-buscar" style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", minWidth: 0, height: 40, boxSizing: "border-box", background: COLORS.surface, border: `1px solid ${query.trim() ? COLORS.amber : COLORS.line}`, borderRadius: 8, padding: "0 12px" }}>
                <Search size={15} color={COLORS.textDim} style={{ flexShrink: 0 }} />
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente, teléfono, nº orden o equipo..." aria-label="Buscar" style={{ background: "none", border: "none", outline: "none", color: COLORS.text, fontSize: 13.5, width: "100%", minWidth: 0 }} />
                {query && <button type="button" onClick={() => setQuery("")} aria-label="Borrar búsqueda" style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.textDim, padding: 0, display: "flex" }}><X size={14} /></button>}
              </div>
              <select className="fn-filtro-campo" value={tipoBusqueda} onChange={(e) => setTipoBusqueda(e.target.value)} aria-label="Tipo" style={estiloFiltro(tipoBusqueda !== "todos")}>
                <option value="todos">Taller e In Situ</option>
                <option value="taller">Solo taller</option>
                <option value="domicilio">Solo In Situ</option>
              </select>
              {tipoBusqueda !== "domicilio" && (
                <>
                  <select className="fn-filtro-campo" value={filtroMarca} onChange={(e) => { setFiltroMarca(e.target.value); setFiltroModelo(""); }} aria-label="Marca" style={estiloFiltro(!!filtroMarca)}>
                    <option value="">Marca</option>
                    {marcasDisponibles.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select className="fn-filtro-campo" value={filtroModelo} onChange={(e) => setFiltroModelo(e.target.value)} aria-label="Modelo" style={estiloFiltro(!!filtroModelo)}>
                    <option value="">Modelo</option>
                    {modelosDisponibles.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </>
              )}
              <select className="fn-filtro-campo" value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)} aria-label="Cliente" style={estiloFiltro(!!filtroCliente)}>
                <option value="">Cliente</option>
                {clientesDisponibles.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <select className="fn-filtro-campo" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} aria-label="Estado" style={estiloFiltro(!!filtroEstado)}>
                <option value="">Estado</option>
                {estadosBusqueda.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <button type="button" className="fn-filtro-campo" onClick={() => setFiltroHoy((v) => !v)} style={estiloFiltroBoton(filtroHoy, COLORS.amber)}>
                <Clock size={12} /> Hoy
              </button>
              <button type="button" className="fn-filtro-campo" onClick={() => setFiltroUrgente((v) => !v)} style={estiloFiltroBoton(filtroUrgente, COLORS.rust)}>
                <Flame size={12} /> Urgente
              </button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 12.5, color: COLORS.textDim }}>
            <span>{hayFiltrosBusqueda ? `${filtered.length} ${filtered.length === 1 ? "orden encontrada" : "órdenes encontradas"}` : "Escribe o elige un filtro. Mientras tanto se ven todas las órdenes."}</span>
            {hayFiltrosBusqueda && (
              <button type="button" onClick={limpiarBusqueda} style={{ border: "none", background: "none", color: COLORS.amber, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
                <X size={13} /> Quitar filtros
              </button>
            )}
          </div>
          <TablaTableroCompleto
            reparaciones={filtered}
            tipoTrabajo={tipoBusqueda}
            titulo={hayFiltrosBusqueda ? "Resultados de la búsqueda" : "Todas las órdenes"}
            subtitulo={hayFiltrosBusqueda ? "Las órdenes que coinciden con lo que has buscado." : "Taller e In Situ, con su estado actual."}
            mensajeVacio="Ninguna orden coincide. Prueba con otra palabra o quita algún filtro."
            onAbrir={(t) => setSelected(t)}
            onHover={handleHoverPreview}
            onCambio={cargarTodo}
            cargando={cargando}
          />
          </>
          )}
        </main>
      </div>

      <TicketModal key={selected?.id || "ninguna"} t={selected} onClose={() => { setSelected(null); cargarTodo(); }} onEstadoActualizado={handleEstadoActualizado} onDatosCambiados={cargarTodo} />
      {mostrarNueva && <NuevaReparacionModal onClose={() => setMostrarNueva(false)} onCreada={handleCreada} />}
    </div>
  );
}
