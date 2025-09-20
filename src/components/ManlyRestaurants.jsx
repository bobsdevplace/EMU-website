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

const ManlyRestaurants = () => {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCuisine, setSelectedCuisine] = useState('all')
  const [allRestaurants, setAllRestaurants] = useState([])

  // Manly Beach coordinates: 33°47′23″S 151°17′16″E
  const manlyBeach = [-33.797286, 151.287778]

  const fetchRestaurants = async () => {
    setLoading(true)
    setError(null)

    // Overpass API query for restaurants within 5km of Manly Beach
    // Note: manlyBeach[0] is already negative, so we use it directly
    const lat = manlyBeach[0] // -33.797286
    const lon = manlyBeach[1] // 151.287778

    const query = `[out:json][timeout:25];
(
  node[amenity=restaurant](around:5000,${lat},${lon});
  way[amenity=restaurant](around:5000,${lat},${lon});
  relation[amenity=restaurant](around:5000,${lat},${lon});
  node[amenity=cafe](around:5000,${lat},${lon});
  way[amenity=cafe](around:5000,${lat},${lon});
  node[amenity=fast_food](around:5000,${lat},${lon});
  way[amenity=fast_food](around:5000,${lat},${lon});
);
out center;`

    console.log('Overpass API Query:', query)
    console.log('Searching around coordinates:', lat, lon)

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

        // Format cuisine: replace semicolons with commas and underscores with spaces
        const rawCuisine = element.tags?.cuisine || 'Not specified'
        const formattedCuisine = rawCuisine === 'Not specified'
          ? 'Not specified'
          : rawCuisine.split(';').map(c => c.trim().replace(/_/g, ' ')).join(', ')

        return {
          id: element.id || index,
          name: name,
          type: amenityType,
          cuisine: formattedCuisine,
          address: element.tags?.['addr:full'] ||
                   `${element.tags?.['addr:housenumber'] || ''} ${element.tags?.['addr:street'] || ''}`.trim() ||
                   'Address not available',
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
      setAllRestaurants(processedRestaurants)
      setRestaurants(processedRestaurants)
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

  // Filter restaurants based on selected cuisine
  const filterRestaurants = (cuisine) => {
    if (cuisine === 'all') {
      setRestaurants(allRestaurants)
    } else {
      const filtered = allRestaurants.filter(restaurant =>
        restaurant.cuisine.toLowerCase().includes(cuisine.toLowerCase())
      )
      setRestaurants(filtered)
    }
  }

  // Handle cuisine filter change
  const handleCuisineChange = (cuisine) => {
    setSelectedCuisine(cuisine)
    filterRestaurants(cuisine)
  }

  useEffect(() => {
    fetchRestaurants()
  }, [])

  useEffect(() => {
    // Update filtered restaurants when allRestaurants changes
    filterRestaurants(selectedCuisine)
  }, [allRestaurants, selectedCuisine])

  if (loading) {
    return (
      <div className="manly-restaurants-container">
        <div className="loading-container">
          <h1>Loading Restaurants near Manly Beach...</h1>
          <div className="loading-spinner">🍽️</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="manly-restaurants-container">
        <div className="error-container">
          <h1>Restaurants near Manly Beach</h1>
          <p className="error-message">{error}</p>
          <button onClick={fetchRestaurants} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="manly-restaurants-container">
      <div className="map-header">
        <h1>Restaurants near Manly Beach</h1>
        <p>Discover restaurants within 5km of Manly Beach, Australia</p>
        <p className="restaurant-count">
          Found {restaurants.length} of {allRestaurants.length} restaurants
        </p>

        {/* Cuisine Filter */}
        <div className="filter-container">
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
      </div>

      <MapContainer
        center={manlyBeach}
        zoom={12}
        style={{ height: '600px', width: '100%' }}
        className="restaurant-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Manly Beach marker */}
        <Marker position={manlyBeach}>
          <Popup>
            <div className="beach-popup">
              <h3>🏖️ Manly Beach</h3>
              <p>Reference point for restaurant search</p>
            </div>
          </Popup>
        </Marker>

        {/* Restaurant markers */}
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={[restaurant.lat, restaurant.lng]}
          >
            <Popup>
              <div className="restaurant-popup">
                <h3>{restaurant.name}</h3>
                <p className="type"><strong>Type:</strong> {restaurant.type}</p>
                <p className="cuisine"><strong>Cuisine:</strong> {restaurant.cuisine}</p>
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
                <div className="restaurant-services">
                  {restaurant.takeaway !== 'N/A' && restaurant.takeaway === 'yes' && (
                    <span className="service-tag">📦 Takeaway</span>
                  )}
                  {restaurant.delivery !== 'N/A' && restaurant.delivery === 'yes' && (
                    <span className="service-tag">🚚 Delivery</span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="restaurant-list">
        <h2>Restaurant Directory</h2>
        <div className="restaurant-grid">
          {restaurants.slice(0, 12).map((restaurant) => (
            <div key={restaurant.id} className="restaurant-card">
              <h3>{restaurant.name}</h3>
              <p className="type">{restaurant.type}</p>
              <p className="cuisine">{restaurant.cuisine}</p>
              <p className="address">{restaurant.address}</p>
              {restaurant.phone !== 'N/A' && (
                <p className="phone">📞 {restaurant.phone}</p>
              )}
              {restaurant.opening_hours !== 'N/A' && (
                <p className="hours">🕒 {restaurant.opening_hours}</p>
              )}
              <div className="restaurant-services">
                {restaurant.takeaway !== 'N/A' && restaurant.takeaway === 'yes' && (
                  <span className="service-tag">📦</span>
                )}
                {restaurant.delivery !== 'N/A' && restaurant.delivery === 'yes' && (
                  <span className="service-tag">🚚</span>
                )}
              </div>
              {restaurant.website && (
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="website-link"
                >
                  Visit Website
                </a>
              )}
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

export default ManlyRestaurants