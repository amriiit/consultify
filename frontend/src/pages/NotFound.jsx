import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="container section not-found">
      <p className="eyebrow">404 / A different direction</p>
      <h1>Let’s find your way back.</h1>
      <p>This page isn’t here. Your next conversation still is.</p>
      <Link className="button" to="/">
        Return home →
      </Link>
    </div>
  );
}
