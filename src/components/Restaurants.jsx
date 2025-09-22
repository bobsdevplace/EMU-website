import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default markers in Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom markers for different user profiles
const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const yellowIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Default grey marker for unvisited restaurants
const greyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const Restaurants = ({ loggedInUser }) => {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCuisine, setSelectedCuisine] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [allRestaurants, setAllRestaurants] = useState([])
  const [visitedRestaurants, setVisitedRestaurants] = useState(new Set())
  const [interestedRestaurants, setInterestedRestaurants] = useState(new Set())
  const [notInterestedRestaurants, setNotInterestedRestaurants] = useState(new Set())
  const [visitFilter, setVisitFilter] = useState('all')

  // Location and search state
  const [searchLocation, setSearchLocation] = useState('Manly Beach, Australia')
  const [searchRadius, setSearchRadius] = useState(5000) // in meters
  const [currentLocation, setCurrentLocation] = useState({
    name: 'Manly Beach, Australia',
    coordinates: [-33.797286, 151.287778]
  })
  const [isSearching, setIsSearching] = useState(false)

  // Social feed state
  const [socialFeed, setSocialFeed] = useState([])
  const [showFeed, setShowFeed] = useState(false)
  const [savedLocations, setSavedLocations] = useState([])

  // Use the logged-in user
  const currentUser = loggedInUser

  // Format opening hours to split time and days
  const formatOpeningHours = (hours) => {
    if (!hours || hours === 'N/A') return null;

    // Common patterns for day abbreviations
    const dayPattern = /(Mo|Tu|We|Th|Fr|Sa|Su|Mon|Tue|Wed|Thu|Fri|Sat|Sun)[-–—]?(Mo|Tu|We|Th|Fr|Sa|Su|Mon|Tue|Wed|Thu|Fri|Sat|Sun)?/gi;

    // Split by common separators and look for day patterns
    const parts = hours.split(/[,;]/).map(part => part.trim());

    let timeInfo = [];
    let dayInfo = [];

    parts.forEach(part => {
      if (dayPattern.test(part)) {
        dayInfo.push(part);
      } else if (/\d{1,2}:\d{2}/.test(part)) {
        timeInfo.push(part);
      } else {
        // If it contains both time and day info, try to separate
        const timeMatch = part.match(/(\d{1,2}:\d{2}[-–—]\d{1,2}:\d{2})/);
        const dayMatch = part.match(dayPattern);

        if (timeMatch) timeInfo.push(timeMatch[1]);
        if (dayMatch) dayInfo.push(dayMatch[0]);

        // If we can't separate it clearly, put it in time
        if (!timeMatch && !dayMatch) {
          timeInfo.push(part);
        }
      }
    });

    return {
      time: timeInfo.join(', ') || hours,
      days: dayInfo.join(', ')
    };
  };

  // Get country flag emoji based on location name
  const getCountryFlag = (locationName) => {
    const location = locationName.toLowerCase()

    // Country mappings
    if (location.includes('australia') || location.includes('sydney') || location.includes('melbourne') ||
        location.includes('brisbane') || location.includes('perth') || location.includes('adelaide') ||
        location.includes('canberra') || location.includes('manly') || location.includes('bondi')) {
      return '🇦🇺'
    } else if (location.includes('united states') || location.includes('usa') || location.includes('america') ||
               location.includes('new york') || location.includes('los angeles') || location.includes('chicago') ||
               location.includes('miami') || location.includes('san francisco')) {
      return '🇺🇸'
    } else if (location.includes('united kingdom') || location.includes('uk') || location.includes('england') ||
               location.includes('london') || location.includes('manchester') || location.includes('birmingham')) {
      return '🇬🇧'
    } else if (location.includes('france') || location.includes('paris') || location.includes('lyon') ||
               location.includes('marseille')) {
      return '🇫🇷'
    } else if (location.includes('germany') || location.includes('berlin') || location.includes('munich') ||
               location.includes('hamburg')) {
      return '🇩🇪'
    } else if (location.includes('italy') || location.includes('rome') || location.includes('milan') ||
               location.includes('naples')) {
      return '🇮🇹'
    } else if (location.includes('spain') || location.includes('madrid') || location.includes('barcelona') ||
               location.includes('valencia')) {
      return '🇪🇸'
    } else if (location.includes('canada') || location.includes('toronto') || location.includes('vancouver') ||
               location.includes('montreal')) {
      return '🇨🇦'
    } else if (location.includes('japan') || location.includes('tokyo') || location.includes('osaka') ||
               location.includes('kyoto')) {
      return '🇯🇵'
    } else if (location.includes('china') || location.includes('beijing') || location.includes('shanghai') ||
               location.includes('guangzhou')) {
      return '🇨🇳'
    } else if (location.includes('india') || location.includes('mumbai') || location.includes('delhi') ||
               location.includes('bangalore')) {
      return '🇮🇳'
    }

    return '🌍' // Default world emoji
  }

  // User-specific localStorage helper functions
  const loadVisitedRestaurants = (user = currentUser) => {
    try {
      const visited = localStorage.getItem(`visitedRestaurants_${user}`)
      return visited ? new Set(JSON.parse(visited)) : new Set()
    } catch (error) {
      console.error('Error loading visited restaurants:', error)
      return new Set()
    }
  }

  const saveVisitedRestaurants = (visitedSet, user = currentUser) => {
    try {
      localStorage.setItem(`visitedRestaurants_${user}`, JSON.stringify([...visitedSet]))
    } catch (error) {
      console.error('Error saving visited restaurants:', error)
    }
  }

  const loadInterestedRestaurants = (user = currentUser) => {
    try {
      const interested = localStorage.getItem(`interestedRestaurants_${user}`)
      return interested ? new Set(JSON.parse(interested)) : new Set()
    } catch (error) {
      console.error('Error loading interested restaurants:', error)
      return new Set()
    }
  }

  const saveInterestedRestaurants = (interestedSet, user = currentUser) => {
    try {
      localStorage.setItem(`interestedRestaurants_${user}`, JSON.stringify([...interestedSet]))
    } catch (error) {
      console.error('Error saving interested restaurants:', error)
    }
  }

  const loadNotInterestedRestaurants = (user = currentUser) => {
    try {
      const notInterested = localStorage.getItem(`notInterestedRestaurants_${user}`)
      return notInterested ? new Set(JSON.parse(notInterested)) : new Set()
    } catch (error) {
      console.error('Error loading not interested restaurants:', error)
      return new Set()
    }
  }

  const saveNotInterestedRestaurants = (notInterestedSet, user = currentUser) => {
    try {
      localStorage.setItem(`notInterestedRestaurants_${user}`, JSON.stringify([...notInterestedSet]))
    } catch (error) {
      console.error('Error saving not interested restaurants:', error)
    }
  }

  // Social feed localStorage functions
  const loadSocialFeed = () => {
    try {
      const feed = localStorage.getItem('socialFeed')
      return feed ? JSON.parse(feed) : []
    } catch (error) {
      console.error('Error loading social feed:', error)
      return []
    }
  }

  const saveSocialFeed = (feedEntries) => {
    try {
      localStorage.setItem('socialFeed', JSON.stringify(feedEntries))
    } catch (error) {
      console.error('Error saving social feed:', error)
    }
  }

  const addFeedEntry = (user, restaurantName, restaurantId, action = 'visited') => {
    const newEntry = {
      id: Date.now(),
      user: user,
      restaurantName: restaurantName,
      restaurantId: restaurantId,
      action: action,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString()
    }

    const currentFeed = loadSocialFeed()
    const updatedFeed = [newEntry, ...currentFeed].slice(0, 50) // Keep only last 50 entries
    setSocialFeed(updatedFeed)
    saveSocialFeed(updatedFeed)
  }

  const removeFeedEntry = (user, restaurantId) => {
    const currentFeed = loadSocialFeed()
    const updatedFeed = currentFeed.filter(entry =>
      !(entry.user === user && entry.restaurantId === restaurantId && entry.action === 'visited')
    )
    setSocialFeed(updatedFeed)
    saveSocialFeed(updatedFeed)
  }

  // Saved locations localStorage functions
  const loadSavedLocations = () => {
    try {
      const saved = localStorage.getItem('savedLocations')
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Error loading saved locations:', error)
      return []
    }
  }

  const saveSavedLocations = (locations) => {
    try {
      localStorage.setItem('savedLocations', JSON.stringify(locations))
    } catch (error) {
      console.error('Error saving locations:', error)
    }
  }

  const saveCurrentLocation = () => {
    const locationToSave = {
      name: currentLocation.name,
      coordinates: currentLocation.coordinates,
      id: Date.now(),
      savedAt: new Date().toLocaleDateString()
    }

    const existingLocations = savedLocations.filter(loc =>
      loc.name !== currentLocation.name
    )

    const updatedLocations = [locationToSave, ...existingLocations].slice(0, 10) // Keep max 10 saved locations
    setSavedLocations(updatedLocations)
    saveSavedLocations(updatedLocations)
  }

  const removeSavedLocation = (locationId) => {
    const updatedLocations = savedLocations.filter(loc => loc.id !== locationId)
    setSavedLocations(updatedLocations)
    saveSavedLocations(updatedLocations)
  }

  const isLocationSaved = (locationName) => {
    return savedLocations.some(loc => loc.name === locationName)
  }

  const toggleVisitedRestaurant = (restaurantId) => {
    const restaurant = allRestaurants.find(r => r.id === restaurantId)
    const newVisited = new Set(visitedRestaurants)

    if (newVisited.has(restaurantId)) {
      newVisited.delete(restaurantId)
      // Remove from social feed when unchecked
      removeFeedEntry(currentUser, restaurantId)
    } else {
      newVisited.add(restaurantId)
      // Add to social feed
      if (restaurant) {
        addFeedEntry(currentUser, restaurant.name, restaurantId, 'visited')
      }
    }

    setVisitedRestaurants(newVisited)
    saveVisitedRestaurants(newVisited, currentUser)
  }

  const toggleInterestedRestaurant = (restaurantId) => {
    const newInterested = new Set(interestedRestaurants)
    const newNotInterested = new Set(notInterestedRestaurants)

    if (newInterested.has(restaurantId)) {
      newInterested.delete(restaurantId)
    } else {
      newInterested.add(restaurantId)
      // Remove from not interested if it was there
      newNotInterested.delete(restaurantId)
      setNotInterestedRestaurants(newNotInterested)
      saveNotInterestedRestaurants(newNotInterested, currentUser)
    }

    setInterestedRestaurants(newInterested)
    saveInterestedRestaurants(newInterested, currentUser)
  }

  const toggleNotInterestedRestaurant = (restaurantId) => {
    const newNotInterested = new Set(notInterestedRestaurants)
    const newInterested = new Set(interestedRestaurants)

    if (newNotInterested.has(restaurantId)) {
      newNotInterested.delete(restaurantId)
    } else {
      newNotInterested.add(restaurantId)
      // Remove from interested if it was there
      newInterested.delete(restaurantId)
      setInterestedRestaurants(newInterested)
      saveInterestedRestaurants(newInterested, currentUser)
    }

    setNotInterestedRestaurants(newNotInterested)
    saveNotInterestedRestaurants(newNotInterested, currentUser)
  }


  const isRestaurantVisited = (restaurantId) => {
    return visitedRestaurants.has(restaurantId)
  }

  // Determine which user visited a restaurant
  const getRestaurantVisitor = (restaurantId) => {
    const julienVisited = loadVisitedRestaurants('Julien')
    const jimmyVisited = loadVisitedRestaurants('Jimmy')

    if (julienVisited.has(restaurantId)) {
      return 'Julien'
    } else if (jimmyVisited.has(restaurantId)) {
      return 'Jimmy'
    }
    return null // Not visited by anyone
  }

  // Get appropriate icon based on interest level and visit status
  const getRestaurantIcon = (restaurantId) => {
    // Priority 1: Current user's interest level (highest priority)
    if (interestedRestaurants.has(restaurantId)) {
      return greenIcon
    } else if (notInterestedRestaurants.has(restaurantId)) {
      return redIcon
    }

    // Priority 2: Visited restaurants (orange for Julien, yellow for Jimmy)
    const visitor = getRestaurantVisitor(restaurantId)
    if (visitor === 'Julien') {
      return orangeIcon
    } else if (visitor === 'Jimmy') {
      return yellowIcon
    }

    // Default: Grey for neutral/unvisited
    return greyIcon
  }

  // Geocoding function to convert location name to coordinates
  const geocodeLocation = async (locationName) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`
      )
      const data = await response.json()

      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          display_name: data[0].display_name
        }
      } else {
        throw new Error('Location not found')
      }
    } catch (error) {
      throw new Error(`Geocoding failed: ${error.message}`)
    }
  }

  // Reverse geocoding function to get address from coordinates
  const reverseGeocode = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
      )
      const data = await response.json()

      if (data && data.display_name) {
        // Extract meaningful address parts
        const address = data.address || {}
        const parts = []

        if (address.house_number) parts.push(address.house_number)
        if (address.road) parts.push(address.road)
        if (address.suburb) parts.push(address.suburb)
        if (address.city || address.town || address.village) {
          parts.push(address.city || address.town || address.village)
        }

        return parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 2).join(',')
      }
      return null
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
      return null
    }
  }

  const fetchRestaurants = async (location = currentLocation, radius = searchRadius) => {
    setLoading(true)
    setError(null)

    // Use the current location coordinates
    const lat = location.coordinates[0]
    const lon = location.coordinates[1]

    const query = `[out:json][timeout:25];
(
  node[amenity=restaurant](around:${radius},${lat},${lon});
  way[amenity=restaurant](around:${radius},${lat},${lon});
  relation[amenity=restaurant](around:${radius},${lat},${lon});
  node[amenity=cafe](around:${radius},${lat},${lon});
  way[amenity=cafe](around:${radius},${lat},${lon});
  node[amenity=fast_food](around:${radius},${lat},${lon});
  way[amenity=fast_food](around:${radius},${lat},${lon});
  node[amenity=bar](around:${radius},${lat},${lon});
  way[amenity=bar](around:${radius},${lat},${lon});
  node[amenity=pub](around:${radius},${lat},${lon});
  way[amenity=pub](around:${radius},${lat},${lon});
  node[amenity=nightclub](around:${radius},${lat},${lon});
  way[amenity=nightclub](around:${radius},${lat},${lon});
);
out center;`

    console.log('Overpass API Query:', query)
    console.log('Searching around coordinates:', lat, lon)
    console.log('Radius:', radius, 'meters')

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'text/plain'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('API Response:', data)
      console.log('Number of elements found:', data.elements?.length || 0)

      if (!data.elements || data.elements.length === 0) {
        console.log('No restaurants found in the response')
        setRestaurants([])
        return
      }

      // Process the data to extract restaurant information
      const processedRestaurants = data.elements.map((element, index) => {
        const lat = element.lat || (element.center && element.center.lat)
        const lon = element.lon || (element.center && element.center.lon)

        const amenityType = element.tags?.amenity || 'unknown'
        const name = element.tags?.name ||
                    element.tags?.brand ||
                    `${amenityType.charAt(0).toUpperCase() + amenityType.slice(1)} (Unnamed)`

        // Capitalize first letter of words
        const capitalizeWords = (str) => {
          return str.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')
        }

        // Format cuisine: replace semicolons with commas and underscores with spaces, then capitalize
        const rawCuisine = element.tags?.cuisine || 'Not specified'
        const formattedCuisine = rawCuisine === 'Not specified'
          ? 'Not specified'
          : rawCuisine.split(';').map(c => capitalizeWords(c.trim().replace(/_/g, ' '))).join(', ')

        // Format restaurant type with proper capitalization
        const formattedType = capitalizeWords(amenityType.replace(/_/g, ' '))

        // Improved address extraction with multiple fallback options
        const getAddress = () => {
          const tags = element.tags || {}

          // Try full address first
          if (tags['addr:full']) {
            return tags['addr:full']
          }

          // Build address from components
          const components = []
          if (tags['addr:housenumber']) components.push(tags['addr:housenumber'])
          if (tags['addr:street']) components.push(tags['addr:street'])
          if (components.length > 0) {
            return components.join(' ')
          }

          // Try alternative address fields
          if (tags['addr:place']) return tags['addr:place']
          if (tags['addr:suburb']) return tags['addr:suburb']
          if (tags['addr:city']) return tags['addr:city']

          // Try location-related tags
          if (tags.location) return tags.location
          if (tags.address) return tags.address

          // Use coordinates as last resort
          if (lat && lon) {
            return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
          }

          return 'Address not available'
        }

        return {
          id: element.id || index,
          name: name,
          type: formattedType,
          cuisine: formattedCuisine,
          address: getAddress(),
          lat: lat,
          lng: lon,
          phone: element.tags?.phone || 'N/A',
          website: element.tags?.website || element.tags?.['contact:website'] || null,
          opening_hours: element.tags?.opening_hours || 'N/A',
          takeaway: element.tags?.takeaway || 'N/A',
          delivery: element.tags?.delivery || 'N/A'
        }
      }).filter(restaurant => restaurant.lat && restaurant.lng) // Only include restaurants with valid coordinates

      console.log('Processed restaurants:', processedRestaurants)

      // Enhance addresses for restaurants that only have coordinates
      const enhancedRestaurants = await enhanceAddresses(processedRestaurants)

      setAllRestaurants(enhancedRestaurants)
      setRestaurants(enhancedRestaurants)
    } catch (err) {
      console.error('Error fetching restaurants:', err)

      // Fallback to sample restaurants if API fails
      const fallbackRestaurants = [
        {
          id: 'f1',
          name: 'Manly Beach Cafe',
          type: 'cafe',
          cuisine: 'Australian',
          address: 'The Corso, Manly Beach',
          lat: -33.7975,
          lng: 151.2878,
          phone: 'N/A',
          website: null,
          opening_hours: '7:00-17:00',
          takeaway: 'yes',
          delivery: 'no'
        },
        {
          id: 'f2',
          name: 'Seaside Restaurant',
          type: 'restaurant',
          cuisine: 'Seafood',
          address: 'Marine Parade, Manly',
          lat: -33.7980,
          lng: 151.2875,
          phone: 'N/A',
          website: null,
          opening_hours: '12:00-22:00',
          takeaway: 'yes',
          delivery: 'yes'
        }
      ]

      setAllRestaurants(fallbackRestaurants)
      setRestaurants(fallbackRestaurants)
      setError('Using sample data. API connection issue: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Extract unique cuisines from all restaurants with counts
  const getUniqueCuisines = () => {
    const cuisineCount = new Map()

    allRestaurants.forEach(restaurant => {
      if (restaurant.cuisine && restaurant.cuisine !== 'Not specified') {
        // Split cuisine by comma and add each individual cuisine
        restaurant.cuisine.split(',').forEach(cuisine => {
          const trimmedCuisine = cuisine.trim()
          cuisineCount.set(trimmedCuisine, (cuisineCount.get(trimmedCuisine) || 0) + 1)
        })
      }
    })

    // Convert to array of objects with cuisine and count, then sort
    return Array.from(cuisineCount.entries())
      .map(([cuisine, count]) => ({ cuisine, count }))
      .sort((a, b) => a.cuisine.localeCompare(b.cuisine))
  }

  // Extract unique types from all restaurants with counts
  const getUniqueTypes = () => {
    const typeCount = new Map()

    allRestaurants.forEach(restaurant => {
      if (restaurant.type) {
        const normalizedType = restaurant.type.toLowerCase()
        let displayType = restaurant.type

        // Normalize common variations
        if (normalizedType.includes('restaurant')) {
          displayType = 'Restaurant'
        } else if (normalizedType.includes('fast') || normalizedType.includes('fast_food')) {
          displayType = 'Fast Food'
        } else if (normalizedType.includes('cafe') || normalizedType.includes('café')) {
          displayType = 'Cafe'
        } else if (normalizedType.includes('bar')) {
          displayType = 'Bar'
        } else if (normalizedType.includes('pub')) {
          displayType = 'Pub'
        } else if (normalizedType.includes('nightclub')) {
          displayType = 'Nightclub'
        }

        typeCount.set(displayType, (typeCount.get(displayType) || 0) + 1)
      }
    })

    // Convert to array of objects with type and count, then sort
    return Array.from(typeCount.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => a.type.localeCompare(b.type))
  }

  // Filter restaurants based on selected criteria
  const filterRestaurants = (cuisine = selectedCuisine, type = selectedType, visitStatus = visitFilter) => {
    let filtered = allRestaurants

    // Filter by cuisine
    if (cuisine !== 'all') {
      filtered = filtered.filter(restaurant =>
        restaurant.cuisine.toLowerCase().includes(cuisine.toLowerCase())
      )
    }

    // Filter by type
    if (type !== 'all') {
      filtered = filtered.filter(restaurant => {
        const normalizedType = restaurant.type.toLowerCase()
        const filterType = type.toLowerCase()

        if (filterType === 'restaurant') {
          return normalizedType.includes('restaurant')
        } else if (filterType === 'fast food') {
          return normalizedType.includes('fast') || normalizedType.includes('fast_food')
        } else if (filterType === 'cafe') {
          return normalizedType.includes('cafe') || normalizedType.includes('café')
        } else if (filterType === 'bar') {
          return normalizedType.includes('bar')
        } else if (filterType === 'pub') {
          return normalizedType.includes('pub')
        } else if (filterType === 'nightclub') {
          return normalizedType.includes('nightclub')
        }
        return restaurant.type.toLowerCase().includes(filterType)
      })
    }

    // Filter by visit status
    if (visitStatus === 'visited') {
      filtered = filtered.filter(restaurant => isRestaurantVisited(restaurant.id))
    } else if (visitStatus === 'unvisited') {
      filtered = filtered.filter(restaurant => !isRestaurantVisited(restaurant.id))
    }

    setRestaurants(filtered)
  }

  // Handle cuisine filter change
  const handleCuisineChange = (cuisine) => {
    setSelectedCuisine(cuisine)
    filterRestaurants(cuisine, selectedType, visitFilter)
  }

  // Handle type filter change
  const handleTypeChange = (type) => {
    setSelectedType(type)
    filterRestaurants(selectedCuisine, type, visitFilter)
  }

  // Handle visit filter change
  const handleVisitFilterChange = (visitStatus) => {
    setVisitFilter(visitStatus)
    filterRestaurants(selectedCuisine, selectedType, visitStatus)
  }

  // Handle location search
  const handleLocationSearch = async () => {
    if (!searchLocation.trim()) {
      setError('Please enter a location')
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const geocodeResult = await geocodeLocation(searchLocation)
      const newLocation = {
        name: geocodeResult.display_name,
        coordinates: [geocodeResult.lat, geocodeResult.lon]
      }

      setCurrentLocation(newLocation)
      await fetchRestaurants(newLocation, searchRadius)
    } catch (error) {
      setError(`Location search failed: ${error.message}`)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle radius change
  const handleRadiusChange = (newRadius) => {
    setSearchRadius(newRadius)
  }

  // Apply new radius to current search
  const applyRadiusChange = async () => {
    await fetchRestaurants(currentLocation, searchRadius)
  }

  // Combined preset locations (only saved locations, no defaults)
  const presetLocations = savedLocations.map(loc => ({
    ...loc,
    isDefault: false
  }))

  const selectPresetLocation = async (location) => {
    setSearchLocation(location.name)
    setCurrentLocation(location)
    await fetchRestaurants(location, searchRadius)
  }

  // Enhance addresses for restaurants with missing address data
  // Get emoji for restaurant based on cuisine or type
  const getRestaurantEmoji = (cuisine, type) => {
    // Cuisine-based emojis (prioritized)
    const cuisineEmojis = {
      // Country/regional cuisines (flags)
      italian: '🇮🇹',
      french: '🇫🇷',
      chinese: '🇨🇳',
      japanese: '🇯🇵',
      korean: '🇰🇷',
      thai: '🇹🇭',
      indian: '🇮🇳',
      mexican: '🇲🇽',
      american: '🇺🇸',
      greek: '🇬🇷',
      turkish: '🇹🇷',
      lebanese: '🇱🇧',
      vietnamese: '🇻🇳',
      spanish: '🇪🇸',
      german: '🇩🇪',
      british: '🇬🇧',
      indonesian: '🇮🇩',
      malaysian: '🇲🇾',
      singapore: '🇸🇬',
      filipino: '🇵🇭',
      brazilian: '🇧🇷',
      argentinian: '🇦🇷',
      peruvian: '🇵🇪',
      moroccan: '🇲🇦',
      ethiopian: '🇪🇹',
      russian: '🇷🇺',
      polish: '🇵🇱',
      ukrainian: '🇺🇦',
      portuguese: '🇵🇹',
      hungarian: '🇭🇺',
      czech: '🇨🇿',
      scandinavian: '🇸🇪',
      nordic: '🇳🇴',
      swiss: '🇨🇭',
      austrian: '🇦🇹',
      dutch: '🇳🇱',
      belgian: '🇧🇪',
      irish: '🇮🇪',

      // Specific food items (food emojis)
      pizza: '🍕',
      burger: '🍔',
      sushi: '🍣',
      seafood: '🦐',
      bbq: '🍖',
      barbecue: '🍖',
      steak: '🥩',
      chicken: '🍗',
      vegetarian: '🥗',
      vegan: '🌱',
      mediterranean: '🫒',
      ramen: '🍜',
      noodles: '🍜',
      pasta: '🍝',
      sandwich: '🥪',
      breakfast: '🍳',
      brunch: '🥞',
      dessert: '🍰',
      ice_cream: '🍦',
      coffee: '☕',
      bakery: '🥖',
      pastry: '🥐',
      donut: '🍩',
      cake: '🍰',
      tea: '🍵',
      wine: '🍷',
      pub: '🍺',
      beer: '🍺',
      cocktail: '🍸',
      tapas: '🍤',
      fish: '🐟',
      fish_and_chips: '🍟',
      salad: '🥗',
      soup: '🍲',
      curry: '🍛',
      dumplings: '🥟',
      crepe: '🥞',
      waffle: '🧇',
      smoothie: '🥤',
      juice: '🧃'
    }

    // Type-based emojis (fallback)
    const typeEmojis = {
      restaurant: '🍽️',
      cafe: '☕',
      fast_food: '🍔',
      bar: '🍻',
      pub: '🍺',
      nightclub: '🎭',
      food_court: '🍽️',
      bistro: '🍽️',
      diner: '🍽️',
      pizzeria: '🍕',
      bakery: '🥖',
      ice_cream: '🍦',
      coffee_shop: '☕'
    }

    // Check cuisine first (split by comma and check each part)
    if (cuisine && cuisine !== 'Not specified') {
      const cuisineTypes = cuisine.toLowerCase().split(',').map(c => c.trim())

      // First pass: Look for specific country/regional cuisines and specific foods (skip generic terms)
      const genericTerms = ['coffee_shop', 'coffee', 'cafe', 'restaurant', 'fast_food']

      for (const cuisineType of cuisineTypes) {
        if (!genericTerms.includes(cuisineType)) {
          // Check exact matches first
          if (cuisineEmojis[cuisineType]) {
            return cuisineEmojis[cuisineType]
          }
          // Check partial matches
          for (const [key, emoji] of Object.entries(cuisineEmojis)) {
            if (!genericTerms.includes(key) && (cuisineType.includes(key) || key.includes(cuisineType))) {
              return emoji
            }
          }
        }
      }

      // Second pass: If no specific cuisine found, then check generic terms
      for (const cuisineType of cuisineTypes) {
        if (genericTerms.includes(cuisineType)) {
          if (cuisineEmojis[cuisineType]) {
            return cuisineEmojis[cuisineType]
          }
        }
      }
    }

    // Fall back to type-based emoji
    if (type && typeEmojis[type]) {
      return typeEmojis[type]
    }

    // Default emoji
    return '🍽️'
  }

  const enhanceAddresses = async (restaurants) => {
    const enhanced = [...restaurants]
    let enhanceCount = 0
    const maxEnhancements = 10 // Limit to avoid too many API calls

    for (let i = 0; i < enhanced.length && enhanceCount < maxEnhancements; i++) {
      const restaurant = enhanced[i]

      // Check if address needs enhancement (only coordinates or "Address not available")
      if (restaurant.address === 'Address not available' ||
          (restaurant.address && restaurant.address.includes(',') && restaurant.address.split(',').length === 2 &&
           restaurant.address.match(/^-?\d+\.\d+, -?\d+\.\d+$/))) {

        try {
          const enhancedAddress = await reverseGeocode(restaurant.lat, restaurant.lng)
          if (enhancedAddress) {
            enhanced[i] = { ...restaurant, address: enhancedAddress }
            enhanceCount++
            console.log(`Enhanced address for ${restaurant.name}: ${enhancedAddress}`)

            // Add small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        } catch (error) {
          console.error(`Failed to enhance address for ${restaurant.name}:`, error)
        }
      }
    }

    console.log(`Enhanced addresses for ${enhanceCount} restaurants`)
    return enhanced
  }

  useEffect(() => {
    // Load visited restaurants from localStorage for current user
    setVisitedRestaurants(loadVisitedRestaurants(currentUser))
    // Load interested restaurants from localStorage for current user
    setInterestedRestaurants(loadInterestedRestaurants(currentUser))
    // Load not interested restaurants from localStorage for current user
    setNotInterestedRestaurants(loadNotInterestedRestaurants(currentUser))
    // Load social feed
    setSocialFeed(loadSocialFeed())
    // Load saved locations
    setSavedLocations(loadSavedLocations())
    fetchRestaurants()
  }, [])

  // Update user data when logged-in user changes
  useEffect(() => {
    setVisitedRestaurants(loadVisitedRestaurants(currentUser))
    setInterestedRestaurants(loadInterestedRestaurants(currentUser))
    setNotInterestedRestaurants(loadNotInterestedRestaurants(currentUser))
  }, [currentUser])

  useEffect(() => {
    // Update filtered restaurants when allRestaurants or visitedRestaurants changes
    filterRestaurants(selectedCuisine, selectedType, visitFilter)
  }, [allRestaurants, selectedCuisine, selectedType, visitFilter, visitedRestaurants])

  // If no user is logged in, show login required message
  if (!currentUser) {
    return (
      <div className="restaurants-container">
        <div className="login-required">
          <h1>Login Required</h1>
          <p>Please log in to access the restaurants map and features.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="restaurants-container">
        <div className="loading-container">
          <h1>Loading Restaurants...</h1>
          <div className="loading-spinner">🍽️</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="restaurants-container">
        <div className="error-container">
          <h1>Restaurants</h1>
          <p className="error-message">{error}</p>
          <button onClick={fetchRestaurants} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="restaurants-container">
      <div className="map-header">
        <div className="header-top">
          <div className="header-title">
            <h1>Restaurants near {currentLocation.name.split(',')[0]} {getCountryFlag(currentLocation.name)}</h1>
          </div>

          <div className="user-controls">
            <button
              onClick={() => setShowFeed(!showFeed)}
              className={`feed-toggle ${showFeed ? 'active' : ''}`}
            >
              {showFeed ? '📍 Hide Feed' : '📍 Show Feed'} ({socialFeed.length})
            </button>
          </div>
        </div>

        <p className="restaurant-count">
          Found {restaurants.length} restaurants
        </p>

        {/* Social Feed */}
        {showFeed && (
          <div className="social-feed">
            <h3>Recent Restaurant Visits</h3>
            {socialFeed.length === 0 ? (
              <p className="no-feed">No recent visits. Start exploring restaurants!</p>
            ) : (
              <div className="feed-entries">
                {socialFeed.slice(0, 10).map(entry => (
                  <div key={entry.id} className="feed-entry">
                    <span className="feed-user">{entry.user}</span>
                    <span className="feed-action">has visited</span>
                    <span className="feed-restaurant">{entry.restaurantName}</span>
                    <span className="feed-date">on {entry.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Location Search */}
        <div className="location-search-container">
          <div className="search-controls">
            <div className="location-input-group">
              <label htmlFor="location-search" className="search-label">
                Search Location:
              </label>
              <div className="search-input-container">
                <input
                  id="location-search"
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="Enter city, address, or landmark..."
                  className="location-input"
                  onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                />
                <button
                  onClick={handleLocationSearch}
                  disabled={isSearching}
                  className="search-button"
                >
                  {isSearching ? '🔍 Searching...' : '🔍 Search'}
                </button>
                <button
                  onClick={saveCurrentLocation}
                  disabled={isLocationSaved(currentLocation.name)}
                  className={`save-location-button ${isLocationSaved(currentLocation.name) ? 'saved' : ''}`}
                  title={isLocationSaved(currentLocation.name) ? 'Location already saved' : 'Save current location'}
                >
                  {isLocationSaved(currentLocation.name) ? '⭐' : '☆'}
                </button>
              </div>
            </div>

            <div className="radius-input-group">
              <label htmlFor="radius-select" className="search-label">
                Search Radius:
              </label>
              <div className="radius-container">
                <select
                  id="radius-select"
                  value={searchRadius}
                  onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                  className="radius-select"
                >
                  <option value={1000}>1 km</option>
                  <option value={2000}>2 km</option>
                  <option value={5000}>5 km</option>
                  <option value={10000}>10 km</option>
                  <option value={15000}>15 km</option>
                  <option value={20000}>20 km</option>
                </select>
                <button
                  onClick={applyRadiusChange}
                  className="apply-radius-button"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Preset Locations */}
          {presetLocations.length > 0 && (
            <div className="preset-locations">
              <div className="preset-label">Quick locations:</div>
              <div className="preset-buttons">
                {presetLocations.map((location) => (
                  <div key={location.name} className="preset-button-container">
                    <button
                      onClick={() => selectPresetLocation(location)}
                      className={`preset-button ${currentLocation.name === location.name ? 'active' : ''}`}
                    >
                      {location.name.split(',')[0]} ⭐
                    </button>
                    {!location.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeSavedLocation(location.id)
                        }}
                        className="remove-location-button"
                        title="Remove saved location"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="filters-container">
          <div className="filter-group">
            <label htmlFor="type-filter" className="filter-label">
              Filter by Type:
            </label>
            <select
              id="type-filter"
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="type-filter"
            >
              <option value="all">All Types ({allRestaurants.length})</option>
              {getUniqueTypes().map(({ type, count }) => (
                <option key={type} value={type}>
                  {type} ({count})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="cuisine-filter" className="filter-label">
              Filter by Cuisine:
            </label>
            <select
              id="cuisine-filter"
              value={selectedCuisine}
              onChange={(e) => handleCuisineChange(e.target.value)}
              className="cuisine-filter"
            >
              <option value="all">All Cuisines ({allRestaurants.length})</option>
              {getUniqueCuisines().map(({ cuisine, count }) => (
                <option key={cuisine} value={cuisine}>
                  {cuisine} ({count})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="visit-filter" className="filter-label">
              Visit Status:
            </label>
            <select
              id="visit-filter"
              value={visitFilter}
              onChange={(e) => handleVisitFilterChange(e.target.value)}
              className="visit-filter"
            >
              <option value="all">All Restaurants</option>
              <option value="visited">Visited ({[...visitedRestaurants].filter(id => allRestaurants.some(r => r.id === id)).length})</option>
              <option value="unvisited">Not Visited</option>
            </select>
          </div>
        </div>
      </div>

      <MapContainer
        center={currentLocation.coordinates}
        zoom={12}
        key={`${currentLocation.coordinates[0]}-${currentLocation.coordinates[1]}`}
        style={{ height: '600px', width: '100%' }}
        className="restaurant-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Reference location marker */}
        <Marker position={currentLocation.coordinates}>
          <Popup>
            <div className="reference-popup">
              <h3>📍 {currentLocation.name}</h3>
              <p>Reference point for restaurant search</p>
              <p>Radius: {searchRadius/1000}km</p>
            </div>
          </Popup>
        </Marker>

        {/* Restaurant markers */}
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={[restaurant.lat, restaurant.lng]}
            icon={getRestaurantIcon(restaurant.id)}
          >
            <Popup>
              <div className="restaurant-popup">
                <div className="popup-header">
                  <h3>
                    {restaurant.name} {getRestaurantEmoji(restaurant.cuisine.toLowerCase(), restaurant.type.toLowerCase())}
                  </h3>
                  {isRestaurantVisited(restaurant.id) && (
                    <span className="visited-badge">✅ Visited</span>
                  )}
                </div>
                <p className="type"><strong>Type:</strong> {restaurant.type}</p>
                {restaurant.cuisine !== 'Not specified' && (
                  <p className="cuisine"><strong>Cuisine:</strong> {restaurant.cuisine}</p>
                )}
                <p className="address"><strong>Address:</strong> {restaurant.address}</p>
                {restaurant.phone !== 'N/A' && (
                  <p className="phone"><strong>Phone:</strong> {restaurant.phone}</p>
                )}
                {restaurant.opening_hours !== 'N/A' && (
                  <p className="hours"><strong>Hours:</strong> {restaurant.opening_hours}</p>
                )}
                {restaurant.website && (
                  <p className="website">
                    <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
                      Visit Website
                    </a>
                  </p>
                )}
                <div className="restaurant-controls-grid">
                  <button
                    onClick={() => toggleVisitedRestaurant(restaurant.id)}
                    className={`control-button visited-button ${isRestaurantVisited(restaurant.id) ? 'active' : ''} ${currentUser.toLowerCase()}-profile`}
                  >
                    Visited
                  </button>
                  <button
                    onClick={() => toggleInterestedRestaurant(restaurant.id)}
                    className={`control-button interested-button ${interestedRestaurants.has(restaurant.id) ? 'active' : ''}`}
                  >
                    Interested
                  </button>
                  <button
                    onClick={() => toggleNotInterestedRestaurant(restaurant.id)}
                    className={`control-button not-interested-button ${notInterestedRestaurants.has(restaurant.id) ? 'active' : ''}`}
                  >
                    Not Interested
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="restaurant-list">
        <h2>Restaurant Directory</h2>
        <div className="restaurant-grid">
          {restaurants.slice(0, 12).map((restaurant, index) => (
            <div
              key={restaurant.id}
              className={`restaurant-card ${isRestaurantVisited(restaurant.id) ? 'visited-card' : ''} ${index % 2 === 1 ? 'alternate' : ''}`}
            >
              <div className="card-header">
                <div className="card-title">
                  {restaurant.website ? (
                    <h3>
                      <a
                        href={restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                      >
                        {restaurant.name} {getRestaurantEmoji(restaurant.cuisine.toLowerCase(), restaurant.type.toLowerCase())}
                      </a>
                    </h3>
                  ) : (
                    <h3>
                      {restaurant.name} {getRestaurantEmoji(restaurant.cuisine.toLowerCase(), restaurant.type.toLowerCase())}
                    </h3>
                  )}
                  {isRestaurantVisited(restaurant.id) && (
                    <span className="visited-badge">✅ Visited</span>
                  )}
                </div>
                {restaurant.opening_hours !== 'N/A' && (() => {
                  const formattedHours = formatOpeningHours(restaurant.opening_hours);
                  return formattedHours ? (
                    <div className="card-hours">
                      <div>🕒 {formattedHours.time}</div>
                      {formattedHours.days && <div>{formattedHours.days}</div>}
                    </div>
                  ) : null;
                })()}
              </div>
              <p className="type">{restaurant.type}</p>
              {restaurant.cuisine !== 'Not specified' && (
                <p className="cuisine">{restaurant.cuisine}</p>
              )}
              <p className="address">{restaurant.address}</p>
              {restaurant.phone !== 'N/A' && (
                <p className="phone">📞 {restaurant.phone}</p>
              )}
              <div className="restaurant-controls-grid">
                <button
                  onClick={() => toggleVisitedRestaurant(restaurant.id)}
                  className={`control-button visited-button ${isRestaurantVisited(restaurant.id) ? 'active' : ''} ${currentUser.toLowerCase()}-profile`}
                >
                  Visited
                </button>
                <button
                  onClick={() => toggleInterestedRestaurant(restaurant.id)}
                  className={`control-button interested-button ${interestedRestaurants.has(restaurant.id) ? 'active' : ''}`}
                >
                  Interested
                </button>
                <button
                  onClick={() => toggleNotInterestedRestaurant(restaurant.id)}
                  className={`control-button not-interested-button ${notInterestedRestaurants.has(restaurant.id) ? 'active' : ''}`}
                >
                  Not Interested
                </button>
              </div>
            </div>
          ))}
        </div>

        {restaurants.length > 12 && (
          <div className="show-more">
            <p>Showing first 12 of {restaurants.length} restaurants</p>
            <button onClick={() => {
              // Could implement pagination or show all functionality
              alert('All restaurants are shown on the map above!')
            }}>
              View All on Map
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Restaurants