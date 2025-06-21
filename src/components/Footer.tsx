type FooterProps = {
  className?: string;
};

export default function Footer({ className }: FooterProps = {}) {
  return (
    <footer
      className={`py-6 text-sm text-gray-500${
        className ? ` ${className}` : ""
      }`}
    >
      &copy; {new Date().getFullYear()} Assymo. Alle rechten voorbehouden.
    </footer>
  );
}
