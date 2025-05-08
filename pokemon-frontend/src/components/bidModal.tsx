import React, { useState, useEffect } from 'react';
import { Auction } from './common/types';
import {ethers} from 'ethers'
import { transformValueTypes } from 'framer-motion';
interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: Auction | null;
  onPlaceBid: (auctionId: number, bidAmount: bigint) => Promise<void>;
}

const BidModal: React.FC<BidModalProps> = ({ isOpen, onClose, auction, onPlaceBid }) => {
  const [bidAmount, setBidAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && auction) {
      try{
        const currentBidWei=auction.currentBid as unknown as bigint;

        const minIncrementWei="0.001";
        const minNextBidWei=currentBidWei+ethers.parseEther(minIncrementWei);
        const minNextBidEthString = ethers.formatEther(minNextBidWei)

        setBidAmount(minNextBidEthString);
      }catch(error){
        console.error("Error calculating initial min bid:", error);
        setBidAmount('');
      }
    }else{
      setBidAmount('0');
    }
     setIsSubmitting(false);
  }, [isOpen, auction]);

  if (!isOpen || !auction) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const currentBidWei=auction.currentBid as unknown as bigint;
    let bidAmountWei:bigint;
    try{
      bidAmountWei=ethers.parseEther(bidAmount||'0');
      if(bidAmountWei<=0n){
        
        alert("Bid amount must be positive");
        setIsSubmitting(false);
        return;
      }
    }catch(error){
      console.error("Invalid bid amount input:", error);
      alert("Please enter a valid number for the bid amount.");
      setIsSubmitting(false);
      return;
    }

    const minIncrementEth="0.001";  
    const minIncrementWei = ethers.parseEther(minIncrementEth);
    const minNextBidWei = currentBidWei + minIncrementWei;

    if(bidAmountWei<=currentBidWei){
      alert(`Bid (${ethers.formatEther(bidAmountWei)} ETH) must be strictly higher than the current bid (${ethers.formatEther(currentBidWei)} ETH).`);
      setIsSubmitting(false);
      return;
    }
    if (bidAmountWei < minNextBidWei) {
      alert(`Bid (${ethers.formatEther(bidAmountWei)} ETH) must be at least ${ethers.formatEther(minNextBidWei)} ETH (Current + ${minIncrementEth} ETH).`);
      setIsSubmitting(false);
      return;
    }

    try{
      await onPlaceBid(auction.id,bidAmountWei);
      setIsSubmitting(false); 
    }catch(error){
      console.error("Error placing bid:", error);
      alert("Failed to place bid. See console for details.");
      setIsSubmitting(false); 
    }
  };
  const handleSubmitBuy = async (buyPrice:string) => {
    setIsSubmitting(true);

    const currentBidWei=auction.currentBid as unknown as bigint;
    let bidAmountWei:bigint;
    try{
      bidAmountWei=ethers.parseEther(buyPrice||'0');
      if(bidAmountWei<=0n){
        
        alert("Bid amount must be positive");
        setIsSubmitting(false);
        return;
      }
    }catch(error){
      console.error("Invalid bid amount input:", error);
      alert("Please enter a valid number for the bid amount.");
      setIsSubmitting(false);
      return;
    }

    const minIncrementEth="0.001";  
    const minIncrementWei = ethers.parseEther(minIncrementEth);
    const minNextBidWei = currentBidWei + minIncrementWei;

    if(bidAmountWei<=currentBidWei){
      alert(`Bid (${ethers.formatEther(bidAmountWei)} ETH) must be strictly higher than the current bid (${ethers.formatEther(currentBidWei)} ETH).`);
      setIsSubmitting(false);
      return;
    }
    if (bidAmountWei < minNextBidWei) {
      alert(`Bid (${ethers.formatEther(bidAmountWei)} ETH) must be at least ${ethers.formatEther(minNextBidWei)} ETH (Current + ${minIncrementEth} ETH).`);
      setIsSubmitting(false);
      return;
    }

    try{
      await onPlaceBid(auction.id,bidAmountWei);
      setIsSubmitting(false); 
    }catch(error){
      console.error("Error placing bid:", error);
      alert("Failed to place bid. See console for details.");
      setIsSubmitting(false); 
    }
  };
  const handleBuy=async()=>{
    setBidAmount((auction.startingBid).toString());
    handleSubmitBuy(ethers.formatEther(auction.startingBid.toString()).toString());
  }
  const bidAmountWeiForComparison = bidAmount ? (() => {
      try {
        return ethers.parseEther(bidAmount);
      } catch {
        return 0n;
      }
  })() : 0n;

  let minInputEth = "0.001";
if (auction.currentBid > 0) { 
    try {
         const minIncrementWei = "0.001"; 
         const minNextBidWei = (auction.currentBid as unknown as bigint ) + ethers.parseEther(minIncrementWei); 
         minInputEth = ethers.formatEther(minNextBidWei);
    } catch (error) {
        console.error("Error calculating min input value:", error);
         minInputEth = "0"; 
    }
}
  return (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 100
    }}>
      {auction.isFixedPrice?
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', minWidth: '300px' }}>
      <h4>Buy NFT</h4>
      <p>Sale for: <strong>{auction.nft.name}</strong></p>
      <p>Buying Price: {auction.startingBid} WEI</p>
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onClose} disabled={isSubmitting} style={{ marginRight: '10px' }}>Cancel</button>
        <button onClick={handleBuy} disabled={isSubmitting || bidAmountWeiForComparison <= auction.currentBid}> {/* Disable if bid not higher */}
          {isSubmitting ? 'Buying...' : 'Buy'}
        </button>
      </div>
    </div>
      :
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', minWidth: '300px' }}>
        <h4>Place Bid</h4>
        <p>Auction for: <strong>{auction.nft.name}</strong></p>
        {auction.highestBidder!=="0x0000000000000000000000000000000000000000"?
        <p>Current Highest Bid: {auction.currentBid} WEI</p>
        :
        <p>Starting Bid: {auction.startingBid} WEI</p>}
        <div style={{ marginTop: '15px' }}>
          <label>Your Bid (ETH):</label>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
             min={minInputEth}
            step="0.001"
            disabled={isSubmitting}
          />
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={isSubmitting} style={{ marginRight: '10px' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isSubmitting || bidAmountWeiForComparison <= auction.currentBid|| bidAmountWeiForComparison<auction.startingBid}> {/* Disable if bid not higher */}
            {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
          </button>
        </div>
      </div>
      }
      
    </div>
  );
};

export default BidModal;