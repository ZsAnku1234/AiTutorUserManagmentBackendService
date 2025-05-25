declare module 'google-tts-api' {
  interface TTSOptions {
    lang?: string;
    slow?: boolean;
    host?: string;
    splitPunct?: string;
  }

  interface AudioResult {
    shortText: string;
    url: string;
  }

  export function getAudioUrl(text: string, options?: TTSOptions): string;
  export function getAllAudioUrls(text: string, options?: TTSOptions): AudioResult[];
} 