const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const { generarResena } = require('./apis/openai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function consultarGroq(prompt) {
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        }, {
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            timeout: 10000
        });
        return response.data.choices[0].message.content.trim();
    } catch (error) { throw new Error("IA_ERROR"); }
}

app.get('/api/buscar', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);
    try {
        const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&api_key=${process.env.TMDB_API_KEY}&language=es-ES`;
        const response = await axios.get(url);
        const resultados = response.data.results.slice(0, 10).map(peli => ({
            id: peli.id, titulo: peli.title, anio: peli.release_date ? peli.release_date.split('-')[0] : 'N/A',
            imagen: peli.poster_path ? `https://image.tmdb.org/t/p/w200${peli.poster_path}` : 'https://via.placeholder.com/200x300?text=Sin+Imagen'
        }));
        res.json(resultados);
    } catch (error) { res.status(500).json({ error: "Error al buscar" }); }
});

// RUTA ACTUALIZADA: Acepta filtro por género
app.get('/api/seccion/:tipo', async (req, res) => {
    const tipo = req.params.tipo; 
    const genero = req.query.genero;
    let endpoint = '';

    if (genero) {
        // Si hay género, buscamos por descubrimiento
        endpoint = `/discover/movie?with_genres=${genero}&sort_by=popularity.desc`;
    } else {
        // Si no, cargamos las secciones por defecto
        if (tipo === 'tendencias') endpoint = '/trending/movie/week?';
        if (tipo === 'top') endpoint = '/movie/top_rated?';
        if (tipo === 'estrenos') endpoint = '/movie/upcoming?';
    }

    try {
        // Aseguramos el idioma y la API KEY
        const separador = endpoint.includes('?') ? '&' : '?';
        const url = `https://api.themoviedb.org/3${endpoint}${separador}api_key=${process.env.TMDB_API_KEY}&language=es-ES&page=1`;
        
        const response = await axios.get(url);
        
        const peliculas = response.data.results.slice(0, 10).map(peli => ({
            id: peli.id,
            titulo: peli.title,
            imagen: peli.poster_path ? `https://image.tmdb.org/t/p/w500${peli.poster_path}` : 'https://via.placeholder.com/500x750?text=Sin+Imagen',
            backdrop: peli.backdrop_path ? `https://image.tmdb.org/t/p/original${peli.backdrop_path}` : null,
            anio: peli.release_date ? peli.release_date.split('-')[0] : 'N/A',
            generos: peli.genre_ids, // Enviamos los IDs de género por si los necesitamos
            calificacion: peli.vote_average ? peli.vote_average.toFixed(1) : 'N/A'
        }));
        res.json(peliculas);
    } catch (error) { res.status(500).json({ error: "Error al cargar sección" }); }
});

app.get('/api/aleatoria', async (req, res) => {
    try {
        const paginaAleatoria = Math.floor(Math.random() * 500) + 1;
        const url = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&language=es-ES&page=${paginaAleatoria}`;
        const response = await axios.get(url);
        const pelis = response.data.results;
        const peliAleatoria = pelis[Math.floor(Math.random() * pelis.length)];
        res.json({ id: peliAleatoria.id });
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

app.get('/api/pelicula/detalles/:id', async (req, res) => {
    const tmdbId = req.params.id;
    try {
        const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=es-ES&append_to_response=videos,watch/providers,credits`;
        const response = await axios.get(url);
        const peli = response.data;

        let actoresEs = '';
        if (peli.credits && peli.credits.cast) actoresEs = peli.credits.cast.slice(0, 5).map(a => a.name).join(', ');

        let trailerKey = null;
        if (peli.videos && peli.videos.results) {
            const trailer = peli.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
            if (trailer) trailerKey = trailer.key;
        }

        const providers = peli['watch/providers']?.results?.['PE'] || null;
        let streamingInfo = null;
        if (providers) streamingInfo = { flatrate: providers.flatrate ? providers.flatrate.map(p => p.provider_name) : [], rent: providers.rent ? providers.rent.map(p => p.provider_name) : [] };

        const resena = await generarResena(peli.title, peli.overview || 'Sin sinopsis');

        res.json({
            id: peli.id, titulo: peli.title, anio: peli.release_date ? peli.release_date.split('-')[0] : 'N/A',
            genero: peli.genres.map(g => g.name).join(', '), sinopsis: peli.overview || 'No disponible', actores: actoresEs,
            imagen: peli.poster_path ? `https://image.tmdb.org/t/p/w500${peli.poster_path}` : 'https://via.placeholder.com/500x750?text=Sin+Imagen',
            calificacion: peli.vote_average ? peli.vote_average.toFixed(1) : 'N/A',
            trailerKey: trailerKey, streaming: streamingInfo, resenaIA: resena

        });
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

app.post('/api/preguntar', async (req, res) => {
    try {
        const respuestaIA = await consultarGroq(`Actúa como un crítico de cine y experto en películas. Responde de forma amigable a: "${req.body.pregunta}"`);
        res.json({ respuesta: respuestaIA });
    } catch (error) { res.status(503).json({ respuesta: "IA ocupada." }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});