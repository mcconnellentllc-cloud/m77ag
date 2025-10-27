# M77 AG - Agricultural Services Platform

## Overview
M77 AG is a comprehensive web platform for a four-generation family agricultural operation in Northeast Colorado. The platform provides custom farming services, hunting leases, and land management solutions.

## Features

### Public Website
- **Homepage** - Company overview and services
- **Services** - Custom farming calculator with volume discounts
- **Hunting** - Sedgwick County property leases and camping
- **About** - Company history and team information

### Portal Systems
- **Customer Portal** - Access farming records and invoices
- **Landlord Portal** - ROI analytics and field reports
- **Employee Portal** - Time tracking and work schedules
- **Admin Dashboard** - Proposal and customer management

### Business Features
- Service pricing calculator with automatic volume discounts:
  - 7% discount for 100+ acres
  - 10% discount for 200+ acres
  - 14% discount for 300+ acres
- Real-time proposal tracking
- Equipment and maintenance management
- Field operation reports

## Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas (ready for integration)
- **Hosting**: Render.com
- **Domain**: m77ag.com

## Installation

1. Clone the repository:
```bash
git clone https://github.com/mcconnellentllc-cloud/m77ag.com.git
cd m77ag.com
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in root directory:
```env
PORT=3000
NODE_ENV=production
# Add your MongoDB URI and other credentials
```

4. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Project Structure
```
M77-Ag/
├── public/              # Static files
│   ├── index.html      # Homepage
│   ├── services.html   # Services page
│   ├── hunting.html    # Hunting leases
│   ├── about.html      # About page
│   └── assets/         # Images and media
│       └── images/
├── portal/             # Portal pages
│   ├── login.html      # Customer login
│   ├── dashboard.html  # Admin dashboard
│   ├── employee/       # Employee portal
│   │   └── login.html
│   └── landlord/       # Landlord portal
│       └── login.html
├── server/             # Backend code
│   ├── server.js       # Main server file
│   ├── controllers/    # Route controllers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   └── middleware/     # Custom middleware
├── data/               # Data files
├── admin/              # Admin files
├── package.json        # Dependencies
├── .env               # Environment variables (not in repo)
└── README.md          # This file
```

## Contact
- **Phone**: 970-774-3276
- **Email**: office@m77ag.com
- **Location**: Northeast Colorado

## Company Information
**M77 AG - McConnell Enterprises LLC**  
Four Generations of Learning & Evolving  
Surviving and adapting to the harsh Colorado eastern plains since the late 1800s

## Services Offered
- Custom Farming (Planting, Spraying, Harvesting)
- Hunting Leases (Sedgwick County Properties)
- Land Management & ROI Analytics
- Black Angus Cattle Operations
- Test Plot Research

## Equipment
- Claas 760 TT Combine
- John Deere Tractors (8370RT, 8320R, 6145R)
- 24-Row John Deere 1770NT Planter
- NH P8620 Air Drill
- Rogator 1300 Sprayer

## License
© 2025 M77 AG. All rights reserved. McConnell Enterprises LLC.

---

**Note**: This is a private repository for M77 AG operations. For access or questions, contact office@m77ag.com