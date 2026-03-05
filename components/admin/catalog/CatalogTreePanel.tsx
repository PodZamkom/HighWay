"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Search } from "lucide-react";
import type { CatalogTreeNode, CatalogTreePath } from "@/components/admin/catalog/types";
import { isPathEqual, pathLabel } from "@/components/admin/catalog/types";

interface CatalogTreePanelProps {
  tree: CatalogTreeNode[];
  selectedPath: CatalogTreePath | null;
  onSelectPath: (path: CatalogTreePath | null) => void;
  onQuickCreate: (path: CatalogTreePath | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
}

function collectIds(nodes: CatalogTreeNode[], acc: Set<string>) {
  for (const node of nodes) {
    acc.add(node.id);
    collectIds(node.children, acc);
  }
}

function normalizeGenerationLabel(value: string) {
  return value.trim() ? value : "Без комплектации";
}

export function CatalogTreePanel({
  tree,
  selectedPath,
  onSelectPath,
  onQuickCreate,
  search,
  onSearchChange,
  loading,
}: CatalogTreePanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (search.trim()) {
        collectIds(tree, next);
      } else {
        for (const root of tree) {
          next.add(root.id);
        }
      }
      return next;
    });
  }, [tree, search]);

  const selectedLabel = useMemo(() => pathLabel(selectedPath), [selectedPath]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderNode = (node: CatalogTreeNode, depth: number) => {
    const isExpanded = expanded.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelected = isPathEqual(node.path, selectedPath);

    return (
      <li key={node.id} role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
        <div
          className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 ${
            isSelected ? "bg-orange-500/20" : "hover:bg-white/5"
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          <button
            type="button"
            onClick={() => (hasChildren ? toggleExpanded(node.id) : onSelectPath(node.path))}
            className="inline-flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
            aria-label={hasChildren ? "Развернуть раздел" : "Выбрать узел"}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectPath(node.path)}
            className={`min-w-0 flex-1 truncate text-left text-sm ${isSelected ? "font-semibold text-white" : "text-zinc-200"}`}
            aria-current={isSelected ? "true" : undefined}
          >
            {node.level === "generation" ? normalizeGenerationLabel(node.label) : node.label}
          </button>

          <span className="text-[11px] text-zinc-500">{node.count}</span>
          <button
            type="button"
            onClick={() => onQuickCreate(node.path)}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-zinc-500 opacity-0 transition hover:bg-orange-500/20 hover:text-orange-300 group-hover:opacity-100 focus:opacity-100"
            aria-label="Создать автомобиль в выбранном узле"
          >
            <Plus size={12} />
          </button>
        </div>

        {hasChildren && isExpanded ? <ul role="group">{node.children.map((child) => renderNode(child, depth + 1))}</ul> : null}
      </li>
    );
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-900 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Навигация каталога</h2>
        <button
          type="button"
          onClick={() => onQuickCreate(selectedPath)}
          className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1 text-[11px] font-semibold text-zinc-200 hover:border-orange-400"
        >
          <Plus size={12} />
          Новый
        </button>
      </div>

      <p className="mb-3 text-xs text-zinc-500">Текущий узел: {selectedLabel}</p>

      <label className="mb-3 block">
        <span className="sr-only">Поиск по дереву</span>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <Search size={14} className="text-zinc-500" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Поиск по марке, модели, комплектации..."
            className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
          />
        </div>
      </label>

      <button
        type="button"
        onClick={() => onSelectPath(null)}
        className={`mb-3 w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
          selectedPath === null
            ? "border-orange-500/50 bg-orange-500/15 text-orange-200"
            : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/20"
        }`}
      >
        Все автомобили
      </button>

      {loading ? (
        <div className="py-10 text-center text-sm text-zinc-500">Загрузка дерева...</div>
      ) : tree.length > 0 ? (
        <ul role="tree" className="max-h-[64vh] space-y-1 overflow-y-auto pr-1">
          {tree.map((node) => renderNode(node, 0))}
        </ul>
      ) : (
        <div className="py-8 text-sm text-zinc-500">Ничего не найдено по текущему фильтру.</div>
      )}
    </section>
  );
}
