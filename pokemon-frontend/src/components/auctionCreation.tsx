import React, { useState, useEffect } from 'react';
import { useWeb3 } from './common/useWeb3';
import { PokemonNFT } from './common/types';
import CreateAuctionModal from './createAuctionModal';

interface AuctionCreationProps {
  // No specific props needed here, uses useWeb3 hook
}

const AuctionCreation: React.FC<AuctionCreationProps> = () => {
  const { account, isConnected, getOwnedNFTs, createAuction } = useWeb3();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ownedNFTs, setOwnedNFTs] = useState<PokemonNFT[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (getOwnedNFTs) {
        setIsLoadingNFTs(true);
        try {
          const nfts = await getOwnedNFTs();
          console.log("DOREL");
          console.log(nfts);
          setOwnedNFTs(nfts);
        } catch (error) {
          console.error("Failed to fetch owned NFTs:", error);
        } finally {
          setIsLoadingNFTs(false);
        }
      }
    };
    if (isConnected) {
      fetchNFTs();
    } else {
        setOwnedNFTs([]); // Clear NFTs if disconnected
    }
  }, [isConnected, getOwnedNFTs]); // Re-run when connection status or getter changes

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

  const handleCreate = async (nftId: number, duration: number, startBid: number) => {
      if (!createAuction) {
          console.error("Create auction function not available.");
          return;
      }
      try {
          await createAuction(nftId, duration, startBid);
          alert("Auction created successfully (simulated).");
          // In a real app, you'd refresh active auctions and owned NFTs lists
      } catch (error) {
          console.error("Failed to create auction:", error);
          alert("Failed to create auction.");
      }
      handleCloseModal(); // Close modal after attempt
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px' }}>
      <h4>2.1. Auction Creation</h4>
      {isConnected ? (
        <>
            <button onClick={handleCreateAuctionClick} disabled={isLoadingNFTs || ownedNFTs.length === 0}>
              {isLoadingNFTs ? 'Loading NFTs...' : 'Create Auction'}
            </button>
            {ownedNFTs.length === 0 && !isLoadingNFTs && <p>No NFTs available to auction.</p>}
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