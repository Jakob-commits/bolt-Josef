import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useUI } from '../../contexts/UIContext';
import { useUIVisibility } from '../../contexts/UIVisibilityContext';
import { useUILayout } from '../../contexts/UILayoutContext';
import { useAuth } from '../../contexts/AuthContext';
import { CARD_REGISTRY } from '../cards';
import { VisibilityWrapper } from '../ui/VisibilityWrapper';
import { getVisibilityState } from '../../lib/visibilityUtils';
import { isAdminOrHigher } from '../../lib/supabase';

interface DashboardGridProps {
  cardProps?: Record<string, any>;
}

interface ColumnLayout {
  left: string[];
  right: string[];
}

const DEFAULT_LAYOUT: ColumnLayout = {
  left: ['trainingSuite', 'leitfadenanalyse', 'recentTrainings', 'weeklyTrainingPlan'],
  right: ['news', 'skillProfile', 'achievements'],
};

export function DashboardGrid({ cardProps = {} }: DashboardGridProps) {
  const { isEditing, isVisibilityMode } = useUI();
  const { visibility } = useUIVisibility();
  const { getLayoutForArea, setLayoutForArea } = useUILayout();
  const { profile } = useAuth();
  const [columnLayout, setColumnLayout] = useState<ColumnLayout>(DEFAULT_LAYOUT);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = isAdminOrHigher(profile);

  useEffect(() => {
    loadLayout();
  }, []);

  const loadLayout = async () => {
    try {
      setIsLoading(true);
      const savedLayout = await getLayoutForArea('home');

      if (savedLayout.length > 0) {
        const leftCards: string[] = [];
        const rightCards: string[] = [];

        savedLayout
          .sort((a, b) => a.position - b.position)
          .forEach((item) => {
            const layoutData = item as any;
            const column = layoutData.layout?.column || 'left';

            if (column === 'right') {
              rightCards.push(item.element_key);
            } else {
              leftCards.push(item.element_key);
            }
          });

        if (leftCards.length > 0 || rightCards.length > 0) {
          setColumnLayout({ left: leftCards, right: rightCards });
        } else {
          setColumnLayout(DEFAULT_LAYOUT);
        }
      } else {
        setColumnLayout(DEFAULT_LAYOUT);
      }
    } catch (error) {
      console.error('Error loading dashboard layout:', error);
      setColumnLayout(DEFAULT_LAYOUT);
    } finally {
      setIsLoading(false);
    }
  };

  const saveLayout = async (layout: ColumnLayout) => {
    try {
      const layoutData: Array<{ element_key: string; position: number; layout: { column: string } }> = [];

      layout.left.forEach((key, index) => {
        layoutData.push({
          element_key: key,
          position: index,
          layout: { column: 'left' },
        });
      });

      layout.right.forEach((key, index) => {
        layoutData.push({
          element_key: key,
          position: index,
          layout: { column: 'right' },
        });
      });

      await setLayoutForArea('home', layoutData as any);
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
    }
  };

  const getVisibleCardsForColumn = (cards: string[]) => {
    if (isVisibilityMode && isAdmin) {
      return cards.filter((cardId) => CARD_REGISTRY[cardId]);
    }

    return cards.filter((cardId) => {
      const state = getVisibilityState(cardId, visibility);
      return state !== 'hidden' && CARD_REGISTRY[cardId];
    });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !isEditing) return;

    const { source, destination } = result;
    const sourceColumn = source.droppableId as 'left' | 'right';
    const destColumn = destination.droppableId as 'left' | 'right';

    const sourceCards = getVisibleCardsForColumn(columnLayout[sourceColumn]);
    const destCards = sourceColumn === destColumn
      ? sourceCards
      : getVisibleCardsForColumn(columnLayout[destColumn]);

    if (sourceColumn === destColumn) {
      const reordered = Array.from(sourceCards);
      const [moved] = reordered.splice(source.index, 1);
      const clampedIndex = Math.min(destination.index, reordered.length);
      reordered.splice(clampedIndex, 0, moved);

      const hiddenCards = columnLayout[sourceColumn].filter((cardId) => {
        const state = getVisibilityState(cardId, visibility);
        return state === 'hidden' && CARD_REGISTRY[cardId];
      });

      const newLayout = {
        ...columnLayout,
        [sourceColumn]: [...reordered, ...hiddenCards],
      };

      setColumnLayout(newLayout);
      saveLayout(newLayout);
    } else {
      const sourceList = Array.from(sourceCards);
      const destList = Array.from(destCards);
      const [moved] = sourceList.splice(source.index, 1);
      const clampedIndex = Math.min(destination.index, destList.length);
      destList.splice(clampedIndex, 0, moved);

      const sourceHidden = columnLayout[sourceColumn].filter((cardId) => {
        const state = getVisibilityState(cardId, visibility);
        return state === 'hidden' && CARD_REGISTRY[cardId];
      });

      const destHidden = columnLayout[destColumn].filter((cardId) => {
        const state = getVisibilityState(cardId, visibility);
        return state === 'hidden' && CARD_REGISTRY[cardId];
      });

      const newLayout = {
        [sourceColumn]: [...sourceList, ...sourceHidden],
        [destColumn]: [...destList, ...destHidden],
      };

      setColumnLayout(newLayout);
      saveLayout(newLayout);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const renderColumn = (columnId: 'left' | 'right') => {
    const cards = columnLayout[columnId];
    const visibleCards = getVisibleCardsForColumn(cards);

    return (
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-6 min-h-[400px] pb-24 transition-colors ${
              snapshot.isDraggingOver && isEditing ? 'bg-cyan-50/30 rounded-2xl p-4' : ''
            }`}
          >
            {visibleCards.map((cardId, index) => {
              const CardComponent = CARD_REGISTRY[cardId];
              if (!CardComponent) return null;

              const state = getVisibilityState(cardId, visibility);
              const isDisabled = state === 'comingsoon';

              return (
                <Draggable
                  key={cardId}
                  draggableId={cardId}
                  index={index}
                  isDragDisabled={!isEditing || isVisibilityMode}
                >
                  {(prov, dragSnapshot) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      {...prov.dragHandleProps}
                      className={`
                        transition-all
                        ${isEditing && !isVisibilityMode ? 'cursor-grab active:cursor-grabbing ring-2 ring-cyan-400 rounded-2xl' : ''}
                        ${dragSnapshot.isDragging ? 'opacity-50 scale-105 shadow-2xl z-50' : ''}
                      `}
                    >
                      <VisibilityWrapper
                        elementKey={cardId}
                        isAdminMode={isVisibilityMode && isAdmin}
                      >
                        <div className={isDisabled ? 'pointer-events-none opacity-60' : ''}>
                          <CardComponent {...(cardProps[cardId] || {})} />
                        </div>
                      </VisibilityWrapper>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
            {isEditing && visibleCards.length > 0 && (
              <div className="h-20 flex items-center justify-center text-sm text-gray-400 border-2 border-dashed border-gray-300 rounded-xl">
                Drop hier um ans Ende zu setzen
              </div>
            )}
          </div>
        )}
      </Droppable>
    );
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          {renderColumn('left')}
        </div>
        <div className="flex-1">
          {renderColumn('right')}
        </div>
      </div>
    </DragDropContext>
  );
}
