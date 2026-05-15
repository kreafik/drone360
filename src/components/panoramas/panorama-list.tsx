"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { PanoramaCard } from "./panorama-card";
import { UploadModal } from "@/components/upload/upload-modal";

export interface PanoramaItem {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  status: string;
  position: number;
}

interface PanoramaListProps {
  projectId: string;
  initialPanoramas: PanoramaItem[];
}

export function PanoramaList({ projectId, initialPanoramas }: PanoramaListProps) {
  const [panoramas, setPanoramas] = useState(initialPanoramas);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = panoramas.findIndex((p) => p.id === active.id);
    const newIndex = panoramas.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(panoramas, oldIndex, newIndex);
    setPanoramas(reordered);

    const res = await fetch(`/api/projects/${projectId}/panoramas/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((p) => p.id) }),
    });

    if (!res.ok) {
      toast.error("Sıralama kaydedilemedi.");
      setPanoramas(panoramas);
    }
  }

  function handleDelete(id: string) {
    setPanoramas((prev) => prev.filter((p) => p.id !== id));
  }

  function handleTitleChange(id: string, title: string) {
    setPanoramas((prev) => prev.map((p) => (p.id === id ? { ...p, title } : p)));
  }

  if (panoramas.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <UploadModal projectId={projectId} />
        </div>
        <div className="flex flex-col items-center text-center py-16 rounded-xl border border-dashed border-border">
          <div className="size-14 rounded-full bg-surface-elevated grid place-items-center mb-4">
            <ImageIcon className="size-6 text-subtle" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-xl mb-2">Henüz panorama yok</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            360° görüntülerinizi yükleyerek bu projeye ekleyin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {panoramas.length} panorama
        </p>
        <UploadModal projectId={projectId} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={panoramas.map((p) => p.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {panoramas.map((p) => (
              <PanoramaCard
                key={p.id}
                id={p.id}
                title={p.title}
                thumbnailUrl={p.thumbnailUrl}
                status={p.status}
                onDelete={handleDelete}
                onTitleChange={handleTitleChange}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
