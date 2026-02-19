
import { GoogleGenAI, Type } from "@google/genai";
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
    model: "gemini-3-pro-preview",
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
               - title: Titular.
               - subtitle: Bajada.
               - body: Cuerpo en Markdown.
               - seo: titleTag, metaDescription, keywords (array), slug.
               - instagramSummary: 3 párrafos.
               - microblogSummary: Resumen corto.
               - imageSearchQueries: Array de 3 strings con términos de búsqueda específicos.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          body: { type: Type.STRING },
          seo: {
            type: Type.OBJECT,
            properties: {
              titleTag: { type: Type.STRING },
              metaDescription: { type: Type.STRING },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              slug: { type: Type.STRING }
            },
            required: ["titleTag", "metaDescription", "keywords", "slug"]
          },
          instagramSummary: { type: Type.ARRAY, items: { type: Type.STRING } },
          microblogSummary: { type: Type.STRING },
          imageSearchQueries: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "subtitle", "body", "seo", "instagramSummary", "microblogSummary", "imageSearchQueries"]
      }
    }
  });

  const text = response.text.trim();
  const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

  try {
    const data = JSON.parse(text);
    return { ...data, groundingSources };
  } catch (error) {
    console.error("Failed to parse AI response:", text);
    throw new Error("Error en el formato de la respuesta de la IA.");
  }
};
