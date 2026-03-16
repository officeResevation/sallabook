CREATE DATABASE IF NOT EXISTS conference_booking;
USE conference_booking;

-- Tabela e Përdoruesve
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela e Sallave
CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(150),
  capacity INT NOT NULL,
  equipment JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela e Rezervimeve
CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  room_id INT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('active', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Index per kerkim me shpejte
CREATE INDEX idx_reservations_room_date ON reservations(room_id, date, status);

-- Admin i pare (password: Admin123!)
INSERT INTO users (name, email, password, role) VALUES
('Administrator', 'admin@school.al', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Disa salla demo
INSERT INTO rooms (name, location, capacity, equipment) VALUES
('Salla A101', 'Kati 1', 30, '["projektor", "whiteboard", "wifi"]'),
('Salla B205', 'Kati 2', 50, '["projektor", "mikrofon", "wifi"]'),
('Salla Konferencave', 'Kati 3', 20, '["TV", "whiteboard", "wifi", "kamera"]');