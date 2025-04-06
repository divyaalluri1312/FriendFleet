import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Loader, Search as SearchIcon, Ban, MapPin, ArrowRight, Car, Users, Clock, UserCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import mapboxgl from 'mapbox-gl';
import "mapbox-gl/dist/mapbox-gl.css";
import axios from 'axios';

const MAPBOX_TOKEN = "pk.eyJ1IjoieWFzd2FudGgyMDA3IiwiYSI6ImNtOHp2Y2pmcTA4ZjUyc3E3bG9qd3QzN2EifQ.-o4c1vzZup3s8JMYdBtvxw";
mapboxgl.accessToken = MAPBOX_TOKEN;

const Search = ({ publishedRides = [] }) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rides, setRides] = useState([]);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [activeInput, setActiveInput] = useState(null);
  const [genderPreference, setGenderPreference] = useState("any");

  useEffect(() => {
    setTimeout(() => {
      const mapContainer = document.getElementById("map");
      if (!mapContainer) return;

      const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/dark-v11",
        center: [78.4867, 17.3850],
        zoom: 9,
      });

      map.on("load", () => setMapLoading(false));

      return () => map.remove();
    }, 100);
  }, []);

  const fetchSuggestions = async (query, setSuggestions) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json`,
        {
          params: {
            access_token: MAPBOX_TOKEN,
            autocomplete: true,
            types: "place,postcode,address",
          },
        }
      );

      setSuggestions(response.data.features);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const fetchRides = async () => {
    if (!from || !to || !date) {
      return;
    }

    setLoading(true);
    setRides([]);

    try {
      const response = await axios.get("http://localhost:5000/api/rides/search", {
        params: { 
          from, 
          to, 
          date: date.toISOString(),
          genderPreference 
        },
      });

      setRides(response.data.rides || []);
    } catch (error) {
      console.error("Error fetching rides:", error);
      setRides([]);
    }

    setLoading(false);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    const locationButton = document.getElementById("location-button");
    if (locationButton) {
      locationButton.classList.add("animate-pulse");
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await axios.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`,
            {
              params: {
                access_token: MAPBOX_TOKEN,
              },
            }
          );

          if (response.data.features.length > 0) {
            setFrom(response.data.features[0].place_name);
          }
        } catch (error) {
          console.error("Error getting current location:", error);
        } finally {
          if (locationButton) {
            locationButton.classList.remove("animate-pulse");
          }
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location.");
        if (locationButton) {
          locationButton.classList.remove("animate-pulse");
        }
      }
    );
  };

  const formatTime = (time) => {
    return `${time.hour}:${time.minute} ${time.ampm}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 pb-40">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text"
      >
        Find Your Perfect Ride
      </motion.h1>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-gray-700"
      >
        <div className="space-y-6">
          {/* From Location Input */}
          <div className="relative">
            <label className="block text-gray-300 text-sm font-medium mb-2">From</label>
            <div className="relative">
              <input 
                type="text" 
                className={`w-full p-4 bg-gray-700/50 border ${activeInput === 'from' ? 'border-blue-500' : 'border-gray-600'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                placeholder="Enter departure location"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  fetchSuggestions(e.target.value, setFromSuggestions);
                }}
                onFocus={() => setActiveInput('from')}
                onBlur={() => setTimeout(() => setActiveInput(null), 200)}
              />
              <button 
                id="location-button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 transition-colors duration-300"
                onClick={getCurrentLocation}
              >
                <MapPin size={20} />
              </button>
            </div>

            <AnimatePresence>
              {fromSuggestions.length > 0 && (
                <motion.ul 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded-xl mt-2 max-h-48 overflow-auto custom-scrollbar"
                >
                  {fromSuggestions.map((place) => (
                    <motion.li
                      key={place.id}
                      whileHover={{ backgroundColor: "rgba(75, 85, 99, 0.3)" }}
                      className="p-3 cursor-pointer transition-colors duration-200"
                      onClick={() => {
                        setFrom(place.place_name);
                        setFromSuggestions([]);
                      }}
                    >
                      {place.place_name}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* To Location Input */}
          <div className="relative">
            <label className="block text-gray-300 text-sm font-medium mb-2">To</label>
            <input 
              type="text" 
              className={`w-full p-4 bg-gray-700/50 border ${activeInput === 'to' ? 'border-blue-500' : 'border-gray-600'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
              placeholder="Enter destination"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                fetchSuggestions(e.target.value, setToSuggestions);
              }}
              onFocus={() => setActiveInput('to')}
              onBlur={() => setTimeout(() => setActiveInput(null), 200)}
            />

            <AnimatePresence>
              {toSuggestions.length > 0 && (
                <motion.ul 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded-xl mt-2 max-h-48 overflow-auto custom-scrollbar"
                >
                  {toSuggestions.map((place) => (
                    <motion.li
                      key={place.id}
                      whileHover={{ backgroundColor: "rgba(75, 85, 99, 0.3)" }}
                      className="p-3 cursor-pointer transition-colors duration-200"
                      onClick={() => {
                        setTo(place.place_name);
                        setToSuggestions([]);
                      }}
                    >
                      {place.place_name}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Date Input */}
          <div className="relative">
            <label className="block text-gray-300 text-sm font-medium mb-2">Date</label>
            <div className="relative">
              <DatePicker
                selected={date}
                onChange={(newDate) => setDate(newDate)}
                dateFormat="dd/MM/yyyy"
                minDate={new Date()}
                placeholderText="Select travel date"
                className={`w-full p-4 bg-gray-700/50 border ${activeInput === 'date' ? 'border-blue-500' : 'border-gray-600'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                onFocus={() => setActiveInput('date')}
                onBlur={() => setActiveInput(null)}
              />
              <Calendar
                size={20}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Gender Preference */}
          <div className="relative">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              <div className="flex items-center space-x-2">
                <UserCircle size={20} className="text-blue-400" />
                <span>Gender Preference</span>
              </div>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                className={`p-3 rounded-lg border transition-all duration-300 ${
                  genderPreference === 'any'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'border-gray-600 hover:border-blue-500/50'
                }`}
                onClick={() => setGenderPreference('any')}
              >
                Any
              </button>
              <button
                className={`p-3 rounded-lg border transition-all duration-300 ${
                  genderPreference === 'male'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'border-gray-600 hover:border-blue-500/50'
                }`}
                onClick={() => setGenderPreference('male')}
              >
                Male
              </button>
              <button
                className={`p-3 rounded-lg border transition-all duration-300 ${
                  genderPreference === 'female'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'border-gray-600 hover:border-blue-500/50'
                }`}
                onClick={() => setGenderPreference('female')}
              >
                Female
              </button>
            </div>
          </div>

          {/* Search Button */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchRides}
            className="w-full flex items-center justify-center p-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl transition duration-300 shadow-lg hover:shadow-xl"
            disabled={loading}
          >
            {loading ? (
              <Loader className="animate-spin" size={24} />
            ) : (
              <>
                <SearchIcon size={24} />
                <span className="ml-2">Search Rides</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Map Display */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative mt-8 rounded-2xl overflow-hidden shadow-2xl border border-gray-700"
      >
        <div id="map" className="h-72">
          {mapLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 backdrop-blur-sm">
              <Loader className="animate-spin text-blue-500" size={40} />
            </div>
          )}
        </div>
      </motion.div>

      {/* Available Rides */}
      <AnimatePresence>
        {rides.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8 space-y-4"
          >
            <h2 className="text-2xl font-semibold mb-6">Available Rides</h2>
            {rides.map((ride) => (
              <motion.div
                key={ride._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={ride.driver.profileImage}
                        alt={ride.driver.name}
                        className="w-12 h-12 rounded-full border-2 border-blue-500"
                      />
                      <div>
                        <h3 className="text-lg font-semibold">{ride.driver.name}</h3>
                        <p className="text-gray-400 text-sm">{ride.driver.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-8">
                      <div className="flex items-center space-x-2">
                        <Car size={20} className="text-blue-400" />
                        <span>{ride.vehicle.model}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users size={20} className="text-blue-400" />
                        <span>{ride.seats} seats available</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock size={20} className="text-blue-400" />
                        <span>{formatTime(ride.time)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-400">From</p>
                        <p className="font-medium">{ride.from}</p>
                      </div>
                      <ArrowRight size={20} className="text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-400">To</p>
                        <p className="font-medium">{ride.to}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Published Rides */}
      <AnimatePresence>
        {publishedRides.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8 space-y-4"
          >
            <h2 className="text-2xl font-semibold mb-6">Recently Published Rides</h2>
            {publishedRides.map((ride) => (
              <motion.div
                key={ride._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={ride.driver?.profileImage || 'https://via.placeholder.com/40'}
                        alt={ride.driver?.name || 'Driver'}
                        className="w-12 h-12 rounded-full border-2 border-blue-500"
                      />
                      <div>
                        <h3 className="text-lg font-semibold">{ride.driver?.name || 'Anonymous'}</h3>
                        <p className="text-gray-400 text-sm">{ride.driver?.phone || 'No phone'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-8">
                      <div className="flex items-center space-x-2">
                        <Car size={20} className="text-blue-400" />
                        <span>{ride.vehicle?.model || 'Vehicle'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users size={20} className="text-blue-400" />
                        <span>{ride.seats} seats available</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock size={20} className="text-blue-400" />
                        <span>{formatTime(ride.time)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-400">From</p>
                        <p className="font-medium">{ride.from}</p>
                      </div>
                      <ArrowRight size={20} className="text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-400">To</p>
                        <p className="font-medium">{ride.to}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Results Message */}
      <AnimatePresence>
        {rides.length === 0 && publishedRides.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center mt-12"
          >
            <Ban size={80} className="text-red-500/80 mx-auto mb-4" />
            <p className="text-2xl font-bold text-red-500/80">No Rides Available</p>
            <p className="text-gray-400 mt-2">Try different locations or dates</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Search;