const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- Database Connection ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: 'mrmeter@2004', // Replace with your MySQL password
    database: 'smartbin'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database.');
});

// --- API Endpoints ---

app.post('/register', (req, res) => {
    const { name, email, password, phone, address } = req.body;
    const user_id = 'USER' + Math.random().toString().slice(2, 8);
    const query = 'INSERT INTO users (name, email, password, phone, address, reward_points, user_id) VALUES (?, ?, ?, ?, ?, 0, ?)';
    db.query(query, [name, email, password, phone, address, user_id], (err, result) => {
        if (err) {
            console.error('Error registering user:', err);
            res.status(500).send('Server error');
            return;
        }
        res.status(200).send('User registered successfully');
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error');
            return;
        }
        if (results.length > 0) {
            res.status(200).json({ email: results[0].email });
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

app.post('/scan', (req, res) => {
    const { user_id } = req.body;
    const query = 'UPDATE bins SET current_user = ? WHERE bin_id = ?';
    // Assuming a single bin for now, as the logic for multiple bins was removed
    const bin_id = 'BIN_001';
    db.query(query, [user_id, bin_id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error');
            return;
        }
        res.status(200).json({ status: "ok" });
    });
});

app.get('/esp/bin-status', (req, res) => {
    const { bin_id } = req.query;
    const query = 'SELECT current_user FROM bins WHERE bin_id = ?';
    db.query(query, [bin_id], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error');
            return;
        }
        if (results.length > 0 && results[0].current_user) {
            res.json({ action: "START", user_id: results[0].current_user });
        } else {
            res.json({ action: "WAIT" });
        }
    });
});

app.post('/dump', (req, res) => {
    const { user_email, weight, qr_code } = req.body;
    const points = Math.floor(weight * 10);
    const insertDumpQuery = 'INSERT INTO dumps (user_email, weight, qr_code) VALUES (?, ?, ?)';
    const updateUserQuery = 'UPDATE users SET reward_points = reward_points + ? WHERE email = ?';
    const clearBinQuery = 'UPDATE bins SET current_user = NULL WHERE bin_id = ?';
    const bin_id = 'BIN_001'; // Assuming a single bin

    db.query(insertDumpQuery, [user_email, weight, qr_code], (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error');
            return;
        }
        db.query(updateUserQuery, [points, user_email], (err2) => {
            if (err2) {
                console.error(err2);
                res.status(500).send('Server error');
                return;
            }
            db.query(clearBinQuery, [bin_id], (err3) => {
                if (err3) {
                    console.error(err3);
                }
                res.status(200).send({ message: 'Dump recorded successfully', points_earned: points });
            });
        });
    });
});

app.get('/user/:email', (req, res) => {
    const { email } = req.params;
    const query = `
        SELECT name, email, phone, address, bank_name, account_number, ifsc_code, reward_points as points, user_id
        FROM users WHERE email = ?
    `;
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Fetch user data error:', err);
            res.status(500).json({ message: 'Server error' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(results[0]);
    });
});

app.get('/user/:email/dumps', (req, res) => {
    const { email } = req.params;
    const query = 'SELECT * FROM dumps WHERE user_email = ? ORDER BY dump_time DESC';
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error');
            return;
        }
        res.json(results);
    });
});

app.get('/user/:email/rewards', (req, res) => {
    const { email } = req.params;
    const query = 'SELECT * FROM rewards WHERE user_email = ? ORDER BY requested_at DESC';
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error');
            return;
        }
        res.json(results);
    });
});

app.post('/user/:email/profile', (req, res) => {
    const { email } = req.params;
    const { name, phone, address, bank_name, account_number, ifsc_code } = req.body;
    const query = 'UPDATE users SET name = ?, phone = ?, address = ?, bank_name = ?, account_number = ?, ifsc_code = ? WHERE email = ?';
    db.query(query, [name, phone, address, bank_name, account_number, ifsc_code, email], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error');
            return;
        }
        res.status(200).send('Profile updated');
    });
});

app.post('/withdraw', (req, res) => {
    const { user_email, points } = req.body;
    const query = 'INSERT INTO rewards (user_email, points_redeemed) VALUES (?, ?)';
    const updateUserQuery = 'UPDATE users SET reward_points = reward_points - ? WHERE email = ?';
    db.query(query, [user_email, points], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error');
            return;
        }
        db.query(updateUserQuery, [points, user_email], (err2, result2) => {
            if (err2) {
                console.error(err2);
                res.status(500).send('Server error');
                return;
            }
            res.status(200).send('Withdrawal request submitted');
        });
    });
});

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
