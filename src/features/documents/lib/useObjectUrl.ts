"use client";

import { useEffect, useState } from "react";

/** Object URL for showing a local file; revoked when the file changes or the view unmounts. */
export function useObjectUrl(file: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!file) return setUrl(undefined);
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  return url;
}
