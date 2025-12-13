'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, FileText, Link as LinkIcon, Video, ExternalLink, Download } from 'lucide-react';
import type { Material } from '@/types';

type FilterType = 'all' | 'link' | 'file' | 'video';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('materials')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    setMaterials(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const filteredMaterials = materials.filter((m) => {
    if (filter === 'all') return true;
    return m.type === filter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'link':
        return <LinkIcon className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'link':
        return 'Ссылка';
      case 'video':
        return 'Видео';
      default:
        return 'Файл';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Учебные материалы</h1>
        <p className="text-neutral-500">Файлы и ссылки от преподавателя</p>
      </div>

      {/* Filters */}
      <Card className="!bg-white !border-neutral-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Все', icon: null },
              { value: 'link', label: 'Ссылки', icon: LinkIcon },
              { value: 'file', label: 'Файлы', icon: FileText },
              { value: 'video', label: 'Видео', icon: Video }
            ].map((item) => (
              <Button
                key={item.value}
                variant={filter === item.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(item.value as FilterType)}
                className={
                  filter === item.value
                    ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }
              >
                {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                {item.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Materials List */}
      <Card className="!bg-white !border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-neutral-900">Материалы ({filteredMaterials.length})</CardTitle>
          <CardDescription className="text-neutral-500">
            Нажмите на материал для просмотра или скачивания
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              {filter === 'all'
                ? 'Преподаватель пока не добавил материалы'
                : 'Нет материалов выбранного типа'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMaterials.map((material) => (
                <a
                  key={material.id}
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-neutral-400 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-neutral-200 text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                      {getTypeIcon(material.type)}
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900 group-hover:text-neutral-700 transition-colors">
                        {material.title}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {format(new Date(material.created_at), 'd MMMM yyyy', { locale: ru })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-neutral-100 text-neutral-600 border-neutral-200">
                      {getTypeLabel(material.type)}
                    </Badge>
                    <ExternalLink className="h-4 w-4 text-neutral-400 group-hover:text-neutral-700 transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
