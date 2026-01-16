export default function Footer() {
  return (
    <footer className="bg-secondary">
      <div className="container mx-auto py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} mycarvalue.in. All rights reserved.</p>
      </div>
    </footer>
  );
}