"use client";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Deck } from "@/types/types";
import DeckCard from "@/components/DeckCard";

interface DeckListProps {
    decks: Deck[];
    onReorder: (ordered: Deck[]) => void;
    onUpdate: (id: string, patch: Partial<Deck>) => void;
    onRemove: (id: string) => void;
}

interface SortableItemProps {
    deck: Deck;
    onUpdate: (patch: Partial<Deck>) => void;
    onRemove: () => void;
}

function SortableItem({ deck, onUpdate, onRemove }: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deck.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <DeckCard
                deck={deck}
                isSortable
                dragHandleProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLButtonElement>}
                onUpdate={onUpdate}
                onRemove={onRemove}
            />
        </div>
    );
}

export default function DeckList({ decks, onReorder, onUpdate, onRemove }: DeckListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIdx = decks.findIndex(d => d.id === active.id);
            const newIdx = decks.findIndex(d => d.id === over.id);
            if (oldIdx !== -1 && newIdx !== -1) {
                onReorder(arrayMove(decks, oldIdx, newIdx));
            }
        }
    }

    if (decks.length === 0) return null;

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={decks.map(d => d.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-4">
                    {decks.map(deck => (
                        <SortableItem
                            key={deck.id}
                            deck={deck}
                            onUpdate={(patch) => onUpdate(deck.id, patch)}
                            onRemove={() => onRemove(deck.id)}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
