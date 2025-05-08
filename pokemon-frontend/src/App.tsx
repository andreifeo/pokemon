import React from 'react';
import MintingSection from './components/mintingSection';
import AuctionSection from './components/auctionSection';
import { useWeb3 } from './components/common/useWeb3';

function App() {
    const { isConnected, connectWallet, account } = useWeb3(); 

  return (
    <div className="App" style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Pokemon NFT Marketplace</h1>

       {!isConnected && (
           <div style={{ textAlign: 'center', marginBottom: '20px' }}>
               <p>Connect your wallet to get started.</p>
               <button onClick={connectWallet}>Connect Wallet</button>
           </div>
       )}

        {isConnected && account && (
             <p style={{ textAlign: 'center' }}>Connected Account: <code>{account}</code></p>
        )}
      <MintingSection />
      <AuctionSection />
    </div>
  );
}

export default App;