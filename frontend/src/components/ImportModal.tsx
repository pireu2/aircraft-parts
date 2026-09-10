import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ETLResponse } from "../types";
import { api } from "../services/api";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ETLResponse | null>(null);

  // delete all states
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setFile(null);
    setLoading(false);
    setError(null);
    setResult(null);
    setIsConfirmingDelete(false);
    setDeleteSuccess(null);
  };

  const handleClose = () => {
    const shouldRefresh = !!result || !!deleteSuccess;
    handleReset();
    onClose();
    if (shouldRefresh) {
      onImportComplete();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setDeleteSuccess(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setDeleteSuccess(null);

    try {
      const res = await api.importExcel(file);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to import Excel file");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.clearData();
      setIsConfirmingDelete(false);
      setDeleteSuccess(res.message || "All records have been deleted.");
    } catch (err: any) {
      setError(err.message || "Failed to delete data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg bg-white border-zinc-200 text-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-zinc-900">Import Excel Data</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Upload an Excel workbook (.xlsx) to create, update, or reconcile aircraft, materials, and orders.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{result.message}</span>
            </div>

            {result.diff ? (
              <div className="rounded-lg border border-zinc-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow className="border-b border-zinc-200">
                      <TableHead className="text-xs font-semibold text-zinc-600">Table</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-zinc-600">Created</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-zinc-600">Updated</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-zinc-600">Deleted</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-zinc-900">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(["aircraft", "materials", "orders"] as const).map((key) => {
                      const entity = result.diff![key];
                      const label = key.charAt(0).toUpperCase() + key.slice(1);
                      return (
                        <TableRow key={key} className="border-b border-zinc-100">
                          <TableCell className="py-2.5 text-xs font-medium text-zinc-900">{label}</TableCell>
                          <TableCell className="py-2.5 text-right text-xs text-emerald-700 tabular-nums">
                            +{entity.created}
                          </TableCell>
                          <TableCell className="py-2.5 text-right text-xs text-amber-700 tabular-nums">
                            {entity.updated}
                          </TableCell>
                          <TableCell className="py-2.5 text-right text-xs text-rose-700 tabular-nums">
                            -{entity.deleted}
                          </TableCell>
                          <TableCell className="py-2.5 text-right text-xs font-semibold text-zinc-900 tabular-nums">
                            {entity.total}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <Button onClick={handleClose} size="sm" className="bg-zinc-900 text-white text-xs hover:bg-zinc-800">
                Close & Refresh
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {error ? (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            ) : null}

            {deleteSuccess ? (
              <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{deleteSuccess}</span>
                </div>
                <Button onClick={handleClose} size="sm" variant="ghost" className="h-6 px-2 text-xs text-emerald-900">
                  Refresh
                </Button>
              </div>
            ) : null}

            {/* file upload section */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-100/50"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="h-6 w-6 text-zinc-400" />
              <div className="mt-2 text-xs font-medium text-zinc-900">
                {file ? file.name : "Select or drop Excel workbook (.xlsx)"}
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-500">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : "Must contain Aircrafts, Materials, and Orders sheets"}
              </div>
            </div>

            {/* selected file bar */}
            {file ? (
              <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs">
                <span className="truncate font-medium text-zinc-800">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="ml-2 text-zinc-400 hover:text-zinc-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            {/* primary actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={handleClose} disabled={loading} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={loading || !file}
                className="bg-zinc-900 text-xs text-white hover:bg-zinc-800"
              >
                {loading && !isConfirmingDelete ? "Importing..." : "Import File"}
              </Button>
            </div>

            {/* delete all section */}
            <div className="mt-6 border-t border-zinc-200 pt-4">
              {isConfirmingDelete ? (
                <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                  <div className="text-xs font-semibold text-red-900">Confirm Database Wipe</div>
                  <div className="mt-1 text-[11px] text-red-700 leading-relaxed">
                    This will permanently delete all aircraft, materials, and orders. This action cannot be undone.
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsConfirmingDelete(false)}
                      disabled={loading}
                      className="h-7 text-xs text-zinc-600 hover:text-zinc-900"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleDeleteAll}
                      disabled={loading}
                      className="h-7 bg-red-600 text-xs text-white hover:bg-red-700"
                    >
                      {loading ? "Deleting..." : "Yes, Delete Everything"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-zinc-800">Clear Database</div>
                    <div className="text-[11px] text-zinc-500">Remove all current records from the system.</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsConfirmingDelete(true)}
                    disabled={loading}
                    className="h-7 border-zinc-200 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete All
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
