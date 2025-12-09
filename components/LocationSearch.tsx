'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin } from 'lucide-react'

interface LocationSelection {
  label: string
  name: string
  address: string
  placeId?: string
  latitude?: number
  longitude?: number
}

interface LocationSearchProps {
  onSelect: (location: LocationSelection) => void
  placeholder?: string
}

export default function LocationSearch({ onSelect, placeholder }: LocationSearchProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current) return

    const aucklandBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(-37.1, 174.5), // SW approx
      new google.maps.LatLng(-36.6, 175.3)  // NE approx
    )

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['restaurant'],
      componentRestrictions: { country: 'nz' },
      bounds: aucklandBounds,
      strictBounds: true,
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const label =
        place.formatted_address ||
        place.name ||
        inputRef.current?.value ||
        ''

      const selection: LocationSelection = {
        label,
        name: place.name || label,
        address: place.formatted_address || label,
        placeId: place.place_id || undefined,
        latitude: place.geometry?.location?.lat(),
        longitude: place.geometry?.location?.lng(),
      }

      setQuery(selection.label)
      onSelect(selection)
    })
  }, [onSelect])

  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()
    const apiKey =
      envKey && envKey !== 'your_google_maps_api_key_here'
        ? envKey
        : 'AIzaSyCEGNbB7zO3Ezjj1AWLKRRvowJCs3ClJoc'

    const scriptId = 'google-maps-script'
    const desiredSrc = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`

    // Already loaded with places
    if (window.google?.maps?.places) {
      initAutocomplete()
      return
    }

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null

    // Remove stale script if it has a different key or placeholder
    if (existing && existing.src && !existing.src.includes(apiKey)) {
      existing.remove()
    }

    if (document.getElementById(scriptId)) {
      const el = document.getElementById(scriptId) as HTMLScriptElement
      el.addEventListener('load', initAutocomplete, { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = desiredSrc
    script.async = true
    script.defer = true
    script.onload = () => initAutocomplete()
    document.head.appendChild(script)

    return () => {
      script.removeEventListener('load', initAutocomplete)
    }
  }, [initAutocomplete])

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8c8379] w-5 h-5" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          const text = e.target.value
          setQuery(text)
          onSelect({
            label: text,
            name: text,
            address: text,
          })
        }}
        placeholder={placeholder || 'Search for a location...'}
        className="w-full pl-11 pr-4 py-3 bg-white/90 border border-[var(--card-border)] rounded-full text-sm text-[#1f1f1f] placeholder:text-[#8c8379] focus:ring-2 focus:ring-[#2f8f66]/30 focus:border-[#2f8f66]/50"
      />
    </div>
  )
}

