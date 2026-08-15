import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { store } from '../../lib/store';
import { getStoredAuth, getAuthToken } from '../../lib/auth-helpers';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AgentAssistantPage: React.FC = () => {
  const auth = getStoredAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Bonjour **${auth?.prenom || 'Shalom'}** ! 👋  \nJe suis ton **Assistant IA Performances Booster**. Je peux analyser tes performances Support, t'expliquer le calcul des primes, ou te donner des conseils ciblés pour améliorer tes KPIs (**RAP**, **TR**, **CCX**, **DMT**).  \nQue souhaites-tu savoir aujourd'hui ?`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const promptChips = [
    'Comment améliorer mon RAP Phone ?',
    'Analyse mes résultats de la semaine 31',
    'Comment est calculée ma prime multicanal ?',
    'Conseils pour réduire le DMT sur les emails',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const allPerfs = store.getWeeklyPerformances();
      const myPerfs = allPerfs.filter((p) => p.agent_id === auth?.id || p.log_activite === auth?.log_activite);

      const token = getAuthToken();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: query,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          context: {
            agentName: auth?.name,
            anciennete: auth?.anciennete,
            recentPerformances: myPerfs.slice(0, 6),
          },
        }),
      });

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.text || 'Désolé, je n\'ai pas pu traiter votre demande.',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Une erreur s\'est produite lors de la connexion avec l\'Assistant IA.',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Bot className="w-7 h-7 text-[#814BE7]" /> Assistant IA Certifié
        </h1>
        <p className="text-xs text-slate-500">
          Analyse conversationnelle intelligente de votre performance & conseils de progression
        </p>
      </div>

      {/* Messages Scroll Area */}
      <Card className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-[#814BE7] text-white flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                m.role === 'user'
                  ? 'bg-[#814BE7] text-white rounded-tr-none'
                  : 'bg-white border border-slate-200/80 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-tl-none'
              }`}
            >
              <div className="markdown-body">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
              <span className="block text-3xs text-right opacity-60 mt-2">{m.timestamp}</span>
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#814BE7] font-medium p-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>L'assistant analyse vos données...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </Card>

      {/* Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {promptChips.map((chip, i) => (
          <button
            key={i}
            onClick={() => handleSend(chip)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-2xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-[#814BE7] hover:border-indigo-200 transition-all shrink-0 cursor-pointer shadow-2xs"
          >
            ✨ {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Posez une question sur vos objectifs, vos primes ou vos KPIs..."
          className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#814BE7] focus:ring-2 focus:ring-[#814BE7]/20 shadow-xs dark:bg-slate-900 dark:border-slate-800"
        />
        <Button
          variant="primary"
          icon={<Send className="w-4 h-4" />}
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          className="rounded-2xl px-5 py-3"
        >
          Envoyer
        </Button>
      </div>
    </div>
  );
};
