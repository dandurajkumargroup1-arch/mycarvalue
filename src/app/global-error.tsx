'use client'
 
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="container mx-auto flex min-h-screen items-center justify-center py-12">
            <Card className="w-full max-w-lg text-center shadow-lg border-destructive">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="mt-4 text-2xl text-destructive">Something Went Wrong</CardTitle>
                    <CardDescription>
                        An unexpected error occurred. Please try again. If the problem persists, contact support.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                     <pre className="mt-2 w-full whitespace-pre-wrap rounded-md bg-muted p-4 text-left text-xs font-mono">
                        Error: {error.message}
                    </pre>
                    <Button onClick={() => reset()}>Try Again</Button>
                </CardContent>
            </Card>
        </div>
      </body>
    </html>
  )
}
