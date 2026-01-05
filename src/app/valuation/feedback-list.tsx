
'use client';

import { useMemoFirebase } from '@/firebase/provider';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import type { Feedback } from '@/lib/firebase/feedback-service';

export function FeedbackList() {
  const firestore = useFirestore();

  const feedbackQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'feedback'), orderBy('createdAt', 'desc'), limit(20));
  }, [firestore]);

  const { data: feedback, isLoading } = useCollection<Feedback>(feedbackQuery);

  if (isLoading) {
    return (
        <div className="mt-8 space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    );
  }

  return (
    <div className="mt-12 space-y-6">
        <CardTitle className='text-2xl'>What Others Are Saying</CardTitle>
        {feedback && feedback.length > 0 ? (
            feedback.map((item) => (
            <Card key={item.id} className="bg-secondary/50">
                <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                        <Avatar>
                            <AvatarImage src={item.userPhotoURL ?? undefined} alt={item.userName} />
                            <AvatarFallback>
                                {item.userName?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <p className="font-semibold">{item.userName}</p>
                                {item.createdAt && (item.createdAt instanceof Timestamp) && (
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })}
                                    </p>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-foreground/80">{item.feedback}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            ))
        ) : (
            <p className="text-center text-muted-foreground">No feedback yet. Be the first to share your thoughts!</p>
        )}
    </div>
  );
}
