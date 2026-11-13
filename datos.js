// =====================================================================
// DATOS DEL TALLER: Detective de mensajes
// Cada ejemplo tiene un texto y una etiqueta: "spam" o "normal".
// Estos datos son la "experiencia" de la que aprende tu modelo.
// =====================================================================

// ---------- Datos de ENTRENAMIENTO (con los que el modelo aprende) ----------
const ENTRENAMIENTO = [
  // ----- SPAM -----
  { texto: "¡Felicidades! Ganaste un premio de 5000 dólares, reclama tu premio ahora haciendo clic aquí", etiqueta: "spam" },
  { texto: "Tu cuenta del banco ha sido bloqueada, verifica tus datos urgente en este enlace", etiqueta: "spam" },
  { texto: "Gana dinero fácil desde tu casa, sin experiencia, trabaja solo 2 horas al día", etiqueta: "spam" },
  { texto: "Invierte en criptomonedas y duplica tu dinero en una semana, ganancias garantizadas", etiqueta: "spam" },
  { texto: "Oferta exclusiva solo hoy: 70% de descuento en todos los productos, compra ya", etiqueta: "spam" },
  { texto: "Tu paquete está retenido en aduana, paga el envío en este enlace para recibirlo", etiqueta: "spam" },
  { texto: "Has sido seleccionado para recibir un iPhone gratis, haz clic y reclama tu regalo", etiqueta: "spam" },
  { texto: "Urgente: actividad sospechosa en tu tarjeta, confirma tu clave para evitar el bloqueo", etiqueta: "spam" },
  { texto: "Préstamo aprobado sin buró de crédito, dinero en tu cuenta en 10 minutos", etiqueta: "spam" },
  { texto: "Bitcoin te hará millonario, únete a nuestro grupo VIP y gana dinero desde hoy", etiqueta: "spam" },
  { texto: "¡Ganaste la lotería! Envía tus datos bancarios para cobrar tu premio", etiqueta: "spam" },
  { texto: "Promoción imperdible: compra uno y llévate otro gratis, oferta limitada", etiqueta: "spam" },
  { texto: "Tu cuenta será suspendida, actualiza tu información bancaria ahora mismo", etiqueta: "spam" },
  { texto: "Mensaje de tu banco: se detectó un cargo extraño, ingresa a este link para cancelarlo", etiqueta: "spam" },
  { texto: "Trabaja desde casa y gana 3000 dólares al mes, inscríbete gratis hoy", etiqueta: "spam" },
  { texto: "Oferta relámpago: tarjeta de crédito sin costo, solicita la tuya gratis", etiqueta: "spam" },
  { texto: "No pierdas esta oportunidad, multiplica tu inversión con nuestro robot de trading", etiqueta: "spam" },
  { texto: "Su envío no pudo ser entregado, confirme su dirección y pague la tarifa en el enlace", etiqueta: "spam" },
  { texto: "Felicitaciones, eres el visitante un millón, reclama tu premio gratis", etiqueta: "spam" },
  { texto: "Cupón de descuento exclusivo para ti, compra ahora y ahorra 50%", etiqueta: "spam" },
  { texto: "Alerta de seguridad: tu clave del banco expiró, restablécela aquí urgente", etiqueta: "spam" },
  { texto: "Gana dinero rápido con criptomonedas, sin riesgo y con ganancias diarias", etiqueta: "spam" },
  { texto: "Pastillas para bajar de peso en una semana, resultados garantizados, compra ya", etiqueta: "spam" },
  { texto: "Eres el ganador del sorteo de un carro nuevo, llama ahora para reclamar tu premio", etiqueta: "spam" },
  { texto: "Crédito urgente sin papeleo, dinero en minutos, aprueba hoy mismo", etiqueta: "spam" },
  { texto: "Haz clic aquí para ver quién visitó tu perfil, enlace exclusivo gratis", etiqueta: "spam" },
  { texto: "Soy inversionista y te enseñaré a ganar dinero fácil con bitcoin, escríbeme ya", etiqueta: "spam" },
  { texto: "Último aviso: tu paquete será devuelto, paga la tarifa de aduana en el enlace", etiqueta: "spam" },
  { texto: "Oferta de último minuto: viaje todo incluido a Cancún con 80% de descuento, reserva ya", etiqueta: "spam" },
  { texto: "Tu tarjeta ha sido bloqueada, llama al número indicado y confirma tus datos", etiqueta: "spam" },

  // ----- NORMAL -----
  { texto: "Hola, ¿a qué hora es la clase de mañana? No encuentro el horario", etiqueta: "normal" },
  { texto: "Mamá, ya llegué a la casa, más tarde te llamo para cenar", etiqueta: "normal" },
  { texto: "Recuerda entregar la tarea de programación antes del viernes", etiqueta: "normal" },
  { texto: "Vamos al cine el sábado con los chicos, ¿quién se apunta?", etiqueta: "normal" },
  { texto: "Profe, tengo una duda sobre el ejercicio de la guía, ¿puede revisarlo?", etiqueta: "normal" },
  { texto: "La reunión de trabajo se movió para las 3 de la tarde en la sala dos", etiqueta: "normal" },
  { texto: "Feliz cumpleaños hermano, que la pases muy bien con la familia", etiqueta: "normal" },
  { texto: "Te paso los apuntes de la clase de matemáticas por si faltaste", etiqueta: "normal" },
  { texto: "Quedamos a las 6 en la cafetería para estudiar para el examen", etiqueta: "normal" },
  { texto: "Ya envié el informe al jefe, avísame si falta algo", etiqueta: "normal" },
  { texto: "Gracias por ayudarme con el proyecto, sin ti no lo terminaba", etiqueta: "normal" },
  { texto: "Nos vemos en el parque para jugar fútbol este domingo", etiqueta: "normal" },
  { texto: "Abuela, el domingo vamos a almorzar a tu casa, llevamos el postre", etiqueta: "normal" },
  { texto: "El grupo de estudio se reúne hoy en la biblioteca después de clase", etiqueta: "normal" },
  { texto: "¿Puedes cuidar a mi perro este fin de semana? Viajo con mi familia", etiqueta: "normal" },
  { texto: "Ya subí la presentación a la carpeta compartida del equipo", etiqueta: "normal" },
  { texto: "¿Qué tal estuvo la entrevista de trabajo? Cuéntame cómo te fue", etiqueta: "normal" },
  { texto: "No olvides comprar leche y pan cuando vengas a la casa", etiqueta: "normal" },
  { texto: "El profesor dijo que el examen será de la unidad uno y dos", etiqueta: "normal" },
  { texto: "Hoy hay ensayo de la banda a las 7, no llegues tarde", etiqueta: "normal" },
  { texto: "Mi hermana saca la licencia hoy, estamos todos nerviosos", etiqueta: "normal" },
  { texto: "Te mandé el enlace de la reunión por correo, entra cinco minutos antes", etiqueta: "normal" },
  { texto: "¿Cuándo salimos a comer pizza con los amigos? Tengo hambre", etiqueta: "normal" },
  { texto: "Falta una persona para completar el equipo del proyecto final", etiqueta: "normal" },
  { texto: "¿Me prestas tu cargador? El mío se dañó y mi celular está sin batería", etiqueta: "normal" },
  { texto: "El lunes no hay clase por el feriado, a descansar", etiqueta: "normal" },
  { texto: "Feliz Navidad a toda la familia, los quiero mucho", etiqueta: "normal" },
  { texto: "Revisa el código que te envié, creo que el error está en el ciclo", etiqueta: "normal" },
  { texto: "Pásame la dirección de la fiesta, voy con mi prima", etiqueta: "normal" },
  { texto: "Hoy me toca pagar la cuenta del restaurante, la otra vez pagaste tú", etiqueta: "normal" }
];

// ---------- Datos de PRUEBA (el examen: el modelo NUNCA los vio) ----------
// Ojo: algunos son difíciles a propósito. Así es el mundo real.
const PRUEBA = [
  // Spam
  { texto: "Felicidades, has ganado un viaje gratis, reclama tu premio hoy", etiqueta: "spam" },
  { texto: "Tu cuenta del banco fue bloqueada, confirma tus datos en este enlace", etiqueta: "spam" },
  { texto: "Gana dinero fácil invirtiendo en criptomonedas, ganancias garantizadas", etiqueta: "spam" },
  { texto: "Oferta exclusiva: 60% de descuento solo hoy, compra ahora", etiqueta: "spam" },
  { texto: "Tu paquete está retenido, paga la tarifa en el enlace para recibirlo", etiqueta: "spam" },
  { texto: "Hola, soy Camila de recursos humanos, tengo una vacante para ti, escríbeme al privado", etiqueta: "spam" },
  { texto: "Préstamo inmediato sin papeleo, dinero en tu cuenta hoy", etiqueta: "spam" },
  { texto: "Última oportunidad: inscríbete y trabaja desde casa", etiqueta: "spam" },
  { texto: "Reunión urgente: abre este documento para ver tu liquidación", etiqueta: "spam" },
  { texto: "Compra ya y gana un cupón gratis de descuento", etiqueta: "spam" },

  // Normal
  { texto: "¿A qué hora empieza la clase de inteligencia artificial el jueves?", etiqueta: "normal" },
  { texto: "Mamá, ya llegué, mañana te llamo para almorzar", etiqueta: "normal" },
  { texto: "Recuerda traer la tarea de matemáticas para el lunes", etiqueta: "normal" },
  { texto: "Vamos al parque con los amigos el domingo, ¿quién se apunta?", etiqueta: "normal" },
  { texto: "Profe, ¿puede revisar mi informe antes de la reunión?", etiqueta: "normal" },
  { texto: "Tu tarjeta del banco llegó a mi casa por error, pasa a recogerla gratis cuando puedas", etiqueta: "normal" },
  { texto: "Pasé por el banco y me dijeron que mañana abren a las 8, te aviso", etiqueta: "normal" },
  { texto: "Mi hermana cumple años el sábado, vamos a la fiesta en su casa", etiqueta: "normal" },
  { texto: "Te envié el enlace de la presentación, revisa antes de clase", etiqueta: "normal" },
  { texto: "Hoy ganamos el partido de fútbol, ¡qué alegría!", etiqueta: "normal" }
];
