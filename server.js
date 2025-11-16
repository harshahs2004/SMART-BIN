const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());


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

/*
-- Create database and tables
CREATE DATABASE smartbin;
USE smartbin;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    reward_points INT DEFAULT 0
);

CREATE TABLE history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    points_added INT NOT NULL
);
*/

// --- USER ENDPOINTS ---

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
            const sessionId = uuidv4();
            const insertSessionQuery = 'INSERT INTO sessions (session_id, user_email) VALUES (?, ?)';
            db.query(insertSessionQuery, [sessionId, email], (err, result) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Server error');
                    return;
                }
                res.cookie('sessionId', sessionId, { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 }); // 1 day
                res.status(200).json({ email: results[0].email });
            });
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

app.post('/startDump', (req, res) => {
    const { sessionId } = req.cookies;
    if (!sessionId) {
        return res.status(401).send('Please log in again');
    }

    const { bin_id } = req.body;
    if (!bin_id) {
        return res.status(400).send('Bin ID is missing');
    }

    const getSessionQuery = 'SELECT * FROM sessions WHERE session_id = ?';
    db.query(getSessionQuery, [sessionId], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error');
            return;
        }
        if (results.length > 0) {
            const user_email = results[0].user_email;
            const updateBinQuery = 'UPDATE bins SET current_user = ?, updated_at = NOW() WHERE bin_id = ?';
            db.query(updateBinQuery, [user_email, bin_id], (err, result) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Server error');
                    return;
                }
                res.status(200).json({ status: "ok" });
            });
        } else {
            res.status(401).send('Please log in again');
        }
    });
});

app.get('/api/bin/checkStart', (req, res) => {
    const { bin_id } = req.query;
    if (!bin_id) {
        return res.status(400).send('Bin ID is missing');
    }

    const query = 'SELECT current_user FROM bins WHERE bin_id = ?';
    db.query(query, [bin_id], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error');
            return;
        }
        if (results.length > 0 && results[0].current_user) {
            res.json({ action: "START", user_email: results[0].current_user });
        } else {
            res.json({ action: "WAIT" });
        }
    });
});

app.post('/dump', (req, res) => {
    const { user_email, weight, qr_code, bin_id } = req.body;
    const points = Math.floor(weight * 10); // 10 points per kg
    const insertDumpQuery = 'INSERT INTO dumps (user_email, weight, qr_code) VALUES (?, ?, ?)';
    const updateUserQuery = 'UPDATE users SET reward_points = reward_points + ? WHERE email = ?';
    const clearBinQuery = 'UPDATE bins SET current_user = NULL WHERE bin_id = ?';

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
                    // Still send a success response to the ESP32, as the dump was recorded
                }
                res.status(200).send({ message: 'Dump recorded successfully', points_earned: points });
            });
        });
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

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
