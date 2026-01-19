import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface TextScrambleProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div';
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';

export default function TextScramble({
  text,
  className = '',
  delay = 0,
  duration = 1000,
  as: Component = 'span',
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const scramble = useCallback(() => {
    const totalFrames = Math.floor(duration / 30);
    let frame = 0;

    const animate = () => {
      if (frame >= totalFrames) {
        setDisplayText(text);
        setIsComplete(true);
        return;
      }

      const progress = frame / totalFrames;
      const revealedLength = Math.floor(text.length * progress);

      let result = '';
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
          result += ' ';
        } else if (i < revealedLength) {
          result += text[i];
        } else {
          result += chars[Math.floor(Math.random() * chars.length)];
        }
      }

      setDisplayText(result);
      frame++;
      requestAnimationFrame(animate);
    };

    animate();
  }, [text, duration]);

  useEffect(() => {
    const timer = setTimeout(scramble, delay);
    return () => clearTimeout(timer);
  }, [scramble, delay]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      <Component className={className}>
        {displayText || text.replace(/./g, ' ')}
        {!isComplete && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="text-neon-limit"
          >
            _
          </motion.span>
        )}
      </Component>
    </motion.span>
  );
}
