# Hotel Booking Platform

A modern hotel booking platform built with Express.js, TypeScript, and Prisma. This application provides a complete booking system with user authentication, hotel management, and reservation capabilities.

## Features

- **User Authentication**: JWT-based authentication with role-based access (Customer/Owner)
- **Hotel Management**: CRUD operations for hotels and rooms
- **Booking System**: Room booking with availability checking
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Input validation using Zod schemas
- **Security**: Password hashing with bcrypt and middleware protection

## Tech Stack

- **Runtime**: Bun
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Language**: TypeScript
- **Authentication**: JWT with bcrypt
- **Validation**: Zod

## Project Structure

```
hotel-booking-platform/
├── src/
│   ├── controllers/           # Request handlers
│   │   ├── auth.controller.ts    # User authentication logic
│   │   ├── hotel.controller.ts   # Hotel management logic
│   │   └── booking.controller.ts # Booking logic
│   ├── middleware/            # Express middleware
│   │   ├── authmiddleware.ts     # JWT authentication middleware
│   │   └── validate.ts           # Request validation middleware
│   ├── routes/               # API routes
│   │   ├── auth.routes.ts        # Authentication endpoints
│   │   ├── hotel.routes.ts       # Hotel endpoints
│   │   └── booking.routes.ts     # Booking endpoints
│   ├── types/                # TypeScript type definitions
│   │   └── express.d.ts          # Express type extensions
│   ├── validators/           # Zod validation schemas
│   │   ├── auth.validator.ts     # Auth validation schemas
│   │   ├── hotel.validator.ts    # Hotel validation schemas
│   │   └── booking.validator.ts  # Booking validation schemas
│   └── index.ts              # Application entry point
├── generated/
│   └── prisma/               # Auto-generated Prisma client
├── db.ts                    # Prisma client configuration
├── prisma.config.ts         # Prisma configuration
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── .env                     # Environment variables
└── README.md               # Project documentation
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - User registration
- `POST /login` - User login

### Hotels (`/api/hotels`)
- `GET /` - List all hotels
- `POST /` - Create new hotel (owner only)
- `GET /:id` - Get hotel by ID
- `PUT /:id` - Update hotel (owner only)
- `DELETE /:id` - Delete hotel (owner only)

### Bookings (`/api/bookings`)
- `POST /` - Create booking
- `GET /user/:userId` - Get user bookings
- `GET /hotel/:hotelId` - Get hotel bookings

## Setup

### Prerequisites
- Bun runtime
- PostgreSQL database

### Installation

1. Install dependencies:
```bash
bun install
```

2. Set up environment variables in `.env`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/hotel_db
JWT_SECRET=your_jwt_secret
PORT=3000
```

3. Run the application:
```bash
bun run dev
```

## Database Schema

The application uses the following main entities:
- **Users**: Customer and Owner accounts
- **Hotels**: Hotel information managed by owners
- **Rooms**: Room details within hotels
- **Bookings**: Room reservations
- **Reviews**: Hotel reviews by customers

This project was created using `bun init` in Bun v1.3.6. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
