import React, { useState, useEffect } from 'react';
import { useWeb3 } from './common/useWeb3';
import { Auction } from './common/types';
import BidModal from './bidModal'; // We'll create this next

interface ActiveAuctionsProps {
  // No specific props needed here, uses useWeb3 hook
}

const ActiveAuctions: React.FC<ActiveAuctionsProps> = () => {
  const { account, isConnected, getActiveAuctions, getWonAuctions, placeBid, claimNFT } = useWeb3();
  const [activeAuctions, setActiveAuctions] = useState<Auction[]>([]);
  const [wonAuctions, setWonAuctions] = useState<Auction[]>([]);
  const [isLoadingActiveAuctions, setIsLoadingActiveAuctions] = useState(false);
  const [isLoadingWonAuctions, setIsLoadingWonAuctions] = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedAuctionForBid, setSelectedAuctionForBid] = useState<Auction | null>(null);

  // Fetch active auctions
  useEffect(() => {
    const fetchAuctions = async () => {
      if (getActiveAuctions) {
        setIsLoadingActiveAuctions(true);
        try {
          const auctions = await getActiveAuctions();
          setActiveAuctions(auctions);
        } catch (error) {
          console.error("Failed to fetch active auctions:", error);
        } finally {
          setIsLoadingActiveAuctions(false);
        }
      } else {
          setActiveAuctions([]);
      }
    };
    fetchAuctions();
    // Add a timer to refresh auctions periodically in a real app
    const timer = setInterval(fetchAuctions, 30000); // Refresh every 30 seconds
    return () => clearInterval(timer); // Cleanup timer
  }, [getActiveAuctions]); // Re-run when getter changes

   // Fetch won auctions
  useEffect(() => {
    const fetchWonAuctions = async () => {
      if (getWonAuctions) {
        setIsLoadingWonAuctions(true);
        try {
          const auctions = await getWonAuctions();
          setWonAuctions(auctions);
        } catch (error) {
          console.error("Failed to fetch won auctions:", error);
        } finally {
          setIsLoadingWonAuctions(false);
        }
      } else {
        setWonAuctions([]);
      }
    };
    if (isConnected && account) {
       fetchWonAuctions();
    } else {
        setWonAuctions([]); // Clear won auctions if disconnected
    }
  }, [isConnected, account, getWonAuctions]); // Re-run when connection or getter changes

  const handleBidClick = (auction: Auction) => {
      if (!isConnected || !account) {
          alert("Connect your wallet to place a bid.");
          return;
      }
       if (auction.seller.toLowerCase() === account.toLowerCase()) {
           alert("You cannot bid on your own auction.");
           return;
       }
    setSelectedAuctionForBid(auction);
    setBidModalOpen(true);
  };

   const handlePlaceBid = async (auctionId: number, bidAmount: number) => {
       if (!placeBid) {
           console.error("Place bid function not available.");
           return;
       }
       try {
           await placeBid(auctionId, bidAmount);
           alert("Bid placed successfully (simulated).");
           // In a real app, refresh active auctions
       } catch (error) {
           console.error("Failed to place bid:", error);
           alert("Failed to place bid.");
       }
       handleCloseBidModal(); // Close modal after attempt
   };

  const handleCloseBidModal = () => {
    setBidModalOpen(false);
    setSelectedAuctionForBid(null);
  };

   const handleClaimNFTClick = async (auctionId: number) => {
       if (!claimNFT || !account) {
           console.error("Claim NFT function not available or not connected.");
           return;
       }
       // Add confirmation if needed
       if (window.confirm("Are you sure you want to claim this NFT?")) {
            try {
                await claimNFT(auctionId);
                alert("NFT claimed successfully (simulated).");
                // In a real app, refresh won auctions list and user's owned NFTs
            } catch (error) {
                 console.error("Failed to claim NFT:", error);
                 alert("Failed to claim NFT.");
            }
       }
   };


    // Helper to format time remaining
    const formatTimeRemaining = (endTime: number): string => {
        const now = Math.floor(Date.now() / 1000);
        const remaining = endTime - now;

        if (remaining <= 0) return "Ended";

        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;

        return `${hours}h ${minutes}m ${seconds}s`;
    };


  return (
    <div style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px' }}>
      <h4>2.2. Active Auctions & Winning Redemption</h4>

      <h5>Active Auctions</h5>
      {isLoadingActiveAuctions ? (
          <p>Loading active auctions...</p>
      ) : activeAuctions.length === 0 ? (
        <p>No active auctions found.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {activeAuctions.map(auction => (
            <li key={auction.id} style={{ border: '1px solid #eee', margin: '10px 0', padding: '10px', display: 'flex', alignItems: 'center' }}>
              <img src={auction.nft.imageUrl} alt={auction.nft.name} style={{ width: '50px', height: '50px', marginRight: '15px' }} />
              <div>
                <strong>{auction.nft.name}</strong> ({auction.nft.type})
                <br />
                Current Bid: {auction.currentBid} ETH
                <br />
                 Time Left: {formatTimeRemaining(auction.endTime)}
              </div>
              <button
                  onClick={() => handleBidClick(auction)}
                  disabled={!isConnected || !account || auction.seller.toLowerCase() === account?.toLowerCase() || auction.endTime <= Math.floor(Date.now()/1000)} // Disable if not connected, seller, or ended
                  style={{ marginLeft: 'auto' }}
                >
                  {auction.endTime <= Math.floor(Date.now()/1000) ? 'Ended' : 'Bid'}
                </button>
            </li>
          ))}
        </ul>
      )}

      <h5 style={{ marginTop: '20px' }}>Won Auctions (Ready to Claim)</h5>
       {isLoadingWonAuctions ? (
          <p>Loading won auctions...</p>
      ) : wonAuctions.length === 0 ? (
        <p>No won auctions to claim.</p>
      ) : (
         <ul style={{ listStyle: 'none', padding: 0 }}>
            {wonAuctions.map(auction => (
                <li key={`won-${auction.id}`} style={{ border: '1px solid #eee', margin: '10px 0', padding: '10px', display: 'flex', alignItems: 'center' }}>
                     <img src={auction.nft.imageUrl} alt={auction.nft.name} style={{ width: '50px', height: '50px', marginRight: '15px' }} />
                     <div>
                         You won: <strong>{auction.nft.name}</strong> (ID: {auction.nft.id})
                         <br/>
                         Final Bid: {auction.currentBid} ETH
                     </div>
                    <button
                        onClick={() => handleClaimNFTClick(auction.id)}
                        disabled={!isConnected || !account}
                        style={{ marginLeft: 'auto' }}
                    >
                        Claim NFT
                    </button>
                </li>
            ))}
         </ul>
      )}


      {selectedAuctionForBid && (
          <BidModal
            isOpen={bidModalOpen}
            onClose={handleCloseBidModal}
            auction={selectedAuctionForBid}
            onPlaceBid={handlePlaceBid}
          />
      )}
    </div>
  );
};

export default ActiveAuctions;