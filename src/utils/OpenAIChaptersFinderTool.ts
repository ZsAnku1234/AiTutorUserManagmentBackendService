import { OpenAI } from "openai";
import dotenv from "dotenv";
import { zodFunction, zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import ChapterModel from "../models/Chapter";
import { Langfuse } from "langfuse";
import { compilePrompts, CONSTANTS } from "../config/langfuse";
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

//setup langfuse

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: "https://cloud.langfuse.com"
});

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const GetAllChapters = async (user: any, subject: string) => {
  console.log(`user::`, user)
  console.log(`uservalues:`, user._id);
  try {

const traceId = uuidv4();

const board = user.board?.trim() === "" ? "DEFAULT" : user.board;

    const query = {
      subject,
      board,
      classLevel: user.classLevel,
      country: user.country,
    };

    const existing = await ChapterModel.findOne(query);
    if (existing) {
      console.log("📦 Returning cached chapters from DB");
      return existing;
    }


    const compiledPrompt = await compilePrompts(CONSTANTS.WEB_SEARCH_CHAPTERS, {
      classLevel: user.classLevel,
      board: user.board || 'DEFAULT',
      country: user.country,
      subject: subject,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-search-preview",
      messages: [{ role: "system", content: compiledPrompt }],
      web_search_options: {}
    });

    const responseContent = response.choices[0].message.content;
    console.log("Response content:", responseContent);

    if (!responseContent) {
      throw new Error("No content in response");
    }
    const LLM_StringJSONToObjJSONConverter = `Find the Json text from the  ${responseContent} and give output into the JSON format`;
    
    //@gpt-4o
    // Define the response schema
    const subjectBookChapterSchema = z.object({
      subject: z.string(),
      books: z.array(
        z.object({
          name: z.string(),
          chapters: z.array(z.string())
        })
      )
    });


    const JsonResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: LLM_StringJSONToObjJSONConverter }],
      response_format: zodResponseFormat(subjectBookChapterSchema, "subjectBookChapterSchemaJSON"),
    });

    // Extract token usage
    const inputTokensGPT_4o = JsonResponse.usage?.prompt_tokens ?? 0;
    const outputTokensGPT_4o = JsonResponse.usage?.completion_tokens ?? 0;
    const totalTokensGPT_4o = JsonResponse.usage?.total_tokens ?? 0;

    const JsonResponseObject = JsonResponse.choices[0].message.content;
    console.log("JSON Reponse:", JsonResponseObject);

    if (!JsonResponseObject) {
      throw new Error("No content in response");
    }
    const JsonParsedResponse = subjectBookChapterSchema.parse(JSON.parse(JsonResponseObject));
    console.log("parsedResponse::", JsonParsedResponse);
    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);

    //create the trace:
    const trace = langfuse.trace({
      id: traceId,
      name: 'web-search-chapters-generation',
      userId: user._id,
      input: compiledPrompt,
      output: JsonParsedResponse,
      metadata: {
        subject,
        classLevel: user.classLevel,
        board: user.board || 'DEFAULT',
        country: user.country,
      },
    });


    //create a generation 
    const generation = trace.generation({
      name: 'openai-chat-completion',
      model: 'gpt-4o-search-preview + gpt-4o',
      input: compiledPrompt,
    });
    generation.end({
      output: response.choices[0].message.content,
      usage: {
        input: inputTokensGPT_4o,
        output: outputTokensGPT_4o,
        total: totalTokensGPT_4o,
        unit: "TOKENS",
        inputCost: inputTokensGPT_4o * 0.000005,
        outputCost: outputTokensGPT_4o * 0.00002,
        totalCost: inputTokensGPT_4o * 0.000005 + outputTokensGPT_4o * 0.00002 + 0.035
      }
    });


    //save the response: 
    const saved = await ChapterModel.create({
      ...query,
      books: JsonParsedResponse.books,
      expiresAt: twoMonthsLater,
    });

    console.log("💾 Saved new chapters to DB");
    return saved;
  }
  catch (error) {
    console.error("❌ OpenAI API Error:", error);
    return { error: "Error fetching response from OpenAI." };
  }
};
