import { OpenAI } from "openai";
import dotenv from "dotenv";
import { zodFunction, zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import ChapterModel from "../models/Chapter";
import { Langfuse } from "langfuse";
import { compilePrompts, CONSTANTS } from "../config/langfuse";
import { v4 as uuidv4 } from 'uuid';
import QuestionSetModel from "../models/QuestionSetModel ";
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

export const generateQuestionsFromTopicsTool = async (user: any, topics: string[], subject: string, feedback: string) => {
    console.log(`user::`, user)
    console.log(`uservalues:`, user._id);
    try {
        const traceId = uuidv4();

        const promptCompiler = await compilePrompts(CONSTANTS.QUESTION_GENERATOR, {
            topics: topics,
            subject: subject,
            classLevel: user.classLevel,
            board: user.board,
            weakness: user.weakness,
            currentGrade: user.currentGrade,
            gradeExpectation: user.gradeExpectation,
            feedback: feedback,
            country: user.country
        })
        const response = await openai.chat.completions.create({
            model: "gpt-4o-search-preview",
            messages: [{ role: "system", content: promptCompiler }],
            web_search_options: {},
        });
        const responseContent = response.choices[0].message.content;
        console.log("Response content:", responseContent);

        if (!responseContent) {
            throw new Error("No content in response");
        }

        const LLM_StringJSONToObjJSONConverter = `Find the Json text from the  ${responseContent} and give output into the JSON format`;

        const questionSchema = z.object({
            question: z.string(),
            options: z.array(z.string()).length(4),
            correctAnswer: z.string(),
            timeToSolve: z.number().positive() // in seconds
        });

        const questionsListSchema = z.object({
            questions: z.array(questionSchema)
        });

        const JsonResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: LLM_StringJSONToObjJSONConverter }],
            response_format: zodResponseFormat(questionsListSchema, "questionSchemaJSON"),
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
        const JsonParsedResponse = questionsListSchema.parse(JSON.parse(JsonResponseObject));
        console.log("parsedResponse::", JsonParsedResponse);

        const trace = langfuse.trace({
            id: traceId,
            name: 'question_generator',
            userId: user._id,
            input: promptCompiler,
            output: JsonParsedResponse,
            metadata: {
                subject,
                classLevel: user.classLevel,
                board: user.board || 'DEFAULT',
                country: user.country,
                weakness: user.weakness,
                topics: topics,
                gradeExpectation: user.gradeExpectation,
                currentGrade: user.currentGrade,
                feedback: feedback
            },
        });

        //create a generation 
        const generation = trace.generation({
            name: 'openai-chat-completion',
            model: 'gpt-4o-search-preview + gpt-4o',
            input: promptCompiler,
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

        const savedSet = await QuestionSetModel.create({
            userId: user._id,
            subject,
            feedback: feedback, // ✅ assuming feedback is being used for area
            topics,
            questions: JsonParsedResponse.questions,
        });

        // ✅ Return both saved set ID and parsed questions (e.g., for response and masking answers)
        return {
            questionSetId: savedSet._id,
            questions: savedSet.questions.map((q: any) => ({
                _id: q._id,
                question: q.question,
                options: q.options,
                timeToSolve: q.timeToSolve
                // ❌ Do not expose correctAnswer unless needed
            }))
        };

    }
    catch (error) {
        console.error("❌ OpenAI API Error:", error);
        return { error: "Error fetching response from OpenAI." };
    }
};
