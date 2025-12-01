# PC Builder Platform
## Project Report

---

**Author:** [12030477]    
**Date:** [29/11/2025]  
**Version:** 1.0.0

---

# Abstract

The PC Builder Platform is a comprehensive web application designed to assist users in building custom personal computers with confidence. The platform provides an intuitive interface for selecting PC components, real-time compatibility checking, build management, and community features for sharing and discovering PC builds.

The system is built using modern web technologies including React.js for the frontend, Node.js with Express.js for the backend API, and MySQL for data persistence. The application implements a robust authentication system, real-time component compatibility validation, and an administrative dashboard for content management.

Key features include an interactive system builder with live compatibility checking, comprehensive build search and filtering, user authentication with password recovery, build sharing capabilities, and a complete admin interface for managing components, users, and builds. The platform is fully responsive, supporting mobile, tablet, and desktop devices with an optimized user experience across all screen sizes.

The project demonstrates proficiency in full-stack web development, database design, API development, and modern React patterns including context management, custom hooks, and component composition. Security measures including JWT authentication, password hashing, input validation, and rate limiting are implemented throughout the application.

---

# 1. Introduction

## 1.1 Project Overview

The PC Builder Platform addresses the common challenge faced by PC enthusiasts when selecting compatible components for custom computer builds. The application eliminates guesswork by providing real-time compatibility checking, comprehensive component databases, and community-driven build sharing.

## 1.2 Objectives

- Provide an intuitive interface for selecting PC components
- Implement real-time compatibility checking to prevent incompatible combinations
- Enable users to save, manage, and share their PC builds
- Create a community platform for discovering and learning from other builds
- Develop an administrative interface for managing platform content
- Ensure responsive design for all device types

## 1.3 Scope

The application includes:
- User authentication and authorization
- Component selection and compatibility checking
- Build creation, editing, and management
- Build search, filtering, and discovery
- Social features (likes, sharing)
- Administrative dashboard
- Contact system with email notifications

---

# 2. System Design

## 2.1 Architecture Overview

The application follows a three-tier architecture:

```
┌─────────────────────────────────────────┐
│         Frontend (React.js)             │
│  - User Interface                        │
│  - State Management (Context API)       │
│  - Client-side Routing                   │
└──────────────┬──────────────────────────┘
               │ HTTP/REST API
┌──────────────▼──────────────────────────┐
│      Backend (Node.js/Express)          │
│  - API Endpoints                         │
│  - Business Logic                        │
│  - Authentication & Authorization       │
└──────────────┬──────────────────────────┘
               │ SQL Queries
┌──────────────▼──────────────────────────┐
│      Database (MySQL)                    │
│  - User Data                             │
│  - Components & Categories               │
│  - Builds & Relationships                │
│  - Compatibility Rules                   │
└─────────────────────────────────────────┘
```

## 2.2 Frontend Architecture

### 2.2.1 Component Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.jsx      # Navigation bar with responsive design
│   ├── ProtectedRoute.jsx  # Route protection wrapper
│   └── ScrollToTop.jsx     # Scroll restoration utility
├── context/            # React Context providers
│   ├── AuthContext.jsx     # Authentication state management
│   └── BuildContext.jsx    # Build state management
├── pages/              # Page components
│   ├── Home.jsx
│   ├── SystemBuilder.jsx
│   ├── SearchBuilds.jsx
│   ├── AdminDashboard.jsx
│   └── [other pages]
└── utils/              # Utility functions
    └── api.js          # Axios configuration
```

### 2.2.2 State Management

The application uses React Context API for global state management:

- **AuthContext**: Manages user authentication state, login, logout, and user information
- **BuildContext**: Manages selected components, compatibility status, and build operations

### 2.2.3 Routing

React Router v6 handles client-side routing with:
- Public routes (Home, About, Contact, System Builder)
- Protected routes (Search Builds, My Builds)
- Admin-only routes (Admin Dashboard)

## 2.3 Backend Architecture

### 2.3.1 API Structure

```
backend/src/
├── app.js              # Main Express application
├── config/              # Configuration files
│   ├── database.js      # MySQL connection pool
│   └── postgres.js      # PostgreSQL config (if used)
├── middleware/          # Custom middleware
│   └── auth.js          # JWT authentication middleware
└── routes/              # API route handlers
    ├── auth.js          # Authentication endpoints
    ├── builds.js        # Build management endpoints
    ├── components.js    # Component endpoints
    ├── admin.js         # Admin endpoints
    └── contact.js       # Contact form endpoints
```

### 2.3.2 Database Schema

Key tables:
- `user`: User accounts and authentication
- `component`: PC components with specifications
- `category`: Component categories (CPU, GPU, RAM, etc.)
- `manufacturer`: Component manufacturers
- `build`: User-created PC builds
- `buildcomponent`: Many-to-many relationship between builds and components
- `compatibility_check`: CPU-Motherboard-RAM compatibility rules
- `build_likes`: User likes on builds
- `contact_messages`: Contact form submissions

## 2.4 Compatibility System

The compatibility checking system works through:

1. **Component Selection**: User selects CPU, Motherboard, and RAM
2. **API Filtering**: Backend filters available components based on selected parts
3. **Database Lookup**: Queries `compatibility_check` table for valid combinations
4. **Real-time Updates**: Frontend updates compatibility status and issues as components change

---

# 3. Technologies Used

## 3.1 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| React Router DOM | 6.8.1 | Client-side routing |
| React Hook Form | 7.43.1 | Form handling and validation |
| Axios | 1.3.4 | HTTP client for API calls |
| React Hot Toast | 2.4.0 | Toast notifications |
| Lucide React | 0.263.1 | Icon library |
| Tailwind CSS | 3.2.7 | Utility-first CSS framework |
| Vite | 7.2.2 | Build tool and dev server |

## 3.2 Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 16+ | JavaScript runtime |
| Express.js | 4.18.2 | Web application framework |
| MySQL2 | 3.15.3 | MySQL database driver |
| JSON Web Token | 9.0.0 | Authentication tokens |
| Bcryptjs | 2.4.3 | Password hashing |
| Joi | 17.13.3 | Data validation |
| Nodemailer | 6.9.1 | Email sending |
| Helmet | 6.0.1 | Security headers |
| CORS | 2.8.5 | Cross-origin resource sharing |
| Express Rate Limit | 6.7.0 | API rate limiting |

## 3.3 Development Tools

- **Vite**: Fast build tool and development server
- **Nodemon**: Auto-restart backend on file changes
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## 3.4 Database

- **MySQL**: Relational database management system
- **Connection Pooling**: Optimized database connections
- **Transactions**: ACID compliance for data integrity

---

# 4. Key Code Snippets

## 4.1 Frontend - React Context (BuildContext.jsx)

```javascript
import React, { createContext, useContext, useReducer } from 'react'

const BuildContext = createContext()

const initialState = {
  selectedComponents: {},
  totalPrice: 0,
  compatibilityStatus: 'Compatible',
  compatibilityIssues: [],
  isLoading: false,
  error: null
}

const buildReducer = (state, action) => {
  switch (action.type) {
    case 'SELECT_COMPONENT':
      const newSelectedComponents = {
        ...state.selectedComponents,
        [action.payload.category]: action.payload.component
      }
      return {
        ...state,
        selectedComponents: newSelectedComponents,
        totalPrice: calculateTotalPrice(newSelectedComponents),
        isLoading: false
      }
    case 'SET_COMPATIBILITY':
      return {
        ...state,
        compatibilityStatus: action.payload.status,
        compatibilityIssues: action.payload.issues || []
      }
    // ... other cases
    default:
      return state
  }
}

export const BuildProvider = ({ children }) => {
  const [state, dispatch] = useReducer(buildReducer, initialState)
  
  const selectComponent = (category, component) => {
    dispatch({
      type: 'SELECT_COMPONENT',
      payload: { category, component }
    })
  }
  
  // ... other methods
  
  return (
    <BuildContext.Provider value={{ ...state, selectComponent, ... }}>
      {children}
    </BuildContext.Provider>
  )
}
```

## 4.2 Frontend - System Builder Component Selection

```javascript
const openComponentModal = async (componentType) => {
  setCurrentComponentType(componentType)
  setLoading(true)
  
  try {
    // Build query parameters for compatibility filtering
    const params = new URLSearchParams()
    params.append('component_type', componentType)
    
    // Include selected components for compatibility filtering
    if (selectedComponents.CPU) {
      params.append('cpu_id', selectedComponents.CPU.component_id)
    }
    if (selectedComponents.Motherboard) {
      params.append('motherboard_id', selectedComponents.Motherboard.component_id)
    }
    if (selectedComponents.RAM) {
      params.append('ram_id', selectedComponents.RAM.component_id)
    }
    
    const response = await fetch(`/api/components/filtered?${params.toString()}`)
    const data = await response.json()
    
    if (data.status === 'success' && data.components) {
      setAvailableComponents(data.components)
      setIsModalOpen(true)
    }
  } catch (error) {
    toast.error(`Error loading components: ${error.message}`)
  } finally {
    setLoading(false)
  }
}
```

## 4.3 Backend - Express Application Setup

```javascript
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const app = express()

// Security middleware
app.use(helmet())
app.use(compression())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
app.use('/api/', limiter)

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3002',
  credentials: true
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/builds', buildRoutes)
app.use('/api/components', componentRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/contact', contactRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
```

## 4.4 Backend - Build Search with Filters

```javascript
router.get('/search', async (req, res) => {
  try {
    const { 
      search, 
      sort = 'updated', 
      minPrice,
      maxPrice,
      cpuBrand,
      budget
    } = req.query
    
    let sql = `
      SELECT b.*, u.name as user_name,
             (SELECT COUNT(*) FROM build_likes bl 
              WHERE bl.build_id = b.build_id) as like_count
      FROM build b 
      JOIN user u ON b.user_id = u.user_id 
      WHERE b.is_public = 1 AND b.is_submitted = 1
    `
    const params = []

    // Add search filter
    if (search) {
      sql += ' AND (b.name LIKE ? OR u.name LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    // Add price range filter
    if (minPrice && parseFloat(minPrice) > 0) {
      sql += ' AND b.total_price >= ?'
      params.push(parseFloat(minPrice))
    }
    
    if (maxPrice && parseFloat(maxPrice) > 0) {
      sql += ' AND b.total_price <= ?'
      params.push(parseFloat(maxPrice))
    }

    // Add CPU brand filter
    if (cpuBrand) {
      sql += ` AND EXISTS (
        SELECT 1 FROM buildcomponent bc
        JOIN component c ON bc.component_id = c.component_id
        JOIN category cat ON c.category_id = cat.category_id
        JOIN manufacturer m ON c.manufacturer_id = m.manufacturer_id
        WHERE bc.build_id = b.build_id 
          AND cat.name = 'CPU'
          AND LOWER(m.name) = LOWER(?)
      )`
      params.push(cpuBrand)
    }

    // Budget filter (< $1000)
    if (budget === 'true') {
      sql += ' AND b.total_price < 1000'
    }

    // Execute query
    const [builds] = await pool.execute(sql, params)
    
    res.json({
      status: 'success',
      builds: builds
    })
  } catch (error) {
    console.error('Error searching builds:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to search builds'
    })
  }
})
```

## 4.5 Backend - JWT Authentication Middleware

```javascript
const jwt = require('jsonwebtoken')
const pool = require('../config/database')

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token required'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Verify user still exists
    const [users] = await pool.execute(
      'SELECT user_id, name, email, is_admin FROM user WHERE user_id = ?',
      [decoded.userId]
    )

    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      })
    }

    req.user = users[0]
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired'
      })
    }
    
    return res.status(403).json({
      status: 'error',
      message: 'Invalid token'
    })
  }
}

module.exports = { authenticateToken }
```

## 4.6 Frontend - API Configuration with Interceptors

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/signin'
    }
    return Promise.reject(error)
  }
)

export default api
```

## 4.7 Backend - Compatibility Checking

```javascript
// When adding/editing components, handle compatibility
const categoryName = categories[0]?.name?.toLowerCase() || ''

if (categoryName === 'cpu' && compat_motherboard.length > 0 && compat_ram.length > 0) {
  // For CPU: insert compatibility with all motherboard + RAM combinations
  for (const mbId of compat_motherboard) {
    for (const ramId of compat_ram) {
      await connection.execute(
        'INSERT INTO compatibility_check (cpu_id, motherboard_id, ram_id) VALUES (?, ?, ?)',
        [componentId, mbId, ramId]
      )
    }
  }
} else if (categoryName === 'motherboard' && compat_cpu.length > 0 && compat_ram.length > 0) {
  // For Motherboard: insert compatibility with all CPU + RAM combinations
  for (const cpuId of compat_cpu) {
    for (const ramId of compat_ram) {
      await connection.execute(
        'INSERT INTO compatibility_check (cpu_id, motherboard_id, ram_id) VALUES (?, ?, ?)',
        [cpuId, componentId, ramId]
      )
    }
  }
}
```

## 4.8 Frontend - Protected Route Component

```javascript
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
```

---

# 5. System Features

## 5.1 User Authentication
- Secure registration and login
- JWT token-based authentication
- Password reset via email
- Protected routes and admin authorization

## 5.2 System Builder
- Interactive component selection
- Real-time compatibility checking
- Price calculation
- Build saving and editing
- Guest mode with draft persistence

## 5.3 Build Management
- Create, edit, delete builds
- Toggle public/private visibility
- Duplicate builds
- Search and filter builds
- Like and share builds

## 5.4 Admin Dashboard
- User management
- Component CRUD operations
- Build management
- Contact message handling
- Password reset request management

## 5.5 Responsive Design
- Mobile-first approach
- Tablet-optimized navigation
- Desktop full-featured interface
- Adaptive layouts for all screen sizes

---

# 6. Security Implementation

## 6.1 Authentication Security
- JWT tokens with expiration
- Password hashing using bcrypt
- Token refresh mechanism
- Secure token storage

## 6.2 API Security
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- Helmet security headers
- Input validation with Joi
- SQL injection prevention (parameterized queries)

## 6.3 Data Protection
- Password hashing with salt
- Secure session management
- Environment variable configuration
- Error message sanitization

---

# 7. Database Design

## 7.1 Key Relationships

- **User → Build**: One-to-many (user can have multiple builds)
- **Build → Component**: Many-to-many (via buildcomponent table)
- **Component → Category**: Many-to-one
- **Component → Manufacturer**: Many-to-one
- **Compatibility Check**: Links CPU, Motherboard, and RAM

## 7.2 Indexing Strategy

- Primary keys on all tables
- Foreign key constraints
- Indexes on frequently queried columns (user_id, build_id, component_id)

---

# 8. Testing & Validation

## 8.1 Input Validation
- Frontend: React Hook Form validation
- Backend: Joi schema validation
- Database: Foreign key constraints

## 8.2 Error Handling
- Try-catch blocks in async functions
- Error middleware in Express
- User-friendly error messages
- Toast notifications for user feedback

---

# 9. Deployment Considerations

## 9.1 Environment Configuration
- Separate development and production environments
- Environment variables for sensitive data
- Database connection pooling
- CORS configuration for production

## 9.2 Performance Optimization
- React code splitting
- Image optimization
- Database query optimization
- Caching strategies

---

# 10. Future Enhancements

- User profiles and avatars
- Build comments and reviews
- Component comparison tool
- Price tracking and alerts
- Build export to PDF
- Advanced compatibility warnings
- Build templates and presets
- Social features (follow users, build collections)

---

# 11. Conclusion

The PC Builder Platform successfully delivers a comprehensive solution for PC building enthusiasts. The application demonstrates proficiency in modern web development practices, including React.js, Node.js, database design, and API development.

Key achievements:
- Real-time compatibility checking system
- Intuitive user interface with responsive design
- Secure authentication and authorization
- Comprehensive build management features
- Admin dashboard for content management
- Community features for build sharing

The platform provides a solid foundation for future enhancements and demonstrates best practices in full-stack web development.

---

# 12. References

- React Documentation: https://react.dev
- Express.js Documentation: https://expressjs.com
- MySQL Documentation: https://dev.mysql.com/doc
- Tailwind CSS Documentation: https://tailwindcss.com
- React Router Documentation: https://reactrouter.com

---

**End of Report**

