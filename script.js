const API_URL = 'https://librarymanagementbackend-production.up.railway.app/api';
let token = localStorage.getItem('token');
let userRole = localStorage.getItem('userRole');

// DOM Elements
const authSection = document.getElementById('auth-section');
const memberSection = document.getElementById('member-section');
const librarianSection = document.getElementById('librarian-section');
const authForm = document.getElementById('auth-form');
const authButton = document.getElementById('auth-button');
const switchAuthButton = document.getElementById('switch-auth');
const deleteAccountButton = document.getElementById('delete-account');
const addBookForm = document.getElementById('add-book-form');
const memberGoBackButton = document.getElementById('member-go-back');
const librarianGoBackButton = document.getElementById('librarian-go-back');

// Event Listeners
authForm.addEventListener('submit', handleAuth);
switchAuthButton.addEventListener('click', toggleAuthMode);
deleteAccountButton.addEventListener('click', deleteAccount);
addBookForm.addEventListener('submit', addBook);
memberGoBackButton.addEventListener('click', logout);
librarianGoBackButton.addEventListener('click', logout);
// Check if user is logged in
if (token) {
    showDashboard();
}

function handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const isLogin = authButton.textContent === 'Login';

    const url = `${API_URL}/auth/${isLogin ? 'login' : 'signup'}`;
    const body = { username, password, role };

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            token = data.token;
            userRole = role;
            localStorage.setItem('token', token);
            localStorage.setItem('userRole', userRole);
            showDashboard();
        } else {
            alert(data.message || 'Authentication failed');
        }
    })
    .catch(error => console.error('Error:', error));
}
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    token = null;
    userRole = null;
    location.reload();
}

function handleApiError(error) {
    if (error.status === 401 || error.status === 403) {
        alert('Your session has expired or you do not have permission to perform this action. Please log in again.');
        logout();
    } else {
        console.error('API Error:', error);
    }
}

function toggleAuthMode() {
    const isLogin = authButton.textContent === 'Login';
    authButton.textContent = isLogin ? 'Sign Up' : 'Login';
    switchAuthButton.textContent = isLogin ? 'Switch to Login' : 'Switch to Sign Up';
    document.getElementById('role').style.display = isLogin ? 'inline-block' : 'none';
}

function showDashboard() {
    authSection.classList.add('hidden');
    if (userRole === 'MEMBER') {
        memberSection.classList.remove('hidden');
        fetchBooks();
        fetchBorrowHistory();
    } else {
        librarianSection.classList.remove('hidden');
        fetchLibrarianBooks();
        fetchUsers();
    }
}

function goBack() {
    memberSection.classList.add('hidden');
    librarianSection.classList.add('hidden');
    authSection.classList.remove('hidden');
    
    // Clear stored data
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    token = null;
    userRole = null;
    
    // Reset forms
    authForm.reset();
    addBookForm.reset();
    
    // Clear displayed data
    document.getElementById('book-list').innerHTML = '';
    document.getElementById('borrow-history').innerHTML = '';
    document.getElementById('librarian-book-list').innerHTML = '';
    document.getElementById('user-list').innerHTML = '';
}

function fetchBooks() {
    fetch(`${API_URL}/books`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(books => {
        const bookList = document.getElementById('book-list');
        bookList.innerHTML = books.map(book => `
            <div class="book-item">
                <h3>${book.title}</h3>
                <p>Author: ${book.author}</p>
                <p>ISBN: ${book.isbn}</p>
                <p>Status: ${book.status}</p>
                ${book.status === 'AVAILABLE' 
                    ? `<button onclick="borrowBook('${book._id}')">Borrow</button>`
                    : book.borrower === getUserId()
                        ? `<button onclick="returnBook('${book._id}')">Return</button>`
                        : ''}
            </div>
        `).join('');
    })
    .catch(handleApiError);
}

function fetchBorrowHistory() {
    fetch(`${API_URL}/books/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(history => {
        const historyList = document.getElementById('borrow-history');
        historyList.innerHTML = history.map(item => `
            <div class="book-item">
                <h3>${item.book.title}</h3>
                <p>Borrowed: ${new Date(item.borrowDate).toLocaleDateString()}</p>
                <p>Returned: ${item.returnDate ? new Date(item.returnDate).toLocaleDateString() : 'Not returned yet'}</p>
            </div>
        `).join('');
    })
    .catch(error => console.error('Error:', error));
}

function borrowBook(bookId) {
    fetch(`${API_URL}/books/${bookId}/borrow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(() => {
        fetchBooks();
        fetchBorrowHistory();
    })
    .catch(error => console.error('Error:', error));
}

function returnBook(bookId) {
    fetch(`${API_URL}/books/${bookId}/return`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(() => {
        fetchBooks();
        fetchBorrowHistory();
    })
    .catch(error => console.error('Error:', error));
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        fetch(`${API_URL}/users/me`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            location.reload();
        })
        .catch(error => console.error('Error:', error));
    }
}

function fetchLibrarianBooks() {
    fetch(`${API_URL}/books`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(books => {
        const bookList = document.getElementById('librarian-book-list');
        bookList.innerHTML = books.map(book => `
            <div class="book-item">
                <h3>${book.title}</h3>
                <p>Author: ${book.author}</p>
                <p>ISBN: ${book.isbn}</p>
                <p>Status: ${book.status}</p>
                <button onclick="updateBook('${book._id}')">Update</button>
                <button onclick="deleteBook('${book._id}')">Delete</button>
            </div>
        `).join('');
    })
    .catch(error => console.error('Error:', error));
}

function addBook(e) {
    e.preventDefault();
    const title = document.getElementById('book-title').value;
    const author = document.getElementById('book-author').value;
    const isbn = document.getElementById('book-isbn').value;

    fetch(`${API_URL}/books`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title, author, isbn })
    })
    .then(response => response.json())
    .then(() => {
        fetchLibrarianBooks();
        addBookForm.reset();
    })
    .catch(error => console.error('Error:', error));
}

function updateBook(bookId) {
    // For simplicity, we'll just prompt for new title, author, and ISBN
    const title = prompt('Enter new title:');
    const author = prompt('Enter new author:');
    const isbn = prompt('Enter new ISBN:');

    fetch(`${API_URL}/books/${bookId}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title, author, isbn })
    })
    .then(response => response.json())
    .then(() => fetchLibrarianBooks())
    .catch(error => console.error('Error:', error));
}

function deleteBook(bookId) {
    if (confirm('Are you sure you want to delete this book?')) {
        fetch(`${API_URL}/books/${bookId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(() => fetchLibrarianBooks())
        .catch(error => console.error('Error:', error));
    }
}

function fetchUsers() {
    fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(users => {
        const userList = document.getElementById('user-list');
        userList.innerHTML = users.map(user => `
            <div class="user-item">
                <h3>${user.username}</h3>
                <p>Role: ${user.role}</p>
                <button onclick="updateUser('${user._id}')">Update</button>
                <button onclick="deleteUser('${user._id}')">Delete</button>
            </div>
        `).join('');
    })
    .catch(error => console.error('Error:', error));
}

function updateUser(userId) {
    const username = prompt('Enter new username:');
    const role = prompt('Enter new role (MEMBER or LIBRARIAN):');

    fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ username, role })
    })
    .then(response => response.json())
    .then(() => fetchUsers())
    .catch(error => console.error('Error:', error));
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(() => fetchUsers())
        .catch(error => console.error('Error:', error));
    }
}

function getUserId() {
    const payload = token.split('.')[1];
    const decodedPayload = atob(payload);
    return JSON.parse(decodedPayload).userId;
}