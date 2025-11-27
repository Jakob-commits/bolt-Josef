import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useUI } from '../../contexts/UIContext';

interface DraggableCardProps {
  id: string;
  children: ReactNode;
}

export function DraggableCard({ id, children }: DraggableCardProps) {
  const { isEditing } = useUI();

  return (
    <motion.div
      layout
      drag={isEditing}
      dragMomentum={false}
      dragElastic={0.05}
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
      whileDrag={{ scale: 1.02, opacity: 0.9, zIndex: 50 }}
      className={isEditing ? 'cursor-grab active:cursor-grabbing' : ''}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}
