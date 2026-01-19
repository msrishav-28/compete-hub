import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentDuplicateIcon, CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { useCompetitionStore } from '../store/useCompetitionStore';
import { useQuery } from '@tanstack/react-query';
import { fetchCompetitions } from '../api/competitions';
import MagneticButton from './ui/MagneticButton';

interface ResumeExportProps {
  className?: string;
}

export default function ResumeExport({ className }: ResumeExportProps) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { savedCompetitions } = useCompetitionStore();
  const { data: competitions } = useQuery(['competitions'], () => fetchCompetitions());

  const saved = competitions?.filter((c) => savedCompetitions.includes(c.id)) || [];

  const generateResumeText = () => {
    if (saved.length === 0) {
      return 'No competitions tracked yet. Start saving competitions to generate your portfolio.';
    }

    const lines = saved.map((comp) => {
      const prizeText = comp.prize ? ` (Prize: ${comp.prize.value} ${comp.prize.currency})` : '';
      const tagsText = comp.tags.length > 0 ? ` - Tech: ${comp.tags.slice(0, 3).join(', ')}` : '';
      return `• ${comp.title} | ${comp.platform}${prizeText}${tagsText}`;
    });

    return `## Competition Portfolio\n\n${lines.join('\n')}\n\n---\nGenerated via CompeteHub`;
  };

  const handleCopy = async () => {
    const text = generateResumeText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white font-display uppercase tracking-widest flex items-center gap-2">
            <DocumentDuplicateIcon className="w-4 h-4 text-neon-limit" />
            Career Inventory
          </h3>
          <p className="text-xs text-gray-500 mt-1">{saved.length} items tracked</p>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="text-xs text-gray-500 hover:text-white transition-colors underline underline-offset-2"
        >
          {showPreview ? 'Hide Preview' : 'Preview'}
        </button>
      </div>

      {/* Preview Panel */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 rounded-lg bg-black/40 border border-white/5 font-mono text-xs text-gray-400 max-h-48 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{generateResumeText()}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Button */}
      <MagneticButton
        onClick={handleCopy}
        variant={copied ? 'primary' : 'secondary'}
        className="w-full"
        disabled={saved.length === 0}
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.span
              key="copied"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2"
            >
              <CheckIcon className="w-4 h-4" />
              Copied to Clipboard
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2"
            >
              <ClipboardDocumentIcon className="w-4 h-4" />
              Generate Intel
            </motion.span>
          )}
        </AnimatePresence>
      </MagneticButton>
    </div>
  );
}
