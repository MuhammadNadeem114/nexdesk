'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Upload,
  FolderPlus,
  Folder,
  LayoutGrid,
  List,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  File,
  CloudUpload,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// --- Types ---
interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  childCount: number;
  fileCount: number;
  createdAt: string;
  updatedAt: string;
}

interface FileItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  folderId: string | null;
  uploadedBy: { id: string; name: string; avatar?: string | null } | null;
}

interface FilesData {
  files: FileItem[];
  folders: FolderItem[];
}

// --- Helpers ---
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getFileCategory(mimeType: string): 'pdf' | 'image' | 'doc' | 'spreadsheet' | 'video' | 'audio' | 'other' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    mimeType === 'text/plain' ||
    mimeType.includes('markdown')
  )
    return 'doc';
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType.includes('csv')
  )
    return 'spreadsheet';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'other';
}

const FILE_ICON_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  pdf: { icon: FileText, color: 'text-red-500' },
  image: { icon: FileImage, color: 'text-violet-500' },
  doc: { icon: FileText, color: 'text-blue-500' },
  spreadsheet: { icon: FileSpreadsheet, color: 'text-emerald-500' },
  video: { icon: FileVideo, color: 'text-orange-500' },
  audio: { icon: FileAudio, color: 'text-pink-500' },
  other: { icon: File, color: 'text-muted-foreground' },
};

function getFileIcon(mimeType: string) {
  return FILE_ICON_MAP[getFileCategory(mimeType)] || FILE_ICON_MAP.other;
}

// --- Demo data ---
const DEMO_FOLDERS: FolderItem[] = [
  { id: 'f1', name: 'Design Assets', parentId: null, childCount: 2, fileCount: 14, createdAt: '2026-06-15T10:00:00Z', updatedAt: '2026-07-01T14:30:00Z' },
  { id: 'f2', name: 'Documents', parentId: null, childCount: 1, fileCount: 8, createdAt: '2026-05-20T09:00:00Z', updatedAt: '2026-07-02T11:00:00Z' },
  { id: 'f3', name: 'Project Files', parentId: null, childCount: 0, fileCount: 22, createdAt: '2026-04-10T08:00:00Z', updatedAt: '2026-07-03T16:45:00Z' },
  { id: 'f4', name: 'Meeting Notes', parentId: null, childCount: 0, fileCount: 5, createdAt: '2026-06-01T12:00:00Z', updatedAt: '2026-07-04T09:15:00Z' },
];

const DEMO_FILES: FileItem[] = [
  { id: 'd1', name: 'Q2-Report.pdf', size: 2456000, mimeType: 'application/pdf', createdAt: '2026-06-28T10:00:00Z', updatedAt: '2026-06-28T10:00:00Z', folderId: null, uploadedBy: { id: 'u1', name: 'Alex Morgan' } },
  { id: 'd2', name: 'Dashboard-Mockup.png', size: 1843200, mimeType: 'image/png', createdAt: '2026-07-01T14:30:00Z', updatedAt: '2026-07-01T14:30:00Z', folderId: null, uploadedBy: { id: 'u2', name: 'Sarah Chen' } },
  { id: 'd3', name: 'Budget-2026.xlsx', size: 524288, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', createdAt: '2026-06-15T09:00:00Z', updatedAt: '2026-07-02T11:00:00Z', folderId: null, uploadedBy: { id: 'u3', name: 'James Wilson' } },
  { id: 'd4', name: 'Team-Photo.jpg', size: 3145728, mimeType: 'image/jpeg', createdAt: '2026-07-03T16:45:00Z', updatedAt: '2026-07-03T16:45:00Z', folderId: null, uploadedBy: { id: 'u4', name: 'Emily Davis' } },
  { id: 'd5', name: 'Project-Brief.docx', size: 156000, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', createdAt: '2026-06-20T11:00:00Z', updatedAt: '2026-06-20T11:00:00Z', folderId: null, uploadedBy: { id: 'u1', name: 'Alex Morgan' } },
  { id: 'd6', name: 'Onboarding-Guide.pdf', size: 892000, mimeType: 'application/pdf', createdAt: '2026-05-10T08:00:00Z', updatedAt: '2026-05-10T08:00:00Z', folderId: null, uploadedBy: { id: 'u2', name: 'Sarah Chen' } },
  { id: 'd7', name: 'Presentation.pptx', size: 4200000, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', createdAt: '2026-07-04T09:15:00Z', updatedAt: '2026-07-04T09:15:00Z', folderId: null, uploadedBy: { id: 'u3', name: 'James Wilson' } },
  { id: 'd8', name: 'Sprint-Retrospective.md', size: 12000, mimeType: 'text/markdown', createdAt: '2026-07-05T10:30:00Z', updatedAt: '2026-07-05T10:30:00Z', folderId: null, uploadedBy: { id: 'u4', name: 'Emily Davis' } },
];

// --- Breadcrumb path type ---
interface BreadcrumbPath {
  id: string | null;
  name: string;
}

// --- Sub-components ---

function FilesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <Skeleton className="h-5 w-64" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function FolderCard({
  folder,
  onClick,
}: {
  folder: FolderItem;
  onClick: (folder: FolderItem) => void;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
      <Card
        className="group cursor-pointer gap-0 py-0 transition-shadow hover:shadow-md"
        onClick={() => onClick(folder)}
      >
        <CardContent className="flex flex-col items-center gap-3 p-4 pt-5">
          <div className="rounded-lg bg-amber-500/10 p-3">
            <Folder className="size-8 text-amber-500" />
          </div>
          <div className="w-full text-center">
            <p className="truncate text-sm font-medium">{folder.name}</p>
            <p className="text-muted-foreground text-xs">
              {folder.childCount + folder.fileCount} items
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FileCard({ file }: { file: FileItem }) {
  const { icon: Icon, color } = getFileIcon(file.mimeType);
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
      <Card className="group gap-0 py-0 transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col items-center gap-3 p-4 pt-5">
          <div className="rounded-lg bg-muted p-3">
            <Icon className={cn('size-8', color)} />
          </div>
          <div className="w-full text-center">
            <p className="truncate text-sm font-medium" title={file.name}>
              {file.name}
            </p>
            <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
          </div>
          <p className="text-muted-foreground text-xs">{formatDate(file.updatedAt)}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="rounded-full bg-muted p-6">
        <CloudUpload className="size-12 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No files yet</h3>
      <p className="text-muted-foreground mt-1 text-sm">
        Upload files or create folders to get started
      </p>
    </motion.div>
  );
}

// --- Main Component ---

export function FilesPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [path, setPath] = useState<BreadcrumbPath[]>([{ id: null, name: 'Root' }]);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const currentFolderId = path[path.length - 1]?.id ?? null;

  const { data, isLoading, isError } = useQuery<FilesData>({
    queryKey: ['files', currentFolderId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentFolderId) params.set('folderId', currentFolderId);
      const res = await fetch(`/api/files?${params}`);
      if (!res.ok) throw new Error('Failed to fetch files');
      return res.json();
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId: currentFolderId }),
      });
      if (!res.ok) throw new Error('Failed to create folder');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', currentFolderId] });
      toast.success('Folder created successfully');
      setNewFolderOpen(false);
      setNewFolderName('');
    },
    onError: () => {
      toast.error('Failed to create folder');
    },
  });

  const folders = data?.folders ?? DEMO_FOLDERS;
  const files = data?.files ?? DEMO_FILES;
  const totalItems = folders.length + files.length;

  const handleFolderClick = useCallback(
    (folder: FolderItem) => {
      setPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
    },
    []
  );

  const handleBreadcrumbClick = useCallback((index: number) => {
    setPath((prev) => prev.slice(0, index + 1));
  }, []);

  const handleCreateFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    createFolderMutation.mutate(trimmed);
  };

  const handleUpload = () => {
    toast.info('File upload is not available in demo mode');
  };

  if (isLoading) return <FilesSkeleton />;

  return (
    <motion.div
      className="space-y-6 p-4 sm:p-6 lg:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Files
            <span className="text-muted-foreground ml-2 text-lg font-normal">
              ({totalItems} items)
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">Manage your project files and folders</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="inline-flex h-9 items-center rounded-lg border bg-muted p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded-md p-1.5 transition-all',
                viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-md p-1.5 transition-all',
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="List view"
            >
              <List className="size-4" />
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setNewFolderOpen(true)}>
            <FolderPlus className="size-4" />
            <span className="hidden sm:inline">New Folder</span>
          </Button>

          <Button size="sm" onClick={handleUpload}>
            <Upload className="size-4" />
            <span className="hidden sm:inline">Upload File</span>
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      {path.length > 1 && (
        <Breadcrumb>
          <BreadcrumbList>
            {path.map((crumb, index) => (
              <React.Fragment key={crumb.id ?? 'root'}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {index < path.length - 1 ? (
                    <BreadcrumbLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleBreadcrumbClick(index);
                      }}
                    >
                      {crumb.name}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Content */}
      {totalItems === 0 ? (
        <EmptyState />
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Folders Grid */}
              {folders.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wider">
                    Folders
                  </h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {folders.map((folder, i) => (
                      <motion.div
                        key={folder.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}
                      >
                        <FolderCard folder={folder} onClick={handleFolderClick} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files Grid */}
              {files.length > 0 && (
                <div>
                  <h2 className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wider">
                    Files
                  </h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {files.map((file, i) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: (folders.length + i) * 0.03 }}
                      >
                        <FileCard file={file} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Size</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead className="hidden lg:table-cell">Modified</TableHead>
                      <TableHead className="hidden lg:table-cell text-right">Uploaded By</TableHead>
                      <TableHead className="w-10">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Folders */}
                    {folders.map((folder) => (
                      <TableRow
                        key={folder.id}
                        className="cursor-pointer"
                        onClick={() => handleFolderClick(folder)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Folder className="size-4 shrink-0 text-amber-500" />
                            <span className="font-medium">{folder.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-muted-foreground text-sm">
                            {folder.childCount + folder.fileCount} items
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary">Folder</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {formatDate(folder.updatedAt)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell" />
                        <TableCell>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">More actions</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Files */}
                    {files.map((file) => {
                      const { icon: Icon, color } = getFileIcon(file.mimeType);
                      return (
                        <TableRow key={file.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Icon className={cn('size-4 shrink-0', color)} />
                              <span className="font-medium">{file.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {formatFileSize(file.size)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="secondary">
                              {getFileCategory(file.mimeType).toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {formatDate(file.updatedAt)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {file.uploadedBy?.name ?? '-'}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">More actions</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder in &quot;{path[path.length - 1]?.name}&quot;.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || createFolderMutation.isPending}
            >
              {createFolderMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error notice */}
      {isError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
          Showing demo data. Could not connect to the server.
        </div>
      )}
    </motion.div>
  );
}