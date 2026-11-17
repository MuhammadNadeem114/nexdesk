import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import ZAI from 'z-ai-web-dev-sdk';

async function getAIResponse(messages: any[]) {
  const zai = await ZAI.create();
  const response = await zai.chat.completions.create({ messages });
  // Normalize response to extract content string
  if (typeof response === 'string') return response;
  const r = response as Record<string, unknown>;
  if (typeof r.content === 'string') return r.content;
  const msg = r.message as Record<string, unknown> | undefined;
  if (msg && typeof msg.content === 'string') return msg.content;
  const choices = r.choices as Array<{ message?: { content?: string } }> | undefined;
  if (choices?.[0]?.message?.content) return choices[0].message.content;
  return JSON.stringify(response);
}

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const list = searchParams.get('list') === 'true';
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      // Fetch messages for a specific conversation
      const messages = await db.aiMessage.findMany({
        where: { conversationId, conversation: { userId: user!.id } },
        orderBy: { createdAt: 'asc' },
        select: { id: true, role: true, content: true, createdAt: true },
      });
      return NextResponse.json({ messages });
    }

    if (list) {
      // Fetch all conversations for the user
      const conversations = await db.aiConversation.findMany({
        where: { userId: user!.id },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, createdAt: true, updatedAt: true },
      });
      return NextResponse.json({ conversations });
    }

    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  } catch (error) {
    console.error('AI GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { message, conversationId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    let conversation;

    // Get or create conversation
    if (conversationId) {
      conversation = await db.aiConversation.findFirst({
        where: { id: conversationId, userId: user!.id },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    } else {
      // Create a new conversation with a title derived from the first message
      const title = message.length > 50 ? message.slice(0, 50) + '...' : message;
      conversation = await db.aiConversation.create({
        data: {
          title,
          userId: user!.id,
        },
      });
    }

    // Save the user's message
    await db.aiMessage.create({
      data: {
        role: 'user',
        content: message,
        conversationId: conversation.id,
      },
    });

    // Fetch conversation history for context
    const history = await db.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true },
    });

    // Build messages array for the LLM
    const llmMessages = history.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // Get AI response using the z-ai-web-dev-sdk
    const aiContent = await getAIResponse(llmMessages);

    // Save the AI's response
    const savedMessage = await db.aiMessage.create({
      data: {
        role: 'assistant',
        content: aiContent,
        conversationId: conversation.id,
      },
    });

    return NextResponse.json({
      message: {
        id: savedMessage.id,
        role: savedMessage.role,
        content: savedMessage.content,
        conversationId: conversation.id,
        createdAt: savedMessage.createdAt,
      },
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}