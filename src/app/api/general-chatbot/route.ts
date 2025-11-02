import { NextRequest, NextResponse } from 'next/server';
import { generalChatbot } from '@/ai/flows/general-chatbot';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, language, conversationHistory } = body;

    if (!message || !language) {
      return NextResponse.json(
        { error: 'Message and language are required' },
        { status: 400 }
      );
    }

    const result = await generalChatbot({
      message,
      language,
      conversationHistory: conversationHistory || []
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('General chatbot API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chatbot request' },
      { status: 500 }
    );
  }
}

