# CLAUDE.md - AI Assistant Guidelines for M77 AG

## Project Overview

M77 AG is a comprehensive agricultural services platform for a four-generation family farming operation in Northeast Colorado. The platform provides custom farming services, hunting lease management, land management, cattle operations, and rental property management.

**Live Site:** m77ag.com
**Hosting:** Render.com
**Repository:** mcconnellentllc-cloud/m77ag

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (no framework) |
| Backend | Node.js (>=18.0.0), Express.js 5.x |
| Database | MongoDB Atlas with Mongoose ODM |
| Authentication | JWT (jsonwebtoken) + bcrypt password hashing |
| Email | Nodemailer |
| File Uploads | Multer |
| Security | Helmet, CORS, cookie-parser |

---

## Directory Structure

```
m77ag/
├── public/                    # Frontend static files
│   ├── index.html             # Homepage
│   ├── hunting.html           # Hunting leases page
│   ├── custom-farming.html    # Custom farming services
│   ├── rentals.html           # Property rentals
│   ├── admin/                 # Admin portal pages
│   │   ├── dashboard.html
│   │   ├── hunting-bookings.html
│   │   ├── equipment.html
│   │   ├── financials.html
│   │   └── financials/        # Financial sub-pages
│   ├── farmer/                # Farmer portal
│   │   ├── dashboard.html
│   │   └── login.html
│   ├── landlord/              # Landlord portal
│   │   ├── dashboard.html
│   │   └── login.html
│   ├── tenant/                # Tenant portal
│   │   ├── portal.html
│   │   └── login.html
│   ├── land-management/       # Land management portal
│   │   ├── dashboard.html
│   │   ├── login.html
│   │   └── signup.html
│   ├── user/                  # Customer portal
│   ├── css/                   # Stylesheets
│   │   └── main.css
│   └── assets/                # Images and media
│
├── server/                    # Backend application
│   ├── server.js              # Main Express server entry point
│   ├── controllers/           # Business logic handlers
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── cattleController.js (in routes)
│   │   ├── financialReportsController.js
│   │   └── ...
│   ├── models/                # Mongoose schemas
│   │   ├── user.js            # User model with roles
│   │   ├── cattle.js          # Cattle/herd management
│   │   ├── field.js           # Field/crop data
│   │   ├── equipment.js       # Equipment tracking
│   │   ├── booking.js         # Hunting bookings
│   │   ├── transaction.js     # Financial transactions
│   │   └── ...
│   ├── routes/                # API route definitions
│   │   ├── auth.js
│   │   ├── cattle.js
│   │   ├── equipment.js
│   │   ├── rentals.js
│   │   └── ...
│   ├── middleware/            # Express middleware
│   ├── utils/                 # Utility functions
│   │   └── emailservice.js    # Email sending utility
│   ├── email-templates/       # HTML email templates
│   │   ├── hunting-confirmation-email.js
│   │   ├── waiver-confirmation-email.js
│   │   └── ...
│   ├── scripts/               # Database scripts
│   │   └── seed-equipment.js
│   └── data/                  # Seed data files
│
├── scripts/                   # Root-level utility scripts
│   ├── createAdmin.js
│   └── importCattle.js
│
└── docs/                      # Documentation
```

---

## API Routes

All API endpoints are prefixed with `/api/`:

| Route | Purpose |
|-------|---------|
| `/api/auth` | User authentication (login, register, verify) |
| `/api/bookings` | Hunting booking management |
| `/api/cattle` | Cattle/herd CRUD operations |
| `/api/chemicals` | Chemical products and programs |
| `/api/equipment` | Equipment for sale |
| `/api/equipment/inventory` | Farm equipment inventory |
| `/api/farmer` | Farmer-specific operations |
| `/api/fields` | Field/crop management |
| `/api/financial-reports` | Financial reporting |
| `/api/harvest` | Harvest data tracking |
| `/api/hunting` | Hunting property data |
| `/api/land-management` | Land management auth/data |
| `/api/landlord` | Landlord portal operations |
| `/api/ledger` | Financial ledger entries |
| `/api/properties` | Property management |
| `/api/rentals` | Rental property CRUD |
| `/api/reviews` | Customer reviews |
| `/api/season-pass` | Hunting season passes |
| `/api/services` | Custom farming services |
| `/api/testimonials` | Testimonials management |
| `/api/transactions` | Financial transactions |

---

## User Roles and Portals

| Role | Portal | Access Level |
|------|--------|--------------|
| `admin` | `/admin/*` | Full system access |
| `farmer` | `/farmer/*` | Cattle, crops, equipment, field data |
| `landlord` | `/landlord/*` | ROI analytics, field reports, lease data |
| `employee` | `/admin/*` (limited) | Configurable permissions per user |
| `customer` | `/my-account`, `/user/*` | Bookings, waivers, season passes |

### Employee Permissions

Employee users have granular permissions:
- `canAddCattleRecords`, `canEditCattleRecords`, `canDeleteCattleRecords`
- `canAddEquipmentLogs`, `canEditEquipmentLogs`
- `canAddTransactions`, `canEditTransactions`
- `canViewFinancials`, `canViewReports`
- `accessAreas`: Array of `['cattle', 'crops', 'equipment', 'capital', 'hunting', 'rentals']`

---

## Common Commands

```bash
# Install dependencies
npm install

# Start production server
npm start

# Start development server (with nodemon)
npm run dev

# Seed database with initial data
npm run seed

# Seed equipment inventory
npm run seed:equipment
```

---

## Environment Variables

Required in `.env`:

```bash
PORT=3000
NODE_ENV=production|development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
EMAIL_USER=email@domain.com
EMAIL_PASS=app-password
```

---

## Design Guidelines (CRITICAL)

### Absolutely Prohibited
- **NO EMOJIS** - Never use emojis in code, comments, UI, or any content
- No playful or casual language
- No generic/default styling
- No excessive borders or hard edges

### Required Standards
- Professional business tone throughout
- Clean, minimal, sophisticated aesthetic
- Mobile-first responsive design
- Generous whitespace and readable typography

### Color Palette
- Primary greens: `#2d5016`, `#2c5530`
- Accent gold: `#d4a54a`
- Neutral backgrounds: `#f5f3f0`, white
- Subtle shadows: `box-shadow: 0 2px 10px rgba(0,0,0,0.1)`

### CSS Patterns
```css
/* Cards */
.card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

/* Buttons */
.btn {
  padding: 12px 30px;
  background: #2d5016;
  color: white;
  border: none;
  border-radius: 5px;
  transition: all 0.3s ease;
}

/* Form inputs - 16px minimum to prevent iOS zoom */
input, select, textarea {
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}
```

---

## Code Conventions

### File Naming
- Kebab-case for files: `hunting-bookings.html`, `auth-controller.js`
- camelCase for JavaScript variables and functions
- PascalCase for Mongoose models and classes

### JavaScript
- CommonJS modules (`require`/`module.exports`)
- Async/await for asynchronous operations
- Express route handlers follow pattern: `router.get('/path', controller.method)`

### API Response Format
```javascript
// Success
res.json({
  success: true,
  data: { ... },
  message: 'Operation completed'
});

// Error
res.status(400).json({
  success: false,
  message: 'Error description'
});
```

### Mongoose Models
- Located in `/server/models/`
- Include validation, pre-save hooks, and instance methods
- Password hashing handled in User model pre-save hook

---

## Database Models (Key Schemas)

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `User` | All user types | name, email, role, permissions |
| `Cattle` | Herd management | tag, breed, status, location, calving |
| `Field` | Crop fields | name, acres, crop, landlord |
| `Equipment` | Equipment for sale | name, price, status, images |
| `FarmEquipment` | Farm inventory | type, make, model, hours, maintenance |
| `Booking` | Hunting bookings | property, dates, hunters, status |
| `Transaction` | Financial records | type, amount, category, date |
| `Lease` | Land leases | landlord, terms, payments |
| `RentalProperty` | Housing rentals | address, rent, tenant |

---

## Authentication Flow

1. User submits credentials to `/api/auth/login`
2. Server validates and returns JWT token
3. Token stored in cookie (`authToken`) or localStorage
4. Protected routes check token via middleware
5. Token includes: `userId`, `role`, `email`

### Frontend Auth Pattern
```javascript
// Check authentication
const token = getCookie('authToken') || localStorage.getItem('authToken');
if (!token) {
  window.location.href = '/admin/login';
}

// API calls with auth
fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Testing Approach

- No automated test suite currently configured
- Manual testing required for:
  - All form submissions
  - Authentication flows
  - Mobile responsiveness
  - Email delivery

---

## Deployment

- **Platform:** Render.com
- **Build:** `npm install`
- **Start:** `npm start`
- **Auto-deploy:** Connected to GitHub repository

---

## Common Development Tasks

### Adding a New API Endpoint

1. Create/update model in `/server/models/`
2. Create controller in `/server/controllers/`
3. Create route in `/server/routes/`
4. Register route in `/server/server.js`

### Adding a New Page

1. Create HTML file in `/public/` or appropriate subdirectory
2. Add route in `/server/server.js` if not using static serving
3. Follow mobile-first responsive design
4. Match existing styling patterns

### Adding Email Notifications

1. Create template in `/server/email-templates/`
2. Use `emailService` from `/server/utils/emailservice.js`
3. Follow existing template patterns (professional, no emojis)

---

## Key Business Logic

### Hunting Bookings
- Properties: Heritage Farm, Prairie Peace
- Waiver system for all hunters
- Season pass support (5-day, 10-day)
- Booking confirmations via email

### Custom Farming
- Volume discounts: 7% (100+ acres), 10% (200+ acres), 14% (300+ acres)
- Service pricing calculator
- Landlord ROI tracking

### Cattle Operations
- Herd tracking with individual records
- Calving management
- Grazing schedules
- Health and breeding records

### Financial Tracking
- Transaction ledger
- Harvest data by field
- Capital investments
- Equipment depreciation

---

## Troubleshooting

### Common Issues

**MongoDB connection fails:**
- Check `MONGODB_URI` in `.env`
- Verify network access in MongoDB Atlas

**Email not sending:**
- Check `EMAIL_USER` and `EMAIL_PASS`
- For Gmail, use App Password not regular password

**Static files not updating:**
- HTML files have `no-cache` headers
- Clear browser cache or use incognito

### Health Check
```bash
curl http://localhost:3000/api/test
# Returns: { message: 'M77 AG API is working', mongodb: 'connected' }
```

---

## Important Notes for AI Assistants

1. **Read before editing** - Always read files before making changes
2. **No emojis** - This is strictly enforced throughout the project
3. **Mobile-first** - Design for mobile devices primarily
4. **Professional tone** - All content should be business-appropriate
5. **Security** - Never expose credentials, always validate inputs
6. **Minimal changes** - Only make requested changes, avoid over-engineering
7. **Existing patterns** - Follow established code patterns and styling
8. **Test on mobile** - Changes should be verified for mobile compatibility

---

*Last updated: January 2026*
