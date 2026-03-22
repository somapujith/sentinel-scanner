import { Navigate, useParams } from "react-router-dom";

/** Preserves bookmarks to /scan/:id */
export default function LegacyScanRedirect() {
  const { scanId } = useParams();
  return <Navigate to={`/app/scan/${scanId}`} replace />;
}
