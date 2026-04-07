// aiGenerator V11 — FLUX (Pollinations) + Gemini Imagen 3 + Gemini Flash para Memorias
// 🔥 Motor dual: FLUX como primario (sin API key), Gemini como upgrade cuando haya key válida
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

/**
 * Genera un render con FLUX via Pollinations (sin API key)
 * Modelo: FLUX de Black Forest Labs — excelente para renders arquitectónicos
 * @param {string} prompt - El prompt completo
 * @returns {string|null} - URL de la imagen generada
 */
async function generarImagenFLUX(prompt) {
  try {
    // Truncar prompt — Pollinations funciona mejor con prompts cortos
    let p = prompt;
    if (p.length > 450) p = p.substring(0, 450);
    // Branding sutil
    p += ', professional architectural visualization, designed by StandMatch.com';
    
    // FLUX via Pollinations — 16:9 (1344x756)
    const encodedPrompt = encodeURIComponent(p);
    const seed = Math.floor(Math.random() * 999999);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1344&height=756&model=flux&seed=${seed}&nologo=true`;
    
    console.log('🎨 Generando render con FLUX (Pollinations)...');
    console.log('📝 Prompt length:', p.length, 'chars');
    console.log('📝 URL length:', url.length, 'chars');
    
    // Descargar la imagen completa como buffer y convertir a base64
    const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
    
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      console.log('✅ Render FLUX generado correctamente, size:', Math.round(buffer.length / 1024), 'KB');
      return `data:image/jpeg;base64,${base64}`;
    }
    
    console.error('⚠️ FLUX respondió:', response.status);
    return null;
  } catch (err) {
    console.error('❌ Error FLUX:', err.message);
    return null;
  }
}

/**
 * Genera un render con Gemini Imagen 3 (requiere API key válida)
 * @param {string} prompt - El prompt completo
 * @returns {string|null} - Base64 de la imagen o null
 */
async function generarImagenGemini(prompt) {
  if (!ai) return null;
  
  let promptFinal = prompt;
  if (promptFinal.length > 1500) promptFinal = promptFinal.substring(0, 1500);

  try {
    console.log('🎨 Intentando Gemini Imagen 3...');
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: promptFinal,
      config: { numberOfImages: 1, aspectRatio: '16:9' },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const imageBytes = response.generatedImages[0].image.imageBytes;
      console.log('✅ Render Gemini generado');
      return `data:image/png;base64,${imageBytes}`;
    }
    return null;
  } catch (err) {
    console.error('❌ Gemini Imagen 3 falló:', err.message);
    return null;
  }
}

/**
 * Motor principal: intenta Gemini primero, si falla usa FLUX
 */
export async function generarImagenIA(prompt) {
  // 1. Intentar Gemini si hay key
  if (ai) {
    const geminiResult = await generarImagenGemini(prompt);
    if (geminiResult) return { image: geminiResult, engine: 'gemini-imagen-3' };
  }
  
  // 2. Fallback a FLUX (siempre disponible)
  const fluxResult = await generarImagenFLUX(prompt);
  if (fluxResult) return { image: fluxResult, engine: 'flux-pollinations' };
  
  return null;
}

// Alias para compatibilidad
export { generarImagenIA as generarImagenGemini };

/**
 * Genera una memoria descriptiva con Gemini 2.0 Flash
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
 * Genera un render con retry automático (2 intentos)
 */
async function generarConRetry(prompt, label = '') {
  for (let intento = 1; intento <= 2; intento++) {
    console.log(`🎨 [${label}] Intento ${intento}/2...`);
    const result = await generarImagenIA(prompt);
    if (result) {
      console.log(`✅ [${label}] Render generado con ${result.engine}`);
      return result;
    }
    if (intento < 2) {
      console.log(`⚠️ [${label}] Falló, reintentando en 5s...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  console.error(`❌ [${label}] Falló tras 2 intentos`);
  return null;
}

/**
 * Genera los 3 renders para A/B/C — SECUENCIAL con delay
 * (Pollinations se satura con 3 simultáneas)
 */
export async function generar3Renders(prompts) {
  console.log('🎨🎨🎨 Generando 3 renders SECUENCIALES (evitar rate-limit)...');
  
  // Render A
  const renderA = await generarConRetry(prompts[0], 'PREMIUM');
  
  // Pausa 3s para no saturar
  await new Promise(r => setTimeout(r, 3000));
  
  // Render B
  const renderB = await generarConRetry(prompts[1], 'EQUILIBRADA');
  
  // Pausa 3s
  await new Promise(r => setTimeout(r, 3000));
  
  // Render C
  const renderC = await generarConRetry(prompts[2], 'ECONÓMICA');
  
  return {
    A: renderA ? renderA.image : null,
    B: renderB ? renderB.image : null,
    C: renderC ? renderC.image : null,
    engines: {
      A: renderA ? renderA.engine : 'failed',
      B: renderB ? renderB.engine : 'failed',
      C: renderC ? renderC.engine : 'failed',
    }
  };
}
