# 🌤️ SkyRoute – Weather-Based Travel Planner

**Plan Smarter. Travel Better. Stay Weather-Aware.**

SkyRoute is a weather-based travel planning application built using Angular and Node.js. It helps users plan journeys, explore weather conditions, calculate routes, and make better travel decisions using real-time weather information and route intelligence.

The application combines weather forecasting, interactive maps, route planning, and saved trips in one dashboard.

---

## 📸 Application Screenshots

### 1. Dashboard

<img width="900" height="600" alt="SkyRoute Dashboard" src="https://github.com/user-attachments/assets/ac45a7be-ed39-46b7-bc01-ae89783a5488" />

### 2. Weather Overview

<img width="900" height="600" alt="SkyRoute Weather Overview" src="docs/screenshots/weather.png" />

### 3. Route Planner

<img width="900" height="600" alt="SkyRoute Route Planner" src="https://github.com/user-attachments/assets/eba73aca-9d8a-4495-af60-3719a804198b" />

### 4. Interactive Route Map

<img width="900" height="600" alt="SkyRoute Interactive Route Map" src="https://github.com/user-attachments/assets/ed858e41-034c-4e63-955f-60314e5ca9d0" />

### 5. Saved Trips

<img width="900" height="600" alt="SkyRoute Saved Trips" src="https://github.com/user-attachments/assets/e3a7c56c-0c23-457c-9d40-71348cb9f3c6" />


---

## ✨ Key Features

### 🌦️ Weather Dashboard
- Displays current weather information.
- Shows temperature and feels-like temperature.
- Provides rain probability and wind speed.
- Displays weather conditions and hourly forecasts.
- Provides weather-based travel insights.

### 🗺️ Route Planner
- Enter starting and destination locations.
- Calculate routes between locations.
- Display route geometry on an interactive map.
- View estimated travel distance and duration.
- Visualize routes using Leaflet maps.

### 🌍 Interactive Maps
- Map visualization using Leaflet.
- OpenStreetMap map tiles.
- Route visualization using GeoJSON.
- View geographical routes between locations.

### 🌧️ Route Weather Information
- Explore weather conditions along selected travel routes.
- View weather information at predefined route checkpoints.
- Understand weather conditions that may affect a journey.

### 💾 Saved Trips
- Save planned journeys.
- View previously saved trips.
- Edit existing trip details.
- Delete saved trips.
- Store saved trip information using browser local storage.

### 📊 Travel Intelligence
- Weather-based travel insights.
- Rain probability and wind information.
- Travel condition summaries to help users plan journeys.

---

## 🛠️ Technologies Used

### Frontend
- Angular
- TypeScript
- HTML5
- SCSS
- Leaflet
- RxJS

### Backend
- Node.js
- Express.js
- REST APIs

### External APIs and Services
- Open-Meteo – Weather forecasts and weather information.
- OpenStreetMap – Map tiles and geographical visualization.
- OSRM – Route calculation and driving directions.

### Development Tools
- Visual Studio Code
- Git
- GitHub
- npm

---

## ⚙️ How SkyRoute Works

SkyRoute follows a frontend-backend architecture.

1. The user interacts with the Angular application.
2. Angular sends HTTP requests to the Node.js and Express backend where backend services are used.
3. The backend processes the relevant requests and communicates with external services.
4. Weather information is retrieved from Open-Meteo.
5. Route information is obtained through OSRM.
6. Leaflet displays interactive maps and route information.
7. The application presents the results through the dashboard.
8. Saved trips are stored in browser local storage.

---

## 🏗️ Project Architecture

```text
SkyRoute/
│
├── backend/
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.ts
│   │   │   ├── app.html
│   │   │   ├── app.scss
│   │   │   ├── app.config.ts
│   │   │   └── app.routes.ts
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.scss
│   ├── angular.json
│   └── package.json
│
├── docs/
│   └── screenshots/
│
└── .gitignore
```

---

## 🚀 Installation and Setup

Follow these steps to run SkyRoute locally.

### Prerequisites

Install the following:

- Node.js
- npm
- Angular CLI
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Akshayskadam/SkyRoute.git
```

### 2. Navigate to the project directory

```bash
cd SkyRoute
```

### 3. Start the backend

Open a terminal:

```bash
cd backend
npm install
node server.js
```

The backend server should start on its configured port.

### 4. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npx ng serve
```

Open the local URL displayed by Angular in your browser, usually:

```text
http://localhost:4200
```

Ensure the backend is running and the frontend is configured to communicate with the correct backend URL.

---

## 🔄 Application Workflow

```text
<img width="2400" height="1792" alt="Gemini_Generated_Image_pvkyvzpvkyvzpvky" src="https://github.com/user-attachments/assets/2f35c4c2-7f09-4862-b208-76c6843889fd" />

```

---

## 🔮 Future Enhancements

- User authentication and personalized accounts.
- More advanced weather forecasting along complete routes.
- Multiple route alternatives.
- Improved travel recommendations based on weather conditions.
- Mobile-responsive improvements.
- Cloud-based storage for saved trips.

---

## 👨‍💻 Author

**Akshay S Kadam**

MCA Graduate | Web Developer | Data Analyst

- GitHub: https://github.com/Akshayskadam
- Project Repository: https://github.com/Akshayskadam/SkyRoute

---

⭐ If you find this project interesting, feel free to explore the repository and its implementation.

**SkyRoute – Making Every Journey Smarter!**
