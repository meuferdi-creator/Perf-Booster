import React, { useState } from 'react';
import { User, Shield, MessageSquare, Send, CheckCircle2, Clock, CornerDownRight } from 'lucide-react';
import { Badge } from './Badge';
import { Button } from './Button';

export interface CommentThreadProps {
  id: string;
  semaine: number;
  canal?: string;
  managerName: string;
  managerComment?: string;
  axesAmelioration?: string;
  planAction?: string;
  agentName: string;
  agentComment?: string;
  commentDate?: string;
  status?: 'published' | 'pending' | 'read';
  allowAgentReply?: boolean;
  onSaveAgentComment?: (threadId: string, text: string) => void;
  className?: string;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  id,
  semaine,
  canal = 'Phone',
  managerName,
  managerComment,
  axesAmelioration,
  planAction,
  agentName,
  agentComment,
  commentDate,
  allowAgentReply = false,
  onSaveAgentComment,
  className = '',
}) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePublish = () => {
    if (!inputText.trim()) return;
    setIsSubmitting(true);
    if (onSaveAgentComment) {
      onSaveAgentComment(id, inputText.trim());
    }
    setInputText('');
    setIsSubmitting(false);
  };

  return (
    <div className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all ${className}`}>
      {/* Thread Header */}
      <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#814BE7]/10 text-[#814BE7] dark:bg-purple-950/60 dark:text-purple-300 flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Semaine {semaine} ({canal})
              </span>
              <span className="text-xs text-slate-400">· {agentName}</span>
            </div>
            <p className="text-3xs text-slate-500 dark:text-slate-400">Manager : {managerName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {agentComment ? (
            <Badge variant="success" icon={<CheckCircle2 className="w-3 h-3" />}>
              Répondu
            </Badge>
          ) : (
            <Badge variant="warning" icon={<Clock className="w-3 h-3" />}>
              En attente de réponse
            </Badge>
          )}
          <Badge variant="purple">S{semaine} - 2026</Badge>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* BLOCK 1: COMMENTAIRE DU MANAGER */}
        <div className="rounded-xl border border-purple-200/80 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-purple-200/60 dark:border-purple-900/40 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#814BE7] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  COMMENTAIRE DU MANAGER
                </span>
                <span className="text-3xs font-semibold text-purple-700 dark:text-purple-300 ml-2">
                  ({managerName})
                </span>
              </div>
            </div>
            <span className="text-3xs font-medium text-slate-500 dark:text-slate-400">
              Transmis aux conseillers
            </span>
          </div>

          {managerComment && (
            <div>
              <p className="text-3xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Remarques générales :
              </p>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-purple-100 dark:border-purple-900/30">
                {managerComment}
              </p>
            </div>
          )}

          {axesAmelioration && (
            <div>
              <p className="text-3xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                Axes d'amélioration :
              </p>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-amber-500/10 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50">
                {axesAmelioration}
              </p>
            </div>
          )}

          {planAction && (
            <div>
              <p className="text-3xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
                Plan d'action recommandé :
              </p>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-emerald-500/10 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                {planAction}
              </p>
            </div>
          )}
        </div>

        {/* CONNECTOR ARROW */}
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600 pl-4">
          <CornerDownRight className="w-4 h-4 text-[#814BE7]" />
          <span className="text-3xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Suivi & Engagement Agent
          </span>
        </div>

        {/* BLOCK 2: RÉPONSE DE L'AGENT */}
        {agentComment ? (
          <div className="rounded-xl border-l-4 border-l-[#814BE7] border border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 space-y-2 ml-2 sm:ml-4">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60 dark:border-indigo-900/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    RÉPONSE DE L'AGENT
                  </span>
                  <span className="text-3xs font-semibold text-indigo-700 dark:text-indigo-300 ml-2">
                    ({agentName})
                  </span>
                </div>
              </div>
              <span className="text-3xs text-slate-500 dark:text-slate-400 font-medium">
                {commentDate || 'Date transmise'}
              </span>
            </div>

            <p className="text-xs text-slate-900 dark:text-slate-100 leading-relaxed font-medium bg-white/90 dark:bg-slate-900/90 p-3.5 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
              {agentComment}
            </p>
          </div>
        ) : allowAgentReply ? (
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-3 ml-2 sm:ml-4">
            <div className="flex items-center justify-between">
              <label htmlFor={`input-${id}`} className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Écrire une réponse / confirmation de prise en compte :
              </label>
              <span className="text-3xs text-slate-500 dark:text-slate-400">Agent : {agentName}</span>
            </div>

            <textarea
              id={`input-${id}`}
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Écrire un commentaire, poser une question ou confirmer votre engagement..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-[#814BE7] focus:outline-none focus:ring-2 focus:ring-[#814BE7]/30 transition-all font-medium leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <p className="text-3xs text-slate-500 dark:text-slate-400">
                Votre commentaire sera immédiatement notifié à votre manager.
              </p>
              <Button
                size="sm"
                variant="primary"
                icon={<Send className="w-3.5 h-3.5" />}
                onClick={handlePublish}
                disabled={!inputText.trim() || isSubmitting}
              >
                Publier la réponse
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-3 text-center text-xs text-slate-500 dark:text-slate-400 italic ml-2 sm:ml-4">
            En attente de réponse du conseiller.
          </div>
        )}
      </div>
    </div>
  );
};
