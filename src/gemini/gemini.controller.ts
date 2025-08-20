import { Body, Controller, Get, HttpStatus, Param, Post, Res, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { BasicPromptDto } from './dtos/basic-prompt.dto';
import express, { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatPromptDto } from './dtos/chat-prompt.dto';
import { GenerateContentResponse } from '@google/genai';
import { ImageGeneratorDto } from './dtos/image-generator.dto copy';
import { PokemonHelperDto } from './dtos/pokemon-helper.dto';
import { TriviaQuestionDto } from './dtos/trivia-question.dto';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) { }

  async outputStreamResponse(res: Response, stream: AsyncGenerator<GenerateContentResponse, any, any>) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(HttpStatus.OK);
    let resultText = '';
    for await (const chunk of stream) {
      const piece = chunk.text;
      resultText += piece;
      res.write(piece);
    }
    res.end();
    return resultText;
  }

  @Post('/basic-prompt')
  basicPrompt(@Body() basicPromptDto: BasicPromptDto) {
    return this.geminiService.basicPrompt(basicPromptDto);

  }

  @Post('/basic-prompt-stream')
  @UseInterceptors(FilesInterceptor('files'))
  async basicPromptStream(
    @Body() basicPromptDto: BasicPromptDto,
    @Res() res: express.Response,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    basicPromptDto.files = files;

    const stream = await this.geminiService.basicPromptStream(basicPromptDto);

    void await this.outputStreamResponse(res, stream);
  }


  @Post('/chat-stream')
  @UseInterceptors(FilesInterceptor('files'))
  async chatStream(
    @Body() chatPromptDto: ChatPromptDto,
    @Res() res: express.Response,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    chatPromptDto.files = files;

    const stream = await this.geminiService.chatPromptStream(chatPromptDto);

    const data = await this.outputStreamResponse(res, stream);

    const geminiMessage = {
      role: "model",
      parts: [{ text: data }],
    }

    const userMessage = {
      role: "user",
      parts: [{ text: chatPromptDto.prompt }],
    }

    this.geminiService.saveMessage(chatPromptDto.chatId, userMessage);
    this.geminiService.saveMessage(chatPromptDto.chatId, geminiMessage);

    console.log({ data });

  }


  @Get('/chat-history/:chatId')
  async getChatStream(
    @Param('chatId') chatId: string,
  ) {
    return this.geminiService.getChatHistory(chatId).map(message => ({
      role: message.role,
      parts: message.parts?.map(part => part.text).join(''),
    }));

  }

  @Post('/image-generation')
  @UseInterceptors(FilesInterceptor('files'))
  async imageGeneration(
    @Body() imageGeneratorDto: ImageGeneratorDto,
    //@Res() res: express.Response,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    imageGeneratorDto.files = files;

    const { imageUrl, text } = await this.geminiService.imageGeneration(imageGeneratorDto);

    return {
      imageUrl,
      text
    }

  }

  @Post('pokemon-helper')
  getPokemonHelp(@Body() pokemonHelperDto: PokemonHelperDto) {
    return this.geminiService.getPokemonHelp(pokemonHelperDto);
  }

  @Get('trivia/question/:topic')
  getTriviaQuestion(@Param() triviaQuestionDto: TriviaQuestionDto) {
    return this.geminiService.getTriviaQuestion(triviaQuestionDto);
  }
}
