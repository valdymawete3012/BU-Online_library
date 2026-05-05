@echo off
title Bugema E-Library System Startup
color 0A

echo.
echo ========================================
echo    Bugema E-Library System Startup
echo ========================================
echo.

echo [1/6] Checking system requirements...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js is available

echo.
echo [2/6] Checking MySQL connection...
mysql --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: MySQL command line not found
    echo Please ensure MySQL is installed and running
    echo.
)

echo.
echo [3/6] Installing backend dependencies...
cd backend
if not exist node_modules (
    echo Installing dependencies for first time...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed
)

echo.
echo [4/6] Checking environment configuration...
if not exist .env (
    echo Creating environment file from template...
    copy .env.example .env >nul
    echo ✅ Environment file created
    echo Please edit .env file with your MySQL credentials if needed
)

echo.
echo [5/6] Starting the E-Library server...
echo.
echo ========================================
echo 🚀 Server Information
echo ========================================
echo.
echo 📱 Server URL: http://localhost:5000
echo 🏠 Login Page: http://localhost:5000/login.html
echo 👤 Admin Dashboard: http://localhost:5000/admin/dashboard.html
echo 👥 Staff Dashboard: http://localhost:5000/staff/dashboard.html
echo 📚 Student Dashboard: http://localhost:5000/user/dashboard.html
echo 🧪 Test Page: http://localhost:5000/test_role_based_auth.html
echo.
echo ========================================
echo 🔐 Test Credentials
echo ========================================
echo.
echo 👨‍💼 Admin Account:
echo    Email: admin@bugema.ac.ug
echo    Password: admin123
echo.
echo 👩‍💼 Staff Account:
echo    Email: staff@bugema.ac.ug
echo    Password: staff123
echo.
echo 🎓 Student Account:
echo    Email: student@bugema.ac.ug
echo    Password: student123
echo.
echo ========================================
echo 📋 Database Setup (if needed)
echo ========================================
echo.
echo If you haven't set up the database yet, run these commands:
echo.
echo 1. Deploy schema:
echo    mysql -u root -p < backend/database_schema_optimized.sql
echo.
echo 2. Create sample data:
echo    mysql -u root -p bugema_elibrary < backend/create_sample_data.sql
echo.
echo ========================================
echo 🌐 System Features
echo ========================================
echo.
echo ✅ Role-based authentication (Admin/Staff/Student)
echo ✅ Automatic dashboard redirection
echo ✅ Secure password hashing
echo ✅ JWT token authentication
echo ✅ MySQL database integration
echo ✅ File upload and download
echo ✅ User management system
echo ✅ Book management system
echo ✅ Download tracking
echo ✅ Comprehensive error handling
echo.
echo ========================================
echo 🛠️ Server Status
echo ========================================
echo.

npm start

echo.
echo Server stopped. Press any key to exit...
pause >nul
