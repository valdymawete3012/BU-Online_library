<?php
/**
 * Bugema University E-Library Admin Panel Backend
 * User Management and Book Management API
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'bugema_library');
define('DB_USER', 'root');
define('DB_PASS', '');

// Security configurations
define('JWT_SECRET', 'your-secret-key-here');
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
define('ALLOWED_FILE_TYPES', ['application/pdf']);

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database connection
class Database {
    private $conn;
    
    public function __construct() {
        try {
            $this->conn = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME,
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            $this->sendError('Database connection failed: ' . $e->getMessage());
        }
    }
    
    public function getConnection() {
        return $this->conn;
    }
    
    public function sendError($message, $code = 500) {
        http_response_code($code);
        echo json_encode(['error' => $message]);
        exit;
    }
    
    public function sendResponse($data, $code = 200) {
        http_response_code($code);
        echo json_encode($data);
        exit;
    }
}

// Authentication class
class Auth {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    public function authenticate() {
        $headers = getallheaders();
        $token = null;
        
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            $token = str_replace('Bearer ', '', $authHeader);
        }
        
        if (!$token) {
            $this->db->sendError('Authentication required', 401);
        }
        
        // Simple token validation (in production, use JWT)
        $stmt = $this->db->getConnection()->prepare("
            SELECT u.* FROM Users u 
            WHERE u.Role = 'Admin' AND u.Status = 'Active'
        ");
        $stmt->execute();
        $admin = $stmt->fetch();
        
        if (!$admin) {
            $this->db->sendError('Invalid authentication', 401);
        }
        
        return $admin;
    }
    
    public function hashPassword($password) {
        return password_hash($password, PASSWORD_DEFAULT);
    }
    
    public function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
}

// User Management Class
class UserManager {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    public function getAllUsers($filters = []) {
        $sql = "SELECT * FROM Users WHERE 1=1";
        $params = [];
        
        if (!empty($filters['search'])) {
            $sql .= " AND (FullName LIKE ? OR Email LIKE ?)";
            $params[] = '%' . $filters['search'] . '%';
            $params[] = '%' . $filters['search'] . '%';
        }
        
        if (!empty($filters['role'])) {
            $sql .= " AND Role = ?";
            $params[] = $filters['role'];
        }
        
        if (!empty($filters['status'])) {
            $sql .= " AND Status = ?";
            $params[] = $filters['status'];
        }
        
        $sql .= " ORDER BY DateRegistered DESC";
        
        try {
            $stmt = $this->db->getConnection()->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            $this->db->sendError('Failed to fetch users: ' . $e->getMessage());
        }
    }
    
    public function getUserById($id) {
        $stmt = $this->db->getConnection()->prepare("
            SELECT * FROM Users WHERE UserID = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    public function createUser($data) {
        // Validate required fields
        $required = ['FullName', 'Email', 'Password', 'Role', 'Status'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $this->db->sendError("Field '$field' is required");
            }
        }
        
        // Validate email
        if (!filter_var($data['Email'], FILTER_VALIDATE_EMAIL)) {
            $this->db->sendError('Invalid email format');
        }
        
        // Check if email already exists
        $stmt = $this->db->getConnection()->prepare("
            SELECT UserID FROM Users WHERE Email = ?
        ");
        $stmt->execute([$data['Email']]);
        if ($stmt->fetch()) {
            $this->db->sendError('Email already exists');
        }
        
        // Hash password
        $auth = new Auth($this->db);
        $hashedPassword = $auth->hashPassword($data['Password']);
        
        try {
            $stmt = $this->db->getConnection()->prepare("
                INSERT INTO Users (FullName, Email, PasswordHash, Role, Status, DateRegistered)
                VALUES (?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $data['FullName'],
                $data['Email'],
                $hashedPassword,
                $data['Role'],
                $data['Status']
            ]);
            
            return ['success' => true, 'UserID' => $this->db->getConnection()->lastInsertId()];
        } catch (PDOException $e) {
            $this->db->sendError('Failed to create user: ' . $e->getMessage());
        }
    }
    
    public function updateUser($id, $data) {
        $user = $this->getUserById($id);
        if (!$user) {
            $this->db->sendError('User not found', 404);
        }
        
        $sql = "UPDATE Users SET ";
        $updates = [];
        $params = [];
        
        if (isset($data['FullName'])) {
            $updates[] = "FullName = ?";
            $params[] = $data['FullName'];
        }
        
        if (isset($data['Email'])) {
            if (!filter_var($data['Email'], FILTER_VALIDATE_EMAIL)) {
                $this->db->sendError('Invalid email format');
            }
            
            // Check if email already exists (excluding current user)
            $stmt = $this->db->getConnection()->prepare("
                SELECT UserID FROM Users WHERE Email = ? AND UserID != ?
            ");
            $stmt->execute([$data['Email'], $id]);
            if ($stmt->fetch()) {
                $this->db->sendError('Email already exists');
            }
            
            $updates[] = "Email = ?";
            $params[] = $data['Email'];
        }
        
        if (isset($data['Role'])) {
            $updates[] = "Role = ?";
            $params[] = $data['Role'];
        }
        
        if (isset($data['Status'])) {
            $updates[] = "Status = ?";
            $params[] = $data['Status'];
        }
        
        if (isset($data['Password']) && !empty($data['Password'])) {
            $auth = new Auth($this->db);
            $updates[] = "PasswordHash = ?";
            $params[] = $auth->hashPassword($data['Password']);
        }
        
        if (empty($updates)) {
            $this->db->sendError('No valid fields to update');
        }
        
        $sql .= implode(', ', $updates) . " WHERE UserID = ?";
        $params[] = $id;
        
        try {
            $stmt = $this->db->getConnection()->prepare($sql);
            $stmt->execute($params);
            return ['success' => true];
        } catch (PDOException $e) {
            $this->db->sendError('Failed to update user: ' . $e->getMessage());
        }
    }
    
    public function deleteUser($id) {
        $user = $this->getUserById($id);
        if (!$user) {
            $this->db->sendError('User not found', 404);
        }
        
        // Prevent deletion of the last admin
        if ($user['Role'] === 'Admin') {
            $stmt = $this->db->getConnection()->prepare("
                SELECT COUNT(*) as count FROM Users WHERE Role = 'Admin' AND Status = 'Active'
            ");
            $stmt->execute();
            $adminCount = $stmt->fetch()['count'];
            
            if ($adminCount <= 1) {
                $this->db->sendError('Cannot delete the last admin user');
            }
        }
        
        try {
            $stmt = $this->db->getConnection()->prepare("
                DELETE FROM Users WHERE UserID = ?
            ");
            $stmt->execute([$id]);
            return ['success' => true];
        } catch (PDOException $e) {
            $this->db->sendError('Failed to delete user: ' . $e->getMessage());
        }
    }
    
    public function getUserStats() {
        $stats = [];
        
        // Total users
        $stmt = $this->db->getConnection()->prepare("SELECT COUNT(*) as total FROM Users");
        $stmt->execute();
        $stats['total'] = $stmt->fetch()['total'];
        
        // Active users
        $stmt = $this->db->getConnection()->prepare("SELECT COUNT(*) as active FROM Users WHERE Status = 'Active'");
        $stmt->execute();
        $stats['active'] = $stmt->fetch()['active'];
        
        // Suspended users
        $stmt = $this->db->getConnection()->prepare("SELECT COUNT(*) as suspended FROM Users WHERE Status = 'Suspended'");
        $stmt->execute();
        $stats['suspended'] = $stmt->fetch()['suspended'];
        
        // Admin users
        $stmt = $this->db->getConnection()->prepare("SELECT COUNT(*) as admins FROM Users WHERE Role = 'Admin'");
        $stmt->execute();
        $stats['admins'] = $stmt->fetch()['admins'];
        
        // Student users
        $stmt = $this->db->getConnection()->prepare("SELECT COUNT(*) as students FROM Users WHERE Role = 'Student'");
        $stmt->execute();
        $stats['students'] = $stmt->fetch()['students'];
        
        return $stats;
    }
}

// Book Management Class
class BookManager {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    public function getAllBooks($filters = []) {
        $sql = "SELECT * FROM Books WHERE 1=1";
        $params = [];
        
        if (!empty($filters['search'])) {
            $sql .= " AND (Title LIKE ? OR Author LIKE ?)";
            $params[] = '%' . $filters['search'] . '%';
            $params[] = '%' . $filters['search'] . '%';
        }
        
        if (!empty($filters['category'])) {
            $sql .= " AND Category = ?";
            $params[] = $filters['category'];
        }
        
        if (!empty($filters['status'])) {
            $sql .= " AND Status = ?";
            $params[] = $filters['status'];
        }
        
        if (!empty($filters['year'])) {
            $sql .= " AND Year = ?";
            $params[] = $filters['year'];
        }
        
        $sql .= " ORDER BY DateAdded DESC";
        
        try {
            $stmt = $this->db->getConnection()->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            $this->db->sendError('Failed to fetch books: ' . $e->getMessage());
        }
    }
    
    public function getBookById($id) {
        $stmt = $this->db->getConnection()->prepare("
            SELECT * FROM Books WHERE BookID = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    public function createBook($data, $file = null) {
        // Validate required fields
        $required = ['Title', 'Author', 'Category', 'Status'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $this->db->sendError("Field '$field' is required");
            }
        }
        
        // Validate ISBN if provided
        if (!empty($data['ISBN']) && !$this->validateISBN($data['ISBN'])) {
            $this->db->sendError('Invalid ISBN format');
        }
        
        // Check if ISBN already exists
        if (!empty($data['ISBN'])) {
            $stmt = $this->db->getConnection()->prepare("
                SELECT BookID FROM Books WHERE ISBN = ?
            ");
            $stmt->execute([$data['ISBN']]);
            if ($stmt->fetch()) {
                $this->db->sendError('ISBN already exists');
            }
        }
        
        // Handle file upload
        $filePath = null;
        $fileSize = 0;
        if ($file && $file['error'] === UPLOAD_ERR_OK) {
            $filePath = $this->handleFileUpload($file);
            $fileSize = $file['size'];
        }
        
        try {
            $stmt = $this->db->getConnection()->prepare("
                INSERT INTO Books (Title, Author, ISBN, Category, Year, FilePath, FileSize, Description, Status, DateAdded)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $data['Title'],
                $data['Author'],
                $data['ISBN'] ?? null,
                $data['Category'],
                $data['Year'] ?? null,
                $filePath,
                $fileSize,
                $data['Description'] ?? null,
                $data['Status']
            ]);
            
            return ['success' => true, 'BookID' => $this->db->getConnection()->lastInsertId()];
        } catch (PDOException $e) {
            $this->db->sendError('Failed to create book: ' . $e->getMessage());
        }
    }
    
    public function updateBook($id, $data, $file = null) {
        $book = $this->getBookById($id);
        if (!$book) {
            $this->db->sendError('Book not found', 404);
        }
        
        $sql = "UPDATE Books SET ";
        $updates = [];
        $params = [];
        
        if (isset($data['Title'])) {
            $updates[] = "Title = ?";
            $params[] = $data['Title'];
        }
        
        if (isset($data['Author'])) {
            $updates[] = "Author = ?";
            $params[] = $data['Author'];
        }
        
        if (isset($data['ISBN'])) {
            if (!empty($data['ISBN']) && !$this->validateISBN($data['ISBN'])) {
                $this->db->sendError('Invalid ISBN format');
            }
            
            // Check if ISBN already exists (excluding current book)
            if (!empty($data['ISBN'])) {
                $stmt = $this->db->getConnection()->prepare("
                    SELECT BookID FROM Books WHERE ISBN = ? AND BookID != ?
                ");
                $stmt->execute([$data['ISBN'], $id]);
                if ($stmt->fetch()) {
                    $this->db->sendError('ISBN already exists');
                }
            }
            
            $updates[] = "ISBN = ?";
            $params[] = $data['ISBN'] ?? null;
        }
        
        if (isset($data['Category'])) {
            $updates[] = "Category = ?";
            $params[] = $data['Category'];
        }
        
        if (isset($data['Year'])) {
            $updates[] = "Year = ?";
            $params[] = $data['Year'];
        }
        
        if (isset($data['Description'])) {
            $updates[] = "Description = ?";
            $params[] = $data['Description'];
        }
        
        if (isset($data['Status'])) {
            $updates[] = "Status = ?";
            $params[] = $data['Status'];
        }
        
        // Handle file upload
        if ($file && $file['error'] === UPLOAD_ERR_OK) {
            $filePath = $this->handleFileUpload($file);
            $updates[] = "FilePath = ?";
            $params[] = $filePath;
            $updates[] = "FileSize = ?";
            $params[] = $file['size'];
        }
        
        if (empty($updates)) {
            $this->db->sendError('No valid fields to update');
        }
        
        $sql .= implode(', ', $updates) . " WHERE BookID = ?";
        $params[] = $id;
        
        try {
            $stmt = $this->db->getConnection()->prepare($sql);
            $stmt->execute($params);
            return ['success' => true];
        } catch (PDOException $e) {
            $this->db->sendError('Failed to update book: ' . $e->getMessage());
        }
    }
    
    public function deleteBook($id) {
        $book = $this->getBookById($id);
        if (!$book) {
            $this->db->sendError('Book not found', 404);
        }
        
        // Delete file if exists
        if ($book['FilePath'] && file_exists($book['FilePath'])) {
            unlink($book['FilePath']);
        }
        
        try {
            $stmt = $this->db->getConnection()->prepare("
                DELETE FROM Books WHERE BookID = ?
            ");
            $stmt->execute([$id]);
            return ['success' => true];
        } catch (PDOException $e) {
            $this->db->sendError('Failed to delete book: ' . $e->getMessage());
        }
    }
    
    public function getBookStats() {
        $stats = [];
        
        // Total books
        $stmt = $this->db->getConnection()->prepare("SELECT COUNT(*) as total FROM Books");
        $stmt->execute();
        $stats['total'] = $stmt->fetch()['total'];
        
        // Available books
        $stmt = $this->db->getConnection()->prepare("SELECT COUNT(*) as available FROM Books WHERE Status = 'Available'");
        $stmt->execute();
        $stats['available'] = $stmt->fetch()['available'];
        
        // Restricted books
        $stmt = $this->db->getConnection()->prepare("SELECT COUNT(*) as restricted FROM Books WHERE Status = 'Restricted'");
        $stmt->execute();
        $stats['restricted'] = $stmt->fetch()['restricted'];
        
        // Archived books
        $stmt = $this->db->getConnection()->prepare("SELECT COUNT(*) as archived FROM Books WHERE Status = 'Archived'");
        $stmt->execute();
        $stats['archived'] = $stmt->fetch()['archived'];
        
        return $stats;
    }
    
    private function handleFileUpload($file) {
        // Validate file type
        if (!in_array($file['type'], ALLOWED_FILE_TYPES)) {
            $this->db->sendError('Only PDF files are allowed');
        }
        
        // Validate file size
        if ($file['size'] > MAX_FILE_SIZE) {
            $this->db->sendError('File size must be less than 10MB');
        }
        
        // Create upload directory if it doesn't exist
        $uploadDir = __DIR__ . '/books/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Generate unique filename
        $filename = uniqid('book_') . '_' . basename($file['name']);
        $filepath = $uploadDir . $filename;
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            $this->db->sendError('Failed to upload file');
        }
        
        return $filepath;
    }
    
    private function validateISBN($isbn) {
        // Remove hyphens and spaces
        $isbn = str_replace(['-', ' '], '', $isbn);
        
        // Check length
        if (strlen($isbn) !== 10 && strlen($isbn) !== 13) {
            return false;
        }
        
        // Basic format check
        return preg_match('/^[0-9X]+$/', $isbn);
    }
}

// Downloads Management Class
class DownloadManager {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    public function recordDownload($userId, $bookId, $ipAddress = null) {
        try {
            $stmt = $this->db->getConnection()->prepare("
                INSERT INTO Downloads (UserID, BookID, IPAddress, DownloadDate)
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([$userId, $bookId, $ipAddress]);
            
            // Update user download count
            $stmt = $this->db->getConnection()->prepare("
                UPDATE Users SET DownloadCount = DownloadCount + 1 WHERE UserID = ?
            ");
            $stmt->execute([$userId]);
            
            return ['success' => true];
        } catch (PDOException $e) {
            $this->db->sendError('Failed to record download: ' . $e->getMessage());
        }
    }
    
    public function getDownloadStats() {
        $stats = [];
        
        // Total downloads
        $stmt = $this->db->getConnection()->prepare("SELECT COUNT(*) as total FROM Downloads");
        $stmt->execute();
        $stats['total'] = $stmt->fetch()['total'];
        
        // Downloads this month
        $stmt = $this->db->getConnection()->prepare("
            SELECT COUNT(*) as this_month FROM Downloads 
            WHERE MONTH(DownloadDate) = MONTH(CURRENT_DATE()) 
            AND YEAR(DownloadDate) = YEAR(CURRENT_DATE())
        ");
        $stmt->execute();
        $stats['this_month'] = $stmt->fetch()['this_month'];
        
        // Most downloaded books
        $stmt = $this->db->getConnection()->prepare("
            SELECT b.Title, b.Author, COUNT(d.DownloadID) as download_count
            FROM Downloads d
            JOIN Books b ON d.BookID = b.BookID
            GROUP BY d.BookID
            ORDER BY download_count DESC
            LIMIT 10
        ");
        $stmt->execute();
        $stats['most_downloaded'] = $stmt->fetchAll();
        
        return $stats;
    }
}

// Main API Router
class ApiRouter {
    private $db;
    private $auth;
    private $userManager;
    private $bookManager;
    private $downloadManager;
    
    public function __construct() {
        $this->db = new Database();
        $this->auth = new Auth($this->db);
        $this->userManager = new UserManager($this->db);
        $this->bookManager = new BookManager($this->db);
        $this->downloadManager = new DownloadManager($this->db);
    }
    
    public function route() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $pathParts = explode('/', trim($path, '/'));
        
        // Get the endpoint (last part of path)
        $endpoint = end($pathParts);
        
        try {
            switch ($endpoint) {
                case 'login':
                    $this->handleLogin();
                    break;
                    
                case 'users':
                    $this->auth->authenticate();
                    $this->handleUsers($method);
                    break;
                    
                case 'books':
                    $this->auth->authenticate();
                    $this->handleBooks($method);
                    break;
                    
                case 'downloads':
                    $this->auth->authenticate();
                    $this->handleDownloads($method);
                    break;
                    
                case 'dashboard':
                    $this->auth->authenticate();
                    $this->handleDashboard();
                    break;
                    
                default:
                    $this->db->sendError('Endpoint not found', 404);
            }
        } catch (Exception $e) {
            $this->db->sendError('Internal server error: ' . $e->getMessage());
        }
    }
    
    private function handleLogin() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->db->sendError('Method not allowed', 405);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['email']) || empty($data['password'])) {
            $this->db->sendError('Email and password are required');
        }
        
        $stmt = $this->db->getConnection()->prepare("
            SELECT * FROM Users WHERE Email = ? AND Role = 'Admin' AND Status = 'Active'
        ");
        $stmt->execute([$data['email']]);
        $user = $stmt->fetch();
        
        if (!$user || !$this->auth->verifyPassword($data['password'], $user['PasswordHash'])) {
            $this->db->sendError('Invalid credentials', 401);
        }
        
        // Update last login
        $stmt = $this->db->getConnection()->prepare("
            UPDATE Users SET LastLogin = NOW() WHERE UserID = ?
        ");
        $stmt->execute([$user['UserID']]);
        
        // Generate simple token (in production, use JWT)
        $token = base64_encode($user['UserID'] . ':' . time());
        
        $this->db->sendResponse([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user['UserID'],
                'name' => $user['FullName'],
                'email' => $user['Email'],
                'role' => $user['Role']
            ]
        ]);
    }
    
    private function handleUsers($method) {
        switch ($method) {
            case 'GET':
                $filters = [
                    'search' => $_GET['search'] ?? '',
                    'role' => $_GET['role'] ?? '',
                    'status' => $_GET['status'] ?? ''
                ];
                $users = $this->userManager->getAllUsers($filters);
                $this->db->sendResponse($users);
                break;
                
            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $result = $this->userManager->createUser($data);
                $this->db->sendResponse($result);
                break;
                
            case 'PUT':
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    $this->db->sendError('User ID is required');
                }
                $data = json_decode(file_get_contents('php://input'), true);
                $result = $this->userManager->updateUser($id, $data);
                $this->db->sendResponse($result);
                break;
                
            case 'DELETE':
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    $this->db->sendError('User ID is required');
                }
                $result = $this->userManager->deleteUser($id);
                $this->db->sendResponse($result);
                break;
                
            default:
                $this->db->sendError('Method not allowed', 405);
        }
    }
    
    private function handleBooks($method) {
        switch ($method) {
            case 'GET':
                $filters = [
                    'search' => $_GET['search'] ?? '',
                    'category' => $_GET['category'] ?? '',
                    'status' => $_GET['status'] ?? '',
                    'year' => $_GET['year'] ?? ''
                ];
                $books = $this->bookManager->getAllBooks($filters);
                $this->db->sendResponse($books);
                break;
                
            case 'POST':
                $data = $_POST;
                $file = $_FILES['pdfFile'] ?? null;
                $result = $this->bookManager->createBook($data, $file);
                $this->db->sendResponse($result);
                break;
                
            case 'PUT':
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    $this->db->sendError('Book ID is required');
                }
                $data = $_POST;
                $file = $_FILES['pdfFile'] ?? null;
                $result = $this->bookManager->updateBook($id, $data, $file);
                $this->db->sendResponse($result);
                break;
                
            case 'DELETE':
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    $this->db->sendError('Book ID is required');
                }
                $result = $this->bookManager->deleteBook($id);
                $this->db->sendResponse($result);
                break;
                
            default:
                $this->db->sendError('Method not allowed', 405);
        }
    }
    
    private function handleDownloads($method) {
        if ($method !== 'GET') {
            $this->db->sendError('Method not allowed', 405);
        }
        
        $stats = $this->downloadManager->getDownloadStats();
        $this->db->sendResponse($stats);
    }
    
    private function handleDashboard() {
        $stats = [
            'users' => $this->userManager->getUserStats(),
            'books' => $this->bookManager->getBookStats(),
            'downloads' => $this->downloadManager->getDownloadStats()
        ];
        
        $this->db->sendResponse($stats);
    }
}

// Initialize and route the API
$router = new ApiRouter();
$router->route();
?>
