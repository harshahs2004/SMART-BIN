document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const welcomeMessage = document.getElementById('welcome-message');
    const rewardPoints = document.getElementById('reward-points');
    const startScanBtn = document.getElementById('start-scan-btn');
    const qrScanner = document.getElementById('qr-scanner');
    const scannedResult = document.getElementById('scanned-result');
    const submitDumpBtn = document.getElementById('submit-dump');
    const dumpHistory = document.getElementById('dump-history');
    const rewardsHistory = document.getElementById('rewards-history');
    const profileForm = document.getElementById('profile-form');
    const withdrawBtn = document.getElementById('withdraw-rewards');

    const API_URL = 'http://localhost:3000';

    //                         Handles registration
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const phone = document.getElementById('phone').value;
            const address = document.getElementById('address').value;

            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, phone, address })
            });

            if (response.ok) {
                alert('Registration Successful!');
                window.location.href = 'login.html';
            } else {
                alert('Error: Could not register. Please try again.');
            }
        });
    }

    //                             Handles login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('userEmail', data.email);
                window.location.href = 'dashboard.html';
            } else {
                alert('Login failed');
            }
        });
    }

    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail && (window.location.pathname.includes('dashboard') || window.location.pathname.includes('profile'))) {
        window.location.href = 'login.html';
        return;
    }

        // Dashboard logic
        if (window.location.pathname.includes('dashboard')) {
            const claimDumpBtn = document.getElementById('claim-dump-btn');
            if (claimDumpBtn) {
                claimDumpBtn.addEventListener('click', () => {
                    const html5QrCode = new Html5Qrcode("qr-scanner");
                    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
                        const parts = decodedText.split(':');
                        if (parts.length !== 2) {
                            alert('Invalid QR Code format');
                            return;
                        }
                        const bin_id = parts[0];
                        const session_id = parts[1];

                        document.getElementById('scanned-result').innerText = `Scanned: ${decodedText}`;
                        fetch(`${API_URL}/claim-session`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ session_id: session_id, user_email: userEmail })
                        })
                        .then(response => {
                            if (response.ok) {
                                alert('Dump claimed successfully! Waste data recorded.');
                                html5QrCode.stop();
                                fetchUserData();
                                fetchDumpHistory();
                            } else {
                                alert('Failed to claim dump');
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Error claiming dump');
                        });
                    };
                    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
                    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback);
                });
            }

            const fetchUserData = async () => {
                try {
                    const response = await fetch(`${API_URL}/user/${userEmail}`);
                    if (response.ok) {
                        const user = await response.json();
                        welcomeMessage.textContent = `Welcome, ${user.name}`;
                        if(rewardPoints) rewardPoints.textContent = user.points;
                    } else {
                        throw new Error('Failed to fetch user data');
                    }
                } catch (error) {
                    console.error(error);
                    alert('Error fetching user data');
                }
            };

            const fetchDumpHistory = async () => {
                try {
                    const response = await fetch(`${API_URL}/user/${userEmail}/dumps`);
                    if (response.ok) {
                        const dumps = await response.json();
                        dumpHistory.innerHTML = '';
                        dumps.forEach(dump => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td class="p-3">${new Date(dump.dump_time).toLocaleString()}</td>
                                <td class="p-3">${dump.weight}</td>
                                <td class="p-3">${dump.qr_code}</td>
                            `;
                            dumpHistory.appendChild(row);
                        });
                    } else {
                        throw new Error('Failed to fetch dump history');
                    }
                } catch (error) {
                    console.error(error);
                    alert('Error fetching dump history');
                }
            };

            const fetchRewardsHistory = async () => {
                try {
                    const response = await fetch(`${API_URL}/user/${userEmail}/rewards`);
                    if (response.ok) {
                        const rewards = await response.json();
                        rewardsHistory.innerHTML = '';
                        rewards.forEach(reward => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td class="p-3">${new Date(reward.requested_at).toLocaleString()}</td>
                                <td class="p-3">${reward.points_earned}</td>
                                <td class="p-3">${reward.points_redeemed}</td>
                                <td class="p-3">${reward.withdrawal_status}</td>
                            `;
                            rewardsHistory.appendChild(row);
                        });
                    } else {
                        throw new Error('Failed to fetch rewards history');
                    }
                } catch (error) {
                    console.error(error);
                    alert('Error fetching rewards history');
                }
            };

            fetchUserData();
            fetchDumpHistory();
            fetchRewardsHistory();
        }

    

                // Profile page logic

    

                if (window.location.pathname.includes('profile')) {

    

                    const saveBankDetailsBtn = document.getElementById('save-bank-details');

    

                    if (saveBankDetailsBtn) {

    

                        saveBankDetailsBtn.addEventListener('click', async () => {

    

                            const bank_name = document.getElementById('bank-name').value;

    

                            const account_number = document.getElementById('account-number').value;

    

                            const ifsc_code = document.getElementById('ifsc-code').value;

    

        

    

                            try {

    

                                const response = await fetch(`${API_URL}/user/${userEmail}/profile`, {

    

                                    method: 'POST',

    

                                    headers: { 'Content-Type': 'application/json' },

    

                                    body: JSON.stringify({

    

                                        name: document.getElementById('name').value,

    

                                        phone: document.getElementById('phone').value,

    

                                        address: document.getElementById('address').value,

    

                                        bank_name,

    

                                        account_number,

    

                                        ifsc_code

    

                                    })

    

                                });

    

        

    

                                if (response.ok) {

    

                                    alert('Bank details updated successfully!');

    

                                } else {

    

                                    alert('Bank details update failed');

    

                                }

    

                            } catch (error) {

    

                                console.error(error);

    

                                alert('Error updating bank details');

    

                            }

    

                        });

    

                    }

    

        

    

                    const fetchUserData = async () => {

    

                        try {

    

                            const response = await fetch(`${API_URL}/user/${userEmail}`);

    

                            if (response.ok) {

    

                                const user = await response.json();

    

                                document.getElementById('name').value = user.name || '';

    

                                document.getElementById('email').value = user.email || '';

    

                                document.getElementById('phone').value = user.phone || '';

    

                                document.getElementById('address').value = user.address || '';

    

                                document.getElementById('bank-name').value = user.bank_name || '';

    

                                document.getElementById('account-number').value = user.account_number || '';

    

                                document.getElementById('ifsc-code').value = user.ifsc_code || '';

    

                                document.getElementById('reward-points').value = user.points || 0;

    

                                document.getElementById('user-id').textContent = user.user_id || '';

    

                            } else {

    

                                throw new Error('Failed to fetch user data');

    

                            }

    

                        } catch (error) {

    

                            console.error(error);

    

                            alert('Error fetching user data');

    

                        }

    

                    };

    

                    if (userEmail) {

    

                        fetchUserData();

    

                    } else {

    

                        alert('User not logged in');

    

                        window.location.href = 'login.html';

    

                    }

    

        

    

                    profileForm.addEventListener('submit', async (e) => {

    

                        e.preventDefault();

    

                        const name = document.getElementById('name').value;

    

                        const phone = document.getElementById('phone').value;

    

                        const address = document.getElementById('address').value;

    

        

    

                        try {

    

                            const response = await fetch(`${API_URL}/user/${userEmail}/profile`, {

    

                                method: 'POST',

    

                                headers: { 'Content-Type': 'application/json' },

    

                                body: JSON.stringify({

    

                                    name,

    

                                    phone,

    

                                    address,

    

                                    bank_name: document.getElementById('bank-name').value,

    

                                    account_number: document.getElementById('account-number').value,

    

                                    ifsc_code: document.getElementById('ifsc-code').value

    

                                })

    

                            });

    

        

    

                            if (response.ok) {

    

                                alert('Profile updated successfully!');

    

                            } else {

    

                                alert('Profile update failed');

    

                            }

    

                        } catch (error) {

    

                            console.error(error);

    

                            alert('Error updating profile');

    

                        }

    

                    });

    

        

    

                    if (withdrawBtn) {

    

                        withdrawBtn.addEventListener('click', async () => {

    

                            const points = document.getElementById('reward-points').value;

    

                            if (points <= 0) {

    

                                alert('You have no points to withdraw.');

    

                                return;

    

                            }

    

        

    

                            try {

    

                                const response = await fetch(`${API_URL}/withdraw`, {

    

                                    method: 'POST',

    

                                    headers: { 'Content-Type': 'application/json' },

    

                                    body: JSON.stringify({ user_email: userEmail, points: points })

    

                                });

    

        

    

                                if (response.ok) {

    

                                    alert('Withdrawal request submitted successfully!');

    

                                    fetchUserData();

    

                                } else {

    

                                    alert('Withdrawal request failed');

    

                                }

    

                            } catch (error) {

    

                                console.error(error);

    

                                alert('Error submitting withdrawal request');

    

                            }

    

                        });

    

                    }

    

                }

    // Handle navigation
    const profileLink = document.getElementById('profile-link');
    if (profileLink) {
        profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'profile.html';
        });
    }

    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('userEmail');
            window.location.href = 'login.html';
        });
    }
});
