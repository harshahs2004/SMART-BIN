document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('admin-login-form');
    const usersTable = document.getElementById('users-table')?.querySelector('tbody');
    const historyTable = document.getElementById('history-table')?.querySelector('tbody');
    const refreshBtn = document.getElementById('refresh-data');
    const resetPointsBtn = document.getElementById('reset-points');

    const API_URL = 'http://localhost:3000/admin';

    // Handle admin login
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                sessionStorage.setItem('adminLoggedIn', 'true');
                window.location.href = 'admin-dashboard.html';
            } else {
                alert('Admin login failed');
            }
        });
    }

    // Admin dashboard logic
    if (usersTable) {
        if (!sessionStorage.getItem('adminLoggedIn')) {
            window.location.href = 'admin-login.html';
            return;
        }

        const fetchUsers = async () => {
            const response = await fetch(`${API_URL}/users`);
            if (response.ok) {
                const users = await response.json();
                usersTable.innerHTML = '';
                users.forEach(user => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="p-2">${user.name}</td>
                        <td class="p-2">${user.email}</td>
                        <td class="p-2">${user.reward_points}</td>
                        <td class="p-2"><button class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded delete-user" data-email="${user.email}">Delete</button></td>
                    `;
                    usersTable.appendChild(row);
                });
            }
        };

        const fetchHistory = async () => {
            const response = await fetch(`${API_URL}/history`);
            if (response.ok) {
                const history = await response.json();
                historyTable.innerHTML = '';
                history.forEach(record => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="p-2">${record.user_email}</td>
                        <td class="p-2">${new Date(record.timestamp).toLocaleString()}</td>
                        <td class="p-2">${record.points_added}</td>
                    `;
                    historyTable.appendChild(row);
                });
            }
        };

        const refreshData = () => {
            fetchUsers();
            fetchHistory();
        };

        refreshData();

        if(refreshBtn){
            refreshBtn.addEventListener('click', refreshData);
        }

        if(resetPointsBtn){
            resetPointsBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to reset all points?')) {
                    const response = await fetch(`${API_URL}/reset`, { method: 'POST' });
                    if (response.ok) {
                        refreshData();
                    } else {
                        alert('Failed to reset points');
                    }
                }
            });
        }

        usersTable.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-user')) {
                const email = e.target.dataset.email;
                if (confirm(`Are you sure you want to delete user ${email}?`)) {
                    const response = await fetch(`${API_URL}/delete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    if (response.ok) {
                        refreshData();
                    } else {
                        alert('Failed to delete user');
                    }
                }
            }
        });
    }
});
