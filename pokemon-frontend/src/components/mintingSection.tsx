import React from 'react';
import { useWeb3 } from './common/useWeb3';

interface MintingSectionProps {
}

const MintingSection: React.FC<MintingSectionProps> = () => {
  const { account, isConnected, mintNFT } = useWeb3();

  console.log("MintingSection render check: isConnected =", isConnected, ", account =", account);

  const [isMinting, setIsMinting] = React.useState(false);

  const handleMintClick = async () => {
    if (!mintNFT || !account) {
      console.error("Wallet not connected or mint function not available.");
      return;
    }
    setIsMinting(true);
    try {
      const newNFT = await mintNFT();
      alert(`Successfully minted NFT: ${newNFT.name} (ID: ${newNFT.id})`);
    } catch (error) {
      console.error("Minting failed:", error);
      alert("Failed to mint NFT.");
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
      <h3>1. NFT Minting</h3>
      {isConnected && account ? (
        <button onClick={handleMintClick} disabled={isMinting}>
          {isMinting ? 'Minting...' : 'Mint Pokemon NFT'}
        </button>
      ) : (
        <p>Connect your wallet to mint NFTs.</p>
      )}
    </div>
  );
};

export default MintingSection;