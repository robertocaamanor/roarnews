
import { GoogleGenAI } from "@google/genai";
import { ArticleData } from "../types";

// Always initialize with the named parameter 'apiKey' and use process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateArticle = async (
  sources: string[], 
  tone: string, 
  criticalContext?: string
): Promise<ArticleData & { groundingSources?: any[] }> => {
  // Filter out empty sources
  const validSources = sources.filter(s => s.trim().length > 0);
  const sourcesText = validSources.map((s, i) => `Fuente ${i + 1}: ${s}`).join('\n\n');

  const criticalInstruction = criticalContext 
    ? `\n\nATENCIÓN: Dado que el tono es crítico/analítico, utiliza este CONTEXTO ESPECÍFICO para el análisis: "${criticalContext}". El artículo debe girar en torno a este ángulo crítico.`
    : "";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Eres un periodista de investigación senior. Tu objetivo es redactar una noticia profesional y verídica basada en la información proporcionada en las fuentes.

               FUENTES DE INFORMACIÓN:
               ${sourcesText}

               INSTRUCCIONES DE REDACCIÓN:
               1. ANALIZA las fuentes y utiliza 'googleSearch' para ampliar el contexto.
               2. ESTRUCTURA: Título, Bajada y Cuerpo (H2/H3).
               3. ESTILO: "${tone}". Periodismo moderno, voz activa.${criticalInstruction}
               4. EXTENSIÓN: 350-600 palabras.
               5. BÚSQUEDA DE IMÁGENES: Define 3 términos de búsqueda (keywords) exactos y optimizados para Google Images que permitan encontrar la fotografía principal perfecta para esta noticia. Deben ser específicos (incluyendo nombres, lugares y contexto).
               6. IDIOMA: Español.

               FORMATO DE SALIDA (JSON):
               - title: Titular en sentence case. REGLA CRÍTICA: La primera palabra va en mayúscula. TODOS los nombres propios (personas, lugares, marcas, programas, instituciones) DEBEN escribirse con su mayúscula inicial correcta. Ejemplo correcto: "Vasco Moulian y Faloon Larraguibel protagonizan cruce en 'Fiebre de baile'". NUNCA escribas un nombre propio en minúscula.
               - subtitle: Bajada.
               - body: Cuerpo en Markdown.
               - seo: titleTag (MÁXIMO 60 caracteres, Yoast SEO lo exige), metaDescription (MÁXIMO 155 caracteres, Yoast SEO lo exige; resumen atractivo y completo dentro del límite), keywords (array), slug.
               - instagramSummary: JSON array con exactamente 3 strings, uno por párrafo.
               - microblogSummary: Resumen corto.
               - imageSearchQueries: Array de 3 strings con términos de búsqueda específicos.`,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  const text = response.text.trim();
  const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

  // Extract JSON from the response robustly (handles markdown code fences)
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  const jsonString = start !== -1 && end !== -1 ? text.slice(start, end + 1) : text;

  try {
    const data = JSON.parse(jsonString);
    // Normalize instagramSummary: ensure it's always an array
    if (typeof data.instagramSummary === 'string') {
      data.instagramSummary = data.instagramSummary.split(/\n\n+/).filter(Boolean);
    }
    return { ...data, groundingSources };
  } catch (error) {
    console.error("Failed to parse AI response:", text);
    throw new Error("Error en el formato de la respuesta de la IA.");
  }
};
