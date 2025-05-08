import { ethers } from 'ethers';
import { createContext, ReactNode, useContext, useEffect, useState ,useCallback} from 'react';
import PokemonTestABI from '../../PokemonTestABI.json';
import AuctionABI from '../../AuctionABI.json';
import { Auction, PokemonNFT } from './types';

const contractAddressPokemon = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const contractAddressAuction = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

async function mintNFT(account: string, pokemonContract: ethers.Contract | null): Promise<PokemonNFT> {


   if (!pokemonContract || !account) throw Error("Pokemon contract not activated or account not logged in");
   let newNFT: PokemonNFT | null = null;
   try {
       const tx = await (pokemonContract.mint(account,{gasLimit:3000000}));
       const receipt = await tx.wait();
       alert("Pokemon minted successfully!");
       const contractInterface = pokemonContract.interface;
       let mintedTokenId = null;
       console.log(receipt.logs);
       for (const log of receipt.logs) {
           try {
               const parsedLog = contractInterface.parseLog(log);

               if (parsedLog && parsedLog.name === "Transfer") {
                   const from = parsedLog.args[0];
                   const to = parsedLog.args[1];
                   const tokenId = parsedLog.args[2]; // Token ID is the third argument in Transfer event


                   if (to.toLowerCase() === account.toLowerCase()) {
                       mintedTokenId = tokenId;
                       console.log("Found Transfer event!");
                       console.log("From (should be zero address for mint):", from);
                       console.log("To:", to);
                       console.log("Minted Token ID:", tokenId.toString());
                       break; 
                   }
               }
           } catch (e) {}
       }
       if (mintedTokenId !== null) {
           const tokenURI = await pokemonContract.tokenURI(mintedTokenId);
           const base64Prefix = "data:application/json;base64,";
           if (!tokenURI.startsWith(base64Prefix)) {
               console.error("Token URI is not a base64 data URI. It might be an external URL (http/ipfs) or an invalid format.");
           } else {
               const base64String = tokenURI.replace(base64Prefix, "");
               let jsonString;
               if (typeof window === 'undefined') {
                   jsonString = Buffer.from(base64String, 'base64').toString('utf-8');
               } else {
                   jsonString = atob(base64String);
               }
               let metadata;
               metadata = JSON.parse(jsonString);
               newNFT = {
                   id: mintedTokenId,
                   name: metadata.name,
                   imageUrl: metadata.image,
                   type: metadata.attributes[0].type,
                   rarity: metadata.attributes[0].rarity
               };
           }
       } else {
       }
   } catch (error) {
       console.error("Minting failed:", error);
       alert("Minting failed.");
       throw Error("Minting failed");
   }
   if (newNFT == null) {
       console.error("Minting succeeded, but we couldn't retrieve the NFT");
       throw Error("Minting succeeded, but we couldn't retrieve the NFT");
   }
   console.log("NFT minted:", newNFT);
   return newNFT;
}

async function getOwnedNFTs(account: string, pokemonContract: ethers.Contract | null): Promise<PokemonNFT[]> {
   if (!pokemonContract || !account) {
       console.log("Account not logged in");
       throw Error("Account not logged in.");
   }
   try {
       const balance = await pokemonContract.balanceOf(account);
       console.log(`Account ${account} owns ${balance} tokens.`);
       if (balance === 0) {
           console.log("No NFTs in this account");
           return [];
       }
       const ownedTokenIds = [];
       for (let i = 0; i < balance; i++) {
           try {
               const tokenId = await pokemonContract.tokenOfOwnerByIndex(account, i);
               ownedTokenIds.push(tokenId.toString()); 
           } catch (e) {
               console.error(`Error fetching token at index ${i.toString()}:`, e);
           }
       }

       const pokemonNFTs = await Promise.all(
           ownedTokenIds.map(async (tokenIdString) => {
               const tokenId = Number(tokenIdString); 
               try {
                   const nft = await getPokemonNFTFromId(tokenId, pokemonContract);
                   return nft;
               } catch (error) {
                   console.error(`Failed to fetch metadata for token ${tokenIdString}:`, error);
                   return null;
               }
           })
       );

       const validPokemonNFTs = pokemonNFTs.filter(nft => nft !== null) as PokemonNFT[];
       return validPokemonNFTs;
   } catch (error) {
       console.error("An error occurred while listing owned tokens:", error);
       throw error; 
   }
}

async function getPokemonNFTFromId(pokemonId: number, pokemonContract: ethers.Contract | null): Promise<PokemonNFT> {
   if (!pokemonContract)
       throw Error("Pokemon contract not instantiated");
   try {
       console.log(`Attempting to fetch NFT data for Token ID: ${pokemonId.toString()}`);
       const tokenURI = await pokemonContract.tokenURI(pokemonId);
       console.log("Received tokenURI:", tokenURI);
       let metadata: any;
       const base64Prefix = "data:application/json;base64,";
       if (tokenURI.startsWith(base64Prefix)) {
           try {
               const base64String = tokenURI.substring(base64Prefix.length);
               let jsonString: string;
               if (typeof window === 'undefined') { // Node.js
                   jsonString = Buffer.from(base64String, 'base64').toString('utf-8');
               } else { // Browser
                   jsonString = atob(base64String);
               }
               metadata = JSON.parse(jsonString);

           } catch (decodeError: any) {
               console.error("Failed to decode or parse data URI:", decodeError);
               throw new Error(`Failed to decode or parse metadata for token ${pokemonId.toString()}: ${decodeError.message}`);
           }


       } else {
           console.error("Token URI is not a supported data URI format.");
           throw new Error(`Unsupported token URI format for token ${pokemonId.toString()}.`);
       }

       const name = metadata.name;
       const imageUrl = metadata.image.replace('ipfs://','https://dweb.link/ipfs/');
       console.log(metadata.image);
       console.log(imageUrl);
       let type = "Unknown";
       let rarity = "Unknown";

       if (Array.isArray(metadata.attributes)) {
           for (const attr of metadata.attributes) {
               if (attr.trait_type === "Type") {
                   type = attr.value;
               } else if (attr.trait_type === "Rarity") {
                   rarity = attr.value;
               }
               if (type !== "Unknown" && rarity !== "Unknown") break;
           }
       }

       if (!name || !imageUrl) {
           throw new Error(`Missing required metadata fields (name or image) for token ${pokemonId.toString()}.`);
       }

       const pokemonNFT: PokemonNFT = {
           id: Number(pokemonId),
           name: name,
           imageUrl: imageUrl,
           type: type, 
           rarity: rarity
       };

       console.log(`Successfully fetched and structured data for token ${pokemonId.toString()}`);
       console.log(pokemonNFT);

       return pokemonNFT;
   } catch (error: any) {
       console.error(`Error in fetchPokemonNFT for token ${pokemonId.toString()}:`, error);
       if (error.message.includes("Token ID does not exist")) {
           throw new Error(`Pokemon NFT with ID ${pokemonId.toString()} does not exist.`);
       }
       throw error;
   }
}

async function getActiveAuctions(pokemonContract: ethers.Contract | null, auctionContract: ethers.Contract | null): Promise<Auction[]> {
   if (!auctionContract) {
       throw Error("Auction contract not active");
   }

   const maxAuctionId = await auctionContract.totalAuctionsCreated();
   const activeAuctions: Auction[] = [];
   for (let i = 1; i <= maxAuctionId; i++) {
       const auctionId = i; 
       try {
           const auction = await auctionContract.auctionData(auctionId);
           if (auction.seller !== ethers.ZeroAddress) {
               if (!auction.ended) {
                   console.log(`Found active auction: ${auctionId}`);
                   activeAuctions.push({
                       id: auctionId, 
                       seller: auction.seller,
                       endTime: Number(auction.auctionEndTime), 
                       startingBid: auction.startingBid,
                       nft: await getPokemonNFTFromId(auction.pokemonId, pokemonContract),
                       highestBidder: auction.highestBidder,
                       currentBid: auction.highestBid,
                       ended: auction.ended,
                       claimed: auction.claimed,
                       isFixedPrice: auction.isFixedPrice
                   });
               } else {
                   console.log(`Auction ${auctionId} is not active (ended: ${auction.ended})`);
               }
           } else {
               console.log(`Auction ID ${auctionId} does not exist (seller is zero address). Stopping search.`);
               break;
           }


       } catch (error) {
           console.error(`Error fetching data for auction ID ${auctionId}:`, error);
           break;
       }
   }
   return activeAuctions;
}

async function createAuction(account: string, pokemonId: number, biddingTimeSeconds: number, startingBidEth: number,listingType:string, pokemonContract: ethers.Contract | null, auctionContract: ethers.Contract | null): Promise<void> {
   if (!pokemonContract || !auctionContract || !account) {
       throw Error("No pokemon or auction contract or account not logged in");
   }
   try {
       console.log(`Starting auction creation for Pokemon ID: ${pokemonId.toString()}`);
       console.log(`Seller: ${account}`);
       console.log(`Bidding Time: ${biddingTimeSeconds} seconds`);
       console.log(`Starting Bid: ${startingBidEth} ETH`);

       const startingBidWei = ethers.parseEther(String(startingBidEth));
       const biddingTimeBigInt = BigInt(biddingTimeSeconds);

       console.log(`Checking if Auction Manager is approved for Pokemon ID ${pokemonId}...`);
       const approvedAddress = await pokemonContract.getApproved(pokemonId);

       if (approvedAddress.toLowerCase() !== contractAddressAuction.toLowerCase()) {
           console.log("Auction Manager not approved. Sending approval transaction...");
           const approveTx = await pokemonContract.approve(contractAddressAuction, pokemonId);
           console.log("Approval transaction sent:", approveTx.hash);
           await approveTx.wait();
       } else {
           console.log("Auction Manager is already approved for this Pokemon.");
       }

       const createTx = await auctionContract.create(
           biddingTimeBigInt,
           startingBidWei,
           pokemonId,
           (listingType==="Sale")
       );
       const createReceipt = await createTx.wait();

       let newAuctionId = null;
       const contractInterface = auctionContract.interface;

       for (const log of createReceipt.logs) {
           try {
               const parsedLog = contractInterface.parseLog(log);

               if (parsedLog && parsedLog.name === "AuctionCreated") {
                   newAuctionId = parsedLog.args[0];
                   console.log("Found AuctionCreated event!");
                   console.log("New Auction ID:", newAuctionId.toString());
                   break;
               }
           } catch (e) {
           }
       }

       if (newAuctionId !== null) {
           console.log(`Auction created successfully with ID: ${newAuctionId.toString()}`);
           return newAuctionId;
       } else {
           console.warn("Auction created, but could not retrieve auction ID from event logs. You may need to check contract events or the transaction receipt manually.");
           throw Error("Auction created, but could not retrieve auction ID from event logs. You may need to check contract events or the transaction receipt manually."); // Or throw an error depending on desired strictness
       }
   } catch (error) {
       console.error("Error creating auction:", error);
       throw error;
   }
}

async function endAuction(account:string,auctionId:number,auctionContract:ethers.Contract|null):Promise<void>{
   if(!account||!auctionContract){
       throw new Error("No pokemon contract");
   }
   try {
       console.log(`Calling contract endAuction for auction ${auctionId}`);
       const tx = await auctionContract.auctionEnd(auctionId);

       const receipt = await tx.wait();
       console.log("End auction transaction successful:", receipt);
       return receipt;


   } catch (error: any) {
       console.error(`Error calling endAuction for auction ${auctionId}:`, error);

       let userMessage = "Failed to end auction.";
       if (error.message) {
           if (error.message.includes("Auction not yet ended")) userMessage = "Auction time has not expired yet.";
           if (error.message.includes("Only the seller can end their auction")) userMessage = "You are not the seller of this auction.";
           if (error.message.includes("The auction has already ended")) userMessage = "This auction has already been ended.";
           else userMessage = `Failed to end auction: ${error.message}`;
       }
       const finalError = new Error(userMessage);
       (finalError as any).originalError = error;
       throw finalError;
   }
}

async function placeBid(account: string, auctionId: number, bidAmountEth: bigint, auctionContract: ethers.Contract | null): Promise<void> {
   if (!auctionContract || !account) {
       throw Error("No auction contract or user is not logged in");
   }

   try {
       console.log(`Attempting to place bid on Auction ID: ${auctionId.toString()}`);
       console.log(`Bid Amount: ${bidAmountEth} ETH`);

       // Convert the bid amount from Ether (string) to Wei (BigInt)
       // This is the value that will be sent with the transaction
       const bidAmountWei = bidAmountEth;
       console.log(`Bid Amount in Wei: ${bidAmountWei.toString()}`);
       const auctionDetails = await auctionContract.auctionData(auctionId);
       if (bidAmountWei <= auctionDetails.highestBid) {
           throw new Error("Bid must be higher than the current highest bid.");
       }
       if (bidAmountWei < auctionDetails.startingBid) {
        console.log("opa");
            console.log(bidAmountWei);
            console.log(auctionDetails.startingBid);
           throw new Error("Bid must be at least the starting bid.");
       }
       console.log("Sending bid transaction...");
       const bidTx = await auctionContract.bid(auctionId, {
           value: bidAmountWei
       });
       console.log("Bid transaction sent:", bidTx.hash);


       const bidReceipt = await bidTx.wait();

       let bidDetails = null;
       const contractInterface = auctionContract.interface;

       for (const log of bidReceipt.logs) {
           try {
               const parsedLog = contractInterface.parseLog(log);

               if (parsedLog && parsedLog.name === "HighestBidIncreased") {
                   const bidder = parsedLog.args[0];
                   const amount = parsedLog.args[1];
                   const eventAuctionId = parsedLog.args[2];

                   if (eventAuctionId.toString() === auctionId.toString()) {
                       console.log("Found HighestBidIncreased event!");
                       bidDetails = {
                           bidder: bidder,
                           amount: amount.toString(),
                           auctionId: eventAuctionId.toString()
                       };
                       break;
                   }
               }
           } catch (e) {
           }
       }

       if (bidDetails !== null) {
           console.log(`Bid successfully placed by ${bidDetails.bidder} for ${ethers.formatEther(bidDetails.amount)} ETH on Auction ${bidDetails.auctionId}`);
           console.log(bidDetails);
           return;
       } else {
           console.warn("Bid transaction successful, but could not retrieve bid details from event logs.");
           return;
       }

   } catch (error) {
       console.error("Error placing bid:", error);
       if (error instanceof Error) {
           if (error.message.includes("Auction already ended")) {
               console.error("Bid failed: Auction already ended.");
           } else if (error.message.includes("There is already a higher bid")) {
               console.error("Bid failed: Your bid is not higher than the current highest bid.");
           } else if (error.message.includes("Bids must be higher than the starting bid")) {
               console.error("Bid failed: Your bid is lower than the starting bid.");
           } else if (error.message.includes("Seller cannot bid on their own auction")) {
               console.error("Bid failed: You are the seller of this auction.");
           } else if (error.message.includes("User denied transaction signature")) {
               console.error("Bid failed: Transaction rejected by user.");
           }
       }
       throw error;
   }
}

async function getWonAuctions(account: string, pokemonContract: ethers.Contract | null, auctionContract: ethers.Contract | null): Promise<Auction[]> {
   if (!auctionContract || !account) {
       throw Error("No auction contract or user is not logged in yet");
   }
   const wonClaimableAuctions = [];

   try {
       const totalAuctionsBigInt = await auctionContract.totalAuctionsCreated();
       const totalAuctionsCount = Number(totalAuctionsBigInt); // Convert BigInt to number for loop limit (safe if count < Number.MAX_SAFE_INTEGER)
       console.log(`Total auctions created: ${totalAuctionsCount}`);

       if (totalAuctionsCount === 0) {
           console.log("No auctions created yet.");
           return [];
       }
       for (let i = 1; i <= totalAuctionsCount; i++) {
           const auctionId = i;
           try {
               const auction = await auctionContract.auctionData(auctionId);
               if (auction.ended === true &&
                   (auction.highestBidder.toLowerCase() === account.toLowerCase()||(auction.highestBid===0 && auction.seller.toLowerCase()===account.toLowerCase())) &&
                   auction.claimed === false) {
                   console.log(`Found won and claimable auction: ${auctionId.toString()}`);
                   wonClaimableAuctions.push({
                       id: auctionId,
                       seller: auction.seller,
                       endTime: Number(auction.auctionEndTime), // Convert timestamp to Date object
                       startingBid: auction.startingBid, // Convert BigInts to string
                       nft: await getPokemonNFTFromId(auction.pokemonId, pokemonContract),
                       highestBidder: auction.highestBidder,
                       currentBid: auction.highestBid,
                       ended: auction.ended,
                       claimed: auction.claimed,
                       isFixedPrice: auction.isFixedPrice
                   });
               }
           } catch (error) {
               console.error(`Error fetching data for auction ID ${auctionId.toString()}:`, error);
           }
       }
       console.log(`Finished checking ${totalAuctionsCount} auctions.`);
       console.log(`Found ${wonClaimableAuctions.length} won and claimable auctions for ${account}.`);

       return wonClaimableAuctions;
   } catch (error) {
       console.error("Error fetching won and claimable auctions:", error);
       throw error;
   }
}

async function claimNFT(account: string, auctionId: number, auctionContract: ethers.Contract | null): Promise<void> {
   if (!auctionContract || !account) {
       throw Error("No auction contract or user is not logged in yet");
   }
   try {
       const auctionDetails = await auctionContract.auctionData(auctionId);
       console.log(`Attempting to claim NFT for Auction ID: ${auctionId.toString()}`);

       const claimTx = await (auctionDetails.highestBid !== 0 ? auctionContract.claimWonNFT(auctionId) : auctionContract.reclaimUnsoldNFT(auctionId));
       const claimReceipt = await claimTx.wait();

       let claimedPokemonId: number | null = null;
       const contractInterface = auctionContract.interface;

       console.log("Checking logs for NFTClaimed or NFTRedeemed event...");
       if (claimReceipt && claimReceipt.logs) {
           for (const log of claimReceipt.logs) {
               try {
                   const parsedLog = contractInterface.parseLog(log);

                   if (parsedLog && parsedLog.name === "NFTClaimed") {
                       const eventAuctionId = parsedLog.args[0];
                       const eventWinner = parsedLog.args[1];
                       const eventPokemonId = parsedLog.args[2];
                       if (eventAuctionId.toString() === auctionId.toString() &&
                           eventWinner.toLowerCase() === account.toLowerCase()) {
                           console.log("Found NFTClaimed event!");
                           claimedPokemonId = eventPokemonId;
                           console.log("Claimed Pokemon ID:", eventPokemonId.toString());
                           break;
                       }
                   }
                   if (parsedLog && parsedLog.name === "NFTRedeemedBySeller") {
                       const eventAuctionId = parsedLog.args[0];
                       const eventWinner = parsedLog.args[1];
                       const eventPokemonId = parsedLog.args[2];

                       if (eventAuctionId.toString() === auctionId.toString() &&
                           eventWinner.toLowerCase() === account.toLowerCase()) {
                           console.log("Found NFTRedeemedBySeller event!");
                           claimedPokemonId = eventPokemonId;
                           console.log("Claimed Pokemon ID:", eventPokemonId.toString());
                           break;
                       }
                   }
               } catch (e) {}
           }
       }

       if (claimedPokemonId !== null) {
           console.log(`NFT with ID ${claimedPokemonId.toString()} claimed successfully for Auction ID: ${auctionId.toString()}`);
           return;
       } else {
           console.warn("Claim transaction succeeded, but could not find the NFTClaimed event log.");
           throw Error("Claim transaction successful, but could not find the NFTClaimed event log."); // Or throw
       }
   } catch (error) {
       console.error("Error claiming NFT:", error);
       if (error instanceof Error) {
           if (error.message.includes("Auction has not ended yet")) {
               console.error("Claim failed: Auction has not ended yet.");
           } else if (error.message.includes("Only the highest bidder can claim")) {
               console.error("Claim failed: You are not the highest bidder for this auction.");
           } else if (error.message.includes("No bids were placed on this auction")) {
               console.error("Claim failed: This auction had no bids.");
           } else if (error.message.includes("NFT has already been claimed")) {
               console.error("Claim failed: This NFT has already been claimed.");
           } else if (error.message.includes("User denied transaction signature")) {
               console.error("Claim failed: Transaction rejected by user.");
           } else if (error.message.includes("Only the Seller can reclaim")) {
               console.error("Claim failed: Only the seller can reclaim");
           }
       }
       throw error;
   }
}

async function withdrawFunds(account: string, auctionId: number, auctionContract: ethers.Contract | null): Promise<void> {
   if (!auctionContract || !account) {
       throw Error("No auction contract or user is not logged in yet");
   }
   try {
       const withdrawTx = await auctionContract.withdraw(auctionId);
       const withdrawReceipt = await withdrawTx.wait();

       let withdrawnAmount: number | null = null;
       const contractInterface = auctionContract.interface;

       if (withdrawReceipt && withdrawReceipt.logs) {
           for (const log of withdrawReceipt.logs) {
               try {
                   const parsedLog = contractInterface.parseLog(log);

                   if (parsedLog && parsedLog.name === "Withdrawal") {
                       const eventUser = parsedLog.args[0];
                       const eventAmount = parsedLog.args[1];
                       const eventAuctionId = parsedLog.args[2];

                       if (eventAuctionId.toString() === auctionId.toString() &&
                           eventUser.toLowerCase() === account.toLowerCase()) {
                           console.log("Found Withdrawal event!");
                           withdrawnAmount = eventAmount;
                           console.log("Withdrawn Amount:", withdrawnAmount);
                           break;
                       }
                   }
               } catch (e) {}
           }
       }

       if (withdrawnAmount !== null) {
           console.log(`Successfully withdrew ${ethers.formatEther(withdrawnAmount)} ETH for Auction ID: ${auctionId.toString()}`);
           return;
       } else {
           console.warn("Withdrawal transaction succeeded, but could not find the Withdrawal event log.");
           throw Error("Withdrawal transaction successful, but could not find the Withdrawal event log."); // Or throw
       }
   } catch (error: any) {
       console.error("Error withdrawing funds:", error);
       if (error.message.includes("Withdrawal failed")) {
           console.error("Withdrawal failed during blockchain transfer.");
       } else if (error.message.includes("User denied transaction signature")) {
           console.error("Withdrawal failed: Transaction rejected by user.");
       }
       throw error;
   }
}

async function withdrawAllFunds(account:string,auctionContract:ethers.Contract|null):Promise<void>{
   if (!auctionContract || !account) {
       throw new Error("Auction contract is not created yet or user is not logged in."); // Or throw a more specific error
   }
   let totalAuctions = 0;
   try {
       totalAuctions = Number(await auctionContract.totalAuctionsCreated());
       console.log(`Total auctions created: ${totalAuctions}`);
   } catch (error) {
       console.error("Failed to get total auctions created:", error);
       throw new Error("Could not determine the range of auctions to check.");
   }

   const auctionIdsWithFunds: number[] = [];
    for (let i = 1; i <= totalAuctions; i++) {
           try {
               const pendingAmount: bigint = await auctionContract.getPendingReturn(i, account);
               if (pendingAmount > 0n) {
                   console.log(`Found ${ethers.formatEther(pendingAmount)} ETH pending for auction ${i}`);
                   auctionIdsWithFunds.push(i);
               }
           } catch (error) {
               console.warn(`Could not check pending return for auction ${i}:`, error);
           }
   }
   if (auctionIdsWithFunds.length === 0) {
       console.log("No pending funds found across all auctions for the current user.");
       return;
   }

   console.log(`Attempting to withdraw funds from ${auctionIdsWithFunds.length} auction(s) where funds are pending.`);

   const withdrawalResults: { auctionId: number; success: boolean; error?: string }[] = [];
   let successfulWithdrawals=0;
   let failedWithdrawals=0;
   for (const auctionId of auctionIdsWithFunds) {
       try {
           withdrawFunds(account,auctionId,auctionContract);
           successfulWithdrawals++;
       } catch (error: any) {
           console.error(`Failed to withdraw from auction ${auctionId}:`, error);
               let errorMessage = "Transaction failed.";
               if (error.message) {
                   errorMessage = error.message;
               }
           failedWithdrawals++;
       }
   }
   console.log("Withdrawal process complete.", withdrawalResults);
       console.log(`Withdrawal process finished. ${successfulWithdrawals} successful, ${failedWithdrawals} failed.`);
       return;
}

interface Web3ContextType {
   account: string | null;
   isConnected: boolean;
   connectWallet: () => Promise<void>;
   mintNFT?: () => Promise<PokemonNFT>;
    activeAuctions:Auction[]
    wonAuctions:Auction[]
    ownedNFTs: PokemonNFT[];
    isLoadingActiveAuctions: boolean;
    isLoadingWonAuctions: boolean;
    isLoadingOwnedNFTs:boolean,
   createAuction?: (pokemonId: number, duration: number, startBid: number,listingType:string) => void;
   endAuction?:(auctionId:number)=>Promise<void>;
   placeBid?: (auctionId: number, bidAmount: bigint) => Promise<void>;
   claimNFT?: (auctionId: number) => Promise<void>;
   claimAllOutbidFunds?: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider = ({ children }: { children: ReactNode }) => {
   const [account, setAccount] = useState<string | null>(null);
   const [isConnected, setIsConnected] = useState(false);
   const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
   const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
   const [pokemonContract, setPokemonContract] = useState<ethers.Contract | null>(null);
   const [auctionContract, setAuctionContract] = useState<ethers.Contract | null>(null);
   const [activeAuctions, setActiveAuctions] = useState<Auction[]>([]);
   const [wonAuctions, setWonAuctions] = useState<Auction[]>([]);
   const [ownedNFTs, setOwnedNFTs] = useState<PokemonNFT[]>([]); // <-- New state
   const [isLoadingActiveAuctions, setIsLoadingActiveAuctions] = useState(false);
   const [isLoadingWonAuctions, setIsLoadingWonAuctions] = useState(false);
   const [isLoadingOwnedNFTs, setIsLoadingOwnedNFTs] = useState(false);

   useEffect(() => {
       if (signer) {
           try {
               const pokemon = new ethers.Contract(contractAddressPokemon, PokemonTestABI, signer);
               const auction = new ethers.Contract(contractAddressAuction, AuctionABI, signer);
               setPokemonContract(pokemon);
               setAuctionContract(auction);
           } catch (error) {
               console.error("Error setting up contracts:", error);
               setPokemonContract(null);
               setAuctionContract(null);
           }
       } else {
           setPokemonContract(null);
           setAuctionContract(null);
       }
   }, [signer]);

   const fetchActiveAuctions = useCallback(async () => {
    if (!auctionContract || !pokemonContract) {
        console.log("Contracts not ready to fetch active auctions.");
        setActiveAuctions([]);
        return;
    }
    setIsLoadingActiveAuctions(true);
    try {
        console.log("Fetching active auctions from contract...");
        const auctions = await getActiveAuctions(pokemonContract, auctionContract);
        console.log("Fetched and setting active auctions state:", auctions);
        setActiveAuctions(auctions);
    } catch (error) {
        console.error("Failed to fetch active auctions:", error);
        setActiveAuctions([]);
    } finally {
        setIsLoadingActiveAuctions(false);
    }
}, [auctionContract, pokemonContract]);

    const fetchWonAuctions = useCallback(async () => {
    if (!auctionContract || !pokemonContract || !account) {
        console.log("Contracts not ready or not connected to fetch won auctions.");
         setWonAuctions([]);
        return;
    }
    setIsLoadingWonAuctions(true);
    try {
        console.log(`Fetching won auctions for ${account}...`);
        const auctions = await getWonAuctions(account, pokemonContract, auctionContract);
         console.log("Fetched and setting won auctions state:", auctions);
        setWonAuctions(auctions);
    } catch (error) {
        console.error(`Failed to fetch won auctions for ${account}:`, error);
        setWonAuctions([]);
    } finally {
        setIsLoadingWonAuctions(false);
    }
}, [auctionContract, pokemonContract, account]);

    const fetchOwnedNFTs = useCallback(async () => {
    if (!pokemonContract || !account) {
        console.log("Pokemon contract not ready or not connected to fetch owned NFTs.");
        setOwnedNFTs([]);
        return;
    }
    setIsLoadingOwnedNFTs(true);
    try {
        console.log(`Fetching owned NFTs for ${account}...`);
        const nfts = await getOwnedNFTs(account, pokemonContract);
        console.log("Fetched and setting owned NFTs state:", nfts);
        setOwnedNFTs(nfts);
    } catch (error) {
        console.error(`Failed to fetch owned NFTs for ${account}:`, error);
        setOwnedNFTs([]);
    } finally {
        setIsLoadingOwnedNFTs(false);
    }
}, [account, pokemonContract]);

   useEffect(() => {
       if (!auctionContract) {
         console.log("Auction contract not ready for event listeners.");
         return;
       }
       if (!pokemonContract) {
           console.log("Pokemon contract not set up.");
           return;
         }
  
       console.log("Setting up contract event listeners...");
  
  
       // Listener for AuctionCreated
       const handleAuctionCreated = (auctionId: bigint, seller: string, pokemonId: bigint, auctionEndTime: bigint, startingBid: bigint) => {
           console.log("Event: AuctionCreated", { auctionId: Number(auctionId), seller, pokemonId: Number(pokemonId), auctionEndTime: Number(auctionEndTime), startingBid: startingBid.toString() });
           // A new auction is created -> Refresh the active auctions list
           fetchActiveAuctions();
           if(account)
            fetchOwnedNFTs();
       };
  
       // Listener for HighestBidIncreased
       const handleHighestBidIncreased = (bidder: string, amount: bigint, auctionId: bigint) => {
           console.log("Event: HighestBidIncreased", { bidder, amount: amount.toString(), auctionId: Number(auctionId) });
           // A bid changed -> Refresh the active auctions list (current bid might change)
           fetchActiveAuctions();
           if (isConnected && account) {
                fetchWonAuctions();
           }
       };
  
        // Listener for AuctionEnded
        const handleAuctionEnded = (winner: string, amount: bigint, auctionId: bigint) => {
            console.log("Event: AuctionEnded", { winner, amount: amount.toString(), auctionId: Number(auctionId) });
            // Auction ended -> Refresh active list (should remove it) & won list (if user is winner)
            fetchActiveAuctions();
            if (isConnected && account) {
                fetchWonAuctions();
            }
        };
  
        // Listener for NFTClaimed or NFTRedeemedBySeller
         const handleNFTFinalized = (auctionId: bigint, participant: string, pokemonId: bigint) => {
             console.log("Event: NFTClaimed or NFTRedeemedBySeller", { auctionId: Number(auctionId), participant, pokemonId: Number(pokemonId) });
              // NFT claimed/redeemed -> Refresh won auctions list (status might change)
              if (account && participant.toLowerCase() === account.toLowerCase()) {
                fetchOwnedNFTs();
              }
              if (isConnected && account) {
                fetchWonAuctions();
              }
         };

         // Listener for MintedPokemon
         const handlePokemonMint = (to: string, tokenId: bigint) => {
            console.log("Event: MintedPokemon", { to, tokenId: Number(tokenId) });
            if (account && to.toLowerCase() === account.toLowerCase()) {
                fetchOwnedNFTs(); 
            }
        };
  
        //  // Listener for Withdrawal
        //  const handleWithdrawal = (user: string, amount: bigint, auctionId: bigint) => {
        //       console.log("Event: Withdrawal", { user, amount: amount.toString(), auctionId: Number(auctionId) });
        //  };
  
  
       auctionContract.on("AuctionCreated", handleAuctionCreated);
       auctionContract.on("HighestBidIncreased", handleHighestBidIncreased);
       auctionContract.on("AuctionEnded", handleAuctionEnded);
       auctionContract.on("NFTClaimed", handleNFTFinalized); 
       auctionContract.on("NFTRedeemedBySeller", handleNFTFinalized); 
       pokemonContract.on("MintedPokemon", handlePokemonMint);

       // auctionContract.on("Withdrawal", handleWithdrawal);
        
       return () => {
         console.log("Cleaning up contract event listeners...");
         auctionContract.off("AuctionCreated", handleAuctionCreated);
         auctionContract.off("HighestBidIncreased", handleHighestBidIncreased);
         auctionContract.off("AuctionEnded", handleAuctionEnded);
         auctionContract.off("NFTClaimed", handleNFTFinalized);
         auctionContract.off("NFTRedeemedBySeller", handleNFTFinalized);
         pokemonContract.off("MintedPokemon", handlePokemonMint);
         // auctionContract.off("Withdrawal", handleWithdrawal); // Clean up optional listener
       };
     }, [auctionContract, pokemonContract, provider, isConnected, account, fetchActiveAuctions, fetchWonAuctions]);
   const connectWallet = async () => {
       const ethereum = (window as any).ethereum;
       if (ethereum) {
           try {
               const newProvider = new ethers.BrowserProvider(ethereum);
               const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
               setProvider(newProvider);
               setSigner(await newProvider.getSigner());
               setAccount(accounts[0]);
               setIsConnected(true);
           } catch (error) {
               console.error("Error connecting:", error);
           }
       } else {
           alert("Please install MetaMask!");
       }
   };

    useEffect(() => {
        console.log("Web3Provider initial fetch effect triggered.");
        fetchActiveAuctions(); 
        if (isConnected && account) {
            fetchWonAuctions();
            fetchOwnedNFTs();
        } else {
            setWonAuctions([]);
        }
    }, [fetchOwnedNFTs, fetchActiveAuctions, fetchWonAuctions, isConnected, account]); // Dependencies: Fetch functions and connection status

   return (
       <Web3Context.Provider
           value={{
               account,
               isConnected,
               connectWallet,
               activeAuctions,
               wonAuctions,
               ownedNFTs,
               isLoadingActiveAuctions,
               isLoadingWonAuctions,
               isLoadingOwnedNFTs,
               mintNFT: isConnected && account && pokemonContract ? () => mintNFT(account, pokemonContract) : undefined,
               createAuction: isConnected && account && pokemonContract && auctionContract
                   ? (pokemonId, duration, startBid,listingType) => createAuction(account, pokemonId, duration, startBid,listingType, pokemonContract, auctionContract)
                   : undefined,
               placeBid: isConnected && account && auctionContract
                   ? (auctionId, bidAmount) => placeBid(account, auctionId, bidAmount, auctionContract)
                   : undefined,
               endAuction: isConnected && account && auctionContract
                   ? (auctionId)=>endAuction(account,auctionId,auctionContract)
                   :undefined,
               claimNFT: isConnected && account && auctionContract && pokemonContract
                   ? (auctionId) => claimNFT(account, auctionId, auctionContract)
                   : undefined,
               claimAllOutbidFunds: isConnected && account && auctionContract
                   ? () => withdrawAllFunds(account, auctionContract)
                   : undefined,
           }}
       >
           {children}
       </Web3Context.Provider>
   );
};

export const useWeb3 = () => {
   const context = useContext(Web3Context);
   if (!context) throw new Error("useWeb3 must be used within a Web3Provider");
   return context;
};