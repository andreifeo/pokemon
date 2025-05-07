import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PokemonModule = buildModule("PokemonModule", (m) => {
  // Deploy the PokemonTest contract (no constructor args needed)
  const pokemon = m.contract("PokemonTest");

  return { pokemon };
});

export default PokemonModule;