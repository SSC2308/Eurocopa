const express = require('express');
const sql = require('mssql');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('views'));
app.use(express.static("public"));

const dbConfig = {
  user: 'usersql',
  password: 'root1',
  server: 'localhost',
  port: 1433,
  database: 'Eurocopa_db',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

app.get('/leerPartidosPorEquipo/:equipoId', async (req, res) => {
  const equipoId = req.params.equipoId;

  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request()
        .input('equipoId', sql.Int, equipoId)
        .query(`SELECT Partidos.id, EquipoLocal.pais AS equipo_local, EquipoLocal.logo AS equipo_local_logo, EquipoVisitante.pais AS equipo_visitante,  EquipoVisitante.logo AS equipo_visitante_logo, 
                        Partidos.goles_local, Partidos.goles_visitante, Partidos.fecha
                    FROM Partidos 
                    INNER JOIN  Equipos AS EquipoLocal ON Partidos.equipo_local = EquipoLocal.id 
                    INNER JOIN Equipos AS EquipoVisitante ON Partidos.equipo_visitante = EquipoVisitante.id 
                    WHERE Partidos.equipo_local = @equipoId OR Partidos.equipo_visitante = @equipoId`);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al leer los partidos por equipo');
  }
});


app.post('/crearEquipo', async (req, res) => {
  const { nombre, pais, entrenador } = req.body;
  try {
    let pool = await sql.connect(dbConfig);
    await pool.request()
        .input('pais', sql.NVarChar, nombre)
        .input('grupo', sql.NVarChar, pais)
        .input('entrenador', sql.NVarChar, entrenador)
        .query('INSERT INTO Equipos (nombre, pais, entrenador) VALUES (@pais, @grupo, @entrenador)');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al crear el equipo');
  }
});

app.post('/crearPartido', async (req, res) => {
  try {
    const { equipoLocal, equipoVisitante, golesLocal, golesVisitante } = req.body;

    let pool = await sql.connect(dbConfig);
    await pool.request()
        .input('equipoLocal', sql.Int, equipoLocal)
        .input('equipoVisitante', sql.Int, equipoVisitante)
        .input('golesLocal', sql.Int, golesLocal)
        .input('golesVisitante', sql.Int, golesVisitante)
        .query('INSERT INTO Partidos (equipo_local, equipo_visitante, goles_local, goles_visitante, fecha) VALUES (@equipoLocal, @equipoVisitante, @golesLocal, @golesVisitante, GETDATE())');
    await pool.request()
        .input('equipoLocal', sql.Int, equipoLocal)
        .input('equipoVisitante', sql.Int, equipoVisitante)
        .input('golesLocal', sql.Int, golesLocal)
        .input('golesVisitante', sql.Int, golesVisitante)
        .query('UPDATE Equipos SET goles_marcados = goles_marcados + @golesLocal, goles_recibidos = goles_recibidos + @golesVisitante WHERE id = @equipoLocal; UPDATE Equipos SET goles_marcados = goles_marcados + @golesVisitante, goles_recibidos = goles_recibidos + @golesLocal WHERE id = @equipoVisitante;');
    res.status(200).json({ message: 'Partido creado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al crear el partido');
  }
});

app.get('/leerEquipos', async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request().query('SELECT * FROM Equipos');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al leer los equipos');
  }
});

app.get('/leerEquiposPorGrupo/:grupo', async (req, res) => {
  const grupo = req.params.grupo;
  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request()
        .input('grupo', sql.NVarChar, grupo)
        .query('SELECT * FROM Equipos WHERE grupo = @grupo');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al leer los equipos por grupo');
  }
});

app.get('/leerEquipo/:id', async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('SELECT * FROM Equipos WHERE id = @id');
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al leer el equipo');
  }
});

app.post('/actualizarEquipo', async (req, res) => {
  const { id, pais, grupo, entrenador } = req.body;
  try {
    let pool = await sql.connect(dbConfig);
    await pool.request()
        .input('id', sql.Int, id)
        .input('pais', sql.NVarChar, pais)
        .input('grupo', sql.NVarChar, grupo)
        .input('entrenador', sql.NVarChar, entrenador)
        .query('UPDATE Equipos SET pais = @pais, grupo = @grupo, entrenador = @entrenador WHERE id = @id');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar el equipo');
  }
});

app.post('/eliminarEquipo', async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    await pool.request()
        .input('id', sql.Int, req.body.id)
        .query('DELETE FROM Equipos WHERE id = @id');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar el equipo');
  }
});

app.listen(port, () => {

});
