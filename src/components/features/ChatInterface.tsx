import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'message' | 'thinking' | 'tool_call' | 'tool_result' | 'system';
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Use streaming API
      const response = await fetch('/api/chat/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          conversation: messages.filter(m => m.type === 'message' || !m.type)
        }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let currentMessageId = (Date.now() + 1).toString();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              if (accumulatedText) {
                setMessages(prev => [...prev, {
                  id: currentMessageId,
                  content: accumulatedText,
                  isUser: false,
                  timestamp: new Date(),
                  type: 'message'
                }]);
              }
              setStreamingMessage('');
              setIsLoading(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'thinking' || parsed.type === 'system') {
                setMessages(prev => [...prev, {
                  id: `${Date.now()}-${Math.random()}`,
                  content: parsed.text,
                  isUser: false,
                  timestamp: new Date(),
                  type: parsed.type
                }]);
              } else if (parsed.type === 'tool_call') {
                setMessages(prev => [...prev, {
                  id: `${Date.now()}-${Math.random()}`,
                  content: parsed.text,
                  isUser: false,
                  timestamp: new Date(),
                  type: 'tool_call'
                }]);
              } else if (parsed.type === 'tool_result') {
                setMessages(prev => [...prev, {
                  id: `${Date.now()}-${Math.random()}`,
                  content: parsed.text,
                  isUser: false,
                  timestamp: new Date(),
                  type: 'tool_result'
                }]);
              } else if (parsed.type === 'response') {
                accumulatedText = parsed.text;
                setStreamingMessage(parsed.text);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: "Connection error. Please try again.",
        isUser: false,
        timestamp: new Date(),
        type: 'message'
      }]);
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="w-96 h-80 bg-transparent border border-neutral-700/50 rounded flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 && (
            <div className="text-neutral-500 text-xs">
              Chat with AI assistant
            </div>
          )}
          
          {messages.map((message) => {
            // Different styling for different message types
            if (message.type === 'thinking') {
              return (
                <div key={message.id} className="text-xs text-neutral-500 italic">
                  {message.content}
                </div>
              );
            }
            
            if (message.type === 'system') {
              return (
                <div key={message.id} className="text-xs text-green-600">
                  {message.content}
                </div>
              );
            }
            
            if (message.type === 'tool_call') {
              return (
                <div key={message.id} className="text-xs text-yellow-600">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
              );
            }
            
            if (message.type === 'tool_result') {
              return (
                <div key={message.id} className="text-xs text-green-500">
                  {message.content}
                </div>
              );
            }
            
            // Regular messages
            return (
              <div key={message.id} className="space-y-1">
                <div className={`text-xs text-neutral-600 ${message.isUser ? 'text-right' : 'text-left'}`}>
                  {message.isUser ? 'You' : 'AI'} {message.timestamp.toLocaleTimeString()}
                </div>
                <div
                  className={`text-xs ${
                    message.isUser
                      ? 'text-blue-400 text-right'
                      : 'text-neutral-300 prose prose-sm prose-invert max-w-none'
                  }`}
                >
                  {message.isUser ? (
                    message.content
                  ) : (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="text-neutral-300">{children}</li>,
                        strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                        em: ({children}) => <em className="text-neutral-400 italic">{children}</em>,
                        code: ({children}) => <code className="bg-neutral-800 px-1 py-0.5 rounded text-blue-400">{children}</code>,
                        pre: ({children}) => <pre className="bg-neutral-800 p-2 rounded text-xs overflow-x-auto mb-2">{children}</pre>,
                        h1: ({children}) => <h1 className="text-sm font-bold text-white mb-2">{children}</h1>,
                        h2: ({children}) => <h2 className="text-sm font-semibold text-white mb-1">{children}</h2>,
                        h3: ({children}) => <h3 className="text-xs font-semibold text-neutral-300 mb-1">{children}</h3>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            );
          })}
          
          {streamingMessage && (
            <div className="space-y-1">
              <div className="text-xs text-neutral-600 text-left">
                AI {new Date().toLocaleTimeString()}
              </div>
              <div className="text-xs text-neutral-300 prose prose-sm prose-invert max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                    li: ({children}) => <li className="text-neutral-300">{children}</li>,
                    strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                    code: ({children}) => <code className="bg-neutral-800 px-1 py-0.5 rounded text-blue-400">{children}</code>,
                  }}
                >
                  {streamingMessage}
                </ReactMarkdown>
              </div>
            </div>
          )}
          
          {isLoading && !streamingMessage && (
            <div className="text-xs text-neutral-500">
              AI is typing...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-neutral-700/50 p-2">
          <form onSubmit={handleSubmit} className="flex gap-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type message..."
              disabled={isLoading}
              className="flex-1 px-2 py-1 bg-transparent border border-neutral-700/50 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-neutral-600"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-2 py-1 bg-transparent border border-neutral-700/50 text-neutral-400 hover:text-white hover:border-neutral-600 disabled:opacity-50 text-xs"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
