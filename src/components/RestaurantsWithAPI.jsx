import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import apiService from '../services/api.js'

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

const greyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const RestaurantsWithAPI = ({ loggedInUser }) => {
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
  const [searchRadius, setSearchRadius] = useState(5000)
  const [currentLocation, setCurrentLocation] = useState({
    name: 'Manly Beach, Australia',
    coordinates: [-33.797286, 151.287778]
  })
  const [isSearching, setIsSearching] = useState(false)

  // Social feed state
  const [socialFeed, setSocialFeed] = useState([])
  const [showFeed, setShowFeed] = useState(false)
  const [savedLocations, setSavedLocations] = useState([])
  const [availableUsers, setAvailableUsers] = useState(['Julien', 'Jimmy'])
  const [allUsersVisitedRestaurants, setAllUsersVisitedRestaurants] = useState({})

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

  // API calls
  const loadUserData = async (username) => {
    try {
      const userData = await apiService.getUser(username)
      if (userData.success) {
        setVisitedRestaurants(new Set(userData.data.visitedRestaurants))
        setInterestedRestaurants(new Set(userData.data.interestedRestaurants))
        setNotInterestedRestaurants(new Set(userData.data.notInterestedRestaurants))
        setSavedLocations(userData.data.savedLocations || [])
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      // Fall back to empty data if API fails
      setVisitedRestaurants(new Set())
      setInterestedRestaurants(new Set())
      setNotInterestedRestaurants(new Set())
      setSavedLocations([])
    }
  }

  const loadSocialFeed = async () => {
    try {
      const feedData = await apiService.getSocialFeed(50)
      if (feedData.success) {
        setSocialFeed(feedData.data)
      }
    } catch (error) {
      console.error('Error loading social feed:', error)
      setSocialFeed([])
    }
  }

  const loadAvailableUsers = async () => {
    try {
      const usersData = await apiService.getAllUsers()
      if (usersData.success) {
        // Combine default users with any additional users from database
        const defaultUsers = ['Julien', 'Jimmy']
        const dbUsers = usersData.data || []
        const allUsers = [...new Set([...defaultUsers, ...dbUsers])] // Remove duplicates
        setAvailableUsers(allUsers)

        // Load visited restaurants for all users
        await loadAllUsersVisitedRestaurants(allUsers)
      }
    } catch (error) {
      console.error('Error loading users:', error)
      // Keep default users if API fails
      setAvailableUsers(['Julien', 'Jimmy'])
      await loadAllUsersVisitedRestaurants(['Julien', 'Jimmy'])
    }
  }

  const loadAllUsersVisitedRestaurants = async (users) => {
    const allUsersData = {}

    for (const username of users) {
      try {
        const userData = await apiService.getUser(username)
        if (userData.success) {
          allUsersData[username] = new Set(userData.data.visitedRestaurants)
        } else {
          allUsersData[username] = new Set()
        }
      } catch (error) {
        console.error(`Error loading visited restaurants for ${username}:`, error)
        allUsersData[username] = new Set()
      }
    }

    setAllUsersVisitedRestaurants(allUsersData)
  }

  const toggleVisitedRestaurant = async (restaurantId) => {
    const restaurant = allRestaurants.find(r => r.id === restaurantId)

    try {
      const result = await apiService.toggleVisitedRestaurant(currentUser, restaurantId, restaurant?.name, restaurant)

      if (result.success) {
        const newVisited = new Set(visitedRestaurants)
        if (result.visited) {
          newVisited.add(restaurantId)
        } else {
          newVisited.delete(restaurantId)
        }
        setVisitedRestaurants(newVisited)

        // Update all users visited restaurants data
        const newAllUsersData = { ...allUsersVisitedRestaurants }
        if (!newAllUsersData[currentUser]) {
          newAllUsersData[currentUser] = new Set()
        }
        if (result.visited) {
          newAllUsersData[currentUser].add(restaurantId)
        } else {
          newAllUsersData[currentUser].delete(restaurantId)
        }
        setAllUsersVisitedRestaurants(newAllUsersData)

        // Refresh social feed
        loadSocialFeed()
      }
    } catch (error) {
      console.error('Error toggling visited restaurant:', error)
      setError('Failed to update visited status')
    }
  }

  const toggleInterestedRestaurant = async (restaurantId) => {
    const restaurant = allRestaurants.find(r => r.id === restaurantId)

    try {
      const result = await apiService.toggleInterestedRestaurant(currentUser, restaurantId, restaurant)

      if (result.success) {
        const newInterested = new Set(interestedRestaurants)
        const newNotInterested = new Set(notInterestedRestaurants)

        if (result.interested) {
          newInterested.add(restaurantId)
          newNotInterested.delete(restaurantId)
        } else {
          newInterested.delete(restaurantId)
        }

        setInterestedRestaurants(newInterested)
        setNotInterestedRestaurants(newNotInterested)
      }
    } catch (error) {
      console.error('Error toggling interested restaurant:', error)
      setError('Failed to update interest status')
    }
  }

  const toggleNotInterestedRestaurant = async (restaurantId) => {
    const restaurant = allRestaurants.find(r => r.id === restaurantId)

    try {
      const result = await apiService.toggleNotInterestedRestaurant(currentUser, restaurantId, restaurant)

      if (result.success) {
        const newNotInterested = new Set(notInterestedRestaurants)
        const newInterested = new Set(interestedRestaurants)

        if (result.notInterested) {
          newNotInterested.add(restaurantId)
          newInterested.delete(restaurantId)
        } else {
          newNotInterested.delete(restaurantId)
        }

        setNotInterestedRestaurants(newNotInterested)
        setInterestedRestaurants(newInterested)
      }
    } catch (error) {
      console.error('Error toggling not interested restaurant:', error)
      setError('Failed to update interest status')
    }
  }


  const saveCurrentLocation = async () => {
    try {
      const result = await apiService.saveLocation(currentUser, currentLocation.name, currentLocation.coordinates)
      if (result.success) {
        setSavedLocations(result.savedLocations)
      }
    } catch (error) {
      console.error('Error saving location:', error)
      setError('Failed to save location')
    }
  }

  const removeSavedLocation = async (locationId) => {
    try {
      const result = await apiService.removeSavedLocation(currentUser, locationId)
      if (result.success) {
        setSavedLocations(result.savedLocations)
      }
    } catch (error) {
      console.error('Error removing saved location:', error)
      setError('Failed to remove location')
    }
  }

  const isLocationSaved = (locationName) => {
    return savedLocations.some(loc => loc.name === locationName)
  }

  // Determine which user visited a restaurant
  const getRestaurantVisitor = (restaurantId) => {
    // Check all users to see who visited this restaurant
    for (const [username, visitedSet] of Object.entries(allUsersVisitedRestaurants)) {
      if (visitedSet && visitedSet.has && visitedSet.has(restaurantId)) {
        return username
      }
    }
    return null
  }

  // Get appropriate icon based on interest level and visit status
  const getRestaurantIcon = (restaurantId) => {
    if (interestedRestaurants.has(restaurantId)) {
      return greenIcon
    } else if (notInterestedRestaurants.has(restaurantId)) {
      return redIcon
    }

    const visitor = getRestaurantVisitor(restaurantId)
    if (visitor === 'Julien') {
      return orangeIcon
    } else if (visitor === 'Jimmy') {
      return yellowIcon
    }

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

  const fetchRestaurants = async (location = currentLocation, radius = searchRadius) => {
    setLoading(true)
    setError(null)

    const lat = location.coordinates[0]
    const lon = location.coordinates[1]

    try {
      // First try to get restaurants from our API (cached data)
      const apiResult = await apiService.searchRestaurants(lat, lon, radius, selectedCuisine)

      if (apiResult.success && apiResult.data.length > 0) {
        console.log('Found cached restaurants:', apiResult.data.length)
        setAllRestaurants(apiResult.data)
        setRestaurants(apiResult.data)
        setLoading(false)
        return
      }

      // If no cached data, fetch from external API
      console.log('No cached data, fetching from Overpass API...')

      const query = `[out:json][timeout:25];
(
  node[amenity=restaurant](around:${radius},${lat},${lon});
  way[amenity=restaurant](around:${radius},${lat},${lon});
  relation[amenity=restaurant](around:${radius},${lat},${lon});
  node[amenity=cafe](around:${radius},${lat},${lon});
  way[amenity=cafe](around:${radius},${lat},${lon});
  node[amenity=fast_food](around:${radius},${lat},${lon});
  way[amenity=fast_food](around:${radius},${lat},${lon});
);
out center;`

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

      if (!data.elements || data.elements.length === 0) {
        setRestaurants([])
        return
      }

      // Process the data
      const processedRestaurants = data.elements.map((element, index) => {
        const lat = element.lat || (element.center && element.center.lat)
        const lon = element.lon || (element.center && element.center.lon)

        const amenityType = element.tags?.amenity || 'unknown'
        const name = element.tags?.name ||
                    element.tags?.brand ||
                    `${amenityType.charAt(0).toUpperCase() + amenityType.slice(1)} (Unnamed)`

        const capitalizeWords = (str) => {
          return str.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')
        }

        const rawCuisine = element.tags?.cuisine || 'Not specified'
        const formattedCuisine = rawCuisine === 'Not specified'
          ? 'Not specified'
          : rawCuisine.split(';').map(c => capitalizeWords(c.trim().replace(/_/g, ' '))).join(', ')

        const formattedType = capitalizeWords(amenityType.replace(/_/g, ' '))

        const getAddress = () => {
          const tags = element.tags || {}

          if (tags['addr:full']) {
            return tags['addr:full']
          }

          const components = []
          if (tags['addr:housenumber']) components.push(tags['addr:housenumber'])
          if (tags['addr:street']) components.push(tags['addr:street'])
          if (components.length > 0) {
            return components.join(' ')
          }

          if (tags['addr:place']) return tags['addr:place']
          if (tags['addr:suburb']) return tags['addr:suburb']
          if (tags['addr:city']) return tags['addr:city']

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
      }).filter(restaurant => restaurant.lat && restaurant.lng)

      setAllRestaurants(processedRestaurants)
      setRestaurants(processedRestaurants)

      // Restaurants will be saved to database only when users interact with them

    } catch (err) {
      console.error('Error fetching restaurants:', err)
      setError('Failed to fetch restaurants: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Extract unique cuisines from all restaurants with counts
  const getUniqueCuisines = () => {
    const cuisineCount = new Map()

    allRestaurants.forEach(restaurant => {
      if (restaurant.cuisine && restaurant.cuisine !== 'Not specified') {
        restaurant.cuisine.split(',').forEach(cuisine => {
          const trimmedCuisine = cuisine.trim()
          cuisineCount.set(trimmedCuisine, (cuisineCount.get(trimmedCuisine) || 0) + 1)
        })
      }
    })

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
        }

        typeCount.set(displayType, (typeCount.get(displayType) || 0) + 1)
      }
    })

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
        }
        return restaurant.type.toLowerCase().includes(filterType)
      })
    }

    // Filter by visit status
    if (visitStatus === 'visited') {
      filtered = filtered.filter(restaurant => visitedRestaurants.has(restaurant.id))
    } else if (visitStatus === 'unvisited') {
      filtered = filtered.filter(restaurant => !visitedRestaurants.has(restaurant.id))
    }

    setRestaurants(filtered)
  }

  const handleCuisineChange = (cuisine) => {
    setSelectedCuisine(cuisine)
    filterRestaurants(cuisine, selectedType, visitFilter)
  }

  const handleTypeChange = (type) => {
    setSelectedType(type)
    filterRestaurants(selectedCuisine, type, visitFilter)
  }

  const handleVisitFilterChange = (visitStatus) => {
    setVisitFilter(visitStatus)
    filterRestaurants(selectedCuisine, selectedType, visitStatus)
  }

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

  const handleRadiusChange = (newRadius) => {
    setSearchRadius(newRadius)
  }

  const applyRadiusChange = async () => {
    await fetchRestaurants(currentLocation, searchRadius)
  }

  const presetLocations = savedLocations.map(loc => ({
    ...loc,
    isDefault: false
  }))

  const selectPresetLocation = async (location) => {
    setSearchLocation(location.name)
    setCurrentLocation(location)
    await fetchRestaurants(location, searchRadius)
  }

  const getRestaurantEmoji = (cuisine, type) => {
    const cuisineEmojis = {
      italian: '🇮🇹',
      french: '🇫🇷',
      chinese: '🇨🇳',
      japanese: '🇯🇵',
      korean: '🇰🇷',
      thai: '🇹🇭',
      indian: '🇮🇳',
      mexican: '🇲🇽',
      american: '🇺🇸',
      pizza: '🍕',
      burger: '🍔',
      sushi: '🍣',
      seafood: '🦐',
      coffee: '☕',
      cafe: '☕',
      restaurant: '🍽️',
      fast_food: '🍔'
    }

    if (cuisine && cuisine !== 'Not specified') {
      const cuisineTypes = cuisine.toLowerCase().split(',').map(c => c.trim())

      for (const cuisineType of cuisineTypes) {
        if (cuisineEmojis[cuisineType]) {
          return cuisineEmojis[cuisineType]
        }
        for (const [key, emoji] of Object.entries(cuisineEmojis)) {
          if (cuisineType.includes(key) || key.includes(cuisineType)) {
            return emoji
          }
        }
      }
    }

    if (type && cuisineEmojis[type]) {
      return cuisineEmojis[type]
    }

    return '🍽️'
  }

  useEffect(() => {
    const initializeApp = async () => {
      await loadAvailableUsers()
      if (currentUser) {
        await loadUserData(currentUser)
      }
      await loadSocialFeed()
      await fetchRestaurants()
    }

    initializeApp()
  }, [])

  // Update user data when logged-in user changes
  useEffect(() => {
    if (currentUser) {
      loadUserData(currentUser)
    }
  }, [currentUser])

  useEffect(() => {
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
          <button onClick={() => fetchRestaurants()} className="retry-button">
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
                  <div key={location._id} className="preset-button-container">
                    <button
                      onClick={() => selectPresetLocation(location)}
                      className={`preset-button ${currentLocation.name === location.name ? 'active' : ''}`}
                    >
                      {location.name.split(',')[0]} ⭐
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSavedLocation(location._id)
                      }}
                      className="remove-location-button"
                      title="Remove saved location"
                    >
                      ×
                    </button>
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
                  {visitedRestaurants.has(restaurant.id) && (
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
                    className={`control-button visited-button ${visitedRestaurants.has(restaurant.id) ? 'active' : ''} ${currentUser.toLowerCase()}-profile`}
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
              className={`restaurant-card ${visitedRestaurants.has(restaurant.id) ? 'visited-card' : ''} ${index % 2 === 1 ? 'alternate' : ''}`}
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
                  {visitedRestaurants.has(restaurant.id) && (
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
                  className={`control-button visited-button ${visitedRestaurants.has(restaurant.id) ? 'active' : ''} ${currentUser.toLowerCase()}-profile`}
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

export default RestaurantsWithAPI