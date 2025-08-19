import {
    Content,
    ContentListUnion,
    createPartFromUri,
    GoogleGenAI,
    Modality,
} from '@google/genai';
import { geminiUploadFiles } from '../helpers/gemini-upload-file';
import { ImageGeneratorDto } from '../dtos/image-generator.dto copy';

import { v4 as uuidV4 } from 'uuid';
import path from 'path';
import * as fs from 'fs';

const AI_IMAGES_PATH = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'public/ai-images',
)

interface Options {
    model?: string;
    systemInstruction?: string;
}

export interface ImageGeneratorResponse {
    imageUrl: string;
    text: string;
}

export const imageGeneratorUseCase = async (
    ai: GoogleGenAI,
    imageGeneratorDto: ImageGeneratorDto,
    options?: Options,

): Promise<ImageGeneratorResponse> => {
    const { prompt, files } = imageGeneratorDto;

    const contents: ContentListUnion = [{
        text: prompt,
    }];

    const uploadedFiles = await geminiUploadFiles(ai, files);

    uploadedFiles.forEach(file => {
        contents.push(createPartFromUri(file.uri ?? '', file.mimeType ?? ''));
    })

    const {
        model = 'gemini-2.0-flash-preview-image-generation',
        systemInstruction = `
      Responde únicamente en español 
      En formato markdown 
      Usa negritas de esta forma __
      Usa el sistema métrico decimal
  `,
    } = options ?? {};

    const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
    });

    let imageUrl = '';
    let text = '';
    const imageId = uuidV4();

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        // Based on the part type, either show the text or save the image
        if (part.text) {
            text = part.text;
            continue;
        }
        if (!part.inlineData) {
            continue;
        }

        const imageData = part.inlineData.data!;
        const buffer = Buffer.from(imageData, "base64");
        const imagePath = path.join(AI_IMAGES_PATH, `${imageId}.png`)

        fs.writeFileSync(imagePath, buffer);

        imageUrl = `${process.env.API_URL}/ai-images/${imageId}.png`;

    }


    return {
        imageUrl,
        text
    };
};