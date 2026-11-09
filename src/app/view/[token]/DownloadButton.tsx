"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logDownload } from "./actions";

export function DownloadButton({
  pdfUrl,
  deliveryLinkId,
  studentFullName,
}: {
  pdfUrl: string;
  deliveryLinkId: string;
  studentFullName: string;
}) {
  const [logging, setLogging] = useState(false);

  const handleDownload = async () => {
    setLogging(true);
    try {
      await logDownload(deliveryLinkId);
    } finally {
      setLogging(false);
    }
    // Open in a new tab — the signed URL is already generated server-side
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      type='button'
      variant='outline'
      className='h-11'
      onClick={handleDownload}
      disabled={logging}
      aria-label={`Download PDF of the letter for ${studentFullName}`}
    >
      {logging ? <Loader2 className='animate-spin' /> : <Download />}
      Download PDF
    </Button>
  );
}
