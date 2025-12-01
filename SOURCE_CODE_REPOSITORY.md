# PC Builder Platform - Source Code Repository

## GitHub Repository Structure

This document provides a comprehensive overview of the source code repository structure, including all files, directories, and their purposes.

---

## Repository Overview

**Repository Name:** `pcbuilder`  
**Description:** PC Builder Platform - A comprehensive web application for building custom PCs with real-time compatibility checking  
**License:** MIT  
**Technology Stack:** React.js, Node.js, Express.js, MySQL

---

## Directory Structure

```
pcbuilder/
│
├── 📁 backend/                          # Backend API (Node.js/Express)
│   ├── 📁 src/
│   │   ├── 📁 config/                   # Configuration files
│   │   │   ├── database.js              # MySQL connection pool configuration
│   │   │   └── postgres.js              # PostgreSQL configuration (if used)
│   │   │
│   │   ├── 📁 middleware/                # Custom middleware
│   │   │   └── auth.js                  # JWT authentication middleware
│   │   │
│   │   ├── 📁 routes/                   # API route handlers
│   │   │   ├── admin.js                 # Admin endpoints (CRUD operations)
│   │   │   ├── auth.js                  # Authentication endpoints
│   │   │   ├── builds.js                # Build management endpoints
│   │   │   ├── components.js            # Component endpoints
│   │   │   └── contact.js               # Contact form endpoints
│   │   │
│   │   └── app.js                       # Main Express application entry point
│   │
│   ├── 📄 create-build-likes-table.js   # Database migration script for likes table
│   ├── 📄 env.example                   # Environment variables template
│   ├── 📄 package.json                  # Backend dependencies and scripts
│   ├── 📄 package-lock.json             # Dependency lock file
│   ├── 📄 reset-admin-password.js       # Admin password reset utility
│   ├── 📄 setup-database.js             # Database setup script
│   ├── 📄 setup-email.js                # Email configuration script
│   └── 📄 start-backend.ps1             # PowerShell script to start backend
│
├── 📁 public/                           # Static assets (served directly)
│   └── 📁 Images/                       # Image assets
│       ├── bullet.gif                   # Loading bullet animation
│       ├── bx_loader.gif                # Loading spinner
│       ├── controls.png                 # Control icons
│       ├── favicon.png                  # Site favicon
│       ├── PC (1).jpg through PC (12).jpg  # PC build showcase images
│       ├── pcbuild.png                  # Main logo
│       └── PCPP.png                     # Additional logo
│
├── 📁 src/                              # Frontend source code (React.js)
│   ├── 📁 components/                  # Reusable React components
│   │   ├── Navbar.jsx                   # Navigation bar component
│   │   ├── ProtectedRoute.jsx           # Route protection wrapper
│   │   └── ScrollToTop.jsx             # Scroll restoration utility
│   │
│   ├── 📁 context/                     # React Context providers
│   │   ├── AuthContext.jsx             # Authentication state management
│   │   └── BuildContext.jsx             # Build state management
│   │
│   ├── 📁 pages/                       # Page components
│   │   ├── About.jsx                   # About page
│   │   ├── AdminDashboard.jsx          # Admin dashboard page
│   │   ├── Contact.jsx                 # Contact page
│   │   ├── ForgotPassword.jsx          # Password reset request page
│   │   ├── Home.jsx                    # Home/landing page
│   │   ├── MyBuilds.jsx                # User's builds page
│   │   ├── ResetPassword.jsx           # Password reset page
│   │   ├── SearchBuilds.jsx            # Build search/discovery page
│   │   ├── Services.jsx                # Services page
│   │   ├── SignIn.jsx                  # Sign in page
│   │   ├── SignUp.jsx                  # Sign up page
│   │   ├── SystemBuilder.jsx           # System builder page (main feature)
│   │   └── ViewBuild.jsx               # Individual build view page
│   │
│   ├── 📁 utils/                       # Utility functions
│   │   └── api.js                      # Axios API configuration
│   │
│   ├── App.jsx                          # Main React application component
│   ├── index.css                        # Global CSS styles
│   └── main.jsx                         # React application entry point
│
├── 📁 dist/                             # Production build output (generated)
│   ├── 📁 assets/                      # Compiled CSS and JS
│   │   ├── index-[hash].css            # Compiled CSS bundle
│   │   ├── index-[hash].js             # Compiled JavaScript bundle
│   │   └── index-[hash].js.map         # Source map
│   │
│   ├── 📁 Images/                       # Copied image assets
│   └── index.html                       # Production HTML
│
├── 📁 node_modules/                     # Frontend dependencies (generated)
│
├── 📄 .gitignore                        # Git ignore rules
├── 📄 index.html                        # HTML entry point
├── 📄 package.json                      # Frontend dependencies and scripts
├── 📄 package-lock.json                 # Dependency lock file
├── 📄 pc_builder_db.sql                 # Database schema and seed data
├── 📄 postcss.config.js                 # PostCSS configuration
├── 📄 README.md                         # Project documentation
├── 📄 tailwind.config.js                # Tailwind CSS configuration
├── 📄 vite.config.js                    # Vite build configuration
├── 📄 FUNCTIONALITY_DOCUMENTATION.md    # Feature documentation
├── 📄 PROJECT_REPORT.md                 # Project report
└── 📄 SOURCE_CODE_REPOSITORY.md        # This file
```

---

## File Descriptions

### Backend Files

#### `backend/src/app.js`
Main Express application file. Sets up middleware, routes, error handling, and starts the server.

**Key Features:**
- Express server configuration
- Security middleware (Helmet, CORS, Rate Limiting)
- Route registration
- Error handling middleware
- Health check endpoint

#### `backend/src/config/database.js`
MySQL connection pool configuration. Manages database connections efficiently.

**Key Features:**
- Connection pooling
- Environment-based configuration
- Error handling

#### `backend/src/middleware/auth.js`
JWT authentication middleware. Protects routes requiring authentication.

**Key Features:**
- Token verification
- User validation
- Admin role checking

#### `backend/src/routes/auth.js`
Authentication endpoints (register, login, logout, password reset).

**Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify` - Verify JWT token

#### `backend/src/routes/builds.js`
Build management endpoints.

**Endpoints:**
- `GET /api/builds/search` - Search public builds
- `GET /api/builds/my` - Get user's builds
- `GET /api/builds/:id` - Get specific build
- `POST /api/builds` - Create new build
- `PUT /api/builds/:id` - Update build
- `DELETE /api/builds/:id` - Delete build
- `POST /api/builds/:id/duplicate` - Duplicate build
- `PUT /api/builds/:id/visibility` - Toggle visibility
- `POST /api/builds/:id/like` - Like/unlike build

#### `backend/src/routes/components.js`
Component endpoints for system builder.

**Endpoints:**
- `GET /api/components/filtered` - Get filtered components (compatibility-based)
- `GET /api/components` - Get all components
- `GET /api/components/:id` - Get specific component
- `GET /api/components/categories/list` - Get categories
- `GET /api/components/manufacturers/list` - Get manufacturers

#### `backend/src/routes/admin.js`
Admin dashboard endpoints.

**Endpoints:**
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/components` - Get all components
- `POST /api/admin/components` - Add component
- `PUT /api/admin/components/:id` - Update component
- `DELETE /api/admin/components/:id` - Delete component
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/builds` - Get all builds
- `DELETE /api/admin/builds/:id` - Delete build
- `GET /api/admin/comments` - Get contact messages
- `PUT /api/admin/contact-messages/:id/read` - Mark as read
- `PUT /api/admin/contact-messages/:id/replied` - Mark as replied
- `DELETE /api/admin/contact-messages/:id` - Delete message
- `GET /api/admin/password-resets` - Get reset requests
- `DELETE /api/admin/password-resets/:token` - Delete reset request

#### `backend/src/routes/contact.js`
Contact form endpoints.

**Endpoints:**
- `POST /api/contact` - Submit contact form

#### `backend/env.example`
Template for environment variables. Copy to `.env` and fill in values.

**Required Variables:**
- `PORT` - Server port (default: 5000)
- `DB_HOST` - Database host
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT secret key
- `EMAIL_HOST` - SMTP host
- `EMAIL_PORT` - SMTP port
- `EMAIL_USER` - Email username
- `EMAIL_PASS` - Email password
- `EMAIL_FROM` - From email address
- `ADMIN_EMAIL` - Admin email address
- `FRONTEND_URL` - Frontend URL for CORS

#### `backend/setup-database.js`
Database setup script. Creates tables and initial data if needed.

#### `backend/reset-admin-password.js`
Utility script to reset admin password.

#### `backend/setup-email.js`
Email configuration setup script.

#### `backend/create-build-likes-table.js`
Migration script to create build_likes table.

---

### Frontend Files

#### `src/App.jsx`
Main React application component. Sets up routing and global providers.

**Key Features:**
- React Router configuration
- Route definitions (public, protected, admin)
- Toast notification configuration
- Context providers

#### `src/main.jsx`
React application entry point. Renders the App component.

#### `src/components/Navbar.jsx`
Navigation bar component with responsive design.

**Features:**
- Mobile hamburger menu
- Tablet expandable icons
- Desktop full navigation
- Authentication state display
- Admin badge

#### `src/components/ProtectedRoute.jsx`
Route protection wrapper. Redirects unauthenticated users.

**Features:**
- Authentication check
- Admin-only route protection
- Redirect handling

#### `src/components/ScrollToTop.jsx`
Utility component to scroll to top on route change.

#### `src/context/AuthContext.jsx`
Authentication context provider.

**State:**
- `user` - Current user object
- `isAuthenticated` - Authentication status
- `isAdmin` - Admin status

**Methods:**
- `login(email, password)` - User login
- `register(name, email, password)` - User registration
- `logout()` - User logout

#### `src/context/BuildContext.jsx`
Build state management context.

**State:**
- `selectedComponents` - Currently selected components
- `totalPrice` - Total build price
- `compatibilityStatus` - Compatibility status
- `compatibilityIssues` - List of compatibility issues

**Methods:**
- `selectComponent(category, component)` - Select component
- `removeComponent(category)` - Remove component
- `resetBuild()` - Clear all components
- `setCompatibility(status, issues)` - Update compatibility
- `loadBuild(buildData)` - Load existing build

#### `src/pages/Home.jsx`
Landing page with hero section and feature cards.

#### `src/pages/SystemBuilder.jsx`
Main system builder page. Core feature of the application.

**Features:**
- Component selection modal
- Real-time compatibility checking
- Build name and visibility settings
- Save/update build functionality
- Edit mode support
- Guest build persistence

#### `src/pages/SearchBuilds.jsx`
Build search and discovery page.

**Features:**
- Search by name
- Filter by price range
- Filter by CPU brand
- Budget PC quick filter
- Sort options (updated, popular, price, name)
- View mode toggle (public/private)
- Like, share, duplicate actions

#### `src/pages/MyBuilds.jsx`
User's personal builds management page.

**Features:**
- List of user's builds
- View, edit, delete actions
- Toggle visibility
- Share builds

#### `src/pages/ViewBuild.jsx`
Individual build detail page.

**Features:**
- Build information display
- Component list with details
- Price breakdown
- Like, share, duplicate buttons

#### `src/pages/AdminDashboard.jsx`
Administrative dashboard.

**Features:**
- Statistics cards
- Tab navigation (Users, Components, Builds, Comments, Resets)
- CRUD operations for all entities
- Search functionality
- Modal forms for editing

#### `src/pages/SignIn.jsx`
User sign-in page.

**Features:**
- Email and password input
- Form validation
- Remember email functionality
- Forgot password link
- Auto-redirect after login

#### `src/pages/SignUp.jsx`
User registration page.

**Features:**
- Name, email, password inputs
- Password confirmation
- Terms acceptance
- Auto-login after registration

#### `src/pages/ForgotPassword.jsx`
Password reset request page.

**Features:**
- Email input
- Email sending
- Success confirmation screen

#### `src/pages/ResetPassword.jsx`
Password reset page.

**Features:**
- Token validation
- New password input
- Password strength requirements
- Confirmation input

#### `src/pages/About.jsx`
About page with company information.

#### `src/pages/Services.jsx`
Services page with feature descriptions.

#### `src/pages/Contact.jsx`
Contact form page.

**Features:**
- Contact form with validation
- Subject dropdown
- Email sending
- Business hours display
- Social media links

#### `src/utils/api.js`
Axios configuration with interceptors.

**Features:**
- Base URL configuration
- Request interceptor (adds auth token)
- Response interceptor (handles 401 errors)
- Error handling

#### `src/index.css`
Global CSS styles and Tailwind imports.

#### `tailwind.config.js`
Tailwind CSS configuration.

**Features:**
- Custom color scheme
- Custom utilities
- Responsive breakpoints

#### `vite.config.js`
Vite build configuration.

**Features:**
- React plugin
- Proxy configuration for API
- Build optimization

#### `postcss.config.js`
PostCSS configuration for Tailwind CSS processing.

---

### Configuration Files

#### `package.json` (Root)
Frontend dependencies and scripts.

**Scripts:**
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run backend` - Start backend server
- `npm run full-dev` - Start both frontend and backend

**Dependencies:**
- React 18.2.0
- React Router DOM 6.8.1
- Axios 1.3.4
- React Hook Form 7.43.1
- React Hot Toast 2.4.0
- Tailwind CSS 3.2.7
- Vite 7.2.2

#### `backend/package.json`
Backend dependencies and scripts.

**Scripts:**
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run setup-db` - Run database setup
- `npm run reset-admin` - Reset admin password
- `npm run setup-email` - Setup email configuration

**Dependencies:**
- Express 4.18.2
- MySQL2 3.15.3
- JSON Web Token 9.0.0
- Bcryptjs 2.4.3
- Joi 17.13.3
- Nodemailer 6.9.1
- Helmet 6.0.1
- CORS 2.8.5

#### `pc_builder_db.sql`
Database schema and seed data.

**Tables:**
- `user` - User accounts
- `component` - PC components
- `category` - Component categories
- `manufacturer` - Component manufacturers
- `build` - User builds
- `buildcomponent` - Build-component relationships
- `compatibility_check` - Compatibility rules
- `build_likes` - User likes on builds
- `contact_messages` - Contact form submissions
- `password_resets` - Password reset tokens

---

## Asset Files

### Images
All images are stored in `public/Images/`:
- **PC Build Showcase**: 12 images (PC (1).jpg through PC (12).jpg)
- **Logo**: pcbuild.png, PCPP.png
- **Icons**: favicon.png, controls.png
- **Animations**: bullet.gif, bx_loader.gif

---

## Documentation Files

### `README.md`
Main project documentation with:
- Feature overview
- Technology stack
- Quick start guide
- API endpoints
- Deployment instructions

### `FUNCTIONALITY_DOCUMENTATION.md`
Comprehensive feature documentation covering:
- All pages and their functionality
- User interactions
- Admin features
- System workflows

### `PROJECT_REPORT.md`
Academic project report including:
- Abstract
- System design
- Technologies used
- Code snippets
- Architecture overview

### `SOURCE_CODE_REPOSITORY.md`
This file - repository structure documentation.

---

## Git Repository Setup

### Recommended .gitignore

```gitignore
# Dependencies
node_modules/
package-lock.json

# Build outputs
dist/
build/

# Environment variables
.env
.env.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Database
*.sql.backup
```

### Repository Initialization

```bash
# Initialize git repository
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: PC Builder Platform"

# Add remote repository
git remote add origin https://github.com/yourusername/pcbuilder.git

# Push to GitHub
git push -u origin main
```

---

## Branch Structure (Recommended)

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Hotfix branches

---

## Commit Message Convention

Use conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build process or auxiliary tool changes

---

## Repository Size Considerations

- **Total Size**: ~50-100 MB (with node_modules)
- **Without node_modules**: ~5-10 MB
- **Database SQL**: ~1-5 MB (depending on seed data)

---

## Deployment Files

### Frontend Deployment
- `dist/` folder contains production build
- Can be deployed to Vercel, Netlify, or GitHub Pages

### Backend Deployment
- Requires Node.js environment
- Environment variables must be configured
- Can be deployed to Railway, Render, or Fly.io

---

## License

This project is licensed under the MIT License.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Last Updated:** [29/11/2025]  
**Repository Maintainer:** [12030477]

