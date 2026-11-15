import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { UploadCloud, CheckCircle2, AlertCircle, Trash2, Users } from 'lucide-react';

export interface ParsedRecipient {
  email: string;
  name?: string;
  customData?: Record<string, string>;
  isValid: boolean;
  error?: string;
}

interface CsvUploaderProps {
  onRecipientsParsed: (recipients: { email: string; name?: string }[]) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CsvUploader: React.FC<CsvUploaderProps> = ({ onRecipientsParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRecipient[]>([]);
  const [stats, setStats] = useState<{ valid: number; duplicates: number; invalid: number }>({
    valid: 0,
    duplicates: 0,
    invalid: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const seenEmails = new Set<string>();
        let validCount = 0;
        let dupCount = 0;
        let invCount = 0;

        const processed: ParsedRecipient[] = [];
        const validRecipients: { email: string; name?: string }[] = [];

        results.data.forEach((row: any) => {
          // Detect email column (case insensitive)
          const emailKey = Object.keys(row).find((k) =>
            /email|e-mail|mail|recipient/i.test(k.trim())
          );
          const nameKey = Object.keys(row).find((k) =>
            /name|fullname|first_name|contact/i.test(k.trim())
          );

          const rawEmail = emailKey ? String(row[emailKey] || '').trim().toLowerCase() : '';
          const rawName = nameKey ? String(row[nameKey] || '').trim() : undefined;

          if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
            invCount++;
            processed.push({
              email: rawEmail || 'Empty',
              name: rawName,
              isValid: false,
              error: 'Invalid email syntax',
            });
            return;
          }

          if (seenEmails.has(rawEmail)) {
            dupCount++;
            processed.push({
              email: rawEmail,
              name: rawName,
              isValid: false,
              error: 'Duplicate within batch',
            });
            return;
          }

          seenEmails.add(rawEmail);
          validCount++;
          processed.push({
            email: rawEmail,
            name: rawName,
            isValid: true,
          });
          validRecipients.push({ email: rawEmail, name: rawName });
        });

        setParsedRows(processed);
        setStats({ valid: validCount, duplicates: dupCount, invalid: invCount });
        onRecipientsParsed(validRecipients);
      },
      error: () => {
        alert('Failed to parse CSV file. Please ensure it is a valid format.');
      },
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setFileName(null);
    setParsedRows([]);
    setStats({ valid: 0, duplicates: 0, invalid: 0 });
    onRecipientsParsed([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-3">
      {!fileName ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-highlight bg-highlight-subtle scale-[0.99]'
              : 'border-border-soft bg-canvas hover:border-ink-muted'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .txt"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          />
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white border border-border-soft flex items-center justify-center text-highlight shadow-sm">
              <UploadCloud size={20} />
            </div>
            <span className="text-[13px] font-bold text-ink">
              Drop your CSV file here, or <span className="text-highlight underline">browse</span>
            </span>
            <span className="text-[11px] text-ink-muted">
              Auto-detects columns: email, name, company. Eliminates duplicates automatically.
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-canvas border border-border-soft rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-highlight" />
              <span className="text-[13px] font-bold text-ink">{fileName}</span>
            </div>
            <button
              onClick={handleClear}
              className="text-ink-muted hover:text-highlight transition-colors p-1"
              title="Remove file"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Validation Metrics Summary */}
          <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
            <div className="bg-white border border-border-soft rounded-lg p-2 flex flex-col items-center">
              <span className="text-status-ok font-bold font-mono text-[14px]">
                {stats.valid}
              </span>
              <span className="text-[11px] text-ink-muted font-medium">Valid Leads</span>
            </div>
            <div className="bg-white border border-border-soft rounded-lg p-2 flex flex-col items-center">
              <span className="text-amber-600 font-bold font-mono text-[14px]">
                {stats.duplicates}
              </span>
              <span className="text-[11px] text-ink-muted font-medium">Duplicates Filtered</span>
            </div>
            <div className="bg-white border border-border-soft rounded-lg p-2 flex flex-col items-center">
              <span className="text-status-error font-bold font-mono text-[14px]">
                {stats.invalid}
              </span>
              <span className="text-[11px] text-ink-muted font-medium">Invalid Skipped</span>
            </div>
          </div>

          {/* Mini Preview Table (First 3 rows) */}
          <div className="max-h-36 overflow-y-auto border border-border-soft rounded-lg bg-white">
            <table className="w-full text-[11px]">
              <thead className="bg-canvas-soft border-b border-border-soft text-ink-muted sticky top-0">
                <tr>
                  <th className="py-1 px-3 text-left">Status</th>
                  <th className="py-1 px-3 text-left">Email</th>
                  <th className="py-1 px-3 text-left">Name</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-border-soft last:border-none">
                    <td className="py-1.5 px-3">
                      {row.isValid ? (
                        <CheckCircle2 size={13} className="text-status-ok inline" />
                      ) : (
                        <AlertCircle size={13} className="text-status-error inline" />
                      )}
                    </td>
                    <td className="py-1.5 px-3 font-mono">{row.email}</td>
                    <td className="py-1.5 px-3 text-ink-muted">{row.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
