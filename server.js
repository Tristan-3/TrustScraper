const express = require('express');
const fetch = require('node-fetch');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

//Valor inicial de la URL (por defecto)
let currentUrl = 'https://es.trustpilot.com/review/aplazame.com';

app.use(express.json());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'trustscraper.html'));
});

//Endpoint para establecer nueva URL
app.post('/set-url', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).send("URL inválida");
    currentUrl = url;
    console.log("URL actualizada a:", currentUrl);
    res.sendStatus(200);
});

//Proxy dinámico
app.get('/proxy', async (req, res) => {
    try {
        console.log('Obteniendo HTML desde:', currentUrl);
        const response = await fetch(currentUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        if (!response.ok) {
            console.error(`Error al obtener la página. Código: ${response.status}`);
            return res.status(response.status).send(`Error: ${response.status}`);
        }

        const html = await response.text();
        res.send(html);

    } catch (error) {
        console.error('Error al obtener la página:', error);
        res.status(500).send('Error interno');
    }
});

//Ejecutar script Python con URL + clases
app.post('/enviar-a-python', (req, res) => {
    const clases = req.body;
    console.log("Scraping solicitado. Clases recibidas:", clases);

    const py = spawn('python', ['procesar.py']);
    const datos = {
        url: currentUrl,
        clases: clases
    };

    let output = '';
    py.stdout.on('data', data => output += data.toString());
    py.stderr.on('data', data => console.error("Error en Python:", data.toString()));
    py.on('close', code => {
        console.log(`Python terminó con código ${code}`);
        res.json({ resultado: output.trim() });
    });

    py.stdin.write(JSON.stringify(datos));
    py.stdin.end();
});

app.listen(PORT, () => {
    console.log(`Servidor Express activo en http://localhost:${PORT}`);
});
