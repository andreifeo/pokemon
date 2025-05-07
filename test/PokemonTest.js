import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("PokemonCards", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployPokemonCards() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const Pokemon = await hre.ethers.getContractFactory("PokemonTest");
    const pokemon = await Pokemon.deploy();

    return { pokemon, owner, otherAccount };
  }

  describe("Create", function () {

    it("Should return the right name and symbol", async function () {
      const [owner, otherAccount] = await hre.ethers.getSigners();
      const Pokemon = await hre.ethers.getContractFactory("PokemonTest");
      const pokemon = await Pokemon.deploy();
  
      await pokemon.mint(owner);
      expect(await pokemon.name()).to.equal("Pikachu");
    });

  });

});