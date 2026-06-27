"use client";

import { useState } from "react";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, GripVertical, ZoomIn } from "lucide-react";

export interface ImageItem {
  id: string;
  filename: string;
  originalName: string;
  orderIndex: number;
}

interface SortableImageGridProps {
  images: ImageItem[];
  projectId: string;
  onReorder: (images: ImageItem[]) => void;
  onDelete: (imageId: string) => void;
  onPreview: (imageUrl: string) => void;
}

function SortableImageCard({
  image,
  index,
  projectId,
  onDelete,
  onPreview,
}: {
  image: ImageItem;
  index: number;
  projectId: string;
  onDelete: (id: string) => void;
  onPreview: (url: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  const imageUrl = `/uploads/${projectId}/${image.filename}`;

  return (
    <div ref={setNodeRef} style={style} className="image-grid-item">
      <div className="order-badge">{index + 1}</div>

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "rgba(0,0,0,0.6)",
          borderRadius: 6,
          padding: 4,
          cursor: "grab",
          zIndex: 3,
          display: "flex",
        }}
      >
        <GripVertical size={16} color="white" />
      </div>

      {/* Image */}
      <img
        src={imageUrl}
        alt={image.originalName}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Hover overlay */}
      <div className="overlay">
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: 12,
              fontWeight: 500,
              maxWidth: "60%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {image.originalName}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview(imageUrl);
              }}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: 6,
                padding: 6,
                cursor: "pointer",
                display: "flex",
                color: "white",
              }}
              title="Preview"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(image.id);
              }}
              style={{
                background: "rgba(239, 68, 68, 0.6)",
                border: "none",
                borderRadius: 6,
                padding: 6,
                cursor: "pointer",
                display: "flex",
                color: "white",
              }}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SortableImageGrid({
  images,
  projectId,
  onReorder,
  onDelete,
  onPreview,
}: SortableImageGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);

    const reordered = arrayMove(images, oldIndex, newIndex).map(
      (img, idx) => ({
        ...img,
        orderIndex: idx,
      })
    );

    onReorder(reordered);
  };

  if (images.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={images.map((img) => img.id)}
        strategy={rectSortingStrategy}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {images.map((image, index) => (
            <SortableImageCard
              key={image.id}
              image={image}
              index={index}
              projectId={projectId}
              onDelete={onDelete}
              onPreview={onPreview}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
