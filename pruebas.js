// =====================================================================
// pruebas.js - AUTOCOMPROBACIÓN. NO necesitas editar este archivo.
//
// Es un "profesor automático": ejecuta pruebas pequeñas sobre TU modelo.js
// y te dice, una línea por prueba, qué parte funciona y qué parte no.
//
// Usa datos diminutos escritos aquí mismo (no usa datos.js), así que no
// puedes romper las pruebas editando los datos.
//
// Dos formas de usarlo:
//   1) En la página: botón "Ejecutar autocomprobación".
//   2) En la consola (F12):  autocomprobar()
//
// Estados de cada línea:
//   ✅ Bien        la parte funciona
//   ❌ Falla       hay un error: lee la pista
//   ⏳ Pendiente   esa parte todavía tiene su línea "pendiente(...)" (no es un fallo)
//   ⚪ Omitida     no se pudo ejecutar (por ejemplo, una prueba anterior se colgó)
// =====================================================================

// ---------------------------------------------------------------------
// Datos de juguete (los mismos 3 mensajes del módulo 05 y de la guía corta)
// ---------------------------------------------------------------------
const DATOS_JUGUETE = [
  { texto: "gana dinero gratis", etiqueta: "spam" },
  { texto: "gana premio ya", etiqueta: "spam" },
  { texto: "hola clase ya", etiqueta: "normal" }
];

// Examen diminuto con las respuestas del "detective de mentira" de la prueba de evaluar
const EXAMEN_JUGUETE = [
  { texto: "premio gratis", etiqueta: "spam", dice: "spam", prob: 0.95 },
  { texto: "gana dinero", etiqueta: "spam", dice: "spam", prob: 0.90 },
  { texto: "hola clase", etiqueta: "normal", dice: "normal", prob: 0.10 },
  { texto: "clase gratis", etiqueta: "normal", dice: "spam", prob: 0.70 },
  { texto: "premio escondido", etiqueta: "spam", dice: "normal", prob: 0.30 }
];

// El modelo que debería producir entrenar(DATOS_JUGUETE), escrito a mano.
// Así probamos logProbPalabra y clasificar SIN depender de tu entrenar.
function crearModeloJuguete() {
  function contador(objeto) {
    const c = Object.create(null);
    for (const llave in objeto) c[llave] = objeto[llave];
    return c;
  }
  return {
    conteos: {
      spam: contador({ gana: 2, dinero: 1, gratis: 1, premio: 1, ya: 1 }),
      normal: contador({ hola: 1, clase: 1, ya: 1 })
    },
    totalPalabras: { spam: 6, normal: 3 },
    documentos: { spam: 2, normal: 1 },
    vocabulario: contador({ gana: true, dinero: true, gratis: true, premio: true, ya: true, hola: true, clase: true }),
    tamVocabulario: 7
  };
}

// ---------------------------------------------------------------------
// Ayudas para escribir las pruebas
// ---------------------------------------------------------------------
function casi(a, b, tolerancia) {
  return typeof a === "number" && isFinite(a) && Math.abs(a - b) <= (tolerancia === undefined ? 1e-6 : tolerancia);
}

function mostrar(valor) {
  if (typeof valor === "number") return String(Math.round(valor * 10000) / 10000);
  if (valor === undefined) return "undefined";
  try { return JSON.stringify(valor); } catch (e) { return String(valor); }
}

// Una prueba que no se cumple lanza esto (se muestra como ❌ con su pista)
function fallar(mensaje, pista) {
  const error = new Error(mensaje);
  error.esFallo = true;
  error.pista = pista || "";
  throw error;
}

function exigir(condicion, mensaje, pista) {
  if (!condicion) fallar(mensaje, pista);
}

function exigirFuncion(nombre) {
  if (typeof globalThis[nombre] !== "function") {
    fallar("No encuentro la función " + nombre + ".",
      "Revisa que modelo.js siga teniendo function " + nombre + "(...) y que no tenga errores de sintaxis (F12 > Consola).");
  }
}

function exigirObjeto(valor, nombre, pista) {
  exigir(valor !== null && typeof valor === "object",
    nombre + " devolvió " + mostrar(valor) + " y debería devolver un objeto.",
    pista);
}

// Cuando logProbPalabra falla, intenta adivinar el error más típico
function diagnosticoLogProb(obtenido, veces, total, vocab) {
  const base = "Debe ser Math.log((veces + 1) / (total + tamVocabulario)).";
  if (typeof obtenido !== "number") return "No devolvió un número: ¿falta el return? " + base;
  if (!isFinite(obtenido)) return "Salió " + obtenido + ": ¿falta el + 1 del suavizado o algún dato es undefined? " + base;
  if (casi(obtenido, (veces + 1) / (total + vocab))) return "Olvidaste el logaritmo: envuelve todo en Math.log(...). " + base;
  if (casi(obtenido, Math.log(veces / (total + vocab)))) return "Falta el + 1 del suavizado (en el numerador). " + base;
  if (casi(obtenido, Math.log((veces + 1) / total))) return "Falta sumar modelo.tamVocabulario al denominador. " + base;
  if (casi(obtenido, Math.log10((veces + 1) / (total + vocab)))) return "Usaste Math.log10: usa Math.log (logaritmo natural). " + base;
  return base;
}

// Reemplaza por un momento la función global clasificar por un "detective de mentira"
// (así probamos evaluar sin depender de que tu clasificar esté bien).
function conDetectiveFalso(fn) {
  const original = globalThis.clasificar;
  globalThis.clasificar = function (texto) {
    for (const e of EXAMEN_JUGUETE) {
      if (e.texto === texto) return { etiqueta: e.dice, probSpam: e.prob, aportes: [] };
    }
    return { etiqueta: "normal", probSpam: 0, aportes: [] };
  };
  try {
    return fn();
  } finally {
    globalThis.clasificar = original;
  }
}

function esVersionCorta() {
  return typeof VERSION_TALLER !== "undefined" && VERSION_TALLER === "corta";
}

// ---------------------------------------------------------------------
// Las pruebas. "todo" dice a qué parte pertenece (0 = utilidades / integración)
// ---------------------------------------------------------------------
function definirPruebas() {
  const pruebas = [];
  function probar(todo, nombre, ejecutar) {
    pruebas.push({ todo: todo, nombre: nombre, ejecutar: ejecutar });
  }

  // ----- Utilidades (ya vienen hechas) -----
  probar(0, "normalizar limpia mayúsculas, tildes y signos", function () {
    exigirFuncion("normalizar");
    const r = normalizar("¡GRATIS! Gana $$$ YA");
    exigir(r === "gratis gana ya",
      "normalizar(\"¡GRATIS! Gana $$$ YA\") devolvió " + mostrar(r) + " y debería devolver \"gratis gana ya\".",
      "Esta función ya venía hecha. Si la cambiaste, deshaz tus cambios (Ctrl+Z).");
  });

  probar(0, "tokenizar parte en palabras y descarta las de una letra", function () {
    exigirFuncion("tokenizar");
    const a = tokenizar("¡Gana dinero YA! 50% gratis");
    exigir(mostrar(a) === mostrar(["gana", "dinero", "ya", "50", "gratis"]),
      "tokenizar(\"¡Gana dinero YA! 50% gratis\") devolvió " + mostrar(a) + ".",
      "Debía devolver [\"gana\",\"dinero\",\"ya\",\"50\",\"gratis\"]. Esta función ya venía hecha: deshaz tus cambios.");
    const b = tokenizar("Mamá, ¿vienes a la fiesta?");
    exigir(mostrar(b) === mostrar(["mama", "vienes", "la", "fiesta"]),
      "tokenizar(\"Mamá, ¿vienes a la fiesta?\") devolvió " + mostrar(b) + ".",
      "Debía devolver [\"mama\",\"vienes\",\"la\",\"fiesta\"] (la \"a\" se descarta por tener una letra).");
    const c = tokenizar("");
    exigir(mostrar(c) === "[]", "tokenizar(\"\") devolvió " + mostrar(c) + " y debería devolver [].", "");
  });

  // ----- TODO 1: entrenar -----
  probar(1, "entrenar devuelve un modelo con sus cuatro cuentas", function () {
    exigirFuncion("entrenar");
    const m = entrenar(DATOS_JUGUETE);
    exigirObjeto(m, "entrenar(datos)", "¿Falta la línea return modelo; al final de entrenar? (y borrar la línea pendiente)");
    for (const campo of ["conteos", "totalPalabras", "documentos", "vocabulario"]) {
      exigir(m[campo] !== undefined && m[campo] !== null,
        "Al modelo le falta el campo " + campo + ".",
        "No borres la declaración inicial de const modelo = { ... }: ya trae ese campo.");
    }
  });

  probar(1, "entrenar cuenta los mensajes y las palabras de cada clase", function () {
    const m = entrenar(DATOS_JUGUETE);
    exigirObjeto(m, "entrenar(datos)", "¿Falta return modelo;?");
    exigir(m.documentos.spam === 2 && m.documentos.normal === 1,
      "documentos salió " + mostrar(m.documentos) + " y debería ser {\"spam\":2,\"normal\":1}.",
      "Por cada ejemplo del bucle suma 1: modelo.documentos[clase] += 1; (clase es ejemplo.etiqueta).");
    exigir(m.totalPalabras.spam === 6 && m.totalPalabras.normal === 3,
      "totalPalabras salió " + mostrar(m.totalPalabras) + " y debería ser {\"spam\":6,\"normal\":3}.",
      "Por cada PALABRA (no por cada mensaje) suma 1: modelo.totalPalabras[clase] += 1; Va dentro del bucle de palabras.");
  });

  probar(1, "entrenar cuenta cuántas veces aparece cada palabra en su clase", function () {
    const m = entrenar(DATOS_JUGUETE);
    exigirObjeto(m, "entrenar(datos)", "¿Falta return modelo;?");
    const esperado = [["spam", "gana", 2], ["spam", "dinero", 1], ["spam", "ya", 1], ["normal", "ya", 1], ["normal", "hola", 1], ["normal", "gana", 0]];
    for (const [clase, palabra, n] of esperado) {
      const obtenido = m.conteos[clase][palabra] || 0;
      exigir(obtenido === n,
        "conteos." + clase + "." + palabra + " salió " + mostrar(m.conteos[clase][palabra]) + " y debería ser " + n + ".",
        "Cuenta así: conteos[palabra] = (conteos[palabra] || 0) + 1; El \"|| 0\" cubre la primera vez (si no, undefined + 1 da NaN). Y usa modelo.conteos[clase] con corchetes.");
    }
  });

  probar(1, "entrenar arma el vocabulario (palabras distintas)", function () {
    const m = entrenar(DATOS_JUGUETE);
    exigirObjeto(m, "entrenar(datos)", "¿Falta return modelo;?");
    exigir(m.vocabulario.hola === true && m.vocabulario.gana === true && m.vocabulario.premio === true,
      "modelo.vocabulario no marca todas las palabras vistas.",
      "Dentro del bucle de palabras escribe: modelo.vocabulario[palabra] = true;");
    exigir(m.tamVocabulario === 7,
      "tamVocabulario salió " + mostrar(m.tamVocabulario) + " y debería ser 7.",
      "Después de los bucles escribe: modelo.tamVocabulario = Object.keys(modelo.vocabulario).length;");
  });

  // ----- TODO 2: logProbPalabra -----
  probar(2, "logProbPalabra de una palabra vista: gana en spam y en normal", function () {
    exigirFuncion("logProbPalabra");
    const m = crearModeloJuguete();
    const a = logProbPalabra("gana", "spam", m);
    exigir(casi(a, Math.log(3 / 13)),
      "logProbPalabra(\"gana\", \"spam\") salió " + mostrar(a) + " y debería ser " + mostrar(Math.log(3 / 13)) + " (el log de 3/13).",
      diagnosticoLogProb(a, 2, 6, 7));
    const b = logProbPalabra("gana", "normal", m);
    exigir(casi(b, Math.log(1 / 10)),
      "logProbPalabra(\"gana\", \"normal\") salió " + mostrar(b) + " y debería ser " + mostrar(Math.log(1 / 10)) + " (el log de 1/10).",
      diagnosticoLogProb(b, 0, 3, 7));
  });

  probar(2, "logProbPalabra de una palabra que la clase nunca vio (sin -Infinity)", function () {
    exigirFuncion("logProbPalabra");
    const m = crearModeloJuguete();
    const a = logProbPalabra("hola", "spam", m);
    exigir(casi(a, Math.log(1 / 13)),
      "logProbPalabra(\"hola\", \"spam\") salió " + mostrar(a) + " y debería ser " + mostrar(Math.log(1 / 13)) + " (el log de 1/13).",
      diagnosticoLogProb(a, 0, 6, 7));
    const b = logProbPalabra("ya", "normal", m);
    exigir(casi(b, Math.log(2 / 10)),
      "logProbPalabra(\"ya\", \"normal\") salió " + mostrar(b) + " y debería ser " + mostrar(Math.log(2 / 10)) + " (el log de 2/10).",
      diagnosticoLogProb(b, 1, 3, 7));
  });

  // ----- TODO 3: clasificar -----
  probar(3, "clasificar devuelve { etiqueta, probSpam, aportes }", function () {
    exigirFuncion("clasificar");
    const r = clasificar("gana gratis", crearModeloJuguete());
    exigirObjeto(r, "clasificar(...)", "Termina con return { etiqueta: ..., probSpam: ..., aportes: agruparAportes(lista) };");
    exigir(r.etiqueta === "spam" || r.etiqueta === "normal",
      "etiqueta salió " + mostrar(r.etiqueta) + " y debería ser \"spam\" o \"normal\".",
      "Usa: etiqueta: probSpam > umbral ? \"spam\" : \"normal\"");
    exigir(typeof r.probSpam === "number" && isFinite(r.probSpam),
      "probSpam salió " + mostrar(r.probSpam) + " y debería ser un número.",
      "Si sale NaN: suma logaritmos (no multipliques) y calcula 1 / (1 + Math.exp(logNormal - logSpam)).");
    exigir(Array.isArray(r.aportes),
      "aportes salió " + mostrar(r.aportes) + " y debería ser una lista.",
      "Devuelve aportes: agruparAportes(lista) (esa función ya viene hecha).");
  });

  probar(3, "un mensaje claramente spam (gana gratis) sale SPAM con ≈ 84 %", function () {
    exigirFuncion("clasificar");
    const r = clasificar("gana gratis", crearModeloJuguete());
    exigirObjeto(r, "clasificar(...)", "Revisa el return final.");
    const esperado = 0.842;
    let pista = "Revisa que sumes lpSpam a logSpam y lpNormal a logNormal, y que uses 1 / (1 + Math.exp(logNormal - logSpam)). Si las pruebas de logProbPalabra también fallan, corrige primero el TODO 2.";
    if (casi(r.probSpam, 0.6, 0.01)) pista = "Salió justo la probabilidad previa (0,6): no se está sumando nada dentro del bucle. ¿Sumaste lpSpam y lpNormal?";
    else if (casi(r.probSpam, 1 - esperado, 0.01)) pista = "Salió el complemento (1 - 0,842): probablemente invertiste la resta. Es Math.exp(logNormal - logSpam).";
    else if (typeof r.probSpam === "number" && (isNaN(r.probSpam) || r.probSpam === 0 || r.probSpam === 1)) pista = "Salió un valor extremo o NaN: ¿multiplicaste en vez de sumar logaritmos?";
    exigir(casi(r.probSpam, esperado, 0.005),
      "clasificar(\"gana gratis\") dio probSpam = " + mostrar(r.probSpam) + " y debería dar ≈ 0.842 (como el cálculo a mano del módulo 05).",
      pista);
    exigir(r.etiqueta === "spam", "La etiqueta salió " + mostrar(r.etiqueta) + " y debería ser \"spam\".", "Con probSpam 0.842 y umbral 0.5, la etiqueta es \"spam\".");
  });

  probar(3, "un mensaje claramente normal (hola clase) sale NORMAL con ≈ 18 %", function () {
    exigirFuncion("clasificar");
    const r = clasificar("hola clase", crearModeloJuguete());
    exigirObjeto(r, "clasificar(...)", "Revisa el return final.");
    exigir(casi(r.probSpam, 0.182, 0.005),
      "clasificar(\"hola clase\") dio probSpam = " + mostrar(r.probSpam) + " y debería dar ≈ 0.182 (tu Actividad del módulo 05).",
      "Si te sale otro número, compara tu bucle con los pasos del comentario del TODO 3.");
    exigir(r.etiqueta === "normal", "La etiqueta salió " + mostrar(r.etiqueta) + " y debería ser \"normal\".", "probSpam 0.182 es menor que el umbral 0.5.");
  });

  probar(3, "las palabras desconocidas se ignoran", function () {
    exigirFuncion("clasificar");
    const m = crearModeloJuguete();
    const a = clasificar("gana", m);
    const b = clasificar("gana xyzzy qwerty", m);
    exigirObjeto(a, "clasificar(...)", "Revisa el return final.");
    exigirObjeto(b, "clasificar(...)", "Revisa el return final.");
    exigir(casi(a.probSpam, b.probSpam, 1e-9),
      "\"gana\" dio " + mostrar(a.probSpam) + " pero \"gana xyzzy qwerty\" dio " + mostrar(b.probSpam) + ": deberían ser iguales.",
      "Dentro del bucle: if (!modelo.vocabulario[palabra]) continue; (las palabras que nunca vio no aportan nada).");
  });

  probar(3, "los aportes se suman por palabra y salen ordenados por peso", function () {
    exigirFuncion("clasificar");
    const m = crearModeloJuguete();
    const r = clasificar("gana gratis ya", m);
    exigirObjeto(r, "clasificar(...)", "Revisa el return final.");
    exigir(Array.isArray(r.aportes) && r.aportes.length === 3,
      "aportes tiene " + (Array.isArray(r.aportes) ? r.aportes.length : "?") + " elementos y debería tener 3 (gana, gratis, ya).",
      "En el bucle, agrega a lista: lista.push({ palabra: palabra, aporte: lpSpam - lpNormal });");
    const primero = r.aportes[0];
    exigir(primero && primero.palabra === "gana" && casi(primero.aporte, Math.log(3 / 13) - Math.log(1 / 10), 1e-6),
      "El primer aporte es " + mostrar(primero) + " y debería ser {\"palabra\":\"gana\",\"aporte\":0.8363}.",
      "El aporte es lpSpam - lpNormal (positivo empuja a spam). agruparAportes ya ordena de mayor a menor peso.");
    for (let i = 1; i < r.aportes.length; i++) {
      exigir(Math.abs(r.aportes[i - 1].aporte) >= Math.abs(r.aportes[i].aporte),
        "Los aportes no están ordenados de mayor a menor peso.",
        "Devuelve aportes: agruparAportes(lista), no la lista sin agrupar.");
    }
    const ya = r.aportes.find(function (a) { return a.palabra === "ya"; });
    exigir(ya && ya.aporte < 0, "El aporte de \"ya\" debería ser negativo (empuja a normal) y salió " + mostrar(ya) + ".", "aporte = lpSpam - lpNormal, en ese orden.");
    const dos = clasificar("gana gana", m);
    exigir(dos.aportes.length === 1 && casi(dos.aportes[0].aporte, 2 * (Math.log(3 / 13) - Math.log(1 / 10)), 1e-6),
      "Con \"gana gana\" los aportes salieron " + mostrar(dos.aportes) + ": la palabra repetida debe aparecer una vez con el aporte sumado (1.6725).",
      "Agrega a lista un elemento por cada aparición de la palabra; agruparAportes los une.");
  });

  probar(3, "el umbral decide la etiqueta (tercer parámetro)", function () {
    exigirFuncion("clasificar");
    const m = crearModeloJuguete();
    const alto = clasificar("gana gratis", m, 0.99);
    const bajo = clasificar("hola clase", m, 0.1);
    exigirObjeto(alto, "clasificar(...)", "Revisa el return final.");
    exigirObjeto(bajo, "clasificar(...)", "Revisa el return final.");
    exigir(alto.etiqueta === "normal",
      "Con umbral 0.99, \"gana gratis\" (84 %) debería salir \"normal\" y salió " + mostrar(alto.etiqueta) + ".",
      "Usa el parámetro: etiqueta: probSpam > umbral ? \"spam\" : \"normal\" (no escribas 0.5 fijo).");
    exigir(bajo.etiqueta === "spam",
      "Con umbral 0.1, \"hola clase\" (18 %) debería salir \"spam\" y salió " + mostrar(bajo.etiqueta) + ".",
      "Usa el parámetro umbral en la comparación.");
  });

  probar(3, "probSpam siempre está entre 0 y 1 (también con textos vacíos, raros o larguísimos)", function () {
    exigirFuncion("clasificar");
    const m = crearModeloJuguete();
    const textos = ["", "gana", "hola", "gana hola", "!!!", "zzz", "gana ".repeat(300), "hola clase ya ".repeat(300)];
    for (const t of textos) {
      const r = clasificar(t, m);
      exigirObjeto(r, "clasificar(...)", "Revisa el return final.");
      const etiquetaTexto = t.length > 20 ? t.slice(0, 20) + "..." : t;
      exigir(typeof r.probSpam === "number" && isFinite(r.probSpam) && r.probSpam >= 0 && r.probSpam <= 1,
        "Con el texto " + mostrar(etiquetaTexto) + " probSpam salió " + mostrar(r.probSpam) + " (debe estar entre 0 y 1).",
        "Si multiplicas probabilidades en vez de sumar logaritmos, los textos largos dan 0 o NaN. Suma logs y usa Math.exp solo al final.");
    }
    const vacio = clasificar("", m);
    exigir(casi(vacio.probSpam, 0.6, 1e-9),
      "Con texto vacío probSpam salió " + mostrar(vacio.probSpam) + " y debería ser 0.6 (solo la probabilidad previa: 3/5).",
      casi(vacio.probSpam, 0.4, 1e-9)
        ? "Salió el complemento (0.4): invertiste la resta. Es 1 / (1 + Math.exp(logNormal - logSpam))."
        : "Empieza con logSpam = logPrior(\"spam\", modelo) y logNormal = logPrior(\"normal\", modelo).");
  });

  // ----- TODO 4: evaluar -----
  probar(4, "evaluar cuenta vp, fp, vn y fn (con un detective de mentira)", function () {
    exigirFuncion("evaluar");
    const r = conDetectiveFalso(function () { return evaluar(crearModeloJuguete(), EXAMEN_JUGUETE); });
    exigirObjeto(r, "evaluar(...)", "Termina con return { exactitud, vp, fp, vn, fn, total, errores };");
    let pista = "Tabla: real spam + predijo spam = vp; real normal + predijo spam = fp; real normal + predijo normal = vn; real spam + predijo normal = fn.";
    if (r.fp === 1 && r.fn === 1 && r.vp === 2 && r.vn === 1) pista = "";
    else if (r.fp === 1 && r.fn === 1) pista = "vp y vn no coinciden. " + pista;
    exigir(r.vp === 2 && r.fp === 1 && r.vn === 1 && r.fn === 1,
      "Salió vp=" + mostrar(r.vp) + " fp=" + mostrar(r.fp) + " vn=" + mostrar(r.vn) + " fn=" + mostrar(r.fn) + " y debería salir vp=2 fp=1 vn=1 fn=1.",
      pista + " Recuerda: positivo = spam (no \"bueno\").");
  });

  probar(4, "evaluar calcula la exactitud, el total y la lista de errores", function () {
    exigirFuncion("evaluar");
    const r = conDetectiveFalso(function () { return evaluar(crearModeloJuguete(), EXAMEN_JUGUETE); });
    exigirObjeto(r, "evaluar(...)", "Termina con return { exactitud, vp, fp, vn, fn, total, errores };");
    exigir(r.total === 5, "total salió " + mostrar(r.total) + " y debería ser 5.", "total = prueba.length");
    exigir(casi(r.exactitud, 0.6, 1e-9),
      "exactitud salió " + mostrar(r.exactitud) + " y debería ser 0.6 (3 aciertos de 5).",
      "exactitud = (vp + vn) / total, un número entre 0 y 1 (no un porcentaje).");
    exigir(Array.isArray(r.errores) && r.errores.length === 2,
      "errores tiene " + (Array.isArray(r.errores) ? r.errores.length : "?") + " elementos y debería tener 2.",
      "Si res.etiqueta !== ejemplo.etiqueta, haz errores.push({ texto, esperada, predicha, probSpam }).");
    const e = r.errores.find(function (x) { return x.texto === "clase gratis"; });
    exigir(e && e.esperada === "normal" && e.predicha === "spam" && casi(e.probSpam, 0.7, 1e-9),
      "El error de \"clase gratis\" salió " + mostrar(e) + " y debería ser {\"texto\":\"clase gratis\",\"esperada\":\"normal\",\"predicha\":\"spam\",\"probSpam\":0.7}.",
      "Cada error lleva: { texto: ejemplo.texto, esperada: ejemplo.etiqueta, predicha: res.etiqueta, probSpam: res.probSpam }.");
  });

  // ----- Todo junto -----
  probar(0, "todo junto: entrenar + clasificar reproducen tu cálculo a mano (84 %)", function () {
    exigirFuncion("entrenar");
    exigirFuncion("clasificar");
    const m = entrenar(DATOS_JUGUETE);
    exigirObjeto(m, "entrenar(datos)", "¿Falta return modelo;?");
    const r = clasificar("gana gratis", m);
    exigirObjeto(r, "clasificar(...)", "Revisa el return final.");
    exigir(casi(r.probSpam, 0.842, 0.005),
      "Con el modelo salido de TU entrenar, \"gana gratis\" dio " + mostrar(r.probSpam) + " y debería dar ≈ 0.842.",
      "Cada pieza pasó sus pruebas por separado, pero juntas no cuadran: revisa que entrenar guarde los campos con los nombres exactos (conteos, totalPalabras, documentos, vocabulario, tamVocabulario).");
  });

  return pruebas;
}

// ---------------------------------------------------------------------
// Etiqueta legible de cada prueba, según la versión del taller
// ---------------------------------------------------------------------
function etiquetaDeParte(todo) {
  const corta = esVersionCorta();
  if (todo === 0) return "Base";
  if (corta) {
    if (todo === 3) return "TODO (único) · clasificar";
    const nombres = { 1: "entrenar", 2: "logProbPalabra", 4: "evaluar" };
    return nombres[todo] + " (ya viene hecho)";
  }
  const nombres = { 1: "entrenar", 2: "logProbPalabra", 3: "clasificar", 4: "evaluar" };
  return "TODO " + todo + " · " + nombres[todo];
}

// ---------------------------------------------------------------------
// El ejecutor. Devuelve { version, resultados, resumen, texto }
// ---------------------------------------------------------------------
function ejecutarAutocomprobacion() {
  const corta = esVersionCorta();
  const resultados = [];
  const resumen = { ok: 0, fallo: 0, pendiente: 0, omitido: 0 };
  const inicio = Date.now();
  const LIMITE_MS = 4000;
  let colgado = false;

  for (const prueba of definirPruebas()) {
    const res = { parte: etiquetaDeParte(prueba.todo), todo: prueba.todo, nombre: prueba.nombre, estado: "ok", detalle: "", pista: "" };

    if (colgado) {
      res.estado = "omitido";
      res.detalle = "Se omitió porque una prueba anterior tardó demasiado.";
      res.pista = "Revisa si hay un bucle que no termina en tu código (por ejemplo, un while sin salida).";
    } else {
      try {
        prueba.ejecutar();
      } catch (error) {
        if (error && error.esPendiente) {
          res.estado = "pendiente";
          res.detalle = error.message;
          res.pista = "No es un error: aún no completas esta parte. Abre modelo.js, completa el TODO y borra su línea \"pendiente(...)\".";
        } else if (error && error.esFallo) {
          res.estado = "fallo";
          res.detalle = error.message;
          res.pista = error.pista;
        } else {
          res.estado = "fallo";
          res.detalle = "Tu código se detuvo con un error: " + ((error && error.message) ? error.message : String(error));
          res.pista = "Abre la consola (F12) para ver en qué línea ocurrió. Suele ser un nombre mal escrito o una variable sin declarar.";
        }
        if (res.estado === "fallo" && corta && prueba.todo !== 3 && prueba.todo !== 0) {
          res.pista += " Esta parte venía hecha en la versión corta: vuelve a copiar soluciones/modelo.corto.js sobre modelo.js (y rehaz el TODO).";
        }
        if (res.estado === "fallo" && prueba.todo === 0 && prueba.nombre.indexOf("todo junto") !== 0) {
          res.pista += " Estas utilidades vienen hechas: si las tocaste, deshaz el cambio.";
        }
      }
      if (Date.now() - inicio > LIMITE_MS) colgado = true;
    }
    resumen[res.estado] += 1;
    resultados.push(res);
  }

  const informe = { version: corta ? "corta" : "larga", resultados: resultados, resumen: resumen, texto: "" };
  informe.texto = textoAutocomprobacion(informe);
  return informe;
}

const AUTOCOMP_ICONO = { ok: "✅", fallo: "❌", pendiente: "⏳", omitido: "⚪" };
const AUTOCOMP_PALABRA = { ok: "Bien", fallo: "Falla", pendiente: "Pendiente", omitido: "Omitida" };

function resumenAutocomprobacion(resumen) {
  if (resumen.fallo > 0) {
    return "Hay " + resumen.fallo + " prueba(s) con ❌. Lee la pista de cada una, corrige y vuelve a ejecutar.";
  }
  if (resumen.pendiente > 0 || resumen.omitido > 0) {
    return "Lo que ya programaste está bien (sin ❌). Te faltan " + (resumen.pendiente + resumen.omitido) + " prueba(s) ⏳: sigue con el siguiente TODO.";
  }
  return "¡Todo en ✅! Tu modelo pasó todas las pruebas.";
}

function textoAutocomprobacion(informe) {
  const lineas = [];
  lineas.push("AUTOCOMPROBACIÓN (versión " + informe.version + ")");
  for (const r of informe.resultados) {
    lineas.push(AUTOCOMP_ICONO[r.estado] + " " + AUTOCOMP_PALABRA[r.estado] + " · " + r.parte + " · " + r.nombre);
    if (r.estado !== "ok") {
      lineas.push("     " + r.detalle);
      if (r.pista) lineas.push("     Pista: " + r.pista);
    }
  }
  const s = informe.resumen;
  lineas.push("Resumen: " + s.ok + " ✅ · " + s.fallo + " ❌ · " + s.pendiente + " ⏳ · " + s.omitido + " ⚪");
  lineas.push(resumenAutocomprobacion(s));
  return lineas.join("\n");
}

// Atajo para la consola (F12): escribe  autocomprobar()
function autocomprobar() {
  const informe = ejecutarAutocomprobacion();
  console.log(informe.texto);
  return informe.resumen;
}
