import React, { useState, useEffect } from 'react';
import { Auction } from './common/types';

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: Auction | null; // The auction being bid on
  onPlaceBid: (auctionId: number, bidAmount: number) => Promise<void>;
}

const BidModal: React.FC<BidModalProps> = ({ isOpen, onClose, auction, onPlaceBid }) => {
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set minimum bid when modal opens
  useEffect(() => {
    if (isOpen && auction) {
      // Minimum bid is current bid + a small increment (e.g., 0.001 ETH)
      // In a real app, this increment might be defined by the contract or UI rules
      const minBid = auction.currentBid + 0.001; // Example increment
      setBidAmount(minBid);
    }
     setIsSubmitting(false);
  }, [isOpen, auction]);

  if (!isOpen || !auction) return null;

  const handleSubmit = async () => {
      // Simple validation: bid must be higher than current bid + increment
      const minValidBid = auction.currentBid + 0.0009; // Check against slightly less than UI min
      if (bidAmount <= auction.currentBid || bidAmount < minValidBid) {
        alert(`Bid must be higher than the current bid (${auction.currentBid} ETH). Minimum bid: ${auction.currentBid + 0.001} ETH`);
        return;
      }
       if (bidAmount <= 0) {
           alert("Bid amount must be positive.");
           return;
       }


    setIsSubmitting(true);
    await onPlaceBid(auction.id, bidAmount);
    // onPlaceBid will handle closing the modal and showing alerts
    setIsSubmitting(false); // Should ideally be handled after await in parent or here on error
  };

  return (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 100
    }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', minWidth: '300px' }}>
        <h4>Place Bid</h4>
        <p>Auction for: <strong>{auction.nft.name}</strong></p>
        <p>Current Highest Bid: {auction.currentBid} ETH</p>
        <div style={{ marginTop: '15px' }}>
          <label>Your Bid (ETH):</label>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(Number(e.target.value))}
             min={auction.currentBid + 0.001} // Suggest minimum bid
            step="0.001"
            disabled={isSubmitting}
          />
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={isSubmitting} style={{ marginRight: '10px' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isSubmitting || bidAmount <= auction.currentBid}> {/* Disable if bid not higher */}
            {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BidModal;