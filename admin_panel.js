// Bugema University E-Library Admin Panel JavaScript
// User Management and Book Management System

// Sample data (in production, this would come from API/database)
let users = [
    { id: 1, fullName: 'John Doe', email: 'john.doe@bugema.ac.ug', role: 'Student', status: 'Active', dateRegistered: '2024-01-15', lastLogin: '2024-05-03 10:30' },
    { id: 2, fullName: 'Jane Smith', email: 'jane.smith@bugema.ac.ug', role: 'Student', status: 'Active', dateRegistered: '2024-02-20', lastLogin: '2024-05-02 14:15' },
    { id: 3, fullName: 'Dr. Robert Johnson', email: 'robert.johnson@bugema.ac.ug', role: 'Admin', status: 'Active', dateRegistered: '2023-08-10', lastLogin: '2024-05-03 09:00' },
    { id: 4, fullName: 'Emily Wilson', email: 'emily.wilson@bugema.ac.ug', role: 'Student', status: 'Suspended', dateRegistered: '2024-03-05', lastLogin: '2024-04-28 16:45' },
    { id: 5, fullName: 'Michael Brown', email: 'michael.brown@bugema.ac.ug', role: 'Student', status: 'Active', dateRegistered: '2024-01-20', lastLogin: '2024-05-01 11:20' }
];

let books = [
    { id: 1, title: 'Introduction to Computer Science', author: 'Dr. Sarah Johnson', isbn: '978-0-123456-78-9', category: 'Computer Science', year: 2020, status: 'Available', dateAdded: '2024-01-10', description: 'A comprehensive introduction to computer science fundamentals' },
    { id: 2, title: 'Digital Libraries and Information Systems', author: 'Prof. Michael Chen', isbn: '978-0-234567-89-0', category: 'Information Science', year: 2021, status: 'Available', dateAdded: '2024-02-15', description: 'Modern approaches to digital library management' },
    { id: 3, title: 'Academic Research Methods', author: 'Dr. Emily Williams', isbn: '978-0-345678-90-1', category: 'Research', year: 2019, status: 'Restricted', dateAdded: '2024-03-20', description: 'Essential guide to academic research methodologies' },
    { id: 4, title: 'Web Development Fundamentals', author: 'James Anderson', isbn: '978-0-456789-01-2', category: 'Web Development', year: 2022, status: 'Available', dateAdded: '2024-04-05', description: 'Complete guide to modern web development' },
    { id: 5, title: 'Database Management Systems', author: 'Dr. Robert Taylor', isbn: '978-0-567890-12-3', category: 'Database', year: 2020, status: 'Archived', dateAdded: '2024-01-25', description: 'Comprehensive database management and design' }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
    loadUsers();
    loadBooks();
    setupEventListeners();
});

// Sidebar navigation
function initializeSidebar() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const pageContents = document.querySelectorAll('.page-content');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            
            // Update active state
            sidebarItems.forEach(si => si.classList.remove('bg-blue-700'));
            this.classList.add('bg-blue-700');
            
            // Show target page
            pageContents.forEach(page => page.classList.add('hidden'));
            document.getElementById(targetPage).classList.remove('hidden');
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // User form submission
    document.getElementById('userForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveUser();
    });
    
    // Book form submission
    document.getElementById('bookForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveBook();
    });
    
    // Search functionality
    document.getElementById('userSearch').addEventListener('input', filterUsers);
    document.getElementById('bookSearch').addEventListener('input', filterBooks);
    
    // Sidebar toggle for mobile
    document.getElementById('sidebarToggle').addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('-translate-x-full');
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

// User Management Functions
function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
}

function createUserRow(user) {
    const row = document.createElement('tr');
    row.className = 'table-row-hover border-b';
    row.innerHTML = `
        <td class="px-6 py-4">${user.id}</td>
        <td class="px-6 py-4 font-medium">${user.fullName}</td>
        <td class="px-6 py-4">${user.email}</td>
        <td class="px-6 py-4">
            <span class="status-badge ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
                ${user.role}
            </span>
        </td>
        <td class="px-6 py-4">
            <span class="status-badge status-${user.status.toLowerCase()}">
                ${user.status}
            </span>
        </td>
        <td class="px-6 py-4">${user.dateRegistered}</td>
        <td class="px-6 py-4">${user.lastLogin}</td>
        <td class="px-6 py-4">
            <div class="flex space-x-2">
                <button onclick="editUser(${user.id})" class="text-blue-600 hover:text-blue-800" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="toggleUserStatus(${user.id})" class="text-yellow-600 hover:text-yellow-800" title="Toggle Status">
                    <i class="fas fa-${user.status === 'Active' ? 'pause' : 'play'}"></i>
                </button>
                <button onclick="deleteUser(${user.id})" class="text-red-600 hover:text-red-800" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    return row;
}

function openUserModal(userId = null) {
    const modal = document.getElementById('userModal');
    const title = document.getElementById('userModalTitle');
    const form = document.getElementById('userForm');
    
    form.reset();
    
    if (userId) {
        const user = users.find(u => u.id === userId);
        title.textContent = 'Edit User';
        document.getElementById('userId').value = user.id;
        document.getElementById('fullName').value = user.fullName;
        document.getElementById('email').value = user.email;
        document.getElementById('role').value = user.role;
        document.getElementById('userStatus').value = user.status;
        document.getElementById('password').value = ''; // Don't populate password for security
    } else {
        title.textContent = 'Add New User';
        document.getElementById('userId').value = '';
    }
    
    modal.classList.add('active');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

function saveUser() {
    const userId = document.getElementById('userId').value;
    const userData = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value,
        status: document.getElementById('userStatus').value
    };
    
    if (userId) {
        // Update existing user
        const userIndex = users.findIndex(u => u.id == userId);
        users[userIndex] = { ...users[userIndex], ...userData };
        showNotification('User updated successfully', 'success');
    } else {
        // Add new user
        const newUser = {
            id: Math.max(...users.map(u => u.id)) + 1,
            ...userData,
            dateRegistered: new Date().toISOString().split('T')[0],
            lastLogin: null
        };
        users.push(newUser);
        showNotification('User added successfully', 'success');
    }
    
    loadUsers();
    closeUserModal();
}

function editUser(userId) {
    openUserModal(userId);
}

function toggleUserStatus(userId) {
    const user = users.find(u => u.id === userId);
    user.status = user.status === 'Active' ? 'Suspended' : 'Active';
    loadUsers();
    showNotification(`User ${user.status.toLowerCase()} successfully`, 'success');
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        users = users.filter(u => u.id !== userId);
        loadUsers();
        showNotification('User deleted successfully', 'success');
    }
}

function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const roleFilter = document.getElementById('roleFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.fullName.toLowerCase().includes(searchTerm) || 
                           user.email.toLowerCase().includes(searchTerm);
        const matchesRole = !roleFilter || user.role === roleFilter;
        const matchesStatus = !statusFilter || user.status === statusFilter;
        
        return matchesSearch && matchesRole && matchesStatus;
    });
    
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    filteredUsers.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
}

// Book Management Functions
function loadBooks() {
    const tbody = document.getElementById('booksTableBody');
    tbody.innerHTML = '';
    
    books.forEach(book => {
        const row = createBookRow(book);
        tbody.appendChild(row);
    });
}

function createBookRow(book) {
    const row = document.createElement('tr');
    row.className = 'table-row-hover border-b';
    row.innerHTML = `
        <td class="px-6 py-4">${book.id}</td>
        <td class="px-6 py-4 font-medium">${book.title}</td>
        <td class="px-6 py-4">${book.author}</td>
        <td class="px-6 py-4">${book.isbn || 'N/A'}</td>
        <td class="px-6 py-4">
            <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">
                ${book.category}
            </span>
        </td>
        <td class="px-6 py-4">${book.year || 'N/A'}</td>
        <td class="px-6 py-4">
            <span class="status-badge status-${book.status.toLowerCase()}">
                ${book.status}
            </span>
        </td>
        <td class="px-6 py-4">${book.dateAdded}</td>
        <td class="px-6 py-4">
            <div class="flex space-x-2">
                <button onclick="editBook(${book.id})" class="text-blue-600 hover:text-blue-800" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="viewBook(${book.id})" class="text-green-600 hover:text-green-800" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="deleteBook(${book.id})" class="text-red-600 hover:text-red-800" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    return row;
}

function openBookModal(bookId = null) {
    const modal = document.getElementById('bookModal');
    const title = document.getElementById('bookModalTitle');
    const form = document.getElementById('bookForm');
    
    form.reset();
    
    if (bookId) {
        const book = books.find(b => b.id === bookId);
        title.textContent = 'Edit Book';
        document.getElementById('bookId').value = book.id;
        document.getElementById('title').value = book.title;
        document.getElementById('author').value = book.author;
        document.getElementById('isbn').value = book.isbn || '';
        document.getElementById('category').value = book.category;
        document.getElementById('year').value = book.year || '';
        document.getElementById('description').value = book.description || '';
        document.getElementById('bookStatus').value = book.status;
    } else {
        title.textContent = 'Add New Book';
        document.getElementById('bookId').value = '';
    }
    
    modal.classList.add('active');
}

function closeBookModal() {
    document.getElementById('bookModal').classList.remove('active');
}

function saveBook() {
    const bookId = document.getElementById('bookId').value;
    const bookData = {
        title: document.getElementById('title').value,
        author: document.getElementById('author').value,
        isbn: document.getElementById('isbn').value,
        category: document.getElementById('category').value,
        year: document.getElementById('year').value,
        description: document.getElementById('description').value,
        status: document.getElementById('bookStatus').value
    };
    
    // Handle file upload (in production, this would be handled by server)
    const pdfFile = document.getElementById('pdfFile').files[0];
    if (pdfFile) {
        // Validate file
        if (pdfFile.type !== 'application/pdf') {
            showNotification('Please upload a PDF file only', 'error');
            return;
        }
        if (pdfFile.size > 10 * 1024 * 1024) { // 10MB limit
            showNotification('File size must be less than 10MB', 'error');
            return;
        }
        bookData.filePath = `/books/${pdfFile.name}`;
    }
    
    if (bookId) {
        // Update existing book
        const bookIndex = books.findIndex(b => b.id == bookId);
        books[bookIndex] = { ...books[bookIndex], ...bookData };
        showNotification('Book updated successfully', 'success');
    } else {
        // Add new book
        const newBook = {
            id: Math.max(...books.map(b => b.id)) + 1,
            ...bookData,
            dateAdded: new Date().toISOString().split('T')[0]
        };
        books.push(newBook);
        showNotification('Book added successfully', 'success');
    }
    
    loadBooks();
    closeBookModal();
}

function editBook(bookId) {
    openBookModal(bookId);
}

function viewBook(bookId) {
    const book = books.find(b => b.id === bookId);
    showNotification(`Viewing: ${book.title}`, 'info');
    // In production, this would open the book viewer or download page
}

function deleteBook(bookId) {
    if (confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
        books = books.filter(b => b.id !== bookId);
        loadBooks();
        showNotification('Book deleted successfully', 'success');
    }
}

function filterBooks() {
    const searchTerm = document.getElementById('bookSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('bookStatusFilter').value;
    
    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) || 
                           book.author.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || book.category === categoryFilter;
        const matchesStatus = !statusFilter || book.status === statusFilter;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    const tbody = document.getElementById('booksTableBody');
    tbody.innerHTML = '';
    
    filteredBooks.forEach(book => {
        const row = createBookRow(book);
        tbody.appendChild(row);
    });
}

// Utility Functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 fade-in ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'warning' ? 'bg-yellow-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${
                type === 'success' ? 'check-circle' :
                type === 'error' ? 'exclamation-circle' :
                type === 'warning' ? 'exclamation-triangle' :
                'info-circle'
            } mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Password hashing function (in production, use bcrypt or similar)
function hashPassword(password) {
    // This is a simple hash for demonstration
    // In production, use a proper hashing library like bcrypt
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
}

// Form validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateISBN(isbn) {
    // Basic ISBN validation
    const isbnRegex = /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/;
    return !isbn || isbnRegex.test(isbn);
}

// Export functions for potential use by other scripts
window.adminPanel = {
    loadUsers,
    loadBooks,
    openUserModal,
    openBookModal,
    showNotification
};
