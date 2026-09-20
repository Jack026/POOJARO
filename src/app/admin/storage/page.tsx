'use client';

import { useState, useEffect, useRef } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import {
  Database,
  Upload,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Search,
  RefreshCw,
  FolderOpen,
  Sparkles,
  ShieldCheck,
  Plus,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface BucketInfo {
  id: string;
  name: string;
  public: boolean;
  createdAt: string;
  isAnalytics?: boolean;
}

interface BucketFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
  publicUrl: string;
}

export default function StorageBucketsPage() {
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [activeBucket, setActiveBucket] = useState<string>('poojaro-products');
  const [files, setFiles] = useState<BucketFile[]>([]);
  const [loadingBuckets, setLoadingBuckets] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Uploading state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exporting analytics
  const [exportingAnalytics, setExportingAnalytics] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  // Create bucket modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketIsPublic, setNewBucketIsPublic] = useState(true);
  const [newBucketIsAnalytics, setNewBucketIsAnalytics] = useState(false);
  const [creatingBucket, setCreatingBucket] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // 1. Fetch all buckets
  const fetchBuckets = async () => {
    setLoadingBuckets(true);
    try {
      const res = await fetch('/api/admin/storage/buckets');
      if (res.ok) {
        const data = await res.json();
        setBuckets(data.buckets || []);
        if (data.buckets?.length > 0 && !data.buckets.some((b: BucketInfo) => b.id === activeBucket)) {
          setActiveBucket(data.buckets[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load buckets', err);
    } finally {
      setLoadingBuckets(false);
    }
  };

  // 2. Fetch files in active bucket
  const fetchFiles = async (bucketId: string, search?: string) => {
    if (!bucketId) return;
    setLoadingFiles(true);
    try {
      const url = search
        ? `/api/admin/storage/buckets/${bucketId}?search=${encodeURIComponent(search)}`
        : `/api/admin/storage/buckets/${bucketId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      } else {
        setFiles([]);
      }
    } catch (err) {
      console.error('Failed to load files', err);
      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchBuckets();
  }, []);

  useEffect(() => {
    if (activeBucket) {
      fetchFiles(activeBucket, searchQuery);
    }
  }, [activeBucket, searchQuery]);

  // Handle file upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', activeBucket);
    formData.append('folder', 'uploads');

    try {
      const res = await fetch('/api/admin/storage/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload media.');
      }

      setUploadSuccess(`Successfully uploaded ${file.name}`);
      fetchFiles(activeBucket);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (filePath: string) => {
    if (!confirm(`Are you sure you want to delete ${filePath}?`)) return;

    try {
      const res = await fetch(
        `/api/admin/storage/buckets/${activeBucket}?path=${encodeURIComponent(filePath)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.name !== filePath));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete file.');
      }
    } catch (err) {
      alert('Network error while deleting file.');
    }
  };

  // Handle analytics dump export
  const handleExportAnalytics = async () => {
    setExportingAnalytics(true);
    setExportStatus(null);
    try {
      const res = await fetch('/api/admin/storage/export-analytics', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setExportStatus(`Exported ${data.exportedEvents} telemetry events to ${data.bucket}!`);
        fetchBuckets();
      } else {
        setExportStatus(`Error: ${data.error || 'Failed to export'}`);
      }
    } catch (err) {
      setExportStatus('Network error exporting analytics.');
    } finally {
      setExportingAnalytics(false);
    }
  };

  // Handle new bucket creation
  const handleCreateBucket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketName.trim()) return;

    setCreatingBucket(true);
    setModalError(null);

    try {
      const res = await fetch('/api/admin/storage/buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newBucketName.trim(),
          isPublic: newBucketIsPublic,
          isAnalytics: newBucketIsAnalytics,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create bucket.');
      }

      setShowCreateModal(false);
      setNewBucketName('');
      await fetchBuckets();
      setActiveBucket(data.bucketId);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error creating bucket.');
    } finally {
      setCreatingBucket(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <AdminShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#3A2118] flex items-center gap-2">
              <Database className="w-6 h-6 text-[#B78332]" />
              Supabase Storage & Analytics Buckets
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Live enterprise asset storage, media delivery CDN, and telemetry analytics lake.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#B78332] text-white rounded-md text-sm font-medium hover:bg-[#9E6F28] transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              New Bucket
            </button>
            <a
              href="https://supabase.com/dashboard/project/nkrvshxhswyjbwvrxory/storage/buckets"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E8DDCA] bg-white rounded-md text-sm font-medium text-gray-700 hover:bg-[#FAF8F3] transition-colors shadow-2xs"
            >
              <ExternalLink className="w-4 h-4 text-[#B78332]" />
              Supabase Console
            </a>
          </div>
        </div>

        {/* Analytics Buckets Private Alpha Callout */}
        <div className="rounded-xl border border-[#B78332]/30 bg-gradient-to-r from-[#FAF6EF] via-[#FDFBF7] to-[#FAF6EF] p-5 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#B78332]/15 text-[#8C6221] text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                New: Introducing Analytics Buckets (Private Alpha)
              </div>
              <p className="text-sm text-[#422619] leading-relaxed pt-1">
                Analytics buckets are now in private alpha. Expect rapid changes, limited features, and possible breaking updates. Connected directly to your Supabase PostgreSQL Telemetry Lake for query logs and high-throughput events.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleExportAnalytics}
                disabled={exportingAnalytics}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3A2118] text-[#E8C988] text-xs font-semibold uppercase tracking-wider hover:bg-[#25150E] transition-all shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${exportingAnalytics ? 'animate-spin' : ''}`} />
                {exportingAnalytics ? 'Exporting Lake…' : 'Export Telemetry to Bucket'}
              </button>
            </div>
          </div>

          {exportStatus && (
            <div className="mt-3 text-xs text-[#8C6221] font-medium bg-white/70 rounded-md p-2 border border-[#B78332]/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{exportStatus}</span>
            </div>
          )}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-[#E8DDCA]">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Buckets</span>
            <div className="text-2xl font-bold text-[#3A2118] mt-1">{buckets.length}</div>
            <p className="text-xs text-gray-500 mt-0.5">Media & Analytics buckets</p>
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm border border-[#E8DDCA]">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Bucket</span>
            <div className="text-lg font-bold text-[#3A2118] truncate mt-1">{activeBucket}</div>
            <p className="text-xs text-gray-500 mt-0.5">
              {buckets.find((b) => b.id === activeBucket)?.public ? 'Public CDN' : 'Private Storage'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm border border-[#E8DDCA]">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Files in Bucket</span>
            <div className="text-2xl font-bold text-[#3A2118] mt-1">{files.length}</div>
            <p className="text-xs text-gray-500 mt-0.5">Objects listed</p>
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm border border-[#E8DDCA]">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Security Protocol</span>
            <div className="text-sm font-bold text-green-700 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Zero-Trust RLS Active
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Magic-byte payload validation</p>
          </div>
        </div>

        {/* Bucket Navigation Tabs */}
        <div className="border-b border-[#E8DDCA] flex items-center gap-2 overflow-x-auto pb-1">
          {buckets.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveBucket(b.id)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 shrink-0 ${
                activeBucket === b.id
                  ? 'bg-white border-t-2 border-t-[#B78332] text-[#3A2118] shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              <FolderOpen className="w-4 h-4 text-[#B78332]" />
              <span>{b.name}</span>
              {b.isAnalytics && (
                <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold uppercase">
                  Alpha
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Upload & Search Toolbar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-[#E8DDCA] flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Filter */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeBucket} files…`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-[#E8DDCA] rounded-md focus:outline-none focus:border-[#B78332] text-charcoal bg-[#FAF8F3]/50"
            />
          </div>

          {/* Upload Button */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleUpload}
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3A2118] text-[#E8C988] text-sm font-medium rounded-md hover:bg-[#25150E] transition-colors shadow-2xs disabled:opacity-50"
            >
              <Upload className={`w-4 h-4 ${uploading ? 'animate-bounce' : ''}`} />
              {uploading ? 'Validating & Uploading…' : `Upload to ${activeBucket}`}
            </button>

            <button
              onClick={() => fetchFiles(activeBucket, searchQuery)}
              disabled={loadingFiles}
              className="p-2 border border-[#E8DDCA] rounded-md hover:bg-[#FAF8F3] text-gray-600"
              title="Refresh Files"
            >
              <RefreshCw className={`w-4 h-4 ${loadingFiles ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Files Table */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] overflow-hidden">
          {loadingFiles ? (
            <div className="p-16 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#B78332]" />
              Loading files from Supabase Storage…
            </div>
          ) : files.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              <FolderOpen className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="font-medium text-gray-700">No files found in {activeBucket}</p>
              <p className="text-xs text-gray-400 mt-1">Upload an image or asset to populate this bucket.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-[#FAF8F3] border-b border-[#E8DDCA] text-xs font-semibold text-[#3A2118] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Preview</th>
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Uploaded</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DDCA]/60">
                  {files.map((file) => (
                    <tr key={file.name} className="hover:bg-[#FAF8F3]/50 transition-colors">
                      <td className="py-2.5 px-4 w-16">
                        {file.mimeType.startsWith('image/') ? (
                          <img
                            src={file.publicUrl}
                            alt=""
                            className="w-10 h-10 rounded object-cover border border-[#E8DDCA] bg-[#FAF8F3]"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-charcoal">
                        <div className="truncate max-w-xs sm:max-w-md">{file.name}</div>
                        <span className="text-[11px] text-gray-400 font-mono">{file.mimeType}</span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-500 whitespace-nowrap">{formatBytes(file.size)}</td>
                      <td className="py-2.5 px-4 text-gray-500 whitespace-nowrap">
                        {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => copyToClipboard(file.publicUrl)}
                          className="p-1.5 text-gray-500 hover:text-[#B78332] rounded hover:bg-gray-100 transition-colors"
                          title="Copy Public URL"
                        >
                          {copiedUrl === file.publicUrl ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <a
                          href={file.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block p-1.5 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100 transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteFile(file.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Bucket Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl border border-[#E8DDCA] max-w-md w-full p-6 space-y-4">
              <h2 className="text-lg font-bold text-[#3A2118] flex items-center gap-2">
                <Database className="w-5 h-5 text-[#B78332]" />
                Create New Supabase Bucket
              </h2>

              <form onSubmit={handleCreateBucket} className="space-y-4">
                {modalError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    {modalError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Bucket Name / ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. poojaro-documents"
                    value={newBucketName}
                    onChange={(e) => setNewBucketName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E8DDCA] rounded-md text-sm focus:outline-none focus:border-[#B78332]"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Lowercase letters, numbers, and hyphens only.</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newBucketIsPublic}
                    onChange={(e) => setNewBucketIsPublic(e.target.checked)}
                    className="rounded border-[#E8DDCA] text-[#B78332] focus:ring-[#B78332]"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700 font-medium">
                    Public Bucket (Assets accessible via CDN)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAnalytics"
                    checked={newBucketIsAnalytics}
                    onChange={(e) => setNewBucketIsAnalytics(e.target.checked)}
                    className="rounded border-[#E8DDCA] text-[#B78332] focus:ring-[#B78332]"
                  />
                  <label htmlFor="isAnalytics" className="text-sm text-gray-700 font-medium">
                    Analytics Bucket (Private Alpha Telemetry Lake)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingBucket}
                    className="px-4 py-2 text-sm bg-[#B78332] text-white rounded-md font-medium hover:bg-[#9E6F28] transition-colors disabled:opacity-50"
                  >
                    {creatingBucket ? 'Creating…' : 'Create Bucket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
