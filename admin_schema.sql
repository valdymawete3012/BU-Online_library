-- Bugema University E-Library Admin Panel Database Schema
-- Created for User Management and Book Management System

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS Downloads;
DROP TABLE IF EXISTS Books;
DROP TABLE IF EXISTS Users;

-- Create Users Table
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
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (Email),
    INDEX idx_role (Role),
    INDEX idx_status (Status)
);

-- Create Books Table
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
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_title (Title),
    INDEX idx_author (Author),
    INDEX idx_category (Category),
    INDEX idx_status (Status),
    INDEX idx_year (Year)
);

-- Create Downloads Table (for tracking user downloads)
CREATE TABLE Downloads (
    DownloadID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    BookID INT NOT NULL,
    DownloadDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    IPAddress VARCHAR(45),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE,
    INDEX idx_user_downloads (UserID),
    INDEX idx_book_downloads (BookID),
    INDEX idx_download_date (DownloadDate)
);

-- Insert default admin user (password: admin123)
INSERT INTO Users (FullName, Email, PasswordHash, Role, Status) VALUES 
('System Administrator', 'admin@bugema.ac.ug', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Active');

-- Insert sample books for testing
INSERT INTO Books (Title, Author, ISBN, Category, Year, Description) VALUES 
('Introduction to Computer Science', 'Dr. Sarah Johnson', '978-0-123456-78-9', 'Computer Science', 2020, 'A comprehensive introduction to computer science fundamentals'),
('Digital Libraries and Information Systems', 'Prof. Michael Chen', '978-0-234567-89-0', 'Information Science', 2021, 'Modern approaches to digital library management'),
('Academic Research Methods', 'Dr. Emily Williams', '978-0-345678-90-1', 'Research', 2019, 'Essential guide to academic research methodologies'),
('Web Development Fundamentals', 'James Anderson', '978-0-456789-01-2', 'Web Development', 2022, 'Complete guide to modern web development'),
('Database Management Systems', 'Dr. Robert Taylor', '978-0-567890-12-3', 'Database', 2020, 'Comprehensive database management and design');

-- Create views for admin reporting
CREATE VIEW UserStats AS 
SELECT 
    Role,
    Status,
    COUNT(*) as Count,
    DATE(DateRegistered) as RegistrationDate
FROM Users 
GROUP BY Role, Status, DATE(DateRegistered);

CREATE VIEW BookStats AS 
SELECT 
    Category,
    Status,
    COUNT(*) as Count,
    YEAR(DateAdded) as YearAdded
FROM Books 
GROUP BY Category, Status, YEAR(DateAdded);

CREATE VIEW RecentActivity AS 
SELECT 
    'User Registration' as ActivityType,
    FullName as UserName,
    DateRegistered as ActivityDate,
    Email as Details
FROM Users 
UNION ALL
SELECT 
    'Book Added' as ActivityType,
    Title as UserName,
    DateAdded as ActivityDate,
    Author as Details
FROM Books 
ORDER BY ActivityDate DESC 
LIMIT 50;
