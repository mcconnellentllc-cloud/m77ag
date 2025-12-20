# M77 AG - Project Guidelines

## Design Philosophy

This is a **professional agricultural services platform** serving a four-generation family operation. The design must reflect **elegance, sophistication, and trustworthiness** appropriate for a serious agricultural business.

---

## Code Style Standards

### Absolutely Prohibited
- **NO EMOJIS** - Not in code, comments, UI, emails, or any user-facing content
- No playful or casual language
- No cluttered or blocky interfaces
- No default/generic styling
- No excessive borders or hard edges

### Required Approach
- Professional business tone throughout
- Clean, minimal, sophisticated aesthetic
- Elegant typography and generous whitespace
- Subtle visual effects over harsh styling

---

## Visual Design Standards

### Typography
- Clean, readable fonts (Inter, Arial, system fonts)
- Generous line-height (1.6+) for readability
- Clear hierarchy with consistent heading sizes
- Sufficient contrast for outdoor viewing conditions

### Spacing & Layout
- Generous whitespace between sections
- Consistent padding and margins
- Avoid cramped layouts
- Breathing room around all elements

### Colors
- Muted, professional color palette
- Earth tones: greens (#2d5016, #2c5530), golds (#d4a54a)
- Neutral backgrounds: whites, light grays (#f5f3f0)
- Subtle color accents, not bright or garish

### Visual Effects
- Subtle shadows (`box-shadow: 0 2px 10px rgba(0,0,0,0.1)`)
- Smooth transitions (300ms ease)
- Rounded corners (border-radius: 5-10px)
- Avoid hard borders - use subtle shadows instead

### Buttons & Interactive Elements
- Clear hover states with smooth transitions
- Adequate padding for touch targets (44px minimum)
- Professional button styles (not cartoon-like)
- Subtle depth with shadows, not heavy borders

---

## Mobile-First Design

### Critical Context
**Most users browse on mobile phones while in the field or on the go.**

### Requirements
- Design mobile layout FIRST, desktop second
- Touch-friendly tap targets (44px minimum)
- Large, readable text (16px minimum)
- Easy scrolling with adequate spacing
- Optimize for outdoor viewing (high contrast)
- Test on actual mobile devices regularly

### Responsive Breakpoints
```css
/* Mobile first - base styles */
/* Small phones: 320px+ */
/* Standard phones: 375px+ */
/* Large phones: 414px+ */
/* Tablets: 768px+ */
/* Desktop: 1024px+ */
/* Large desktop: 1440px+ */
```

### Mobile Performance
- Lazy load images
- Minimize JavaScript bundle size
- Optimize images (WebP, proper sizing)
- Fast initial page load (<3 seconds on 4G)
- Offline capability via service worker

---

## Technical Requirements

### Progressive Web App (PWA)
- Valid `manifest.json` with proper icons
- Service worker for offline functionality
- Installable on mobile home screens
- Fast, app-like experience
- Cache critical resources

### Performance
- First Contentful Paint < 2 seconds
- Time to Interactive < 4 seconds
- Optimize images (compress, lazy load)
- Minimize CSS/JS bundle sizes
- Use CDN for static assets

### Accessibility
- Semantic HTML5 elements
- ARIA labels where needed
- Keyboard navigation support
- Sufficient color contrast (WCAG AA)
- Focus indicators visible
- Screen reader friendly

### Browser Support
- Modern mobile browsers (iOS Safari, Chrome)
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Graceful degradation for older browsers
- Test on real devices, not just emulators

---

## Content Standards

### Tone & Voice
- Professional and authoritative
- Warm but not casual
- Clear and direct communication
- Respect agricultural heritage and expertise

### Writing Style
- Short paragraphs (3-4 lines max on mobile)
- Bullet points for scannability
- Active voice preferred
- Avoid jargon unless industry-standard
- NO EMOJIS - use words: WARNING, IMPORTANT, REQUIRED

### Forms & Inputs
- Clear labels above inputs
- Helpful placeholder text
- Inline validation with clear error messages
- Mobile-optimized input types (`type="tel"`, `type="email"`)
- Large touch-friendly inputs

---

## Email Communications

### Design
- Responsive HTML emails (mobile-first)
- Plain text fallback
- Professional formatting
- Clear call-to-action buttons
- NO EMOJIS

### Content
- Clear subject lines
- Important info at the top
- Concise paragraphs
- Professional sign-off
- Contact information included

---

## Component Patterns

### Cards
```css
.card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
```

### Buttons
```css
.btn {
  padding: 12px 30px;
  background: #2d5016;
  color: white;
  border: none;
  border-radius: 5px;
  transition: all 0.3s ease;
}
```

### Forms
```css
input, select, textarea {
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 5px;
  font-size: 16px; /* Prevents zoom on iOS */
}
```

---

## File Structure

### Organization
- `/public` - Static files, HTML pages
- `/server` - Node.js backend
- `/server/models` - MongoDB schemas
- `/server/controllers` - Business logic
- `/server/routes` - API endpoints
- `/server/middleware` - Auth, validation

### Naming Conventions
- Kebab-case for files: `hunting-bookings.html`
- camelCase for JavaScript variables
- PascalCase for models and classes
- Descriptive, meaningful names

---

## Git Workflow

### Commit Messages
- Clear, descriptive commit messages
- Present tense: "Add feature" not "Added feature"
- Reference what changed and why
- Group related changes

### Branches
- `main` - Production-ready code
- Feature branches: `feature/waiver-system`
- Bug fixes: `fix/booking-validation`
- Updates: `update/remove-emojis`

---

## Testing & Quality

### Before Deployment
- Test on real mobile devices (iOS and Android)
- Test all forms and user flows
- Verify email deliverability
- Check responsive design at all breakpoints
- Test slow network conditions (3G)
- Validate HTML/CSS
- Check for console errors

### Ongoing Monitoring
- Monitor server logs
- Track email delivery rates
- Check database performance
- Monitor uptime
- Review user feedback

---

## Environment Variables

Required in `.env`:
```bash
MONGODB_URI=mongodb+srv://...
JWT_SECRET=secret-key
EMAIL_USER=email@domain.com
EMAIL_PASS=app-password
NODE_ENV=production
PORT=3000
```

Never commit `.env` to repository.

---

## Security

### Best Practices
- Hash passwords with bcrypt
- Use JWT for authentication
- Validate all user inputs
- Sanitize database queries
- HTTPS only in production
- Secure cookie settings
- Rate limiting on APIs

### Sensitive Data
- Never log sensitive data
- Never expose credentials
- Keep phone numbers private
- Secure payment information
- GDPR/privacy compliance

---

## Performance Optimization

### Images
- Compress before upload (TinyPNG, ImageOptim)
- Use WebP format with fallbacks
- Lazy load below-the-fold images
- Proper image dimensions (no oversized)
- Use CDN for static assets

### Code
- Minify CSS/JS in production
- Remove unused CSS
- Bundle and compress assets
- Use caching headers
- Enable gzip compression

### Database
- Index frequently queried fields
- Limit query results
- Use aggregation pipelines
- Monitor slow queries
- Regular backups

---

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review security advisories
- Monitor error logs
- Test booking system weekly
- Backup database daily
- Review analytics monthly

### Documentation
- Keep README updated
- Document API endpoints
- Comment complex logic
- Update deployment docs
- Maintain changelog

---

## Contact & Support

**M77 AG - McConnell Enterprises LLC**
Four Generations of Agricultural Excellence

**Email:** office@m77ag.com
**Hunting Inquiries:** hunting@m77ag.com
**Location:** Northeast Colorado

---

## Version History

**Current Version:** 2.0
**Last Updated:** December 2025
**Major Features:**
- Multi-hunter waiver system
- Customer account dashboard
- Admin booking management
- Calendar integration
- Email automation

---

*These guidelines ensure M77 AG maintains a professional, elegant web presence that reflects the quality and heritage of a four-generation agricultural operation.*
