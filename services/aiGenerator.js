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
    console.error('⚠️ GEMINI_API_KEY no configurada. Value:', process.env.GEMINI_API_KEY ? 'SET' : 'MISSING');
    return null;
  }

  // Imagen 3 tiene límite de ~480 caracteres de prompt efectivo
  // Truncamos inteligentemente si es muy largo
  let promptFinal = prompt;
  if (promptFinal.length > 1500) {
    promptFinal = promptFinal.substring(0, 1500);
    console.log('⚠️ Prompt truncado a 1500 chars');
  }

  try {
    console.log('🎨 Generando render con Gemini Imagen 3...');
    console.log('📝 Prompt length:', promptFinal.length, 'chars');
    console.log('📝 Prompt preview:', promptFinal.substring(0, 200) + '...');
    
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: promptFinal,
      config: {
        numberOfImages: 1,
        aspectRatio: '16:9',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const imageBytes = response.generatedImages[0].image.imageBytes;
      console.log('✅ Render generado correctamente, bytes:', imageBytes?.length || 0);
      return `data:image/png;base64,${imageBytes}`;
    }
    
    console.error('⚠️ No se generó ninguna imagen. Response:', JSON.stringify(response).substring(0, 500));
    return null;
  } catch (err) {
    console.error('❌ Error Gemini Imagen 3:', err.message || err);
    console.error('❌ Stack:', err.stack);
    console.error('❌ Full error:', JSON.stringify(err, null, 2).substring(0, 1000));
    
    // Retry con prompt simplificado
    try {
      console.log('🔄 Reintentando con prompt simplificado...');
      const simplePrompt = 'A photorealistic 8k render of a modern exhibition trade show booth, professional lighting, architectural photography, clean design, high quality';
      const retryResponse = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: simplePrompt,
        config: { numberOfImages: 1, aspectRatio: '16:9' },
      });
      if (retryResponse.generatedImages && retryResponse.generatedImages.length > 0) {
        console.log('✅ Retry exitoso');
        return `data:image/png;base64,${retryResponse.generatedImages[0].image.imageBytes}`;
      }
    } catch (retryErr) {
      console.error('❌ Retry también falló:', retryErr.message);
    }
    
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
