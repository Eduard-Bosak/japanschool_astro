'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  History,
  FileText,
  Link as LinkIcon,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

type StudentProfile = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  role: string;
  balance: number;
};

type BookingHistory = {
  id: string;
  start_time: string;
  created_at: string;
  status?: string;
};

type Material = {
  id: string;
  title: string;
  url: string;
  type: string;
  created_at: string;
};

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [, setStudent] = useState<StudentProfile | null>(null);
  const [, setNote] = useState('');
  const [bookings, setBookings] = useState<BookingHistory[]>([]);

  // New state for Cabinet 2.0 features
  const [balance, setBalance] = useState(0);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialUrl, setNewMaterialUrl] = useState('');
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);

  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile (with balance)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();

      if (profileError) throw profileError;
      setStudent(profile);
      setBalance(profile.balance || 0);

      // 2. Fetch Note
      const { data: noteData } = await supabase
        .from('student_notes')
        .select('note')
        .eq('student_id', studentId)
        .single();

      if (noteData) {
        setNote(noteData.note);
      }

      // 3. Fetch Booking History
      const { data: slots } = await supabase
        .from('slots')
        .select('*')
        .eq('student_id', studentId)
        .order('start_time', { ascending: false });

      if (slots) {
        setBookings(slots);
      }

      // 4. Fetch Materials
      const { data: materialsData } = await supabase
        .from('materials')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (materialsData) {
        setMaterials(materialsData);
      }
    } catch (error) {
      toast.error('Ошибка загрузки данных', {
        description: (error as Error).message
      });
      router.push('/admin/students');
    } finally {
      setLoading(false);
    }
  }, [studentId, router]);

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId, fetchStudentData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleUpdateBalance = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ balance: balance })
        .eq('id', studentId);

      if (error) throw error;
      toast.success('Баланс обновлен');
    } catch (error) {
      toast.error('Ошибка обновления баланса', { description: (error as Error).message });
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterialTitle || !newMaterialUrl) return;
    try {
      const { data, error } = await supabase
        .from('materials')
        .insert({
          student_id: studentId,
          title: newMaterialTitle,
          url: newMaterialUrl,
          type: 'link'
        })
        .select()
        .single();

      if (error) throw error;

      setMaterials([data, ...materials]);
      setNewMaterialTitle('');
      setNewMaterialUrl('');
      setIsAddingMaterial(false);
      toast.success('Материал добавлен');
    } catch (error) {
      toast.error('Ошибка добавления', { description: (error as Error).message });
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
      setMaterials(materials.filter((m) => m.id !== id));
      toast.success('Материал удален');
    } catch (error) {
      toast.error('Ошибка удаления', { description: (error as Error).message });
    }
  };
  return (
    <div className="space-y-6">
      {/* ... header ... */}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 md:col-span-1">
          {/* Profile Card */}
          {/* ... existing profile card ... */}

          {/* Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                  ¥
                </div>
                Баланс уроков
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(parseInt(e.target.value) || 0)}
                  className="text-2xl font-bold text-center h-12"
                />
                <Button onClick={handleUpdateBalance}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Количество оплаченных уроков
              </p>
            </CardContent>
          </Card>

          {/* Notes Card */}
          {/* ... existing notes card ... */}
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Materials Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Учебные материалы
                </CardTitle>
                <CardDescription>Ссылки на учебники, файлы и домашние задания</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingMaterial(!isAddingMaterial)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAddingMaterial && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                  <div className="grid gap-2">
                    <Label>Название</Label>
                    <Input
                      placeholder="Например: Учебник Genki I"
                      value={newMaterialTitle}
                      onChange={(e) => setNewMaterialTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Ссылка (URL)</Label>
                    <Input
                      placeholder="https://..."
                      value={newMaterialUrl}
                      onChange={(e) => setNewMaterialUrl(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsAddingMaterial(false)}>
                      Отмена
                    </Button>
                    <Button size="sm" onClick={handleAddMaterial}>
                      Добавить
                    </Button>
                  </div>
                </div>
              )}

              {materials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Нет материалов</div>
              ) : (
                <div className="space-y-2">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                          <LinkIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{material.title}</p>
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:underline flex items-center gap-1 truncate"
                          >
                            {material.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteMaterial(material.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                История занятий
              </CardTitle>
              <CardDescription>Список всех прошедших и предстоящих занятий</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Нет записей на занятия</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата и время</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Записан</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => {
                      const isPast = new Date(booking.start_time) < new Date();

                      let statusBadge = null;
                      if (booking.status === 'completed') {
                        statusBadge = (
                          <Badge className="bg-green-600 hover:bg-green-700">Проведен</Badge>
                        );
                      } else if (booking.status === 'missed') {
                        statusBadge = <Badge variant="destructive">Прогул</Badge>;
                      } else if (
                        booking.status === 'canceled_student' ||
                        booking.status === 'canceled_teacher'
                      ) {
                        statusBadge = (
                          <Badge variant="outline" className="text-red-500 border-red-200">
                            Отмена
                          </Badge>
                        );
                      } else if (isPast) {
                        statusBadge = (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-600 border-yellow-200"
                          >
                            Ожидает
                          </Badge>
                        );
                      } else {
                        statusBadge = (
                          <Badge className="bg-blue-600 hover:bg-blue-700">Предстоит</Badge>
                        );
                      }

                      return (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">
                            {format(new Date(booking.start_time), 'd MMMM yyyy, HH:mm', {
                              locale: ru
                            })}
                          </TableCell>
                          <TableCell>{statusBadge}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(booking.created_at), 'd.MM.yyyy HH:mm')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
