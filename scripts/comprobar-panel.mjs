// Comprobación de que no falta nada importante antes de publicar el panel.
// El 13/11/2026 se subió la sección Flota hecha sobre una copia antigua y borró la pantalla
// principal, los temas y Firztnet Central. Vercel la ejecuta antes de compilar (npm run build):
// si falta algo, NO publica y sigue funcionando la versión anterior. GitHub la ejecuta también
// en cada subida y, si falla, te llega un correo.
// Si algún día quitas algo a propósito, quítalo también de esta lista.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

const OBLIGATORIO = {
  'src/firztnet-panel.jsx': [
    ['inicio-taller', 'Pantalla principal nueva'],
    ['PALETAS', 'Los cuatro temas del panel'],
    ['function AyudaClientesView', 'Central: ayuda a clientes'],
    ['/central/salud', 'Central: estado de los sistemas'],
    ['/central/clientes', 'Central: clientes de tus sistemas'],
    ['function CuadroMandoView', 'Central: cuadro de mando'],
    ['/central/cobros', 'Central: cobros'],
    ['/central/copias', 'Central: copias de seguridad'],
    ['/central/riesgo', 'Central: clientes en riesgo'],
    ['function FlotaView', 'Flota'],
    ['function PuntoVentaView', 'Central: punto de venta (tiendas)'],
    ['const MENU_GRUPOS', 'Menú por apartados'],
    ['["reparaciones", ', 'Menú: pestaña «reparaciones»'],
    ['["solicitudes", ', 'Menú: pestaña «solicitudes»'],
    ['["garantias", ', 'Menú: pestaña «garantias»'],
    ['["clientes", ', 'Menú: pestaña «clientes»'],
    ['["mantenimientos", ', 'Menú: pestaña «mantenimientos»'],
    ['["recordatorios", ', 'Menú: pestaña «recordatorios»'],
    ['["inventario", ', 'Menú: pestaña «inventario»'],
    ['["rma", ', 'Menú: pestaña «rma»'],
    ['["reportes", ', 'Menú: pestaña «reportes»'],
    ['["rendimiento", ', 'Menú: pestaña «rendimiento»'],
    ['["rentabilidad", ', 'Menú: pestaña «rentabilidad»'],
    ['["plantillas", ', 'Menú: pestaña «plantillas»'],
    ['["conocimiento", ', 'Menú: pestaña «conocimiento»'],
    ['["caja", ', 'Menú: pestaña «caja»'],
    ['["flota", ', 'Menú: pestaña «flota»'],
    ['["ajustes", ', 'Menú: pestaña «ajustes»'],
    ['["cuadro", ', 'Menú: pestaña «cuadro»'],
    ['["cobros", ', 'Menú: pestaña «cobros»'],
    ['["ventas", ', 'Menú: pestaña «ventas»'],
    ['["clientes-sistemas", ', 'Menú: pestaña «clientes-sistemas»'],
    ['["riesgo", ', 'Menú: pestaña «riesgo»'],
    ['["punto-venta", ', 'Menú: pestaña «punto-venta»'],
    ['["ayuda", ', 'Menú: pestaña «ayuda»'],
    ['["estado-sistemas", ', 'Menú: pestaña «estado-sistemas»'],
    ['["visitas-web", ', 'Menú: pestaña «visitas-web»'],
    ['["informes-mensuales", ', 'Menú: pestaña «informes-mensuales»'],
  ],
  'src/inicio-taller.jsx': [['export', 'Pantalla principal nueva']],
};

const faltas = [];
for (const [archivo, trozos] of Object.entries(OBLIGATORIO)) {
  const ruta = join(raiz, archivo);
  if (!existsSync(ruta)) { faltas.push(`Falta el archivo ${archivo}`); continue; }
  const texto = readFileSync(ruta, 'utf8');
  for (const [trozo, queEs] of trozos) if (!texto.includes(trozo)) faltas.push(`${archivo}: falta «${trozo}» (${queEs})`);
}

if (faltas.length) {
  console.error('NO SE PUBLICA: a esta versión del panel le faltan partes importantes.');
  console.error('¿Se ha subido una copia antigua? Descarga la última versión de GitHub y vuelve a hacer el cambio.\n');
  for (const f of faltas) console.error(' - ' + f);
  process.exit(1);
}
console.log('Comprobación correcta: pantalla principal, temas, Central y Flota están en su sitio.');
