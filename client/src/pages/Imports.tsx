"use client";

import { useState } from "react";
import CsvExample from "@/components/Imports/CsvExample";
import ImportDropzone from "@/components/Imports/ImportDropzone";
import ImportsTable from "@/components/Imports/ImportsTable";

export default function ImportsPage() {
  const [refreshFlag, setRefreshFlag] = useState(false);

  const handleUploadSuccess = () => {
    setRefreshFlag((prev) => !prev); 
  };

  return (
    <>
      <div className="grid gap-6 p-6 md:grid-cols-1 lg:grid-cols-2 auto-rows-min">
        <CsvExample />
        <ImportDropzone onUploadSuccess={handleUploadSuccess} />
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-1 lg:grid-cols-1 auto-rows-min">
        <ImportsTable refreshFlag={refreshFlag} />
      </div>
    </>
  );
}

