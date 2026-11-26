
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SkyRoute API',
    status: 'Backend is running successfully'
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SkyRoute backend is healthy',
    timestamp: new Date()
  });
});

// Live weather API
app.get('/api/weather', async (req, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);

    // Validate coordinates
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid latitude and longitude.'
      });
    }

    const weatherUrl = new URL(
      'https://api.open-meteo.com/v1/forecast'
    );

    weatherUrl.search = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
      hourly: 'temperature_2m,precipitation_probability,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'auto'
    }).toString();

    const response = await fetch(weatherUrl);

    if (!response.ok) {
      throw new Error('Weather provider request failed');
    }

    const weatherData = await response.json();

    res.json({
      success: true,
      location: {
        latitude,
        longitude
      },
      data: weatherData
    });

  } catch (error) {
    console.error('Weather API error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch weather data.'
    });
  }
});

// City search API
app.get('/api/geocoding', async (req, res) => {
  try {
    const city = req.query.name;

    if (!city || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a city name.'
      });
    }

    const geocodingUrl = new URL(
      'https://geocoding-api.open-meteo.com/v1/search'
    );
geocodingUrl.search = new URLSearchParams({
  name: city.trim(),
  count: '10',
  language: 'en',
  format: 'json',
  countryCode: 'IN'
}).toString();

    const response = await fetch(geocodingUrl);

    if (!response.ok) {
      throw new Error('Geocoding provider request failed');
    }

    const data = await response.json();

    res.json({
      success: true,
      results: data.results || []
    });

  } catch (error) {
    console.error('Geocoding API error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to search for this city.'
    });
  }
});

// Route calculation API
app.get('/api/route', async (req, res) => {
  try {
    const startLat = Number(req.query.startLat);
    const startLon = Number(req.query.startLon);
    const endLat = Number(req.query.endLat);
    const endLon = Number(req.query.endLon);

    const coordinates = [startLat, startLon, endLat, endLon];

    if (
      coordinates.some(value => !Number.isFinite(value)) ||
      startLat < -90 || startLat > 90 ||
      endLat < -90 || endLat > 90 ||
      startLon < -180 || startLon > 180 ||
      endLon < -180 || endLon > 180
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid starting and destination coordinates.'
      });
    }

    const routeUrl =
      `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;

    const response = await fetch(routeUrl);

    if (!response.ok) {
      throw new Error('Route provider request failed');
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes?.length) {
      return res.status(404).json({
        success: false,
        message: 'No driving route found.'
      });
    }

    const route = data.routes[0];

    res.json({
      success: true,
      distanceKm: Number((route.distance / 1000).toFixed(2)),
      durationMinutes: Math.round(route.duration / 60),
      geometry: route.geometry
    });

  } catch (error) {
    console.error('Route API error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to calculate the route.'
    });
  }
});

// Weather at checkpoints along the route
app.get('/api/route-weather', async (req, res) => {
  try {
    const checkpoints = [
      {
        name: 'Bengaluru',
        latitude: 12.9716,
        longitude: 77.5946
      },
      {
        name: 'Ramanagara',
        latitude: 12.7150,
        longitude: 77.2810
      },
      {
        name: 'Channapatna',
        latitude: 12.6510,
        longitude: 77.2060
      },
      {
        name: 'Mysuru',
        latitude: 12.2958,
        longitude: 76.6394
      }
    ];

    const weatherResults = await Promise.all(
      checkpoints.map(async (point) => {
        const url = new URL(
          'https://api.open-meteo.com/v1/forecast'
        );

        url.search = new URLSearchParams({
          latitude: point.latitude.toString(),
          longitude: point.longitude.toString(),
          current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
          hourly: 'precipitation_probability,wind_speed_10m',
          timezone: 'auto'
        }).toString();

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Weather request failed for ${point.name}`);
        }

        const data = await response.json();
    const currentHourIndex = Math.max(
  0,
  data.hourly.time.findIndex(
    time => time.slice(0, 13) === data.current.time.slice(0, 13)
  )
);
       

return {
  name: point.name,
  temperature: data.current.temperature_2m,
  humidity: data.current.relative_humidity_2m,
  precipitation: data.current.precipitation,
  weatherCode: data.current.weather_code,
  windSpeed: data.current.wind_speed_10m,

  rainProbability: Math.max(
    ...data.hourly.precipitation_probability.slice(
      currentHourIndex,
      currentHourIndex + 6
    )
  ),

  forecastWindSpeed: Math.max(
    ...data.hourly.wind_speed_10m.slice(
      currentHourIndex,
      currentHourIndex + 6
    )
  )
};


      })
    );

    res.json({
      success: true,
      checkpoints: weatherResults
    });

  } catch (error) {
    console.error('Route weather error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch route weather.'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`SkyRoute backend running at http://localhost:${PORT}`);
});
