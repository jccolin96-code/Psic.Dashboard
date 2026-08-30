const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5432;

app.use(cors());
app.use(packege.json());
app.use(express.static(path.join(__dirname))); 

// CONFIGURACIÓN PARA RENDER:
// Si usas un Disco Persistente en Render, por lo general se monta en una ruta como '/data'.
// Verificamos si existe esa carpeta; si no, guardamos la BD localmente (para cuando pruebes en tu PC).
const dataDir = process.env.RENDER ? '/data' : __dirname;

if (process.env.RENDER && !fs.existsSync(dataDir)) {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
    } catch (err) {
        console.log("No se pudo crear la carpeta /data, usando directorio local.");
    }
}

const dbFile = path.join(dataDir, 'psic_dashboard');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err.message);
    } else {
        console.log(`Conectado a la base de datos en: ${dbFile}`);
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

app.post('/api/pacientes', (req, res) => {
    const { nombre, dni, tel, email } = req.body;
    db.run(`INSERT INTO pacientes (nombre, dni, tel, email) VALUES (?, ?, ?, ?)`, [nombre, dni, tel, email], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.post('/api/citas', (req, res) => {
    const { paciente, medico, fecha, estado } = req.body;
    db.run(`INSERT INTO citas (paciente, medico, fecha, estado) VALUES (?, ?, ?, ?)`, [paciente, medico, fecha, estado], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.post('/api/historias', (req, res) => {
    const { paciente, diagnostico, tratamiento } = req.body;
    db.run(`INSERT INTO historias (paciente, diagnostico, tratamiento) VALUES (?, ?, ?)`, [paciente, diagnostico, tratamiento], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.post('/api/informes', (req, res) => {
    const { paciente, contenido } = req.body;
    db.run(`INSERT INTO informes (paciente, contenido) VALUES (?, ?)`, [paciente, contenido], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.delete('/api/:tabla/:id', (req, res) => {
    const { tabla, id } = req.params;
    if (!['pacientes', 'citas', 'historias', 'informes'].includes(tabla)) {
        return res.status(400).json({ error: 'Tabla no válida' });
    }
    db.run(`DELETE FROM ${tabla} WHERE id = ?`, id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
