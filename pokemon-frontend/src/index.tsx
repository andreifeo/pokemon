import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Web3Provider } from './components/common/useWeb3';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
root.render(
  <React.StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </React.StrictMode>
);