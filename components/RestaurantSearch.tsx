'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search } from 'lucide-react'

interface Restaurant {
  name: string
  address: string
  placeId: string
  latitude: number
  longitude: number
}

interface RestaurantSearchProps {
  onSelect: (restaurant: Restaurant) => void
}

declare global {
  interface Window {
    initAutocomplete?: () => void
  }
}

export default function RestaurantSearch({ onSelect }: RestaurantSearchProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current) return

    const aucklandBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(-37.1, 174.5), // SW approx
      new google.maps.LatLng(-36.6, 175.3)  // NE approx
    )

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['restaurant', 'cafe', 'food'],
      componentRestrictions: { country: 'nz' },
      bounds: aucklandBounds,
      strictBounds: true, // bias to Auckland area
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()

      if (!place.geometry?.location) {
        return
      }

      const restaurant: Restaurant = {
        name: place.name || '',
        address: place.formatted_address || '',
        placeId: place.place_id || '',
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
      }

      onSelect(restaurant)
      setQuery('')
    })

    autocompleteRef.current = autocomplete
  }, [onSelect])

  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()
    const apiKey =
      envKey && envKey !== 'your_google_maps_api_key_here'
        ? envKey
        : 'AIzaSyCEGNbB7zO3Ezjj1AWLKRRvowJCs3ClJoc'

    const scriptId = 'google-maps-script'
    const desiredSrc = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`

    // If already loaded with places, just init
    if (window.google?.maps?.places) {
      initAutocomplete()
      return
    }

    // Check existing script
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null
    if (existing) {
      // If existing src doesn't match our key or has placeholder, replace it
      if (existing.src && (!existing.src.includes(apiKey) || existing.src.includes('your_google_maps_api_key_here'))) {
        existing.remove()
      } else {
        existing.addEventListener('load', initAutocomplete, { once: true })
        return
      }
    }

    // Load Google Maps script with correct key
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
  }, [onSelect, initAutocomplete])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8c8379] w-5 h-5" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for restaurants..."
        className="w-full pl-11 pr-4 py-3 bg-white/90 border border-[var(--card-border)] rounded-full text-sm text-[#1f1f1f] placeholder:text-[#8c8379] focus:ring-2 focus:ring-[#2f8f66]/30 focus:border-[#2f8f66]/50"
      />
    </div>
  )
}
