const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para procesar JSON y datos de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta actual
app.use(express.static(path.join(__dirname)));

// Configuración de la base de datos SQLite adaptada para Render con disco persistente
const dbPath = process.env.RENDER_DISK_PATH 
    ? path.join(process.env.RENDER_DISK_PATH, 'database.sqlite')
    : path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos SQLite:', err.message);
    } else {
        console.log(`Conectado a la base de datos SQLite en: ${dbPath}`);
    }
});

// Inicialización de tablas basadas en el sistema clínico
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        dni TEXT,
        edad INTEGER,
        ubicacion TEXT,
        tel TEXT,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        medico TEXT,
        appointment_date TEXT,
        modalidad TEXT,
        precio REAL,
        status TEXT DEFAULT 'Pendiente',
        FOREIGN KEY(patient_id) REFERENCES patients(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS clinical_histories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        diagnostico TEXT,
        tratamiento TEXT,
        FOREIGN KEY(patient_id) REFERENCES patients(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        contenido TEXT,
        FOREIGN KEY(patient_id) REFERENCES patients(id)
    )`);
});

// ==================== RUTAS DE LA API ====================

// --- PACIENTES ---
app.get('/api/patients', (req, res) => {
    db.all(`SELECT * FROM patients ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ patients: rows });
    });
});

app.post('/api/patients', (req, res) => {
    const { name, dni, edad, ubicacion, tel, email } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre es obligatorio.' });

    const query = `INSERT INTO patients (name, dni, edad, ubicacion, tel, email) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [name, dni, edad, ubicacion, tel, email], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Paciente registrado exitosamente.', id: this.lastID });
    });
});

app.put('/api/patients/:id', (req, res) => {
    const { id } = req.params;
    const { name, dni, edad, ubicacion, tel, email } = req.body;
    
    const query = `UPDATE patients SET name = ?, dni = ?, edad = ?, ubicacion = ?, tel = ?, email = ? WHERE id = ?`;
    db.run(query, [name, dni, edad, ubicacion, tel, email, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Paciente no encontrado.' });
        res.json({ message: 'Paciente actualizado exitosamente.' });
    });
});

app.delete('/api/patients/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM patients WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Paciente no encontrado.' });
        res.json({ message: 'Paciente eliminado exitosamente.' });
    });
});


// --- CONSULTAS ---
app.get('/api/appointments', (req, res) => {
    const query = `
        SELECT appointments.*, patients.name as patient_name 
        FROM appointments 
        LEFT JOIN patients ON appointments.patient_id = patients.id
        ORDER BY appointments.appointment_date DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ appointments: rows });
    });
});

app.post('/api/appointments', (req, res) => {
    const { patient_id, medico, appointment_date, modalidad, precio, status } = req.body;
    if (!patient_id || !appointment_date) return res.status(400).json({ error: 'Paciente y fecha son obligatorios.' });

    const query = `INSERT INTO appointments (patient_id, medico, appointment_date, modalidad, precio, status) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [patient_id, medico, appointment_date, modalidad, precio, status || 'Pendiente'], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Consulta agendada exitosamente.', id: this.lastID });
    });
});

app.delete('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM appointments WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Consulta no encontrada.' });
        res.json({ message: 'Consulta eliminada exitosamente.' });
    });
});


// --- HISTORIAS CLÍNICAS ---
app.get('/api/histories', (req, res) => {
    const query = `
        SELECT clinical_histories.*, patients.name as patient_name 
        FROM clinical_histories 
        LEFT JOIN patients ON clinical_histories.patient_id = patients.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ histories: rows });
    });
});

app.post('/api/histories', (req, res) => {
    const { patient_id, diagnostico, tratamiento } = req.body;
    const query = `INSERT INTO clinical_histories (patient_id, diagnostico, tratamiento) VALUES (?, ?, ?)`;
    db.run(query, [patient_id, diagnostico, tratamiento], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Historia clínica guardada exitosamente.', id: this.lastID });
    });
});

app.delete('/api/histories/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM clinical_histories WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Historia clínica no encontrada.' });
        res.json({ message: 'Historia clínica eliminada exitosamente.' });
    });
});


// --- INFORMES ---
app.get('/api/reports', (req, res) => {
    const query = `
        SELECT reports.*, patients.name as patient_name 
        FROM reports 
        LEFT JOIN patients ON reports.patient_id = patients.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ reports: rows });
    });
});

app.post('/api/reports', (req, res) => {
    const { patient_id, contenido } = req.body;
    const query = `INSERT INTO reports (patient_id, contenido) VALUES (?, ?)`;
    db.run(query, [patient_id, contenido], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Informe generado exitosamente.', id: this.lastID });
    });
});

app.delete('/api/reports/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM reports WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Informe no encontrado.' });
        res.json({ message: 'Informe eliminado exitosamente.' });
    });
});

// Ruta de diagnóstico / Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', uptime: process.uptime(), timestamp: new Date() });
});

// Redirección SPA para el Frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
// Middleware para procesar JSON y datos de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta actual
app.use(express.static(path.join(__dirname)));

// Configuración de la base de datos SQLite adaptada para Render
// En Render, si usas un disco persistente, puedes apuntar la ruta al directorio del disco montado (ej: /opt/render/project/data/database.sqlite).
// Si no usas disco, se guardará localmente pero se reiniciará en cada despliegue.
const dbPath = process.env.RENDER_DISK_PATH 
    ? path.join(process.env.RENDER_DISK_PATH, 'database.sqlite')
    : path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos SQLite:', err.message);
    } else {
        console.log(`Conectado a la base de datos SQLite en: ${dbPath}`);
    }
});

// Inicialización de tablas
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        appointment_date TEXT,
        notes TEXT,
        FOREIGN KEY(patient_id) REFERENCES patients(id)
    )`);
});

// Rutas de la API

// Obtener todos los pacientes
app.get('/api/patients', (req, res) => {
    const query = `SELECT * FROM patients ORDER BY created_at DESC`;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ patients: rows });
    });
});

// Registrar un nuevo paciente
app.post('/api/patients', (req, res) => {
    const { name, email, phone } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'El nombre es obligatorio.' });
    }

    const query = `INSERT INTO patients (name, email, phone) VALUES (?, ?, ?)`;
    db.run(query, [name, email, phone], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ 
            message: 'Paciente registrado exitosamente.',
            id: this.lastID 
        });
    });
});

// Obtener citas médicas
app.get('/api/appointments', (req, res) => {
    const query = `
        SELECT appointments.*, patients.name as patient_name 
        FROM appointments 
        LEFT JOIN patients ON appointments.patient_id = patients.id
        ORDER BY appointments.appointment_date DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ appointments: rows });
    });
});

// Crear una nueva cita
app.post('/api/appointments', (req, res) => {
    const { patient_id, appointment_date, notes } = req.body;
    if (!patient_id || !appointment_date) {
        return res.status(400).json({ error: 'Paciente y fecha son obligatorios.' });
    }

    const query = `INSERT INTO appointments (patient_id, appointment_date, notes) VALUES (?, ?, ?)`;
    db.run(query, [patient_id, appointment_date, notes], function(err) {
        if (err) {
            return res.status(500).json({ error: err.info || err.message });
        }
        res.json({ 
            message: 'Cita agendada exitosamente.',
            id: this.lastID 
        });
    });
});

// Ruta de diagnóstico para verificar el estado en Render
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', uptime: process.uptime(), timestamp: new Date() });
});

// Ruta principal para manejar la SPA (Single Page Application) o index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor escuchando en el puerto asignado por Render (process.env.PORT)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
