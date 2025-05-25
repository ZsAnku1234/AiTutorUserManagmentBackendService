import { OpenAI } from "openai";
import dotenv from "dotenv";
import { zodFunction, zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import ChapterModel from "../models/Chapter";
import { Langfuse } from "langfuse";
import { compilePrompts, CONSTANTS } from "../config/langfuse";
import { v4 as uuidv4 } from 'uuid';


const langfuse = new Langfuse({
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    baseUrl: "https://cloud.langfuse.com"
});

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
interface FeedbackQuestion {
    questionId: string;
    question: string;
    options: string[];
    correctAnswer: string;
    userAnswer: string | null;
  }
  
  interface FeedbackInput {
    user:any,
    name:string,
    questions: FeedbackQuestion[];
    subject: string;
    feedback: string;
    topics: string[];
  }
  
  export  async function feedbackGenerator({user, name, questions, subject, feedback, topics }: FeedbackInput): Promise<string> {
    const traceId = uuidv4();
    const questionsAnswerSet=JSON.stringify(questions)
    const topicSet=topics.join(', ')
    const promptCompiler = await compilePrompts(CONSTANTS.FEEDBACK_GENERATOR,{
        name:name,
        subject:subject,
        topicSet:topicSet,
        questionsAnswerSet:questionsAnswerSet,
        feedback:feedback
    });
    
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: promptCompiler }],
    });

    const inputTokensGPT_4o_mini = response.usage?.prompt_tokens ?? 0;
    const outputTokensGPT_4o_mini = response.usage?.completion_tokens ?? 0;
    const totalTokensGPT_4o_mini = response.usage?.total_tokens ?? 0;

    const responseContent = response.choices[0].message.content;

    const trace = langfuse.trace({
        id: traceId,
        name: 'feedback_generator',
        userId: user._id,
        input: promptCompiler,
        output: responseContent,
        metadata: {
            name:name,
            subject:subject,
            topicSet:topicSet,
            questionsAnswerSet:questionsAnswerSet,
            feedback:feedback
        },
    });

      //create a generation 
      const generation = trace.generation({
        name: 'openai-chat-completion',
        model: 'gpt-4o-mini',
        input: promptCompiler,
    });
    generation.end({
        output: responseContent,
        usage: {
            input: inputTokensGPT_4o_mini,
            output: outputTokensGPT_4o_mini,
            total: totalTokensGPT_4o_mini,
            unit: "TOKENS",
            inputCost: inputTokensGPT_4o_mini * 0.0000006,
            outputCost: outputTokensGPT_4o_mini * 0.0000024,
            totalCost: inputTokensGPT_4o_mini * 0.0000006 + outputTokensGPT_4o_mini * 0.0000024
        }
    });

    console.log("Response content:", responseContent);

    if (!responseContent) {
        throw new Error("No content in response");
    }
    return responseContent;

  }
  