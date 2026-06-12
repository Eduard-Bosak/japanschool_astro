'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import {
  uploadFile,
  deleteFile,
  getAllFiles,
  assignFileToStudents,
  getFileAssignments,
  getFileUrl,
  formatFileSize,
  getFileIcon
} from '@/lib/storage';
import { FILE_CATEGORIES, type StorageFile, type FileCategory, type Profile } from '@/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Loader2,
  Upload,
  Trash2,
  MoreVertical,
  Users,
  Download,
  FolderOpen,
  FileText,
  Search,
  Filter,
  Eye,
  X
} from 'lucide-react';

export default function AdminMaterialsPage() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<FileCategory>('general');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadIsPublic, setUploadIsPublic] = useState(false);

  // Assign dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningFile, setAssigningFile] = useState<StorageFile | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch files
    const { data: filesData } = await getAllFiles();
    if (filesData) setFiles(filesData);

    // Fetch students
    const { data: studentsData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('email');

    if (studentsData) setStudents(studentsData);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter files
  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const { data, error } = await uploadFile(
      selectedFile,
      uploadCategory,
      uploadDescription || undefined,
      uploadIsPublic
    );

    if (error) {
      toast.error('Ошибка загрузки', { description: error.message });
    } else if (data) {
      toast.success('Файл загружен!');
      setFiles((prev) => [data, ...prev]);
      setUploadDialogOpen(false);
      resetUploadForm();
    }

    setUploading(false);
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadCategory('general');
    setUploadDescription('');
    setUploadIsPublic(false);
  };

  // Handle file delete
  const handleDelete = async (file: StorageFile) => {
    if (!confirm(`Удалить файл "${file.name}"?`)) return;

    const { error } = await deleteFile(file.id);

    if (error) {
      toast.error('Ошибка удаления', { description: error.message });
    } else {
      toast.success('Файл удалён');
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    }
  };

  // Handle download
  const handleDownload = async (file: StorageFile) => {
    const { url, error } = await getFileUrl(file.storage_path);

    if (error || !url) {
      toast.error('Ошибка получения ссылки');
      return;
    }

    window.open(url, '_blank');
  };

  // Open assign dialog
  const openAssignDialog = async (file: StorageFile) => {
    setAssigningFile(file);
    setSelectedStudents([]);

    // Get current assignments
    const { data } = await getFileAssignments(file.id);
    const assigned = data?.map((a) => a.student_id) || [];
    setAssignedStudents(assigned);
    setSelectedStudents(assigned);

    setAssignDialogOpen(true);
  };

  // Handle assign
  const handleAssign = async () => {
    if (!assigningFile) return;

    const { error } = await assignFileToStudents(assigningFile.id, selectedStudents);

    if (error) {
      toast.error('Ошибка назначения', { description: error.message });
    } else {
      toast.success('Материал назначен ученикам!');
      setAssignDialogOpen(false);
    }
  };

  // Toggle student selection
  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Учебные материалы</h1>
          <p className="text-muted-foreground">Загружайте файлы и назначайте их ученикам</p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Загрузить файл
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{files.length}</p>
                <p className="text-sm text-muted-foreground">Всего файлов</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{files.filter((f) => f.is_public).length}</p>
                <p className="text-sm text-muted-foreground">Публичных</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FolderOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatFileSize(files.reduce((acc, f) => acc + f.size_bytes, 0))}
                </p>
                <p className="text-sm text-muted-foreground">Занято места</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">Учеников</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
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

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>Файлы ({filteredFiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {files.length === 0
                ? 'Нет загруженных файлов. Нажмите "Загрузить файл" чтобы начать.'
                : 'Файлы не найдены по заданным фильтрам'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Файл</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Размер</TableHead>
                  <TableHead>Доступ</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFileIcon(file.mime_type)}</span>
                        <div>
                          <p className="font-medium">{file.name}</p>
                          {file.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {file.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {FILE_CATEGORIES.find((c) => c.value === file.category)?.label ||
                          file.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(file.size_bytes)}</TableCell>
                    <TableCell>
                      {file.is_public ? (
                        <Badge className="bg-green-100 text-green-700">Публичный</Badge>
                      ) : (
                        <Badge variant="outline">По назначению</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(file.created_at), 'd MMM yyyy', { locale: ru })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(file)}>
                            <Download className="mr-2 h-4 w-4" />
                            Скачать
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openAssignDialog(file)}>
                            <Users className="mr-2 h-4 w-4" />
                            Назначить ученикам
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(file)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Загрузить файл</DialogTitle>
            <DialogDescription>Выберите файл и укажите параметры</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File input */}
            <div className="space-y-2">
              <Label>Файл</Label>
              {selectedFile ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getFileIcon(selectedFile.type)}</span>
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Нажмите для выбора файла</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, изображения, аудио, видео
                    </p>
                  </label>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select
                value={uploadCategory}
                onValueChange={(value: string) => setUploadCategory(value as FileCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Описание (опционально)</Label>
              <Input
                placeholder="Краткое описание файла"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              />
            </div>

            {/* Public checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="is-public"
                checked={uploadIsPublic}
                onCheckedChange={(checked) => setUploadIsPublic(checked as boolean)}
              />
              <Label htmlFor="is-public" className="cursor-pointer">
                Доступен всем ученикам
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Загрузить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Назначить ученикам</DialogTitle>
            <DialogDescription>{assigningFile?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {students.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Нет учеников</p>
            ) : (
              students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleStudent(student.id)}
                >
                  <Checkbox
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={() => toggleStudent(student.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{student.display_name || student.email}</p>
                    {student.display_name && (
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    )}
                  </div>
                  {assignedStudents.includes(student.id) && (
                    <Badge variant="secondary" className="text-xs">
                      Уже назначен
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAssign}>Сохранить ({selectedStudents.length})</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
