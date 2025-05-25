import { createClient } from "@deepgram/sdk";

const deepgram = createClient(process.env.DEEPGRAM_API_KEY || "");

export const TTSModel = async (text: string): Promise<Buffer | undefined> => {
  try {
    const response = await deepgram.speak.request(
      { text },
      {
        model: "aura-athena-en",
        encoding: "linear16",
        container: "wav",
      }
    );

    const stream = response.getStream();

    // Helper: convert ReadableStream to Buffer
    const getAudioBuffer = async (
      response: ReadableStream<Uint8Array>
    ): Promise<Buffer> => {
      const reader = response.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }

      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      return Buffer.from(combined.buffer);
    };

    // Ensure stream is resolved before passing to getAudioBuffer
    const resolvedStream = await stream;
    if (resolvedStream) {
      return await getAudioBuffer(resolvedStream);
    } else {
      console.error("No audio stream returned from Deepgram.");
      return undefined;
    }
  } catch (error) {
    console.error("Failed to generate audio:", error);
  }};
