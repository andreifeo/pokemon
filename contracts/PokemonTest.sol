// contracts/PokemonTest.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";



import "hardhat/console.sol";


contract PokemonTest is ERC721, Ownable,ERC721Enumerable{




   uint256 private nextTokenId=1;
   uint256 private totalPokemonProbability;
   uint256 private totalRarityProbability;
   mapping(uint256 =>Pokemon) private pokemonData;

   mapping(string => string) private _pokemonImageURIs;
   struct PokemonGeneration{
       string name;
       string pokemonType;
       uint256 probability;
   }
   struct Pokemon{
       string name;
       string pokemonType;
       uint256 hp;
       string rarity;
   }
   struct Rarity{
       string rarity;
       uint256 probability;
   }
   PokemonGeneration[10] public possiblePokemon=[
       PokemonGeneration("Pikachu","Electric",10),
       PokemonGeneration("Charizard", "Fire", 10),
       PokemonGeneration("Bulbasaur", "Grass",10),
       PokemonGeneration("Squirtle", "Water", 10),
       PokemonGeneration("Jigglypuff", "Normal",10),
       PokemonGeneration("Machop", "Fighting", 10),
       PokemonGeneration("Geodude", "Rock", 10),
       PokemonGeneration("Gengar", "Ghost", 10),
       PokemonGeneration("Dragonite", "Dragon",10),
       PokemonGeneration("Eevee", "Normal", 10)
   ];
   Rarity [8]public possibleRarities=[
       Rarity("Common",200),
       Rarity("Uncommon",100),
       Rarity("Rare",50),
       Rarity("Double Rare",25),
       Rarity("Ultra Rare",15),
       Rarity("Illustration Rare",6),
       Rarity("Special Illustration Rare",3),
       Rarity("Hyper Rare",1)
   ];
   uint256[]public partialProbability;
    
   constructor()ERC721("PokemonTest","PKMN") Ownable(msg.sender){
       uint256 total=0;
       for(uint256 i=0;i<possiblePokemon.length;i++){
           total+=possiblePokemon[i].probability;
       }
       totalPokemonProbability=total;


       total=0;
       for(uint256 i=0;i<possibleRarities.length;i++){
           total+=possibleRarities[i].probability;
       }
       totalRarityProbability=total;
   }


   function _generateRandomNumber() internal view returns (uint256) {
       return uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, nextTokenId)));
   }
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
      return super.supportsInterface(interfaceId);
    }
    
    function _update(
      address to,
      uint256 tokenId,
      address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
      return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
      super._increaseBalance(account, value);
    }
    function tokenURI(uint256 tokenId) public view override returns(string memory){
        require(_ownerOf(tokenId)!=address(0), "Token ID does not exist.");
        Pokemon memory pokemon = pokemonData[tokenId];
        string memory name = pokemon.name;
        string memory pokemonType = pokemon.pokemonType;
        string memory rarity = pokemon.rarity;
        string memory imageURI=_getPokemonImageURI(name);
        string memory json = string(abi.encodePacked(
            '{"name": "', name, '",',
            '"image":"',imageURI,'",',
            '"attributes": [{"trait_type": "Type", "value": "', pokemonType, '"},',
            '{"trait_type": "Rarity", "value": "', rarity, '"}',
            ']}'
        ));
        string memory base64EncodedJson=Base64.encode(bytes(json));
        console.log(json);
        console.log(base64EncodedJson);

        return string(abi.encodePacked('data:application/json;base64,', base64EncodedJson));
    }

    function setPokemonImageURI(string memory pokemonName, string memory uri) public onlyOwner {
        console.log("setting pokemon uri");
        _pokemonImageURIs[pokemonName] = uri;
        console.log("setting pokemon uri");
        console.log("URI for ",pokemonName," has been set to ",uri);
    }

    function _getPokemonImageURI(string memory pokemonName) internal view returns (string memory) {
        console.log("getting the pokemon image uri");
        console.log(pokemonName);
        console.log(_pokemonImageURIs[pokemonName]);
        return _pokemonImageURIs[pokemonName];
    }
   function mint(address to) public returns (uint256){
       uint256 tokenId=nextTokenId++;
       uint256 random=(_generateRandomNumber()%totalPokemonProbability)+1;
       string memory selectedName;
       string memory selectedType;
       string memory selectedRarity;
       uint256 currentProbability=0;
    //    console.log(random);
    //    console.log("primul");
       for (uint256 i = 0; i < possiblePokemon.length; i++) {
           currentProbability+=possiblePokemon[i].probability;
            console.log(currentProbability);
           if (random <= currentProbability) {
               selectedName = possiblePokemon[i].name;
               selectedType = possiblePokemon[i].pokemonType;
               break;
           }
       }
        // console.log("second");
       random=(_generateRandomNumber()%totalRarityProbability)+1;
       currentProbability=0;
       for (uint256 i = 0; i < possibleRarities.length; i++) {
           currentProbability+=possibleRarities[i].probability;
           if (random <= currentProbability) {
               selectedRarity = possibleRarities[i].rarity;
               break;
           }
       }
    //    console.log("MUREL");
    //    console.log(selectedName);
    //    console.log(selectedType);
    //     console.log(selectedRarity);

    //    console.log("IONEL");
       pokemonData[tokenId]=Pokemon(selectedName,selectedType,10,selectedRarity);
    //    console.log("IONE2");
    //    pokemonData[tokenId]=Pokemon("Pikachu","testDamage",10,"Ultra mega rare");


       _safeMint(to,tokenId);
    //    console.log("IONEL3");
       return tokenId;
   }
   function isOwner(address potentialOwner,uint256 pokemonId) public view returns(bool){
       return _ownerOf(pokemonId) == potentialOwner;
   }
   function getPokemonData(uint256 tokenId) public view returns(Pokemon memory){
       require (_ownerOf(tokenId)!=address(0),"Pokemon does not exist");
       return pokemonData[tokenId];
   }
   function burn(uint256 tokenId) public{
       require(ownerOf(tokenId)==msg.sender,"Only owner can burn!!");
       _burn(tokenId);
       delete pokemonData[tokenId];
   }
}
