-- ZAINAB COLLEGE LAB EQUIPMENT MANAGEMENT SYSTEM
-- MySQL Workbench
-- Exactly 3 application tables: equipment, users, issue_records

CREATE DATABASE IF NOT EXISTS zainab_lab_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE zainab_lab_management;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS issue_records;
DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE equipment (
    equipment_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    available_quantity INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'Available',
    CONSTRAINT chk_equipment_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_equipment_available CHECK (
        available_quantity >= 0 AND available_quantity <= quantity
    )
) ENGINE=InnoDB;

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'Student'
) ENGINE=InnoDB;

CREATE TABLE issue_records (
    issue_id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_id INT NOT NULL,
    user_id INT NOT NULL,
    issue_date DATE NOT NULL,
    return_date DATE NULL,
    quantity INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'Issued',

    CONSTRAINT fk_issue_equipment
      FOREIGN KEY (equipment_id)
      REFERENCES equipment(equipment_id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,

    CONSTRAINT fk_issue_user
      FOREIGN KEY (user_id)
      REFERENCES users(user_id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,

    CONSTRAINT chk_issue_quantity CHECK (quantity > 0)
) ENGINE=InnoDB;

-- Sample data
INSERT INTO equipment (name, category, quantity, available_quantity, status) VALUES
('Digital Multimeter', 'Electrical', 20, 17, 'Available'),
('Oscilloscope', 'Electronics', 8, 5, 'Available'),
('Arduino Uno', 'Embedded Systems', 25, 25, 'Available'),
('Raspberry Pi 5', 'Computing', 10, 7, 'Available'),
('CRO Probe Kit', 'Electronics', 12, 9, 'Available'),
('Function Generator', 'Electronics', 6, 6, 'Available'),
('Soldering Station', 'Workshop', 15, 12, 'Available'),
('Logic Analyzer', 'Digital Lab', 7, 4, 'Available');

INSERT INTO users (name, email, password, role) VALUES
('Zainab Admin', 'admin@zainabcollege.edu', 'Admin@12345', 'Admin'),
('Lab Faculty', 'faculty@zainabcollege.edu', 'Faculty@12345', 'Faculty'),
('Demo Student', 'student@zainabcollege.edu', 'Student@12345', 'Student');

INSERT INTO issue_records
(equipment_id, user_id, issue_date, return_date, quantity, status)
VALUES
(1, 3, '2026-11-03', NULL, 2, 'Issued'),
(2, 2, '2026-11-01', '2026-11-04', 1, 'Returned'),
(4, 3, '2026-11-05', NULL, 1, 'Issued');

-- Useful Workbench verification queries
SELECT * FROM equipment;
SELECT * FROM users;
SELECT * FROM issue_records;

SELECT
    ir.issue_id,
    e.name AS equipment,
    u.name AS issued_to,
    ir.issue_date,
    ir.return_date,
    ir.quantity,
    ir.status
FROM issue_records ir
JOIN equipment e ON e.equipment_id = ir.equipment_id
JOIN users u ON u.user_id = ir.user_id
ORDER BY ir.issue_id DESC;
