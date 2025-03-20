
from serpapi import GoogleSearch
from geopy.geocoders import Nominatim
from geopy.distance import geodesic

def get_lat_long(address):
    geolocator = Nominatim(user_agent="geo_locator")
    location = geolocator.geocode(address)
    if location:
        return location.latitude, location.longitude
    else:
        return None

# User input address
address = "1125 west washburne avenue, Chicago, 60608"  # Example address
coords = get_lat_long(address)

if coords:
    latitude, longitude = coords
    print(f"Address Coordinates: {latitude}, {longitude}")

    # SerpAPI search using latitude/longitude
    params = {
    "engine": "google_local",
    "q": "Restaurants",  # Search query
    "ll": f"@{latitude},{longitude},15z",  # Latitude/Longitude
    "location": 60608,  # Explicit location to improve relevance
    "hl": "en",
    "api_key": "from the env"
}


    search = GoogleSearch(params)
    results = search.get_dict()
    local_results = results.get("local_results", [])

    # # Print sorted results
    # for place in local_results:
    #     print(f"{place.get('title', 'Unknown')} - {place.get('address', 'No address')}")
else:
    print("Could not find coordinates for the given address.")


def calculate_distance(result):
    if "gps_coordinates" in result:
        lat = result["gps_coordinates"].get("latitude")
        lon = result["gps_coordinates"].get("longitude")
        if lat is not None and lon is not None:
            return geodesic(coords, (lat, lon)).miles  # Distance in miles
    return float('inf')  # If no GPS data, move to the end

# Sort results based on distance
sorted_results = sorted(local_results, key=calculate_distance)

# Print sorted results
for place in sorted_results:
    print(f"{place.get('title', 'Unknown')} - {place.get('address', 'No address')} - Distance: {calculate_distance(place):.2f} miles")


