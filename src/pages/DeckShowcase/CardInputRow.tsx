import "./DeckShowcase.css";

interface CardPreview {
  name: string;
  imageUrls: string[];
  loading: boolean;
  error: boolean;
}

interface Props {
  name: string;
  card: CardPreview | null;
  onNameChange: (v: string) => void;
  onArtClick: () => void;
  onErrorClick?: () => void;
  onRemove?: () => void;
  placeholder?: string;
}

export function CardInputRow({ name, card, onNameChange, onArtClick, onErrorClick, onRemove, placeholder }: Props) {
  const hasImage = card && card.imageUrls.length > 0;

  return (
    <div className="card-input-row">
      <div className="card-input-thumb-wrap">
        {hasImage ? (
          <img
            src={card.imageUrls[0]}
            alt={card.name}
            className="card-input-thumb"
            onClick={onArtClick}
            title="Click to change art / printing"
          />
        ) : (
          <div
            className={`card-input-thumb-placeholder${card?.loading ? " loading" : ""}${card?.error ? " error" : ""}`}
            onClick={card?.error ? onErrorClick : undefined}
            title={card?.error ? "Click for suggestions" : undefined}
            style={card?.error ? { cursor: "pointer" } : undefined}
          >
            {card?.loading && <span className="spinner" />}
            {card?.error && "?"}
          </div>
        )}
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={placeholder}
        className="showcase-input card-input-name"
      />
      {onRemove && (
        <button className="card-input-remove" onClick={onRemove} title="Remove">×</button>
      )}
    </div>
  );
}
