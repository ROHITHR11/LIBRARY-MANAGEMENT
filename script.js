// Sample users & books for demo
let users = JSON.parse(localStorage.getItem('users')) || [
  { username: 'admin', password: 'admin', role: 'admin' },
  { username: 'user1', password: 'user1', role: 'user' },
  { username: 'user2', password: 'user2', role: 'user' }
];

let books = JSON.parse(localStorage.getItem('books')) || [
  { id: "B001", title: "The Great Gatsby", author: "F. Scott Fitzgerald", status: "Available" },
  { id: "B002", title: "To Kill a Mockingbird", author: "Harper Lee", status: "Issued", issuedTo: "user1", issueDate: "2025-10-10T00:00:00Z" },
  { id: "B003", title: "1984", author: "George Orwell", status: "Issued", issuedTo: "user2", issueDate: "2025-10-01T00:00:00Z" },
  { id: "B004", title: "Pride and Prejudice", author: "Jane Austen", status: "Available" }
];

function saveData() {
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('books', JSON.stringify(books));
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      sessionStorage.setItem('loggedUser', JSON.stringify(user));
      window.location.href = user.role === 'admin' ? 'admin.html' : 'user.html';
    } else {
      document.getElementById('message').textContent = 'Invalid login credentials';
    }
  });
}

function logout() {
  sessionStorage.removeItem('loggedUser');
  window.location.href = 'index.html';
}

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

// -- Admin dashboard code --
if (window.location.pathname.includes('admin.html')) {
  const bookForm = document.getElementById('bookForm');
  const userForm = document.getElementById('userForm');
  const bookTable = document.getElementById('bookTable');
  const userTable = document.getElementById('userTable');

  bookForm.addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('bookId').value.trim();
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const existing = books.find(b => b.id === id);
    if (existing) {
      existing.title = title;
      existing.author = author;
    } else {
      books.push({ id, title, author, status: 'Available' });
    }
    saveData();
    renderBooks();
    bookForm.reset();
  });

  userForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('userName').value.trim();
    const password = document.getElementById('userPass').value.trim();
    if (!users.find(u => u.username === username)) {
      users.push({ username, password, role: 'user' });
      saveData();
      renderUsers();
      userForm.reset();
    } else {
      alert('User already exists');
    }
  });

  function calculateFine(issueDate) {
    const dueDays = 7;
    const fineRate = 5;
    const issue = new Date(issueDate);
    const now = new Date();
    const daysLate = Math.floor((now - issue) / (1000 * 60 * 60 * 24)) - dueDays;
    return daysLate > 0 ? daysLate * fineRate : 0;
  }

  function renderBooks() {
    bookTable.innerHTML = '<tr><th>ID</th><th>Title</th><th>Author</th><th>Status</th><th>Issued To</th><th>Fine ₹</th><th>Action</th></tr>';
    books.forEach((b, i) => {
      const fine = b.status === 'Issued' && b.issueDate ? calculateFine(b.issueDate) : 0;
      bookTable.innerHTML += `<tr>
        <td>${b.id}</td><td>${b.title}</td><td>${b.author}</td><td>${b.status}</td>
        <td>${b.status === 'Issued' ? b.issuedTo : '-'}</td>
        <td>${fine > 0 ? fine : '-'}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteBook(${i})">Delete</button></td>
      </tr>`;
    });
  }

  function renderUsers() {
    userTable.innerHTML = '<tr><th>Username</th><th>Role</th><th>Action</th></tr>';
    users.forEach((u, i) => {
      userTable.innerHTML += `<tr>
        <td>${u.username}</td>
        <td>${u.role}</td>
        <td>${u.role !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteUser(${i})">Remove</button>` : '-'}</td>
      </tr>`;
    });
  }

  window.deleteBook = function(i) {
    if(confirm("Delete this book?")) {
      books.splice(i, 1);
      saveData();
      renderBooks();
    }
  };

  window.deleteUser = function(index) {
    const user = users[index];
    if (user.role === 'admin') {
      alert('Cannot remove admin user!');
      return;
    }
    if (confirm(`Are you sure you want to remove user "${user.username}"?`)) {
      users.splice(index, 1);
      saveData();
      renderUsers();
    }
  };

  renderBooks();
  renderUsers();
  showSection('books');
}

if (window.location.pathname.includes('user.html')) {
  const table = document.getElementById('userBookTable');
  const currentUser = JSON.parse(sessionStorage.getItem('loggedUser'));

  function calculateFine(issueDate) {
    const dueDays = 7;
    const fineRate = 5;
    const issue = new Date(issueDate);
    const now = new Date();
    const daysLate = Math.floor((now - issue) / (1000 * 60 * 60 * 24)) - dueDays;
    return daysLate > 0 ? daysLate * fineRate : 0;
  }

  function renderUserBooks(filteredBooks = books) {
    table.innerHTML = '<tr><th>ID</th><th>Title</th><th>Author</th><th>Status</th><th>Issued To</th><th>Fine ₹</th><th>Action</th></tr>';
    filteredBooks.forEach(b => {
      const fine = b.status === 'Issued' && b.issueDate ? calculateFine(b.issueDate) : 0;
      let action = '';
      if (b.status === 'Available') {
        action = `<button class="btn btn-success btn-sm" onclick="issueBook('${b.id}')">Issue</button>`;
      } else if (b.status === 'Issued' && b.issuedTo === currentUser.username) {
        action = `<button class="btn btn-warning btn-sm" onclick="returnBook('${b.id}')">Return</button>`;
      } else {
        action = 'Issued';
      }
      table.innerHTML += `<tr>
        <td>${b.id}</td>
        <td>${b.title}</td>
        <td>${b.author}</td>
        <td>${b.status}</td>
        <td>${b.status === 'Issued' ? b.issuedTo : '-'}</td>
        <td>${fine > 0 ? fine : '-'}</td>
        <td>${action}</td>
      </tr>`;
    });
  }

  window.issueBook = function(id) {
    const book = books.find(b => b.id === id);
    if (book.status === 'Available') {
      book.status = 'Issued';
      book.issuedTo = currentUser.username;
      book.issueDate = new Date().toISOString();
      saveData();
      renderUserBooks();
    }
  };

  window.returnBook = function(id) {
    const book = books.find(b => b.id === id);
    const fine = calculateFine(book.issueDate);
    if (fine > 0) {
      alert(`Book is returned late. Fine: ₹${fine}`);
    } else {
      alert("Book returned on time!");
    }
    book.status = 'Available';
    delete book.issuedTo;
    delete book.issueDate;
    saveData();
    renderUserBooks();
  };

  window.searchBooks = function() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const filtered = books.filter(b =>
      b.title.toLowerCase().includes(term) || b.author.toLowerCase().includes(term)
    );
    renderUserBooks(filtered);
  };

  renderUserBooks();
}

function generateReports() {
  const allBooks = books.map(b =>
    `<li>${b.title} by ${b.author} - ${b.status}${b.status === 'Issued' ? ` (Issued to: ${b.issuedTo})` : ''}</li>`
  ).join('');
  const overdueBooks = books.filter(b => {
    if (b.status === 'Issued' && b.issueDate) {
      const now = new Date();
      const issue = new Date(b.issueDate);
      return (now - issue) / (1000 * 60 * 60 * 24) > 7;
    }
    return false;
  }).map(b => `<li>${b.title} (Issued to: ${b.issuedTo}) - Overdue</li>`).join('');

  document.getElementById('reportContent').innerHTML = `
    <h4>All Books</h4><ul>${allBooks}</ul>
    <h4>Overdue Books</h4><ul>${overdueBooks}</ul>
  `;
}
