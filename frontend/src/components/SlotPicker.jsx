import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarIcon,
  ClockIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from './Icons';

const SlotPicker = ({ selectedSlots = [], onSelect }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [days, setDays] = useState([]);

  // All times are generated and displayed in UTC to simulate "Venue Time" consistently.

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const res = await axios.get('/api/speaker-portal/available-slots');
      setSlots(res.data);
      
      // Group slots by day string (YYYY-MM-DD for consistency)
      const dayMap = {};
      res.data.forEach(s => {
        // We use UTC date to group because backend generates slots at UTC 00:00 for the day
        const dateObj = new Date(s.time);
        const dayKey = dateObj.toISOString().split('T')[0];
        if (!dayMap[dayKey]) dayMap[dayKey] = [];
        dayMap[dayKey].push(s);
      });
      
      // Sort days chronologically
      const dayKeys = Object.keys(dayMap).sort();
      setDays(dayKeys);
      
      // Important: Always set an initial day if not set
      if (dayKeys.length > 0 && !selectedDay) {
        setSelectedDay(dayKeys[0]);
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (clickedTime) => {
    let newSelected = [...selectedSlots];
    
    if (newSelected.includes(clickedTime)) {
      // Remove slot
      newSelected = newSelected.filter(t => t !== clickedTime);
    } else {
      // Add slot
      // Check if it's the same day as previous selections
      if (newSelected.length > 0) {
        const firstDay = new Date(newSelected[0]).toDateString();
        const clickedDay = new Date(clickedTime).toDateString();
        if (firstDay !== clickedDay) {
          // If different day, reset selection to just the new slot
          newSelected = [clickedTime];
        } else {
          newSelected.push(clickedTime);
        }
      } else {
        newSelected.push(clickedTime);
      }
    }
    
    // Sort and check contiguity
    newSelected.sort();
    
    // Optional: Validate contiguity. If not contiguous, we could alert or just allow it and let the backend handle it.
    // For a better UX, let's just sort them.
    
    onSelect(newSelected);
  };

  const changeDate = (direction) => {
    const currentIndex = days.indexOf(selectedDay);
    if (direction === 'next' && currentIndex < days.length - 1) {
      setSelectedDay(days[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setSelectedDay(days[currentIndex - 1]);
    }
  };

  const daySlots = slots.filter(s => s.time.startsWith(selectedDay));

  const formatDayLabel = (dayKey) => {
    if (!dayKey) return '';
    // Parse YYYY-MM-DD parts to avoid timezone ambiguity
    const [y, m, d] = dayKey.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC'
    });
  };

  const formatDayShort = (dayKey) => {
    const [y, m, d] = dayKey.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return {
      month: date.toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' }),
      day: date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', timeZone: 'UTC' }),
    };
  };

  const totalDuration = selectedSlots.length * 30;

  if (loading) return (
    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-400 text-sm font-bold">
      Fetching room availability...
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Day Selector with Navigation */}
      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-200">
        <button 
          onClick={() => changeDate('prev')}
          disabled={days.indexOf(selectedDay) === 0}
          className="p-2 hover:bg-white rounded-xl disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Change Date</span>
          <span className="text-sm font-black text-slate-800 uppercase">{formatDayLabel(selectedDay)}</span>
        </div>

        <button 
          onClick={() => changeDate('next')}
          disabled={days.indexOf(selectedDay) === days.length - 1}
          className="p-2 hover:bg-white rounded-xl disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          <ChevronRightIcon className="h-5 w-5 text-slate-600" />
        </button>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar border-b border-slate-100 mb-4">
        {days.map(day => (
          <button
            key={day}
            type="button"
            onClick={() => setSelectedDay(day)}
            className={`
              shrink-0 px-5 py-3 rounded-2xl text-[11px] font-black uppercase transition-all flex flex-col items-center min-w-[80px]
              ${selectedDay === day 
                ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100' 
                : 'bg-white border border-slate-200 text-slate-400 hover:border-blue-300'}
            `}
          >
            <span className="opacity-60 text-[9px] mb-1">
              {formatDayShort(day).month}
            </span>
            <span className="text-sm">
              {formatDayShort(day).day}
            </span>
          </button>
        ))}
      </div>

      {/* Grid of Slots */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {daySlots.map(slot => {
          const isSelected = selectedSlots.includes(slot.time);
          const timeLabel = new Date(slot.time).toLocaleTimeString([], { 
            hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
          });
          
          return (
            <button
              key={slot.time}
              type="button"
              disabled={!slot.available}
              onClick={() => handleSlotClick(slot.time)}
              className={`
                relative p-4 rounded-2xl border-2 text-left transition-all group
                ${!slot.available 
                  ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed' 
                  : isSelected 
                    ? 'bg-blue-50 border-blue-600 shadow-md ring-2 ring-blue-100' 
                    : 'bg-white border-slate-100 hover:border-blue-300'}
              `}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm font-black ${isSelected ? 'text-blue-700' : 'text-slate-900'}`}>
                  {timeLabel}
                </span>
                {slot.available ? (
                  isSelected && <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                ) : (
                  <InformationCircleIcon className="h-4 w-4 text-slate-300" />
                )}
              </div>
              
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`
                  text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full
                  ${slot.available 
                    ? (isSelected ? 'bg-blue-600 text-white' : 'bg-emerald-50 text-emerald-600')
                    : 'bg-slate-200 text-slate-500'}
                `}>
                  {slot.available ? 'Available' : 'Full'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-black text-blue-700 uppercase tracking-tight">Multi-Slot Selection</p>
            <p className="text-blue-600/70 text-[11px] font-medium leading-relaxed mt-1">
              Select multiple 30-minute slots to define your session duration. 
              Please ensure slots are contiguous for a single session.
            </p>
          </div>
        </div>

        <div className="w-full md:w-48 p-4 bg-white rounded-2xl border-2 border-blue-600 shadow-xl shadow-blue-50 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Duration</span>
            <span className="text-2xl font-black text-blue-600">{totalDuration}</span>
            <span className="text-[10px] font-black text-blue-600 uppercase">Minutes</span>
        </div>
      </div>
    </div>
  );
};

export default SlotPicker;
