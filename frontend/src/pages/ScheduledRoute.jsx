import { useNavigate } from "react-router-dom";
import ScheduledJobs from "../components/ScheduledJobs.jsx";

export default function ScheduledRoute() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl">
      <ScheduledJobs onRunStarted={(id) => navigate(`/app/scan/${id}`)} />
    </div>
  );
}
