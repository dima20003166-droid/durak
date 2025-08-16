import React from 'react';

export const RoomCardSkeleton = () => (
  <div className="p-4 rounded-lg border border-border bg-surface animate-pulse flex items-center justify-between">
    <div className="space-y-2 w-full">
      <div className="h-4 bg-border rounded w-1/3" />
      <div className="h-3 bg-border rounded w-1/2" />
    </div>
    <div className="w-20 h-8 bg-border rounded" />
  </div>
);

export const ChatMessageSkeleton = () => (
  <div className="flex items-start gap-2 animate-pulse">
    <div className="w-8 h-8 rounded-full bg-border" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-border rounded w-1/4" />
      <div className="h-3 bg-border rounded w-3/4" />
    </div>
  </div>
);

