import React, { useState, useEffect } from 'react';
import { Auction } from './common/types';
import {ethers} from 'ethers'
import { transformValueTypes } from 'framer-motion';
interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: Auction | null; // The auction being bid on
  onPlaceBid: (auctionId: number, bidAmount: bigint) => Promise<void>;
}

const BidModal: React.FC<BidModalProps> = ({ isOpen, onClose, auction, onPlaceBid }) => {
  const [bidAmount, setBidAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set minimum bid when modal opens
  useEffect(() => {
    if (isOpen && auction) {
      try{
        const currentBidWei=auction.currentBid as unknown as bigint;

        const minIncrementWei="0.001";
        console.log(currentBidWei);
        console.log(minIncrementWei);
        const minNextBidWei=currentBidWei+ethers.parseEther(minIncrementWei);
        console.log(minNextBidWei);
        const minNextBidEthString = ethers.formatEther(minNextBidWei)
        console.log(minNextBidEthString);

        // try{
        //   const minIncrementWei=ethers.parseEther("0.001");
        //   const minBidWei=auction.currentBid+minIncrementWei;
        // }
        // Minimum bid is current bid + a small increment (e.g., 0.001 ETH)
        // In a real app, this increment might be defined by the contract or UI rules
        // const minBid = auction.currentBid + 0.001; // Example increment
        setBidAmount(minNextBidEthString);
      }catch(error){
        console.error("Error calculating initial min bid:", error);
        setBidAmount(''); // Fallback on error
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
    //   // Simple validation: bid must be higher than current bid + increment
    //   const minValidBid = auction.currentBid + 0.0009; // Check against slightly less than UI min
    //   if (bidAmount <= auction.currentBid || bidAmount < minValidBid) {
    //     alert(`Bid must be higher than the current bid (${auction.currentBid} ETH). Minimum bid: ${auction.currentBid + 0.001} ETH`);
    //     return;
    //   }
    //    if (bidAmount <= 0) {
    //        alert("Bid amount must be positive.");
    //        return;
    //    }


    // setIsSubmitting(true);
    // await onPlaceBid(auction.id, bidAmount);
    // // onPlaceBid will handle closing the modal and showing alerts
    // setIsSubmitting(false); // Should ideally be handled after await in parent or here on error
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
    //   // Simple validation: bid must be higher than current bid + increment
    //   const minValidBid = auction.currentBid + 0.0009; // Check against slightly less than UI min
    //   if (bidAmount <= auction.currentBid || bidAmount < minValidBid) {
    //     alert(`Bid must be higher than the current bid (${auction.currentBid} ETH). Minimum bid: ${auction.currentBid + 0.001} ETH`);
    //     return;
    //   }
    //    if (bidAmount <= 0) {
    //        alert("Bid amount must be positive.");
    //        return;
    //    }


    // setIsSubmitting(true);
    // await onPlaceBid(auction.id, bidAmount);
    // // onPlaceBid will handle closing the modal and showing alerts
    // setIsSubmitting(false); // Should ideally be handled after await in parent or here on error
  };
  const handleBuy=async()=>{
    console.log("popel");
    console.log(auction.startingBid);
    console.log((auction.startingBid).toString());
    setBidAmount((auction.startingBid).toString());
    console.log(bidAmount);
    handleSubmitBuy(ethers.formatEther(auction.startingBid.toString()).toString());
  }
  const bidAmountWeiForComparison = bidAmount ? (() => {
      try {
        return ethers.parseEther(bidAmount);
      } catch {
        return 0n; // Return 0n for invalid input string
      }
  })() : 0n;

  let minInputEth = "0.001"; // Default minimum if current bid is 0
if (auction.currentBid > 0) { // Check if current bid is greater than BigInt 0
    try {
         const minIncrementWei = "0.001"; // Convert increment to BigInt Wei
         const minNextBidWei = (auction.currentBid as unknown as bigint ) + ethers.parseEther(minIncrementWei); // Valid BigInt + BigInt addition
         minInputEth = ethers.formatEther(minNextBidWei); // Format the BigInt result to a string in ETH
    } catch (error) {
        console.error("Error calculating min input value:", error);
         minInputEth = "0"; // Fallback
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
      {/* <div style={{ marginTop: '15px' }}>
        <label>Your Bid (ETH):</label>
        <input
          type="number"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
           min={minInputEth} // Suggest minimum bid
          step="0.001"
          disabled={isSubmitting}
        />
      </div> */}
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
        <p>Current Highest Bid: {auction.currentBid} WEI</p>
        <div style={{ marginTop: '15px' }}>
          <label>Your Bid (ETH):</label>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
             min={minInputEth} // Suggest minimum bid
            step="0.001"
            disabled={isSubmitting}
          />
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={isSubmitting} style={{ marginRight: '10px' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isSubmitting || bidAmountWeiForComparison <= auction.currentBid}> {/* Disable if bid not higher */}
            {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
          </button>
        </div>
      </div>
      }
      
    </div>
  );
};

export default BidModal;


/*
1000000000000000n
1000000000000000000n
1000000000000000000

10000000000000000n
1000000000000000000n
*/