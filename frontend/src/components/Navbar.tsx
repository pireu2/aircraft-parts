import React, { useRef } from "react";
import { Plane, Download, Upload, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

interface NavbarProps {
  onExport: () => void;
  isExporting: boolean;
  onImportFile: (file: File) => void;
  isImporting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onExport,
  isExporting,
  onImportFile,
  isImporting,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
      // Reset input value so same file can be selected again
      e.target.value = "";
    }
  };

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-900 text-white">
            <Plane className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-zinc-900">
              Airbus Materials & Orders
            </span>
            <span className="text-[11px] text-zinc-500">
              Supply Chain & Fleet Maintenance System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={isExporting}
            className="h-8 gap-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>{isExporting ? "Exporting..." : "Export Excel"}</span>
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls"
            className="hidden"
          />

          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="h-8 gap-1.5 bg-zinc-900 text-xs font-medium text-white hover:bg-zinc-800"
          >
            {isImporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>{isImporting ? "Importing..." : "Import Excel"}</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
