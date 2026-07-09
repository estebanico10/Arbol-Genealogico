export interface BirthdayInfo {
  isToday: boolean;
  daysLeft: number;
  nextAge: number;
  month: number; // 0-indexed (0 = Enero)
  day: number;
  dateFormatted: string;
}

const MESES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/**
 * Calcula la edad exacta en años dado la fecha de nacimiento y opcionalmente de fallecimiento.
 */
export function calculateAge(
  birthDateStr?: string | null,
  deathDateStr?: string | null
): number | null {
  if (!birthDateStr) return null;

  const birthDate = parseDateSafe(birthDateStr);
  if (!birthDate || isNaN(birthDate.getTime())) return null;

  const endDate = deathDateStr ? parseDateSafe(deathDateStr) : new Date();
  if (!endDate || isNaN(endDate.getTime())) return null;

  let age = endDate.getFullYear() - birthDate.getFullYear();
  const m = endDate.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
}

/**
 * Formatea la visualización de años y edad automática.
 * Ejemplos:
 * - "1999 — Presente (27 años)"
 * - "1940 — 2018 (Falleció a los 78 años)"
 */
export function formatAgeDisplay(
  birthDateStr?: string | null,
  deathDateStr?: string | null
): string {
  const birthYear = birthDateStr ? getYearSafe(birthDateStr) : '?';
  const deathYear = deathDateStr ? getYearSafe(deathDateStr) : 'Presente';
  const age = calculateAge(birthDateStr, deathDateStr);

  if (age === null) {
    return `${birthYear} — ${deathYear}`;
  }

  if (deathDateStr) {
    return `${birthYear} — ${deathYear} (Falleció a los ${age} años)`;
  }

  return `${birthYear} — Presente (${age} años)`;
}

/**
 * Devuelve la edad corta, por ejemplo "27 años" o "78 años (fallecido)".
 */
export function formatAgeShort(
  birthDateStr?: string | null,
  deathDateStr?: string | null
): string {
  const age = calculateAge(birthDateStr, deathDateStr);
  if (age === null) return 'Edad desconocida';
  if (deathDateStr) return `${age} años (fallecido)`;
  return `${age} años`;
}

/**
 * Obtiene información detallada del cumpleaños próximo de una persona viva.
 */
export function getBirthdayInfo(birthDateStr?: string | null): BirthdayInfo | null {
  if (!birthDateStr) return null;

  const birthDate = parseDateSafe(birthDateStr);
  if (!birthDate || isNaN(birthDate.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const month = birthDate.getMonth();
  const day = birthDate.getDate();

  // Fecha del cumpleaños en el año actual
  let nextBirthday = new Date(today.getFullYear(), month, day);
  nextBirthday.setHours(0, 0, 0, 0);

  // Si ya pasó este año, el próximo es el año siguiente
  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, month, day);
  }

  const diffTime = nextBirthday.getTime() - today.getTime();
  const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const isToday = daysLeft === 0;

  // Qué edad cumplirá o cumple hoy
  const currentAge = calculateAge(birthDateStr, null);
  const nextAge = currentAge !== null ? (isToday ? currentAge : currentAge + 1) : 1;

  const dateFormatted = `${day} de ${MESES_ES[month]}`;

  return {
    isToday,
    daysLeft,
    nextAge,
    month,
    day,
    dateFormatted,
  };
}

function parseDateSafe(dateStr: string): Date | null {
  // Manejar YYYY-MM-DD sin problemas de zona horaria UTC vs Local
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const parts = dateStr.split('T')[0].split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function getYearSafe(dateStr: string): string {
  const d = parseDateSafe(dateStr);
  return d ? d.getFullYear().toString() : '?';
}
