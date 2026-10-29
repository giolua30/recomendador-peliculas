const { buscarPelicula } = require('./apis/omdb');
const { buscarImagenes } = require('./apis/tmdb');
const { generarResena } = require('./apis/openai');

async function probarConsola() {
    const titulo = "Inception"; // Prueba con la que quieras
    console.log(`🔍 Buscando: ${titulo}...`);

    const datos = await buscarPelicula(titulo);
    console.log("✅ Datos OMDb:", datos.Title);

    const imagen = await buscarImagenes(titulo);
    console.log("✅ Imagen TMDB:", imagen);

    const resena = await generarResena(titulo, datos.Plot);
    console.log("✅ Reseña OpenAI:", resena.substring(0, 50) + "...");
}

probarConsola();