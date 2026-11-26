  import {
    Component,
    signal,
    inject,
    
    ElementRef,
    ViewChild
  } from '@angular/core';

  import { HttpClient, HttpParams } from '@angular/common/http';
  import * as L from 'leaflet';

  @Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.html',
    styleUrl: './app.scss'
  })
  export class App  {
  private map: L.Map | undefined;

  @ViewChild('routeMap')
 set routeMapElement(element: ElementRef<HTMLDivElement> | undefined) {
  if (!element) {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
    return;
  }

  this.initializeMap(element.nativeElement);
}

  private routeLayer?: L.GeoJSON;
    private routeMarkers?: L.LayerGroup;
    private http = inject(HttpClient);
    // Saved trips
  savedTrips = signal<any[]>(
    JSON.parse(localStorage.getItem('skyrouteSavedTrips') || '[]')
  );
  showSavedTrips = signal(false);
  editingTrip = signal<any | null>(null);

  // Route Planner
  showRoutePlanner = signal(false);

  routeOrigin = signal('Bengaluru');
  routeDestination = signal('Mysuru');

    backendStatus = signal('Connecting to backend...');

    // Selected city
    selectedCity = signal('Bengaluru');

    // City search
    citySearch = signal('');
    cityResults = signal<any[]>([]);
    searchError = signal('');
    isSearching = signal(false);
    // Route information
  routeDistance = signal('Calculating...');
  routeGeometry = signal<any | null>(null);
  routeDuration = signal('Calculating...');
  isLoadingRoute = signal(false);
  routeError = signal('');
  // Weather at route checkpoints
  routeWeather = signal<any[]>([]);
  isLoadingRouteWeather = signal(false);
  routeWeatherError = signal('');
    isLoadingWeather = signal(false);

    // Weather cards
    weatherStats = signal([
      { label: 'Temperature', value: 'Loading...', detail: 'Fetching weather', icon: '☀', color: 'orange' },
      { label: 'Rain probability', value: 'Loading...', detail: 'Fetching forecast', icon: '☂', color: 'blue' },
      { label: 'Humidity', value: 'Loading...', detail: 'Fetching weather', icon: '◉', color: 'purple' },
      { label: 'Wind speed', value: 'Loading...', detail: 'Fetching weather', icon: '〰', color: 'green' }
    ]);
  // Live temperature chart
  temperatureChartPoints = signal('0,120 120,100 240,80 360,90 480,60 600,40');
  temperatureChartFillPoints = signal('');
  temperatureChartLabels = signal<string[]>([]);


  // Live rainfall chart
  rainfallChart = signal<any[]>([]);
  averageRainProbability = signal(0);
  // Dynamic travel insight
  travelInsight = signal({
    title: 'Checking weather conditions...',
    message: 'Analysing the latest weather forecast.',
    status: 'loading'
  });
  // Dynamic route weather status
  routeWeatherStatus = signal('Checking...');
    // Hourly forecast
    forecast = signal([
      { time: '--', temp: '--', rain: '--', icon: '☀' },
      { time: '--', temp: '--', rain: '--', icon: '☀' },
      { time: '--', temp: '--', rain: '--', icon: '⛅' },
      { time: '--', temp: '--', rain: '--', icon: '🌦' },
      { time: '--', temp: '--', rain: '--', icon: '☾' }
    ]);

    routePoints = [
      { name: 'Bengaluru', detail: 'Departure · 8:00 AM', status: 'clear' },
      { name: 'Ramanagara', detail: 'Around 9:00 AM', status: 'clear' },
      { name: 'Channapatna', detail: 'Around 9:30 AM', status: 'moderate' },
      { name: 'Mysuru', detail: 'Arrival · 11:00 AM', status: 'clear' }
    ];

    navItems = [
      { icon: '▦', label: 'Overview', active: true },
      { icon: '⌖', label: 'Route Planner', active: false },
      { icon: '☁', label: 'Weather Intelligence', active: false },
      { icon: '▥', label: 'Travel Analytics', active: false },
      { icon: '☆', label: 'Saved Trips', active: false }
    ];

    constructor() {
      // Check backend connection
      this.http.get<{
        success: boolean;
        message: string;
      }>('http://localhost:5000/api/health').subscribe({
        next: (response) => {
          this.backendStatus.set(response.message);
        },
        error: () => {
          this.backendStatus.set('Backend connection failed');
        }
      });

      // Load Bengaluru weather when dashboard opens
      // Load Bengaluru weather when dashboard opens
  this.loadWeather(12.9716, 77.5946);

  // Load Bengaluru to Mysuru route
  this.loadRoute();
  this.loadRouteWeather();
    }

  // Create the Leaflet map
  initializeMap(mapElement: HTMLDivElement) {
  this.map = L.map(mapElement).setView(
    [12.65, 77.10],
    9
  );

  const map = this.map;
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add Bengaluru marker
    L.marker([12.9716, 77.5946])
      .addTo(map)
      .bindPopup('Bengaluru - Starting Point');

    // Add Mysuru marker
    L.marker([12.2958, 76.6394])
      .addTo(map)
      .bindPopup('Mysuru - Destination');

    // Add intermediate checkpoint markers
    L.marker([12.7150, 77.2810])
      .addTo(map)
      .bindPopup('Ramanagara');

    L.marker([12.6510, 77.2060])
      .addTo(map)
      .bindPopup('Channapatna');

// Draw the stored route geometry
this.drawRouteOnMap();
  }


  // Draw the calculated route on the map

  // Draw the calculated route and its markers
  drawRouteOnMap() {
    const map = this.map;
    const geometry = this.routeGeometry();

    if (!map || !geometry) {
      return;
    }

    // Remove the previous route line
    if (this.routeLayer) {
      this.routeLayer.remove();
    }

    // Remove previous route markers
    if (this.routeMarkers) {
      this.routeMarkers.remove();
    }

    // Draw the latest route
    const routeLayer = L.geoJSON(geometry, {
      style: {
        color: '#38bdf8',
        weight: 5,
        opacity: 0.9
      }
    }).addTo(map);

    this.routeLayer = routeLayer;

    // Get starting and ending coordinates
    const coordinates = geometry.coordinates;
    const start = coordinates[0];
    const end = coordinates[coordinates.length - 1];

    // Create markers for the selected cities
    this.routeMarkers = L.layerGroup([
      L.marker([start[1], start[0]])
        .bindPopup(`${this.routeOrigin()} - Starting Point`),

      L.marker([end[1], end[0]])
        .bindPopup(`${this.routeDestination()} - Destination`)
    ]).addTo(map);

    // Fit the complete route inside the map
    map.fitBounds(routeLayer.getBounds(), {
      padding: [25, 25]
    });
  }



    // Search for a city
    searchCity() {
      const city = this.citySearch().trim();

      if (!city) {
        this.searchError.set('Please enter a city name.');
        this.cityResults.set([]);
        return;
      }

      this.isSearching.set(true);
      this.searchError.set('');
      this.cityResults.set([]);

      const params = new HttpParams().set('name', city);

      this.http.get<any>(
        'http://localhost:5000/api/geocoding',
        { params }
      ).subscribe({
        next: (response) => {
          this.isSearching.set(false);

          if (response.results && response.results.length > 0) {
            this.cityResults.set(response.results);
          } else {
            this.searchError.set('No matching city found. Try another name.');
          }
        },
        error: () => {
          this.isSearching.set(false);
          this.searchError.set('Unable to search for the city. Please try again.');
        }
      });
    }

    // Select a city from the search results
    selectCity(city: any) {
      this.selectedCity.set(
        city.name + (city.country ? ', ' + city.country : '')
      );

      this.citySearch.set('');
      this.cityResults.set([]);
      this.searchError.set('');

      this.loadWeather(city.latitude, city.longitude);
    }

    // Fetch weather for the selected coordinates
  
    // Fetch weather for the selected coordinates
    loadWeather(latitude: number, longitude: number) {
      this.isLoadingWeather.set(true);

      const params = new HttpParams()
        .set('latitude', latitude.toString())
        .set('longitude', longitude.toString());

      this.http.get<any>(
        'http://localhost:5000/api/weather',
        { params }
      ).subscribe({
        next: (response) => {
          const current = response.data.current;
          const daily = response.data.daily;
  // Generate travel recommendation using live weather
  const rainProbability = daily.precipitation_probability_max[0];
  const windSpeed = current.wind_speed_10m;

  if (rainProbability >= 60) {
    this.travelInsight.set({
      title: 'Rain warning for your location',
      message: `Rain probability is ${rainProbability}%. Carry rain protection and allow extra travel time.`,
      status: 'warning'
    });
  } else if (windSpeed >= 30) {
    this.travelInsight.set({
      title: 'Strong winds expected',
      message: `Wind speed is ${windSpeed} km/h. Take extra care while travelling.`,
      status: 'warning'
    });
  } else {
    this.travelInsight.set({
      title: 'Favourable travel conditions',
      message: `Rain probability is ${rainProbability}% and wind speed is ${windSpeed} km/h. Conditions currently look suitable for travel.`,
      status: 'good'
    });
  }
          // Update weather cards
          this.weatherStats.set([
            {
              label: 'Temperature',
              value: `${current.temperature_2m}°C`,
              detail: `Feels like ${current.apparent_temperature}°C`,
              icon: '☀',
              color: 'orange'
            },
            {
              label: 'Rain probability',
              value: `${daily.precipitation_probability_max[0]}%`,
              detail: "Today's maximum chance of rain",
              icon: '☂',
              color: 'blue'
            },
            {
              label: 'Humidity',
              value: `${current.relative_humidity_2m}%`,
              detail: 'Current humidity',
              icon: '◉',
              color: 'purple'
            },
            {
              label: 'Wind speed',
              value: `${current.wind_speed_10m} km/h`,
              detail: 'Current wind speed',
              icon: '〰',
              color: 'green'
            }
          ]);

          // Get hourly weather data
          const hourly = response.data.hourly;
          const now = new Date();

          const startIndex = hourly.time.findIndex(
            (time: string) =>
              new Date(time).getTime() >= now.getTime() - 60 * 60 * 1000
          );

          if (startIndex !== -1) {

            // Update hourly forecast
            const nextHours = hourly.time.slice(startIndex, startIndex + 5);

            this.forecast.set(
              nextHours.map((time: string, index: number) => {
                const actualIndex = startIndex + index;
                const weatherCode = hourly.weather_code[actualIndex];

                let icon = '☀';

                if (weatherCode === 1 || weatherCode === 2 || weatherCode === 3) {
                  icon = '⛅';
                } else if (weatherCode >= 45) {
                  icon = '🌧';
                }

                return {
                  time: new Date(time).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    hour12: true
                  }),
                  temp: `${hourly.temperature_2m[actualIndex]}°`,
                  rain: `${hourly.precipitation_probability[actualIndex]}%`,
                  icon
                };
              })
            );

            // Prepare temperature chart data
            const chartTimes = hourly.time.slice(startIndex, startIndex + 6);
            const chartTemps = hourly.temperature_2m.slice(startIndex, startIndex + 6);

            if (chartTemps.length > 1) {
              const points = chartTemps.map((temp: number, index: number) => {
                const x = (index / (chartTemps.length - 1)) * 600;
                const y = 160 - ((temp - 15) / 25) * 130;

                return `${x},${Math.max(20, Math.min(160, y))}`;
              });

              this.temperatureChartPoints.set(points.join(' '));

              this.temperatureChartFillPoints.set(
                `0,180 ${points.join(' ')} 600,180`
              );

              this.temperatureChartLabels.set(
                chartTimes.map((time: string) =>
                  new Date(time).toLocaleTimeString('en-IN', {
                    hour: 'numeric',
                    hour12: true
                  })
                )
              );
            }

            // Prepare rainfall chart data
            const rainValues = hourly.precipitation_probability.slice(
              startIndex,
              startIndex + 6
            );

            this.rainfallChart.set(
              rainValues.map((value: number, index: number) => ({
                time: new Date(hourly.time[startIndex + index]).toLocaleTimeString(
                  'en-IN',
                  { hour: 'numeric', hour12: true }
                ),
                probability: value
              }))
            );

            const averageRain = rainValues.length > 0
              ? rainValues.reduce(
                  (total: number, value: number) => total + value, 0
                ) / rainValues.length
              : 0;

            this.averageRainProbability.set(Math.round(averageRain));
          }

          this.isLoadingWeather.set(false);
        },
        error: (error) => {
          console.error('Unable to load weather:', error);
          this.isLoadingWeather.set(false);
        }
      });
    }

      // Fetch driving route between Bengaluru and Mysuru
    loadRoute() {
      this.isLoadingRoute.set(true);
      this.routeError.set('');

      const params = new HttpParams()
        .set('startLat', '12.9716')
        .set('startLon', '77.5946')
        .set('endLat', '12.2958')
        .set('endLon', '76.6394');

      this.http.get<any>(
        'http://localhost:5000/api/route',
        { params }
      ).subscribe({
        next: (response) => {
          this.routeDistance.set(`${response.distanceKm} km`);
          this.routeGeometry.set(response.geometry);
          this.drawRouteOnMap();
          const hours = Math.floor(response.durationMinutes / 60);
          const minutes = response.durationMinutes % 60;

          this.routeDuration.set(
            hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`
          );

          this.isLoadingRoute.set(false);
        },
            error: (error) => {
          console.error('Route loading error:', error);
          this.routeError.set('Unable to calculate route');
          this.isLoadingRoute.set(false);
        }
      });
    }

    // Calculate route using the cities entered in Route Planner
    calculateEnteredRoute() {
      const originName = this.routeOrigin().trim();
      const destinationName = this.routeDestination().trim();

      if (!originName || !destinationName) {
        alert('Please enter both origin and destination.');
        return;
      }

      this.isLoadingRoute.set(true);
      this.routeError.set('');

      // Find origin coordinates
      const originParams = new HttpParams()
        .set('name', originName);

      this.http.get<any>(
        'http://localhost:5000/api/geocoding',
        { params: originParams }
      ).subscribe({
        next: (originResponse) => {
          if (!originResponse.results?.length) {
            this.routeError.set('Origin city not found.');
            this.isLoadingRoute.set(false);
            return;
          }

          const origin = originResponse.results[0];

          // Find destination coordinates
          const destinationParams = new HttpParams()
            .set('name', destinationName);

          this.http.get<any>(
            'http://localhost:5000/api/geocoding',
            { params: destinationParams }
          ).subscribe({
            next: (destinationResponse) => {
              if (!destinationResponse.results?.length) {
                this.routeError.set('Destination city not found.');
                this.isLoadingRoute.set(false);
                return;
              }

              const destination = destinationResponse.results[0];

              // Request the driving route
              const routeParams = new HttpParams()
                .set('startLat', origin.latitude.toString())
                .set('startLon', origin.longitude.toString())
                .set('endLat', destination.latitude.toString())
                .set('endLon', destination.longitude.toString());

              this.http.get<any>(
                'http://localhost:5000/api/route',
                { params: routeParams }
              ).subscribe({
                next: (response) => {
                  this.routeOrigin.set(origin.name);
                  this.routeDestination.set(destination.name);
                  this.routeGeometry.set(response.geometry);

                  this.routeDistance.set(`${response.distanceKm} km`);

                  const hours = Math.floor(response.durationMinutes / 60);
                  const minutes = response.durationMinutes % 60;

                  this.routeDuration.set(
                    hours > 0
                      ? `${hours} hr ${minutes} min`
                      : `${minutes} min`
                  );

                  this.isLoadingRoute.set(false);
                },
                error: () => {
                  this.routeError.set('Unable to calculate this route.');
                  this.isLoadingRoute.set(false);
                }
              });
            },
            error: () => {
              this.routeError.set('Unable to find destination city.');
              this.isLoadingRoute.set(false);
            }
          });
        },
        error: () => {
          this.routeError.set('Unable to find origin city.');
          this.isLoadingRoute.set(false);
        }
      });
    }

    // Fetch weather at all route checkpoints
    loadRouteWeather() {
      this.isLoadingRouteWeather.set(true);
      this.routeWeatherError.set('');

      this.http.get<any>(
        'http://localhost:5000/api/route-weather'
      ).subscribe({
        next: (response) => {
          this.routeWeather.set(response.checkpoints);
          this.generateRouteInsight(response.checkpoints);  
          this.isLoadingRouteWeather.set(false);
        },
        error: (error) => {
          console.error('Route weather error:', error);
          this.routeWeatherError.set('Unable to load route weather.');
          this.isLoadingRouteWeather.set(false);
        }
      });
    }


  generateRouteInsight(checkpoints: any[]) {
    
    if (!checkpoints || checkpoints.length === 0) {
      return;
    }

    // Find the checkpoint with the highest forecast rain probability.
    const rainRisk = checkpoints.reduce(
      (highest, point) =>
        Number(point.rainProbability) >
        Number(highest.rainProbability) ? point : highest,
      checkpoints[0]
    );

    // Find the checkpoint with the highest forecast wind speed.
    const windRisk = checkpoints.reduce(
      (highest, point) =>
        Number(point.forecastWindSpeed) >
        Number(highest.forecastWindSpeed) ? point : highest,
      checkpoints[0]
    );

    const maxRain = Number(rainRisk.rainProbability);
    const maxWind = Number(windRisk.forecastWindSpeed);
    // Check whether any checkpoint has cloudy conditions
  const hasOvercastConditions = checkpoints.some(
    point => Number(point.weatherCode) === 3
  );

  const hasPartlyCloudyConditions = checkpoints.some(
    point => Number(point.weatherCode) === 2
  );
    // Set dynamic route weather status
  if (maxRain >= 60) {
    this.routeWeatherStatus.set('Heavy rain risk');
  } else if (maxRain >= 30) {
    this.routeWeatherStatus.set('Rain expected');
  } else if (maxWind >= 30) {
    this.routeWeatherStatus.set('Strong winds');
  } else if (hasOvercastConditions) {
    this.routeWeatherStatus.set('Overcast');
  } else if (hasPartlyCloudyConditions) {
    this.routeWeatherStatus.set('Partly cloudy');
  } else {
    this.routeWeatherStatus.set('Mostly clear');
  }
    // High rain probability warning.
    if (maxRain >= 60) {
      this.travelInsight.set({
        title: 'Heavy rain risk along your route',
        message: `Rain probability may reach ${maxRain}% near ${rainRisk.name} in the next six hours. Carry rain protection and allow extra travel time.`,
        status: 'warning'
      });

    // Strong wind warning.
    } else if (maxWind >= 30) {
      this.travelInsight.set({
        title: 'Strong winds expected along your route',
        message: `Wind speed may reach ${maxWind} km/h near ${windRisk.name} in the next six hours. Take extra care while travelling.`,
        status: 'warning'
      });

    // Moderate rain advisory.
    } else if (maxRain >= 30) {
      this.travelInsight.set({
        title: 'Rain may affect your journey',
        message: `Rain probability may reach ${maxRain}% near ${rainRisk.name} in the next six hours. Consider carrying rain protection.`,
        status: 'warning'
      });

    // Good travel conditions.
    } else {
      this.travelInsight.set({
        title: 'Favourable travel conditions',
        message: `Rain probability is currently low across all ${checkpoints.length} checkpoints. The highest forecast wind speed is ${maxWind} km/h near ${windRisk.name} over the next six hours.`,
        status: 'good'
      });
    }
  }

    // Save Bengaluru to Mysuru trip

  saveTrip() {
    const trip = {
      id: Date.now(),
      origin: this.routeOrigin(),
      destination: this.routeDestination(),
      distance: this.routeDistance(),
      duration: this.routeDuration(),
      savedAt: new Date().toLocaleDateString('en-IN')
    };

    const updatedTrips = [
      ...this.savedTrips(),
      trip
    ];

    this.savedTrips.set(updatedTrips);

    localStorage.setItem(
      'skyrouteSavedTrips',
      JSON.stringify(updatedTrips)
    );

    alert('Trip saved successfully!');
  }


    // Select a trip for editing
    // Select a trip for editing
    editTrip(trip: any) {
      this.editingTrip.set({ ...trip });
    }

    // Update the origin field
    updateTripOrigin(value: string) {
      const trip = this.editingTrip();

      if (trip) {
        this.editingTrip.set({
          ...trip,
          origin: value
        });
      }
    }

    // Update the destination field
  updateTripDestination(value: string) {
    const trip = this.editingTrip();

    if (trip) {
      this.editingTrip.set({
        ...trip,
        destination: value
      });
    }
  }

  // Save edited trip
  // Save edited trip and recalculate route
  saveTripChanges() {
    const editedTrip = this.editingTrip();

    if (!editedTrip) {
      return;
    }

    if (!editedTrip.origin.trim() || !editedTrip.destination.trim()) {
      alert('Please enter both origin and destination.');
      return;
    }

    const originParams = new HttpParams()
      .set('name', editedTrip.origin);

    const destinationParams = new HttpParams()
      .set('name', editedTrip.destination);

    // Find origin coordinates
    this.http.get<any>(
      'http://localhost:5000/api/geocoding',
      { params: originParams }
    ).subscribe({
      next: (originResponse) => {

        if (!originResponse.results?.length) {
          alert('Origin city not found.');
          return;
        }

        const origin = originResponse.results[0];

        // Find destination coordinates
        this.http.get<any>(
          'http://localhost:5000/api/geocoding',
          { params: destinationParams }
        ).subscribe({
          next: (destinationResponse) => {

            if (!destinationResponse.results?.length) {
              alert('Destination city not found.');
              return;
            }

            const destination = destinationResponse.results[0];

            // Calculate road route
            const routeParams = new HttpParams()
              .set('startLat', origin.latitude.toString())
              .set('startLon', origin.longitude.toString())
              .set('endLat', destination.latitude.toString())
              .set('endLon', destination.longitude.toString());

            this.http.get<any>(
              'http://localhost:5000/api/route',
              { params: routeParams }
            ).subscribe({
              next: (routeResponse) => {

                if (!routeResponse.success) {
                  alert('Unable to calculate this route.');
                  return;
                }

                const updatedTrip = {
                  ...editedTrip,
                  origin: origin.name,
                  destination: destination.name,
                  distance: routeResponse.distanceKm + ' km',
                  duration:
                    Math.floor(routeResponse.durationMinutes / 60) +
                    ' hr ' +
                    (routeResponse.durationMinutes % 60) +
                    ' min'
                };

                const updatedTrips = this.savedTrips().map(trip =>
                  trip.id === updatedTrip.id ? updatedTrip : trip
                );

                this.savedTrips.set(updatedTrips);

                localStorage.setItem(
                  'skyrouteSavedTrips',
                  JSON.stringify(updatedTrips)
                );

                this.editingTrip.set(null);

                alert('Trip updated successfully!');
              },
              error: () => {
                alert('Unable to calculate the road route.');
              }
            });
          },
          error: () => {
            alert('Unable to find destination coordinates.');
          }
        });
      },
      error: () => {
        alert('Unable to find origin coordinates.');
      }
    });
  }
  // Delete a saved trip
  deleteTrip(id: number) {
    const updatedTrips = this.savedTrips().filter(
      trip => trip.id !== id
    );

    this.savedTrips.set(updatedTrips);

    localStorage.setItem(
      'skyrouteSavedTrips',
      JSON.stringify(updatedTrips)

      
    );
  }
  // Navigate between pages
  navigateTo(page: string) {
    this.showSavedTrips.set(page === 'Saved Trips');
    this.showRoutePlanner.set(page === 'Route Planner');
  }
  }
