import { Content, GoogleGenAI } from "@google/genai";

import { Injectable } from '@nestjs/common';
import { BasicPromptDto } from './dtos/basic-prompt.dto';
import { basicPromptUseCase } from "./use-cases/basic-prompt.use-case";
import { basicPromptStreamUseCase } from "./use-cases/basic-prompt-stream.use-case";
import { chatPromptStreamUseCase } from "./use-cases/chat-prompt-stream.use-case";
import { ChatPromptDto } from './dtos/chat-prompt.dto';
import { ImageGeneratorDto } from './dtos/image-generator.dto copy';
import { imageGeneratorUseCase } from "./use-cases/image-generator.use-case";

@Injectable()
export class GeminiService {

    private ai = new GoogleGenAI({});

    private chatHistory = new Map<String, Content[]>();

    async basicPrompt(basicPromptDto: BasicPromptDto) {
        return basicPromptUseCase(this.ai, basicPromptDto);
    }

    async basicPromptStream(basicPromptDto: BasicPromptDto) {
        return basicPromptStreamUseCase(this.ai, basicPromptDto);
    }

    async chatPromptStream(chatPromptDto: ChatPromptDto) {
        const chatHistory = this.getChatHistory(chatPromptDto.chatId);
        return chatPromptStreamUseCase(this.ai, chatPromptDto, { history: chatHistory });
    }

    saveMessage(chatId: string, message: Content) {
        const messages = this.getChatHistory(chatId);

        messages.push(message);

        this.chatHistory.set(chatId, messages);
    }

    getChatHistory(chatId: string) {
        return structuredClone(this.chatHistory.get(chatId) ?? []);
    }

    async imageGeneration(imageGeneratorDto: ImageGeneratorDto) {
        return imageGeneratorUseCase(this.ai, imageGeneratorDto);
    }
}
