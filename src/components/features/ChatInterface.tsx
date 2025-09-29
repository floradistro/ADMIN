import React, { useState, useRef, useEffect } from 'react';
import { SiriGlowBorder } from '../ui';

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
}

interface AIAgent {
  id: string;
  name: string;
  model: string;
  tier: string;
  description: string;
}

const AI_AGENTS: AIAgent[] = [
  {
    id: 'claude-4-sonnet',
    name: 'Claude 4 Sonnet',
    model: 'claude-4-sonnet',
    tier: '',
    description: 'Most capable model for complex reasoning and analysis'
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    model: 'claude-3-haiku',
    tier: '',
    description: 'Quick responses for simple tasks'
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    model: 'gpt-4',
    tier: '',
    description: 'Advanced reasoning and creative tasks'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    model: 'gpt-3.5-turbo',
    tier: '',
    description: 'Balanced performance and speed'
  }
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent>(AI_AGENTS[0]);
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const agentDropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target as Node)) {
        setIsAgentDropdownOpen(false);
      }
    };

    if (isAgentDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAgentDropdownOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      timestamp: new Date(),
      isUser: true,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm here to help with your inventory management. What would you like to know?",
        timestamp: new Date(),
        isUser: false,
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
      <div className="relative w-full max-w-2xl h-[600px] bg-neutral-900 border border-white/[0.04] rounded-lg flex flex-col">
        <SiriGlowBorder isLoading={isLoading} />
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto scrollable-container p-4 space-y-4">
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg text-sm ${
                  message.isUser
                    ? 'bg-blue-600/20 text-blue-200 border border-blue-500/30'
                    : 'bg-neutral-800/60 text-neutral-300 border border-white/[0.08]'
                }`}
              >
                <div>{message.content}</div>
                <div className="text-xs text-neutral-500 mt-1">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-neutral-800/60 text-neutral-300 border border-white/[0.08] px-4 py-2 rounded-lg text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/[0.04]">
                      <div className="bg-neutral-900 border border-white/[0.08] rounded-lg p-3">
            {/* Add Context Button */}
            <div className="flex items-center gap-2 mb-3">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800/60 hover:bg-neutral-800/80 border border-white/[0.08] rounded-md text-neutral-400 hover:text-neutral-300 text-sm smooth-hover">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Context
              </button>
            </div>
            
            {/* Main Input */}
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Plan, search, build anything"
                  disabled={isLoading}
                  rows={1}
                  className="w-full px-0 py-2 bg-transparent border-none text-neutral-300 placeholder-neutral-500 focus:outline-none text-sm resize-none"
                  style={{ minHeight: '24px', maxHeight: '120px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                
                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 bottom-2 p-1.5 bg-neutral-800/60 hover:bg-neutral-700/60 disabled:bg-neutral-800/40 disabled:text-neutral-600 text-neutral-300 border border-white/[0.08] disabled:border-white/[0.04] rounded-md text-sm smooth-hover"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
            
            {/* Bottom Info */}
            <div className="flex items-center justify-between mt-2 text-xs text-neutral-500">
              <div className="flex items-center gap-4">
                <span>⌘ Agent</span>
                <div className="relative" ref={agentDropdownRef}>
                  <button
                    onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                    className="flex items-center gap-2 hover:text-neutral-400 smooth-hover"
                  >
                    <span>{selectedAgent.model}</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Agent Dropdown */}
                  {isAgentDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-80 max-h-96 bg-neutral-900/95 border border-white/[0.08] rounded-lg shadow-2xl backdrop-blur-sm z-50 overflow-hidden">
                      <div className="p-3 border-b border-white/[0.04]">
                        <h3 className="text-sm font-medium text-neutral-300">Select AI Agent</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto scrollable-container">
                        {AI_AGENTS.map((agent) => (
                          <button
                            key={agent.id}
                            onClick={() => {
                              setSelectedAgent(agent);
                              setIsAgentDropdownOpen(false);
                            }}
                            className={`w-full p-3 text-left hover:bg-neutral-800/40 smooth-hover border-b border-white/[0.02] last:border-b-0 ${
                              selectedAgent.id === agent.id ? 'bg-neutral-800/60' : ''
                            }`}
                          >
                            <div className="mb-1">
                              <span className="text-sm font-medium text-neutral-300">{agent.name}</span>
                            </div>
                            <p className="text-xs text-neutral-500">{agent.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}