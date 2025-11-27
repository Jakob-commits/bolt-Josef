import { ReactNode } from 'react';
import { Reorder } from 'framer-motion';
import { useUI } from '../../contexts/UIContext';
import { CARD_REGISTRY } from '../cards';

interface SortableGridProps {
  page: string;
  column: 'left' | 'right';
  cards: string[];
  cardProps?: Record<string, any>;
}

export function SortableGrid({ page, column, cards, cardProps = {} }: SortableGridProps) {
  const { layout, setLayout, isEditing } = useUI();

  const key = `${page}-${column}`;
  const activeCards = layout[key] || cards;

  const handleReorder = (newOrder: string[]) => {
    setLayout({ ...layout, [key]: newOrder });
  };

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-6">
        {activeCards.map((cardId: string) => {
          const CardComponent = CARD_REGISTRY[cardId];
          if (!CardComponent) return null;

          const props = cardProps[cardId] || {};
          return <CardComponent key={cardId} {...props} />;
        })}
      </div>
    );
  }

  return (
    <Reorder.Group
      axis="y"
      values={activeCards}
      onReorder={handleReorder}
      className="flex flex-col gap-6"
    >
      {activeCards.map((cardId: string) => {
        const CardComponent = CARD_REGISTRY[cardId];
        if (!CardComponent) return null;

        const props = cardProps[cardId] || {};
        return (
          <Reorder.Item
            key={cardId}
            value={cardId}
            className="cursor-grab active:cursor-grabbing"
            dragListener={isEditing}
            dragControls={undefined}
            whileDrag={{ scale: 1.02, opacity: 0.9, zIndex: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className={isEditing ? 'ring-2 ring-cyan-400 ring-opacity-50 rounded-2xl' : ''}>
              <CardComponent {...props} />
            </div>
          </Reorder.Item>
        );
      })}
    </Reorder.Group>
  );
}
