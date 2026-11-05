require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// MYSQL DATABASE CONNECTION
// ===============================
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Zainab@996633',
  database: process.env.DB_NAME || 'zainab_lab_management',

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ===============================
// MIDDLEWARE
// ===============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve HTML, CSS and JavaScript
app.use(express.static(path.join(__dirname, 'public')));


// =====================================================
// API 1 — CHECK DATABASE CONNECTION
// =====================================================
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      ok: true,
      message: 'Database connected successfully'
    });

  } catch (error) {

    console.error('Database connection error:', error.message);

    res.status(500).json({
      ok: false,
      message: error.message
    });
  }
});


// =====================================================
// API 2 — DASHBOARD
// =====================================================
app.get('/api/dashboard', async (req, res) => {

  try {

    const [[equipment]] = await pool.query(`
      SELECT
        COUNT(*) AS total_equipment,

        COALESCE(
          SUM(available_quantity),
          0
        ) AS available_units,

        COALESCE(
          SUM(quantity),
          0
        ) AS total_units,

        COALESCE(
          SUM(
            CASE
              WHEN status = 'Damaged'
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS damaged_items,

        COALESCE(
          SUM(
            CASE
              WHEN status = 'Unavailable'
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS unavailable_items

      FROM equipment
    `);


    const [[users]] = await pool.query(`
      SELECT COUNT(*) AS total_users
      FROM users
    `);


    const [[issues]] = await pool.query(`
      SELECT

        COUNT(*) AS total_issues,

        COALESCE(
          SUM(
            CASE
              WHEN status = 'Issued'
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS active_issues,

        COALESCE(
          SUM(
            CASE
              WHEN status = 'Returned'
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS returned_issues,

        COALESCE(
          SUM(
            CASE
              WHEN status = 'Overdue'
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS overdue_issues

      FROM issue_records
    `);


    res.json({
      equipment,
      users,
      issues
    });

  } catch (error) {

    console.error('Dashboard error:', error.message);

    res.status(500).json({
      error: error.message
    });
  }
});


// =====================================================
// EQUIPMENT APIs
// =====================================================

// GET ALL EQUIPMENT
app.get('/api/equipment', async (req, res) => {

  try {

    const [rows] = await pool.query(`
      SELECT
        equipment_id,
        name,
        category,
        quantity,
        available_quantity,
        status

      FROM equipment

      ORDER BY equipment_id DESC
    `);

    res.json(rows);

  } catch (error) {

    console.error('Equipment GET error:', error.message);

    res.status(500).json({
      error: error.message
    });
  }
});


// ADD EQUIPMENT
app.post('/api/equipment', async (req, res) => {

  try {

    const {
      name,
      category,
      quantity,
      available_quantity,
      status
    } = req.body;


    const totalQuantity = Number(quantity);

    const availableQuantity =
      available_quantity !== undefined &&
      available_quantity !== ''
        ? Number(available_quantity)
        : totalQuantity;


    const [result] = await pool.query(`
      INSERT INTO equipment
      (
        name,
        category,
        quantity,
        available_quantity,
        status
      )

      VALUES (?, ?, ?, ?, ?)
    `,

    [
      name,
      category,
      totalQuantity,
      availableQuantity,
      status || 'Available'
    ]);


    res.status(201).json({
      equipment_id: result.insertId,
      message: 'Equipment added successfully'
    });

  } catch (error) {

    console.error('Equipment POST error:', error.message);

    res.status(400).json({
      error: error.message
    });
  }
});


// UPDATE EQUIPMENT
app.patch('/api/equipment/:id', async (req, res) => {

  try {

    const {
      name,
      category,
      quantity,
      available_quantity,
      status
    } = req.body;


    await pool.query(`
      UPDATE equipment

      SET
        name = ?,
        category = ?,
        quantity = ?,
        available_quantity = ?,
        status = ?

      WHERE equipment_id = ?
    `,

    [
      name,
      category,
      Number(quantity),
      Number(available_quantity),
      status,
      req.params.id
    ]);


    res.json({
      message: 'Equipment updated successfully'
    });

  } catch (error) {

    console.error('Equipment UPDATE error:', error.message);

    res.status(400).json({
      error: error.message
    });
  }
});


// DELETE EQUIPMENT
app.delete('/api/equipment/:id', async (req, res) => {

  try {

    await pool.query(`
      DELETE FROM equipment
      WHERE equipment_id = ?
    `,

    [req.params.id]);


    res.json({
      message: 'Equipment deleted successfully'
    });

  } catch (error) {

    console.error('Equipment DELETE error:', error.message);

    res.status(400).json({
      error: error.message
    });
  }
});


// =====================================================
// USERS APIs
// =====================================================

// GET ALL USERS
app.get('/api/users', async (req, res) => {

  try {

    const [rows] = await pool.query(`
      SELECT
        user_id,
        name,
        email,
        role

      FROM users

      ORDER BY user_id DESC
    `);

    res.json(rows);

  } catch (error) {

    console.error('Users GET error:', error.message);

    res.status(500).json({
      error: error.message
    });
  }
});


// ADD USER
app.post('/api/users', async (req, res) => {

  try {

    const {
      name,
      email,
      password,
      role
    } = req.body;


    const [result] = await pool.query(`
      INSERT INTO users
      (
        name,
        email,
        password,
        role
      )

      VALUES (?, ?, ?, ?)
    `,

    [
      name,
      email,
      password,
      role || 'Student'
    ]);


    res.status(201).json({
      user_id: result.insertId,
      message: 'User added successfully'
    });

  } catch (error) {

    console.error('User POST error:', error.message);

    res.status(400).json({
      error: error.message
    });
  }
});


// =====================================================
// ISSUE RECORD APIs
// =====================================================

// GET ISSUE RECORDS
app.get('/api/issues', async (req, res) => {

  try {

    const [rows] = await pool.query(`

      SELECT

        ir.issue_id,
        ir.equipment_id,
        ir.user_id,
        ir.issue_date,
        ir.return_date,
        ir.quantity,
        ir.status,

        e.name AS equipment_name,

        u.name AS user_name,
        u.email

      FROM issue_records ir

      INNER JOIN equipment e
        ON e.equipment_id = ir.equipment_id

      INNER JOIN users u
        ON u.user_id = ir.user_id

      ORDER BY ir.issue_id DESC

    `);


    res.json(rows);

  } catch (error) {

    console.error('Issues GET error:', error.message);

    res.status(500).json({
      error: error.message
    });
  }
});


// =====================================================
// CREATE ISSUE RECORD
// =====================================================
app.post('/api/issues', async (req, res) => {

  const conn = await pool.getConnection();

  try {

    const {
      equipment_id,
      user_id,
      issue_date,
      return_date,
      quantity,
      status
    } = req.body;


    await conn.beginTransaction();


    // Check equipment
    const [equipmentRows] = await conn.query(`

      SELECT
        available_quantity

      FROM equipment

      WHERE equipment_id = ?

      FOR UPDATE

    `,

    [equipment_id]);


    if (equipmentRows.length === 0) {

      throw new Error('Equipment not found');
    }


    const qty = Number(quantity);


    // Check availability
    if (
      status === 'Issued' &&
      equipmentRows[0].available_quantity < qty
    ) {

      throw new Error(
        'Not enough available equipment'
      );
    }


    // Insert issue record
    await conn.query(`

      INSERT INTO issue_records

      (
        equipment_id,
        user_id,
        issue_date,
        return_date,
        quantity,
        status
      )

      VALUES (?, ?, ?, ?, ?, ?)

    `,

    [
      equipment_id,
      user_id,
      issue_date || new Date(),
      return_date || null,
      qty,
      status || 'Issued'
    ]);


    // Reduce available equipment
    if (status === 'Issued') {

      await conn.query(`

        UPDATE equipment

        SET

          available_quantity =
            available_quantity - ?,

          status =
            CASE

              WHEN available_quantity - ? <= 0
              THEN 'Unavailable'

              ELSE 'Available'

            END

        WHERE equipment_id = ?

      `,

      [
        qty,
        qty,
        equipment_id
      ]);
    }


    await conn.commit();


    res.status(201).json({
      message: 'Issue record created successfully'
    });

  } catch (error) {

    await conn.rollback();

    console.error(
      'Issue creation error:',
      error.message
    );

    res.status(400).json({
      error: error.message
    });

  } finally {

    conn.release();
  }
});


// =====================================================
// RETURN EQUIPMENT
// =====================================================
app.patch('/api/issues/:id/return', async (req, res) => {

  const conn = await pool.getConnection();

  try {

    await conn.beginTransaction();


    // Find issue
    const [rows] = await conn.query(`

      SELECT
        equipment_id,
        quantity,
        status

      FROM issue_records

      WHERE issue_id = ?

      FOR UPDATE

    `,

    [req.params.id]);


    if (rows.length === 0) {

      throw new Error(
        'Issue record not found'
      );
    }


    if (rows[0].status === 'Returned') {

      throw new Error(
        'Equipment is already returned'
      );
    }


    // Update issue record
    await conn.query(`

      UPDATE issue_records

      SET

        status = 'Returned',

        return_date =
          COALESCE(
            return_date,
            CURDATE()
          )

      WHERE issue_id = ?

    `,

    [req.params.id]);


    // Add equipment back
    await conn.query(`

      UPDATE equipment

      SET

        available_quantity =
          available_quantity + ?,

        status = 'Available'

      WHERE equipment_id = ?

    `,

    [
      rows[0].quantity,
      rows[0].equipment_id
    ]);


    await conn.commit();


    res.json({
      message:
        'Equipment returned successfully'
    });

  } catch (error) {

    await conn.rollback();

    console.error(
      'Return equipment error:',
      error.message
    );

    res.status(400).json({
      error: error.message
    });

  } finally {

    conn.release();
  }
});


// =====================================================
// START SERVER
// =====================================================

// IMPORTANT:
// Do NOT use:
// app.get('*', ...)
// with Express 5.
//
// express.static() already serves
// public/index.html automatically.

app.listen(PORT, () => {

  console.log('');
  console.log('==========================================');
  console.log(' ZAINAB COLLEGE LAB MANAGEMENT SYSTEM');
  console.log('==========================================');
  console.log(` Server: http://localhost:${PORT}`);
  console.log(' Database: zainab_lab_management');
  console.log(' Status: Server running successfully');
  console.log('==========================================');
  console.log('');

});