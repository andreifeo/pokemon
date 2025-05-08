**Set-up**

This project demonstrates the minting of Pokemon cards as well as their trading. This can be tested on a localhost through the following instructions:

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
