'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TrialRequest {
  id: string;
  name: string;
  email: string;
  goal: string | null;
  level: string | null;
  message: string | null;
  phone: string | null;
  status: 'new' | 'contacted' | 'scheduled' | 'completed' | 'cancelled';
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  notes: string | null;
}

const STATUS_LABELS: Record<TrialRequest['status'], string> = {
  new: 'Новая',
  contacted: 'Связались',
  scheduled: 'Назначен урок',
  completed: 'Завершено',
  cancelled: 'Отменено'
};

const STATUS_COLORS: Record<TrialRequest['status'], string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
};

export default function TrialRequestsPage() {
  const [requests, setRequests] = useState<TrialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TrialRequest['status'] | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<TrialRequest | null>(null);

  const supabase = createClientComponentClient();

  const fetchRequests = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('trial_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching trial requests:', error);
    } else {
      setRequests(data || []);
    }

    setLoading(false);
  }, [supabase, filter]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);

      let query = supabase
        .from('trial_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (!mounted) return;

      if (error) {
        console.error('Error fetching trial requests:', error);
      } else {
        setRequests(data || []);
      }

      setLoading(false);
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [supabase, filter]);

  async function updateStatus(id: string, newStatus: TrialRequest['status']) {
    const { error } = await supabase
      .from('trial_requests')
      .update({
        status: newStatus,
        contacted_at: newStatus === 'contacted' ? new Date().toISOString() : undefined
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      return;
    }

    fetchRequests();
    if (selectedRequest?.id === id) {
      setSelectedRequest((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  }

  async function updateNotes(id: string, notes: string) {
    const { error } = await supabase.from('trial_requests').update({ notes }).eq('id', id);

    if (!error) {
      fetchRequests();
    }
  }

  const counts = requests.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Заявки на пробный урок</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Заявки с лендинга — студенты без регистрации
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          ↻ Обновить
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'new', 'contacted', 'scheduled', 'completed', 'cancelled'] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                filter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {status === 'all' ? 'Все' : STATUS_LABELS[status]}
              <span className="ml-1.5 opacity-60">({counts[status] || 0})</span>
            </button>
          )
        )}
      </div>

      {/* Requests Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Нет заявок{filter !== 'all' && ' с таким статусом'}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Имя</th>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Цель / Уровень</th>
                <th className="text-left p-3 font-medium">Статус</th>
                <th className="text-left p-3 font-medium">Когда</th>
                <th className="text-left p-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((request) => (
                <tr
                  key={request.id}
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <td className="p-3 font-medium">{request.name}</td>
                  <td className="p-3">
                    <a
                      href={`mailto:${request.email}`}
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {request.email}
                    </a>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {request.goal && <span>{request.goal}</span>}
                    {request.goal && request.level && ' · '}
                    {request.level && <span>{request.level}</span>}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[request.status]}`}
                    >
                      {STATUS_LABELS[request.status]}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(request.created_at), {
                      addSuffix: true,
                      locale: ru
                    })}
                  </td>
                  <td className="p-3">
                    <select
                      value={request.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateStatus(request.id, e.target.value as TrialRequest['status']);
                      }}
                      className="text-sm border rounded px-2 py-1 bg-background"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Статус заявки ${request.name}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="bg-background rounded-lg p-6 max-w-lg w-full space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedRequest.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedRequest.created_at), 'dd MMM yyyy, HH:mm', {
                    locale: ru
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-muted-foreground hover:text-foreground text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p>
                  <a
                    href={`mailto:${selectedRequest.email}`}
                    className="text-primary hover:underline"
                  >
                    {selectedRequest.email}
                  </a>
                </p>
              </div>

              {selectedRequest.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Телефон</label>
                  <p>
                    <a
                      href={`tel:${selectedRequest.phone}`}
                      className="text-primary hover:underline"
                    >
                      {selectedRequest.phone}
                    </a>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {selectedRequest.goal && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Цель</label>
                    <p>{selectedRequest.goal}</p>
                  </div>
                )}
                {selectedRequest.level && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Уровень</label>
                    <p>{selectedRequest.level}</p>
                  </div>
                )}
              </div>

              {selectedRequest.message && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Сообщение</label>
                  <p className="whitespace-pre-wrap">{selectedRequest.message}</p>
                </div>
              )}

              {(selectedRequest.utm_source ||
                selectedRequest.utm_medium ||
                selectedRequest.utm_campaign) && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">UTM</label>
                  <p className="text-sm text-muted-foreground">
                    {[
                      selectedRequest.utm_source,
                      selectedRequest.utm_medium,
                      selectedRequest.utm_campaign
                    ]
                      .filter(Boolean)
                      .join(' / ')}
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="modal-status" className="text-sm font-medium text-muted-foreground">
                  Статус
                </label>
                <select
                  id="modal-status"
                  value={selectedRequest.status}
                  onChange={(e) =>
                    updateStatus(selectedRequest.id, e.target.value as TrialRequest['status'])
                  }
                  className="mt-1 w-full border rounded px-3 py-2 bg-background"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="modal-notes" className="text-sm font-medium text-muted-foreground">
                  Заметки
                </label>
                <textarea
                  id="modal-notes"
                  defaultValue={selectedRequest.notes || ''}
                  onBlur={(e) => updateNotes(selectedRequest.id, e.target.value)}
                  placeholder="Добавить заметку..."
                  className="mt-1 w-full border rounded px-3 py-2 bg-background min-h-20 resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
