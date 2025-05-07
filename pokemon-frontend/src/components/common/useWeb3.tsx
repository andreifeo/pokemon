import { ethers } from 'ethers';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import PokemonTestABI from '../../PokemonTestABI.json';
import AuctionABI from '../../AuctionABI.json';
import { Auction, PokemonNFT } from './types';

// --- Mock Data and Simulated Contract Functions ---
// In a real app, these would interact with your deployed smart contracts

const contractAddressPokemon = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const contractAddressAuction = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// const [pokemonContract, setPokemonContract] = useState<ethers.Contract | null>(null);
// const [auctionContract, setAuctionContract] = useState<ethers.Contract | null>(null);
///,pokemonContract:ethers.Contract|null
///,auctionContract:ethers.Contract|null
async function mintNFT(account: string, pokemonContract: ethers.Contract | null): Promise<PokemonNFT> {

    if (!pokemonContract || !account) throw Error("Pokemon contract not activated or account not logged in");
    let newNFT: PokemonNFT | null = null;
    try {
        const tx = await (pokemonContract.mint(account,{gasLimit:3000000}));
        const receipt = await tx.wait();
        alert("Pokemon minted successfully!");
        const contractInterface = pokemonContract.interface;
        let mintedTokenId = null;
        for (const log of receipt.logs) {
            try {
                // Try to parse the log using the contract's ABI
                const parsedLog = contractInterface.parseLog(log);

                // Check if the parsed log is the "Transfer" event
                if (parsedLog && parsedLog.name === "Transfer") {
                    // Check if the recipient of the transfer is the account we minted to
                    const from = parsedLog.args[0];
                    const to = parsedLog.args[1];
                    const tokenId = parsedLog.args[2]; // Token ID is the third argument in Transfer event

                    if (to.toLowerCase() === account.toLowerCase()) {
                        // Found the correct Transfer event for this mint!
                        mintedTokenId = tokenId;
                        console.log("Found Transfer event!");
                        console.log("From (should be zero address for mint):", from);
                        console.log("To:", to);
                        console.log("Minted Token ID:", tokenId.toString()); // Convert BigInt to string for display
                        break; // Exit the loop once we found our event
                    }
                }
            } catch (e) {
                // Ignore logs that are not from our contract or are not Transfer events
                // contractInterface.parseLog will throw if the log doesn't match any event in the ABI
                // console.warn("Could not parse log or it's not a Transfer event from this contract:", e.message);
            }
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
                    // Node.js: Use Buffer
                    jsonString = Buffer.from(base64String, 'base64').toString('utf-8');
                } else {
                    // Browser: Use atob
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
        console.log("Fetching owned token IDs using tokenOfOwnerByIndex...");
        for (let i = 0; i < balance; i++) {
            try {
                console.log(`Workspaceing token ID at index ${i.toString()}...`);
                // 3. Call tokenOfOwnerByIndex for each index to get the token ID
                const tokenId = await pokemonContract.tokenOfOwnerByIndex(account, i);

                console.log(`-> Found Token ID: ${tokenId.toString()}`);
                ownedTokenIds.push(tokenId.toString()); // Store as string or BigInt as needed

            } catch (e) {
                console.error(`Error fetching token at index ${i.toString()}:`, e);
                // This shouldn't typically happen with a correctly implemented ERC721Enumerable
                // after a valid balanceOf call, unless there's a network issue or contract bug.
            }
        }

        const pokemonNFTs = await Promise.all(
            ownedTokenIds.map(async (tokenIdString) => {
                const tokenId = Number(tokenIdString); // Convert ID string to number/BigInt if needed by getPokemonNFTFromId
                try {
                    // Use the existing function to get the full NFT object
                    const nft = await getPokemonNFTFromId(tokenId, pokemonContract);
                    return nft;
                } catch (error) {
                    // Handle cases where metadata fetch fails for a specific token
                    console.error(`Failed to fetch metadata for token ${tokenIdString}:`, error);
                    // You might return null or a placeholder object here,
                    // or filter it out later. For now, let's log and allow Promise.all to collect results.
                    return null; // Return null for failed fetches
                }
            })
        );

        const validPokemonNFTs = pokemonNFTs.filter(nft => nft !== null) as PokemonNFT[];


        console.log("\n--- Complete List of Owned Token IDs ---");
        console.log(validPokemonNFTs);
        console.log("--------------------------------------");
        return validPokemonNFTs;
    } catch (error) {
        console.error("An error occurred while listing owned tokens:", error);
        // Handle specific errors (e.g., invalid contract address, network issues)
        throw error; // Re-throw the error for potential handling by the caller
    }


    // console.log(`Simulating fetching NFTs owned by ${account}...`);
    //  // In a real app: Query your NFT contract (e.g., using balanceof and tokenOfOwnerByIndex)
    //  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    //  // Return some mock NFTs, maybe filter mockNFTs by owner if we tracked that
    //  // For simplicity, return all mock NFTs that are not currently being auctioned by someone else
    //  const ownedNFTs = mockNFTs.filter(nft =>
    //     !mockAuctions.some(auction => auction.nft.id === nft.id && auction.seller !== account)
    //  );
    //  console.log("Owned NFTs:", ownedNFTs);
    //  return ownedNFTs;
}

async function getPokemonNFTFromId(pokemonId: number, pokemonContract: ethers.Contract | null): Promise<PokemonNFT> {
    if (!pokemonContract)
        throw Error("Pokemon contract not instantiated");
    try {
        console.log(`Attempting to fetch NFT data for Token ID: ${pokemonId.toString()}`);
        // Instantiate the PokemonTest contract (using Provider for view calls)

        // --- Step 1: Get the tokenURI ---
        // This is the standard way to get NFT metadata
        const tokenURI = await pokemonContract.tokenURI(pokemonId);
        console.log("Received tokenURI:", tokenURI);

        // --- Step 2: Decode the tokenURI ---
        let metadata: any; // Use 'any' or a more specific type for the JSON structure

        // Check if it's a Base64 Data URI (as implemented in your contract)
        const base64Prefix = "data:application/json;base64,";
        if (tokenURI.startsWith(base64Prefix)) {
            try {
                const base64String = tokenURI.substring(base64Prefix.length);
                let jsonString: string;

                // Decode Base64 - works in both Node.js and browser environments
                if (typeof window === 'undefined') { // Node.js
                    jsonString = Buffer.from(base64String, 'base64').toString('utf-8');
                } else { // Browser
                    jsonString = atob(base64String);
                }

                // Parse the JSON string
                metadata = JSON.parse(jsonString);
                console.log("Decoded and parsed metadata from data URI:", metadata);

            } catch (decodeError: any) {
                console.error("Failed to decode or parse data URI:", decodeError);
                throw new Error(`Failed to decode or parse metadata for token ${pokemonId.toString()}: ${decodeError.message}`);
            }

        } else {
            console.error("Token URI is not a supported data URI format.");
            throw new Error(`Unsupported token URI format for token ${pokemonId.toString()}.`);
        }


        // --- Step 3: Structure Data into PokemonNFT Interface ---
        // Extract required fields from the parsed metadata
        const name = metadata.name;
        const imageUrl = metadata.image.replace('ipfs://','https://dweb.link/ipfs/'); // Your metadata uses 'image' for the image URI
        console.log(metadata.image);
        console.log(imageUrl);
        let type = "Unknown";
        let rarity = "Unknown";

        // Find type and rarity from attributes array
        if (Array.isArray(metadata.attributes)) {
            for (const attr of metadata.attributes) {
                if (attr.trait_type === "Type") {
                    type = attr.value;
                } else if (attr.trait_type === "Rarity") {
                    rarity = attr.value;
                }
                // Break early if both are found
                if (type !== "Unknown" && rarity !== "Unknown") break;
            }
        }

        // Basic validation
        if (!name || !imageUrl) {
            throw new Error(`Missing required metadata fields (name or image) for token ${pokemonId.toString()}.`);
        }


        // Construct the PokemonNFT object
        const pokemonNFT: PokemonNFT = {
            id: Number(pokemonId), // Convert BigInt ID to Number (be cautious with very large IDs)
            name: name,
            imageUrl: imageUrl,
            type: type, // Use the extracted type
            rarity: rarity // Use the extracted rarity
            // Add other fields if needed based on your struct/metadata
        };

        console.log(`Successfully fetched and structured data for token ${pokemonId.toString()}`);
        console.log(pokemonNFT);

        return pokemonNFT;

    } catch (error: any) {
        console.error(`Error in fetchPokemonNFT for token ${pokemonId.toString()}:`, error);
        // Check for common errors like token not found
        if (error.message.includes("Token ID does not exist")) { // This is the require message in your tokenURI
            throw new Error(`Pokemon NFT with ID ${pokemonId.toString()} does not exist.`);
        }
        throw error; // Re-throw other errors
    }
}

async function getActiveAuctions(pokemonContract: ethers.Contract | null, auctionContract: ethers.Contract | null): Promise<Auction[]> {
    if (!auctionContract) {
        throw Error("Auction contract not active");
    }

    const maxAuctionId = await auctionContract.totalAuctionsCreated();
    const activeAuctions: Auction[] = [];
    for (let i = 1; i <= maxAuctionId; i++) {
        const auctionId = i; // Use BigInt for token/auction IDs

        try {
            const auction = await auctionContract.auctionData(auctionId);
            // console.log(`Workspaceed data for auction ${auctionId}:`, auction); // Debugging

            // Check if the auction exists (seller is not the zero address)
            // and if it is still active (not ended and end time not passed client-side)
            if (auction.seller !== ethers.ZeroAddress) {
                // Auction exists, now check if it's active
                const currentTimeMillis = Date.now();
                const auctionEndTimeMillis = Number(auction.auctionEndTime) * 1000; // Convert Solidity timestamp (seconds) to JS milliseconds

                if (!auction.ended /*&& currentTimeMillis <= auctionEndTimeMillis*/) {
                    console.log(`Found active auction: ${auctionId}`);
                    // Add the auction details to the list, including the ID
                    activeAuctions.push({
                        id: auctionId, // Store ID as string
                        seller: auction.seller,
                        endTime: Number(auction.auctionEndTime), // Convert timestamp to Date object
                        startingBid: auction.startingBid, // Convert BigInts to string
                        nft: await getPokemonNFTFromId(auction.pokemonId, pokemonContract),
                        highestBidder: auction.highestBidder,
                        currentBid: auction.highestBid,
                        ended: auction.ended,
                        claimed: auction.claimed
                        // Note: pendingReturns is a mapping inside the struct and
                        // cannot be queried directly this way from off-chain.
                    });
                } else {
                    // console.log(`Auction ${auctionId} is not active (ended: ${auction.ended}, time check: ${currentTimeMillis > auctionEndTimeMillis})`);
                }
            } else {
                // Seller is address(0), likely means this auction ID doesn't exist
                // If auction IDs are sequential, we can stop searching here.
                console.log(`Auction ID ${auctionId} does not exist (seller is zero address). Stopping search.`);
                break; // Assume we have iterated past all existing auctions
            }

        } catch (error) {
            // If calling auctionData(auctionId) reverts for some reason other than non-existence
            // or a network error occurs.
            console.error(`Error fetching data for auction ID ${auctionId}:`, error);
            // Depending on the nature of the error and your confidence in sequential IDs,
            // you might choose to break here or continue. Breaking is safer if you suspect
            // the zero address check is the primary way to detect the end.
            // For now, let's log and break assuming zero address is the signal.
            break; // Assuming this indicates end of existing auctions or serious issue
        }
    }
    return activeAuctions;
}

async function createAuction(account: string, pokemonId: number, biddingTimeSeconds: number, startingBidEth: number, pokemonContract: ethers.Contract | null, auctionContract: ethers.Contract | null): Promise<void> {
    if (!pokemonContract || !auctionContract || !account) {
        throw Error("No pokemon or auction contract or account not logged in");
    }
    try {
        console.log(`Starting auction creation for Pokemon ID: ${pokemonId.toString()}`);
        console.log(`Seller: ${account}`);
        console.log(`Bidding Time: ${biddingTimeSeconds} seconds`);
        console.log(`Starting Bid: ${startingBidEth} ETH`);

        // Convert starting bid from ETH string to Wei BigInt
        const startingBidWei = ethers.parseEther(String(startingBidEth));
        const biddingTimeBigInt = BigInt(biddingTimeSeconds); // Ensure bidding time is BigInt


        // --- Step 1: Check/Send Approval Transaction ---
        console.log(`Checking if Auction Manager is approved for Pokemon ID ${pokemonId}...`);
        const approvedAddress = await pokemonContract.getApproved(pokemonId);

        if (approvedAddress.toLowerCase() !== contractAddressAuction.toLowerCase()) {
            console.log("Auction Manager not approved. Sending approval transaction...");
            const approveTx = await pokemonContract.approve(contractAddressAuction, pokemonId);
            console.log("Approval transaction sent:", approveTx.hash);

            // Wait for the approval transaction to be mined
            const approveReceipt = await approveTx.wait();
            console.log("Approval transaction mined!");
            console.log("Approval transaction gas used:", approveReceipt.gasUsed.toString());
        } else {
            console.log("Auction Manager is already approved for this Pokemon.");
        }

        // --- Step 2: Send Create Auction Transaction ---
        console.log("Sending create auction transaction...");
        // You might want to estimate gas here first as shown in the previous answer
        // const estimatedGas = await auctionManagerContract.create.estimateGas(biddingTimeBigInt, startingBidWei, pokemonId);
        // const gasLimit = estimatedGas * 120n / 100n; // Add a buffer

        const createTx = await auctionContract.create(
            biddingTimeBigInt,
            startingBidWei,
            pokemonId
            // { gasLimit: gasLimit } // Include gasLimit if using estimation
        );
        console.log("Create auction transaction sent:", createTx.hash);

        // Wait for the create auction transaction to be mined
        const createReceipt = await createTx.wait();
        console.log("Create auction transaction mined!");
        console.log("Create transaction gas used:", createReceipt.gasUsed.toString());

        // --- Step 3: Get the new Auction ID from the receipt (if AuctionCreated event is added) ---
        let newAuctionId = null;
        // Assuming you added the AuctionCreated event definition to the auctionManagerAbi
        const contractInterface = auctionContract.interface;
        const auctionCreatedEventTopic = ethers.id("AuctionCreated(uint256,address,uint256,uint256,uint256)");


        for (const log of createReceipt.logs) {
            try {
                // Try to parse the log using the contract's ABI
                const parsedLog = contractInterface.parseLog(log);

                // Check if the parsed log is the "AuctionCreated" event
                if (parsedLog && parsedLog.name === "AuctionCreated") {
                    // The first argument in the event is the auctionId
                    newAuctionId = parsedLog.args[0];
                    console.log("Found AuctionCreated event!");
                    console.log("New Auction ID:", newAuctionId.toString());
                    break; // Found the relevant event
                }
            } catch (e) {
                // Ignore logs that don't match the event ABI
            }
        }

        if (newAuctionId !== null) {
            console.log(`Auction created successfully with ID: ${newAuctionId.toString()}`);
            return newAuctionId; // Return the new auction ID (as BigInt)
        } else {
            console.warn("Auction created, but could not retrieve auction ID from event logs. You may need to check contract events or the transaction receipt manually.");
            // In this case, you might return the receipt, or null, and rely on
            // refetching all auctions or checking the contract state based on nextId-1
            throw Error("Auction created, but could not retrieve auction ID from event logs. You may need to check contract events or the transaction receipt manually."); // Or throw an error depending on desired strictness
        }
    } catch (error) {
        console.error("Error creating auction:", error);
        // Handle errors (e.g., user rejected transaction, insufficient funds, contract reverted)
        throw error; // Re-throw the error for the component to handle
    }
    // console.log(`Simulating creating auction for NFT ${nftId} by ${account} with duration ${duration}s and start bid ${startBid}...`);
    // // In a real app: Interact with your auction smart contract (requires approving NFT transfer first)
    // await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
    // console.log("Auction creation simulated.");

    // // You'd typically refresh the active auctions list here
}

async function endAuction(account:string,auctionId:number,auctionContract:ethers.Contract|null):Promise<void>{
    if(!account||!auctionContract){
        throw new Error("No pokemon contract");
    }

    try {
        console.log(`Calling contract endAuction for auction ${auctionId}`);
         // Assuming your contract has an endAuction function that takes auctionId
         // This function in the contract should typically:
         // 1. Check if msg.sender is the seller.
         // 2. Check if auction.endTime has passed (using block.timestamp).
         // 3. Transfer NFT to winner or back to seller.
         // 4. Transfer the final bid amount to the seller (minus fees, if any).
         // 5. Mark the auction as ended in the contract's state.
        const tx = await auctionContract.auctionEnd(auctionId);

        console.log("Sending end auction transaction:", tx.hash);
        // Wait for the transaction to be mined and confirmed
        const receipt = await tx.wait();
        console.log("End auction transaction successful:", receipt);

         // Return the transaction receipt upon success
        return receipt;

    } catch (error: any) { // Use 'any' to easily access error properties like message
        console.error(`Error calling endAuction for auction ${auctionId}:`, error);

        // You can add specific error message checks based on your contract's revert strings
        let userMessage = "Failed to end auction.";
        if (error.message) {
            if (error.message.includes("Auction not yet ended")) userMessage = "Auction time has not expired yet.";
            if (error.message.includes("Only the seller can end their auction")) userMessage = "You are not the seller of this auction.";
            if (error.message.includes("The auction has already ended")) userMessage = "This auction has already been ended.";
            // Add other specific contract error messages here
            else userMessage = `Failed to end auction: ${error.message}`; // Fallback to generic error message
        }
        // Re-throw the error so the UI component can handle it (e.g., show an alert)
        const finalError = new Error(userMessage);
        (finalError as any).originalError = error; // Keep original error for debugging
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
            throw new Error("Bid must be at least the starting bid.");
        }
        console.log("Sending bid transaction...");
        const bidTx = await auctionContract.bid(auctionId, {
            value: bidAmountWei
        });
        console.log("Bid transaction sent:", bidTx.hash);

        // Wait for the transaction to be mined
        const bidReceipt = await bidTx.wait();
        console.log("Bid transaction mined!");
        console.log("Bid transaction gas used:", bidReceipt.gasUsed.toString());


        // --- Get the bid details from the event (Recommended) ---
        let bidDetails = null;
        const contractInterface = auctionContract.interface;
        const highestBidIncreasedEventTopic = ethers.id("HighestBidIncreased(address,uint256,uint256)");


        for (const log of bidReceipt.logs) {
            try {
                // Try to parse the log using the contract's ABI
                const parsedLog = contractInterface.parseLog(log);

                // Check if the parsed log is the "HighestBidIncreased" event
                if (parsedLog && parsedLog.name === "HighestBidIncreased") {
                    // The arguments are (bidder, amount, auctionId)
                    const bidder = parsedLog.args[0];
                    const amount = parsedLog.args[1];
                    const eventAuctionId = parsedLog.args[2];

                    // Verify this event matches the auction we bid on
                    if (eventAuctionId.toString() === auctionId.toString()) {
                        console.log("Found HighestBidIncreased event!");
                        bidDetails = {
                            bidder: bidder,
                            amount: amount.toString(), // Store amount as string
                            auctionId: eventAuctionId.toString() // Store auction ID as string
                        };
                        break; // Found the relevant event
                    }
                }
            } catch (e) {
                // Ignore logs that don't match the event ABI
            }
        }

        if (bidDetails !== null) {
            console.log(`Bid successfully placed by ${bidDetails.bidder} for ${ethers.formatEther(bidDetails.amount)} ETH on Auction ${bidDetails.auctionId}`);
            console.log(bidDetails);
            return; // Return the bid details
        } else {
            console.warn("Bid transaction successful, but could not retrieve bid details from event logs.");
            // The transaction succeeded, so the bid *was* likely placed.
            // You might still return the receipt or just null/true.
            return;
        }


    } catch (error) {
        console.error("Error placing bid:", error);
        if (error instanceof Error) {
            // Handle errors (e.g., user rejected transaction, insufficient funds, contract reverted)
            // Contract reverts will show up here. Check error.message for revert reasons.
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
        throw error; // Re-throw the error for the component to handle
    }



    // console.log(`Simulating bid of ${bidAmount} for auction ${auctionId} by ${account}...`);
    // // In a real app: Interact with your auction smart contract (sending value with the transaction)
    // await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
    //  // Check if bid is valid in a real app (higher than current bid)
    // console.log("Bid placement simulated.");
    // // You'd typically refresh the active auctions list here
}

async function getWonAuctions(account: string, pokemonContract: ethers.Contract | null, auctionContract: ethers.Contract | null): Promise<Auction[]> {
    if (!auctionContract || !account) {
        throw Error("No auction contract or user is not logged in yet");
    }
    const wonClaimableAuctions = [];

    try {
        console.log(`Getting the total number of auctions created...`);
        // Get the total number of auctions created to know the range to check
        const totalAuctionsBigInt = await auctionContract.totalAuctionsCreated();
        const totalAuctionsCount = Number(totalAuctionsBigInt); // Convert BigInt to number for loop limit (safe if count < Number.MAX_SAFE_INTEGER)
        console.log(`Total auctions created: ${totalAuctionsCount}`);

        if (totalAuctionsCount === 0) {
            console.log("No auctions created yet.");
            return [];
        }

        console.log("Iterating through ended auctions to find won and claimable ones...");

        // Iterate through all possible auction IDs from 1 up to the total created
        // console.log(totalAuctionsCount);
        for (let i = 1; i <= totalAuctionsCount; i++) {
            const auctionId = i; // Use BigInt for auction ID

            try {
                // Fetch the details for each auction ID using the public getter
                const auction = await auctionContract.auctionData(auctionId);

                if(auction.ended===true){
                    console.log(auction);
                }

                // Check the three conditions for "won and claimable":
                // 1. Auction has ended
                // 2. Target account was the highest bidder
                // 3. NFT has not been claimed yet
                // Ensure comparing addresses case-insensitively and BigInts/booleans correctly
                if (auction.ended === true &&
                    (auction.highestBidder.toLowerCase() === account.toLowerCase()||(auction.highestBid==0 && auction.seller.toLowerCase()==account.toLowerCase())) &&
                    auction.claimed === false) {
                    console.log(`Found won and claimable auction: ${auctionId.toString()}`);
                    // Add the auction details to the list
                    wonClaimableAuctions.push({
                        id: auctionId, // Store ID as string
                        seller: auction.seller,
                        endTime: Number(auction.auctionEndTime), // Convert timestamp to Date object
                        startingBid: auction.startingBi, // Convert BigInts to string
                        nft: await getPokemonNFTFromId(auction.pokemonId, pokemonContract),
                        highestBidder: auction.highestBidder,
                        currentBid: auction.highestBid,
                        ended: auction.ended,
                        claimed: auction.claimed // Include the claimed status
                        // Add other relevant fields from the struct if needed
                    });
                }

            } catch (error) {
                // This shouldn't error if totalAuctionsCreated is accurate and auction IDs are sequential,
                // unless there's a network issue or unexpected state.
                console.error(`Error fetching data for auction ID ${auctionId.toString()}:`, error);
                // Depending on error handling needs, you might decide how to proceed.
                // Logging the error and continuing is often acceptable here.
            }
        }

        console.log(`Finished checking ${totalAuctionsCount} auctions.`);
        console.log(`Found ${wonClaimableAuctions.length} won and claimable auctions for ${account}.`);

        return wonClaimableAuctions; // Return the array of matching auctions

    } catch (error) {
        console.error("Error fetching won and claimable auctions:", error);
        // Handle network errors or contract interaction issues
        throw error; // Re-throw for the component to handle
    }






    // console.log(`Simulating fetching won auctions for ${account}...`);
    // // In a real app: Query your auction contract for auctions where user is the highest bidder and auction has ended
    // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    //  const won = mockAuctions.filter(auction =>
    //     auction.highestBidder === account && auction.endTime <= Math.floor(Date.now() / 1000)
    // );
    // console.log("Won Auctions:", won);
    // return won;
}

async function claimNFT(account: string, auctionId: number, auctionContract: ethers.Contract | null): Promise<void> {
    if (!auctionContract || !account) {
        throw Error("No auction contract or user is not logged in yet");
    }
    try {
        const auctionDetails = await auctionContract.auctionData(auctionId);
        console.log(`Attempting to claim NFT for Auction ID: ${auctionId.toString()}`);

        // --- Send the Claim Transaction ---
        console.log("Sending claim NFT transaction...");
        // No 'value' is needed as this function is not payable
        // You might want to estimate gas here first
        // const estimatedGas = await auctionManagerContract.claimWonAuction.estimateGas(auctionId);
        // const gasLimit = estimatedGas * 120n / 100n; // Add a 20% buffer
        // const claimTx = await auctionManagerContract.claimWonAuction(auctionId, { gasLimit: gasLimit });
        const claimTx = await (auctionDetails.highestBid != 0 ? auctionContract.claimWonNFT(auctionId) : auctionContract.reclaimUnsoldNFT(auctionId));
        console.log("Claim transaction sent:", claimTx.hash);

        // Wait for the transaction to be mined
        const claimReceipt = await claimTx.wait();
        console.log("Claim transaction mined!");
        console.log("Claim transaction gas used:", claimReceipt?.gasUsed?.toString()); // Use optional chaining


        // --- Get the claimed Pokemon ID from the event (Recommended) ---
        let claimedPokemonId: number | null = null;
        const contractInterface = auctionContract.interface;
        // Ensure the event signature matches the one in your ABI
        const nftClaimedEventSignature = "NFTClaimed(uint256,address,uint256)";
        const nftClaimedEventTopic = ethers.id(nftClaimedEventSignature);


        console.log("Checking logs for NFTClaimed or NFTRedeemed event...");
        if (claimReceipt && claimReceipt.logs) {
            for (const log of claimReceipt.logs) {
                try {
                    // Try to parse the log using the contract's ABI
                    const parsedLog = contractInterface.parseLog(log);

                    // Check if the parsed log is the "NFTClaimed" event
                    if (parsedLog && parsedLog.name === "NFTClaimed") {
                        // The arguments are (auctionId, winner, pokemonId)
                        const eventAuctionId = parsedLog.args[0];
                        const eventWinner = parsedLog.args[1];
                        const eventPokemonId = parsedLog.args[2]; // This is the claimed Pokemon ID

                        // Verify this event matches the auction and the signer's address
                        if (eventAuctionId.toString() === auctionId.toString() &&
                            eventWinner.toLowerCase() === account.toLowerCase()) {
                            console.log("Found NFTClaimed event!");
                            claimedPokemonId = eventPokemonId;
                            console.log("Claimed Pokemon ID:", eventPokemonId.toString());
                            break; // Found the relevant event, stop searching logs
                        }
                    }

                    if (parsedLog && parsedLog.name === "NFTRedeemedBySeller") {
                        // The arguments are (auctionId, winner, pokemonId)
                        const eventAuctionId = parsedLog.args[0];
                        const eventWinner = parsedLog.args[1];
                        const eventPokemonId = parsedLog.args[2]; // This is the claimed Pokemon ID

                        // Verify this event matches the auction and the signer's address
                        if (eventAuctionId.toString() === auctionId.toString() &&
                            eventWinner.toLowerCase() === account.toLowerCase()) {
                            console.log("Found NFTClaimed event!");
                            claimedPokemonId = eventPokemonId;
                            console.log("Claimed Pokemon ID:", eventPokemonId.toString());
                            break; // Found the relevant event, stop searching logs
                        }
                    }

                } catch (e) {
                    // Ignore logs that don't match the event ABI or are from other contracts
                    // console.warn(`Could not parse log ${log.index} or it's not an NFTClaimed event from this contract:`, e);
                }
            }
        }


        if (claimedPokemonId !== null) {
            console.log(`NFT with ID ${claimedPokemonId.toString()} claimed successfully for Auction ID: ${auctionId.toString()}`);
            return; // Return the claimed Pokemon ID (as BigInt)
        } else {
            console.warn("Claim transaction succeeded, but could not find the NFTClaimed event log.");
            // The transaction succeeded, so the claim *was* likely processed.
            // Returning null indicates event not found, but the on-chain state should be updated.
            throw Error("Claim transaction successful, but could not find the NFTClaimed event log."); // Or throw
        }


    } catch (error) {
        console.error("Error claiming NFT:", error);
        if (error instanceof Error) {
            // Propagate the error or handle specific messages based on contract reverts
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
        throw error; // Re-throw the error for the component to handle
    }


    console.log(`Simulating claiming NFT for won auction ${auctionId} by ${account}...`);
    // In a real app: Interact with your auction smart contract to claim the NFT
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
    console.log("NFT claim simulated.");
    // You'd typically refresh the won auctions list here
}

async function withdrawFunds(account: string, auctionId: number, auctionContract: ethers.Contract | null): Promise<void> {
    if (!auctionContract || !account) {
        throw Error("No auction contract or user is not logged in yet");
    }
    try {
        const withdrawTx = await auctionContract.withdraw(auctionId);
        console.log("Withdraw transaction sent:", withdrawTx.hash);

        // Wait for the transaction to be mined
        const withdrawReceipt = await withdrawTx.wait();
        console.log("Withdraw transaction mined!");
        console.log("Gas used:", withdrawReceipt?.gasUsed?.toString()); // Use optional chaining


        // --- Get withdrawal details from the Event (Requires Withdrawal event in contract) ---
        let withdrawnAmount: number | null = null;
        const contractInterface = auctionContract.interface;
        // Ensure the event signature matches the one in your ABI
        const withdrawalEventSignature = "Withdrawal(address,uint256,uint256)"; // Based on proposed event
        const withdrawalEventTopic = ethers.id(withdrawalEventSignature);


        console.log("Checking logs for Withdrawal event...");
        if (withdrawReceipt && withdrawReceipt.logs) {
            for (const log of withdrawReceipt.logs) {
                try {
                    // Try to parse the log using the contract's ABI
                    const parsedLog = contractInterface.parseLog(log);

                    // Check if the parsed log is the "Withdrawal" event
                    if (parsedLog && parsedLog.name === "Withdrawal") {
                        // The arguments are (user, amount, auctionId)
                        const eventUser = parsedLog.args[0];
                        const eventAmount = parsedLog.args[1];
                        const eventAuctionId = parsedLog.args[2];

                        // Verify this event matches the auction and the signer's address
                        if (eventAuctionId.toString() === auctionId.toString() &&
                            eventUser.toLowerCase() === account.toLowerCase()) {
                            console.log("Found Withdrawal event!");
                            withdrawnAmount = eventAmount; // This is the amount withdrawn
                            console.log("Withdrawn Amount:", withdrawnAmount);
                            break; // Found the relevant event
                        }
                    }
                } catch (e) {
                    // Ignore logs that don't match the event ABI
                }
            }
        }


        if (withdrawnAmount !== null) {
            console.log(`Successfully withdrew ${ethers.formatEther(withdrawnAmount)} ETH for Auction ID: ${auctionId.toString()}`);
            // Return the auction ID and the amount withdrawn (as BigInt)
            return;
            //  return { auctionId: auctionId, amount: withdrawnAmount };
        } else {
            console.warn("Withdrawal transaction succeeded, but could not find the Withdrawal event log.");
            // The transaction succeeded, so the funds were likely transferred,
            // but event detection failed. The user should check their wallet.
            // You might return null, or just { auctionId: auctionId, amount: null }
            throw Error("Withdrawal transaction successful, but could not find the Withdrawal event log."); // Or throw
        }


    } catch (error: any) {
        console.error("Error withdrawing funds:", error);
        // Handle specific error messages from contract reverts (e.g., if send failed)
        if (error.message.includes("Withdrawal failed")) { // If you added the revert message
            console.error("Withdrawal failed during blockchain transfer.");
        } else if (error.message.includes("User denied transaction signature")) {
            console.error("Withdrawal failed: Transaction rejected by user.");
        }
        throw error; // Re-throw the error for the component to handle
    }




    console.log(`Simulating claiming outbid funds for ${account}...`);
    // In a real app: Interact with your auction contract to withdraw funds
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
    console.log("Outbid funds claim simulated.");
    // You'd typically update balance display or confirmation message
}

async function withdrawAllFunds(account:string,auctionContract:ethers.Contract|null):Promise<void>{
    if (!auctionContract || !account) {
        // Use alert for immediate user feedback for simple errors
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

    // Step 1: Iterate through all auction IDs to check for pending returns for the current user
    // This might be slow if there are many auctions.
    // A more efficient contract would allow fetching all pending returns for a user directly.
    for (let i = 1; i <= totalAuctions; i++) {
            try {
                // Use the getPendingReturn view function
                const pendingAmount: bigint = await auctionContract.getPendingReturn(i, account);

                // If the user has a pending amount greater than 0 for this auction ID
                if (pendingAmount > 0n) {
                    console.log(`Found ${ethers.formatEther(pendingAmount)} ETH pending for auction ${i}`);
                    auctionIdsWithFunds.push(i); // Add this ID to our list
                }
            } catch (error) {
                console.warn(`Could not check pending return for auction ${i}:`, error);
                // Continue the loop even if checking one auction fails
            }
    }

    // If no auctions were found with pending funds
    if (auctionIdsWithFunds.length === 0) {
        console.log("No pending funds found across all auctions for the current user.");
        // Return a success status but indicate nothing was withdrawn
        return;
    }

    console.log(`Attempting to withdraw funds from ${auctionIdsWithFunds.length} auction(s) where funds are pending.`);

    // Step 2: Call the withdraw function for each auction ID found
    // We'll execute these sequentially to avoid potential nonce issues
    const withdrawalResults: { auctionId: number; success: boolean; error?: string }[] = [];
    let successfulWithdrawals=0;
    let failedWithdrawals=0;
    for (const auctionId of auctionIdsWithFunds) {
        try {
            withdrawFunds(account,auctionId,auctionContract);
            // console.log(`Withdrawing from auction ${auctionId}...`);
            //     // Call the contract's withdraw function for the specific auction ID
            // const tx = await auctionContract.withdraw(auctionId);

            // console.log(`Sending withdrawal transaction for auction ${auctionId}:`, tx.hash);
            // const receipt = await tx.wait(); // Wait for the transaction to be mined

            // console.log(`Withdrawal transaction for auction ${auctionId} successful:`, receipt);
            // withdrawalResults.push({ auctionId, success: true });
            successfulWithdrawals++;
        } catch (error: any) {
            console.error(`Failed to withdraw from auction ${auctionId}:`, error);
                // Capture the error message for this specific withdrawal
                let errorMessage = "Transaction failed.";
                if (error.message) {
                    // You can add checks for specific revert reasons from your contract here
                    errorMessage = error.message;
                }
            failedWithdrawals++;
                // Continue to try withdrawing from other auctions even if one fails
        }
    }

    console.log("Withdrawal process complete.", withdrawalResults);

    // Summarize the results
        // const successfulWithdrawals = withdrawalResults.filter(r => r.success).length;
        // const failedWithdrawals = withdrawalResults.filter(r => !r.success).length;
        const message = `Withdrawal process finished. ${successfulWithdrawals} successful, ${failedWithdrawals} failed.`;

        // You can choose to throw an error here if *any* withdrawal failed,
        // or just return the results array and let the UI handle it.
        // Returning the results provides more detail to the calling component.
        console.log(`Failed withdrawal for ${failedWithdrawals} accounts`);
        return;
        // return { success: failedWithdrawals === 0, message: message, details: withdrawalResults };

}

// --- Mock Web3 Context Hook ---
// Simulates wallet connection and provides contract interaction functions

interface Web3ContextType {
    account: string | null;
    isConnected: boolean;
    connectWallet: () => Promise<void>;
    mintNFT?: () => Promise<PokemonNFT>;
    getOwnedNFTs?: () => Promise<PokemonNFT[]>;
    getActiveAuctions?: () => Promise<Auction[]>;
    createAuction?: (pokemonId: number, duration: number, startBid: number) => void;
    endAuction?:(auctionId:number)=>Promise<void>;
    placeBid?: (auctionId: number, bidAmount: bigint) => Promise<void>;
    getWonAuctions?: () => Promise<Auction[]>;
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

    return (
        <Web3Context.Provider
            value={{
                account,
                isConnected,
                connectWallet,
                mintNFT: isConnected && account && pokemonContract ? () => mintNFT(account, pokemonContract) : undefined,
                getOwnedNFTs: isConnected && account && pokemonContract ? () => getOwnedNFTs(account, pokemonContract) : undefined,
                getActiveAuctions: isConnected && account && auctionContract ? () => getActiveAuctions(pokemonContract, auctionContract) : undefined,
                createAuction: isConnected && account && pokemonContract && auctionContract
                    ? (pokemonId, duration, startBid) => createAuction(account, pokemonId, duration, startBid, pokemonContract, auctionContract)
                    : undefined,
                placeBid: isConnected && account && auctionContract
                    ? (auctionId, bidAmount) => placeBid(account, auctionId, bidAmount, auctionContract)
                    : undefined,
                endAuction: isConnected && account && auctionContract
                    ? (auctionId)=>endAuction(account,auctionId,auctionContract)
                    :undefined,
                getWonAuctions: isConnected && account && pokemonContract && auctionContract
                    ? () => getWonAuctions(account, pokemonContract, auctionContract)
                    : undefined,
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

/*
export function useWeb3() {
    const [account, setAccount] = useState<string | null>(null); // Simulate a connected account
    const [isConnected, setIsConnected] = useState<boolean>(false); // Simulate being connected
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
    
    const [pokemonContract, setPokemonContract] = useState<ethers.Contract | null>(null);
    const [auctionContract, setAuctionContract] = useState<ethers.Contract | null>(null);


    // In a real app, you'd use useEffect to listen for account changes
    // and connect wallet using libraries like wagmi or web3-react
    useEffect(() => {
        console.log("useWeb3 state updated: isConnected =", isConnected, ", account =", account);
        // You could add more state variables here if needed for debugging
    }, [isConnected, account]);

    useEffect(() => {
        if (signer) {
            try {
                const pokemon = new ethers.Contract(
                    contractAddressPokemon,
                    PokemonTestABI,
                    signer
                );
                 setPokemonContract(pokemon); // Use state setter

                const auction = new ethers.Contract(
                    contractAddressAuction,
                    AuctionABI,
                    signer
                );
                 setAuctionContract(auction); // Use state setter

                console.log("Contracts set up successfully");
                // alert("Contracts set up successfully"); // Avoid alerts in effects
            } catch (error) {
                 console.error("Error setting up contracts:", error);
                 setPokemonContract(null);
                 setAuctionContract(null);
            }

        } else {
             // Clear contracts if signer is not available (e.g., disconnected)
            setPokemonContract(null);
            setAuctionContract(null);
        }
    }, [signer]); // Dependencies

    const connectWallet = async () => {
        console.log("Attempting to connect wallet..."); // Log at the start

        
        const ethereum = (window as any).ethereum;
        if (ethereum){
            try{
                const newProvider = new ethers.BrowserProvider(ethereum);
                console.log("Provider created."); // Log after provider creation

                const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
                console.log("Accounts requested:", accounts); // Log accounts
                setProvider(newProvider);
                setSigner(await newProvider.getSigner());
                setAccount(accounts[0]);
                setIsConnected(true);
                // console.log(isConnected);
                // console.log(account);
            }catch(error){
                                console.log("ConnectWallet FAILURE: State reset.");

                console.error("Error connecting",error);
            }
        }else{
            alert("Please install MetaMask!");
        }

        
        // In a real app: Trigger wallet connection (e.g., window.ethereum.request({ method: 'eth_requestAccounts' }))
        console.log("Wallet connected.");
    };
    console.log(account);
    console.log(isConnected);
    return {
        account,
        isConnected,
        connectWallet,
        mintNFT: isConnected && account && pokemonContract ? ()=> mintNFT(account,pokemonContract) : undefined,
        getOwnedNFTs: isConnected && account && pokemonContract ? () => getOwnedNFTs(account,pokemonContract) : undefined,
        getActiveAuctions: isConnected && account && auctionContract ?()=> getActiveAuctions(pokemonContract,auctionContract) : undefined,
        createAuction: isConnected && account && pokemonContract && auctionContract ? (pokemonId: number, duration: number, startBid: number) => createAuction(account, pokemonId, duration, startBid,pokemonContract,auctionContract) : undefined,
        placeBid: isConnected && account && auctionContract ? (auctionId: number, bidAmount: number) => placeBid(account, auctionId, bidAmount,auctionContract) : undefined,
        getWonAuctions: isConnected && account && pokemonContract && auctionContract ? () => getWonAuctions(account,pokemonContract,auctionContract) : undefined,
        claimNFT: isConnected && account && auctionContract && pokemonContract ? (auctionId: number) => claimNFT(account, auctionId,auctionContract) : undefined,
        claimOutbidFunds: isConnected && account && auctionContract ? (auctionId:number) => withdrawFunds(account,auctionId,auctionContract) : undefined,
    };
}
    */