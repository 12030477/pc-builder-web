# PC Builder - React.js Version

A comprehensive PC building platform built with React.js, Node.js, and MySQL. Build your dream PC with confidence using our interactive system builder with real-time compatibility checking.

## 🚀 Features

### Core Functionality
- **System Builder**: Interactive component selection with real-time compatibility checking
- **Build Management**: Create, edit, duplicate, and delete PC builds
- **User Authentication**: Secure login, registration, and password reset
- **Admin Dashboard**: Complete CRUD operations for components, users, and builds
- **Search & Discovery**: Browse and filter builds with advanced search capabilities
- **Contact System**: Contact form with email notifications and admin reply system
- **Responsive Design**: Mobile-friendly interface with modern dark theme

### Technical Features
- **Real-time Compatibility Checking**: Ensures all components work together
- **Component Database**: Comprehensive database with categories and specifications
- **Build Sharing**: Share builds via Web Share API & clipboard with public/private visibility
- **Build Likes**: Like and discover popular builds
- **Build Visibility**: Toggle public/private visibility for builds
- **Price Tracking**: Real-time price calculations and build cost management
- **Modern UI/UX**: Clean, intuitive interface with smooth animations

## 🛠 Technology Stack

### Frontend
- **React.js 18+** - Modern React with hooks and functional components
- **Tailwind CSS** - Utility-first CSS framework for styling
- **React Router** - Client-side routing
- **React Hook Form** - Form handling and validation
- **Axios** - HTTP client for API calls
- **React Hot Toast** - Toast notifications
- **Lucide React** - Modern icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MySQL** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **Joi** - Data validation
- **Nodemailer** - Email sending
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Database
- **MySQL** - Primary database with existing schema
- **Connection Pooling** - Optimized database connections
- **Transaction Support** - ACID compliance for data integrity

## 📁 Project Structure

```
pcbuilder/
├── src/                     # React.js frontend
│   ├── components/          # Reusable components
│   ├── pages/               # Page components
│   ├── context/             # React context providers
│   └── utils/               # Utility functions
├── public/                  # Static assets
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── config/          # Configuration files
│   │   └── app.js           # Main application file
│   └── package.json
├── pc_builder_db.sql        # Database schema
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **npm** or **yarn**

### Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pc_builder_db
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
ADMIN_EMAIL=pcbuilderassist@gmail.com
```

### Quick Steps

1. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   ```

2. **Set up database**
   - Create MySQL database: `pc_builder_db`
   - Import `pc_builder_db.sql` into your MySQL database (e.g., via MySQL Workbench, phpMyAdmin, or command line)
   - Update database credentials in `backend/.env`

3. **Start backend** (Terminal 1)
   ```bash
   cd backend && npm start
   ```

4. **Start frontend** (Terminal 2)
   ```bash
   npm start
   ```

### Access Application

- **Frontend**: http://localhost:3002 (Frontend runs on port 3002 to avoid conflicts with other local services. Can be changed in .env if needed.)
- **Backend API**: http://localhost:5000/api
- **Admin Login**: `pcbuilderassist@gmail.com` (Password: Ask admin for access)

## 📱 Pages & Features

### Core Pages
- **Home** (`/`) - Landing page with hero section and featured builds
- **About** (`/about`) - Company information, team, and mission
- **Services** (`/services`) - Features and services overview
- **Contact** (`/contact`) - Contact form and company information
- **System Builder** (`/system-builder`) - Dynamic PC building interface
- **Search Builds** (`/search-builds`) - Browse and filter community builds
- **My Builds** (`/my-builds`) - User's personal build management
- **Admin Dashboard** (`/admin`) - Administrative interface
- **Sign In/Sign Up** - User authentication
- **View Build** (`/build/:id`) - Individual build details

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - User logout

### Builds
- `GET /api/builds/search` - Search public builds
- `GET /api/builds/my` - Get user's builds
- `GET /api/builds/:id` - Get specific build
- `POST /api/builds` - Create new build
- `PUT /api/builds/:id` - Update build
- `DELETE /api/builds/:id` - Delete build
- `POST /api/builds/:id/duplicate` - Duplicate build
- `PUT /api/builds/:id/visibility` - Toggle build visibility (public/private)
- `POST /api/builds/:id/like` - Like/unlike a build
- `GET /api/builds/:id/likes` - Get build likes count

### Components
- `GET /api/components/filtered` - Get filtered components for system builder
- `GET /api/components` - Get all components
- `GET /api/components/:id` - Get specific component
- `GET /api/components/categories/list` - Get component categories
- `GET /api/components/manufacturers/list` - Get manufacturers

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/components` - Manage components
- `POST /api/admin/components` - Add component
- `PUT /api/admin/components/:id` - Update component
- `DELETE /api/admin/components/:id` - Delete component
- `GET /api/admin/users` - Manage users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/builds` - Manage builds
- `DELETE /api/admin/builds/:id` - Delete build
- `GET /api/admin/comments` - Manage comments
- `DELETE /api/admin/comments/:id` - Delete comment
- `GET /api/admin/resets` - Manage password reset requests
- `DELETE /api/admin/resets/:token` - Delete reset request

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get contact messages (admin)
- `PUT /api/contact/:id/read` - Mark message as read
- `PUT /api/contact/:id/replied` - Mark message as replied
- `DELETE /api/contact/:id` - Delete message

## 🎨 UI/UX Features

### Design System
- **Dark Theme**: Modern dark interface with blue accents
- **Responsive Design**: Mobile-first approach (Mobile: <640px, Tablet: 640px-1070px, Desktop: >1070px)
- **Component Library**: Reusable UI components
- **Animations**: Smooth transitions and hover effects
- **Typography**: Inter font family for readability

### User Experience
- **Intuitive Navigation**: Clear menu structure and breadcrumbs
- **Real-time Feedback**: Loading states and success/error messages
- **Accessibility**: WCAG compliant with keyboard navigation
- **Performance**: Optimized loading and smooth interactions

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with salt rounds
- **Input Validation**: Joi schema validation
- **Rate Limiting**: API request rate limiting
- **CORS Protection**: Cross-origin request security
- **Helmet Security**: HTTP security headers
- **SQL Injection Prevention**: Parameterized queries

## 📊 Database Schema

The application uses the existing MySQL database schema with the following main tables:
- `user` - User accounts and authentication
- `component` - PC components with specifications
- `category` - Component categories (CPU, GPU, etc.)
- `manufacturer` - Component manufacturers
- `build` - User-created PC builds
- `buildcomponent` - Build-component relationships
- `compatibility_check` - Component compatibility rules
- `contact_messages` - Contact form submissions

## 🚀 Deployment

### Frontend Deployment (Vercel)
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy automatically on push to main branch

### Backend Deployment (Railway/Render)
1. Connect your GitHub repository
2. Set build command: `cd backend && npm install`
3. Set start command: `cd backend && npm start`
4. Configure environment variables
5. Deploy

### Database
- Use your existing MySQL database
- Update connection strings in production environment

## 📝 Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use TypeScript for better type safety (optional)
- Implement proper error handling
- Write meaningful commit messages

### Git Workflow
- Use feature branches for development
- Create pull requests for code review
- Follow conventional commit format
- Maintain clean commit history

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📝 Example API Requests

### Login (curl)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Get Builds (Axios)
```javascript
const response = await axios.get('http://localhost:5000/api/builds/search', {
  params: { search: 'gaming', category: 'CPU' }
});
```

## 🚀 Deployment

This project can be deployed to various hosting platforms:

- **Frontend**: Deploy to [Vercel](https://vercel.com), [Netlify](https://netlify.com), or [GitHub Pages](https://pages.github.com)
- **Backend**: Deploy to [Railway](https://railway.app), [Render](https://render.com), or [Fly.io](https://fly.io)
- **Database**: Use [PlanetScale](https://planetscale.com) (free MySQL), Railway, or Render

**📖 See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.**

Quick deployment steps:
1. Deploy database to PlanetScale/Railway and import `pc_builder_db.sql`
2. Deploy backend to Railway/Render with environment variables
3. Deploy frontend to Vercel/Netlify
4. Update frontend API URL and backend CORS settings

## 📞 Support

For support or questions, please contact us at **pcbuilderassist@gmail.com** or create an issue in the repository.

---

**Built with ❤️ by Mantach — for PC builders everywhere.**
