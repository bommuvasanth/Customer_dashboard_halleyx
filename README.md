# Halleyx Dashboard - Full Stack Engineer Challenge

A modern, full-stack dashboard application built with React and FastAPI, featuring role-based authentication, order management, and configurable analytics widgets.

## 🚀 Features

- **Authentication System**: JWT-based login with role-based access control
- **Dashboard Analytics**: Configurable widgets with drag-and-drop functionality
- **Order Management**: Complete CRUD operations for customer orders
- **Real-time Data**: Live statistics and interactive charts
- **Responsive Design**: Modern UI with Tailwind CSS and glassmorphism effects
- **Role-Based Access**: Separate interfaces for Admin and Customer users

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework**: React 19 with Vite build tool
- **Styling**: Tailwind CSS with custom animations
- **Routing**: React Router DOM with protected routes
- **Charts**: Recharts for data visualization
- **Layout**: React Grid Layout for drag-and-drop widgets
- **HTTP Client**: Axios with request interceptors

### Backend (FastAPI + Python)
- **Framework**: FastAPI with async/await support
- **Database**: MongoDB with Motor async driver
- **Authentication**: JWT tokens with bcrypt password hashing
- **API**: RESTful endpoints with Pydantic validation
- **CORS**: Configured for cross-origin requests

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- MongoDB (local or cloud)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173 (or 5174 if 5173 is busy)
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔐 Demo Credentials

### Admin User
- **Email**: admin1804@gmail.com
- **Password**: admin254
- **Access**: Full analytics, dashboard configuration, order management

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication

### Orders Management
- `GET /api/orders` - Fetch orders with date filtering
- `POST /api/orders` - Create new order
- `PUT /api/orders/{id}` - Update existing order
- `DELETE /api/orders/{id}` - Delete order

### Dashboard Configuration
- `GET /api/dashboard/widgets` - Get saved dashboard configuration
- `POST /api/dashboard/save` - Save dashboard widget configuration

## 🎯 Key Components

### Frontend Pages
- **LoginPage**: Authentication with gradient design
- **DashboardPage**: Main dashboard hub with KPI widgets
- **AdminDashboard**: Advanced analytics and order management
- **CustomerDashboard**: Customer-focused order interface
- **DashboardConfigPage**: Drag-and-drop widget configuration
- **CustomerForm**: Order creation interface

### Backend Features
- **JWT Authentication**: Secure token-based authentication
- **Password Security**: bcrypt hashing with salt
- **Data Validation**: Pydantic schemas for request/response
- **Auto-seeding**: Sample users and orders on startup
- **Error Handling**: Comprehensive error responses

## 🎨 UI/UX Features

- **Glassmorphism Design**: Modern backdrop blur effects
- **Gradient Backgrounds**: Dynamic color schemes
- **Smooth Animations**: CSS transitions and hover effects
- **Responsive Layout**: Mobile-first design approach
- **Interactive Charts**: Real-time data visualization
- **Drag & Drop**: Widget placement and configuration

## 🔧 Development

### Project Structure
```
halleyx-dashboard/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── services/       # API client
│   │   └── App.jsx         # Main application
│   └── package.json
├── backend/                 # FastAPI application
│   ├── main.py             # FastAPI app and endpoints
│   ├── database.py         # MongoDB connection
│   └── requirements.txt
└── README.md
```

### Available Scripts

#### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

#### Backend
```bash
python main.py                    # Start server directly
uvicorn main:app --reload        # Start with auto-reload
```

## 🔒 Security Features

- **JWT Tokens**: 24-hour expiration with secure secret
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Pydantic schema validation
- **CORS Configuration**: Controlled cross-origin access
- **Protected Routes**: Client-side route guards

## 📈 Performance Optimizations

- **Code Splitting**: Lazy loading of components
- **API Caching**: Request response caching
- **Image Optimization**: Compressed assets
- **Bundle Optimization**: Vite build optimizations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
 Implements industry-standard security measures
