import React, { useState, useEffect } from 'react';
import { useWeb3 } from './common/useWeb3';
import { Auction } from './common/types';
import BidModal from './bidModal'; // We'll create this next
import { ethers } from 'ethers';
import ActiveAuctionItem from './activeAuctionItem'; // Import the new component

interface ActiveAuctionsProps {
}

const ActiveAuctions: React.FC<ActiveAuctionsProps> = () => {
  const { account, isConnected, activeAuctions, isLoadingActiveAuctions,wonAuctions,isLoadingWonAuctions, placeBid, claimNFT ,endAuction} = useWeb3();
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedAuctionForBid, setSelectedAuctionForBid] = useState<Auction | null>(null);

  const handleEndAuctionClick = async (auction: Auction) => {
    if (!endAuction){
      console.error("End Auction functionality not available");
      return;
    }
      if (!isConnected || !account) {
          alert("Connect your wallet to end auction.");
          return;
      }
       if (auction.seller.toLowerCase() !== account.toLowerCase()) {
           alert("You cannot end someone else's auction.");
           return;
       }
       try{
        await endAuction(auction.id);
        alert("Auction ended succesfully");
       }
        catch(error){
          console.error("Failed to end auction in UI:", error);
          if(error instanceof Error){
            alert(error.message || "Failed to end auction.");

          }
        }
  };
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

   const handlePlaceBid = async (auctionId: number, bidAmount: bigint) => {
       if (!placeBid) {
           console.error("Place bid/buy function not available.");
           return;
       }
       try {
           await placeBid(auctionId, bidAmount);
           alert("Bid/Buy placed successfully.");
       } catch (error) {
           console.error("Failed to place bid/buy:", error);
           alert("Failed to place bid/buy.");
       }
       handleCloseBidModal();
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
       if (window.confirm("Are you sure you want to claim this NFT?")) {
            try {
                await claimNFT(auctionId);
                alert("NFT claimed successfully.");
            } catch (error) {
                 console.error("Failed to claim NFT:", error);
                 alert("Failed to claim NFT.");
            }
       }
   };

  return (
    <div style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px' }}>
      <h4>2.2. Active Listings & Winning Redemption</h4>

      <h5>Active Listings</h5>
      {isLoadingActiveAuctions ? (
          <p>Loading active listings...</p>
      ) : activeAuctions.length === 0 ? (
        <p>No active listings found.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {activeAuctions.map(auction => (
             <ActiveAuctionItem
                 key={auction.id} 
                 auction={auction}
                 account={account}
                 isConnected={isConnected}
                 onBidClick={handleBidClick}
                 onEndAuctionClick={handleEndAuctionClick}
             />
          ))}
        </ul>
      )}

      <h5 style={{ marginTop: '20px' }}>Won Listings (Ready to Claim)</h5>
       {isLoadingWonAuctions ? (
          <p>Loading won listings...</p>
      ) : wonAuctions.length === 0 ? (
        <p>No won listings to claim.</p>
      ) : (
         <ul style={{ listStyle: 'none', padding: 0 }}>
            {wonAuctions.map(auction => (
                <li key={`won-${auction.id}`} style={{ border: '1px solid #eee', margin: '10px 0', padding: '10px', display: 'flex', alignItems: 'center' }}>
                     <img src={auction.nft.imageUrl} alt={auction.nft.name} style={{ width: '50px', height: '50px', marginRight: '15px' }} />
                     {auction.highestBidder!=="0x0000000000000000000000000000000000000000"?
                     <div>
                     You won: <strong>{auction.nft.name}</strong> (ID: {auction.nft.id})
                     <br/>
                     Final Bid: {ethers.formatEther(auction.currentBid.toString())} ETH
                 </div>
                  :
                  <div>
                     You can reclaim: <strong>{auction.nft.name}</strong> (ID: {auction.nft.id})
                     <br/>
                 </div>
                     }
                     
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