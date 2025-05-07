// scripts/setPokemonImageURIs.ts
import { ethers } from "hardhat";
import PokemonTestABI from "../ignition/deployments/chain-1337/artifacts/AuctionModule#PokemonTest.json";

async function main() {
  const [owner] = await ethers.getSigners();
  const contractPokemonAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with your contract address
  const pokemonContract = new ethers.Contract(contractPokemonAddress, PokemonTestABI.abi, owner);

  // Replace these with your actual IPFS URIs
  const pokemonImageMap: { [key: string]: string } = {
    "Pikachu": "ipfs://QmYLnjZpAQBRfogcNCRxBTSCisK7sn6NuxnymVEeq6eBgS",
    "Charizard": "ipfs://Qmd6TojxghMrFKXoCiKQ5Vx86HYWx9ahxwAEWv7WKnFJaz",
    "Bulbasaur": "ipfs://QmVfH5NhZs1SmfZ76TWEzZh1QofKWt9dzFX4ZgFzPi7j25",
    "Squirtle": "ipfs://QmSbFdBt7BS1iMmY8Cr4oN8vtc5UdyXZkVyMEc7XyokaHF",
    "Jigglypuff": "ipfs://QmctPhttVWh1qxfCeg47cCBaA9JjEZHt8QsmtYA3wymFLp",
    "Machop": "ipfs://QmYwZDPMhoTNoSyceTpxSRV14r7dynGCTjLzVFbqkiJoht",
    "Geodude": "ipfs://Qmb2k6zsVh7PVPApU27sZU5LpBs3Yj8X5epBwyzfKuNhuD",
    "Gengar": "ipfs://QmU5Q5VmYZws4mcz1wtk3rr72X8eKXS6sqf1cUGTjFajJP",
    "Dragonite": "ipfs://QmVi7bxk2geWS66xtDMrMeDx97gftWtM1QXHrdnzWNzLmP",
    "Eevee": "ipfs://QmNn6WnbjcPzQ8JG53AhE2CUNjwqXJFYhG4E1LxsdeYkqw",
    // Add all your Pokémon and their IPFS URIs
  };

  console.log("Setting Pokémon image URIs...");
  for (const name in pokemonImageMap) {
    const uri = pokemonImageMap[name];
    const tx = await pokemonContract.setPokemonImageURI(name, uri);
    await tx.wait();
    console.log(tx);
    console.log(`Set URI for ${name} to ${uri}`);
  }

  console.log("All Pokémon image URIs have been set.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });