'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Calendar from '@/components/Calendar'
import LocationSearch from '@/components/LocationSearch'
import { LogIn, LogOut } from 'lucide-react'

interface User {
  id: string
  redditUsername: string
}

interface Event {
  id: string
  title: string
  date: string
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [username, setUsername] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventLocationDetail, setEventLocationDetail] = useState<{
    label: string
    name: string
    address: string
    placeId?: string
    latitude?: number
    longitude?: number
  } | null>(null)
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    fetchEvents()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events')
      if (!res.ok) {
        throw new Error(`Failed to fetch events: ${res.status}`)
      }
      const data = await res.json()
      setEvents(Array.isArray(data.events) ? data.events : [])
    } catch (error) {
      console.error('Failed to fetch events:', error)
      setEvents([])
    }
  }


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redditUsername: username }),
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
        setUsername('')
      } else {
        alert(data.error)
      }
    } catch (error) {
      alert('Login failed')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleDateClick = (date: Date) => {
    if (!user) {
      alert('Please login to create events')
      return
    }
    setSelectedDate(date)
    setShowCreateModal(true)
  }

  const handleEventClick = (eventId: string) => {
    router.push(`/events/${eventId}`)
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate) return

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDescription,
          date: selectedDate.toISOString(),
          location: eventLocation || undefined,
          startTime: eventStartTime ? new Date(eventStartTime).toISOString() : undefined,
          endTime: eventEndTime ? new Date(eventEndTime).toISOString() : undefined,
        }),
      })
      const data = await res.json()
      if (data.event) {
        setEvents([...events, data.event])
        // If we captured a location with details, create an initial restaurant option
        if (eventLocationDetail) {
          fetch(`/api/events/${data.event.id}/restaurants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: eventLocationDetail.name,
              address: eventLocationDetail.address,
              placeId: eventLocationDetail.placeId,
              latitude: eventLocationDetail.latitude,
              longitude: eventLocationDetail.longitude,
            }),
          }).catch(() => {})
        }
        // If start/end provided, create initial time slot
        if (eventStartTime && eventEndTime) {
          fetch(`/api/events/${data.event.id}/time-slots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              startTime: new Date(eventStartTime).toISOString(),
              endTime: new Date(eventEndTime).toISOString(),
            }),
          }).catch(() => {})
        }
        setShowCreateModal(false)
        setEventTitle('')
        setEventDescription('')
        setEventLocation('')
        setEventLocationDetail(null)
        setEventStartTime('')
        setEventEndTime('')
        setSelectedDate(null)
      }
    } catch (error) {
      alert('Failed to create event')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f0e8] text-[#5f5a55]">
        <div className="glass-panel px-6 py-4 text-sm font-semibold">Loading the calendar...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-lg font-semibold text-[#1f1f1f]">Reddit Shared Calendar</div>

          {user ? (
            <div className="flex items-center gap-3 bg-white/90 border border-[var(--card-border)] rounded-full px-3 py-2 shadow-sm">
              <span className="text-sm text-[#5f5a55]">Signed in as</span>
              <span className="font-semibold text-[#1f1f1f]">u/{user.redditUsername}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-[#2f8f66] text-white rounded-full shadow hover:brightness-95 transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleLogin}
              className="flex flex-col sm:flex-row gap-3 items-center bg-white/90 border border-[var(--card-border)] rounded-full px-3 py-2 shadow-sm w-full sm:w-auto"
            >
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Reddit username"
                className="w-full sm:w-60 bg-transparent px-4 py-2 rounded-full text-sm text-[#1f1f1f] placeholder:text-[#8c8379] border border-transparent focus:border-[#dbeee4] focus:ring-2 focus:ring-[#2f8f66]/30"
                required
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 bg-[#2f8f66] text-white rounded-full shadow hover:brightness-95 transition"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
            </form>
          )}
        </header>

        <section className="text-center mt-12 space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-[#1b1b1b]">
            /r/aucklandeats meetup calendar
          </h1>
        </section>

        <div className="glass-panel mt-12 p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr,1.35fr] items-start">
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="soft-card p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f5a55]">
                    Events
                  </div>
                  <div className="text-3xl font-semibold text-[#1f1f1f]">{events.length}</div>
                  <p className="text-sm text-[#5f5a55]">upcoming gatherings on the calendar</p>
                </div>
                <div className="soft-card p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f5a55]">
                    Next up
                  </div>
                  <div className="text-lg font-semibold text-[#1f1f1f]">
                    {events[0] ? events[0].title : 'No upcoming events'}
                  </div>
                  <p className="text-sm text-[#5f5a55]">
                    {events[0]
                      ? new Date(events[0].date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Add one to get started'}
                  </p>
                </div>
              </div>
            </div>

            <div className="soft-card p-4 sm:p-6">
              <Calendar
                events={(events || []).map(e => ({ ...e, date: new Date(e.date) }))}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
              />
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/95 border border-[var(--card-border)] rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[#5f5a55]">New event</p>
                <h2 className="text-2xl font-semibold text-[#1f1f1f]">Create an event</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-sm text-[#5f5a55] hover:text-[#1f1f1f]"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4b453f] mb-1">Date</label>
                <input
                  type="text"
                  value={selectedDate?.toLocaleDateString()}
                  disabled
                  className="w-full px-3 py-2 border border-[var(--card-border)] rounded-xl bg-[#f9f3ea] text-[#5f5a55]"
                  placeholder="Select a date"
                  title="Selected date"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#4b453f] mb-1">Start time (optional)</label>
                  <input
                    type="datetime-local"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--card-border)] rounded-xl focus:ring-2 focus:ring-[#2f8f66]/30 focus:border-[#2f8f66]/50 bg-white/90"
                    aria-label="Start time"
                    placeholder="Start time"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4b453f] mb-1">End time (optional)</label>
                  <input
                    type="datetime-local"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--card-border)] rounded-xl focus:ring-2 focus:ring-[#2f8f66]/30 focus:border-[#2f8f66]/50 bg-white/90"
                    aria-label="End time"
                    placeholder="End time"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4b453f] mb-1">Location (optional)</label>
                <LocationSearch
                  onSelect={(loc) => {
                    setEventLocation(loc.label)
                    setEventLocationDetail(loc)
                  }}
                  placeholder="Search for a venue or area"
                />
                {eventLocation && (
                  <p className="mt-1 text-xs text-[#5f5a55]">
                    Selected: <span className="font-semibold text-[#1f1f1f]">{eventLocation}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4b453f] mb-1">Title</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--card-border)] rounded-xl focus:ring-2 focus:ring-[#2f8f66]/30 focus:border-[#2f8f66]/50 bg-white/90"
                  required
                  placeholder="Event title"
                  title="Event title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4b453f] mb-1">Description</label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--card-border)] rounded-xl focus:ring-2 focus:ring-[#2f8f66]/30 focus:border-[#2f8f66]/50 bg-white/90"
                  rows={3}
                  placeholder="Add details"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-[var(--card-border)] rounded-xl text-[#4b453f] hover:bg-[#f9f3ea]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#2f8f66] text-white rounded-xl shadow hover:brightness-95"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
