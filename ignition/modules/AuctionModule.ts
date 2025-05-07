import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AuctionModule = buildModule("AuctionModule", (m) => {
  const pokemonTest = m.contract("PokemonTest");
  const auctionManager = m.contract("AuctionManager", [pokemonTest]);

  return { pokemonTest, auctionManager };
});

export default AuctionModule;
