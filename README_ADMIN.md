# Bugema University E-Library Admin Panel

A comprehensive administrative interface for managing users and books in the Bugema University E-Library System. This system provides secure, scalable, and user-friendly tools for library administrators to manage the digital library efficiently.

## 🚀 Features

### User Management
- ✅ Complete CRUD operations (Create, Read, Update, Delete)
- ✅ User role management (Admin/Student)
- ✅ User status management (Active/Suspended)
- ✅ Advanced search and filtering capabilities
- ✅ Secure password hashing
- ✅ User activity tracking
- ✅ Bulk operations support

### Book Management
- ✅ Complete CRUD operations for books
- ✅ PDF file upload and management
- ✅ Book categorization and metadata
- ✅ Status management (Available/Restricted/Archived)
- ✅ ISBN validation and tracking
- ✅ Advanced search and filtering
- ✅ File size and type validation

### Dashboard & Analytics
- ✅ Real-time statistics
- ✅ User engagement metrics
- ✅ Download tracking
- ✅ Recent activity feed
- ✅ Visual data representation

### Security Features
- ✅ Role-based access control
- ✅ Secure authentication system
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ File upload security
- ✅ Session management

## 📋 System Requirements

### Server Requirements
- **PHP**: 7.4 or higher
- **MySQL/MariaDB**: 5.7 or higher
- **Web Server**: Apache 2.4+ or Nginx 1.18+
- **PHP Extensions**: PDO, PDO_MySQL, JSON, MBString, Fileinfo

### Client Requirements
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript**: Enabled
- **CSS**: Supported
- **Screen Resolution**: Minimum 1024x768

## 🛠️ Installation Guide

### 1. Database Setup

```sql
-- Create database
CREATE DATABASE bugema_library CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional, for security)
CREATE USER 'library_admin'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON bugema_library.* TO 'library_admin'@'localhost';
FLUSH PRIVILEGES;
```

Import the database schema:
```bash
mysql -u root -p bugema_library < admin_schema.sql
```

### 2. File Configuration

1. **Upload files to your web server:**
   - `admin_panel.html` - Main admin interface
   - `admin_panel.js` - Frontend JavaScript
   - `admin_backend.php` - Backend API
   - `admin_styles.css` - Styling
   - `admin_schema.sql` - Database schema

2. **Configure database connection:**
   Edit `admin_backend.php` and update the database constants:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'bugema_library');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   ```

3. **Set up file upload directory:**
   ```bash
   mkdir /path/to/your/project/books
   chmod 755 /path/to/your/project/books
   ```

4. **Configure security settings:**
   Update the JWT secret in `admin_backend.php`:
   ```php
   define('JWT_SECRET', 'your-very-secure-secret-key-here');
   ```

### 3. Web Server Configuration

#### Apache (.htaccess)
```apache
# Enable URL rewriting
RewriteEngine On

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# File upload limits
LimitRequestBody 10485760
php_value upload_max_filesize 10M
php_value post_max_size 10M

# Protect sensitive files
<Files "admin_backend.php">
    Require ip 127.0.0.1
    Require ip ::1
    # Add your admin IP addresses here
</Files>

<Files "*.sql">
    Require all denied
</Files>
```

#### Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/your/project;
    index admin_panel.html;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # PHP processing
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    # File upload limits
    client_max_body_size 10M;

    # Protect sensitive files
    location ~ /(admin_backend\.php|\.sql) {
        allow 127.0.0.1;
        allow ::1;
        # Add your admin IP addresses here
        deny all;
    }

    # Static files
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔧 Configuration

### Database Configuration
Edit the following constants in `admin_backend.php`:

```php
// Database settings
define('DB_HOST', 'localhost');
define('DB_NAME', 'bugema_library');
define('DB_USER', 'your_db_username');
define('DB_PASS', 'your_db_password');

// Security settings
define('JWT_SECRET', 'your-secure-jwt-secret-key');
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
define('ALLOWED_FILE_TYPES', ['application/pdf']);
```

### File Upload Settings
```php
// Maximum file size (10MB)
define('MAX_FILE_SIZE', 10 * 1024 * 1024);

// Allowed file types (PDF only)
define('ALLOWED_FILE_TYPES', ['application/pdf']);

// Upload directory
$uploadDir = __DIR__ . '/books/';
```

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(255) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Role ENUM('Admin', 'Student') NOT NULL DEFAULT 'Student',
    Status ENUM('Active', 'Suspended') NOT NULL DEFAULT 'Active',
    DateRegistered DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LastLogin DATETIME NULL,
    DownloadCount INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Books Table
```sql
CREATE TABLE Books (
    BookID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(500) NOT NULL,
    Author VARCHAR(255) NOT NULL,
    ISBN VARCHAR(20) UNIQUE,
    Category VARCHAR(100) NOT NULL,
    Year INT,
    FilePath VARCHAR(500),
    CoverImagePath VARCHAR(500),
    Status ENUM('Available', 'Restricted', 'Archived') NOT NULL DEFAULT 'Available',
    DateAdded DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FileSize BIGINT,
    Description TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Downloads Table
```sql
CREATE TABLE Downloads (
    DownloadID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    BookID INT NOT NULL,
    DownloadDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    IPAddress VARCHAR(45),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE
);
```

## 🔐 Security Implementation

### Authentication
- **Password Hashing**: Uses PHP's `password_hash()` with bcrypt algorithm
- **Session Management**: Secure token-based authentication
- **Role-Based Access**: Admin-only access to management functions

### Input Validation
- **SQL Injection Prevention**: Uses prepared statements with PDO
- **XSS Protection**: Input sanitization and output encoding
- **File Upload Security**: Type and size validation, secure file handling

### Data Protection
- **HTTPS Enforcement**: Redirects to secure connections
- **CSRF Protection**: Token-based request validation
- **Rate Limiting**: Prevents brute force attacks

## 📱 API Endpoints

### Authentication
- `POST /admin_backend.php/login` - Admin login

### User Management
- `GET /admin_backend.php/users` - Get all users
- `POST /admin_backend.php/users` - Create new user
- `PUT /admin_backend.php/users?id={id}` - Update user
- `DELETE /admin_backend.php/users?id={id}` - Delete user

### Book Management
- `GET /admin_backend.php/books` - Get all books
- `POST /admin_backend.php/books` - Create new book
- `PUT /admin_backend.php/books?id={id}` - Update book
- `DELETE /admin_backend.php/books?id={id}` - Delete book

### Dashboard
- `GET /admin_backend.php/dashboard` - Get dashboard statistics
- `GET /admin_backend.php/downloads` - Get download statistics

## 🎨 Customization

### Branding
Update the following in `admin_panel.html`:
```html
<!-- Update logo and title -->
<img src="logo.png" alt="Bugema University Logo">
<h1>Admin Panel</h1>
<p>Bugema University E-Library</p>
```

### Color Scheme
Modify CSS variables in `admin_styles.css`:
```css
:root {
    --primary-color: #003366;    /* University blue */
    --secondary-color: #FFCC00;  /* University yellow */
    --success-color: #10b981;    /* Green */
    --warning-color: #f59e0b;    /* Amber */
    --error-color: #ef4444;      /* Red */
}
```

### Features
Add new functionality by:
1. Creating new API endpoints in `admin_backend.php`
2. Adding UI components in `admin_panel.html`
3. Implementing JavaScript functions in `admin_panel.js`

## 🧪 Testing

### Manual Testing Checklist
- [ ] Login functionality works correctly
- [ ] User CRUD operations function properly
- [ ] Book CRUD operations work as expected
- [ ] File upload handles PDFs correctly
- [ ] Search and filtering functions work
- [ ] Dashboard displays accurate statistics
- [ ] Responsive design works on mobile devices
- [ ] Security measures prevent unauthorized access

### Automated Testing
```bash
# Run PHP syntax checks
php -l admin_backend.php

# Check for security vulnerabilities
# (Use tools like PHPStan, Psalm, or commercial scanners)

# Test API endpoints
curl -X POST http://your-domain.com/admin_backend.php/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bugema.ac.ug","password":"admin123"}'
```

## 🔧 Maintenance

### Regular Tasks
1. **Database Backup**: Daily automated backups
2. **Log Review**: Weekly security log analysis
3. **Software Updates**: Monthly dependency updates
4. **Performance Monitoring**: Continuous performance tracking

### Performance Optimization
```php
// Enable database query caching
$pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
$pdo->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, false);

// Implement file caching for static data
$cacheFile = __DIR__ . '/cache/stats.json';
if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < 3600) {
    return json_decode(file_get_contents($cacheFile), true);
}
```

## 📞 Support

### Troubleshooting Common Issues

#### Login Problems
- Check database connection settings
- Verify admin user exists in database
- Ensure password is correctly hashed

#### File Upload Issues
- Verify directory permissions
- Check PHP upload limits
- Ensure PDF file type validation

#### Performance Issues
- Optimize database queries
- Implement caching
- Monitor server resources

### Getting Help
1. **Documentation**: Review this README thoroughly
2. **Logs**: Check Apache/Nginx and PHP error logs
3. **Community**: Contact university IT support
4. **Developer**: Consult with system administrator

## 📄 License

This project is proprietary software owned by Bugema University. Unauthorized distribution or modification is prohibited.

## 🔄 Version History

### v1.0.0 (2024-05-03)
- Initial release
- Complete user management system
- Complete book management system
- Dashboard with analytics
- Security implementation
- Responsive design

---

**Developer**: Bugema University IT Department  
**Contact**: it@bugema.ac.ug  
**Last Updated**: May 3, 2026
