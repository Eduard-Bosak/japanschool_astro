'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import {
  getStudentFiles,
  markFileAsViewed,
  getFileUrl,
  formatFileSize,
  getFileIcon
} from '@/lib/storage';
import { FILE_CATEGORIES, type StorageFile } from '@/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Loader2,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Eye,
  FolderOpen,
  Sparkles
} from 'lucide-react';

type MaterialWithAssignment = StorageFile & {
  viewed_at?: string | null;
  assigned_at?: string | null;
};

type StudentFileResult = {
  id: string;
  student_id: string;
  file_id: string;
  is_viewed: boolean;
  viewed_at: string | null;
  assigned_at: string;
  file: StorageFile;
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialWithAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await getStudentFiles(user.id);

    // Transform data to flat structure
    const transformed: MaterialWithAssignment[] = (data || []).map((item: StudentFileResult) => ({
      ...item.file,
      viewed_at: item.viewed_at,
      assigned_at: item.assigned_at
    }));

    setMaterials(transformed);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Filter materials
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Count unviewed
  const unviewedCount = materials.filter((m) => !m.viewed_at).length;

  // Handle download
  const handleDownload = async (file: MaterialWithAssignment) => {
    // Mark as viewed if not already
    if (!file.viewed_at) {
      await markFileAsViewed(file.id);
      setMaterials((prev) =>
        prev.map((m) => (m.id === file.id ? { ...m, viewed_at: new Date().toISOString() } : m))
      );
    }

    // Get download URL
    const { url, error } = await getFileUrl(file.storage_path);

    if (error || !url) {
      toast.error('Не удалось получить ссылку для скачивания');
      return;
    }

    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-900 dark:text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Учебные материалы</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Файлы от преподавателя</p>
        </div>
        {unviewedCount > 0 && (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 self-start sm:self-auto">
            <Sparkles className="mr-1 h-3 w-3" />
            {unviewedCount} новых
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="!bg-white dark:!bg-neutral-900 !border-neutral-200 dark:!border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {materials.length}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Всего файлов</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="!bg-white dark:!bg-neutral-900 !border-neutral-200 dark:!border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {materials.filter((m) => m.viewed_at).length}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Просмотрено</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="!bg-white dark:!bg-neutral-900 !border-neutral-200 dark:!border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {unviewedCount}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Не просмотрено</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="!bg-white dark:!bg-neutral-900 !border-neutral-200 dark:!border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Download className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {formatFileSize(materials.reduce((acc, f) => acc + f.size_bytes, 0))}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Общий размер</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="!bg-white dark:!bg-neutral-900 !border-neutral-200 dark:!border-neutral-800 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {FILE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Materials List */}
      <Card className="!bg-white dark:!bg-neutral-900 !border-neutral-200 dark:!border-neutral-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-white">
            Материалы ({filteredMaterials.length})
          </CardTitle>
          <CardDescription className="text-neutral-500 dark:text-neutral-400">
            Нажмите на материал для скачивания
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              {materials.length === 0
                ? 'Преподаватель пока не добавил материалы'
                : 'Нет материалов по заданным фильтрам'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMaterials.map((material) => (
                <button
                  key={material.id}
                  onClick={() => handleDownload(material)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors group text-left
                    ${
                      !material.viewed_at
                        ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600'
                        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-3xl p-2 rounded-lg
                      ${
                        !material.viewed_at
                          ? 'bg-amber-100 dark:bg-amber-900/30'
                          : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}
                    >
                      {getFileIcon(material.mime_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {material.name}
                        </span>
                        {!material.viewed_at && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 text-xs">
                            Новый
                          </Badge>
                        )}
                      </div>
                      {material.description && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {material.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                        <span>{formatFileSize(material.size_bytes)}</span>
                        <span>•</span>
                        <span>
                          {format(
                            new Date(material.assigned_at || material.created_at),
                            'd MMM yyyy',
                            { locale: ru }
                          )}
                        </span>
                        {material.viewed_at && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Просмотрен
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 border-0">
                      {FILE_CATEGORIES.find((c) => c.value === material.category)?.label ||
                        material.category}
                    </Badge>
                    <Download className="h-5 w-5 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
