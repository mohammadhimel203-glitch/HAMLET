import React from 'react';
import { Badge } from '@/components/ui/badge';

export function StatusBadge({ status }) {
  if (!status) return null;
  
  const normalizedStatus = status.toLowerCase();
  
  const variants = {
    pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80",
    approved: "bg-green-100 text-green-800 hover:bg-green-100/80",
    printing: "bg-purple-100 text-purple-800 hover:bg-purple-100/80",
    shipped: "bg-cyan-100 text-cyan-800 hover:bg-cyan-100/80",
    delivered: "bg-blue-100 text-blue-800 hover:bg-blue-100/80",
    cancelled: "bg-red-100 text-red-800 hover:bg-red-100/80",
    returned: "bg-orange-100 text-orange-800 hover:bg-orange-100/80",
    rejected: "bg-red-100 text-red-800 hover:bg-red-100/80",
    active: "bg-green-100 text-green-800 hover:bg-green-100/80",
    inactive: "bg-gray-100 text-gray-800 hover:bg-gray-100/80",
  };

  const className = variants[normalizedStatus] || "bg-gray-100 text-gray-800 hover:bg-gray-100/80";

  return (
    <Badge className={`${className} border-none capitalize font-medium transition-colors`}>
      {status}
    </Badge>
  );
}
