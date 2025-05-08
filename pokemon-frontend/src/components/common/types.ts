// Represents the structure of a Pokemon NFT
export interface PokemonNFT {
    id: number; // Token ID
    name: string;
    imageUrl: string;
    type: string; // e.g., "Fire", "Water"
    rarity:string
    // Add other relevant attributes
  }
  
  // Represents an active auction
  export interface Auction {
    id: number; // Unique auction ID
    nft: PokemonNFT; // The id of the NFT being auctioned
    seller: string; // Seller's address
    currentBid: number; // Current highest bid amount (in a suitable currency unit, e.g., Ether)
    highestBidder: string | null; // Address of the highest bidder
    endTime: number; // Unix timestamp
    startingBid: number;
    ended:boolean; // Even if the auction end time has passed, the seller must still end the auction
    claimed:boolean; // Determined if the NFT has been claimed or not
    isFixedPrice:boolean;
  }
