"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
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
    <button
      onClick={handleDownload}
      disabled={logging}
      className='flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50'
    >
      {logging ? (
        <Loader2 className='h-4 w-4 animate-spin' />
      ) : (
        <Download className='h-4 w-4' />
      )}
      Download PDF
    </button>
  );
}
