"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UploadDropzone } from "@/components/upload/upload-dropzone";

interface UploadModalProps {
  projectId: string;
}

export function UploadModal({ projectId }: UploadModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleAllDone() {
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Upload className="size-4" />
        Panorama Ekle
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Panorama Yükle</DialogTitle>
          </DialogHeader>
          <UploadDropzone projectId={projectId} onAllDone={handleAllDone} />
        </DialogContent>
      </Dialog>
    </>
  );
}
