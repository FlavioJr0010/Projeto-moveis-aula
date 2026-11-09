export function Stars({ rating, count }: { rating: number; count?: number }) {
  const full = Math.round(rating);
  return (
    <span className="stars" role="img" aria-label={`Nota ${rating.toFixed(1)} de 5${count ? `, ${count} avaliações` : ""}`}>
      {"★".repeat(full)}{"☆".repeat(5 - full)}
      {count !== undefined && <small>{rating.toFixed(1)} ({count})</small>}
    </span>
  );
}
