import { ImSpinner8 } from "react-icons/im";

export default function LoadingPulse({ label = "Loading..." }) {
  return (
    <div className="loading-wrap" role="status" aria-live="polite">
      <ImSpinner8 className="spin" />
      <span>{label}</span>
    </div>
  );
}
