# 🦠 Corona Web App – COVID-19 Info & Interaction Platform for Baden-Württemberg

**Corona Web App** is a full-stack web application that presents COVID-19 data for Baden-Württemberg in a clear and interactive way. It combines real-time data visualization, chat-based user interaction, and personalized vaccine offer listings.

<div align="center">
  <img src="media/img/app/home_map.png" width="48%"/>
  <img src="media/img/app/statistics_graph.png" width="48%"/>
</div>

<!-- TOC -->
* [🦠 Corona Web App – COVID-19 Info & Interaction Platform for Baden-Württemberg](#-corona-web-app--covid-19-info--interaction-platform-for-baden-württemberg)
  * [🎓 Project & Context](#-project--context)
  * [🧩 Key Features](#-key-features)
  * [🛠️ Technologies Used](#-technologies-used)
  * [📊 Data Sources](#-data-sources)
  * [📍 Home & Map Overview](#-home--map-overview)
  * [📈 Statistics Dashboard](#-statistics-dashboard)
  * [🔐 Authentication & Sessions](#-authentication--sessions)
  * [💬 Corona Chat](#-corona-chat)
  * [💉 Vaccine Offer Finder](#-vaccine-offer-finder)
  * [📰 Live News Feed](#-live-news-feed)
  * [🧠 Technical Architecture](#-technical-architecture)
  * [🧑‍💻 Teamwork Makes the Dream Work](#-teamwork-makes-the-dream-work)
  * [📜 License](#-license)
  * [📦 Running the Project](#-running-the-project)
<!-- TOC -->

---

## 🎓 Project & Context

This project was developed during the **Internet-Based Systems** course at **Aalen University** in the **summer semester of 2021**.

The goal was to build a full-stack web platform leveraging multiple real-time APIs and a microservice-oriented backend using Docker.

---

## 🧩 Key Features

- 🗺️ Interactive SVG-based map of Baden-Württemberg
- 📊 Statistics per district and overall state view
- 💬 Chat system with multiple COVID-related topics
- 🔐 User authentication (login & registration)
- 🧍 Personalized vaccine offer recommendations
- 📰 News feed with dynamic updates
- 🧪 Distance calculation for nearby vaccine centers
- 🧱 Modular, containerized architecture (Docker)

---

## 🛠️ Technologies Used

- **Node.js** + **Express.js** – Backend framework and routing
- **WebSockets** – Real-time chat functionality
- **MongoDB** – NoSQL storage for COVID data and chat
- **MySQL** – Relational database for user authentication
- **Passport.js** – Authentication middleware
- **Docker** & **Docker Compose** – Containerized deployment
- **EJS** – Templating engine for dynamic HTML
- **MQTT** – Live data synchronization for news and vaccine data
- **REST APIs** – Integration of multiple external data sources
- **GeocodeAPI** – Location and distance calculations
- **SVG** – Interactive maps for UI visualization

---

## 📊 Data Sources

The application aggregates data using the following APIs:

- RKI API & RKI GitHub (COVID case numbers)
- [jgehrcke GitHub](https://github.com/jgehrcke/covid-19-germany-gae)
- NewsAPI (Corona news)
- Impfzentren via [Impf-Terminradar API](https://www.impfterminradar.de)
- Geolocation: [https://geocodeapi.com](https://geocodeapi.com)
- Live updates via MQTT

Processed data is cached in a MongoDB database and exposed via custom backend APIs.

---

## 📍 Home & Map Overview

- Landing page displays an SVG-based map of Baden-Württemberg.
- Clicking a district shows current statistics for that region.
- A simplified state-wide overview is always shown.
- Users can toggle which graphs and stats to display.

---

## 📈 Statistics Dashboard

- District-level data is presented in a sortable table.
- Graphs for infection rates, hospitalizations, age/gender distribution.
- Selecting a district from the map updates the visualizations below.

---

## 🔐 Authentication & Sessions

- Registration with unique email, username, and hashed password (bcrypt).
- Session handling via **passport.js**, **express-session**, and **flash**.
- Registered users gain access to chat and vaccine personalization.
- Login redirects unauthorized users attempting to access protected views.

---

## 💬 Corona Chat

Implemented via **Websockets** (instead of MQTT to diversify the tech stack).

- Guests can read messages in predefined topics:
    - General
    - Vaccination
    - Quarantine
    - Testing
    - Experiences
- Registered users can post messages.
- User presence is tracked in real time.
- Messages include metadata (author, topic, timestamp).
- Chat data is stored in **MongoDB** with a 24h TTL.

---

## 💉 Vaccine Offer Finder

- Personalized recommendations based on:
    - Preferred vaccines
    - Location
    - Search radius
- Vaccine centers are filtered and sorted by:
    - Distance (via Geocode API)
    - Vaccine availability
- Each center shows:
    - Address
    - Vaccine types
    - Contact options (URL, phone, email)

---

## 📰 Live News Feed

- Displays up-to-date articles related to Corona and Baden-Württemberg.
- Shows headline, summary, author, and article link.
- Pagination is supported (5 articles per page).
- New entries are dynamically added via MQTT when received.

---

## 🧠 Technical Architecture

- **Frontend:** HTML, CSS, EJS, Websockets
- **Backend:**
    - Node.js + Express
    - REST API for statistics and vaccine data
    - Websockets for chat
- **Databases:**
    - MongoDB (Corona data & chat)
    - MySQL (User accounts)
- **Authentication:** Passport.js with bcrypt
- **Containerization:** Docker & Docker Compose
- **Live Update:** MQTT-based message delivery

---

## 🧑‍💻 Teamwork Makes the Dream Work

Developed by:

- Maximilian Borst
- Simon Ruttmann
- Veronika Scheller
- Michael Ulrich

---

## 📜 License

This project is licensed under the **Apache 2.0 License**.  
Feel free to fork, adapt, or reuse — just give credit. 🤝

---

## 📦 Running the Project

> **Requirements:**
> - Docker and Docker Compose
>
> To start the application:
>
> ```bash
> docker-compose up --build
> ```
>
> ⚠️ On Windows, prefer using **PowerShell** (not WSL2) to avoid permission issues.  
> ⏱️ The `node-collect` server may take ~5 minutes to process API data before serving.

---

