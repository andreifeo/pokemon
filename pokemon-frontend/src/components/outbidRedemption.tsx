import React, { useState } from 'react';
import { useWeb3 } from './common/useWeb3';

interface OutbidRedemptionProps {
}

const OutbidRedemption: React.FC<OutbidRedemptionProps> = () => {
  const { account, isConnected, claimAllOutbidFunds } = useWeb3();
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaimClick = async () => {
    if (!claimAllOutbidFunds || !account) {
       alert("Connect your wallet to claim funds.");
       return;
    }
     if (window.confirm("Are you sure you want to claim your outbid funds?")) {
        setIsClaiming(true);
        try {
            await claimAllOutbidFunds();
            alert("Outbid funds claimed successfully. Check your wallet balance.");
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