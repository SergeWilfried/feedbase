'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@feedbase/ui/components/avatar';
import { Button } from '@feedbase/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuDestructiveItem,
  DropdownMenuTrigger,
} from '@feedbase/ui/components/dropdown-menu';
import { Separator } from '@feedbase/ui/components/separator';
import { Skeleton } from '@feedbase/ui/components/skeleton';
import { cn } from '@feedbase/ui/lib/utils';
import { BadgeCheck, MoreVertical, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { PROSE_CN } from '@/lib/constants';
import { FeedbackCommentWithUserProps } from '@/lib/types';
import { formatRootUrl } from '@/lib/utils';
import CommentInput from './comment-input';

// Define a type for the props
interface CommentProps extends React.HTMLAttributes<HTMLDivElement> {
  commentData: FeedbackCommentWithUserProps;
  projectSlug: string;
  children?: React.ReactNode;
}

export default function Comment({ commentData, projectSlug, children, ...props }: CommentProps) {
  const [comment, setComment] = useState<FeedbackCommentWithUserProps>(commentData);
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [timeAgo, setTimeAgo] = useState<string>('');
  const router = useRouter();

  // Time ago
  function formatTimeAgo(date: Date) {
    const now = new Date();
    const timeDiff = now.getTime() - date.getTime();

    const times = [
      { unit: 'year', value: 1000 * 60 * 60 * 24 * 365 },
      { unit: 'month', value: 1000 * 60 * 60 * 24 * 30 },
      { unit: 'day', value: 1000 * 60 * 60 * 24 },
      { unit: 'hour', value: 1000 * 60 * 60 },
      { unit: 'minute', value: 1000 * 60 },
      { unit: 'second', value: 1000 },
    ];

    for (const unit of times) {
      const value = Math.floor(timeDiff / unit.value);
      if (value >= 1) {
        return `${value} ${unit.unit}${value > 1 ? 's' : ''} ago`;
      }
    }

    return 'just now';
  }

  // On delete comment
  async function onDelete() {
    const promise = new Promise((resolve, reject) => {
      fetch(`/api/v1/projects/${projectSlug}/feedback/${comment.feedback_id}/comments/${comment.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            reject(data.error);
          } else {
            resolve(data);
          }
        })
        .catch((err) => {
          reject(err.message);
        });
    });

    promise
      .then(() => {
        // Reload comments
        router.refresh();
      })
      .catch((err) => {
        toast.error(err);
      });
  }

  // On upvote comment
  async function onUpvote() {
    // Update comment
    const updatedComment = { ...comment }; // Create a copy of the comment
    updatedComment.upvotes = comment.upvotes + (comment.has_upvoted ? -1 : 1);
    updatedComment.has_upvoted = !comment.has_upvoted;

    // Update state
    setComment(updatedComment);

    const promise = new Promise((resolve, reject) => {
      fetch(`/api/v1/projects/${projectSlug}/feedback/${comment.feedback_id}/comments/${comment.id}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            reject(data.error);
          } else {
            resolve(data);
          }
        })
        .catch((err) => {
          reject(err.message);
        });
    });

    promise.catch((err) => {
      // Revert the comment to its previous state
      setComment(comment);

      toast.error(err);
    });
  }

  useEffect(() => {
    setTimeAgo(formatTimeAgo(new Date(comment.created_at)));
  }, [comment.created_at]);

  return (
    <div className='flex h-fit w-full flex-col' {...props}>
      {/* Comment */}
      <div className='flex flex-row items-center justify-between'>
        <div className='flex flex-row items-center gap-2'>
          {/* Author */}
          <div className='text-foreground/60 flex select-none flex-row items-center justify-start gap-2 '>
            {/* User */}
            <Avatar className='h-8 w-8 gap-2 overflow-visible border'>
              <div className='h-full w-full overflow-hidden rounded-full'>
                <AvatarImage src={comment.user.avatar_url || ''} alt={comment.user.full_name} />
                <AvatarFallback className='text-xs '>{comment.user.full_name[0]}</AvatarFallback>
                {/* If team member, add small verified badge to top of profile picture */}
                {commentData.user.isTeamMember ? (
                  <div className='bg-root absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full'>
                    <BadgeCheck className='fill-highlight stroke-root outline-root z-10 h-4 w-4 outline-2' />
                  </div>
                ) : null}
              </div>
            </Avatar>
            {/* Name */}
            <span className='text-foreground text-sm'>{comment.user.full_name}</span>·{/* Time ago */}
            {!timeAgo ? (
              <Skeleton className='h-4 w-20 rounded-sm' />
            ) : (
              <span className='text-muted-foreground text-xs'>{timeAgo}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              className='text-foreground/60 -mr-3 flex h-8 w-8 hover:bg-transparent'
              size='icon'>
              <MoreVertical className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-[160px]'>
            <DropdownMenuDestructiveItem className='flex flex-row items-center gap-2' onClick={onDelete}>
              <Trash2Icon className='h-4 w-4' />
              Delete
            </DropdownMenuDestructiveItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className='flex h-fit w-full flex-row gap-5'>
        {/* Separator */}
        <div className='relative flex flex-col items-center justify-center'>
          <Separator
            className='from-border to-root/95 absolute left-[14px] top-1 h-full w-1 rounded-lg bg-gradient-to-b'
            orientation='vertical'
          />
        </div>

        {/* Content */}
        <div className='flex h-fit w-full flex-col gap-1 pl-5'>
          {/* Comment Content html */}
          <div
            className={cn('text-secondary-foreground text-sm', PROSE_CN)}
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />

          {/* Bottom Row */}
          <div className='flex w-full flex-row items-center justify-start gap-1.5'>
            {/* Upvote Button */}
            <Button
              variant='ghost'
              className={cn(
                'text-foreground/60 hover:text-foreground/60 -ml-2 gap-1.5 text-sm  hover:bg-transparent'
              )}
              size='sm'
              onClick={() => {
                onUpvote();
              }}>
              <span
                className={cn(
                  'hover:text-highlight flex flex-row items-center gap-1 transition-all duration-200',
                  comment.has_upvoted ? 'text-highlight' : 'text-foreground/60'
                )}>
                {comment.has_upvoted ? 'Upvoted' : 'Upvote'}
              </span>

              {/* Upvote Count */}
              <span className='flex flex-row items-center gap-1'>({comment.upvotes})</span>
            </Button>

            {/* Reply Button */}
            <Button
              variant='ghost'
              className='text-foreground/60 hover:text-highlight -ml-2 text-sm  hover:bg-transparent'
              size='sm'
              onClick={() => {
                setIsReplying(!isReplying);
              }}>
              Reply
            </Button>

            {/* Share Button */}
            <Button
              variant='ghost'
              className='text-foreground/60 hover:text-highlight -ml-2 text-sm  hover:bg-transparent'
              size='sm'
              onClick={() => {
                navigator.clipboard.writeText(
                  formatRootUrl(projectSlug, `/feedback/${comment.feedback_id}?comment=${comment.id}`)
                );

                toast.success('Copied link to clipboard.');
              }}>
              Share
            </Button>
          </div>

          {/* Reply Input */}
          {isReplying ? (
            <CommentInput
              projectSlug={projectSlug}
              feedbackId={comment.feedback_id}
              parentCommentId={comment.id}
            />
          ) : null}

          {/* Replies */}
          <div className='flex h-full w-full flex-col gap-5 pt-2'>{children}</div>
        </div>
      </div>
    </div>
  );
}
