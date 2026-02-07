
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gavel, Construction } from "lucide-react";

export default function LiveBidsPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12">
      <Card>
        <CardHeader className="text-center">
             <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Gavel className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Live Car Auctions</CardTitle>
            <CardDescription>This feature is coming soon!</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4 text-center">
            <Construction className="h-16 w-16 text-muted-foreground"/>
             <p className="text-lg text-muted-foreground max-w-md">
                We're working hard to bring you live bidding on certified used cars. Stay tuned for updates!
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
