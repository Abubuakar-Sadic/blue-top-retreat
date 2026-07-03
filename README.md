# Blue Top Villa

A modern hotel, villa, and event center management platform built for **Blue Top Villa, Kasoa, Ghana**. The project consists of a public-facing website and a secure role-based administration system that enables staff to manage rooms, events, reservations, content, and customer inquiries from a centralized dashboard.

This project was designed to modernize Blue Top Villa's online presence while simplifying day-to-day operations for management and staff.

---

## Live Website

https://bluetopvilla.com

---

## Project Overview

Blue Top Villa required more than a traditional business website. The objective was to build a complete digital platform capable of:

- Presenting the hotel professionally
- Showcasing available rooms
- Promoting upcoming events
- Accepting room reservations
- Accepting venue reservation requests
- Managing customer inquiries
- Providing staff with a secure administration dashboard
- Allowing administrators to update website content without requiring a developer

---

# Key Features

## Public Website

- Modern responsive design
- Mobile-first layout
- Hero section
- About Blue Top Villa
- Rooms showcase
- Detailed room pages
- Room amenities
- Gallery
- Upcoming events
- Contact page
- WhatsApp integration
- Social media integration
- Reservation forms
- Event registration forms
- Venue booking forms

---

## Room Management

Administrators can:

- Add rooms
- Edit rooms
- Delete rooms
- Upload room images
- Update room prices
- Update room descriptions
- Configure room amenities

Amenities include examples such as:

- Wi-Fi
- Air Conditioning
- Television
- Refrigerator
- Hot Water
- Balcony
- Parking
- Swimming Pool

Room updates automatically appear on the public website.

---

## Event Management

Supports two different event categories.

### 1. Public Events

Examples:

- Pool Parties
- Live Band Nights
- Friday Night Events
- Conferences

Features:

- Upload event flyer
- Event description
- Date and time
- Recurring events
- One-time events
- Automatic visibility control

### Recurring Events

Examples:

- Every Friday
- Every Saturday
- Every Sunday

Instead of selecting only one calendar date, administrators can schedule recurring weekly events.

---

### One-Time Events

Examples:

- Weddings
- Product Launches
- Corporate Conferences

Features:

- Specific event date
- Start time
- End time

Once the event has passed, it is automatically moved to the **Past Events** section and removed from the public Upcoming Events page.

---

# Reservation System

The system supports three independent reservation workflows.

---

## Room Booking

Customers can reserve hotel rooms.

Information collected includes:

- Full Name
- Phone Number
- Email Address
- Check-in Date
- Check-out Date
- Number of Guests
- Special Requests

Booking code format:

```
BOKR-000001
```

---

## Venue Reservation

For customers wishing to rent Blue Top Villa for private events.

Examples:

- Wedding
- Birthday
- Engagement
- Funeral Reception
- Corporate Event
- Conference

Information collected:

- Full Name
- Phone Number
- Email
- Event Type
- Event Date
- Start Time
- End Time
- Number of Guests
- Additional Requirements

Booking code format:

```
BKE-000001
```

---

## Event Attendance

Customers can reserve a spot for events hosted by Blue Top Villa.

Examples:

- Pool Party
- Live Music
- Friday Night Event

Information collected:

- Full Name
- Phone Number
- Email
- Number of Attendees

Booking code format:

```
BOK-000001
```

---

# Role-Based Administration

The administration dashboard implements Role-Based Access Control (RBAC).

---

## CEO

Supports multiple CEO accounts.

Current implementation allows:

- Father
- Son

Both have identical permissions.

CEO permissions include:

- Full dashboard access
- User management
- Room management
- Booking management
- Event management
- Staff management
- Reports
- Content management
- Website management

---

## Manager

Can manage:

- Rooms
- Events
- Bookings
- Customer inquiries
- Reports

Cannot:

- Create CEOs
- Modify system roles
- Change system configuration

---

## Receptionist

Can:

- View bookings
- Confirm bookings
- Manage guest information
- Update booking status

Cannot:

- Modify rooms
- Delete events
- Manage users

---

## Content Editor

Responsible for:

- Updating website content
- Uploading images
- Editing event information
- Gallery management

Cannot:

- Access financial information
- Manage users
- Approve bookings

---

## Reports Viewer

Read-only access.

Can view:

- Booking reports
- Occupancy reports
- Event attendance
- Dashboard statistics

Cannot modify any data.

---

# Dashboard Features

- Dashboard Overview
- Room Management
- Booking Management
- Venue Reservations
- Event Reservations
- Contact Messages
- Reports
- User Management
- Gallery Management
- Website Content Management

---

# Contact Management

Visitors can send inquiries directly from the website.

Administrators can:

- View messages
- Mark messages as read
- Organize customer inquiries

---

# Social Media Integration

Supports direct links to:

- Instagram
- TikTok
- WhatsApp

Administrators can update these links without modifying the website code.

---

# Authentication

Secure authentication system with role-based authorization.

Features include:

- Login
- Logout
- Staff registration
- Role assignment
- Session management

Email confirmation requirement has been removed for internal staff accounts.

---

# Technology Stack

Frontend

- React
- TypeScript
- Tailwind CSS
- Vite

Backend

- Supabase

Database

- PostgreSQL (Supabase)

Authentication

- Supabase Authentication

Storage

- Supabase Storage

Hosting

- Vercel

Version Control

- Git
- GitHub

---

# Future Improvements

Planned features include:

- Hubtel Mobile Money Integration
- Online Payments
- SMS Notifications
- WhatsApp Notifications
- Invoice Generation
- QR Code Booking Verification
- Email Notifications
- Analytics Dashboard
- Calendar Synchronization
- Google Maps Integration

---

# Deployment

Hosted on:

- Vercel

Domain connected and configured.

---

# Search Engine Optimization

SEO implementation includes:

- Responsive design
- Metadata
- Open Graph tags
- Sitemap
- Robots.txt
- Structured page hierarchy

---

# Author

**Abubakar Sadic**

Frontend Developer

Specializing in:

- React
- TypeScript
- Tailwind CSS
- Supabase
- Responsive UI/UX
- Admin Dashboard Development
- Business Websites
- Hotel & Event Management Platforms

GitHub:
https://github.com/Abubuakar-Sadic

Portfolio:
https://abubakar-sadic.vercel.app

---

## License

This project was developed specifically for Blue Top Villa.

All rights reserved.
