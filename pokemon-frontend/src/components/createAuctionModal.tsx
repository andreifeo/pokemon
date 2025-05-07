import React, { useState, useEffect } from 'react';
import { PokemonNFT } from './common/types';

interface CreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownedNFTs: PokemonNFT[]; // List of NFTs the user can auction
  onCreateAuction: (nftId: number, duration: number, startBid: number) => Promise<void>;
}

const CreateAuctionModal: React.FC<CreateAuctionModalProps> = ({ isOpen, onClose, ownedNFTs, onCreateAuction }) => {
  const [selectedNftId, setSelectedNftId] = useState<number | ''>('');
  const [durationHours, setDurationHours] = useState<number>(24); // Duration in hours
  const [startBid, setStartBid] = useState<number>(0.01); // Starting bid in Ether units
  const [isSubmitting, setIsSubmitting] = useState(false);
  console.log("CC");
  console.log(ownedNFTs);
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedNftId(ownedNFTs.length > 0 ? ownedNFTs[0].id : '');
      setDurationHours(24);
      setStartBid(0.01);
      setIsSubmitting(false);
    }
  }, [isOpen, ownedNFTs]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (selectedNftId === '' || durationHours <= 0 || startBid <= 0) {
      alert("Please select an NFT, set a valid duration and starting bid.");
      return;
    }

    setIsSubmitting(true);
    // Convert duration from hours to seconds for smart contract (common practice)
    const durationSeconds = durationHours * 3600;
    await onCreateAuction(Number(selectedNftId), durationSeconds, startBid);
    // onCreateAuction will handle closing the modal and showing alerts
    setIsSubmitting(false); // Should ideally be handled after await in parent or here on error
  };

  return (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 100
    }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', minWidth: '300px' }}>
        <h4>Create New Auction</h4>
        <div>
          <label>Select NFT:</label>
          <select
            value={selectedNftId}
            onChange={(e) => setSelectedNftId(Number(e.target.value))}
            disabled={ownedNFTs.length === 0 || isSubmitting}
          >
            {ownedNFTs.length === 0 ? (
                <option value="">No NFTs available</option>
            ) : (
                ownedNFTs.map(nft => (
                <option key={nft.id} value={nft.id}>
                  {nft.name} (ID: {nft.id})
                </option>
              ))
            )}
          </select>
        </div>
        <div style={{ marginTop: '15px' }}>
          <label>Duration (hours):</label>
          <input
            type="number"
            value={durationHours}
            onChange={(e) => setDurationHours(Number(e.target.value))}
            min="1"
            disabled={isSubmitting}
          />
        </div>
        <div style={{ marginTop: '15px' }}>
          <label>Starting Bid (ETH):</label>
          <input
            type="number"
            value={startBid}
            onChange={(e) => setStartBid(Number(e.target.value))}
            min="0.001" // Example minimum bid
            step="0.001"
            disabled={isSubmitting}
          />
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={isSubmitting} style={{ marginRight: '10px' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isSubmitting || selectedNftId === ''}>
            {isSubmitting ? 'Creating...' : 'Submit Auction'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAuctionModal;