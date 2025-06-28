const express = require('express');
const fetch = require('node-fetch');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

//Middleware para parsear JSON y permitir CORS
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});

//Servir archivos estáticos desde el directorio actual
app.use(express.static(path.join(__dirname)));

//Ruta principal: devuelve trustpilot18.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'trustpilot18.html'));
});

//Proxy para obtener HTML de Trustpilot
app.get('/proxy', async (req, res) => {
    try {
        console.log('Iniciando solicitud a Trustpilot...');
        const response = await fetch('https://es.trustpilot.com/review/www.crealsa.es', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error(`Error al obtener la página. Código: ${response.status}`);
            return res.status(response.status).send(`Error: ${response.status}`);
        }

        const html = await response.text();
        console.log('HTML obtenido con éxito.');
        res.send(html);

    } catch (error) {
        console.error('Error al obtener la página:', error);
        res.status(500).send('Error interno');
    }
});

//Endpoint para ejecutar el script de Python
app.post('/enviar-a-python', (req, res) => {
    const clases = req.body;
    console.log("Python está trabajando.\nRecibido del cliente:", clases);

    const py = spawn('python', ['procesar.py']);

    let output = '';
    py.stdout.on('data', (data) => {
        output += data.toString();
    });

    py.stderr.on('data', (data) => {
        console.error("Error en Python:", data.toString());
    });

    py.on('close', (code) => {
        console.log(`Python finalizó con código ${code}`);
        res.json({ resultado: output.trim() });
    });

    py.stdin.write(JSON.stringify(clases));
    py.stdin.end();
});

//Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor Express activo en http://localhost:${PORT}`);
    console.log(`Abre http://localhost:${PORT}/ para ver trustpilot18.html`);
});
