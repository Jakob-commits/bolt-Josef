import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useUI } from '../../contexts/UIContext';
import { CARD_REGISTRY } from '../cards';

interface Props {
  page: string;
  columns: {
    left: string[];
    right: string[];
  };
  cardProps?: Record<string, any>;
}

export function SortableTwoColumn({ page, columns, cardProps = {} }: Props) {
  const { layout, setLayout, isEditing } = useUI();

  const activeLeft = layout[`${page}-left`] ?? columns.left;
  const activeRight = layout[`${page}-right`] ?? columns.right;

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;

    const srcCol = result.source.droppableId;
    const dstCol = result.destination.droppableId;

    if (srcCol === dstCol) {
      const columnKey = `${page}-${srcCol}`;
      const items = Array.from(layout[columnKey] ?? (srcCol === 'left' ? columns.left : columns.right));
      const [moved] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, moved);

      setLayout({
        ...layout,
        [columnKey]: items,
      });
    } else {
      const srcKey = `${page}-${srcCol}`;
      const dstKey = `${page}-${dstCol}`;

      const sourceList = Array.from(layout[srcKey] ?? (srcCol === 'left' ? columns.left : columns.right));
      const destList = Array.from(layout[dstKey] ?? (dstCol === 'left' ? columns.left : columns.right));

      const [moved] = sourceList.splice(result.source.index, 1);
      destList.splice(result.destination.index, 0, moved);

      setLayout({
        ...layout,
        [srcKey]: sourceList,
        [dstKey]: destList,
      });
    }
  }

  function renderColumn(colId: 'left' | 'right', items: string[]) {
    return (
      <Droppable droppableId={colId}>
        {(provided, snapshot) => (
          <div
            className={`flex flex-col gap-6 min-h-[200px] transition-colors rounded-2xl p-2 ${
              snapshot.isDraggingOver && isEditing ? 'bg-cyan-50 ring-2 ring-cyan-300' : ''
            }`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {items.map((cardId, index) => {
              const CardComponent = CARD_REGISTRY[cardId];
              if (!CardComponent) return null;

              return (
                <Draggable
                  key={cardId}
                  draggableId={`${page}-${cardId}`}
                  index={index}
                  isDragDisabled={!isEditing}
                >
                  {(prov, snapshot) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      {...prov.dragHandleProps}
                      className={`
                        transition-all
                        ${isEditing ? 'cursor-grab active:cursor-grabbing ring-2 ring-cyan-400 rounded-2xl' : ''}
                        ${snapshot.isDragging ? 'opacity-50 scale-105 shadow-2xl' : ''}
                      `}
                    >
                      <CardComponent {...(cardProps[cardId] || {})} />
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {renderColumn('left', activeLeft)}
        {renderColumn('right', activeRight)}
      </div>
    </DragDropContext>
  );
}
