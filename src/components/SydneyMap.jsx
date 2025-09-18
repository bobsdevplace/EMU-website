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

const sydneyRestaurants = [
  {
    id: 1,
    name: "Quay Restaurant",
    cuisine: "Modern Australian",
    address: "Upper Level, Overseas Passenger Terminal, Circular Quay",
    lat: -33.8588,
    lng: 151.2153,
    rating: 4.8,
    price: "$$$$"
  },
  {
    id: 2,
    name: "Bennelong Restaurant",
    cuisine: "Australian",
    address: "Sydney Opera House, Bennelong Point",
    lat: -33.8568,
    lng: 151.2153,
    rating: 4.6,
    price: "$$$$"
  },
  {
    id: 3,
    name: "Attica",
    cuisine: "Fine Dining",
    address: "74 Glen Eira Rd, Ripponlea",
    lat: -33.8668,
    lng: 151.2073,
    rating: 4.9,
    price: "$$$$"
  },
  {
    id: 4,
    name: "Mr. Wong",
    cuisine: "Chinese",
    address: "3 Bridge Ln, Sydney",
    lat: -33.8688,
    lng: 151.2093,
    rating: 4.5,
    price: "$$$"
  },
  {
    id: 5,
    name: "Rockpool Bar & Grill",
    cuisine: "Steakhouse",
    address: "66 Hunter St, Sydney",
    lat: -33.8688,
    lng: 151.2073,
    rating: 4.4,
    price: "$$$$"
  },
  {
    id: 6,
    name: "Tetsuya's",
    cuisine: "Japanese-French",
    address: "529 Kent St, Sydney",
    lat: -33.8758,
    lng: 151.2023,
    rating: 4.7,
    price: "$$$$"
  },
  {
    id: 7,
    name: "Yellow",
    cuisine: "Contemporary",
    address: "57 Macleay St, Potts Point",
    lat: -33.8708,
    lng: 151.2223,
    rating: 4.3,
    price: "$$$"
  },
  {
    id: 8,
    name: "Paper Bird",
    cuisine: "Japanese",
    address: "1 Angel Pl, Sydney",
    lat: -33.8668,
    lng: 151.2093,
    rating: 4.6,
    price: "$$$"
  },
  {
    id: 9,
    name: "Aria Restaurant",
    cuisine: "Modern Australian",
    address: "1 Macquarie St, East Circular Quay",
    lat: -33.8598,
    lng: 151.2143,
    rating: 4.5,
    price: "$$$$"
  },
  {
    id: 10,
    name: "The Grounds of Alexandria",
    cuisine: "Cafe & Restaurant",
    address: "2 Huntley St, Alexandria",
    lat: -33.9068,
    lng: 151.1963,
    rating: 4.2,
    price: "$$"
  }
];

const SydneyMap = () => {
  // Sydney city center coordinates
  const sydneyCenter = [-33.8688, 151.2093];

  return (
    <div className="sydney-map-container">
      <div className="map-header">
        <h1>Partner Restaurants in Sydney</h1>
        <p>Discover amazing restaurants where you can earn EMU rewards</p>
      </div>

      <MapContainer
        center={sydneyCenter}
        zoom={13}
        style={{ height: '600px', width: '100%' }}
        className="restaurant-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {sydneyRestaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={[restaurant.lat, restaurant.lng]}
          >
            <Popup>
              <div className="restaurant-popup">
                <h3>{restaurant.name}</h3>
                <p className="cuisine">{restaurant.cuisine}</p>
                <p className="address">{restaurant.address}</p>
                <div className="restaurant-details">
                  <span className="rating">⭐ {restaurant.rating}</span>
                  <span className="price">{restaurant.price}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="restaurant-list">
        <h2>Featured Restaurants</h2>
        <div className="restaurant-grid">
          {sydneyRestaurants.slice(0, 6).map((restaurant) => (
            <div key={restaurant.id} className="restaurant-card">
              <h3>{restaurant.name}</h3>
              <p className="cuisine">{restaurant.cuisine}</p>
              <p className="address">{restaurant.address}</p>
              <div className="restaurant-meta">
                <span className="rating">⭐ {restaurant.rating}</span>
                <span className="price">{restaurant.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SydneyMap;