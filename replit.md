# Cenimax - Movie Streaming Platform

## Overview
Cenimax is a modern, feature-rich movie streaming platform built with React 19, TypeScript, and Vite. This project was imported from GitHub and configured to run on Replit on October 30, 2025.

## Purpose and Goals
- Provide a Netflix-like movie browsing experience
- Showcase modern web development practices with React and TypeScript
- Demonstrate responsive design and user authentication flows
- Serve as a portfolio project or learning resource

## Current State
The project is fully functional with complete database integration. All features are operational including:
- User authentication with secure password hashing (bcrypt)
- Movie browsing with database-backed catalog
- Search and genre filtering from PostgreSQL
- User profiles with watchlist/favorites functionality
- Continue watching progress tracking
- Comments system for movies

## Tech Stack
- **Frontend Framework**: React 19
- **Language**: TypeScript / JavaScript
- **Build Tool**: Vite 6
- **Styling**: Custom CSS with Tailwind CDN
- **Development Server**: Vite dev server on port 5000
- **Database**: PostgreSQL (Replit built-in managed database)
- **Backend API**: Node.js/Express with PostgreSQL integration
- **Authentication**: Bcrypt password hashing with secure login/signup

## Project Architecture

### Key Components
- **Authentication System**: Secure login/signup with password hashing, session persistence
- **Movie Browsing**: Database-backed catalog with featured carousel, genre filters, search
- **Movie Details**: Full detail pages with cast, comments, trailers
- **Watchlist**: Add/remove favorites with database persistence  
- **Continue Watching**: Track viewing progress across sessions
- **Comments**: User comments on movies stored in database
- **Help Center**: FAQ, contact, and support pages
- **Theme System**: Dark/light mode toggle with localStorage persistence

### Directory Structure
```
cenimax/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components (Login, Signup)
│   └── icons/          # SVG icon components
├── pages/              # Full page components
├── services/           # API service layer
│   └── api.ts          # Backend API client
├── server/             # Backend Express server
│   └── index.js        # API routes and database queries
├── database/           # Database schema and docs
│   └── schema.sql      # PostgreSQL schema (users, movies, comments, watchlist)
├── App.tsx             # Main app component with routing
├── constants.ts        # Mock data (fallback)
├── types.ts            # TypeScript type definitions
└── vite.config.ts      # Vite configuration
```

## Recent Changes
- **October 30, 2025**: Initial import and Replit configuration
  - Updated Vite config for Replit's proxy system
  - Changed development server port from 3000 to 5000
  - Configured HMR for Replit environment

- **October 31, 2025**: Complete database integration
  - **Database Setup**:
    - Created Replit PostgreSQL database (managed service)
    - Designed schema: users, movies, genres, cast_members, comments, watchlist, watch_progress
    - Added sample movie data with genres and relationships
    - Implemented proper foreign keys and indexes
  
  - **Backend API** (Express on port 8000):
    - Secure authentication with bcrypt password hashing (10 salt rounds)
    - Login/signup endpoints with email validation
    - Movie catalog endpoints with pagination and search
    - Genre filtering and movie details endpoints
    - Comments CRUD operations
    - Watchlist add/remove/list endpoints
    - Watch progress tracking endpoints
    - User profile management endpoints
  
  - **Frontend Integration**:
    - Connected login/signup pages to real API with error handling
    - Added loading states and user feedback
    - Implemented authentication persistence with localStorage
    - Fixed API base URL to support both .replit.dev and .repl.co domains
    - Reorganized file structure (services/, types.ts at root)
    - Updated all import paths for consistency
  
  - **Configuration**:
    - Vite config allows Replit domains
    - Both frontend and backend workflows running
    - CORS enabled for cross-origin requests

## User Preferences
- **No cloud storage dependencies** - All database files stored locally
- **Self-hosting on personal VM** - Replit used only for development
- **Full portability** - Code and database structure must move to GitHub and VM seamlessly
- **Production-ready performance** - Optimized for zero lag and fast queries

## Development Workflow
- Frontend runs on port 5000 with hot module reloading (Vite)
- Backend API runs on port 8000 (Express + PostgreSQL)
- Changes to source files automatically refresh the browser
- Database is populated with sample movies for testing
- User accounts persist across sessions

## Configuration Notes
- **Vite Configuration**: Configured to work with Replit's proxy system
  - `allowedHosts: ['.replit.dev', '.repl.co']` enables access through all Replit domains
  - `host: '0.0.0.0'` allows external connections
  - `hmr.clientPort: 443` for proper hot reload in Replit
- **API Configuration**: Dynamic base URL detection for local and hosted environments
- **Database**: Replit-managed PostgreSQL with automatic backups

## Deployment Notes
- **Deployment Target**: VM hosting (configured)
- **Build command**: `npm run build`
- **Run command**: `npx vite preview --host 0.0.0.0 --port 5000`
- **Database Migration to VM**:
  1. Install PostgreSQL on VM: `sudo apt install postgresql`
  2. Apply schema: `psql -d cenimax -f database/schema.sql`
  3. Export/import data as needed with `pg_dump`
  4. Update backend connection string to VM's PostgreSQL

## Database Architecture
- **Storage**: Replit-managed PostgreSQL database
- **Connection**: Via DATABASE_URL environment variable
- **Schema**: 
  - `users` - Authentication and profiles (bcrypt hashed passwords)
  - `movies` - Movie catalog with metadata
  - `genres` - Genre taxonomy
  - `cast_members` - Actor/director information
  - `movie_genres` - Many-to-many movie-genre relationships
  - `movie_cast` - Many-to-many movie-cast relationships
  - `comments` - User comments on movies
  - `watchlist` - User favorites/watchlist
  - `watch_progress` - Continue watching feature
- **Performance**: Indexed on title, year, rating, user_id, movie_id for fast queries
- **CDN Strategy**: All images stored as URLs (TMDB, YouTube, etc.) - zero file storage
- **Scalability**: Metadata-only approach supports millions of movies efficiently

## API Endpoints
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Authenticate user
- `GET /api/movies` - List movies with pagination/search/filters
- `GET /api/movies/:id` - Get movie details
- `GET /api/movies/:id/comments` - Get movie comments
- `POST /api/movies/:id/comments` - Add comment
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:userId/watchlist` - Get user's watchlist
- `POST /api/users/:userId/watchlist/:movieId` - Add to watchlist
- `DELETE /api/users/:userId/watchlist/:movieId` - Remove from watchlist
- `GET /api/users/:userId/continue-watching` - Get continue watching list
- `POST /api/users/:userId/watch-progress/:movieId` - Update watch progress
- `GET /api/genres` - List all genres
