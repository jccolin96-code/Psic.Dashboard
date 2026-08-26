CREATE DATABASE IF NOT EXISTS psic_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE psic_dashboard;

CREATE TABLE IF NOT EXISTS pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    dni VARCHAR(50) NOT NULL,
    tel VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente VARCHAR(100) NOT NULL,
    medico VARCHAR(100) NOT NULL,
    fecha VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS historias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente VARCHAR(100) NOT NULL,
    diagnostico TEXT NOT NULL,
    tratamiento TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS informes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente VARCHAR(100) NOT NULL,
    contenido TEXT NOT NULL
);