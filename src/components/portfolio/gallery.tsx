"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import type { GalleryItem } from "@/lib/cms/model";
export function Gallery({ images }: { images: GalleryItem[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  return (
    <>
      <div className="gallery-grid">
        {images.map((image, i) => (
          <figure key={`${image.url}-${i}`}>
            <button
              className="gallery-image"
              aria-label={`Enlarge ${image.alt || "project screenshot"}`}
              onClick={() => {
                setSelected(image);
                dialog.current?.showModal();
              }}
            >
              <Image
                src={image.url}
                alt={image.alt || "Project screenshot"}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-contain"
              />
            </button>
            {image.caption && <figcaption>{image.caption}</figcaption>}
          </figure>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="lightbox"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <button
          className="pill"
          onClick={() => dialog.current?.close()}
          autoFocus
        >
          Close preview
        </button>
        {selected && (
          <div className="lightbox-image">
            <Image
              src={selected.url}
              alt={selected.alt || "Project screenshot"}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
        )}
        <p>{selected?.caption}</p>
      </dialog>
    </>
  );
}
