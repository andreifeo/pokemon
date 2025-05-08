import React, { useState, useEffect } from 'react';
import { PokemonNFT } from './common/types';

interface CreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownedNFTs: PokemonNFT[]; 
  onCreateAuction: (nftId: number, duration: number, startBid: number,listingType:string) => Promise<void>;
}

const CreateAuctionModal: React.FC<CreateAuctionModalProps> = ({ isOpen, onClose, ownedNFTs, onCreateAuction }) => {
  const [selectedNftId, setSelectedNftId] = useState<number | ''>('');
  const [durationHours, setDurationHours] = useState<number>(24); 
  const [startBid, setStartBid] = useState<number>(0.01);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listingType,setListingType]=useState<string>("Auction")
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
    if (selectedNftId === '' || durationHours <= 0 || startBid <= 0||(listingType!=="Auction" && listingType!=="Sale")) {
      alert("Please select an NFT, set a valid duration and starting bid and select Auction or Sale");
      return;
    }

    setIsSubmitting(true);
    const durationSeconds = durationHours * 3600;
    await onCreateAuction(Number(selectedNftId), durationSeconds, startBid,listingType);
    setIsSubmitting(false);
  };

  return (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 100
    }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', minWidth: '300px' }}>
        <h4>Create New Listing</h4>
        <div>
          <label>Select Auction or Sale:</label>
          <select
            value={listingType}
            onChange={(e)=>setListingType(String(e.target.value))}>
              <option value="Auction">
                Auction
              </option>
              <option value="Sale">
                Sale
              </option>
          </select>
          <div style={{ marginTop: '15px' }}>
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
          <label>{`${listingType==="Sale"?"Selling Price":"Starting Bid"}`} (ETH):</label>
          <input
            type="number"
            value={startBid}
            onChange={(e) => setStartBid(Number(e.target.value))}
            min="0.001"
            step="0.001"
            disabled={isSubmitting}
          />
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={isSubmitting} style={{ marginRight: '10px' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isSubmitting || selectedNftId === ''}>
            {isSubmitting ? 'Creating...' : `Submit  ${listingType}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAuctionModal;