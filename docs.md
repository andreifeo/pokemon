npm install --save react-router-dom -> in frontend
npm install --save-dev hardhat -> in pokemon
nvm install 20.18.0 / nvm use 20.18.0 if already installed
npx hardhat compile
npx hardhat node
new Terminal:
npx hardhat ignition deploy ignition/modules/AuctionModule.ts --network localhost --reset
npx hardhat run --network localhost scripts/setPokemonImageURIs.ts
in frontend: npm start

For testing:
install:
 npm install -D @openzeppelin/test-helpers
 npm install --save-dev @nomiclabs/hardhat-truffle5 @nomiclabs/hardhat-web3 'web3@^1.0.0-beta.36'