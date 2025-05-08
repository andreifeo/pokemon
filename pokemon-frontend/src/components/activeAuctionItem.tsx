import React, { useState, useEffect } from 'react';
import { Auction } from './common/types'; 
import { ethers } from 'ethers';

const formatTimeLeft = (endTime: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTime - now;

    if (remaining <= 0) return "Ended";

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
};

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
    account: string | null;
    isConnected: boolean; 
    onBidClick: (auction: Auction) => void; 
    onEndAuctionClick:(auction:Auction)=>void;
}

const ActiveAuctionItem: React.FC<ActiveAuctionItemProps> = ({
    auction,
    account,
    isConnected,
    onBidClick,
    onEndAuctionClick
}) => {
    const [timeLeftString, setTimeLeftString] = useState('');

    useEffect(() => {
        if (!auction || auction.endTime === undefined) {
            setTimeLeftString('Loading...');
            return;
        }

        let intervalId: NodeJS.Timeout;

        const updateCountdown = () => {
            const remainingTime = formatTimeLeft(auction.endTime);
            setTimeLeftString(remainingTime);
            if (remainingTime === "Ended") {
                clearInterval(intervalId); 
            }
        };

        updateCountdown();
        intervalId = setInterval(updateCountdown, 1000);

        return () => clearInterval(intervalId);

    }, [auction.endTime]);

    const hasAuctionEnded=auction.ended;
    return (
        <li style={{ border: '1px solid #eee', margin: '10px 0', padding: '10px', display: 'flex', alignItems: 'center' }}>
            <img src={auction.nft.imageUrl} alt={auction.nft.name} style={{ width: '50px', height: '50px', marginRight: '15px' }} />
            <div>
                <strong>{auction.nft.name}</strong>                
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
                <br />
                Time Left: {timeLeftString}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                {!isConnected||!account?(<></>):(
                    auction.seller.toLowerCase() === account.toLowerCase() ? (
                        <>
                            {/* Seller: Show End button ONLY if time ended AND not already finalized */}
                            <button
                                    onClick={async () => onEndAuctionClick(auction)}
                                    disabled={!isConnected || !account || !(auction.seller.toLowerCase() === account?.toLowerCase()) || auction.endTime*1000 > Date.now()}
                                >
                                    {`End ${auction.isFixedPrice?"sale":"auction"}`}
                                </button>
                        </>
                    ) : (
                        <>
                             {/* Non-Seller: Show Bid button ONLY if time NOT ended AND not already finalized */}
                             {!hasAuctionEnded && !auction.ended && !auction.claimed ? (
                                 <button
                                     onClick={() => onBidClick(auction)}
                                 >
                                     {auction.isFixedPrice?'Buy':'Bid'}
                                 </button>
                             ) : (
                                 // Non-Seller: Show status if time ended OR already finalized
                                  <span>
                                     {auction.ended || auction.claimed ? (auction.claimed ? 'Claimed' : 'Ended') : 'Ended'}
                                 </span>
                             )}
                        </>
                    )
                )}
            </div>
        </li>
    );
};

export default ActiveAuctionItem;