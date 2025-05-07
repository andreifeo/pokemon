// import {
//   time,
//   loadFixture,
// } from "@nomicfoundation/hardhat-toolbox/network-helpers";
// import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
// import { expect } from "chai";
// import hre from "hardhat";

// describe("Auction", function () {
//   // We define a fixture to reuse the same setup in every test.
//   // We use loadFixture to run this setup once, snapshot that state,
//   // and reset Hardhat Network to that snapshot in every test.
//   async function deployPokemonCards() {
//     // Contracts are deployed using the first signer/account by default
//     const [owner, otherAccount] = await hre.ethers.getSigners();

//     const Pokemon = await hre.ethers.getContractFactory("PokemonTest");
//     const pokemon = await Pokemon.deploy();

//     const Auction = await hre.ethers.getContractFactory("AuctionManager");
//     const auction = await Auction.deploy(pokemon.getAddress());

//     return { pokemon, auction, owner, otherAccount };
//   }

//   describe("Create", function () {

//     it("Should change ownership pokemon card", async function () {
//       const { pokemon, auction, owner } = await loadFixture(deployPokemonCards);
//       const biddingTime = 1;
//       const startingBid = 1;
//       const pokemonId = await pokemon.mint(owner);

//       await auction.create(1, 1, pokemonId);
      
//       expect(await pokemon.isOwner(owner, pokemonId));
//     });

//   });

// });