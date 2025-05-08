import React, { useState, useEffect } from 'react';
import { useWeb3 } from './common/useWeb3';
import { PokemonNFT } from './common/types';
import CreateAuctionModal from './createAuctionModal';

interface AuctionCreationProps {
}

const AuctionCreation: React.FC<AuctionCreationProps> = () => {
  const { account, isConnected, ownedNFTs,isLoadingOwnedNFTs, createAuction } = useWeb3();
  const [isModalOpen, setIsModalOpen] = useState(false);
  console.log("AA");
  console.log(ownedNFTs);
  console.log("BB");

  const handleCreateAuctionClick = () => {
    if (!isConnected || ownedNFTs.length === 0) {
        alert("You need to connect your wallet and own NFTs to create an auction.");
        return;
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCreate = async (nftId: number, duration: number, startBid: number,listingType:string) => {
      if (!createAuction) {
          console.error("Create auction function not available.");
          return;
      }
      try {
          await createAuction(nftId, duration, startBid,listingType);
          alert("Auction created successfully.");
      } catch (error) {
          console.error("Failed to create auction:", error);
          alert("Failed to create auction.");
      }
      handleCloseModal();
  };
  return (
    <div style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px' }}>
      <h4>2.1. Listing Creation</h4>
      {isConnected ? (
        <>
            <button onClick={handleCreateAuctionClick} disabled={isLoadingOwnedNFTs || ownedNFTs.length === 0}>
              {isLoadingOwnedNFTs ? 'Loading NFTs...' : 'Create Listing'}
            </button>
            {ownedNFTs.length === 0 && !isLoadingOwnedNFTs && <p>No NFTs available to auction.</p>}
            <CreateAuctionModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              ownedNFTs={ownedNFTs}
              onCreateAuction={handleCreate}
            />
        </>
      ) : (
          <p>Connect your wallet to create auctions.</p>
      )}
    </div>
  );
};

export default AuctionCreation;