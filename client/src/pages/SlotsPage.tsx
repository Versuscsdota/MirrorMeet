import { useState, useEffect } from 'react';
import { Slot, Model, ModelStatus } from '../types';
import { slotsAPI, modelsAPI } from '../services/api';
import SlotModal from '../components/SlotModal';
import toast from 'react-hot-toast';

// Status labels for legend
const StatusLabels = {
  [ModelStatus.NOT_CONFIRMED]: 'Не подтверждена',
  [ModelStatus.CONFIRMED]: 'Подтверждена',
  [ModelStatus.DRAINED]: 'Слита',
  [ModelStatus.REGISTERED]: 'Зарегистрирована',
  [ModelStatus.CANDIDATE_REFUSED]: 'Отказ кандидата',
  [ModelStatus.OUR_REFUSAL]: 'Наш отказ',
  [ModelStatus.THINKING]: 'Думает'
};

export default function SlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [now, setNow] = useState<Date>(new Date());
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(new Date().getMonth()); // 0-11

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  const loadData = async () => {
    try {
      const [slotsData, modelsData] = await Promise.all([
        slotsAPI.getAll(),
        modelsAPI.getAll()
      ]);
      setSlots(slotsData);
      setModels(modelsData);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = (date?: string, time?: string) => {
    const newSlot = {
      date: date || selectedDate,
      time: time || '12:00'
    };
    setSelectedSlot(newSlot as Slot);
    setIsCreateMode(true);
    setIsModalOpen(true);
  };

  const handleEdit = (slot: Slot) => {
    setSelectedSlot(slot);
    setIsCreateMode(false);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Partial<Slot>) => {
    try {
      if (isCreateMode) {
        await slotsAPI.create(data as any);
        toast.success('Слот создан');
      } else if (selectedSlot) {
        await slotsAPI.update(selectedSlot.id, data);
        toast.success('Слот обновлен');
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('Ошибка сохранения');
    }
  };

  const getLinkedModel = (modelId?: string) => {
    if (!modelId) return null;
    return models.find(m => m.id === modelId);
  };

  // Helpers for time grid (12:00 – 18:30, step 30m)
  const times: string[] = (() => {
    const res: string[] = [];
    const start = 12 * 60; // 12:00
    const end = 18 * 60 + 30; // 18:30
    for (let m = start; m <= end; m += 30) {
      const hh = Math.floor(m / 60).toString().padStart(2, '0');
      const mm = (m % 60).toString().padStart(2, '0');
      res.push(`${hh}:${mm}`);
    }
    return res;
  })();

  const slotsFor = (date: string, time: string) =>
    slots.filter(s => s.date === date && s.time === time);

  const formatRuDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return `${day} ${d.toLocaleDateString('ru-RU', { month: 'long' })} ${year} г.`;
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="slots-page slots-layout">
      <aside className="slots-sidebar">
        <div className="sidebar-header">
          <h2>Календарь</h2>
          <div className="sidebar-clock">
            {now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            <div className="sidebar-date">{now.toLocaleDateString('ru-RU')}</div>
          </div>
        </div>

        <div className="month-card card">
          <div className="month-header">
            <button className="month-nav" aria-label="Предыдущий месяц" onClick={() => {
              const d = new Date(viewYear, viewMonth - 1, 1);
              setViewYear(d.getFullYear());
              setViewMonth(d.getMonth());
            }}>‹</button>
            <div className="month-title">
              {new Date(viewYear, viewMonth, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
              <span className="caret">▾</span>
            </div>
            <button className="month-nav" aria-label="Следующий месяц" onClick={() => {
              const d = new Date(viewYear, viewMonth + 1, 1);
              setViewYear(d.getFullYear());
              setViewMonth(d.getMonth());
            }}>›</button>
            <button className="today-link" onClick={() => {
              const t = new Date();
              setViewYear(t.getFullYear());
              setViewMonth(t.getMonth());
              const year = t.getFullYear();
              const month = String(t.getMonth() + 1).padStart(2, '0');
              const day = String(t.getDate()).padStart(2, '0');
              setSelectedDate(`${year}-${month}-${day}`);
            }}>Сегодня</button>
          </div>
          <MiniMonth
            year={viewYear}
            month={viewMonth}
            selectedDate={selectedDate}
            onSelect={(iso) => setSelectedDate(iso)}
          />
        </div>

        <button onClick={() => handleCreate()} className="btn btn-primary btn-block create-slot-btn">+ Создать слот</button>

        <div className="legend card">
          <h4>Обозначение цветов</h4>
          <ul>
            <LegendItem cls="not_confirmed" label={StatusLabels[ModelStatus.NOT_CONFIRMED]} />
            <LegendItem cls="confirmed" label={StatusLabels[ModelStatus.CONFIRMED]} />
            <LegendItem cls="drained" label={StatusLabels[ModelStatus.DRAINED]} />
            <LegendItem cls="registered" label={StatusLabels[ModelStatus.REGISTERED]} />
            <LegendItem cls="candidate_refused" label={StatusLabels[ModelStatus.CANDIDATE_REFUSED]} dashed />
            <LegendItem cls="our_refusal" label={StatusLabels[ModelStatus.OUR_REFUSAL]} />
            <LegendItem cls="thinking" label={StatusLabels[ModelStatus.THINKING]} />
          </ul>
        </div>
      </aside>

      <main className="slots-main">
        <div className="day-header">
          <h3>{formatRuDate(selectedDate)}</h3>
        </div>

        <div className="day-grid">
          {times.map((t) => {
            const items = slotsFor(selectedDate, t);
            return (
              <div key={t} className="time-column">
                <div className="time-label">{t}</div>
                <div className="time-stack card">
                  {/* Always show 2 slots - occupied or free */}
                  {[0, 1].map((slotIndex) => {
                    const slot = items[slotIndex];
                    if (slot) {
                      const linkedModel = getLinkedModel(slot.modelId);
                      // Use interview status for color instead of main status
                      const interviewStatus = slot.status2 || slot.status1 || slot.status;
                      return (
                        <div 
                          key={slot.id} 
                          className={`slot-chip ${interviewStatus}`}
                          onClick={() => handleEdit(slot)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="chip-title">
                            {linkedModel ? linkedModel.name : (slot.clientName || 'Без модели')}
                            {(slot.birthDate || slot.documentType || slot.internshipDate || slot.photo || slot.audio) && (
                              <span className="registration-badge" title="Есть данные регистрации">📋</span>
                            )}
                          </div>
                          {(linkedModel?.phone || slot.clientPhone) && (
                            <div className="chip-sub">{linkedModel?.phone || slot.clientPhone}</div>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <div 
                          key={`free-${slotIndex}`}
                          className="free-slot"
                          onClick={() => handleCreate(selectedDate, t)}
                          style={{ cursor: 'pointer' }}
                        >
                          Свободно
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {isModalOpen && (
        <SlotModal
          slot={selectedSlot}
          slots={slots}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Sidebar legend item component
function LegendItem({ cls, label, dashed }: { cls: string; label: string; dashed?: boolean }) {
  return (
    <li className="legend-item">
      <span className={`legend-dot ${cls} ${dashed ? 'dashed' : ''}`}></span>
      <span>{label}</span>
    </li>
  );
}

// Minimal month calendar (no external deps)
function MiniMonth({ year, month, selectedDate, onSelect }: { year: number; month: number; selectedDate: string; onSelect: (d: string) => void }) {
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDaysInMonth = new Date(year, month, 0).getDate();

  // Build 6 rows x 7 days = 42 cells
  const cells: { date: Date; inCurrent: boolean }[] = [];
  // Leading from prev month
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevDaysInMonth - i), inCurrent: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inCurrent: true });
  }
  // Trailing to next month
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    const inCurrent = next.getMonth() === month;
    cells.push({ date: next, inCurrent });
  }

  const toISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const today = new Date();
  const todayISO = toISO(today);

  return (
    <div className="mini-month">
      <div className="weekdays">
        {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(w => <span key={w}>{w}</span>)}
      </div>
      <div className="days">
        {cells.map((cell, idx) => {
          const iso = toISO(cell.date);
          const active = iso === selectedDate;
          const isToday = iso === todayISO;
          return (
            <button
              key={idx}
              className={`day ${active ? 'active' : ''} ${cell.inCurrent ? '' : 'muted'} ${isToday ? 'today' : ''}`}
              onClick={() => onSelect(iso)}
            >
              {cell.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
