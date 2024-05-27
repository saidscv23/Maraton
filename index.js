const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());

let carreraId = 1; // Contador para identificar cada carrera

function inicializar() {
    const carreras = readDatabase();
    if (carreras.length > 0) {
        carreraId = Math.max(...carreras.map(carrera => carrera.id)) + 1;
    }
}
// Inicializar carreraId al iniciar la aplicación
inicializar();

// Lee la base de datos y devuelve su contenido
function readDatabase() {
    const content = fs.readFileSync('carrera.json', 'utf-8');
    return JSON.parse(content);
}

// Escribe en la base de datos
function writeDatabase(data) {
    fs.writeFileSync('carrera.json', JSON.stringify(data, null, 2), 'utf-8');
}

//localhost:3000/carrera/1?numCorredores=5&distancia=10
app.post('/iniciar', (req, res) => {
    const numCorredores = parseInt(req.query.numCorredores);
    const distancia = parseFloat(req.query.distancia);

    if (isNaN(numCorredores) || isNaN(distancia)) {
        return res.status(400).send({ message: 'Por favor, ingrese un número válido de corredores y una distancia válida.' });
    }

    const corredores = [];
    for (let i = 0; i < numCorredores; i++) {
        corredores.push({
            id: i + 1,
            velocidad: +(Math.random() * 10 + 5).toFixed(2), // Convertir velocidad a número
            distanciaRecorrida: 0,
            tiempos: [] // Array para guardar los tiempos y distancias recorridas
        });
    }

    const carrera = {
        id: carreraId++, // Incrementar el contador y usar el nuevo ID
        distancia: distancia,
        corredores: corredores,
        tiempo: 0,
        finalizada: false
    };

    const carreras = readDatabase();
    carreras.push(carrera);
    writeDatabase(carreras);

    res.send({ message: 'Carrera iniciada', carrera });
});

//http://localhost:3000/simular/2

app.get('/simular/:id', (req, res) => {
    const idCarrera = parseInt(req.params.id);
    const carreras = readDatabase();
    const carrera = carreras.find(c => c.id === idCarrera);

    if (!carrera) {
        return res.status(404).send({ message: 'Carrera no encontrada' });
    }

    while (!carrera.finalizada) {
        carrera.tiempo++;
        carrera.corredores.forEach(corredor => {
            corredor.distanciaRecorrida += corredor.velocidad;
            corredor.tiempos.push({
                Tiempo: `Tiempo transcurrido: ${carrera.tiempo} horas`,
                distanciaRecorrida: corredor.distanciaRecorrida.toFixed(2)
            });
        });

        const corredoresEnMeta = carrera.corredores.filter(corredor => corredor.distanciaRecorrida >= carrera.distancia);
        if (corredoresEnMeta.length > 0) {
            carrera.finalizada = true;
            const ganador = corredoresEnMeta.reduce((a, b) => (a.distanciaRecorrida > b.distanciaRecorrida ? a : b));
            carrera.ganador = ganador.id;
            writeDatabase(carreras);
        }

        writeDatabase(carreras);
    }

    res.send({ message: `La carrera ha finalizado. El ganador es el corredor ${carrera.ganador}.`, carrera });
});



app.get('/estado/:id', (req, res) => {
    const idCarrera = parseInt(req.params.id);
    const carreras = readDatabase();
    const carrera = carreras.find(c => c.id === idCarrera);

    if (!carrera) {
        return res.status(404).send({ message: 'Carrera no encontrada' });
    }

    res.send(carrera);
});

//http://localhost:3000/eliminar/4

app.delete('/eliminar/:id', (req, res) => {
    const idCarrera = parseInt(req.params.id);
    let carreras = readDatabase();
    const carreraIndex = carreras.findIndex(c => c.id === idCarrera);

    if (carreraIndex !== -1) {
        carreras.splice(carreraIndex, 1);
        writeDatabase(carreras);
        res.json({ message: `Carrera con ID ${idCarrera} eliminada correctamente.` });
    } else {
        res.status(404).send({ message: 'No existe la carrera con el ID especificado.' });
    }
});




//http://localhost:3000/carrera?id=1numCorredores=10&distancia=10


app.put('/carrera/:id', (req, res) => {
    const idCarrera = parseInt(req.params.id);
    const numCorredores = parseInt(req.query.numCorredores);
    const distancia = parseFloat(req.query.distancia);

    if (isNaN(numCorredores) || isNaN(distancia)) {
        return res.status(400).send({ message: 'Por favor, ingrese un número válido de corredores y una distancia válida.' });
    }

    let carreras = readDatabase();
    const carreraIndex = carreras.findIndex(c => c.id === idCarrera);

    if (carreraIndex !== -1) {
        const corredores = [];
        for (let i = 0; i < numCorredores; i++) {
            corredores.push({
                id: i + 1,
                velocidad: +(Math.random() * 10 + 5).toFixed(2),
                distanciaRecorrida: 0,
                tiempos: []
            });
        }

        carreras[carreraIndex].corredores = corredores;
        carreras[carreraIndex].distancia = distancia;
        carreras[carreraIndex].finalizada = false;
        carreras[carreraIndex].tiempo = 0;
        carreras[carreraIndex].ganador = null;

        writeDatabase(carreras);
        res.json({ message: `Carrera con ID ${idCarrera} actualizada correctamente.`, carrera: carreras[carreraIndex] });
    } else {
        res.status(404).send({ message: 'No existe la carrera con el ID especificado.' });
    }
});





app.get('/carreras', (req, res) => {
    const carreras = readDatabase();
    res.json(carreras);
});










app.listen(3000, () => {
    console.log("Servidor escuchando en el puerto 3000");
});
