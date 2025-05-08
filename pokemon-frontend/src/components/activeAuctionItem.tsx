import React, { useState, useEffect } from 'react';
import { Auction } from './common/types'; // Assuming Auction interface is here
import { ethers } from 'ethers'; // Needed for formatEther
// Assuming truncateToFourDecimals is available or defined here
// You could also pass the formatted bid string from the parent

// Place the formatTimeLeft function inside this component or import it
// Assuming it takes endTime in MILLISECONDS based on previous fix
const formatTimeLeft = (endTime: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTime - now;

    if (remaining <= 0) return "Ended";

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
};

// Assuming truncateToFourDecimals is defined or imported
function truncateToFourDecimals(input: string | number): string {
    const inputString = String(input);
    const decimalIndex = inputString.indexOf('.');
    if (decimalIndex === -1 || inputString.length <= decimalIndex + 5) {
        return inputString;
    }
    return inputString.substring(0, decimalIndex + 5);
}


interface ActiveAuctionItemProps {
    auction: Auction;
    account: string | null; // Pass the current account for bid button logic
    isConnected: boolean; // Pass connection status for bid button logic
    onBidClick: (auction: Auction) => void; // Pass the bid handler from parent
    onEndAuctionClick:(auction:Auction)=>void // Pass the end auction handler from parent
}

const ActiveAuctionItem: React.FC<ActiveAuctionItemProps> = ({
    auction,
    account,
    isConnected,
    onBidClick,
    onEndAuctionClick
}) => {
    // State to hold the formatted time left string for THIS auction
    const [timeLeftString, setTimeLeftString] = useState('');

    // Effect to set up and clear the timer for THIS auction
    useEffect(() => {
        // We know auction is valid here because the parent maps over activeAuctions
        if (!auction || auction.endTime === undefined) {
            setTimeLeftString('Loading...');
            return; // Exit effect if no data
        }

        let intervalId: NodeJS.Timeout;

        const updateCountdown = () => {
            const remainingTime = formatTimeLeft(auction.endTime); // Use THIS auction's endTime
            setTimeLeftString(remainingTime);

            // If the auction has ended, clear the interval
            if (remainingTime === "Ended") {
                clearInterval(intervalId); // Use the intervalId from the outer scope
            }
        };

        // Update immediately on mount/endTime change
        updateCountdown();

        // Set an interval to update the time every second (1000 milliseconds)
        intervalId = setInterval(updateCountdown, 1000);

        // Cleanup function: Clear the interval when this component unmounts
        // or when the effect re-runs (e.g., if auction prop changes)
        return () => clearInterval(intervalId);

    }, [auction.endTime]); // Dependency on auction.endTime is sufficient to restart timer if end time changes

     // Determine if the bid button should be disabled
     // We need to calculate if the auction has ended based on current time
     // A simple check based on the current time is more accurate for the button state
    //  const hasAuctionEnded = auction.endTime*1000 <= Date.now(); // Assuming endTime is in milliseconds
    const hasAuctionEnded=auction.ended;
    return (
        <li style={{ border: '1px solid #eee', margin: '10px 0', padding: '10px', display: 'flex', alignItems: 'center' }}>
            <img src={auction.nft.imageUrl} alt={auction.nft.name} style={{ width: '50px', height: '50px', marginRight: '15px' }} />
            <div>
                <strong>{auction.nft.name}</strong>
                {/* Assuming NFT type is also a property */}
                 {/* {auction.nft.type && ` (${auction.nft.type})`} */}
                
                <br />

                {auction.isFixedPrice?
                <>
                    Buying Price: {truncateToFourDecimals(ethers.formatEther(auction.startingBid as unknown as bigint))} ETH
                </>
                :
                <>
                    Current Bid: {truncateToFourDecimals(ethers.formatEther(auction.currentBid as unknown as bigint))} ETH
                </>
                }
            
                {/* Format and truncate current bid here */}
                {/* Current Bid: {truncateToFourDecimals(ethers.formatEther(auction.currentBid as unknown as bigint))} ETH */}
                <br />
                {/* Display the state variable managed by the timer */}
                Time Left: {timeLeftString}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                {!isConnected||!account?(<></>):(
                    auction.seller.toLowerCase() === account.toLowerCase() ? (
                        // --- Connected Seller View ---
                        <>
                            {/* Seller: Show End button ONLY if time ended AND not already finalized */}
                            <button
                                    onClick={async () => onEndAuctionClick(auction)}
                                    // Disable while transaction is pending if you add a state for that
                                    disabled={!isConnected || !account || !(auction.seller.toLowerCase() === account?.toLowerCase()) || auction.endTime*1000 > Date.now()}
                                    // style={{ marginRight: '10px' }} // Space between buttons if another one was here (not applicable for seller)
                                >
                                    {`End ${auction.isFixedPrice?"sale":"auction"}`}
                                </button>
                            {/* Seller doesn't see a Bid button for their own auction */}
                        </>
                    ) : (
                        // --- Connected Non-Seller View ---
                        <>
                             {/* Non-Seller: Show Bid button ONLY if time NOT ended AND not already finalized */}
                             {!hasAuctionEnded && !auction.ended && !auction.claimed ? (
                                 <button
                                     onClick={() => onBidClick(auction)}
                                     // Disable while modal is open or bid is submitting if needed
                                 >
                                     {auction.isFixedPrice?'Buy':'Bid'}
                                 </button>
                             ) : (
                                 // Non-Seller: Show status if time ended OR already finalized
                                  <span>
                                     {/* If time ended but status flags aren't set, show 'Ended' */}
                                     {auction.ended || auction.claimed ? (auction.claimed ? 'Claimed' : 'Ended') : 'Ended'}
                                 </span>
                             )}
                             {/* Non-seller doesn't see an End button */}
                        </>
                    )
                )}
                {/* <button onClick={async () => onEndAuctionClick(auction)}
                    // Disable if not connected, not the seller, auction not ended by time, or already ended/claimed
                    disabled={!isConnected || !account || auction.seller.toLowerCase() !== account.toLowerCase() || auction.endTime > Date.now() || auction.ended || auction.claimed}
                    style={{ marginRight: '10px' }}
                    >
                    {'End Auction'}
                </button> */}
                {/* <button
                    onClick={() => onBidClick(auction)} // Call the passed-in handler
                    disabled={!isConnected || !account || auction.seller.toLowerCase() === account?.toLowerCase() || hasAuctionEnded}
                >
                    {hasAuctionEnded ? 'Ended' : 'Bid'}
                </button> */}
            </div>
        </li>
    );
};

export default ActiveAuctionItem;