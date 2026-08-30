const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Para servir tu HTML

// Conexión y creación de la Base de Datos SQLite
const dbFile = path.join(__dirname, 'clinica.db');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite (clinica.db)');
    }
});

// Crear tablas si no existen
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS pacientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        dni TEXT,
        tel TEXT,
        email TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS citas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente TEXT,
        medico TEXT,
        fecha TEXT,
        estado TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS historias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente TEXT,
        diagnostico TEXT,
        tratamiento TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS informes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente TEXT,
        contenido TEXT
    )`);
});

// --- API ENDPOINTS ---

// Obtener todos los datos
app.get('/api/db', (req, res) => {
    db.all("SELECT * FROM pacientes", [], (err, pacientes) => {
        db.all("SELECT * FROM citas", [], (err, citas) => {
            db.all("SELECT * FROM historias", [], (err, historias) => {
                db.all("SELECT * FROM informes", [], (err, informes) => {
                    res.json({ pacientes, citas, historias, informes });
                });
            });
        });
    });
});

// Registrar Paciente
app.post('/api/pacientes', (req, res) => {
    const { nombre, dni, tel, email } = req.body;
    db.run(`INSERT INTO pacientes (nombre, dni, tel, email) VALUES (?, ?, ?, ?)`, [nombre, dni, tel, email], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Registrar Cita
app.post('/api/citas', (req, res) => {
    const { paciente, medico, fecha, estado } = req.body;
    db.run(`INSERT INTO citas (paciente, medico, fecha, estado) VALUES (?, ?, ?, ?)`, [paciente, medico, fecha, estado], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Registrar Historia
app.post('/api/historias', (req, res) => {
    const { paciente, diagnostico, tratamiento } = req.body;
    db.run(`INSERT INTO historias (paciente, diagnostico, tratamiento) VALUES (?, ?, ?)`, [paciente, diagnostico, tratamiento], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Registrar Informe
app.post('/api/informes', (req, res) => {
    const { paciente, contenido } = req.body;
    db.run(`INSERT INTO informes (paciente, contenido) VALUES (?, ?)`, [paciente, contenido], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Eliminar Registro Genérico
app.delete('/api/:tabla/:id', (req, res) => {
    const { tabla, id } = req.params;
    // Validar tablas permitidas por seguridad
    if (!['pacientes', 'citas', 'historias', 'informes'].includes(tabla)) {
        return res.status(400).json({ error: 'Tabla no válida' });
    }
    db.run(`DELETE FROM ${tabla} WHERE id = ?`, id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});