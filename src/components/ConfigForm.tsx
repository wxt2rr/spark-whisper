import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Rocket, Eye, X, Copy, Check } from 'lucide-react';
import { BlessingItem, ConfigPayload } from '../types';
import { SortableItem } from './SortableItem';
import { encodePayload } from '../utils/urlManager';

interface ConfigFormProps {
  onPreview: (payload: ConfigPayload) => void;
}

export function ConfigForm({ onPreview }: ConfigFormProps) {
  const [items, setItems] = useState<BlessingItem[]>([
    { id: '1', content: '新年快乐！' },
    { id: '2', content: '万事如意！' },
  ]);
  const [to, setTo] = useState('你');
  const [from, setFrom] = useState('未来');
  const [introMessage, setIntroMessage] = useState('这是一封不需要回复的信。只要打开，烟花就会替你把话说出去。');
  const [envelopeTitle, setEnvelopeTitle] = useState('时光邮局 · 特快件');
  const [envelopeYear, setEnvelopeYear] = useState(String(new Date().getFullYear()));
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    description?: string;
    url?: string;
    copied?: boolean;
  }>({ open: false, title: '' });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addItem = () => {
    if (items.length >= 5) {
      setDialog({
        open: true,
        title: '提示',
        description: '最多添加 5 条祝福语',
      });
      return;
    }
    const newItem: BlessingItem = {
      id: Math.random().toString(36).slice(2, 11),
      content: '',
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, content: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, content } : item)));
  };

  const handlePublish = () => {
    const payload: ConfigPayload = { items, to, from, introMessage, envelopeTitle, envelopeYear };
    const encoded = encodePayload(payload);
    const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`;

    setDialog({
      open: true,
      title: '链接已生成',
      description: '已为你生成分享链接，可复制发送给好友。',
      url,
      copied: false,
    });

    navigator.clipboard
      .writeText(url)
      .then(() => {
        setDialog((prev) => (prev.open ? { ...prev, copied: true } : prev));
      })
      .catch(() => {
        setDialog((prev) => (prev.open ? { ...prev, copied: false } : prev));
      });
  };

  return (
    <div className="w-full max-w-md bg-slate-900/80 p-6 rounded-2xl backdrop-blur-xl border border-slate-700/50 shadow-2xl">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
          定制你的专属祝福
        </h2>
        <p className="text-slate-400 text-sm mt-2">添加祝福语，生成专属烟花秀</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs text-slate-400 mb-1 ml-1">To</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="你"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 ml-1">From</label>
          <input
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="未来"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs text-slate-400 mb-1 ml-1">信封抬头</label>
          <input
            type="text"
            value={envelopeTitle}
            onChange={(e) => setEnvelopeTitle(e.target.value)}
            placeholder="时光邮局 · 特快件"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 ml-1">信封年份</label>
          <input
            type="text"
            value={envelopeYear}
            onChange={(e) => setEnvelopeYear(e.target.value)}
            placeholder="2026"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-xs text-slate-400 mb-1 ml-1">信封留言</label>
        <textarea
          value={introMessage}
          onChange={(e) => setIntroMessage(e.target.value)}
          placeholder="这是一封不需要回复的信..."
          rows={2}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
        />
      </div>

      <div className="mb-1 ml-1">
        <label className="block text-xs text-slate-400">烟花文字</label>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 mb-6">
            {items.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                onRemove={removeItem}
                onChange={updateItem}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="grid grid-cols-1 gap-3 mb-8">
        <button
          onClick={addItem}
          className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors border border-slate-700 border-dashed"
        >
          <Plus size={16} /> 添加祝福语
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
            onClick={() => onPreview({ items, to, from, introMessage, envelopeTitle, envelopeYear })}
            className="flex items-center justify-center gap-2 py-3 px-6 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-all"
        >
            <Eye size={18} /> 预览
        </button>
        <button
            onClick={handlePublish}
            className="flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 rounded-xl font-semibold shadow-lg shadow-pink-500/20 transition-all"
        >
            <Rocket size={18} /> 发布
        </button>
      </div>

      {dialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDialog((prev) => ({ ...prev, open: false }))}
            aria-label="关闭弹窗"
          />
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900/95 border border-slate-700/60 shadow-2xl p-5">
            <button
              type="button"
              onClick={() => setDialog((prev) => ({ ...prev, open: false }))}
              className="absolute top-3 right-3 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="关闭"
            >
              <X size={18} />
            </button>

            <div className="text-lg font-semibold text-white">{dialog.title}</div>
            {dialog.description && <div className="mt-2 text-sm text-slate-300">{dialog.description}</div>}

            {dialog.url && (
              <div className="mt-4">
                <div className="text-xs text-slate-400 mb-2">分享链接</div>
                <input
                  value={dialog.url}
                  readOnly
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-pink-500/50"
                />
              </div>
            )}

            <div className="mt-5 flex gap-3 justify-end">
              {dialog.url && (
                <button
                  type="button"
                  onClick={() => {
                    const url = dialog.url ?? '';
                    if (!url) return;
                    navigator.clipboard
                      .writeText(url)
                      .then(() => setDialog((prev) => ({ ...prev, copied: true })))
                      .catch(() => setDialog((prev) => ({ ...prev, copied: false })));
                  }}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 font-semibold text-sm transition-all"
                >
                  {dialog.copied ? <Check size={16} /> : <Copy size={16} />}
                  {dialog.copied ? '已复制' : '复制链接'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setDialog((prev) => ({ ...prev, open: false }))}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
