"use client";

import { useState, useEffect } from 'react';

export default function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-secondary">
      <div className="container mx-auto py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {year || ''} mycarvalue.in. All rights reserved.</p>
      </div>
    </footer>
  );
}

    