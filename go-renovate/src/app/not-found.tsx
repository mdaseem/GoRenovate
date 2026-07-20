import ErrorState from "./component/Atoms/ErrorState/ErrorState";

export default function NotFound() {
  return (
    <ErrorState
      variant="page"
      title="Page not found"
      message="The page you're looking for doesn't exist or may have been moved."
      actionLabel="Go home"
      href="/"
    />
  );
}
