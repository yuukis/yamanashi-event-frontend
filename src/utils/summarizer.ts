type SummarizerAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available';

type SummarizerOptions = {
  type?: 'key-points' | 'tldr' | 'teaser' | 'headline';
  format?: 'plain-text' | 'markdown';
  length?: 'short' | 'medium' | 'long';
  sharedContext?: string;
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
  outputLanguage?: string;
  monitor?: (monitor: EventTarget) => void;
};

type SummarizerSession = {
  summarize: (text: string, options?: { context?: string }) => Promise<string>;
  summarizeStreaming: (text: string, options?: { context?: string }) => ReadableStream<string> | AsyncIterable<string>;
  destroy?: () => void;
};

type SummarizerFactory = {
  availability: (options?: SummarizerOptions) => Promise<SummarizerAvailability>;
  create: (options?: SummarizerOptions) => Promise<SummarizerSession>;
};

declare global {
  interface Window {
    Summarizer?: SummarizerFactory;
  }
}

export class SummarizerUnavailableError extends Error {
  constructor(message = 'このブラウザでは要約機能を利用できません') {
    super(message);
    this.name = 'SummarizerUnavailableError';
  }
}

const SUMMARIZER_OPTIONS: SummarizerOptions = {
  type: 'key-points',
  format: 'plain-text',
  length: 'short',
  sharedContext: '山梨県内または近隣のIT勉強会・技術イベント情報を、参加検討中の人に向けて日本語で要約してください。',
  expectedInputLanguages: ['ja', 'en'],
  expectedContextLanguages: ['ja'],
  outputLanguage: 'ja',
};

function getSummarizerFactory(): SummarizerFactory | undefined {
  return window.Summarizer;
}

let availabilityFactory: SummarizerFactory | undefined;
let availabilityRequest: Promise<SummarizerAvailability> | null = null;

async function getSummarizerAvailability(): Promise<SummarizerAvailability> {
  const summarizerFactory = getSummarizerFactory();
  if (!summarizerFactory) {
    return 'unavailable';
  }

  if (availabilityFactory !== summarizerFactory) {
    availabilityFactory = summarizerFactory;
    availabilityRequest = null;
  }

  if (!availabilityRequest) {
    availabilityRequest = summarizerFactory.availability(SUMMARIZER_OPTIONS);
  }

  return availabilityRequest;
}

export async function isEventDescriptionSummarizerAvailable(): Promise<boolean> {
  try {
    return await getSummarizerAvailability() !== 'unavailable';
  } catch {
    return false;
  }
}

async function readSummaryStream(
  stream: ReadableStream<string> | AsyncIterable<string>,
  onChunk: (chunk: string) => void,
): Promise<void> {
  if (Symbol.asyncIterator in stream) {
    for await (const chunk of stream) {
      onChunk(chunk);
    }
    return;
  }

  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      onChunk(value);
    }
  } finally {
    reader.releaseLock();
  }
}

export async function streamEventDescriptionSummary(
  description: string,
  title: string,
  onChunk: (chunk: string) => void,
  onDownloadProgress?: (progress: number) => void,
): Promise<void> {
  const summarizerFactory = getSummarizerFactory();
  if (!summarizerFactory) {
    throw new SummarizerUnavailableError();
  }

  const availability = await getSummarizerAvailability();
  if (availability === 'unavailable') {
    throw new SummarizerUnavailableError();
  }

  const summarizer = await summarizerFactory.create({
    ...SUMMARIZER_OPTIONS,
    ...(onDownloadProgress && {
      monitor(monitor) {
        monitor.addEventListener('downloadprogress', (event) => {
          const progressEvent = event as ProgressEvent;
          onDownloadProgress(progressEvent.loaded);
        });
      },
    }),
  });
  try {
    const stream = summarizer.summarizeStreaming(description, {
      context: `イベント名: ${title}`,
    });
    await readSummaryStream(stream, onChunk);
  } finally {
    summarizer.destroy?.();
  }
}
