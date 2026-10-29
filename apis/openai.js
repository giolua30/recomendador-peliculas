const axios = require('axios');
require('dotenv').config();

async function generarResena(titulo, sinopsis) {
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "openai/gpt-oss-120b",
            messages: [{ 
                role: "user", 
                content: `Actúa como un crítico de cine. Escribe una reseña profesional, emotiva y breve (máximo 2 párrafos) sobre la película "${titulo}". 
                
                Instrucciones importantes:
                1. Si la sinopsis contiene temas sensibles (violencia, abuso, etc.), NO los describas explícitamente. Enfócate en el mensaje de la película, la actuación y la dirección.
                2. Escribe la reseña directamente en español.
                3. No incluyas advertencias de que eres una IA.

                Aquí tienes un resumen de la trama para que te inspires (no lo copies literal): "${sinopsis}".` 
            }],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error en Groq (Reseña):", error.message);
        return "No se pudo generar la reseña en este momento.";
    }
}

module.exports = { generarResena };