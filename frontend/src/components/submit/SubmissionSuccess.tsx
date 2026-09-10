import { Link } from 'react-router-dom';

interface SubmissionSuccessProps {
  onReset: () => void;
}

export function SubmissionSuccess({ onReset }: SubmissionSuccessProps) {
  return (
    <div className="submission-success-card">
      <span className="submission-success-icon" aria-hidden="true">
        🎉
      </span>
      <h2 className="submission-success-title">
        Thanks for helping Hyderabad discover more Ganesh mandapams!
      </h2>
      <p className="submission-success-subtext">
        Your submission has been received and will appear after verification.
      </p>

      <div className="submission-success-actions">
        <Link to="/" className="btn btn-primary btn-large">
          ← Explore Mandapams
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="btn btn-secondary btn-large"
        >
          ➕ Add Another
        </button>
      </div>
    </div>
  );
}
