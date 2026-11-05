# Zainab College Lab Equipment Management System

A modern full-stack college laboratory equipment management website with:
- Premium responsive dashboard
- Equipment inventory
- Issue / return records
- User management
- Search and filters
- Dashboard statistics
- Beautiful glassmorphism + navy/teal/gold theme
- MySQL Workbench database with exactly 3 main tables:
  1. equipment
  2. users
  3. issue_records

## Tech stack
Frontend: HTML, CSS, JavaScript
Backend: Node.js + Express
Database: MySQL / MySQL Workbench
DB driver: mysql2

## Setup

1. Install Node.js and MySQL.
2. Open MySQL Workbench.
3. Run `database/schema.sql`.
4. Open a terminal in this project folder.
5. Run:
   npm install
6. Copy `.env.example` to `.env` and enter your MySQL password.
7. Run:
   npm start
8. Open:
   http://localhost:3000

## MySQL relationship
equipment (1) ----< issue_records >---- (1) users

`issue_records.equipment_id` references `equipment.equipment_id`.
`issue_records.user_id` references `users.user_id`.

The SQL uses InnoDB foreign keys so MySQL can enforce referential integrity.
