const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5432;

// Middlewares esenciales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Conexión a SQLite (si usas un disco persistente en Render, puedes apuntar a esa ruta ej: /opt/render/project/data/database.sqlite)
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// Crear tablas si no existen
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS pacientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        dni TEXT,
        edad TEXT,
        ubicacion TEXT,
        tel TEXT,
        email TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS consultas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente TEXT,
        medico TEXT,
        fecha TEXT,
        modalidad TEXT,
        precio REAL,
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

// --- RUTAS API ---

// 1. PACIENTES
app.get('/api/pacientes', (req, res) => {
    db.all(`SELECT * FROM pacientes`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/pacientes', (req, res) => {
    const { nombre, dni, edad, ubicacion, tel, email } = req.body;
    const query = `INSERT INTO pacientes (nombre, dni, edad, ubicacion, tel, email) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [nombre, dni, edad, ubicacion, tel, email], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, success: true });
    });
});

app.delete('/api/pacientes/:id', (req, res) => {
    db.run(`DELETE FROM pacientes WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// 2. CONSULTAS
app.get('/api/consultas', (req, res) => {
    db.all(`SELECT * FROM consultas`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/consultas', (req, res) => {
    const { paciente, medico, fecha, modalidad, precio, estado } = req.body;
    const query = `INSERT INTO consultas (paciente, medico, fecha, modalidad, precio, estado) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [paciente, medico, fecha, modalidad, precio, estado], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, success: true });
    });
});

app.delete('/api/consultas/:id', (req, res) => {
    db.run(`DELETE FROM consultas WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// 3. HISTORIAS
app.get('/api/historias', (req, res) => {
    db.all(`SELECT * FROM historias`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/historias', (req, res) => {
    const { paciente, diagnostico, tratamiento } = req.body;
    const query = `INSERT INTO historias (paciente, diagnostico, tratamiento) VALUES (?, ?, ?)`;
    db.run(query, [paciente, diagnostico, tratamiento], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, success: true });
    });
});

app.delete('/api/historias/:id', (req, res) => {
    db.run(`DELETE FROM historias WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// 4. INFORMES
app.get('/api/informes', (req, res) => {
    db.all(`SELECT * FROM informes`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/informes', (req, res) => {
    const { paciente, contenido } = req.body;
    const query = `INSERT INTO informes (paciente, contenido) VALUES (?, ?)`;
    db.run(query, [paciente, contenido], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, success: true });
    });
});

app.delete('/api/informes/:id', (req, res) => {
    db.run(`DELETE FROM informes WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
