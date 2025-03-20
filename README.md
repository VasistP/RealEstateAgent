# RealEstateAI
An AI agent to help you find your dream home
# Real Estate AI Agent

## Overview

The Real Estate AI Agent is a React-based web application that allows users to search for real estate properties and nearby amenities in a given location. The application utilizes a Node.js backend with Express to handle API requests, integrate with the Google Maps API, and use OpenAI for location extraction.

## Features

*   **Intelligent Chat Interface:** Users can interact with the AI agent through a chat window to search for properties.
*   **Dynamic Location Extraction:**  The AI agent uses OpenAI to extract location information from user queries, even if the location isn't explicitly stated.
*   **Property Search:** Fetches real estate properties (apartments, houses, etc.) and nearby amenities using the Google Maps API.  Specialized handling for Dubai properties is included (using mock data, but designed for API integration).
*   **Formatted Chat Responses:** Displays bot responses with proper formatting, including line breaks and categorized property information.
*   **Interactive Property Cards:** Presents search results in a user-friendly card format with key details like address, rating, and a link to open the location in Google Maps.
*   **Real Estate Focus:** The AI is specifically tuned to understand and respond to queries related to real estate, apartments, houses, and property rentals/sales.

## Technologies Used

### Frontend

*   **React:** A JavaScript library for building user interfaces.
*   **CSS:**  For styling the application components.

### Backend

*   **Node.js:**  A JavaScript runtime environment.
*   **Express:** A web application framework for Node.js.
*   **cors:** Middleware to enable Cross-Origin Resource Sharing.
*   **axios:**  A promise-based HTTP client for making API requests.

### APIs

*   **Google Maps API:**  Used for geocoding locations and searching for nearby properties and amenities.
*   **OpenAI API:**  Used for extracting location information from user queries. (GPT-3.5-turbo)
*   **[Potentially] Property Finder API / Bayut API / Dubai Land Department API:** Intended for fetching Dubai-specific real estate data. (Currently using mock data)


## Setup Instructions

### Prerequisites

*   Node.js (v16 or higher)
*   npm (Node Package Manager)
*   API keys for Google Maps API and OpenAI API

### Installation

1.  **Clone the repository:**

    ```
    git clone <repository_url>
    cd real-estate-ai-agent
    ```

2.  **Install frontend dependencies:**

    ```
    npm install
    ```

3.  **Install backend dependencies:**

    ```
    cd real-estate-ai-backend
    npm install
    ```

4.  **Configure environment variables:**

    *   Create a `.env` file in the root directory of the `real-estate-ai-agent` and `real-estate-ai-backend` folder.
    *   Add the following environment variables:

        ```
        # .env (Frontend - if needed)
        # You might not need .env in the frontend, 
        # but you can store API URLs here if you prefer

        # .env (Backend - real-estate-ai-backend)
        OPENAI_API_KEY=your_openai_api_key
        GOOGLE_MAPS_API_KEY=your_google_maps_api_key
        PROPERTY_FINDER_API_KEY=your_property_finder_api_key
        ```

    *   Replace `your_openai_api_key`, `your_google_maps_api_key`, and `your_property_finder_api_key` with your actual API keys.

### Running the Application

1.  **Start the backend server:**

    ```
    cd real-estate-ai-backend
    npm start
    ```

    The server will run on `http://localhost:3001`.

2.  **Start the frontend application:**

    ```
    cd ../real-estate-ai-agent
    npm start
    ```

    The application will run on `http://localhost:3000`.

3.  **Open the application in your browser:**

    *   Navigate to `http://localhost:3000` in your web browser.

## API Endpoints

*   `POST /api/chat`: Handles chat messages, extracts locations, and fetches property information.


## Contributing

Contributions are welcome!  Please fork the repository and submit a pull request with your changes.

## License

[None](LICENSE)



