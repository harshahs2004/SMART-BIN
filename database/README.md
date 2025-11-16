# SmartBin MySQL Database Documentation

## 1. General Database Information

*   **Database Name:** `smartbin`
*   **MySQL Version:** 8.x
*   **Description:** This database stores all the data for the SmartBin project, including user information, dump records, reward points, and temporary ESP32 sessions.
*   **Character Set:** `utf8mb4` for full Unicode support.
*   **Engine:** `InnoDB` for transaction safety and foreign key support.

---

## 2. How to Import the Database

You can import the database using the `schema.sql` file provided in this folder.

### Using MySQL Command Line

1.  Open your terminal or command prompt.
2.  Navigate to the `database` directory.
3.  Run the following command, replacing `your_username` with your MySQL username:

    ```bash
    mysql -u your_username -p smartbin < schema.sql
    ```

4.  Enter your MySQL password when prompted.

### Using phpMyAdmin

1.  Open phpMyAdmin in your browser.
2.  Create a new database named `smartbin`.
3.  Select the `smartbin` database.
4.  Click on the "Import" tab.
5.  Click "Choose File" and select the `schema.sql` file.
6.  Click "Go" to start the import.

---

## 3. How to Access the Database

### Via Command Line

1.  Open your terminal or command prompt.
2.  Connect to MySQL:

    ```bash
    mysql -u your_username -p
    ```

3.  Select the `smartbin` database:

    ```sql
    USE smartbin;
    ```

### Via phpMyAdmin

1.  Open phpMyAdmin in your browser.
2.  Select the `smartbin` database from the left-hand sidebar.

---

## 4. Example MySQL Commands

*   **Show all databases:**

    ```sql
    SHOW DATABASES;
    ```

*   **Show all tables in the `smartbin` database:**

    ```sql
    SHOW TABLES;
    ```

*   **Describe the structure of a table (e.g., `users`):**

    ```sql
    DESCRIBE users;
    ```

---

## 5. ER Diagram (Text Form)

```
+---------+ (1) -- (∞) +-------+
|  users  |           | dumps |
+---------+           +-------+
    |
    | (1)
    |
    |
    | (∞)
    |
+---------+
| rewards |
+---------+

+--------------+ (claimed_by) -- (1) +---------+
| esp_sessions |                      |  users  |
+--------------+                      +---------+
```

*   A user can have multiple dumps.
*   A user can have multiple reward transactions.
*   An ESP session is claimed by one user.
