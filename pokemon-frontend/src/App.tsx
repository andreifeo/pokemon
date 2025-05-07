import React from 'react';
import MintingSection from './components/mintingSection';
import AuctionSection from './components/auctionSection';
import { useWeb3 } from './components/common/useWeb3'; // Import the simulated hook

function App() {
    const { isConnected, connectWallet, account } = useWeb3(); // Use the simulated hook

  return (
    <div className="App" style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Pokemon NFT Marketplace</h1>

       {!isConnected && (
           <div style={{ textAlign: 'center', marginBottom: '20px' }}>
               <p>Connect your wallet to get started.</p>
               <button onClick={connectWallet}>Connect Wallet (Simulated)</button>
           </div>
       )}

        {isConnected && account && (
             <p style={{ textAlign: 'center' }}>Connected Account: <code>{account}</code></p>
        )}


      <MintingSection />
      <AuctionSection />

        <p style={{ marginTop: '40px', fontSize: '0.8em', color: '#666', textAlign: 'center' }}>
            *This is a simulated application for demonstration purposes. Actual blockchain interactions,
            gas fees, network delays, and error handling are not fully implemented.*
        </p>
    </div>
  );
}

export default App;