const axios = require('axios');
require('dotenv').config();

async function buscarImagenes(titulo) {
    try {
        // Primero buscamos el ID de la película
        const searchUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(titulo)}&api_key=${process.env.TMDB_API_KEY}&language=es-ES`;
        const searchRes = await axios.get(searchUrl);
        
        if (searchRes.data.results.length > 0) {
            const movieId = searchRes.data.results[0].id;
            // Con el ID, buscamos las imágenes (backdrops y posters)
            const imgUrl = `https://api.themoviedb.org/3/movie/${movieId}/images?api_key=${process.env.TMDB_API_KEY}`;
            const imgRes = await axios.get(imgUrl);
            
            // Retornamos la URL completa de la mejor imagen
            if (imgRes.data.posters && imgRes.data.posters.length > 0) {
    return `https://image.tmdb.org/t/p/w500${imgRes.data.posters[0].file_path}`;
} else if (imgRes.data.backdrops && imgRes.data.backdrops.length > 0) {
    return `https://image.tmdb.org/t/p/w500${imgRes.data.backdrops[0].file_path}`;
}
return 'https://via.placeholder.com/500x750?text=Sin+Imagen';
        }
        return null;
    } catch (error) {
        console.error("Error en TMDB:", error.message);
        return null;
    }
}
module.exports = { buscarImagenes };