# Reddit Shared Calendar

A collaborative calendar application where users can create events, vote on restaurants and time slots, RSVP, and discuss plans - all without storing any PII (Personally Identifiable Information).

## Features

- **Simple Authentication**: Login with just your Reddit username (no verification, no emails)
- **Calendar View**: Browse and create events on an interactive calendar
- **Restaurant Voting**: Search and add restaurants using Google Maps API, vote on your favorites
- **Time Slot Voting**: Propose and vote on meeting times
- **RSVP System**: Let others know if you're going, maybe, or not going
- **Comments**: Discuss event details with other attendees
- **Zero Cost Hosting**: Built with SQLite and deployable to Vercel's free tier

## Tech Stack

- **Frontend**: Next.js 16 with App Router, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma 6 ORM
- **Authentication**: iron-session (cookie-based sessions)
- **Maps**: Google Maps Places API
- **Deployment**: Vercel (free tier)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Maps API key (optional, for restaurant search)

### Installation

1. Clone the repository:
```bash
cd reddit-shared-calendar
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# The .env file is already created, but you need to update it:
# - Change SESSION_SECRET to a random 32+ character string
# - Add your Google Maps API key (optional)
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

### Environment Variables

Edit the `.env` file:

```env
# Database (SQLite file location)
DATABASE_URL="file:./dev.db"

# Session secret - CHANGE THIS to a secure random string!
SESSION_SECRET="your_secure_random_string_at_least_32_characters_long"

# Google Maps API Key - Get from https://console.cloud.google.com/
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"
```

### Google Maps API Setup (Optional)

To enable restaurant search:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API**
4. Create an API key
5. Add the API key to your `.env` file as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**Note**: The Google Maps Places API has a generous free tier. Restaurant search will not work without this key, but all other features will function normally.

## Database Schema

The application uses 8 models:

- **User**: Reddit username and session data
- **Event**: Calendar events with title, description, and date
- **Restaurant**: Restaurant options for events
- **TimeSlot**: Time slot options for events
- **RSVP**: User attendance status
- **RestaurantVote**: Votes on restaurants
- **TimeSlotVote**: Votes on time slots
- **Comment**: Event comments

## Usage

### Creating an Account

1. Click the username field in the header
2. Enter your Reddit username (any username works, no verification)
3. Click "Login"

### Creating an Event

1. Click on any date in the calendar
2. Enter event title and optional description
3. Click "Create"

### Managing an Event

Click on an event to:
- **RSVP**: Choose Going, Maybe, or Not Going
- **Add Restaurants**: Search for restaurants using Google Maps
- **Vote on Restaurants**: Click the thumbs up button
- **Add Time Slots**: Propose specific meeting times
- **Vote on Time Slots**: Click the thumbs up button
- **Comment**: Discuss event details

## Deployment

### Vercel (Free)

1. Push your code to GitHub

2. Import your repository on [Vercel](https://vercel.com)

3. Add environment variables in Vercel:
   - `SESSION_SECRET`: Your secure session secret
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Your Google Maps API key

4. Deploy!

**Important**: For production, you may want to:
- Change SESSION_SECRET to a secure random string
- Consider migrating to PostgreSQL for better scalability (Vercel has issues with SQLite file persistence)

### Alternative: PostgreSQL

To use PostgreSQL instead of SQLite:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
}
```

2. Update `.env`:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

3. Run migrations:
```bash
npx prisma migrate dev
```

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Prisma commands
npx prisma studio        # Open database GUI
npx prisma migrate dev   # Create/apply migrations
npx prisma generate      # Generate Prisma Client
```

### Project Structure

```
reddit-shared-calendar/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── events/       # Event CRUD endpoints
│   │   ├── restaurants/  # Restaurant voting endpoints
│   │   └── time-slots/   # Time slot voting endpoints
│   ├── events/[id]/      # Event detail page
│   └── page.tsx          # Home page with calendar
├── components/            # React components
│   ├── Calendar.tsx      # Calendar component
│   └── RestaurantSearch.tsx  # Google Maps search
├── lib/                   # Utility functions
│   ├── prisma.ts         # Prisma client
│   └── session.ts        # Session management
├── prisma/               # Database
│   ├── schema.prisma     # Database schema
│   └── dev.db           # SQLite database file
└── .env                  # Environment variables
```

## Privacy & Data

This application is designed with privacy in mind:
- **No PII storage**: Only Reddit usernames (public information)
- **No email verification**: No email addresses collected
- **Session-based auth**: Secure cookie-based sessions
- **No tracking**: No analytics or third-party tracking

## Contributing

Feel free to submit issues or pull requests!

## License

MIT

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database with [Prisma](https://www.prisma.io/)
- Maps by [Google Maps Platform](https://developers.google.com/maps)
