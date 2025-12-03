# MSP Diesel Field Sales Route App

## Overview

A mobile-first field service application designed for diesel sales representatives. Its primary purpose is to streamline daily route planning, facilitate navigation to customer locations, and enable efficient check-ins at company sites. The application integrates AI-powered voice-to-text for data collection, connects with HubSpot CRM for customer data, uses Mapbox for geocoding and route optimization, and leverages Gemini AI for intelligent transcription and structured data extraction from field visit voice notes. The project aims to enhance field sales productivity by providing a robust, outdoor-optimized tool with a focus on readability and GPS-based proximity features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is built with React and TypeScript, using Vite. It employs Wouter for routing with authentication protection and Shadcn UI (Radix UI + Tailwind CSS) for a mobile-first, responsive design optimized for outdoor field use across various iPhone models. State management utilizes TanStack Query for server state caching and local storage for route persistence. Key design decisions include a bottom navigation pattern, full-screen overlays for route editing, touch-optimized drag-and-drop, and outdoor-readable typography.

### Backend

The backend is developed with Node.js and Express.js, offering a RESTful JSON API with session-based authentication. Drizzle ORM is used for type-safe database queries against Neon serverless PostgreSQL. Core services include data storage, authentication, geospatial calculations (Turf.js), HubSpot data synchronization with geocoding, and Gemini AI integration for speech-to-text processing and data parsing.

### Data Models

The system manages data for Users, HubSpotOwners, Companies, Routes, RouteStops, CheckIns (with comprehensive structured visit data including machinery types, engine types, customer needs, and voice transcripts), and SyncLogs.

### Authentication & Authorization

Session-based authentication with secure cookie storage is implemented. User-to-HubSpot owner mapping filters company visibility, ensuring users only access relevant data. This mapping is provisioned by an administrator for security.

### Route Planning & Navigation

The application features a route-building algorithm that filters companies by radius, allows user selection, and optimizes stop order using an endpoint-aware greedy approach with Mapbox Directions API. An intuitive, touch-optimized drag-and-drop interface facilitates route editing. GPS proximity detection (800-foot threshold) triggers check-in prompts, and navigation integrates with native map applications and an embedded Mapbox GL map.

### AI-Powered Check-In Flow

During check-ins, the application uses browser-based audio recording. Gemini AI transcribes voice notes and intelligently parses over 15 structured fields, including required data like machinery types and customer needs. Users can review and edit the AI-extracted data before submission, which saves to the database and syncs with HubSpot.

### Data Synchronization

HubSpot integration uses Private App API key authentication for periodic full syncs of company records. New or updated addresses are geocoded via Mapbox. Check-ins create custom object records in HubSpot, associating visit data with companies.

### Map Rendering

Mapbox GL JS renders interactive maps with user location, color-coded company markers, and route polylines. The Mapbox token is loaded at runtime for enhanced security and flexibility.

## External Dependencies

### Third-Party APIs

*   **HubSpot CRM API**: For company data and check-in record synchronization.
*   **Mapbox APIs**: Includes Geocoding API for address conversion, Directions API for route optimization, and Mapbox GL JS for client-side map rendering.
*   **Gemini AI**: Used for speech-to-text transcription and intelligent parsing of voice notes during check-ins.

### Database

*   **Neon Serverless PostgreSQL**: The primary database, connected via WebSocket and managed with Drizzle ORM.

### Key NPM Dependencies

*   **Backend**: `express`, `drizzle-orm`, `@hubspot/api-client`, `@google/genai`, `bcryptjs`, `cookie-session`, `axios`, `@turf/turf`.
*   **Frontend**: `react`, `react-dom`, `@tanstack/react-query`, `wouter`, `mapbox-gl`, `@radix-ui/*`, `tailwindcss`, `react-hook-form`, `zod`.

### Environment Configuration

*   **Required Secrets**: `DATABASE_URL`, `MAPBOX_TOKEN`, `SESSION_SECRET`.
*   **Optional Secrets**: `HUBSPOT_API_KEY`.