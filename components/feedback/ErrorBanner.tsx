type ErrorBannerProps = {
  message: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <p
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm break-words text-red-800"
      role="alert"
    >
      {message}
    </p>
  );
}
