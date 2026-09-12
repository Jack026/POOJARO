'use client';

import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Moon,
  Sun,
  Sparkles,
} from 'lucide-react';

import type { Festival } from '@/lib/data/types';
import {
  type PanchangDay,
  type GrahanInfo,
  getMonthPanchang,
  getPanchangForDate,
  SACRED_FESTIVALS_MAP,
} from '@/lib/panchang';

interface FestivalRailProps {
  festivals: Festival[];
  now?: Date;
}

interface CalendarMonth {
  month: number;
  year: number;
}

/* -------------------------------------------------------------------------- */
/*                               CONSTANTS                                    */
/* -------------------------------------------------------------------------- */

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];



/* -------------------------------------------------------------------------- */
/*                              HELPERS                                       */
/* -------------------------------------------------------------------------- */

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDate(date: string) {
  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatLongDate(date: string) {
  const parsed = parseDate(date);

  if (!parsed) return date;

  return parsed.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(date: string) {
  const parsed = parseDate(date);

  if (!parsed) return '';

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getCalendarCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = getDaysInMonth(year, month);

  return [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, index) => index + 1),
  ];
}

function getFestivalDate(festival: Festival) {
  if (!festival.startDate) return null;

  return parseDate(festival.startDate);
}

function findNextFestival(
  festivals: Festival[],
  now: Date
): Festival | null {
  const allCandidates: Festival[] = [...festivals];

  // Merge sacred festivals from SACRED_FESTIVALS_MAP
  for (const [dateStr, info] of Object.entries(SACRED_FESTIVALS_MAP)) {
    const fDate = new Date(`${dateStr}T00:00:00.000Z`);
    if (fDate.getTime() >= now.getTime() - 86400000) {
      for (const name of info.festivals) {
        if (!allCandidates.some((c) => c.name === name || c.startDate?.slice(0, 10) === dateStr)) {
          allCandidates.push({
            id: `panchang-${dateStr}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            name,
            slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            headline: name,
            tagline: 'Sacred Hindu celebration.',
            description: 'Auspicious festival celebrated according to traditional Hindu panchang.',
            imageUrl: '',
            icon: 'Sparkles',
            startDate: `${dateStr}T00:00:00.000Z`,
            endDate: `${dateStr}T23:59:59.000Z`,
            accent: '#B78332',
            isActive: true,
            sortOrder: 100,
          });
        }
      }
    }
  }

  const upcoming = allCandidates
    .filter((festival) => {
      if (!festival.isActive || !festival.startDate) {
        return false;
      }

      const date = parseDate(festival.startDate);

      return date !== null && date.getTime() >= now.getTime() - 86400000;
    })
    .sort((a, b) => {
      const first = parseDate(a.startDate!)?.getTime() ?? Infinity;
      const second = parseDate(b.startDate!)?.getTime() ?? Infinity;

      return first - second;
    });

  return upcoming[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/*                         MAIN COMPONENT                                     */
/* -------------------------------------------------------------------------- */

export function FestivalRail({
  festivals,
  now = new Date(),
}: FestivalRailProps) {
  const currentYear = now.getFullYear();

  const [calendar, setCalendar] = useState<CalendarMonth>({
    month: now.getMonth(),
    year: currentYear,
  });

  const [selectedDate, setSelectedDate] = useState(
    toDateKey(now)
  );

  const [showFullDetails, setShowFullDetails] =
    useState(false);

  const nextFestival = useMemo(
    () => findNextFestival(festivals, now),
    [festivals, now]
  );

  const days = useMemo(
    () => getMonthPanchang(calendar.year, calendar.month, festivals),
    [calendar.year, calendar.month, festivals]
  );

  const daysByDate = useMemo(() => {
    const map = new Map<string, PanchangDay>();
    for (const day of days) {
      map.set(day.date, day);
    }
    return map;
  }, [days]);

  const selectedDay = useMemo(() => {
    if (daysByDate.has(selectedDate)) {
      return daysByDate.get(selectedDate);
    }
    const parsed = parseDate(selectedDate);
    if (parsed) {
      return getPanchangForDate(parsed, festivals);
    }
    return days[0];
  }, [daysByDate, selectedDate, festivals, days]);

  const cells = useMemo(
    () =>
      getCalendarCells(
        calendar.year,
        calendar.month
      ),
    [calendar.year, calendar.month]
  );

  const goPreviousMonth = () => {
    setCalendar((current) => {
      if (current.month === 0) {
        return {
          month: 11,
          year: current.year - 1,
        };
      }

      return {
        ...current,
        month: current.month - 1,
      };
    });
  };

  const goNextMonth = () => {
    setCalendar((current) => {
      if (current.month === 11) {
        return {
          month: 0,
          year: current.year + 1,
        };
      }

      return {
        ...current,
        month: current.month + 1,
      };
    });
  };

  const goToday = () => {
    setCalendar({
      month: now.getMonth(),
      year: now.getFullYear(),
    });

    setSelectedDate(toDateKey(now));
  };

  return (
    <section className="relative overflow-hidden bg-[#f8f2e7] py-14 md:py-20">

      {/* ---------------------------------------------------------------- */}
      {/* Background                                                       */}
      {/* ---------------------------------------------------------------- */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-[360px] w-[360px] rounded-full bg-[#c59a3d]/10 blur-3xl" />

        <div className="absolute -right-40 bottom-10 h-[420px] w-[420px] rounded-full bg-[#7a391c]/5 blur-3xl" />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b58a36]/40 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#b58a36]/30 to-transparent" />
      </div>

      <div className="container-page relative z-10">

        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div className="mx-auto max-w-3xl text-center">

          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-[#b58a36]/70" />

            <span className="text-[9px] font-medium uppercase tracking-[0.4em] text-[#9c752b]">
              Hindu Panchang
            </span>

            <span className="h-px w-8 bg-[#b58a36]/70" />
          </div>

          <h2 className="mt-3 font-display text-4xl leading-tight text-[#492719] md:text-5xl">
            Sacred Calendar
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-[#806756] md:text-sm">
            Festivals, vrat, tithi, nakshatra, muhurat,
            auspicious timings and celestial events —
            beautifully organized in one calendar.
          </p>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Compact Calendar Card                                            */}
        {/* ---------------------------------------------------------------- */}

        <div className="mx-auto mt-10 max-w-7xl overflow-hidden rounded-[28px] border border-[#b58a36]/25 bg-white/70 shadow-[0_25px_80px_rgba(71,39,22,0.11)] backdrop-blur-xl">

          {/* Top navigation */}
          <div className="border-b border-[#b58a36]/15 px-4 py-4 md:px-6">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              {/* Year */}
              <div>
                <p className="text-[8px] uppercase tracking-[0.3em] text-[#9b7732]">
                  Hindu Calendar
                </p>

                <p className="font-display text-xl text-[#492719]">
                  {calendar.year}
                </p>
              </div>

              {/* Month */}
              <div className="flex items-center justify-center gap-2">

                <button
                  type="button"
                  onClick={goPreviousMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#b58a36]/20 bg-[#fbf5e8] text-[#64432e] transition hover:bg-[#eee2c7]"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="min-w-[160px] text-center">
                  <p className="font-display text-xl text-[#492719]">
                    {MONTHS[calendar.month]}
                  </p>

                  <p className="text-[8px] uppercase tracking-[0.2em] text-[#a48669]">
                    {calendar.year}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={goNextMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#b58a36]/20 bg-[#fbf5e8] text-[#64432e] transition hover:bg-[#eee2c7]"
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Today */}
              <button
                type="button"
                onClick={goToday}
                className="mx-auto rounded-full border border-[#b58a36]/25 bg-[#f5ead2] px-5 py-2 text-[9px] font-medium uppercase tracking-[0.2em] text-[#735320] transition hover:bg-[#eadbbc] md:mx-0"
              >
                Today
              </button>

            </div>
          </div>

          {/* Calendar + details */}
          <div className="grid lg:grid-cols-[1.5fr_0.8fr]">

            {/* ========================================================== */}
            {/* CALENDAR                                                    */}
            {/* ========================================================== */}

            <div className="p-4 md:p-6">

              {/* Weekdays */}
              <div className="grid grid-cols-7 border-b border-[#b58a36]/10 pb-3">
                {WEEKDAYS.map((weekday) => (
                  <div
                    key={weekday}
                    className="text-center text-[8px] font-medium uppercase tracking-[0.18em] text-[#957761] md:text-[9px]"
                  >
                    {weekday}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="mt-2 grid grid-cols-7 gap-1 md:gap-2">

                {cells.map((dayNumber, index) => {

                  if (!dayNumber) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-[66px] md:min-h-[90px]"
                      />
                    );
                  }

                  const date = new Date(
                    calendar.year,
                    calendar.month,
                    dayNumber
                  );

                  const key = toDateKey(date);

                  const day = daysByDate.get(key);

                  const isToday = key === toDateKey(now);

                  const isSelected =
                    key === selectedDate;

                  const isSunday =
                    date.getDay() === 0;

                  const hasFestival =
                    Boolean(day?.festivals?.length);

                  const hasVrat =
                    Boolean(day?.vrat?.length);

                  const hasGrahan =
                    Boolean(
                      day?.chandraGrahan ||
                        day?.suryaGrahan
                    );

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedDate(key);
                        setShowFullDetails(false);
                      }}
                      className={`group relative min-h-[66px] overflow-hidden rounded-xl border p-1.5 text-left transition-all duration-300 md:min-h-[90px] md:p-2 ${
                        isSelected
                          ? 'border-[#ae7e25] bg-[#f4e7c7] shadow-[0_8px_25px_rgba(86,54,26,0.12)]'
                          : 'border-[#b58a36]/10 bg-[#fffdf8] hover:-translate-y-0.5 hover:border-[#b58a36]/30 hover:shadow-md'
                      }`}
                    >

                      {/* Today ring */}
                      {isToday && (
                        <div className="absolute inset-1 rounded-lg border border-[#a77a22]/50" />
                      )}

                      <div className="relative flex items-start justify-between">

                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full font-display text-sm md:h-7 md:w-7 md:text-base ${
                            isToday
                              ? 'bg-[#4c291b] text-[#f8ebd1]'
                              : isSunday
                                ? 'text-[#9a4e29]'
                                : 'text-[#4b281a]'
                          }`}
                        >
                          {dayNumber}
                        </span>

                        {hasGrahan && (
                          <Moon
                            size={12}
                            className="text-[#806047]"
                          />
                        )}
                      </div>

                      {day && (
                        <>
                          {/* Tithi */}
                          <p className="relative mt-2 truncate text-[7px] font-medium text-[#70523d] md:text-[8px]">
                            {day.tithi}
                          </p>

                          {/* Paksha */}
                          {day.paksha && (
                            <p className="relative mt-0.5 truncate text-[6px] text-[#a1846d] md:text-[7px]">
                              {day.paksha}
                            </p>
                          )}

                          {/* Events */}
                          <div className="relative mt-1.5 space-y-1">

                            {hasFestival && (
                              <div className="truncate rounded bg-[#eadbb9] px-1 py-0.5 text-[6px] font-medium text-[#684b1e] md:text-[7px]">
                                {day.festivals?.[0]}
                              </div>
                            )}

                            {hasVrat && (
                              <div className="truncate rounded bg-[#efe5cf] px-1 py-0.5 text-[6px] text-[#765d47] md:text-[7px]">
                                {day.vrat?.[0]}
                              </div>
                            )}

                            {day.chandraGrahan && (
                              <div className="truncate rounded bg-[#eee3ef] px-1 py-0.5 text-[6px] font-medium text-[#654968] md:text-[7px]">
                                Chandra Grahan
                              </div>
                            )}

                            {day.suryaGrahan && (
                              <div className="truncate rounded bg-[#eadbc7] px-1 py-0.5 text-[6px] font-medium text-[#77451e] md:text-[7px]">
                                Surya Grahan
                              </div>
                            )}

                          </div>
                        </>
                      )}

                      {/* Selection dot */}
                      {isSelected && (
                        <span className="absolute bottom-1 right-2 h-1 w-1 rounded-full bg-[#a77a22]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-4 border-t border-[#b58a36]/10 pt-4">

                <LegendItem
                  label="Festival"
                  className="bg-[#eadbb9]"
                />

                <LegendItem
                  label="Vrat"
                  className="bg-[#efe5cf]"
                />

                <LegendItem
                  label="Grahan"
                  className="bg-[#eee3ef]"
                />

                <LegendItem
                  label="Today"
                  className="bg-[#4c291b]"
                />
              </div>
            </div>

            {/* ========================================================== */}
            {/* DETAILS                                                      */}
            {/* ========================================================== */}

            <aside className="border-t border-[#b58a36]/15 bg-[#fcf8ef] p-5 lg:border-l lg:border-t-0 md:p-6">

              {selectedDay ? (
                <DayDetails
                  day={selectedDay}
                  now={now}
                  showFullDetails={showFullDetails}
                  setShowFullDetails={setShowFullDetails}
                />
              ) : (
                <EmptyDetails />
              )}

            </aside>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}

        {nextFestival && (
          <NextFestivalCard
            festival={nextFestival}
            now={now}
          />
        )}

      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                             DAY DETAILS                                    */
/* -------------------------------------------------------------------------- */

function DayDetails({
  day,
  now,
  showFullDetails,
  setShowFullDetails,
}: {
  day: PanchangDay;
  now: Date;
  showFullDetails: boolean;
  setShowFullDetails: (value: boolean) => void;
}) {
  const selectedDate = parseDate(day.date);

  const isSelectedToday =
    selectedDate &&
    toDateKey(selectedDate) === toDateKey(now);

  return (
    <div>

      {/* Date */}
      <div className="border-b border-[#b58a36]/15 pb-4">

        <div className="flex items-start justify-between gap-3">

          <div>
            <p className="text-[8px] uppercase tracking-[0.3em] text-[#9d792f]">
              Daily Panchang
            </p>

            <h3 className="mt-1 font-display text-2xl leading-tight text-[#4b281a]">
              {formatLongDate(day.date)}
            </h3>

            {day.paksha && (
              <p className="mt-1 text-[9px] text-[#8a6d56]">
                {day.paksha}
              </p>
            )}
          </div>

          {isSelectedToday && (
            <span className="shrink-0 rounded-full border border-[#b58a36]/20 bg-[#eee1c2] px-2 py-1 text-[7px] uppercase tracking-wider text-[#70521e]">
              Today
            </span>
          )}
        </div>
      </div>

      {/* Main Panchang */}
      <div className="grid grid-cols-2 gap-2 py-4">

        <DetailCard
          label="Tithi"
          value={day.tithi}
        />

        <DetailCard
          label="Nakshatra"
          value={day.nakshatra}
        />

        <DetailCard
          label="Yoga"
          value={day.yoga}
        />

        <DetailCard
          label="Karana"
          value={day.karana}
        />

        <DetailCard
          label="Tithi Ends"
          value={day.tithiEnds}
        />

        <DetailCard
          label="Nakshatra Ends"
          value={day.nakshatraEnds}
        />
      </div>

      {/* Sun / Moon */}
      <div className="grid grid-cols-2 gap-2">

        <TimeCard
          icon={<Sun size={13} />}
          title="Sun"
          value={
            day.sunrise && day.sunset
              ? `${day.sunrise} — ${day.sunset}`
              : 'Timing unavailable'
          }
        />

        <TimeCard
          icon={<Moon size={13} />}
          title="Moon"
          value={
            day.moonrise && day.moonset
              ? `${day.moonrise} — ${day.moonset}`
              : day.moonPhase ?? 'Timing unavailable'
          }
        />
      </div>

      {/* Show more */}
      <button
        type="button"
        onClick={() =>
          setShowFullDetails(!showFullDetails)
        }
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#b58a36]/20 bg-[#f5ead6] py-2.5 text-[8px] font-medium uppercase tracking-[0.18em] text-[#745523] transition hover:bg-[#eadbbc]"
      >
        <Sparkles size={12} />

        {showFullDetails
          ? 'Show Less'
          : 'View Full Panchang'}
      </button>

      {/* Expanded */}
      {showFullDetails && (
        <div className="mt-4 space-y-3">

          {/* Muhurat */}
          <section className="rounded-2xl border border-[#b58a36]/15 bg-white/65 p-4">

            <SectionLabel>
              Auspicious Timings
            </SectionLabel>

            <TimingRow
              label="Brahma Muhurat"
              value={day.brahmaMuhurat}
            />

            <TimingRow
              label="Abhijit Muhurat"
              value={day.abhijitMuhurat}
            />

            <TimingRow
              label="Vijay Muhurat"
              value={day.vijayMuhurat}
            />

            <TimingRow
              label="Godhuli Muhurat"
              value={day.godhuliMuhurat}
            />
          </section>

          {/* Kaal */}
          <section className="rounded-2xl border border-[#b58a36]/15 bg-white/65 p-4">

            <SectionLabel>
              Inauspicious Timings
            </SectionLabel>

            <TimingRow
              label="Rahu Kaal"
              value={day.rahuKaal}
            />

            <TimingRow
              label="Gulika Kaal"
              value={day.gulikaKaal}
            />

            <TimingRow
              label="Yamaganda"
              value={day.yamaganda}
            />

            <TimingRow
              label="Dur Muhurat"
              value={day.durMuhurat}
            />

            <TimingRow
              label="Varjyam"
              value={day.varjyam}
            />
          </section>

          {/* Events */}
          {(day.festivals?.length ||
            day.vrat?.length ||
            day.sankranti ||
            day.special?.length) && (
            <section>

              <SectionLabel>
                Sacred Observances
              </SectionLabel>

              <div className="space-y-2">

                {day.festivals?.map((festival) => (
                  <EventRow
                    key={`festival-${festival}`}
                    text={festival}
                  />
                ))}

                {day.vrat?.map((vrat) => (
                  <EventRow
                    key={`vrat-${vrat}`}
                    text={vrat}
                  />
                ))}

                {day.sankranti && (
                  <EventRow
                    text={day.sankranti}
                  />
                )}

                {day.special?.map((item) => (
                  <EventRow
                    key={`special-${item}`}
                    text={item}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Grahan */}
          {(day.chandraGrahan ||
            day.suryaGrahan) && (
            <GrahanCard day={day} />
          )}

          {/* Note */}
          <div className="flex gap-2 rounded-xl bg-[#f0e6d3] p-3">
            <Info
              size={13}
              className="mt-0.5 shrink-0 text-[#96712c]"
            />

            <p className="text-[8px] leading-5 text-[#765d49]">
              Panchang, muhurat, sunrise/sunset and
              eclipse timings should be calculated for
              the selected location and Panchang
              tradition.
            </p>
          </div>
        </div>
      )}

      {/* Basic empty state */}
      {!showFullDetails &&
        !day.nakshatra &&
        !day.yoga &&
        !day.karana && (
          <p className="mt-4 text-center text-[8px] leading-5 text-[#977d67]">
            Select a day with available Panchang data
            to view complete details.
          </p>
        )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              GRAHAN                                        */
/* -------------------------------------------------------------------------- */

function GrahanCard({
  day,
}: {
  day: PanchangDay;
}) {
  return (
    <section className="rounded-2xl border border-[#71506e]/20 bg-[#f1e8f2] p-4">

      <div className="flex items-center gap-2">
        <Moon
          size={14}
          className="text-[#634861]"
        />

        <p className="font-display text-base text-[#563b51]">
          Grahan
        </p>
      </div>

      {day.chandraGrahan && (
        <GrahanItem
          title="Chandra Grahan"
          data={day.chandraGrahan}
        />
      )}

      {day.suryaGrahan && (
        <GrahanItem
          title="Surya Grahan"
          data={day.suryaGrahan}
        />
      )}
    </section>
  );
}

function GrahanItem({
  title,
  data,
}: {
  title: string;
  data: GrahanInfo;
}) {
  return (
    <div className="mt-3 rounded-xl border border-[#71506e]/10 bg-white/40 p-3">

      <p className="text-xs font-medium text-[#563b51]">
        {data.name || title}
      </p>

      <div className="mt-2 space-y-1">

        <p className="text-[9px] text-[#795d73]">
          Start: {data.start}
        </p>

        {data.maximum && (
          <p className="text-[9px] text-[#795d73]">
            Maximum: {data.maximum}
          </p>
        )}

        <p className="text-[9px] text-[#795d73]">
          End: {data.end}
        </p>

        {data.sutak && (
          <p className="text-[9px] text-[#795d73]">
            Sutak: {data.sutak}
          </p>
        )}

        <p className="pt-1 text-[8px] font-medium text-[#694e63]">
          {data.visibleInIndia === undefined
            ? 'Visibility information unavailable'
            : data.visibleInIndia
              ? 'Visible in India'
              : 'Not visible in India'}
        </p>

      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                           NEXT FESTIVAL                                    */
/* -------------------------------------------------------------------------- */

function NextFestivalCard({
  festival,
  now,
}: {
  festival: Festival;
  now: Date;
}) {
  const festivalDate = parseDate(
    festival.startDate!
  );

  if (!festivalDate) return null;

  const diff = Math.ceil(
    (festivalDate.getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="mx-auto mt-6 max-w-7xl overflow-hidden rounded-[24px] border border-[#b58a36]/25 bg-gradient-to-br from-[#4b2718] via-[#5a301c] to-[#30160d] px-5 py-5 text-[#f8edd4] shadow-[0_20px_55px_rgba(61,32,18,0.14)] md:px-7">

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <p className="text-[8px] uppercase tracking-[0.3em] text-[#d5b36a]">
            Next Sacred Celebration
          </p>

          <h3 className="mt-1 font-display text-2xl">
            {festival.name}
          </h3>

          <p className="mt-1 text-[9px] text-[#d9c8a8]">
            {formatShortDate(festival.startDate!)}
          </p>
        </div>

        <div className="flex items-center gap-5">

          <div className="hidden h-12 w-px bg-[#d4af37]/25 md:block" />

          <div>
            <p className="font-display text-3xl text-[#d7b45f]">
              {Math.max(diff, 0)}
            </p>

            <p className="text-[7px] uppercase tracking-[0.25em] text-[#d8c8a8]">
              Days Remaining
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                           SMALL COMPONENTS                                 */
/* -------------------------------------------------------------------------- */

function DetailCard({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-xl border border-[#b58a36]/10 bg-white/65 p-3">

      <p className="text-[7px] uppercase tracking-[0.16em] text-[#9a8068]">
        {label}
      </p>

      <p className="mt-1 truncate font-display text-sm text-[#4a291b]">
        {value || '—'}
      </p>
    </div>
  );
}

function TimeCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#b58a36]/10 bg-white/65 p-3">

      <div className="flex items-center gap-2 text-[#9a742d]">
        {icon}

        <span className="text-[7px] uppercase tracking-[0.18em]">
          {title}
        </span>
      </div>

      <p className="mt-2 text-[9px] text-[#624a39]">
        {value}
      </p>
    </div>
  );
}

function TimingRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#b58a36]/10 py-2 last:border-0">

      <span className="text-[8px] text-[#79604c]">
        {label}
      </span>

      <span className="text-right text-[8px] font-medium text-[#4d2c1d]">
        {value || '—'}
      </span>
    </div>
  );
}

function EventRow({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#b58a36]/10 bg-white/60 px-3 py-2">

      <span className="text-xs text-[#b58a36]">
        ✦
      </span>

      <span className="truncate text-[9px] text-[#604836]">
        {text}
      </span>
    </div>
  );
}

function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="mb-2 text-[8px] uppercase tracking-[0.25em] text-[#9a772f]">
      {children}
    </p>
  );
}

function LegendItem({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`h-2 w-2 rounded-sm ${className}`}
      />

      <span className="text-[7px] uppercase tracking-wider text-[#8d725d]">
        {label}
      </span>
    </div>
  );
}

function EmptyDetails() {
  return (
    <div className="flex min-h-[380px] items-center justify-center text-center">

      <div>
        <div className="font-display text-6xl text-[#b58a36]/25">
          ॐ
        </div>

        <h3 className="mt-4 font-display text-xl text-[#4b281a]">
          Select a sacred day
        </h3>

        <p className="mx-auto mt-2 max-w-[220px] text-[9px] leading-5 text-[#8a705b]">
          Choose any date from the calendar to
          explore its Panchang details.
        </p>
      </div>
    </div>
  );
}