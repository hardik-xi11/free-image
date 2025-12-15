'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { Upload, X, FileImage, CheckCircle, AlertCircle, Download, Link as LinkIcon, Loader2, FileArchive, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type FileStatus = 'pending' | 'uploading' | 'converting' | 'done' | 'error';

interface ConvertedFile {
    id: string;
    file: File;
    preview: string;
    size: number;
    name: string;
    targetFormat: string;
    status: FileStatus;
    url?: string;
    error?: string;
}

const FORMATS = ['png', 'jpg', 'webp', 'avif'];

export default function Converter() {
    const [files, setFiles] = useState<ConvertedFile[]>([]);
    const [urlInput, setUrlInput] = useState('');
    const [isImportingUrl, setIsImportingUrl] = useState(false);

    // --- Helpers ---
    const generateId = () => Math.random().toString(36).substring(7);

    const addFiles = useCallback((newFiles: File[]) => {
        const mappedFiles = newFiles.map((file) => ({
            id: generateId(),
            file,
            preview: URL.createObjectURL(file),
            size: file.size,
            name: file.name,
            targetFormat: 'png',
            status: 'pending' as FileStatus,
        }));
        setFiles((prev) => [...prev, ...mappedFiles]);
    }, []);

    // --- Handlers ---
    const onDrop = useCallback((acceptedFiles: File[]) => {
        addFiles(acceptedFiles);
    }, [addFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        noClick: true,
    });

    // Global Paste
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            const pastedFiles: File[] = [];
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) pastedFiles.push(file);
                }
            }
            if (pastedFiles.length > 0) addFiles(pastedFiles);
        };
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [addFiles]);

    // URL Import
    const handleUrlImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!urlInput) return;
        setIsImportingUrl(true);
        try {
            const res = await fetch('/api/import-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: urlInput })
            });

            if (!res.ok) throw new Error('Failed to fetch image');

            const blob = await res.blob();
            const filename = urlInput.split('/').pop() || 'imported-image';
            const file = new File([blob], filename, { type: blob.type });
            addFiles([file]);
            setUrlInput('');
        } catch (err) {
            alert('Failed to import image from URL. It might be private or blocked.');
        } finally {
            setIsImportingUrl(false);
        }
    };

    // Convert
    const convertFile = async (id: string) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'converting' } : f));
        const fileItem = files.find(f => f.id === id);
        if (!fileItem) return;

        try {
            const formData = new FormData();
            formData.append('file', fileItem.file);
            formData.append('format', fileItem.targetFormat);

            const res = await fetch('/api/convert', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Conversion failed');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'done', url } : f));
        } catch (error) {
            setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: 'Failed' } : f));
        }
    };

    const convertAll = () => {
        files.filter(f => f.status === 'pending').forEach(f => convertFile(f.id));
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const downloadAll = async () => {
        const doneFiles = files.filter(f => f.status === 'done' && f.url);
        if (doneFiles.length === 0) return;
        const zip = new JSZip();
        for (const file of doneFiles) {
            if (file.url) {
                const response = await fetch(file.url);
                const blob = await response.blob();
                const filename = `${file.name.replace(/\.[^/.]+$/, "")}.${file.targetFormat}`;
                zip.file(filename, blob);
            }
        }
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = "converted_files.zip";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-12">

            {/* TACTICAL DROPZONE */}
            <div
                {...getRootProps()}
                className={cn(
                    "relative group bg-black/40 backdrop-blur-md rounded-lg p-12 text-center transition-all duration-500 ease-out cursor-default overflow-hidden",
                    "border border-white/10 hover:border-yellow-500/50",
                    isDragActive && "border-yellow-500 bg-yellow-500/10"
                )}
            >
                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/20 group-hover:border-yellow-500 transition-colors" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/20 group-hover:border-red-500 transition-colors" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/20 group-hover:border-blue-500 transition-colors" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/20 group-hover:border-green-500 transition-colors" />

                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-6 relative z-10">
                    {/* <div className="p-5 bg-white/5 rounded-full text-white group-hover:scale-110 group-hover:text-yellow-400 transition-all duration-300 ring-1 ring-white/10 group-hover:ring-yellow-500/50">
                        <Upload size={40} className="drop-shadow-glow" />
                    </div> */}
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black uppercase text-white tracking-widest leading-none">
                            Upload Images
                        </h3>
                        <p className="text-slate-400 font-mono text-sm uppercase tracking-wider">
                            Drag & Drop or Ctrl+V to paste
                        </p>
                    </div>

                    {/* URL Import */}
                    <div className="mt-6 flex items-center gap-0 w-full max-w-md mx-auto relative group/input" onClick={e => e.stopPropagation()}>
                        <div className="relative flex-1">
                            <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="HTTPS://SOMETHING.COM/IMAGE.PNG"
                                value={urlInput}
                                onChange={e => setUrlInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleUrlImport(e)}
                                className="w-full bg-black/50 text-white placeholder:text-slate-600 pl-11 pr-4 py-3 text-sm font-mono border border-white/10 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 transition-all uppercase tracking-wider"
                            />
                        </div>
                        <button
                            onClick={handleUrlImport}
                            disabled={!urlInput || isImportingUrl}
                            className="px-6 hover:text-orange-400 text-white disabled:opacity-50 transition-colors"
                        >
                            {isImportingUrl ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                        </button>
                    </div>

                    <button
                        onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                        className="mt-4 px-8 py-3 bg-white text-black font-black uppercase tracking-widest hover:bg-yellow-400 hover:scale-105 transition-all skew-x-[-10deg]"
                    >
                        <span className="skew-x-[10deg] inline-block">Select Files</span>
                    </button>
                </div>
            </div>

            {/* FILE LIST */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                                Files Queue ({files.length})
                            </h2>
                            <div className="flex gap-3">
                                <button
                                    onClick={convertAll}
                                    className="px-6 py-2 bg-cyan-700 text-white font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all text-sm clip-path-slant"
                                >
                                    Convert All
                                </button>
                                {files.some(f => f.status === 'done') && (
                                    <button
                                        onClick={downloadAll}
                                        className="px-6 py-2 bg-yellow-500 text-black font-bold uppercase tracking-wider hover:brightness-120 active:scale-95 transition-all text-sm clip-path-slant"
                                    >
                                        Download All
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-3">
                            {files.map((file) => (
                                <motion.div
                                    key={file.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="group relative bg-[#111] border border-white/5 p-3 flex items-center gap-4 hover:bg-[#1a1a1a] transition-colors"
                                >
                                    {/* RAINBOW PROGRESS BAR */}
                                    {file.status === 'converting' && (
                                        <motion.div
                                            className="absolute bottom-0 left-0 h-[2px] z-10 bg-gradient-to-r from-[#ff2a2a] via-[#ffcc00] to-[#00ccff]"
                                            initial={{ width: "0%" }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 1.5, ease: "linear" }}
                                        />
                                    )}

                                    <div className="w-14 h-14 bg-black/50 border border-white/10 shrink-0 relative overflow-hidden">
                                        <img src={file.preview} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    <div className="flex-1 min-w-0 font-mono">
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-white font-bold text-sm truncate max-w-[200px]">{file.name}</p>
                                            <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className={cn("w-1.5 h-1.5 rounded-full",
                                                file.status === 'done' ? "bg-green-500" :
                                                    file.status === 'error' ? "bg-red-500" :
                                                        file.status === 'converting' ? "bg-yellow-400 animate-pulse" : "bg-slate-600"
                                            )} />
                                            <span className="text-[10px] uppercase tracking-widest text-slate-400">
                                                {file.status === 'done' ? 'Ready' : file.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <select
                                            value={file.targetFormat}
                                            onChange={(e) => setFiles(prev => prev.map(f => f.id === file.id ? { ...f, targetFormat: e.target.value } : f))}
                                            disabled={file.status !== 'pending'}
                                            className="bg-black text-white border border-white/20 text-xs font-mono uppercase px-3 py-1 focus:border-yellow-500 focus:outline-none"
                                        >
                                            {FORMATS.map(fmt => (
                                                <option key={fmt} value={fmt}>{fmt.toUpperCase()}</option>
                                            ))}
                                        </select>

                                        {file.status === 'done' ? (
                                            <a
                                                href={file.url}
                                                download={`${file.name.replace(/\.[^/.]+$/, "")}.${file.targetFormat}`}
                                                className="p-2 text-green-400 hover:text-green-300 transition-colors"
                                            >
                                                <Download size={20} />
                                            </a>
                                        ) : file.status === 'converting' ? (
                                            <Loader2 size={18} className="animate-spin text-yellow-500" />
                                        ) : file.status === 'error' ? (
                                            <AlertCircle size={18} className="text-red-500" />
                                        ) : (
                                            <button onClick={() => removeFile(file.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors">
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
