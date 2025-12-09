'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import RestaurantSearch from '@/components/RestaurantSearch'
import { ThumbsUp, Calendar, Clock, MapPin, MessageCircle, Users, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

interface User {
  id: string
  redditUsername: string
}

interface Restaurant {
  id: string
  name: string
  address: string
  placeId?: string
  latitude?: number
  longitude?: number
  votes: Array<{ user: User }>
}

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  votes: Array<{ user: User }>
}

interface RSVP {
  id: string
  status: string
  user: User
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: User
}

interface Event {
  id: string
  title: string
  description?: string
  date: string
  startTime?: string | null
  endTime?: string | null
  location?: string | null
  createdBy: User
  restaurants: Restaurant[]
  timeSlots: TimeSlot[]
  rsvps: RSVP[]
  comments: Comment[]
}

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [comment, setComment] = useState('')
  const [showRestaurantSearch, setShowRestaurantSearch] = useState(false)
  const [showTimeSlotForm, setShowTimeSlotForm] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isFiringConfetti, setIsFiringConfetti] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchEvent()
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
    }
  }

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${resolvedParams.id}`)
      const data = await res.json()
      setEvent(data.event)
    } catch (error) {
      console.error('Failed to fetch event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fireConfetti = async () => {
    if (isFiringConfetti) return
    setIsFiringConfetti(true)
    try {
      const { default: confetti } = await import('canvas-confetti')
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.65 },
        ticks: 200,
        scalar: 1.1,
      })
    } catch (error) {
      console.warn('Confetti failed to load', error)
    } finally {
      setTimeout(() => setIsFiringConfetti(false), 1200)
    }
  }

  const handleRSVP = async (status: string) => {
    if (!user) {
      alert('Please login to RSVP')
      return
    }

    try {
      await fetch(`/api/events/${resolvedParams.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchEvent()
      if (status === 'going') {
        fireConfetti()
      }
    } catch (error) {
      alert('Failed to RSVP')
    }
  }

  const handleRestaurantVote = async (restaurantId: string, hasVoted: boolean) => {
    if (!user) {
      alert('Please login to vote')
      return
    }

    try {
      const method = hasVoted ? 'DELETE' : 'POST'
      await fetch(`/api/restaurants/${restaurantId}/vote`, { method })
      fetchEvent()
    } catch (error) {
      alert('Failed to vote')
    }
  }

  const handleTimeSlotVote = async (timeSlotId: string, hasVoted: boolean) => {
    if (!user) {
      alert('Please login to vote')
      return
    }

    try {
      const method = hasVoted ? 'DELETE' : 'POST'
      await fetch(`/api/time-slots/${timeSlotId}/vote`, { method })
      fetchEvent()
    } catch (error) {
      alert('Failed to vote')
    }
  }

  const handleAddRestaurant = async (restaurant: { name: string; address: string; placeId: string; latitude: number; longitude: number }) => {
    try {
      await fetch(`/api/events/${resolvedParams.id}/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurant),
      })
      setShowRestaurantSearch(false)
      fetchEvent()
    } catch (error) {
      alert('Failed to add restaurant')
    }
  }

  const handleAddTimeSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch(`/api/events/${resolvedParams.id}/time-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime, endTime }),
      })
      setShowTimeSlotForm(false)
      setStartTime('')
      setEndTime('')
      fetchEvent()
    } catch (error) {
      alert('Failed to add time slot')
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Please login to comment')
      return
    }

    try {
      await fetch(`/api/events/${resolvedParams.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment }),
      })
      setComment('')
      fetchEvent()
    } catch (error) {
      alert('Failed to add comment')
    }
  }

  const handleDeleteEvent = async () => {
    if (!event) return
    if (!confirm('Delete this event? This cannot be undone.')) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/events/${resolvedParams.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete event')
      }
    } catch (error) {
      alert('Failed to delete event')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f0e8] text-[#5f5a55]">
        <div className="glass-panel px-6 py-4 text-sm font-semibold">Loading event...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f0e8] text-[#5f5a55]">
        <div className="glass-panel px-6 py-4 text-sm font-semibold">Event not found</div>
      </div>
    )
  }

  const myRSVP = event.rsvps.find(r => r.user.id === user?.id)
  const goingCount = event.rsvps.filter(r => r.status === 'going').length
  const isAdmin = user?.redditUsername?.toLowerCase() === 'ancient_lettuce6821'
  const startTimeValue = event.startTime ? new Date(event.startTime) : null
  const endTimeValue = event.endTime ? new Date(event.endTime) : null
  const goingList = event.rsvps.filter(r => r.status === 'going')

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex items-center justify-between gap-4 mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-[#2f8f66] bg-white/80 border border-[var(--card-border)] rounded-full px-4 py-2 shadow-sm hover:shadow transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to calendar
          </button>
          <span className="rounded-full bg-white/90 border border-[var(--card-border)] px-4 py-2 text-sm font-semibold text-[#2f8f66] shadow-sm">
            /r/aucklandeats
          </span>
          {(user?.id === event.createdBy.id || isAdmin) && (
            <button
              onClick={handleDeleteEvent}
              disabled={isDeleting}
              className="text-sm text-[#b23b3b] border border-[#e6b3b3] bg-white/85 rounded-full px-4 py-2 shadow-sm hover:bg-[#f7eaea] disabled:opacity-60"
            >
              {isDeleting ? 'Deleting...' : 'Delete event'}
            </button>
          )}
        </header>

        <div className="glass-panel p-6 sm:p-8 space-y-6">
          <div className="soft-card p-6 sm:p-7">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#2f8f66] font-semibold">
                  Shared meetup
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#1f1f1f] mb-2">{event.title}</h1>
                {event.description && (
                  <p className="text-[#5f5a55]">{event.description}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-[#5f5a55]">
                <div className="flex items-center gap-2 bg-white/70 border border-[var(--card-border)] rounded-full px-3 py-1.5">
                  <Calendar className="w-4 h-4 text-[#2f8f66]" />
                  {format(new Date(event.date), 'MMMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2 bg-white/70 border border-[var(--card-border)] rounded-full px-3 py-1.5">
                  <Users className="w-4 h-4 text-[#2f8f66]" />
                  {goingCount} going
                </div>
                <div className="flex items-center gap-2 bg-white/70 border border-[var(--card-border)] rounded-full px-3 py-1.5">
                  Created by <span className="font-semibold text-[#1f1f1f]">u/{event.createdBy.redditUsername}</span>
                </div>
            {event.location && (
              <div className="flex items-center gap-2 bg-white/70 border border-[var(--card-border)] rounded-full px-3 py-1.5">
                <MapPin className="w-4 h-4 text-[#2f8f66]" />
                {event.location}
              </div>
            )}
            {startTimeValue && (
              <div className="flex items-center gap-2 bg-white/70 border border-[var(--card-border)] rounded-full px-3 py-1.5">
                <Clock className="w-4 h-4 text-[#2f8f66]" />
                {format(startTimeValue, 'MMM d, yyyy h:mm a')}
                {endTimeValue ? ` – ${format(endTimeValue, 'h:mm a')}` : ''}
              </div>
            )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleRSVP('going')}
                  className={`px-4 py-2 rounded-full border font-semibold transition ${
                    myRSVP?.status === 'going'
                      ? 'bg-[#2f8f66] text-white border-transparent shadow'
                      : 'bg-white/80 border-[var(--card-border)] text-[#1f1f1f] hover:bg-[#f9f3ea]'
                  }`}
                >
                  Going
                </button>
                <button
                  onClick={() => handleRSVP('maybe')}
                  className={`px-4 py-2 rounded-full border font-semibold transition ${
                    myRSVP?.status === 'maybe'
                      ? 'bg-[#f3c77c] text-[#1f1f1f] border-[#f3c77c]'
                      : 'bg-white/80 border-[var(--card-border)] text-[#1f1f1f] hover:bg-[#f9f3ea]'
                  }`}
                >
                  Maybe
                </button>
                <button
                  onClick={() => handleRSVP('not_going')}
                  className={`px-4 py-2 rounded-full border font-semibold transition ${
                    myRSVP?.status === 'not_going'
                      ? 'bg-[#f0d5d0] text-[#1f1f1f] border-[#f0d5d0]'
                      : 'bg-white/80 border-[var(--card-border)] text-[#1f1f1f] hover:bg-[#f9f3ea]'
                  }`}
                >
                  Not Going
                </button>
              </div>
            </div>
          </div>

          {goingList.length > 0 && (
            <div className="soft-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-[#1f1f1f] font-semibold">
                <Users className="w-5 h-5 text-[#2f8f66]" />
                Attendees ({goingList.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {goingList.map(r => (
                  <span
                    key={r.id}
                    className="px-3 py-1 rounded-full border border-[var(--card-border)] bg-white/80 text-sm text-[#1f1f1f] shadow-sm"
                  >
                    u/{r.user.redditUsername}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Restaurant Options removed per request */}

            {event.timeSlots.length > 0 && (
              <div className="soft-card p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-[#1f1f1f]">
                    <Clock className="w-5 h-5 text-[#2f8f66]" />
                    Time Slots
                  </h2>
                </div>

                <div className="space-y-3">
                  {event.timeSlots.map(timeSlot => {
                    const hasVoted = timeSlot.votes.some(v => v.user.id === user?.id)
                    return (
                      <div key={timeSlot.id} className="bg-white/80 border border-[var(--card-border)] rounded-xl p-3">
                        <div className="flex justify-between items-center gap-3">
                          <div>
                            <div className="font-semibold text-[#1f1f1f]">
                              {format(new Date(timeSlot.startTime), 'h:mm a')} - {format(new Date(timeSlot.endTime), 'h:mm a')}
                            </div>
                            <div className="text-sm text-[#5f5a55]">
                              {format(new Date(timeSlot.startTime), 'MMM d, yyyy')}
                            </div>
                          </div>
                          <button
                            onClick={() => handleTimeSlotVote(timeSlot.id, hasVoted)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition ${
                              hasVoted
                                ? 'bg-[#2f8f66] text-white border-transparent shadow'
                                : 'bg-[#f3f0e8] text-[#1f1f1f] border-[var(--card-border)] hover:bg-[#e9dfd1]'
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            {timeSlot.votes.length}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="soft-card p-5 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-[#1f1f1f]">
              <MessageCircle className="w-5 h-5 text-[#2f8f66]" />
              Comments
            </h2>

            {user && (
              <form onSubmit={handleAddComment} className="space-y-3">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 border border-[var(--card-border)] rounded-xl focus:ring-2 focus:ring-[#2f8f66]/30 focus:border-[#2f8f66]/50 bg-white/90"
                  rows={3}
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2f8f66] text-white rounded-xl shadow hover:brightness-95"
                >
                  Post Comment
                </button>
              </form>
            )}

            <div className="space-y-4">
              {event.comments.map(comment => (
                <div key={comment.id} className="border-b border-[var(--card-border)] pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-[#1f1f1f]">u/{comment.user.redditUsername}</span>
                    <span className="text-sm text-[#5f5a55]">
                      {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <p className="text-[#4b453f]">{comment.content}</p>
                </div>
              ))}
              {event.comments.length === 0 && (
                <p className="text-[#5f5a55] text-sm">No comments yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
