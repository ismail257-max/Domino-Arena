import React from 'react';

const GameStatusBadge = ({ status, winnerId, currentUserId }) => {
  let text = 'Unknown';
  let colorClasses = 'bg-gray-500 text-white';

  const finalStatus = status === 'completed' 
    ? (winnerId === currentUserId ? 'won' : 'lost') 
    : status;
  
  switch (finalStatus) {
    case 'waiting':
      text = 'Waiting';
      colorClasses = 'bg-yellow-500/20 text-yellow-300';
      break;
    case 'in-progress':
      text = 'In Progress';
      colorClasses = 'bg-blue-500/20 text-blue-300';
      break;
    case 'won':
      text = 'Won';
      colorClasses = 'bg-green-500/20 text-green-300';
      break;
    case 'lost':
      text = 'Lost';
      colorClasses = 'bg-red-500/20 text-red-300';
      break;
    case 'cancelled':
      text = 'Cancelled';
      colorClasses = 'bg-gray-600/30 text-gray-400';
      break;
    default:
      text = status;
  }

  return (
    <div className={`px-3 py-1 text-xs font-semibold rounded-full inline-block ${colorClasses}`}>
      {text}
    </div>
  );
};

export default GameStatusBadge;
