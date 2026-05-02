import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-muted">
    <div className="text-center px-4">
      <h1 className="mb-4 text-4xl font-bold font-display">404</h1>
      <p className="mb-6 text-xl text-muted-foreground">Seite nicht gefunden.</p>
      <Link to="/" className="text-primary underline underline-offset-4 hover:text-primary/90">
        Zur Startseite
      </Link>
    </div>
  </div>
);

export default NotFound;
