// =====================================================================
// TALLER: Detective de mensajes - Filtro anti-spam con Naive Bayes
// VERSIÓN CORTA (120 min). Solo faltaba UN TODO: clasificar (ya resuelto).
// =====================================================================

// Para la autocomprobación: esta es la versión corta (solo falta clasificar).
const VERSION_TALLER = "corta";

// ---------------------------------------------------------------------
// Utilidades (ya listas)
// ---------------------------------------------------------------------

function nuevoContador() {
  return Object.create(null);
}

// Pasa a minúsculas, quita tildes y signos: "¡Gratis, YA!" -> "gratis ya"
function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // quita las tildes
    .replace(/[^a-z0-9\s]/g, " ")      // cambia los signos por espacios
    .replace(/\s+/g, " ")
    .trim();
}

// Parte el texto en palabras. Ignora las de 1 letra.
function tokenizar(texto) {
  const limpio = normalizar(texto);
  if (limpio === "") return [];
  return limpio.split(" ").filter(function (p) { return p.length >= 2; });
}

// Avisa a la página que un TODO aún no está hecho (muestra un mensaje amable)
function pendiente(numero, queFalta) {
  const error = new Error("TODO " + numero + " sin completar: " + queFalta);
  error.esPendiente = true;
  throw error;
}

// ---------------------------------------------------------------------
// ENTRENAR (ya listo): cuenta cuántas veces aparece cada palabra en cada clase
// ---------------------------------------------------------------------
function entrenar(datos) {
  const modelo = {
    conteos: { spam: nuevoContador(), normal: nuevoContador() },  // conteos[clase][palabra]
    totalPalabras: { spam: 0, normal: 0 },                        // palabras totales por clase
    documentos: { spam: 0, normal: 0 },                           // mensajes por clase
    vocabulario: nuevoContador(),                                 // todas las palabras vistas
    tamVocabulario: 0
  };

  for (const ejemplo of datos) {
    const clase = ejemplo.etiqueta;
    if (clase !== "spam" && clase !== "normal") continue;
    modelo.documentos[clase] += 1;
    for (const palabra of tokenizar(ejemplo.texto)) {
      modelo.conteos[clase][palabra] = (modelo.conteos[clase][palabra] || 0) + 1;
      modelo.totalPalabras[clase] += 1;
      modelo.vocabulario[palabra] = true;
    }
  }
  modelo.tamVocabulario = Object.keys(modelo.vocabulario).length;
  return modelo;
}

// ---------------------------------------------------------------------
// Probabilidad previa de una clase (ya lista): ¿cuánto spam llega "en general"?
// ---------------------------------------------------------------------
function logPrior(clase, modelo) {
  const total = modelo.documentos.spam + modelo.documentos.normal;
  return Math.log((modelo.documentos[clase] + 1) / (total + 2));
}

// ---------------------------------------------------------------------
// Log de P(palabra | clase) con suavizado de Laplace (ya listo)
//
//        veces que la palabra apareció en la clase + 1
//   P = ------------------------------------------------------
//        total de palabras de la clase + tamaño del vocabulario
// ---------------------------------------------------------------------
function logProbPalabra(palabra, clase, modelo) {
  const veces = modelo.conteos[clase][palabra] || 0;
  const total = modelo.totalPalabras[clase];
  return Math.log((veces + 1) / (total + modelo.tamVocabulario));
}

// Une las apariciones repetidas de una palabra y ordena por importancia (ya listo)
function agruparAportes(lista) {
  const suma = nuevoContador();
  for (const item of lista) {
    suma[item.palabra] = (suma[item.palabra] || 0) + item.aporte;
  }
  return Object.keys(suma)
    .map(function (p) { return { palabra: p, aporte: suma[p] }; })
    .sort(function (a, b) { return Math.abs(b.aporte) - Math.abs(a.aporte); });
}

// ---------------------------------------------------------------------
// CLASIFICAR (el único TODO, ya resuelto): puntuar un mensaje
// Devuelve { etiqueta, probSpam, aportes }
// ---------------------------------------------------------------------
function clasificar(texto, modelo, umbral) {
  if (umbral === undefined) umbral = 0.5;   // 0.5 = "más probable spam que normal"

  let logSpam = logPrior("spam", modelo);
  let logNormal = logPrior("normal", modelo);
  const lista = [];

  // Paso 1: cada palabra del mensaje es una pista
  for (const palabra of tokenizar(texto)) {
    // Si la palabra nunca apareció en el entrenamiento, la ignoramos
    if (!modelo.vocabulario[palabra]) continue;

    // Qué tan probable es esta palabra en cada clase (ya en logaritmos)
    const lpSpam = logProbPalabra(palabra, "spam", modelo);
    const lpNormal = logProbPalabra(palabra, "normal", modelo);

    // Cada palabra suma su pista al puntaje de cada clase
    logSpam += lpSpam;
    logNormal += lpNormal;

    // Guardamos cuánto empuja esta palabra: > 0 hacia spam, < 0 hacia normal
    lista.push({ palabra: palabra, aporte: lpSpam - lpNormal });
  }

  // Paso 2: de dos puntajes en logaritmo a una probabilidad entre 0 y 1
  const probSpam = 1 / (1 + Math.exp(logNormal - logSpam));

  return {
    etiqueta: probSpam > umbral ? "spam" : "normal",
    probSpam: probSpam,
    aportes: agruparAportes(lista)
  };
}

// ---------------------------------------------------------------------
// EVALUAR (ya listo): el examen del modelo. "spam" es la clase positiva.
//   vp = spam atrapado        fp = mensaje bueno enviado al spam
//   vn = mensaje bueno bien   fn = spam que se coló
// ---------------------------------------------------------------------
function evaluar(modelo, prueba) {
  let vp = 0, fp = 0, vn = 0, fn = 0;
  const errores = [];

  for (const ejemplo of prueba) {
    const res = clasificar(ejemplo.texto, modelo);
    const real = ejemplo.etiqueta;
    if (real === "spam" && res.etiqueta === "spam") vp += 1;
    else if (real === "normal" && res.etiqueta === "spam") fp += 1;
    else if (real === "normal" && res.etiqueta === "normal") vn += 1;
    else fn += 1;

    if (res.etiqueta !== real) {
      errores.push({ texto: ejemplo.texto, esperada: real, predicha: res.etiqueta, probSpam: res.probSpam });
    }
  }

  const total = prueba.length;
  return {
    exactitud: total === 0 ? 0 : (vp + vn) / total,
    vp: vp, fp: fp, vn: vn, fn: fn,
    total: total,
    errores: errores
  };
}