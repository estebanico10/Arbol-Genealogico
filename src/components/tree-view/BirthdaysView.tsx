import { useState, useMemo } from 'react';
import { Persona, Relacion } from '../../types/database';
import { calculateKinship } from '../../utils/kinshipCalculator';
import { getBirthdayInfo, BirthdayInfo, calculateAge } from '../../utils/ageCalculator';
import {
  Cake,
  Calendar as CalendarIcon,
  LayoutGrid,
  Table as TableIcon,
  MessageCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Gift,
} from 'lucide-react';

interface BirthdaysViewProps {
  personas: Persona[];
  relaciones: Relacion[];
  focalPersonId: string | null;
  onSelectPersonForDetail: (persona: Persona) => void;
}

interface PersonWithBirthday {
  persona: Persona;
  kinship: string | null;
  bday: BirthdayInfo;
  currentAge: number | null;
}

const MESES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function BirthdaysView({
  personas,
  relaciones,
  focalPersonId,
  onSelectPersonForDetail,
}: BirthdaysViewProps) {
  const [subView, setSubView] = useState<'cards' | 'table' | 'calendar'>('cards');
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Calcular información de cumpleaños para personas vivas con fecha de nacimiento
  const peopleWithBirthdays = useMemo(() => {
    const list: PersonWithBirthday[] = [];
    for (const p of personas) {
      if (p.fecha_fallecimiento || !p.fecha_nacimiento) continue;
      const bday = getBirthdayInfo(p.fecha_nacimiento);
      if (!bday) continue;
      const kinship = focalPersonId ? calculateKinship(focalPersonId, p.id, personas, relaciones) : null;
      const currentAge = calculateAge(p.fecha_nacimiento, null);
      list.push({ persona: p, kinship, bday, currentAge });
    }
    // Ordenar por proximidad (días restantes ascendente)
    return list.sort((a, b) => a.bday.daysLeft - b.bday.daysLeft);
  }, [personas, relaciones, focalPersonId]);

  const todaysBirthdays = useMemo(
    () => peopleWithBirthdays.filter((item) => item.bday.isToday),
    [peopleWithBirthdays]
  );

  const upcomingBirthdays = useMemo(
    () => peopleWithBirthdays.filter((item) => !item.bday.isToday && item.bday.daysLeft <= 45),
    [peopleWithBirthdays]
  );

  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/[^0-9+]/g, '');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* SECCIÓN HERO / DESTACADOS */}
      <div className="space-y-4">
        {/* Cumpleañeros de HOY */}
        {todaysBirthdays.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl border border-amber-300/30">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-7 h-7 animate-bounce" />
              <h3 className="text-xl font-black tracking-tight">
                🎉 ¡HOY HAY CUMPLEAÑOS EN LA FAMILIA!
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todaysBirthdays.map(({ persona, kinship, bday }) => (
                <div
                  key={persona.id}
                  className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/30 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {persona.foto ? (
                      <img
                        src={persona.foto}
                        alt={persona.nombres || ''}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl border-2 border-white">
                        🎂
                      </div>
                    )}
                    <div className="min-w-0">
                      {kinship && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/20 text-white mb-1">
                          {kinship}
                        </span>
                      )}
                      <h4 className="font-extrabold text-lg truncate leading-tight">
                        {persona.nombres} {persona.apellidos}
                      </h4>
                      <p className="text-xs text-amber-100 font-medium">
                        Cumple <strong>{bday.nextAge} años</strong> hoy ({bday.dateFormatted})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {persona.celular && (
                      <a
                        href={`https://wa.me/${cleanPhone(persona.celular)}?text=¡Feliz cumpleaños ${persona.nombres}! 🎉🎂`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow"
                        title="Felicitar por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => onSelectPersonForDetail(persona)}
                      className="px-3.5 py-2 rounded-xl bg-white text-amber-800 font-bold text-xs hover:bg-amber-50 transition-colors shadow"
                    >
                      Ficha
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen de Próximos Cumpleaños (Tira Horizontal) */}
        {upcomingBirthdays.length > 0 && (
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-sm">
                <Gift className="w-4 h-4 text-blue-500" />
                <span>Próximos en celebrar (Siguientes 45 días)</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {upcomingBirthdays.length} personas
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {upcomingBirthdays.slice(0, 3).map(({ persona, kinship, bday }) => (
                <div
                  key={persona.id}
                  onClick={() => onSelectPersonForDetail(persona)}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-600/60 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {persona.nombres} {persona.apellidos}
                      </p>
                      {kinship && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-300 shrink-0">
                          {kinship}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {bday.dateFormatted} • Cumplirá {bday.nextAge} años
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
                    En {bday.daysLeft} d.
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BARRA DE CONTROL Y SELECTOR DE VISTAS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800/90 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2">
          <Cake className="w-5 h-5 text-amber-500" />
          <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
            Directorio Inteligente de Cumpleaños
          </h2>
        </div>

        {/* Botones de Sub-vista */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setSubView('cards')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subView === 'cards'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tarjetas</span>
          </button>
          <button
            onClick={() => setSubView('table')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subView === 'table'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Tabla Anual</span>
          </button>
          <button
            onClick={() => setSubView('calendar')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subView === 'calendar'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendario</span>
          </button>
        </div>
      </div>

      {/* RENDERIZADO DE LA SUB-VISTA SELECCIONADA */}
      {subView === 'cards' && (
        <CardsSubView
          items={peopleWithBirthdays}
          onSelectPerson={onSelectPersonForDetail}
          cleanPhone={cleanPhone}
        />
      )}

      {subView === 'table' && (
        <TableSubView
          items={peopleWithBirthdays}
          onSelectPerson={onSelectPersonForDetail}
          cleanPhone={cleanPhone}
        />
      )}

      {subView === 'calendar' && (
        <CalendarSubView
          items={peopleWithBirthdays}
          currentDate={calendarDate}
          onChangeDate={setCalendarDate}
          onSelectPerson={onSelectPersonForDetail}
        />
      )}
    </div>
  );
}

/* ========================================================
 * 🃏 SUB-VISTA TARJETAS FESTIVAS
 * ======================================================== */
function CardsSubView({
  items,
  onSelectPerson,
  cleanPhone,
}: {
  items: PersonWithBirthday[];
  onSelectPerson: (p: Persona) => void;
  cleanPhone: (s?: string) => string;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-700">
        <Cake className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="font-bold text-slate-700 dark:text-slate-300">
          No hay fechas de nacimiento registradas en personas vivas del árbol.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map(({ persona, kinship, bday, currentAge }) => {
        const isNear = bday.daysLeft <= 14;
        return (
          <div
            key={persona.id}
            className={`group relative rounded-2xl p-5 border transition-all hover:shadow-lg ${
              bday.isToday
                ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-md ring-2 ring-amber-400'
                : isNear
                  ? 'bg-blue-50/50 dark:bg-slate-800 border-blue-200 dark:border-blue-800/60'
                  : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700'
            }`}
          >
            {/* Header Tarjeta */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {persona.foto ? (
                  <img
                    src={persona.foto}
                    alt={persona.nombres || ''}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center font-extrabold text-lg border border-blue-200 dark:border-blue-800">
                    {(persona.nombres?.[0] || '🎂').toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {persona.nombres} {persona.apellidos}
                  </h4>
                  {kinship && (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mt-0.5">
                      {kinship}
                    </span>
                  )}
                </div>
              </div>

              <span
                className={`text-[11px] font-black px-2.5 py-1 rounded-full shrink-0 ${
                  bday.isToday
                    ? 'bg-amber-500 text-white animate-pulse'
                    : isNear
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {bday.isToday ? '¡HOY!' : `En ${bday.daysLeft} d.`}
              </span>
            </div>

            {/* Fecha y Edad que cumple */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                <Cake className="w-4 h-4 text-amber-500" />
                <span>{bday.dateFormatted}</span>
              </div>
              <span className="text-slate-500 dark:text-slate-400">
                Cumplirá <strong className="text-slate-900 dark:text-slate-100">{bday.nextAge} años</strong>
                {currentAge !== null && ` (Edad actual: ${currentAge})`}
              </span>
            </div>

            {/* Acciones */}
            <div className="mt-4 flex items-center justify-end gap-2">
              {persona.celular && (
                <a
                  href={`https://wa.me/${cleanPhone(persona.celular)}?text=¡Feliz cumpleaños ${persona.nombres}! 🎉🎂`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Felicitar
                </a>
              )}
              <button
                onClick={() => onSelectPerson(persona)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Detalles
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ========================================================
 * 📋 SUB-VISTA TABLA ANUAL POR MESES
 * ======================================================== */
function TableSubView({
  items,
  onSelectPerson,
  cleanPhone,
}: {
  items: PersonWithBirthday[];
  onSelectPerson: (p: Persona) => void;
  cleanPhone: (s?: string) => string;
}) {
  // Agrupar por mes (0 a 11)
  const byMonth = useMemo(() => {
    const groups: { [key: number]: PersonWithBirthday[] } = {};
    for (let i = 0; i < 12; i++) groups[i] = [];
    for (const item of items) {
      groups[item.bday.month].push(item);
    }
    // Ordenar cada grupo por día
    for (let i = 0; i < 12; i++) {
      groups[i].sort((a, b) => a.bday.day - b.bday.day);
    }
    return groups;
  }, [items]);

  return (
    <div className="space-y-6">
      {MESES_ES.map((nombreMes, mesIdx) => {
        const mesItems = byMonth[mesIdx];
        if (mesItems.length === 0) return null;

        return (
          <div
            key={mesIdx}
            className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
          >
            <div className="bg-slate-50 dark:bg-slate-800 px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider text-xs">
                🗓️ {nombreMes}
              </h3>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {mesItems.length} {mesItems.length === 1 ? 'cumpleaños' : 'cumpleaños'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/60 text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500">
                    <th className="p-3 pl-5">Día</th>
                    <th className="p-3">Familiar</th>
                    <th className="p-3">Parentesco</th>
                    <th className="p-3">Edad a Cumplir</th>
                    <th className="p-3">Próximo en</th>
                    <th className="p-3 text-right pr-5">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-sm">
                  {mesItems.map(({ persona, kinship, bday, currentAge }) => (
                    <tr
                      key={persona.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors ${
                        bday.isToday ? 'bg-amber-50/70 dark:bg-amber-950/30' : ''
                      }`}
                    >
                      <td className="p-3 pl-5 font-black text-blue-600 dark:text-blue-400">
                        {bday.day} de {nombreMes}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                        {persona.nombres} {persona.apellidos}
                      </td>
                      <td className="p-3">
                        {kinship ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {kinship}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                        <strong>{bday.nextAge} años</strong>{' '}
                        <span className="text-xs text-slate-400">({currentAge} años actuales)</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${
                            bday.isToday
                              ? 'bg-amber-500 text-white'
                              : bday.daysLeft <= 14
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                                : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {bday.isToday ? '¡HOY!' : `En ${bday.daysLeft} d.`}
                        </span>
                      </td>
                      <td className="p-3 text-right pr-5">
                        <div className="flex items-center justify-end gap-2">
                          {persona.celular && (
                            <a
                              href={`https://wa.me/${cleanPhone(persona.celular)}?text=¡Feliz cumpleaños ${persona.nombres}! 🎉🎂`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                              title="Felicitar por WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => onSelectPerson(persona)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors"
                            title="Ver ficha"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ========================================================
 * 📅 SUB-VISTA CALENDARIO MENSUAL INTERACTIVO
 * ======================================================== */
function CalendarSubView({
  items,
  currentDate,
  onChangeDate,
  onSelectPerson,
}: {
  items: PersonWithBirthday[];
  currentDate: Date;
  onChangeDate: (d: Date) => void;
  onSelectPerson: (p: Persona) => void;
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => onChangeDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => onChangeDate(new Date(year, month + 1, 1));
  const handleToday = () => onChangeDate(new Date());

  // Personas que cumplen años en este mes
  const birthdaysInMonth = useMemo(() => {
    return items.filter((item) => item.bday.month === month);
  }, [items, month]);

  // Datos para construir la grilla del calendario
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Dom) - 6 (Sáb)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{ dayNumber: number | null; bdays: PersonWithBirthday[] }> = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ dayNumber: null, bdays: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const bdays = birthdaysInMonth.filter((item) => item.bday.day === d);
      days.push({ dayNumber: d, bdays });
    }
    return days;
  }, [year, month, birthdaysInMonth]);

  const today = new Date();
  const isCurrentMonthYear = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="bg-white dark:bg-slate-800/95 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
      {/* Control Superior del Calendario */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
            {MESES_ES[month]} {year}
          </h3>
          <button
            onClick={handleToday}
            className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 transition-colors"
          >
            Mes Actual
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Cabecera de Días */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {DIAS_ES.map((dia) => (
          <div
            key={dia}
            className="font-extrabold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 py-1"
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Grilla de Días */}
      <div className="grid grid-cols-7 gap-2">
        {calendarGrid.map((cell, idx) => {
          const isToday = isCurrentMonthYear && cell.dayNumber === today.getDate();

          if (cell.dayNumber === null) {
            return (
              <div
                key={idx}
                className="min-h-[100px] rounded-2xl bg-slate-50/40 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800"
              />
            );
          }

          const hasBirthdays = cell.bdays.length > 0;

          return (
            <div
              key={idx}
              className={`min-h-[110px] rounded-2xl p-2.5 border transition-all flex flex-col justify-between ${
                isToday
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/30'
                  : hasBirthdays
                    ? 'bg-amber-50/60 dark:bg-amber-950/25 border-amber-300 dark:border-amber-700 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-black w-7 h-7 rounded-full flex items-center justify-center ${
                    isToday
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {cell.dayNumber}
                </span>
                {hasBirthdays && <Cake className="w-4 h-4 text-amber-500" />}
              </div>

              {/* Lista de Cumpleañeros en esta celda */}
              <div className="space-y-1.5 mt-2">
                {cell.bdays.map(({ persona, kinship, bday }) => (
                  <button
                    key={persona.id}
                    onClick={() => onSelectPerson(persona)}
                    className="w-full text-left p-1.5 rounded-xl bg-white dark:bg-slate-700/90 border border-amber-200 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-slate-600 transition-colors shadow-xs group"
                  >
                    <p className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600">
                      🎂 {persona.nombres} {kinship ? `(${kinship})` : ''}
                    </p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                      Cumplirá {bday.nextAge} años
                    </p>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
