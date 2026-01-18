"use client";

import { useState, useEffect } from 'react';

export default function Footer() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect will only run on the client, ensuring `new Date()` is not called on the server.
    setIsClient(true);
  }, []);

  return (
    <footer className="bg-secondary">
      <div className="container mx-auto py-6 text-center text-sm text-muted-foreground">
        <p>
          &copy; {isClient ? new Date().getFullYear() : ''} mycarvalue.in. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
