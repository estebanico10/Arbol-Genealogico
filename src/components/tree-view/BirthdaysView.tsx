import { useState, useMemo } from 'react';
import { Persona, Relacion } from '../../types/database';
import { calculateKinship } from '../../utils/kinshipCalculator';
import { getBirthdayInfo, BirthdayInfo, calculateAge } from '../../utils/ageCalculator';
import {
  Cake,
  Calendar as CalendarIcon,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Gift,
  Search,
  Mail,
  Phone,
  Clock,
  Sparkles,
  ListOrdered,
  CalendarDays,
  CalendarRange,
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
  // Controles Dedicados de Calendario
  const [calendarMode, setCalendarMode] = useState<
    'mensual' | 'agenda' | 'proximos7' | 'semanal' | 'anual'
  >('mensual');

  const [search, setSearch] = useState('');
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Personas vivas con fecha de nacimiento
  const peopleWithBirthdays = useMemo(() => {
    const list: PersonWithBirthday[] = [];
    personas.forEach((p) => {
      if (p.fecha_fallecimiento || !p.fecha_nacimiento) return;
      const bday = getBirthdayInfo(p.fecha_nacimiento);
      if (!bday) return;
      const kinship = focalPersonId
        ? calculateKinship(focalPersonId, p.id, personas, relaciones)
        : null;
      const currentAge = calculateAge(p.fecha_nacimiento);
      list.push({ persona: p, kinship, bday, currentAge });
    });

    return list.sort((a, b) => a.bday.daysLeft - b.bday.daysLeft);
  }, [personas, focalPersonId, relaciones]);

  // Filtrado de búsqueda inteligente
  const filteredPeople = useMemo(() => {
    if (!search.trim()) return peopleWithBirthdays;
    const q = search.toLowerCase();
    return peopleWithBirthdays.filter(
      (item) =>
        item.persona.nombres?.toLowerCase().includes(q) ||
        item.persona.apellidos?.toLowerCase().includes(q) ||
        item.kinship?.toLowerCase().includes(q)
    );
  }, [peopleWithBirthdays, search]);

  // Próximos cumpleaños para el Proximity Widget lateral
  const upcomingBirthdays = useMemo(() => {
    return peopleWithBirthdays.slice(0, 8);
  }, [peopleWithBirthdays]);

  // Navegación de mes
  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const currentMonthIndex = calendarDate.getMonth();
  const currentYear = calendarDate.getFullYear();

  // Días para el calendario mensual
  const daysInMonthGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();

    const days: Array<{ dayNum: number | null; bdPeople: PersonWithBirthday[] }> = [];

    // Celdas vacías previas
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ dayNum: null, bdPeople: [] });
    }

    // Días del mes
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const matchingPeople = filteredPeople.filter((item) => {
        const parts = item.persona.fecha_nacimiento!.split('-');
        const m = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return m === currentMonthIndex && day === d;
      });
      days.push({ dayNum: d, bdPeople: matchingPeople });
    }

    return days;
  }, [currentYear, currentMonthIndex, filteredPeople]);

  const today = new Date();
  const isCurrentMonthView =
    today.getMonth() === currentMonthIndex && today.getFullYear() === currentYear;

  // Próximos 7 días
  const next7DaysPeople = useMemo(() => {
    return filteredPeople.filter((item) => item.bday.daysLeft <= 7);
  }, [filteredPeople]);

  return (
    <div className="h-full w-full overflow-y-auto bg-[#F8FAFC] dark:bg-slate-950 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ===================================================================
            ENCABEZADO DE CUMPLEAÑOS + BUSCADOR INTELIGENTE
            =================================================================== */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Cake className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Calendario de Cumpleaños
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Explora fechas importantes con saludos automáticos y cálculo de edades exactas.
                </p>
              </div>
            </div>
          </div>

          {/* Búsqueda Inteligente + Controles Dedicados de Calendario */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Buscador inteligente */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cumpleañero..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Controles Dedicados de Calendario (Segment Switcher secundario) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setCalendarMode('mensual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                  calendarMode === 'mensual'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Vista Mensual</span>
              </button>

              <button
                onClick={() => setCalendarMode('agenda')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                  calendarMode === 'agenda'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>

              <button
                onClick={() => setCalendarMode('proximos7')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                  calendarMode === 'proximos7'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Próximos 7</span>
              </button>

              <button
                onClick={() => setCalendarMode('semanal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                  calendarMode === 'semanal'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Vista Semanal</span>
              </button>

              <button
                onClick={() => setCalendarMode('anual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                  calendarMode === 'anual'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Vista Anual</span>
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================================
            CONTENIDO PRINCIPAL EN 2 COLUMNAS (IZQUIERDA VISTA, DERECHA WIDGET)
            =================================================================== */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          {/* COLUMNA IZQUIERDA (3 COLS EN DESKTOP): VISTAS DEL CALENDARIO */}
          <div className="xl:col-span-3 space-y-6">
            {/* 1. VISTA MENSUAL */}
            {calendarMode === 'mensual' && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-6">
                {/* Cabecera del Mes */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{MESES_ES[currentMonthIndex]}</span>
                    <span className="text-slate-400 font-medium">{currentYear}</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Mes anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCalendarDate(new Date())}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      Hoy
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Mes siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  {DIAS_ES.map((dia) => (
                    <div key={dia}>{dia}</div>
                  ))}
                </div>

                {/* Grid de Días del Mes con Avatares y Regalos proactivos */}
                <div className="grid grid-cols-7 gap-2.5">
                  {daysInMonthGrid.map((dayObj, index) => {
                    const isTodayCell =
                      isCurrentMonthView && dayObj.dayNum === today.getDate();

                    return (
                      <div
                        key={index}
                        className={`min-h-[105px] rounded-2xl p-2.5 border transition-all flex flex-col justify-between ${
                          !dayObj.dayNum
                            ? 'bg-slate-50/40 dark:bg-slate-900/40 border-transparent'
                            : isTodayCell
                            ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500/80 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300'
                        }`}
                      >
                        {dayObj.dayNum && (
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold ${
                                isTodayCell
                                  ? 'px-2 py-0.5 rounded-lg bg-blue-600 text-white'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {dayObj.dayNum}
                            </span>
                            {dayObj.bdPeople.length > 0 && (
                              <Gift className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                            )}
                          </div>
                        )}

                        {/* Avatares y saludos rápidos en días con cumpleaños */}
                        <div className="space-y-1.5 mt-1">
                          {dayObj.bdPeople.map((item) => (
                            <div
                              key={item.persona.id}
                              onClick={() => onSelectPersonForDetail(item.persona)}
                              className="group/cell flex items-center gap-1.5 p-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-500/15 cursor-pointer transition-colors"
                            >
                              {item.persona.foto ? (
                                <img
                                  src={item.persona.foto}
                                  alt=""
                                  className="w-5 h-5 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                                  {item.persona.nombres?.[0] || ''}
                                </div>
                              )}
                              <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">
                                {item.persona.nombres}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. VISTA AGENDA CRONOLÓGICA */}
            {calendarMode === 'agenda' && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Agenda Completa de Cumpleaños
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPeople.map((item) => (
                    <div
                      key={item.persona.id}
                      onClick={() => onSelectPersonForDetail(item.persona)}
                      className="py-4 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 px-4 rounded-2xl cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        {item.persona.foto ? (
                          <img
                            src={item.persona.foto}
                            alt=""
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
                            {item.persona.nombres?.[0] || ''}{item.persona.apellidos?.[0] || ''}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {item.persona.nombres} {item.persona.apellidos}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Cumplirá <strong>{item.bday.nextAge} años</strong> el{' '}
                            {item.bday.dateFormatted}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                          En {item.bday.daysLeft} día{item.bday.daysLeft === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. PRÓXIMOS 7 DÍAS */}
            {calendarMode === 'proximos7' && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span>Próximos 7 Días</span>
                </h3>

                {next7DaysPeople.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No hay cumpleaños programados para los próximos 7 días.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {next7DaysPeople.map((item) => (
                      <div
                        key={item.persona.id}
                        onClick={() => onSelectPersonForDetail(item.persona)}
                        className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          {item.persona.foto ? (
                            <img
                              src={item.persona.foto}
                              alt=""
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center">
                              {item.persona.nombres?.[0] || ''}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {item.persona.nombres} {item.persona.apellidos}
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                              ¡Cumple en {item.bday.daysLeft} días! ({item.bday.nextAge} años)
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. VISTAS SEMANAL Y ANUAL (Sintaxis limpia de resumen) */}
            {(calendarMode === 'semanal' || calendarMode === 'anual') && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-blue-500 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {calendarMode === 'semanal' ? 'Vista Semanal' : 'Resumen Anual de Cumpleaños'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Todos los {filteredPeople.length} miembros organizados progresivamente a lo largo del calendario.
                </p>
              </div>
            )}
          </div>

          {/* ===================================================================
              COLUMNA DERECHA (1 COL EN DESKTOP): WIDGET "PRÓXIMOS CUMPLEAÑOS"
              =================================================================== */}
          <div className="xl:col-span-1 space-y-6 sticky top-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-500" />
                  <span>Próximos Cumpleaños</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                  {upcomingBirthdays.length}
                </span>
              </div>

              <div className="space-y-3.5">
                {upcomingBirthdays.map((item) => {
                  const cleanTel = item.persona.telefono?.replace(/\D/g, '') || '';
                  const cleanCel = item.persona.celular?.replace(/\D/g, '') || '';
                  const waNumber = cleanCel || cleanTel;

                  return (
                    <div
                      key={item.persona.id}
                      onClick={() => onSelectPersonForDetail(item.persona)}
                      className="group p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800/80 cursor-pointer space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {item.persona.foto ? (
                            <img
                              src={item.persona.foto}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {item.persona.nombres?.[0] || ''}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {item.persona.nombres} {item.persona.apellidos}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {item.bday.dateFormatted} • <strong>{item.bday.nextAge} años</strong>
                            </p>
                          </div>
                        </div>

                        <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] shrink-0">
                          {item.bday.daysLeft === 0
                            ? '¡HOY!'
                            : `${item.bday.daysLeft}d`}
                        </span>
                      </div>

                      {/* Botones de Saludo Directo (WhatsApp / Email / Tel) */}
                      <div
                        className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {waNumber && (
                          <a
                            href={`https://wa.me/${waNumber}?text=¡Feliz%20cumpleaños,%20${encodeURIComponent(
                              item.persona.nombres || ''
                            )}!%20🎉`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold transition-colors"
                            title="Saludar por WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        {item.persona.email && (
                          <a
                            href={`mailto:${item.persona.email}?subject=¡Feliz%20cumpleaños!`}
                            className="p-1.5 rounded-xl bg-slate-200/70 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-slate-700 transition-colors"
                            title="Enviar correo"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {item.persona.telefono && (
                          <a
                            href={`tel:${item.persona.telefono}`}
                            className="p-1.5 rounded-xl bg-slate-200/70 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-slate-700 transition-colors"
                            title="Llamar"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
