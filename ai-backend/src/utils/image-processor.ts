import OpenAI from 'openai';
import { env } from '../env';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/**
 * Process image using OpenAI Vision API
 */
export async function processImage(imagePath: string, userMessage: string): Promise<string> {
  try {
    // Read image file
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Determine image type
    const ext = path.extname(imagePath).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    
    // Use OpenAI Vision API (gpt-4o supports vision)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // gpt-4o has vision capabilities
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userMessage || 'Please analyze this image and provide a detailed description. Be specific and accurate.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });
    
    const analysis = response.choices[0]?.message?.content || 'Unable to analyze image.';
    
    // Clean up temporary file
    try {
      fs.unlinkSync(imagePath);
    } catch (e) {
      console.warn('Failed to delete temp image file:', e);
    }
    
    return analysis;
  } catch (error) {
    console.error('❌ Image processing error:', error);
    // Clean up on error
    try {
      fs.unlinkSync(imagePath);
    } catch (e) {
      // Ignore cleanup errors
    }
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if file is an image
 */
export function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
}

