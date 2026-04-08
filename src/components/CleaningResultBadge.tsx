import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import "../styles/CleaningResultBadge.css";

interface CleaningResultBadgeProps {
  result: { success: boolean; message: string } | null;
}

export default function CleaningResultBadge({ result }: CleaningResultBadgeProps) {
  if (!result) return null;

  return (
    <div className="cleaning-result-overlay">
      <div className={`cleaning-result-badge ${result.success ? "success" : "error"}`}>
        {result.success ? (
          <FaCheckCircle className="cleaning-result-icon" />
        ) : (
          <FaTimesCircle className="cleaning-result-icon" />
        )}
        <p className="cleaning-result-message">{result.message}</p>
      </div>
    </div>
  );
}
