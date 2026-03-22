import { useNavigate, useParams } from "react-router-dom";
import Dashboard from "../components/Dashboard.jsx";
import ScanInput from "../components/ScanInput.jsx";

import { cn } from "../lib/cn.js";

export default function ScannerWorkspace() {
  const { scanId } = useParams();
  const navigate = useNavigate();

  return (
    <div className={cn("mx-auto grid max-w-7xl gap-6", !scanId ? "lg:grid-cols-[minmax(0,400px)_1fr] lg:gap-8 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:gap-10" : "")}>
      {!scanId && (
        <ScanInput
          onScanStarted={(id) => {
            navigate(`/app/scan/${id}`);
          }}
        />
      )}
      <Dashboard
        scanId={scanId}
        onSelectScan={(id) => navigate(`/app/scan/${id}`)}
        onScanDeleted={() => navigate("/app")}
      />
    </div>
  );
}
