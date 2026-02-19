import React, { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, Download, X } from "lucide-react";

const SessionGuardModal = ({ isOpen, onClose, onHome, onExport }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(30);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            onHome();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, onHome]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <AlertTriangle size={24} strokeWidth={2.5} />
            <DialogTitle className="text-xl font-black text-zinc-900 tracking-tight">
              Warning: Data Loss
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-600 font-medium">
            Your converted data will be lost if you leave this page.
            <br />
            Would you like to return to the Home page or Export your file first?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col gap-2 mt-4">
          <Button
            onClick={onExport}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl gap-2"
          >
            <Download size={18} />
            Export File
          </Button>

          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              variant="destructive"
              onClick={onHome}
              className="w-full font-bold h-12 rounded-xl gap-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
            >
              <Home size={18} />
              Go Home ({timeLeft}s)
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full font-bold h-12 rounded-xl gap-2 text-zinc-500 border-zinc-200"
            >
              <X size={18} />
              Stay Here
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionGuardModal;
