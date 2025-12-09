'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarProps {
  events: Array<{ id: string; title: string; date: Date }>
  onDateClick: (date: Date) => void
  onEventClick: (eventId: string) => void
}

export default function Calendar({ events, onDateClick, onEventClick }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Calculate the starting day of the week for the month
  const startDay = monthStart.getDay()
  const emptyDays = Array(startDay).fill(null)

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date))
  }

  return (
    <div className="bg-white/92 border border-[var(--card-border)] rounded-2xl shadow-[0_25px_70px_rgba(25,19,10,0.12)] p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#1f1f1f]">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full bg-[#f3f0e8] text-[#2f8f66] hover:shadow-sm transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full bg-[#f3f0e8] text-[#2f8f66] hover:shadow-sm transition"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-[#5f5a55] text-sm py-2">
            {day}
          </div>
        ))}

        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {days.map(day => {
          const dayEvents = getEventsForDay(day)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toString()}
              className={`aspect-square border rounded-xl p-1.5 cursor-pointer bg-white/85 hover:shadow-md hover:-translate-y-[1px] transition ${
                !isSameMonth(day, currentMonth) ? 'opacity-50' : ''
              } ${isToday ? 'border-[#2f8f66] ring-2 ring-[#2f8f66]/20' : 'border-[var(--card-border)]'}`}
              onClick={() => onDateClick(day)}
            >
              <div className="text-sm font-semibold text-right text-[#1f1f1f]">{format(day, 'd')}</div>
              <div className="mt-2 space-y-1">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick(event.id)
                    }}
                    className="text-xs bg-[#2f8f66] text-white rounded-lg px-1.5 py-0.5 truncate hover:brightness-95 shadow-sm"
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
