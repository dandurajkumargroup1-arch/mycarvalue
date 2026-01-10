
'use client';

import { useMemoFirebase, useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Feedback } from '@/lib/firebase/feedback-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

function FeedbackCard({ feedback }: { feedback: Feedback }) {
  const timeAgo = feedback.createdAt
    ? formatDistanceToNow(new Date((feedback.createdAt as any).seconds * 1000), { addSuffix: true })
    : 'Just now';

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={feedback.userPhotoURL} alt={feedback.userName} />
            <AvatarFallback>{feedback.userName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{feedback.userName}</p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{feedback.feedback}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeedbackSkeleton() {
    return (
        <div className="flex items-start gap-4 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </div>
    )
}

export function FeedbackList() {
  const firestore = useFirestore();

  const feedbackQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'feedback'), orderBy('createdAt', 'desc'), limit(10));
  }, [firestore]);

  const { data: feedbacks, isLoading, error } = useCollection<Feedback>(feedbackQuery);

  if (isLoading) {
    return (
        <div className='space-y-4'>
           {[...Array(3)].map((_, i) => <FeedbackSkeleton key={i} />)}
        </div>
    );
  }

  if (error) {
    return <div className="text-destructive text-center p-4">Error loading feedback. Please try again later.</div>;
  }

  if (!feedbacks || feedbacks.length === 0) {
    return <div className="text-center text-muted-foreground p-4">No feedback yet. Be the first to share your thoughts!</div>;
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((feedback) => (
        <FeedbackCard key={feedback.id} feedback={feedback} />
      ))}
    </div>
  );
}
