// contracts/Auction.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PokemonTest.sol";
///we will have both auctions and selling at a certain price, both with a time limit
contract AuctionManager is ReentrancyGuard{
    uint256 private nextId=1;
    PokemonTest public pokemonContract;

    struct Auction{
        address payable seller;
        uint256 auctionEndTime;
        uint256 startingBid;
        uint256 pokemonId;

        address highestBidder;
        uint256 highestBid;
        bool ended;
        bool claimed;
        mapping(address=>uint256) pendingReturns;
    }

    mapping(uint256=>Auction) public auctionData;
    


    event HighestBidIncreased(address bidder,uint256 amount,uint256 auctionId);
    event AuctionEnded(address winner,uint256 amount,uint256 auctionId);
    event PokemonTransfered(uint256 auctionId,uint256 pokemonId,address from,address to);
    
    event AuctionCreated(uint256 indexed auctionId, address indexed seller, uint256 indexed pokemonId, uint256 auctionEndTime, uint256 startingBid);
    event NFTClaimed(uint256 indexed auctionId, address indexed winner, uint256 pokemonId);
    event NFTRedeemedBySeller(uint256 indexed auctionId, address indexed seller, uint256 pokemonId);
    event Withdrawal(address indexed user, uint256 amount, uint256 auctionId);

    constructor(address _pokemonContractAddress){
        pokemonContract=PokemonTest(_pokemonContractAddress);
    }

    function create(uint256 _biddingTime, uint256 _startingBid,uint256 pokemonId) public nonReentrant returns (uint256) {
        require(pokemonContract.isOwner(msg.sender,pokemonId),"You are not the owner of this Pokemon");
        require(_biddingTime>0,"Bidding time must be greater than 0");
        require(pokemonContract.isOwner(msg.sender,pokemonId));
        require(pokemonContract.getApproved(pokemonId)==address(this),"Auction manager must be approved by the owner for this token");


        // ERC721(address(pokemonContract)).approve(address(this),pokemonId);
        pokemonContract.transferFrom(msg.sender,address(this),pokemonId);

        uint256 auctionId = nextId++;
        address payable seller = payable(msg.sender);

       
        Auction storage auction = auctionData[auctionId];
        auction.seller = seller;
        auction.auctionEndTime = block.timestamp+_biddingTime;
        auction.startingBid = _startingBid;
        auction.pokemonId=pokemonId;
        auction.claimed=false;

        emit AuctionCreated(auctionId,msg.sender,pokemonId,auction.auctionEndTime,_startingBid);

        return auctionId;
    }

    function bid(uint256 auctionId) public payable nonReentrant{
        Auction storage auction=auctionData[auctionId];
        require(auction.seller!=address(0),"Auction does not exist");
        require (block.timestamp<=auction.auctionEndTime,"Auction already ended.");
        require(msg.value>auction.highestBid,"There is already a higher bid.");
        require(msg.value>=auction.startingBid,"Bids must be higher than the starting bid");
        require(msg.sender!=auction.seller,"Seller cannot bid on their own auction");

        if(auction.highestBid!=0){
            auction.pendingReturns[auction.highestBidder]+=auction.highestBid;
        }

        auction.highestBidder=msg.sender;
        auction.highestBid=msg.value;
        emit HighestBidIncreased(msg.sender,msg.value,auctionId);
    }

    function withdraw(uint256 auctionId)public nonReentrant returns(bool){
        Auction storage auction=auctionData[auctionId];
        uint256 amount=auction.pendingReturns[msg.sender];
        if(amount>0){
            auction.pendingReturns[msg.sender]=0;
            if(!payable(msg.sender).send(amount)){
                auction.pendingReturns[msg.sender]=amount;
                return false;
            }
            emit Withdrawal(msg.sender,amount,auctionId);
        }
        return true;
    }

    function auctionEnd(uint256 auctionId) public nonReentrant{
        Auction storage auction=auctionData[auctionId];
        require(msg.sender==auction.seller,"Only the seller can end their auction");
        require (block.timestamp>=auction.auctionEndTime,"Auction not yet ended.");
        require (!auction.ended,"The auction has already ended");

        auction.ended=true;
        emit AuctionEnded(auction.highestBidder,auction.highestBid,auctionId);

        if(auction.highestBid>0){
            auction.pendingReturns[auction.seller]+=auction.highestBid;
        }
    }

    function claimWonNFT(uint256 auctionId) public nonReentrant{
        Auction storage auction = auctionData[auctionId];

        // --- Requirements ---
        require(auction.seller != address(0), "Auction does not exist."); // Basic check
        require(auction.ended, "Auction has not ended yet."); // Auction must be ended
        require(msg.sender == auction.highestBidder, "Only the highest bidder can claim."); // Caller must be the winner
        require(auction.highestBidder != address(0), "No bids were placed on this auction."); // Must have been a winner
        require(!auction.claimed, "NFT has already been claimed."); // Cannot claim twice

        auction.claimed=true;
        pokemonContract.transferFrom(address(this),msg.sender,auction.pokemonId);

        emit NFTClaimed(auctionId, auction.highestBidder, auction.pokemonId);
        emit PokemonTransfered(auctionId, auction.pokemonId, address(this), msg.sender); // Can emit both
    }

    function reclaimUnsoldNFT(uint256 auctionId) public nonReentrant{
        Auction storage auction = auctionData[auctionId];

        // --- Requirements ---
        require(auction.seller != address(0), "Auction does not exist."); // Basic check
        require(auction.ended, "Auction has not ended yet."); // Auction must be ended
        require(msg.sender == auction.seller, "Only the seller can reclaim."); // Caller must be the seller
        require(auction.highestBidder == address(0), "Auction received bids. Use claimWonAuction instead if you are the highest bidder."); // Only reclaimable if NO bids were placed
        require(!auction.claimed, "NFT has already been claimed."); // Cannot reclaim twice

        auction.claimed=true;
        pokemonContract.transferFrom(address(this),msg.sender,auction.pokemonId);

        emit NFTRedeemedBySeller(auctionId, msg.sender, auction.pokemonId);
        emit PokemonTransfered(auctionId, auction.pokemonId, address(this), msg.sender);
    }

    function getPendingReturn(uint256 auctionId, address user) public view returns (uint256) {
        // Basic check if the auction exists
        if (auctionData[auctionId].seller == address(0)) {
            return 0; // Or revert, depending on desired behavior
        }
        return auctionData[auctionId].pendingReturns[user];
    }

    

    function totalAuctionsCreated() public view returns(uint256){
        return nextId-1;
    }

}