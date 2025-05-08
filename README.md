# Welcome

This project demonstrates the minting of Pokemon cards as well as their trading.
# Set-up

To test the contracts, you may set up a localhost through the following instructions:

```shell
npm install --save react-router-dom
```

If you do not have hardhat installed yet, install it through:
```shell
npm install --save-dev hardhat -> in pokemon
```

As some later versions of Node are unsupported, it is useful to install a previous version which has been proven to work:
```shell
nvm install 20.18.0
```
Once it has been installed, the following command will suffice to switch Node version:
```shell
nvm use 20.18.0
```

Once the setup is done, call the following commands:
```shell
npx hardhat compile
npx hardhat node
```
The account numbers listed here (numbered #0 to #19) may be used as test accounts. They each hold 10000 ETH temporary (fake) ETH to use to mint pokemons or to trade them.

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


#Function Documentation




