# Welcome
This project was brought to you by 
- Andrei Feodorov (22-949-002) who wrote the contracts and made the frontend 
- Amelie Rüfenach (22-938-492) who wrote the documentation and made the test cases


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
```
Write yes/y to the two prompts asking for confirmation about the local network to be used. Call
```shell
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

In the frontend we have all the files inside the folder _`pokemon-frontend`_. The main code of the frontend is inside the folder _`src/components`_. Outside of it are mostly automatically intitialized files in order to have a functioning environment.

### activeAuctionItem.tsx
This is the file responsible for the individual auctions. 
`formatTimeLeft`: This formats the time left for the listing in hours, minutes and seconds. 
`truncateToFourDecimals`: used for making sure that the current highest bid, when showed, is legible
`ActiveAuctionItem`: This is the main function of this file. It first checks whether we have all the necessary data to continue with the listing. Then, it continuously counts down the remainding time for the listing and displays it. Finally, it shows two different buttons depending on whether the connected wallet is the owner of the auctioned NFT is: either "Bid" or "End Auction", the latter which can only be selected after the time runs out, the former until just before the time runs out. In either case, once selected, a handler is sent back to the "parent" file, _`activeAuctions.tsx`_.


### activeAuctions.tsx
In the first part of the file, in addition to the usual imports present in the file, the function `ActiveAuctions` loads necessary handlers from _`useWeb3.tsx`_. 
In the next part of the code these are then used to call the contract functions when necessary, such as when `handleBidClick` is returned after clicking on the `Bid` button described in `ActiveAuctionItem`.
In the return function is the basic framework of the visible website. It is also where the two dependent functions `ActiveAuctionItem` in _`activeAuctionItems.tsx`_ and `BidModal` in _`bidModal.tsx`_ are called.


### bidModal.tsx
This file handles the bidding for the auctions. How much the default starting bid is, the minimum increase.
_`handleSubmit`_: Once someone submits their bid, this tests whether the bid is correct and sufficient. Then, it places the bid, returning the alert "Failed to place the bid. See console for details." in case it fails.
Similarly to _`activeAuctionItem.tsx`_, in the return function the buttons are specified with dedicated handlers called in case of an action (the button being clicked). 


### useWeb3.tsx
Aside from the two all-important contract files, the file with perhaps the most important binding role.
Mostly it consists of the same functions as are present in the Solidity contracts, implemented out.
`minNFT`: called by _`mintingSection.tsx`_, this function, as its name tells us, allows the minting of NFTs. Specifically, of Pokemons. It calls the Solidity contract minting function, checks for errors and transfers the newly minted Pokemon to the correct account.
`placeBid`: called inside _`bidModal.tsx`_, this checks whether the bid is allowed before mining the transaction.
At the end of this long list of functions are the commands that tie the connected wallet to the program as Signer with Contracts. These are then also tied to the above functions.


### PokemonTest.sol
For the minting of pokemon cards we chose to randomly choose their names, as well as their rarity. We also implemented the openzeppelin ERC721 standard and in addition to a mint function, a burn function as well. Keeping in mind that only the owner is authorized to burn their pokemon cards.



## Sources
Amongst multiple open-source resources such as Hardhat and @openzeppelin, we also used Gemini, especially to generate tests.
From @openzeppelin we for example made use of their ERC721 template or anywhere else as can be seen by the imports.
