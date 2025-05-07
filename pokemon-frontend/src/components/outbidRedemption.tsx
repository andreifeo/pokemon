import React, { useState } from 'react';
import { useWeb3 } from './common/useWeb3';

interface OutbidRedemptionProps {
  // No specific props needed here, uses useWeb3 hook
}

const OutbidRedemption: React.FC<OutbidRedemptionProps> = () => {
  const { account, isConnected, claimOutbidFunds } = useWeb3();
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaimClick = async () => {
    if (!claimOutbidFunds || !account) {
       alert("Connect your wallet to claim funds.");
       return;
    }
     // Add confirmation if needed
     if (window.confirm("Are you sure you want to claim your outbid funds?")) {
        setIsClaiming(true);
        try {
            //////////////// await claimOutbidFunds();    TODO look over this
            alert("Outbid funds claimed successfully (simulated). Check your wallet balance.");
            // In a real app, you might show the amount claimed or update a balance display
        } catch (error) {
            console.error("Failed to claim funds:", error);
            alert("Failed to claim funds.");
        } finally {
            setIsClaiming(false);
        }
     }
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: '15px' }}>
      <h4>2.3. Outbid Funds Redemption</h4>
       {isConnected && account ? (
         <button onClick={handleClaimClick} disabled={isClaiming}>
            {isClaiming ? 'Claiming...' : 'Claim Outbid Funds'}
         </button>
       ) : (
           <p>Connect your wallet to claim funds.</p>
       )}
    </div>
  );
};

export default OutbidRedemption;