const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5432;

// Servir archivos estáticos (HTML, CSS, JS) desde la carpeta actual o 'public'
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
