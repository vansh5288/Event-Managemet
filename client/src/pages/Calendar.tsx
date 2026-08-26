import { useState } from 'react';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const isToday = (day: number) => {
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  // Mock events for demo
  const events: Record<number, { title: string; color: string }[]> = {
    5: [{ title: 'Tech Conference', color: '#3b82f6' }],
    12: [{ title: 'Design Workshop', color: '#8b5cf6' }],
    15: [{ title: 'Networking Meetup', color: '#10b981' }],
    20: [{ title: 'Music Festival', color: '#f59e0b' }],
    25: [{ title: 'Startup Pitch', color: '#ec4899' }],
  };

  const calendarDays = [];
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthDays - i, currentMonth: false });
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, currentMonth: true });
  }
  // Next month days
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, currentMonth: false });
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-gray-500 mt-1">View and manage your event schedule</p>
      </motion.div>

      <motion.div variants={item} className="card p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="btn-ghost p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h2 className="text-xl font-semibold">{months[month]} {year}</h2>
          <button onClick={nextMonth} className="btn-ghost p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {days.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(({ day, currentMonth }, i) => (
            <div
              key={i}
              className={`min-h-[80px] p-1 rounded-lg border border-transparent transition-colors ${
                currentMonth ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-30'
              } ${isToday(day) ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-blue-600' : ''}`}>
                {day}
              </div>
              {events[day]?.map((event, j) => (
                <div
                  key={j}
                  className="text-xs px-1.5 py-0.5 rounded mb-0.5 truncate text-white"
                  style={{ backgroundColor: event.color }}
                >
                  {event.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Upcoming Events */}
      <motion.div variants={item} className="card p-6">
        <h3 className="font-semibold text-lg mb-4">Upcoming Events</h3>
        <div className="space-y-3">
          {Object.entries(events).map(([day, eventList]) => (
            eventList.map((event, i) => (
              <div key={`${day}-${i}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: event.color }}>
                  {day}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-gray-500">{months[month]} {day}, {year}</p>
                </div>
                <button className="btn-ghost text-sm">View</button>
              </div>
            ))
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
