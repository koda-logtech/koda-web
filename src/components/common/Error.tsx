interface ErrorProps {
  message: string;
  onRetry?: () => void;
}

export default function Error({ message, onRetry }: ErrorProps) {
  return (
    <div className="error-container">
      <h2>Erro</h2>
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary">
          Tentar Novamente
        </button>
      )}
    </div>
  );
}
