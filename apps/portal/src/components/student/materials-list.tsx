'use client';

import { Button } from '@/components/ui/button';
import { FileText, Link as LinkIcon, ExternalLink } from 'lucide-react';
import type { Material } from '@/types';

interface MaterialsListProps {
  materials: Material[];
}

export function MaterialsList({ materials }: MaterialsListProps) {
  if (materials.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <FileText className="h-10 w-10 opacity-20" />
          <p>У вас пока нет учебных материалов</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {materials.map((material) => (
        <div
          key={material.id}
          className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0 group-hover:bg-blue-100 transition-colors">
              {material.type === 'link' ? (
                <LinkIcon className="h-6 w-6" />
              ) : (
                <FileText className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-medium truncate pr-2">{material.title}</h3>
              <p className="text-xs text-muted-foreground capitalize">{material.type}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <a href={material.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      ))}
    </div>
  );
}
