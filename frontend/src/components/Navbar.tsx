import React from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "./ui/button";

interface NavbarProps {
  onOpenImport: () => void;
  onExport: () => void;
  isExporting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenImport, onExport, isExporting }) => {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight text-zinc-900">
            Aircraft Parts & Orders
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={isExporting}
            className="h-8 gap-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExporting ? "Exporting..." : "Export Excel"}</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenImport}
            className="h-8 gap-1.5 bg-zinc-900 text-xs font-medium text-white hover:bg-zinc-800"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import Data</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
