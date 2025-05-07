import React, { useState, useEffect } from 'react';
import { useWeb3 } from './common/useWeb3';
import { Auction } from './common/types';
import BidModal from './bidModal'; // We'll create this next
import { ethers } from 'ethers';
import ActiveAuctionItem from './activeAuctionItem'; // Import the new component

interface ActiveAuctionsProps {
  // No specific props needed here, uses useWeb3 hook
}

const ActiveAuctions: React.FC<ActiveAuctionsProps> = () => {
  const { account, isConnected, activeAuctions, isLoadingActiveAuctions,wonAuctions,isLoadingWonAuctions, placeBid, claimNFT ,endAuction} = useWeb3();
  // const [activeAuctions, setActiveAuctions] = useState<Auction[]>([]);
  // const [wonAuctions, setWonAuctions] = useState<Auction[]>([]);
  // const [isLoadingActiveAuctions, setIsLoadingActiveAuctions] = useState(false);
  // const [isLoadingWonAuctions, setIsLoadingWonAuctions] = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedAuctionForBid, setSelectedAuctionForBid] = useState<Auction | null>(null);

  // Fetch active auctions
  // useEffect(() => {
  //   console.log("This got refreshed");
  //   const fetchAuctions = async () => {
  //     console.log("This got refreshed here");
  //     if (getActiveAuctions) {
  //       setIsLoadingActiveAuctions(true);
  //       try {
  //         const auctions = await getActiveAuctions();
  //         setActiveAuctions(auctions);
  //       } catch (error) {
  //         console.error("Failed to fetch active auctions:", error);
  //       } finally {
  //         setIsLoadingActiveAuctions(false);
  //       }
  //     } else {
  //         setActiveAuctions([]);
  //     }
  //   };
  //   fetchAuctions();

  //   // Add a timer to refresh auctions periodically in a real app
  //   // const timer = setInterval(fetchAuctions, 30000); // Refresh every 30 seconds
  //   // return () => clearInterval(timer); // Cleanup timer
  // }, [getActiveAuctions]); // Re-run when getter changes

  //  // Fetch won auctions
  // useEffect(() => {
  //   const fetchWonAuctions = async () => {
  //     if (getWonAuctions) {
  //       setIsLoadingWonAuctions(true);
  //       try {
  //         const auctions = await getWonAuctions();
  //         setWonAuctions(auctions);
  //       } catch (error) {
  //         console.error("Failed to fetch won auctions:", error);
  //       } finally {
  //         setIsLoadingWonAuctions(false);
  //       }
  //     } else {
  //       setWonAuctions([]);
  //     }
  //   };
  //   if (isConnected && account) {
  //      fetchWonAuctions();
  //   } else {
  //       setWonAuctions([]); // Clear won auctions if disconnected
  //   }
  // }, [isConnected, account, getWonAuctions]); // Re-run when connection or getter changes

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
            alert(error.message || "Failed to end auction."); // Show user-friendly error

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

    function truncateToFourDecimals(input: string | number): string {
      // Ensure input is treated as a string
      const inputString = String(input);
  
      const decimalIndex = inputString.indexOf('.');
  
      // If there's no decimal point, or if there are already 4 or fewer digits after the decimal,
      // return the original string.
      // We check if the length is less than or equal to the decimal index + 5
      // (index of '.' + 1 for the '.' itself + 4 for the max digits).
      if (decimalIndex === -1 || inputString.length <= decimalIndex + 5) {
          return inputString;
      }
  
      // Otherwise, truncate the string at the desired position.
      // The substring goes from the start (index 0) up to, but not including,
      // the index after the 4th decimal digit.
      // Index of '.' is decimalIndex
      // 1st decimal digit is at decimalIndex + 1
      // 4th decimal digit is at decimalIndex + 4
      // We want to include the 4th digit, so we cut *after* it. The index *after* is decimalIndex + 5.
      return inputString.substring(0, decimalIndex + 5);
  }
  console.log("Dorellll");
  console.log(wonAuctions);

  console.log(activeAuctions);


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
             <ActiveAuctionItem
                 key={auction.id} // Use auction.id as the key
                 auction={auction}
                 account={account}
                 isConnected={isConnected}
                 onBidClick={handleBidClick}// Pass the bid handler down
                 onEndAuctionClick={handleEndAuctionClick} // Pass the end auction handler down
             />
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