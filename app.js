// =====================================================================
// app.js - La página del detective. NO necesitas editar este archivo.
//
// Solo usa la API de modelo.js:
//   entrenar(datos)                 -> modelo
//   clasificar(texto, modelo)       -> { etiqueta, probSpam, aportes }
//   evaluar(modelo, prueba)         -> { exactitud, vp, fp, vn, fn, total, errores }
// las pruebas automáticas de pruebas.js (botón "Ejecutar autocomprobación"):
//   ejecutarAutocomprobacion()      -> { version, resultados, resumen, texto }
// y la API de reglas.js (el filtro escrito a mano, sirve aunque falten TODO):
//   puntuarPorReglas(texto)         -> { puntaje, etiqueta, coincidencias }
//   evaluarReglas(prueba)           -> { exactitud, vp, fp, vn, fn, total, errores }
// además de los datos de datos.js: ENTRENAMIENTO y PRUEBA.
// =====================================================================

// ---------- Estado de la página ----------
const estado = {
  modelo: null,
  ejemplosPropios: [],                         // ejemplos que el usuario enseña
  quitadas: { spam: false, normal: false },    // ¿se quitó una clase completa?
  sesgado: false                               // ¿dataset sesgado activado?
};

const NORMALES_EN_SESGADO = 3;   // cuántos mensajes normales quedan en el dataset sesgado

// Atajo para buscar elementos por id
function $(id) {
  return document.getElementById(id);
}

// ---------- Errores amigables ----------
function ocultarError() {
  $("caja-error").hidden = true;
}

function mostrarError(error) {
  $("caja-error").hidden = false;
  if (error && error.esPendiente) {
    $("error-titulo").textContent = "Aún falta completar una parte del código";
    $("error-detalle").textContent = error.message;
    $("error-ayuda").textContent = "Abre modelo.js, completa ese TODO, borra la línea \"pendiente(...)\", guarda y recarga la página (F5). Para ver qué partes ya funcionan, pulsa \"Ejecutar autocomprobación\".";
  } else {
    $("error-titulo").textContent = "Tu código tiene un problema";
    $("error-detalle").textContent = (error && error.message) ? error.message : String(error);
    $("error-ayuda").textContent = "Pulsa F12 y abre la pestaña Consola para ver en qué línea ocurrió.";
  }
}

// ---------- Datos de entrenamiento actuales ----------
function datosBase() {
  let normalesVistos = 0;
  return ENTRENAMIENTO.filter(function (ej) {
    if (estado.quitadas[ej.etiqueta]) return false;
    if (estado.sesgado && ej.etiqueta === "normal") {
      normalesVistos += 1;
      return normalesVistos <= NORMALES_EN_SESGADO;
    }
    return true;
  });
}

function datosActuales() {
  return datosBase().concat(estado.ejemplosPropios);
}

function contarClases(datos) {
  let spam = 0;
  let normal = 0;
  for (const ej of datos) {
    if (ej.etiqueta === "spam") spam += 1;
    else normal += 1;
  }
  return { spam: spam, normal: normal };
}

// ---------- Entrenar (y reentrenar) ----------
function reentrenar() {
  const datos = datosActuales();
  const conteo = contarClases(datos);
  $("conteo-spam").textContent = conteo.spam;
  $("conteo-normal").textContent = conteo.normal;
  const total = conteo.spam + conteo.normal;
  $("barra-datos-spam").style.width = (total === 0 ? 0 : (conteo.spam / total) * 100) + "%";

  try {
    const modelo = entrenar(datos);
    if (!modelo || typeof modelo !== "object") {
      throw new Error("entrenar(datos) debe devolver el modelo (te falta el return modelo;).");
    }
    estado.modelo = modelo;
    $("conteo-vocab").textContent = modelo.tamVocabulario !== undefined ? modelo.tamVocabulario : "?";
    ocultarError();
  } catch (error) {
    estado.modelo = null;
    $("conteo-vocab").textContent = "-";
    mostrarError(error);
  }
}

// ---------- Analizar un mensaje ----------
function analizar() {
  const texto = $("texto").value.trim();
  if (texto === "") {
    $("resultado").hidden = true;
    compararTexto("");
    return;
  }
  if (!estado.modelo) {
    reentrenar();            // reintenta: quizá ya completaste el TODO
    if (!estado.modelo) {
      compararTexto(texto);  // las reglas funcionan aunque el modelo no esté listo
      return;
    }
  }
  try {
    const res = clasificar(texto, estado.modelo);
    validarRespuesta(res);
    mostrarResultado(res);
    ocultarError();
  } catch (error) {
    $("resultado").hidden = true;
    mostrarError(error);
  }
  compararTexto(texto);
}

function validarRespuesta(res) {
  if (!res || typeof res !== "object") {
    throw new Error("clasificar debe devolver un objeto { etiqueta, probSpam, aportes }.");
  }
  if (typeof res.probSpam !== "number" || isNaN(res.probSpam)) {
    throw new Error("clasificar devolvió un probSpam que no es un número (¿dividiste bien? ¿usaste Math.exp?).");
  }
  if (res.etiqueta !== "spam" && res.etiqueta !== "normal") {
    throw new Error("clasificar debe devolver etiqueta \"spam\" o \"normal\".");
  }
  if (!Array.isArray(res.aportes)) {
    throw new Error("clasificar debe devolver aportes como una lista (usa agruparAportes(lista)).");
  }
}

function mostrarResultado(res) {
  $("resultado").hidden = false;

  const insignia = $("veredicto");
  insignia.textContent = res.etiqueta === "spam" ? "SPAM" : "NORMAL";
  insignia.className = "insignia " + res.etiqueta;

  const pct = Math.round(res.probSpam * 1000) / 10;
  $("prob-texto").textContent = "Probabilidad de spam: " + pct + "%";
  $("barra-relleno").style.width = (res.probSpam * 100) + "%";

  const contenedor = $("chips");
  contenedor.textContent = "";
  const top = res.aportes.slice(0, 10);
  for (const item of top) {
    const chip = document.createElement("span");
    chip.className = "chip " + (item.aporte > 0 ? "chip-spam" : "chip-normal");
    const signo = item.aporte > 0 ? "+" : "";
    chip.textContent = item.palabra + " " + signo + item.aporte.toFixed(1);
    chip.title = item.aporte > 0 ? "Empuja hacia SPAM" : "Empuja hacia NORMAL";
    contenedor.appendChild(chip);
  }
  $("sin-palabras").hidden = top.length > 0;
}

// ---------- Enséñale al detective ----------
function ensenar(etiqueta) {
  const texto = $("texto").value.trim();
  const msg = $("msg-ensenar");
  if (texto === "") {
    msg.textContent = "Primero escribe un mensaje arriba.";
    return;
  }
  estado.ejemplosPropios.push({ texto: texto, etiqueta: etiqueta });
  reentrenar();
  msg.textContent = "Listo: lo guardé como " + etiqueta.toUpperCase() +
    ". Ya llevas " + estado.ejemplosPropios.length + " ejemplo(s) tuyo(s). Vuelvo a analizar el mensaje:";
  analizar();
}

// ---------- Panel de datos ----------
function alternarClase(clase) {
  estado.quitadas[clase] = !estado.quitadas[clase];
  refrescarBotonesDatos();
  reentrenar();
  reanalizarSiHayTexto();
}

function refrescarBotonesDatos() {
  $("btn-quitar-spam").textContent = estado.quitadas.spam ? "Devolver el spam" : "Quitar todo el spam";
  $("btn-quitar-normal").textContent = estado.quitadas.normal ? "Devolver lo normal" : "Quitar todo lo normal";
}

function restaurar() {
  estado.quitadas = { spam: false, normal: false };
  estado.sesgado = false;
  estado.ejemplosPropios = [];
  $("chk-sesgado").checked = false;
  $("msg-ensenar").textContent = "";
  refrescarBotonesDatos();
  reentrenar();
  reanalizarSiHayTexto();
}

function reanalizarSiHayTexto() {
  if ($("texto").value.trim() !== "") analizar();
}

// ---------- Examen ----------
function tomarExamen() {
  if (!estado.modelo) {
    reentrenar();
    if (!estado.modelo) return;
  }
  try {
    const r = evaluar(estado.modelo, PRUEBA);
    if (!r || typeof r.exactitud !== "number" || isNaN(r.exactitud)) {
      throw new Error("evaluar debe devolver { exactitud, vp, fp, vn, fn, errores } con exactitud numérica.");
    }
    if (!Array.isArray(r.errores)) {
      throw new Error("evaluar debe devolver errores como una lista.");
    }
    mostrarExamen(r);
    ocultarError();
  } catch (error) {
    $("examen-resultado").hidden = true;
    mostrarError(error);
  }
}

function mostrarExamen(r) {
  $("examen-resultado").hidden = false;
  $("ex-exactitud").textContent = (Math.round(r.exactitud * 1000) / 10) + "%";
  $("ex-detalle").textContent = " (" + (r.vp + r.vn) + " aciertos de " + (r.total !== undefined ? r.total : PRUEBA.length) + ")";
  $("c-vp").textContent = r.vp;
  $("c-fn").textContent = r.fn;
  $("c-fp").textContent = r.fp;
  $("c-vn").textContent = r.vn;

  const lista = $("lista-errores");
  lista.textContent = "";
  for (const e of r.errores) {
    const li = document.createElement("li");
    li.textContent = e.texto;
    const nota = document.createElement("span");
    nota.className = "etiqueta-error";
    const pct = typeof e.probSpam === "number" ? " (prob. spam: " + Math.round(e.probSpam * 100) + "%)" : "";
    nota.textContent = "Era " + e.esperada + ", dijo " + e.predicha + pct;
    li.appendChild(nota);
    lista.appendChild(li);
  }
  $("sin-errores").hidden = r.errores.length > 0;
}

// ---------- Comparar: reglas a mano vs modelo aprendido ----------
function porcentaje(x) {
  return (Math.round(x * 1000) / 10) + "%";
}

function reglasDisponibles() {
  return typeof puntuarPorReglas === "function" && typeof evaluarReglas === "function";
}

// Convierte un error del modelo en una frase amable para el panel de comparar
function avisoDeModelo(error) {
  if (error && error.esPendiente) {
    return "El modelo aprendido aún no está listo. " + error.message + " (las reglas sí funcionan).";
  }
  return "El modelo aprendido tiene un problema: " + ((error && error.message) ? error.message : String(error));
}

// El modelo no se pudo entrenar (casi siempre: falta un TODO). Es un aviso, no un fallo.
function errorSinModelo() {
  const error = new Error("Completa los TODO de modelo.js (mira el cuadro amarillo de arriba) y recarga la página.");
  error.esPendiente = true;
  return error;
}

function ponerInsignia(id, etiqueta) {
  const el = $(id);
  el.textContent = etiqueta === "spam" ? "SPAM" : "NORMAL";
  el.className = "insignia " + etiqueta;
}

function quitarInsignia(id) {
  $(id).textContent = "-";
  $(id).className = "insignia";
}

// Pregunta al modelo aprendido por un texto. Devuelve { res } o { error }.
function preguntarAlModelo(texto) {
  if (!estado.modelo) {
    return { error: errorSinModelo() };
  }
  try {
    const res = clasificar(texto, estado.modelo);
    validarRespuesta(res);
    return { res: res };
  } catch (error) {
    return { error: error };
  }
}

function compararTexto(texto) {
  const hayTexto = texto !== "";
  $("cmp-texto").hidden = !hayTexto;
  $("cmp-texto-vacio").hidden = hayTexto;
  if (!hayTexto) return;

  // Lado de las reglas
  if (!reglasDisponibles()) {
    quitarInsignia("cmp-t-reglas-veredicto");
    $("cmp-t-reglas-puntaje").textContent = "No se pudo cargar reglas.js.";
    $("cmp-t-reglas-chips").textContent = "";
  } else {
    const r = puntuarPorReglas(texto);
    ponerInsignia("cmp-t-reglas-veredicto", r.etiqueta);
    $("cmp-t-reglas-puntaje").textContent = "Puntaje: " + r.puntaje +
      " (spam si llega a " + UMBRAL_REGLAS + " o más)" +
      (r.coincidencias.length === 0 ? ". Ninguna regla se activó." : "");
    const chips = $("cmp-t-reglas-chips");
    chips.textContent = "";
    const orden = r.coincidencias.slice().sort(function (a, b) { return Math.abs(b.puntos) - Math.abs(a.puntos); });
    for (const c of orden) {
      const chip = document.createElement("span");
      chip.className = "chip " + (c.puntos > 0 ? "chip-spam" : "chip-normal");
      chip.textContent = c.palabra + " " + (c.puntos > 0 ? "+" : "") + c.puntos;
      chips.appendChild(chip);
    }
  }

  // Lado del modelo aprendido
  const aviso = $("cmp-t-modelo-aviso");
  const m = preguntarAlModelo(texto);
  if (m.res) {
    aviso.hidden = true;
    ponerInsignia("cmp-t-modelo-veredicto", m.res.etiqueta);
    $("cmp-t-modelo-detalle").textContent = "Probabilidad de spam: " + porcentaje(m.res.probSpam);
  } else {
    quitarInsignia("cmp-t-modelo-veredicto");
    $("cmp-t-modelo-detalle").textContent = "";
    aviso.hidden = false;
    aviso.textContent = avisoDeModelo(m.error);
  }
}

function compararExamen() {
  if (!reglasDisponibles()) {
    mostrarError(new Error("No se pudo cargar reglas.js (falta puntuarPorReglas o evaluarReglas)."));
    return;
  }
  $("cmp-examen").hidden = false;

  // Reglas: siempre disponibles
  const rr = evaluarReglas(PRUEBA);
  $("cmp-reglas-exactitud").textContent = porcentaje(rr.exactitud);
  $("cmp-reglas-detalle").textContent = (rr.vp + rr.vn) + " aciertos de " + rr.total +
    " · spam atrapado " + rr.vp + ", spam colado " + rr.fn +
    ", normal bloqueado " + rr.fp + ", normal bien " + rr.vn;

  // Modelo aprendido: puede no estar listo
  if (!estado.modelo) reentrenar();
  const aviso = $("cmp-modelo-aviso");
  const filas = [];
  let error = null;
  let vp = 0, fp = 0, vn = 0, fn = 0;
  if (!estado.modelo) {
    error = errorSinModelo();
  } else {
    for (const ej of PRUEBA) {
      const m = preguntarAlModelo(ej.texto);
      if (!m.res) { error = m.error; break; }
      filas.push({ ejemplo: ej, modelo: m.res.etiqueta, reglas: puntuarPorReglas(ej.texto).etiqueta });
      if (ej.etiqueta === "spam" && m.res.etiqueta === "spam") vp += 1;
      else if (ej.etiqueta === "normal" && m.res.etiqueta === "spam") fp += 1;
      else if (ej.etiqueta === "normal") vn += 1;
      else fn += 1;
    }
  }

  const lista = $("lista-desacuerdos");
  lista.textContent = "";
  const sin = $("sin-desacuerdos");

  if (error) {
    $("cmp-modelo-exactitud").textContent = "-";
    $("cmp-modelo-detalle").textContent = "";
    aviso.hidden = false;
    aviso.textContent = avisoDeModelo(error);
    sin.hidden = false;
    sin.textContent = "Sin el modelo aprendido no hay con quién comparar. Mientras tanto, las reglas se equivocaron en " +
      rr.errores.length + " de " + rr.total + " mensajes.";
    return;
  }

  aviso.hidden = true;
  const total = PRUEBA.length;
  $("cmp-modelo-exactitud").textContent = porcentaje(total === 0 ? 0 : (vp + vn) / total);
  $("cmp-modelo-detalle").textContent = (vp + vn) + " aciertos de " + total +
    " · spam atrapado " + vp + ", spam colado " + fn +
    ", normal bloqueado " + fp + ", normal bien " + vn;

  let desacuerdos = 0;
  for (const fila of filas) {
    if (fila.reglas === fila.modelo) continue;
    desacuerdos += 1;
    const li = document.createElement("li");
    li.textContent = fila.ejemplo.texto;
    const nota = document.createElement("span");
    nota.className = "desacuerdo-quien";
    const quien = fila.modelo === fila.ejemplo.etiqueta ? "acertó el modelo aprendido" : "acertaron las reglas";
    nota.textContent = "Era " + fila.ejemplo.etiqueta + " · reglas: " + fila.reglas +
      " · aprendido: " + fila.modelo + " → " + quien;
    li.appendChild(nota);
    lista.appendChild(li);
  }
  sin.hidden = desacuerdos > 0;
  if (desacuerdos === 0) sin.textContent = "Los dos filtros opinan igual en todos los mensajes del examen.";
}

// ---------- Autocomprobación (las pruebas viven en pruebas.js) ----------
function autocomprobarEnPagina() {
  const contenedor = $("autocomp-resultado");
  contenedor.hidden = false;
  const lista = $("autocomp-lista");
  lista.textContent = "";

  if (typeof ejecutarAutocomprobacion !== "function") {
    $("autocomp-resumen").textContent = "No se pudo cargar pruebas.js.";
    $("autocomp-version").textContent = "Revisa que exista el archivo pruebas.js y la línea <script src=\"pruebas.js\"> en index.html.";
    return;
  }

  let informe;
  try {
    informe = ejecutarAutocomprobacion();
  } catch (error) {
    $("autocomp-resumen").textContent = "La autocomprobación se detuvo: " + ((error && error.message) ? error.message : String(error));
    $("autocomp-version").textContent = "Abre la consola (F12) para ver más detalles.";
    return;
  }

  $("autocomp-resumen").textContent = resumenAutocomprobacion(informe.resumen);
  const s = informe.resumen;
  $("autocomp-version").textContent = "Versión del taller detectada: " + informe.version +
    " · " + s.ok + " ✅ · " + s.fallo + " ❌ · " + s.pendiente + " ⏳ · " + s.omitido + " ⚪";

  for (const r of informe.resultados) {
    const li = document.createElement("li");
    li.className = "ac-" + r.estado;

    const estado = document.createElement("span");
    estado.className = "ac-estado";
    estado.textContent = AUTOCOMP_ICONO[r.estado] + " " + AUTOCOMP_PALABRA[r.estado];
    li.appendChild(estado);

    const parte = document.createElement("span");
    parte.className = "ac-parte";
    parte.textContent = r.parte;
    li.appendChild(parte);

    li.appendChild(document.createTextNode(r.nombre));

    if (r.estado !== "ok") {
      const detalle = document.createElement("span");
      detalle.className = "ac-detalle";
      detalle.textContent = r.detalle;
      li.appendChild(detalle);
      if (r.pista) {
        const pista = document.createElement("span");
        pista.className = "ac-pista";
        pista.textContent = "Pista: " + r.pista;
        li.appendChild(pista);
      }
    }
    lista.appendChild(li);
  }
}

// ---------- Ejemplos rápidos ----------
const EJEMPLOS_RAPIDOS = [
  "Ganaste un premio gratis, haz clic en el enlace",
  "Hola, ¿vamos a estudiar mañana en la biblioteca?",
  "Tu banco te regala dinero gratis, confirma tu clave"
];

function crearEjemplosRapidos() {
  const contenedor = $("ejemplos-rapidos");
  for (const texto of EJEMPLOS_RAPIDOS) {
    const b = document.createElement("button");
    b.className = "boton mini";
    b.textContent = texto.length > 28 ? texto.slice(0, 28) + "..." : texto;
    b.title = texto;
    b.addEventListener("click", function () {
      $("texto").value = texto;
      analizar();
    });
    contenedor.appendChild(b);
  }
}

// ---------- Arranque ----------
function iniciar() {
  // Si modelo.js tiene un error de sintaxis, sus funciones no existen
  if (typeof entrenar !== "function" || typeof clasificar !== "function" || typeof evaluar !== "function") {
    mostrarError(new Error("No se pudo cargar modelo.js (falta entrenar, clasificar o evaluar)."));
    return;
  }
  crearEjemplosRapidos();
  $("btn-analizar").addEventListener("click", analizar);
  $("btn-ensenar-spam").addEventListener("click", function () { ensenar("spam"); });
  $("btn-ensenar-normal").addEventListener("click", function () { ensenar("normal"); });
  $("btn-quitar-spam").addEventListener("click", function () { alternarClase("spam"); });
  $("btn-quitar-normal").addEventListener("click", function () { alternarClase("normal"); });
  $("btn-restaurar").addEventListener("click", restaurar);
  $("chk-sesgado").addEventListener("change", function (e) {
    estado.sesgado = e.target.checked;
    reentrenar();
    reanalizarSiHayTexto();
  });
  $("btn-examen").addEventListener("click", tomarExamen);
  $("btn-comparar").addEventListener("click", compararExamen);
  $("btn-autocomprobar").addEventListener("click", autocomprobarEnPagina);
  $("texto").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) analizar();
  });

  reentrenar();
}

window.addEventListener("error", function (e) {
  // Error de sintaxis o inesperado en modelo.js: aviso amable en la página
  mostrarError(new Error(e.message));
});

iniciar();
