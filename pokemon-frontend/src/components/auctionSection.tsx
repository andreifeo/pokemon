import React from 'react';
import AuctionCreation from './auctionCreation';
import ActiveAuctions from './activeAuctions';
import OutbidRedemption from './outbidRedemption';

interface AuctionSectionProps {
  // No specific props needed, it's a container
}

const AuctionSection: React.FC<AuctionSectionProps> = () => {
  return (
    <div style={{ border: '1px solid #ccc', padding: '20px' }}>
      <h3>2. Auction System</h3>
      <AuctionCreation />
      <ActiveAuctions />
      <OutbidRedemption />
    </div>
  );
};

export default AuctionSection;