import { GoogleGenAI } from "@google/genai";

import { Injectable } from '@nestjs/common';
import { BasicPromptDto } from './dtos/basic-prompt.dto';
import { basicPromptUseCase } from "./use-cases/basic-prompt.use-case";
import { basicPromptStreamUseCase } from "./use-cases/basic-prompt-stream.use-case";

@Injectable()
export class GeminiService {

    private ai = new GoogleGenAI({});

    async basicPrompt(basicPromptDto: BasicPromptDto) {
        return basicPromptUseCase(this.ai, basicPromptDto);
    }

    async basicPromptStream(basicPromptDto: BasicPromptDto) {
        return basicPromptStreamUseCase(this.ai, basicPromptDto);
    }
}
