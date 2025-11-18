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
    // Accept QR formats like:
    //   W:2.0,T:Metal Waste,P:20
    // or whitespace/semicolon variants.
    // This parser is tolerant of extra spaces and different ordering.

    if (!decodedText || typeof decodedText !== 'string') {
        alert('Invalid QR Code format');
        return;
    }

    // Split into key:value pairs by commas, semicolons or newlines
    const pairs = decodedText.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);

    const parsed = {};
    for (const p of pairs) {
        const parts = p.split(':');
        if (parts.length < 2) continue;
        const key = parts[0].trim().toUpperCase();
        // re-join in case value contains ':'
        const value = parts.slice(1).join(':').trim();
        if (!value) continue;

        if (key === 'W') {
            const num = parseFloat(value.replace(/[^0-9.\-]/g, ''));
            parsed.weight = Number.isFinite(num) ? num : undefined;
        } else if (key === 'T') {
            parsed.type = value;
        } else if (key === 'P') {
            const num = parseInt(value.replace(/[^0-9\-]/g, ''), 10);
            parsed.points = Number.isFinite(num) ? num : undefined;
        } else {
            // keep any other keys if needed
            parsed[key] = value;
        }
    }

    // Require the three fields (W, T, P)
    if (parsed.weight === undefined || !parsed.type || parsed.points === undefined) {
        alert('Invalid QR Code format');
        return;
    }

    // Update scanned UI
    const scannedEl = document.getElementById('scanned-result');
    if (scannedEl) scannedEl.innerText = `Scanned: ${decodedText}`;

    // Prepare payload — keep userEmail if available in your script scope
    const payload = {
        weight: parsed.weight,
        type: parsed.type,
        points: parsed.points
    };
    if (typeof userEmail !== 'undefined') payload.user_email = userEmail;

    // Send to existing backend endpoint unchanged (only the request body changed).
    fetch(`${API_URL}/claim-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log('claim-session response:', data);
        // Update UI based on backend response if fields exist
        if (data && data.success) {
            // if your backend returns updated points or message, show them
            if (data.message) alert(data.message);
            // optionally update reward points display if returned
            if (data.new_points !== undefined) {
                const pointsEl = document.querySelector('#reward-points, .reward-points');
                if (pointsEl) pointsEl.innerText = data.new_points;
            }
        } else {
            alert((data && data.message) ? data.message : 'Unable to claim dump');
        }
    })
    .catch(err => {
        console.error('Error claiming session:', err);
        alert('Network error while claiming dump');
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
                                <td class="p-3">${dump.waste_type || 'N/A'}</td>
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
