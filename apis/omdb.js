const axios = require('axios');
require('dotenv').config();

async function buscarPelicula(titulo) {
    try {
        const url = `http://www.omdbapi.com/?t=${encodeURIComponent(titulo)}&apikey=${process.env.OMDB_API_KEY}`;
        const response = await axios.get(url);
        return response.data; // Retorna sinopsis, año, actores, etc.
    } catch (error) {
        console.error("Error en OMDb:", error.message);
        return null;
    }
}
module.exports = { buscarPelicula };