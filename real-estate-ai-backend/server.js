const path = require('path');
const dotenv = require('dotenv');

// Load .env from parent directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});


// API keys (Replace these with actual keys securely)
const OPENAI_API_KEY = process.env.OPENAI_API;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API;

// Queue for API requests
const requestQueue = [];
let processing = false;

// Exponential backoff retry logic for API calls
async function callOpenAIWithRetry(data, retries = 3, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                data,
                {
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 429 && i < retries - 1) {
                console.warn(`Rate limit hit, retrying in ${delay}ms...`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2; // Increase delay exponentially
            } else {
                throw error;
            }
        }
    }
}

// Function to process request queue
async function processQueue() {
    if (processing || requestQueue.length === 0) return;
    processing = true;

    while (requestQueue.length > 0) {
        const { data, resolve, reject } = requestQueue.shift();
        try {
            const result = await callOpenAIWithRetry(data);
            resolve(result);
        } catch (error) {
            reject(error);
        }
    }

    processing = false;
}

// Function to add requests to the queue
function addToQueue(data) {
    return new Promise((resolve, reject) => {
        requestQueue.push({ data, resolve, reject });
        processQueue();
    });
}

// Endpoint to handle chat messages
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        // Regular expression to detect locations (ZIP codes, city names)
        const locationMatches = message.match(/(\d{5})|([a-zA-Z]+(?:[\s-][a-zA-Z]+)*,?\s*[A-Z]{2})/i);
        const hasLocationKeywords = /location|area|around|near|zipcode|zip code|in the|neighborhood/i.test(message);
        
        let location = locationMatches ? locationMatches[0] : null;

        // If no location found, use OpenAI to extract one
        if (!location || hasLocationKeywords) {
            const openaiData = {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that extracts location information from user queries. ' +
                            'Respond with ONLY the location name or zip code, nothing else. If no location is mentioned, respond with "NO_LOCATION".'
                    },
                    { role: 'user', content: `Extract the location from this query: "${message}"` }
                ]
            };

            const openaiResponse = await addToQueue(openaiData);
            location = openaiResponse.choices[0].message.content.trim();
        }

        console.log("Extracted location:", location);

        // If OpenAI couldn't find a location
        if (location === 'NO_LOCATION') {
            return res.json({
                reply: "I couldn't identify a specific location. Could you provide a city, zip code, or neighborhood?",
                places: []
            });
        }

        // Fetch places using Google Maps API
        const placesData = await getPlacesInLocation(location);

        if (placesData.error) {
            return res.json({
                reply: `I had trouble finding information about "${location}". Please check the spelling or try another location.`,
                places: []
            });
        }

        // Categorize places for better response
        const categories = {};
        placesData.places.forEach(place => {
            if (!categories[place.type]) {
                categories[place.type] = [];
            }
            categories[place.type].push(place);
        });

        let reply = `I found information about ${placesData.address}. Here's what's nearby:\n\n`;

        Object.keys(categories).forEach(category => {
            const placesInCategory = categories[category];
            reply += `${category.charAt(0).toUpperCase() + category.slice(1)}: `;
            reply += placesInCategory.slice(0, 3).map(p => `${p.name} (${p.distance} miles away)`).join(', ');

            if (placesInCategory.length > 3) {
                reply += ` and ${placesInCategory.length - 3} more`;
            }
            reply += '.\n\n';
        });

        reply += "Click 'Open in Google Maps' for directions and more details.";

        return res.json({ reply, places: placesData.places });
    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({
            reply: "I'm sorry, I encountered an error processing your request. Please try again.",
            places: []
        });
    }
});

// Function to fetch places using Google Maps API
// async function getPlacesInLocation(location) {
//     try {
//         const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_MAPS_API_KEY}`;
//         const geocodeResponse = await axios.get(geocodeUrl);

//         console.log("Geocode response:", geocodeResponse.data);

//         if (geocodeResponse.data.status !== 'OK' || !geocodeResponse.data.results.length) {
//             return { error: 'Location not found' };
//         }

//         const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
//         const formattedAddress = geocodeResponse.data.results[0].formatted_address;

//         // Categories of places to search
//         console.log("Searching for places near:", lat, lng);

//         // const categories = ['restaurant'];
//         const categories = ['school', 'university', 'transit_station', 'airport', 'park', 'restaurant', 'shopping_mall', 'hospital', 'grocery_or_supermarket'];

//         let allPlaces = [];

//         // for (const category of categories) {
//         const placesUrl = `https://places.googleapis.com/v1/places:searchNearby`;
//         const placesResponse = await axios.post(placesUrl, {
//             includedTypes: [categories],
//             maxResultCount: 20,
//             locationRestriction: {
//                 circle: {
//                 center: { latitude: lat, longitude: lng },
//                 radius: 5000.0
//                 }
//             }
//             }, {
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
//                 'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount'
//             }
//             });
            
//         console.log(`Searching for ${categories} places...`);
//         console.log("Places URL:", placesUrl);
//         console.log("Places response status:", placesResponse.data.status);
//         console.log("Places found:", placesResponse.data.results.length);

//         if (placesResponse.data.places) {
//             allPlaces = [...allPlaces, ...placesResponse.data.places.map(place => ({
//                 name: place.displayName.text,
//                 place_id: place.id,
//                 address: place.formattedAddress,
//                 type: category.replace('_', ' '),
//                 location: place.location,
//                 rating: place.rating,
//                 user_ratings_total: place.userRatingCount,
//                 distance: calculateDistance(lat, lng, place.location.latitude, place.location.longitude).toFixed(1)
//             }))];
//             }
              
//         // }

//         return { address: formattedAddress, coordinates: { lat, lng }, places: allPlaces.slice(0, 20) };
//     } catch (error) {
//         console.error('Error fetching places:', error);
//         return { error: 'Failed to fetch places information' };
//     }
// }


// Function to fetch places using Google Maps API
async function getPlacesInLocation(location) {
    try {
        // Format location string for zip codes
        let locationQuery = location;
        if (/^\d{5}$/.test(location)) {
            locationQuery = `${location}, USA`; // Append USA to zip codes for better geocoding
        }
        
        console.log(`Looking up location: "${locationQuery}"`);
        
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}&key=${GOOGLE_MAPS_API_KEY}`;
        const geocodeResponse = await axios.get(geocodeUrl);

        console.log("Geocode status:", geocodeResponse.data.status);
        
        if (geocodeResponse.data.status !== 'OK' || !geocodeResponse.data.results.length) {
            console.error("Geocoding failed:", geocodeResponse.data);
            return { error: 'Location not found' };
        }

        const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
        const formattedAddress = geocodeResponse.data.results[0].formatted_address;

        console.log(`Successfully geocoded to: ${formattedAddress} (${lat}, ${lng})`);

        // Define categories to search for
        const categories = ['restaurant', 'school', 'university', 'transit_station', 'airport', 
                           'park', 'shopping_mall', 'hospital'];

        // Make the Places API request
        const placesUrl = `https://places.googleapis.com/v1/places:searchNearby`;
        const placesPayload = {
            includedTypes: categories,
            maxResultCount: 20,
            locationRestriction: {
                circle: {
                    center: { latitude: lat, longitude: lng },
                    radius: 5000.0
                }
            }
        };
        
        console.log("Sending places request with payload:", JSON.stringify(placesPayload));
        
        const placesResponse = await axios.post(placesUrl, placesPayload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount'
            }
        });
        
        console.log("Places API response received");
        
        // Check if places data exists in the response
        if (!placesResponse.data || !placesResponse.data.places) {
            console.error("No places found in response:", placesResponse.data);
            return { 
                address: formattedAddress, 
                coordinates: { lat, lng }, 
                places: [] 
            };
        }
        
        let allPlaces = [];
        
        // Process the places from the response
        allPlaces = placesResponse.data.places.map(place => {
            // Determine the primary place type
            let primaryType = 'place';
            if (place.types && place.types.length > 0) {
                // Find the first category that matches our categories list, or use the first type
                const matchedType = place.types.find(type => categories.includes(type)) || place.types[0];
                primaryType = matchedType.replace(/_/g, ' ');
            }
            
            return {
                name: place.displayName?.text || 'Unnamed Place',
                place_id: place.id || '',
                address: place.formattedAddress || 'No address available',
                type: primaryType,
                location: place.location || { latitude: lat, longitude: lng },
                rating: place.rating || 0,
                user_ratings_total: place.userRatingCount || 0,
                distance: place.location ? 
                    calculateDistance(lat, lng, place.location.latitude, place.location.longitude).toFixed(1) : 
                    'unknown'
            };
        });

        console.log(`Found ${allPlaces.length} places near ${formattedAddress}`);
        return { address: formattedAddress, coordinates: { lat, lng }, places: allPlaces };
    } catch (error) {
        console.error('Error fetching places:', error.message);
        if (error.response) {
            console.error('API Error Data:', error.response.data);
            console.error('API Error Status:', error.response.status);
        }
        return { error: `Failed to fetch places information: ${error.message}` };
    }
}


app.post('/api/properties', async (req, res) => {
    try {
      const { location, type } = req.body;
      const propertyType = type || 'all'; // all, rent, sale, lease
      
      // First, geocode the location
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_MAPS_API_KEY}`;
      const geocodeResponse = await axios.get(geocodeUrl);
      
      if (geocodeResponse.data.status !== 'OK' || !geocodeResponse.data.results.length) {
        return res.json({
          error: 'Location not found',
          properties: []
        });
      }
      
      const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
      const formattedAddress = geocodeResponse.data.results[0].formatted_address;
      
      // For Dubai specifically, we can use a condition
      const isDubai = formattedAddress.toLowerCase().includes('dubai');
      
      // Search for real estate relevant places
      const categories = ['real_estate_agency', 'lodging', 'apartment', 'condominium'];
      
      const placesUrl = `https://places.googleapis.com/v1/places:searchNearby`;
      const placesPayload = {
        includedTypes: categories,
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 5000.0
          }
        }
      };
      
      const placesResponse = await axios.post(placesUrl, placesPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.photos,places.priceLevel'
        }
      });
      
      if (!placesResponse.data || !placesResponse.data.places) {
        return res.json({
          address: formattedAddress,
          coordinates: { lat, lng },
          properties: []
        });
      }
      
      // Process the properties
      const properties = placesResponse.data.places.map(place => {
        // For demonstration, we'll simulate some property details
        const randomPrice = isDubai 
          ? Math.floor(Math.random() * 1000000) + 500000 // Dubai prices (AED)
          : Math.floor(Math.random() * 5000) + 1000; // Other locations (USD)
        
        const randomBeds = Math.floor(Math.random() * 4) + 1;
        const randomBaths = Math.floor(Math.random() * 3) + 1;
        const randomSqft = Math.floor(Math.random() * 2000) + 600;
        
        // Randomly assign a property type
        const types = ['Apartment', 'Villa', 'Townhouse', 'Condo'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        // Randomly assign a listing type
        const listingTypes = ['For Rent', 'For Sale', 'For Lease'];
        const randomListingType = listingTypes[Math.floor(Math.random() * listingTypes.length)];
        
        // Filter by property type if specified
        if (propertyType !== 'all') {
          if (propertyType === 'rent' && randomListingType !== 'For Rent') return null;
          if (propertyType === 'sale' && randomListingType !== 'For Sale') return null;
          if (propertyType === 'lease' && randomListingType !== 'For Lease') return null;
        }
        
        return {
          id: place.id || `prop-${Math.random().toString(36).substr(2, 9)}`,
          name: place.displayName?.text || `${randomBeds} Bed ${randomType}`,
          address: place.formattedAddress || 'Address not available',
          type: randomType,
          listingType: randomListingType,
          price: randomPrice,
          currency: isDubai ? 'AED' : 'USD',
          beds: randomBeds,
          baths: randomBaths,
          sqft: randomSqft,
          location: place.location || { latitude: lat, longitude: lng },
          rating: place.rating || 0,
          distance: place.location ? 
            calculateDistance(lat, lng, place.location.latitude, place.location.longitude).toFixed(1) : 
            'unknown'
        };
      }).filter(Boolean); // Remove null values
      
      // Add a message to include with the properties
      let message = `I found ${properties.length} properties in ${formattedAddress}.`;
      if (properties.length > 0) {
        if (isDubai) {
          message += " Dubai's real estate market is quite active with options ranging from luxury apartments to waterfront villas.";
        } else {
          message += " Here are some properties that might interest you.";
        }
      } else {
        message += " I couldn't find any properties matching your criteria. Try expanding your search area or changing filters.";
      }
      
      return res.json({
        message,
        address: formattedAddress,
        coordinates: { lat, lng },
        properties
      });
    } catch (error) {
      console.error('Error fetching properties:', error.message);
      if (error.response) {
        console.error('API Error Data:', error.response.data);
        console.error('API Error Status:', error.response.status);
      }
      return res.status(500).json({
        error: `Failed to fetch properties: ${error.message}`,
        properties: []
      });
    }
  });


// Function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Add this to your server.js file outside your endpoints
// Run it once when the server starts

async function testGoogleAPI() {
    try {
      const testUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=44.5646,-123.2620&radius=5000&type=restaurant&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await axios.get(testUrl);
      console.log("API Test Status:", response.data.status);
      console.log("API Test Results Count:", response.data.results ? response.data.results.length : 0);
      console.log("API Test First Result:", response.data.results?.[0] || "No results");
    } catch (error) {
      console.error("API Test Error:", error.message);
    }
  }
  
// Call the test function
testGoogleAPI();


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


