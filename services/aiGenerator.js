import { GoogleGenerativeAI } from '@google/generative-ai';
import { generarPromptIngles } from './promptEngine.js';
import dotenv from 'dotenv';
dotenv.config();

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export async function generarMemoriaIA(briefingData, cotizacion) {
  let textoMemoria = `El stand detectado tiene ${briefingData.m2 || 0}m² y un sistema base de presupuestación inicial. 
  Por favor, configura tu API Key de Gemini en el archivo .env del servidor para generar memorias descriptivas comerciales personalizadas con IA.`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `Eres un arquitecto experto en ferias. Redacta una memoria descriptiva COMERCIAL en español para el cliente 
      sobre su stand V10. 
      - Superficie: ${briefingData.m2 || 20}m2
      - Pide Tarima: ${briefingData.tipoSuelo || 'Ninguno especial'}
      - Tiene Muretes: ${briefingData.tieneMuretes ? 'Sí' : 'No'}
      Redacta dos párrafos muy persuasivos resaltando el diseño y el uso del espacio sin mencionar el precio exacto.`;

      const result = await model.generateContent(prompt);
      textoMemoria = result.response.text();
    } catch (error) {
      console.error("⚠️ Error contactando con Gemini Text:", error);
    }
  }

  return { texto: textoMemoria };
}

export async function generarImagenMvpIA(briefingData) {
  try {
    const aiPrompt = generarPromptIngles(briefingData);
    console.log("🎨 Solicitando render a IA:", aiPrompt);
    
    // MVP: Usar Pollinations AI - URL API libre de generación de imágenes basada en Prompt
    const seed = Math.floor(Math.random() * 999999);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=1024&height=576&nologo=true&seed=${seed}`;
    
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;

  } catch(err) {
    console.error("⚠️ Fallo en generación de imagen MVP:", err);
    return null;
  }
}
