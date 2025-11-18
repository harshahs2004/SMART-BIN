const express = require('express');
const mysql = require('mysql2/promise'); // Use promise-based API
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- Database Connection Pool ---
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: 'mrmeter@2004', // Replace with your MySQL password
    database: 'smartbin',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('Connected to database pool.');
        connection.release(); // Release the connection
    })
    .catch(err => {
        console.error('Database connection pool failed:', err.stack);
        process.exit(1); // Exit if database connection fails
    });

// --- API Endpoints ---

app.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        const user_id = 'USER' + Math.random().toString().slice(2, 8);
        const query = 'INSERT INTO users (name, email, password, phone, address, reward_points, user_id) VALUES (?, ?, ?, ?, ?, 0, ?)';
        await pool.query(query, [name, email, password, phone, address, user_id]);
        res.status(200).send('User registered successfully');
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).send('Server error');
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
        const [rows] = await pool.query(query, [email, password]);
        if (rows.length > 0) {
            res.status(200).json({ email: rows[0].email });
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.post('/scan', async (req, res) => {
    try {
        const { user_id } = req.body;
        const query = 'UPDATE bins SET current_user = ? WHERE bin_id = ?';
        // Assuming a single bin for now, as the logic for multiple bins was removed
        const bin_id = 'BIN_001';
        await pool.query(query, [user_id, bin_id]);
        res.status(200).json({ status: "ok" });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.get('/esp/bin-status', async (req, res) => {
    try {
        const { bin_id } = req.query;
        const query = 'SELECT current_user FROM bins WHERE bin_id = ?';
        const [rows] = await pool.query(query, [bin_id]);
        if (rows.length > 0 && rows[0].current_user) {
            res.json({ action: "START", user_id: rows[0].current_user });
        } else {
            res.json({ action: "WAIT" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.post('/dump', async (req, res) => {
    try {
        const { user_email, weight, qr_code } = req.body;
        const points = Math.floor(weight * 10);
        const insertDumpQuery = 'INSERT INTO dumps (user_email, weight, qr_code) VALUES (?, ?, ?)';
        const updateUserQuery = 'UPDATE users SET reward_points = reward_points + ? WHERE email = ?';
        const clearBinQuery = 'UPDATE bins SET current_user = NULL WHERE bin_id = ?';
        const bin_id = 'BIN_001'; // Assuming a single bin

        await pool.query(insertDumpQuery, [user_email, weight, qr_code]);
        await pool.query(updateUserQuery, [points, user_email]);
        await pool.query(clearBinQuery, [bin_id]);

        res.status(200).send({ message: 'Dump recorded successfully', points_earned: points });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.get('/user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const query = `
            SELECT name, email, phone, address, bank_name, account_number, ifsc_code, reward_points as points, user_id
            FROM users WHERE email = ?
        `;
        const [rows] = await pool.query(query, [email]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Fetch user data error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/user/:email/dumps', async (req, res) => {
    try {
        const { email } = req.params;
        const query = 'SELECT id, user_email, weight, qr_code, dump_time, waste_type, points FROM dumps WHERE user_email = ? ORDER BY dump_time DESC';
        const [rows] = await pool.query(query, [email]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.get('/user/:email/rewards', async (req, res) => {
    try {
        const { email } = req.params;
        const query = 'SELECT * FROM rewards WHERE user_email = ? ORDER BY requested_at DESC';
        const [rows] = await pool.query(query, [email]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.post('/user/:email/profile', async (req, res) => {
    try {
        const { email } = req.params;
        const { name, phone, address, bank_name, account_number, ifsc_code } = req.body;
        const query = 'UPDATE users SET name = ?, phone = ?, address = ?, bank_name = ?, account_number = ?, ifsc_code = ? WHERE email = ?';
        await pool.query(query, [name, phone, address, bank_name, account_number, ifsc_code, email]);
        res.status(200).send('Profile updated');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.post('/withdraw', async (req, res) => {
    try {
        const { user_email, points } = req.body;
        const query = 'INSERT INTO rewards (user_email, points_redeemed) VALUES (?, ?)';
        const updateUserQuery = 'UPDATE users SET reward_points = reward_points - ? WHERE email = ?';
        await pool.query(query, [user_email, points]);
        await pool.query(updateUserQuery, [points, user_email]);
        res.status(200).send('Withdrawal request submitted');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Completely rewritten /claim-session to only handle W/T/P format
app.post('/claim-session', async (req, res) => {
    try {
        const { weight, type, points, user_email } = req.body;
        // 1. Validate payload
        if (weight === undefined || type === undefined || points === undefined) {
            return res.status(400).json({
                success: false,
                message: "Invalid payload. Must contain weight, type, and points."
            });
        }

        const numericWeight = parseFloat(weight);
        const numericPoints = parseInt(points, 10);

        if (isNaN(numericWeight) || isNaN(numericPoints)) {
            return res.status(400).json({
                success: false,
                message: "Invalid number values for weight or points."
            });
        }

        // 2. Insert into dumps table
        const insertDumpQuery = 'INSERT INTO dumps (user_email, weight, waste_type, points) VALUES (?, ?, ?, ?)';
        const [dumpResult] = await pool.query(insertDumpQuery, [user_email || null, numericWeight, type, numericPoints]);
        const dump_id = dumpResult.insertId;

        let new_points = null;

        // 3. Update users table if user_email is provided
        if (user_email) {
            const updateUserQuery = `
                INSERT INTO users (email, reward_points) VALUES (?, ?)
                ON DUPLICATE KEY UPDATE reward_points = reward_points + VALUES(reward_points)
            `;
            await pool.query(updateUserQuery, [user_email, numericPoints]);

            // Fetch updated points
            const [userRows] = await pool.query('SELECT reward_points FROM users WHERE email = ?', [user_email]);
            if (userRows.length > 0) {
                new_points = userRows[0].reward_points;
            }
        }

        // 4. Return JSON response
        res.status(200).json({
            success: true,
            message: "Dump recorded",
            dump_id: dump_id,
            new_points: new_points
        });

    } catch (err) {
        console.error('Error in /claim-session:', err);
        res.status(500).json({
            success: false,
            message: "Server error during dump processing."
        });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});

