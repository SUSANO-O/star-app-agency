import { memo, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { useAgencyActions } from '../../hooks/useAgencySync';
import { useAppStore } from '../../lib/store';

interface CalendarViewProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'warning') => void;
  googleConnected: boolean;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  let startPad = first.getDay() - 1;
  if (startPad < 0) startPad = 6;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  return cells;
}

export const CalendarView = memo(({ onToast, googleConnected }: CalendarViewProps) => {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('12:00');
  const [saving, setSaving] = useState(false);

  const calendarEvents = useAppStore((s) => s.calendarEvents);
  const { addCalendarEventRemote, deleteCalendarEventRemote } = useAgencyActions();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const eventsForDay = (date: Date) => {
    const key = date.toISOString().slice(0, 10);
    return calendarEvents.filter((e) => e.startAt?.slice(0, 10) === key);
  };

  const handleAddEvent = async () => {
    if (!selectedDate || !eventTitle.trim()) return;
    setSaving(true);
    try {
      const [h, m] = eventTime.split(':').map(Number);
      const start = new Date(selectedDate);
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      await addCalendarEventRemote({
        title: eventTitle.trim(),
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        type: 'other',
        color: 'bg-fuchsia-500',
      });

      onToast(
        googleConnected
          ? 'Event created and synced with Google Calendar'
          : 'Event created (connect Google Calendar to sync)',
        'success',
      );
      setEventTitle('');
      setSelectedDate(null);
    } catch {
      onToast('Failed to create event', 'error');
    } finally {
      setSaving(false);
    }
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter capitalize">
            {monthLabel}
          </h2>
          {googleConnected && (
            <p className="text-xs text-emerald-600 font-semibold mt-1">Synced with Google Calendar</p>
          )}
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => setViewDate(new Date())}
            className="px-4 py-2 text-xs font-black bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {selectedDate && (
        <div className="bg-gradient-to-r from-fuchsia-50 to-cyan-50 border-2 border-fuchsia-200 p-4 sm:p-6 rounded-3xl animate-in slide-in-from-top-4">
          <h3 className="text-base sm:text-lg font-black text-slate-900 mb-4">
            New event — {selectedDate.toLocaleDateString('en-US')}
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Event name"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-fuchsia-200 focus:border-fuchsia-500 focus:outline-none font-semibold"
            />
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-fuchsia-200 focus:border-fuchsia-500 focus:outline-none font-semibold"
            />
            <button
              type="button"
              onClick={handleAddEvent}
              disabled={saving || !eventTitle.trim()}
              className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-black rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDate(null);
                setEventTitle('');
              }}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto -mx-1 px-1 pb-2">
        <div className="min-w-[320px] grid grid-cols-7 gap-1 sm:gap-2 md:gap-4">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2"
            >
              {d}
            </div>
          ))}
          {grid.map((date, i) => {
            if (!date) {
              return <div key={`empty-${i}`} className="min-h-[72px] sm:min-h-[100px]" />;
            }
            const dayEvents = eventsForDay(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate?.toDateString() === date.toDateString();

            return (
              <div
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`min-h-[72px] sm:min-h-[100px] md:min-h-[120px] bg-white border p-1.5 sm:p-2 md:p-4 rounded-xl sm:rounded-2xl transition-all cursor-pointer ${
                  isSelected
                    ? 'border-fuchsia-500 shadow-lg'
                    : dayEvents.length
                      ? 'border-fuchsia-200'
                      : 'border-slate-50 hover:border-fuchsia-200'
                }`}
              >
                <span
                  className={`text-xs sm:text-sm font-black inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${
                    isToday
                      ? 'bg-fuchsia-500 text-white shadow-lg'
                      : dayEvents.length
                        ? 'text-fuchsia-600'
                        : 'text-slate-400'
                  }`}
                >
                  {date.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div key={event.id} className="group flex items-start gap-1">
                      <div className={`h-1.5 w-full ${event.color} rounded-full shrink-0 mt-1.5`} />
                      <div className="flex-1 min-w-0 hidden sm:block">
                        <p className="text-[9px] font-bold text-slate-600 truncate">{event.title}</p>
                        {event.syncStatus === 'synced' && (
                          <p className="text-[8px] text-emerald-500">Google ✓</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCalendarEventRemote(event.id);
                          onToast('Event deleted', 'success');
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-0.5"
                        aria-label="Delete event"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

CalendarView.displayName = 'CalendarView';
