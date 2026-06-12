import { supabase } from './supabase';
import type { StorageFile, StudentMaterial, FileCategory } from '@/types';

const BUCKET_NAME = 'materials';

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  category: FileCategory = 'general',
  description?: string,
  isPublic: boolean = false
): Promise<{ data: StorageFile | null; error: Error | null }> {
  try {
    // Generate unique path
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${category}/${timestamp}_${safeName}`;

    // Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get current user
    const {
      data: { user }
    } = await supabase.auth.getUser();

    // Save metadata to database
    const { data, error: dbError } = await supabase
      .from('storage_files')
      .insert({
        name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
        category,
        description,
        uploaded_by: user?.id,
        is_public: isPublic
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: delete uploaded file
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      throw dbError;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a file from Storage and database
 */
export async function deleteFile(fileId: string): Promise<{ error: Error | null }> {
  try {
    // Get file info first
    const { data: file, error: fetchError } = await supabase
      .from('storage_files')
      .select('storage_path')
      .eq('id', fileId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([file.storage_path]);

    if (storageError) throw storageError;

    // Delete from database (will cascade to student_materials)
    const { error: dbError } = await supabase.from('storage_files').delete().eq('id', fileId);

    if (dbError) throw dbError;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Get all files (for admin)
 */
export async function getAllFiles(
  category?: FileCategory
): Promise<{ data: StorageFile[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from('storage_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get files for a specific student
 */
export async function getStudentFiles(
  studentId: string
): Promise<{ data: (StudentMaterial & { file: StorageFile })[] | null; error: Error | null }> {
  try {
    // Get assigned files
    const { data: assigned, error: assignedError } = await supabase
      .from('student_materials')
      .select(
        `
        *,
        file:storage_files(*)
      `
      )
      .eq('student_id', studentId)
      .order('assigned_at', { ascending: false });

    if (assignedError) throw assignedError;

    // Get public files not yet assigned
    const { data: publicFiles, error: publicError } = await supabase
      .from('storage_files')
      .select('*')
      .eq('is_public', true);

    if (publicError) throw publicError;

    // Combine: assigned files + public files (as virtual assignments)
    const assignedFileIds = new Set(assigned?.map((a) => a.file_id) || []);
    const publicNotAssigned = publicFiles?.filter((f) => !assignedFileIds.has(f.id)) || [];

    const virtualAssignments: (StudentMaterial & { file: StorageFile })[] = publicNotAssigned.map(
      (file) => ({
        id: `public_${file.id}`,
        student_id: studentId,
        file_id: file.id,
        is_viewed: false,
        viewed_at: null,
        assigned_at: file.created_at,
        file
      })
    );

    return {
      data: [...(assigned || []), ...virtualAssignments],
      error: null
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Assign a file to students
 */
export async function assignFileToStudents(
  fileId: string,
  studentIds: string[]
): Promise<{ error: Error | null }> {
  try {
    const assignments = studentIds.map((studentId) => ({
      file_id: fileId,
      student_id: studentId
    }));

    const { error } = await supabase
      .from('student_materials')
      .upsert(assignments, { onConflict: 'student_id,file_id' });

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Remove file assignment from a student
 */
export async function unassignFile(
  fileId: string,
  studentId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('student_materials')
      .delete()
      .eq('file_id', fileId)
      .eq('student_id', studentId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Mark file as viewed by student
 */
export async function markFileAsViewed(fileId: string): Promise<{ error: Error | null }> {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('student_materials')
      .update({
        is_viewed: true,
        viewed_at: new Date().toISOString()
      })
      .eq('file_id', fileId)
      .eq('student_id', user.id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Get download URL for a file
 */
export async function getFileUrl(
  storagePath: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (error) throw error;

    return { url: data.signedUrl, error: null };
  } catch (error) {
    return { url: null, error: error as Error };
  }
}

/**
 * Get students assigned to a file
 */
export async function getFileAssignments(
  fileId: string
): Promise<{ data: StudentMaterial[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('student_materials')
      .select(
        `
        *,
        student:profiles(id, email, display_name)
      `
      )
      .eq('file_id', fileId);

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file icon based on mime type
 */
export function getFileIcon(mimeType: string | null): string {
  if (!mimeType) return '📄';

  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📘';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📗';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📙';

  return '📄';
}
