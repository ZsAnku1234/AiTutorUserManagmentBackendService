import { Langfuse } from "langfuse";
const langfuse = new Langfuse({
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    baseUrl: "https://cloud.langfuse.com"
});
export const compilePrompts = async (promptName: string, variables: Record<string, any>) => {
    try {
        const prompt = await langfuse.getPrompt(promptName);
        const compiledPrompt = prompt.compile(variables);
        return compiledPrompt;
    } catch (error) {
        console.error(`Error compiling prompt "${promptName}":`, error);
        throw error;
    }
};

export const CONSTANTS = {
    /**
     * Identifier for web search chapters functionality.
     */
    WEB_SEARCH_CHAPTERS: 'webSearchChapters',
    QUESTION_GENERATOR:'QuestionGenerator'
} as const;