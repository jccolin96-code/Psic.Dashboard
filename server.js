const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
// Render asigna un puerto automático con process.env.PORT, si no usa el 3000 localmente
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Sirve los archivos estáticos (como tu index.html, CSS y JS del frontend)
app.use(express.static(path.join(__dirname)));

// ==========================================
// CONFIGURACIÓN DE LA BASE DE DATOS SQLITE
// ==========================================
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con SQLite', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// Crear tablas automáticamente si no existen
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS pacientes (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, dni TEXT, tel TEXT, email TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS citas (id INTEGER PRIMARY KEY AUTOINCREMENT, paciente TEXT, medico TEXT, fecha TEXT, estado TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS historias (id INTEGER PRIMARY KEY AUTOINCREMENT, paciente TEXT, diagnostico TEXT, tratamiento TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS informes (id INTEGER PRIMARY KEY AUTOINCREMENT, paciente TEXT, contenido TEXT)`);
});

// ==========================================
// ENDPOINTS DE LA API
// ==========================================

// Obtener toda la información de las tablas para el frontend
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

// Guardar Paciente
app.post('/api/pacientes', (req, res) => {
    const { nombre, dni, tel, email } = req.body;
    db.run(`INSERT INTO pacientes (nombre, dni, tel, email) VALUES (?, ?, ?, ?)`, [nombre, dni, tel, email], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Guardar Cita
app.post('/api/citas', (req, res) => {
    const { paciente, medico, fecha, estado } = req.body;
    db.run(`INSERT INTO citas (paciente, medico, fecha, estado) VALUES (?, ?, ?, ?)`, [paciente, medico, fecha, estado], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Guardar Historia Clínica
app.post('/api/historias', (req, res) => {
    const { paciente, diagnostico, tratamiento } = req.body;
    db.run(`INSERT INTO historias (paciente, diagnostico, tratamiento) VALUES (?, ?, ?)`, [paciente, diagnostico, tratamiento], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Guardar Informe
app.post('/api/informes', (req, res) => {
    const { paciente, contenido } = req.body;
    db.run(`INSERT INTO informes (paciente, contenido) VALUES (?, ?)`, [paciente, contenido], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Eliminar un registro de cualquier tabla de forma segura
app.delete('/api/:tabla/:id', (req, res) => {
    const { tabla, id } = req.params;
    const tablasPermitidas = ['pacientes', 'citas', 'historias', 'informes'];
    if (!tablasPermitidas.includes(tabla)) {
        return res.status(400).json({ error: "Tabla no válida" });
    }

    db.run(`DELETE FROM ${tabla} WHERE id = ?`, id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// Ruta principal para asegurar que cargue el index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor escuchando el puerto de Render
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
