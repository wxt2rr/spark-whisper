import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Type } from 'lucide-react';
import { BlessingItem } from '../types';

interface SortableItemProps {
  item: BlessingItem;
  onRemove: (id: string) => void;
  onChange: (id: string, value: string) => void;
}

export function SortableItem({ item, onRemove, onChange }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700 mb-2"
    >
      <button {...attributes} {...listeners} className="cursor-grab hover:text-slate-300 text-slate-500">
        <GripVertical size={20} />
      </button>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Type size={18} className="text-blue-400" />
          <input
            type="text"
            value={item.content}
            onChange={(e) => onChange(item.id, e.target.value)}
            placeholder="输入祝福语 (20字以内)"
            maxLength={20}
            className="bg-transparent border-none focus:ring-0 text-white w-full placeholder-slate-500"
          />
        </div>
      </div>

      <button onClick={() => onRemove(item.id)} className="text-slate-500 hover:text-red-400">
        <Trash2 size={18} />
      </button>
    </div>
  );
}
