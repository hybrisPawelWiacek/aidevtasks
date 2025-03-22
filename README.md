# TaskHub - Modern Task Management Application

A modern, AI-enhanced todo application designed for developers, featuring advanced task management capabilities with intelligent suggestions and seamless user experience.

## Technology Stack

- **Frontend**: React with TypeScript, Vite build system
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Google OAuth 
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query
- **Routing**: wouter

## Features

- User authentication with Google OAuth
- Create, read, update, and delete tasks
- Filter tasks by status (all, today, upcoming, completed, high priority)
- Sort tasks by different criteria (date, priority, alphabetical)
- Responsive design for desktop and mobile devices

## Project Structure

```
├── client/             # Frontend React application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utility functions
│   │   ├── pages/      # Page components
│   │   └── main.tsx    # Application entry point
├── server/             # Backend Express application
│   ├── routes.ts       # API routes
│   ├── storage.ts      # Data storage interface
│   └── index.ts        # Server entry point
├── shared/             # Shared code between client and server
│   └── schema.ts       # Database schema and types
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd taskhub
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   Create a `.env` file with the following variables:
   ```
   DATABASE_URL=your_postgresql_connection_string
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   SESSION_SECRET=your_session_secret
   ```

4. Run the development server
   ```
   npm run dev
   ```

## Deployment

The application can be deployed on Replit.

## License

MIT