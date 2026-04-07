// aiGenerator V11 — Gemini Imagen 3 + Gemini 2.0 Flash para Memorias
// 🔥 REGLA: Usar Gemini Imagen 3 para renders, NUNCA Pollinations
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

/**
 * Genera un render con Gemini Imagen 3
 * @param {string} prompt - El prompt completo y detallado del briefing
 * @returns {string|null} - Base64 de la imagen o null si falla
 */
export async function generarImagenGemini(prompt) {
  if (!ai) {
    console.error('⚠️ GEMINI_API_KEY no configurada');
    return null;
  }

  try {
    console.log('🎨 Generando render con Gemini Imagen 3...');
    console.log('📝 Prompt length:', prompt.length, 'chars');
    
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '16:9',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const imageBytes = response.generatedImages[0].image.imageBytes;
      console.log('✅ Render generado correctamente');
      return `data:image/png;base64,${imageBytes}`;
    }
    
    console.error('⚠️ No se generó ninguna imagen');
    return null;
  } catch (err) {
    console.error('❌ Error Gemini Imagen 3:', err.message || err);
    return null;
  }
}

/**
 * Genera una memoria descriptiva con Gemini 2.0 Flash
 * @param {object} briefingData - Datos del briefing
 * @param {object} cotizacion - Cotización calculada
 * @param {string} nivel - A, B o C
 * @returns {object} - { titulo, texto }
 */
export async function generarMemoriaIA(briefingData, cotizacion, nivel = 'B') {
  const nivelLabels = { A: 'Premium', B: 'Equilibrada', C: 'Económica' };
  const nivelLabel = nivelLabels[nivel] || 'Equilibrada';
  
  let textoMemoria = `Stand de ${briefingData.m2 || 0}m² para ${briefingData.empresa || 'la empresa'}. Propuesta ${nivelLabel}.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Eres un arquitecto experto en diseño de stands feriales de alto nivel. 
Redacta una memoria descriptiva COMERCIAL en español para el cliente sobre su stand.
Propuesta nivel: ${nivelLabel} (${nivel})
Empresa: ${briefingData.empresa || 'N/A'}
Feria: ${briefingData.feria || 'N/A'} en ${briefingData.ciudad || 'N/A'}
Superficie: ${briefingData.m2 || 20}m²
Sistema: ${briefingData.sistema || 'custom'}
Configuración: ${briefingData.config || 'EN_U'}
Altura paredes: ${briefingData.altura || 3}m
Presupuesto total sin IVA: ${cotizacion?.totalSinIva ? Math.round(cotizacion.totalSinIva) + '€' : 'en cálculo'}
Número de partidas: ${cotizacion?.items?.length || 0}

INSTRUCCIONES:
- Redacta 2-3 párrafos persuasivos y descriptivos
- NO menciones precios exactos, solo sensación de valor
- Si es Premium (A): enfatiza materiales de lujo, iluminación dramática, impacto visual
- Si es Equilibrada (B): enfatiza relación calidad-precio, profesionalidad, inteligencia del diseño  
- Si es Económica (C): enfatiza eficiencia, funcionalidad, aprovechamiento del espacio
- Usa un tono comercial de alto nivel, como una agencia de diseño premium
- Menciona elementos específicos del briefing si los hay`,
      });
      
      textoMemoria = response.text;
    } catch (error) {
      console.error('⚠️ Error Gemini Text:', error.message || error);
    }
  }

  return { 
    titulo: `Propuesta ${nivel} — ${nivelLabel}`,
    texto: textoMemoria 
  };
}

/**
 * Genera los 3 renders para las 3 propuestas A/B/C en paralelo
 * @param {string[]} prompts - Array de 3 prompts (A, B, C)
 * @returns {object} - { A: base64, B: base64, C: base64 }
 */
export async function generar3Renders(prompts) {
  console.log('🎨🎨🎨 Generando 3 renders en paralelo...');
  
  const [renderA, renderB, renderC] = await Promise.allSettled([
    generarImagenGemini(prompts[0]),
    generarImagenGemini(prompts[1]),
    generarImagenGemini(prompts[2]),
  ]);

  return {
    A: renderA.status === 'fulfilled' ? renderA.value : null,
    B: renderB.status === 'fulfilled' ? renderB.value : null,
    C: renderC.status === 'fulfilled' ? renderC.value : null,
  };
}
