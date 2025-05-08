# Welcome

This project demonstrates the minting of Pokemon cards as well as their trading. In the following documentation we will lead you through the set-up and then a more detailed explanation of how the project is structured.
1. [Set-up](#set-up)
2. [Function Documentation](#function-documentation)
   
## Set-up
First download all the files and open them. Then, to test the contracts, you can run the program through the following:

```shell
npm install --save react-router-dom
```

If you do not have hardhat installed yet, install it through:
```shell
npm install --save-dev hardhat
```

As some later versions of Node are unsupported, it is useful to install a previous version which has been proven to work:
```shell
nvm install 20.18.0
```
Once it has been installed, the following command will suffice to switch Node version:
```shell
nvm use 20.18.0
```

In order to test the minting and trading functionalities, we connect to the Hardhat development network:
```shell
npx hardhat compile
npx hardhat node
```
The account numbers listed here (numbered #0 to #19) may be used as test accounts. They each hold 10000 ETH temporary (fake) ETH to use in order to mint pokemons or to trade them.

In a new terminal, call
```shell
npx hardhat ignition deploy ignition/modules/AuctionModule.ts --network localhost --reset
npx hardhat run --network localhost scripts/setPokemonImageURIs.ts
```

Then finally:
```shell
cd pokemon-frontend
npm start
```

Next, a webpage will open automatically, where you will be asked to first connect your MetaMask wallet. If you do not have one, please install the extension [here](https://microsoftedge.microsoft.com/addons/detail/metamask/ejbalbakoplchlghecdalmeeeajnimhm) for the Microsoft Edge Extension and [here](https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn) for the Google Chrome Extension.
The next step is to add the custom test network:
1. In the wallet, click the upper left corner to select a network
2. Enable "Show test network". Select "Add a custom network".
3. Choose a network name (f.ex. Hardhat Test Network).
4. Add the RPC URL http://127.0.0:8545.
5. Add the Chain ID 1337.
6. Choose currency symbol ETH.
7. Save the network and then select it. You will be able to connect your MetaMask wallet now. Reload the page otherwise.


## Function Documentation
Broadly speaking, the program consists of, on the backend, the contracts _`AuctionManager.sol`_ and _`PokemonTest.sol`_ in the contracts folder with their corresponding ignition modules _`AuctionModule.ts`_ and _`PokemonModule`_ in order to deploy the contracts. On the frontend (contained in the file pokemon-frontend), we use web3 in order to interact with the contracts. Inside _`pokemon-frontend/src/components/common/useWeb3.tsx`_ is all the program that connects the frontend webpage with the backend contracts.



