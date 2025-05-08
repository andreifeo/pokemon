// test/AuctionManager.test.js
const {
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const {
    anyValue
} = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const {
    expect
} = require("chai");
const {
    ethers
} = require("hardhat");

describe("AuctionManager", function() {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset every test to that snapshot.
    async function deployAuctionManagerFixture() {
        // Get signers
        const [owner, seller, bidder1, bidder2, buyer] = await ethers.getSigners();

        // Deploy PokemonTest (ERC721) contract
        const PokemonTest = await ethers.getContractFactory("PokemonTest");
        const pokemonContract = await PokemonTest.deploy();
        await pokemonContract.waitForDeployment();
        const pokemonContractAddress = await pokemonContract.getAddress();

        // Deploy AuctionManager contract
        const AuctionManager = await ethers.getContractFactory("AuctionManager");
        const auctionManager = await AuctionManager.deploy(pokemonContractAddress);
        await auctionManager.waitForDeployment();

        // Mint tokens to the seller
        const tokenId1 = 1;
        const tokenId2 = 2;
        const tokenId3 = 3;
        const tokenId4 = 4;
        await pokemonContract.connect(owner).mint(seller.address);
        await pokemonContract.connect(owner).mint(seller.address);
        await pokemonContract.connect(owner).mint(seller.address);
        await pokemonContract.connect(owner).mint(seller.address);


        return {
            auctionManager,
            pokemonContract,
            owner,
            seller,
            bidder1,
            bidder2,
            buyer,
            tokenId1,
            tokenId2,
            tokenId3,
            tokenId4
        };
    }

    describe("Deployment", function() {
        it("Should deploy correctly and set the PokemonTest address", async function() {
            const {
                auctionManager,
                pokemonContract
            } = await loadFixture(deployAuctionManagerFixture);

            expect(await auctionManager.pokemonContract()).to.equal(await pokemonContract.getAddress());
        });
    });

    describe("NFT Setup", function() {
        it("Seller should own the minted tokens", async function() {
            const {
                pokemonContract,
                seller,
                tokenId1,
                tokenId2
            } = await loadFixture(deployAuctionManagerFixture);

            expect(await pokemonContract.ownerOf(tokenId1)).to.equal(seller.address);
            expect(await pokemonContract.ownerOf(tokenId2)).to.equal(seller.address);
        });

        it("Seller should be able to approve the AuctionManager", async function() {
            const {
                pokemonContract,
                seller,
                auctionManager,
                tokenId1
            } = await loadFixture(deployAuctionManagerFixture);

            await pokemonContract.connect(seller).approve(await auctionManager.getAddress(), tokenId1);

            expect(await pokemonContract.getApproved(tokenId1)).to.equal(await auctionManager.getAddress());
        });
    });


    describe("Auction Creation", function() {
        const duration = 60 * 60; // 1 hour
        const startingBid = ethers.parseEther("1");

        it("Should allow seller to create an auction after approval", async function() {
            const {
                auctionManager,
                pokemonContract,
                seller,
                tokenId1
            } = await loadFixture(deployAuctionManagerFixture);

            // Approve the manager first
            await pokemonContract.connect(seller).approve(await auctionManager.getAddress(), tokenId1);

            // Create the auction
            await expect(auctionManager.connect(seller).create(duration, startingBid, tokenId1, false))
                .to.emit(auctionManager, "AuctionCreated")
                .withArgs(1, seller.address, tokenId1, anyValue, startingBid); // Use anyValue for auctionEndTime as it's dynamic

            // Check if the NFT was transferred to the auction manager contract
            expect(await pokemonContract.ownerOf(tokenId1)).to.equal(await auctionManager.getAddress());

            // Check auction details
            const auction = await auctionManager.auctionData(1);
            expect(auction.seller).to.equal(seller.address);
            expect(auction.pokemonId).to.equal(tokenId1);
            expect(auction.startingBid).to.equal(startingBid);
            expect(auction.isFixedPrice).to.be.false;
            expect(auction.ended).to.be.false;
            expect(auction.claimed).to.be.false;
            expect(auction.highestBidder).to.equal(ethers.ZeroAddress);
            expect(auction.highestBid).to.equal(0);

            // Check total auctions count
            expect(await auctionManager.totalAuctionsCreated()).to.equal(1);
        });

        it("Should allow seller to create a fixed-price listing after approval", async function() {
            const {
                auctionManager,
                pokemonContract,
                seller,
                tokenId2
            } = await loadFixture(deployAuctionManagerFixture);

            const fixedPrice = ethers.parseEther("5");

            // Approve the manager first
            await pokemonContract.connect(seller).approve(await auctionManager.getAddress(), tokenId2);

            // Create the fixed price listing
            await expect(auctionManager.connect(seller).create(duration, fixedPrice, tokenId2, true))
                .to.emit(auctionManager, "AuctionCreated")
                .withArgs(1, seller.address, tokenId2, anyValue, fixedPrice); // Use anyValue for auctionEndTime

            // Check if the NFT was transferred to the auction manager contract
            expect(await pokemonContract.ownerOf(tokenId2)).to.equal(await auctionManager.getAddress());

            // Check listing details
            const auction = await auctionManager.auctionData(1); // It's still stored in auctionData mapping
            expect(auction.seller).to.equal(seller.address);
            expect(auction.pokemonId).to.equal(tokenId2);
            expect(auction.startingBid).to.equal(fixedPrice); // startingBid is the price for fixed price
            expect(auction.isFixedPrice).to.be.true;
            expect(auction.ended).to.be.false;
            expect(auction.claimed).to.be.false;
            expect(auction.highestBidder).to.equal(ethers.ZeroAddress);
            expect(auction.highestBid).to.equal(0);

            expect(await auctionManager.totalAuctionsCreated()).to.equal(1);
        });


        it("Should revert if caller is not the owner of the NFT", async function() {
            const {
                auctionManager,
                pokemonContract, // Needed for context but not called directly in the revert
                bidder1, // Not the owner of tokenId1
                tokenId1
            } = await loadFixture(deployAuctionManagerFixture);
        
            const duration = 60 * 60; // Define duration and startingBid locally or use constants from the describe block
            const startingBid = ethers.parseEther("1");
        
            // REMOVE THE approve() CALL HERE. The test should only attempt to call create().
            // await pokemonContract.connect(bidder1).approve(await auctionManager.getAddress(), tokenId1);
        
            // This should now hit the require in AuctionManager.create
            await expect(auctionManager.connect(bidder1).create(duration, startingBid, tokenId1, false))
                .to.be.revertedWith("You are not the owner of this Pokemon");
        });

        it("Should revert if AuctionManager is not approved for the NFT", async function() {
            const {
                auctionManager,
                seller,
                tokenId1 // Not approved
            } = await loadFixture(deployAuctionManagerFixture);

            await expect(auctionManager.connect(seller).create(duration, startingBid, tokenId1, false))
                .to.be.revertedWith("Auction manager must be approved by the owner for this token");
        });

        it("Should revert if bidding time is 0", async function() {
            const {
                auctionManager,
                pokemonContract,
                seller,
                tokenId1
            } = await loadFixture(deployAuctionManagerFixture);

            await pokemonContract.connect(seller).approve(await auctionManager.getAddress(), tokenId1);

            await expect(auctionManager.connect(seller).create(0, startingBid, tokenId1, false))
                .to.be.revertedWith("Bidding time must be greater than 0");
        });
    });


    describe("Auction Bidding (Auction Type)", function() {
        let auctionManager;
        let pokemonContract;
        let seller;
        let bidder1;
        let bidder2;
        let tokenId;
        let auctionId;
        const duration = 60 * 60; // 1 hour
        const startingBid = ethers.parseEther("1");

        beforeEach(async function() {
            const fixture = await loadFixture(deployAuctionManagerFixture);
            auctionManager = fixture.auctionManager;
            pokemonContract = fixture.pokemonContract;
            seller = fixture.seller;
            bidder1 = fixture.bidder1;
            bidder2 = fixture.bidder2;
            tokenId = fixture.tokenId3; // Use a fresh token

            // Seller approves and creates an auction
            await pokemonContract.connect(seller).approve(await auctionManager.getAddress(), tokenId);
            const createTx = await auctionManager.connect(seller).create(duration, startingBid, tokenId, false);
            const receipt = await createTx.wait();
            // Extract auctionId from the emitted event
            const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
            auctionId = event.args.auctionId;

        });

        it("Should allow a bid higher than the starting bid", async function() {
            const bidAmount = startingBid + ethers.parseEther("0.5");
            await expect(auctionManager.connect(bidder1).bid(auctionId, {
                value: bidAmount
            }))
                .to.emit(auctionManager, "HighestBidIncreased")
                .withArgs(bidder1.address, bidAmount, auctionId);

            const auction = await auctionManager.auctionData(auctionId);
            expect(auction.highestBidder).to.equal(bidder1.address);
            expect(auction.highestBid).to.equal(bidAmount);
        });

        it("Should allow a higher bid from a different bidder", async function() {
            const bid1Amount = startingBid + ethers.parseEther("0.5");
            await auctionManager.connect(bidder1).bid(auctionId, {
                value: bid1Amount
            });

            const bid2Amount = bid1Amount + ethers.parseEther("0.5");
            await expect(auctionManager.connect(bidder2).bid(auctionId, {
                value: bid2Amount
            }))
                .to.emit(auctionManager, "HighestBidIncreased")
                .withArgs(bidder2.address, bid2Amount, auctionId);

            const auction = await auctionManager.auctionData(auctionId);
            expect(auction.highestBidder).to.equal(bidder2.address);
            expect(auction.highestBid).to.equal(bid2Amount);

            // Check if previous bidder's funds are pending return
            expect(await auctionManager.getPendingReturn(auctionId, bidder1.address)).to.equal(bid1Amount);
        });

        it("Should allow a higher bid from the same bidder (replacing old bid)", async function() {
             const bid1Amount = startingBid + ethers.parseEther("0.5");
             await auctionManager.connect(bidder1).bid(auctionId, { value: bid1Amount });

             const bid2Amount = bid1Amount + ethers.parseEther("0.5");
             await expect(auctionManager.connect(bidder1).bid(auctionId, { value: bid2Amount }))
                 .to.emit(auctionManager, "HighestBidIncreased")
                 .withArgs(bidder1.address, bid2Amount, auctionId);

             const auction = await auctionManager.auctionData(auctionId);
             expect(auction.highestBidder).to.equal(bidder1.address);
             expect(auction.highestBid).to.equal(bid2Amount);

             // Check if the *first* bid amount from bidder1 is now pending return
             expect(await auctionManager.getPendingReturn(auctionId, bidder1.address)).to.equal(bid1Amount);
        });


        it("Should revert if bid is less than the starting bid", async function() {
            const bidAmount = startingBid - ethers.parseEther("0.1");
            await expect(auctionManager.connect(bidder1).bid(auctionId, {
                value: bidAmount
            }))
                .to.be.revertedWith("Bids must be higher than the starting bid");
        });

        it("Should revert if bid is not higher than the current highest bid", async function() {
            const bid1Amount = startingBid + ethers.parseEther("0.5");
            await auctionManager.connect(bidder1).bid(auctionId, {
                value: bid1Amount
            });

            const bid2Amount = bid1Amount; // Same as highest bid
            await expect(auctionManager.connect(bidder2).bid(auctionId, {
                value: bid2Amount
            }))
                .to.be.revertedWith("There is already a higher bid.");

            const bid3Amount = bid1Amount - ethers.parseEther("0.1"); // Less than highest bid
            await expect(auctionManager.connect(bidder2).bid(auctionId, {
                value: bid3Amount
            }))
                .to.be.revertedWith("There is already a higher bid.");
        });

        it("Should revert if seller attempts to bid", async function() {
            const bidAmount = startingBid + ethers.parseEther("0.5");
            await expect(auctionManager.connect(seller).bid(auctionId, {
                value: bidAmount
            }))
                .to.be.revertedWith("Seller cannot bid on their own auction");
        });

        it("Should revert if bidding after the auction end time", async function() {
            const {
                time
            } = require("@nomicfoundation/hardhat-network-helpers");
            await time.increase(duration + 1); // Advance time past the end

            const bidAmount = startingBid + ethers.parseEther("0.5");
            await expect(auctionManager.connect(bidder1).bid(auctionId, {
                value: bidAmount
            }))
                .to.be.revertedWith("Auction already ended.");
        });

        it("Should revert if bidding on a non-existent auction", async function() {
            const nonExistentAuctionId = 999;
            const bidAmount = ethers.parseEther("1");
            await expect(auctionManager.connect(bidder1).bid(nonExistentAuctionId, {
                value: bidAmount
            }))
                .to.be.revertedWith("Auction does not exist");
        });
    });

    describe("Fixed-Price Listing and Purchase (FixedPrice Type)", function() {
        let auctionManager;
        let pokemonContract;
        let seller;
        let buyer;
        let tokenId;
        let auctionId;
        const duration = 60 * 60; // 1 hour
        const fixedPrice = ethers.parseEther("5");

        beforeEach(async function() {
            const fixture = await loadFixture(deployAuctionManagerFixture);
            auctionManager = fixture.auctionManager;
            pokemonContract = fixture.pokemonContract;
            seller = fixture.seller;
            buyer = fixture.buyer;
            tokenId = fixture.tokenId4; // Use a fresh token

            // Seller approves and creates a fixed-price listing
            await pokemonContract.connect(seller).approve(await auctionManager.getAddress(), tokenId);
            const createTx = await auctionManager.connect(seller).create(duration, fixedPrice, tokenId, true);
            const receipt = await createTx.wait();
             // Extract auctionId from the emitted event (it's AuctionCreated for both)
            const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
            auctionId = event.args.auctionId;
        });

        it("Should allow a buyer to purchase at the exact fixed price", async function() {
             // Check initial state
            const initialSellerBalance = await ethers.provider.getBalance(seller.address);
            const initialBuyerBalance = await ethers.provider.getBalance(buyer.address);

            const tx = auctionManager.connect(buyer).bid(auctionId, { value: fixedPrice });

            await expect(tx)
                .to.emit(auctionManager, "HighestBidIncreased")
                .withArgs(buyer.address, fixedPrice, auctionId);

            // For fixed price, it should immediately emit AuctionEnded
             await expect(tx)
                .to.emit(auctionManager, "AuctionEnded")
                .withArgs(buyer.address, fixedPrice, auctionId);

            const listing = await auctionManager.auctionData(auctionId);
            expect(listing.highestBidder).to.equal(buyer.address);
            expect(listing.highestBid).to.equal(fixedPrice);
            expect(listing.ended).to.be.true; // Fixed price ends immediately

            // Seller's funds should be pending return immediately
            expect(await auctionManager.getPendingReturn(auctionId, seller.address)).to.equal(fixedPrice);

             // Balances haven't changed yet, funds are held in the contract's pendingReturns
            expect(await ethers.provider.getBalance(seller.address)).to.equal(initialSellerBalance);
             // Check buyer's balance change (after transaction cost)
            await expect(tx).to.changeEtherBalance(buyer, -fixedPrice);

        });

        it("Should revert if the bid amount is not exactly the fixed price", async function() {
            const bidAmountTooHigh = fixedPrice + ethers.parseEther("1");
            await expect(auctionManager.connect(buyer).bid(auctionId, {
                value: bidAmountTooHigh
            }))
                .to.be.revertedWith("The buyer should spend exactly the price of the NFT");

            const bidAmountTooLow = fixedPrice - ethers.parseEther("1");
            await expect(auctionManager.connect(buyer).bid(auctionId, {
                value: bidAmountTooLow
            }))
                .to.be.revertedWith("Bids must be higher than the starting bid");
        });

        it("Should revert if buyer attempts to purchase after the listing end time", async function() {
            const {
                time
            } = require("@nomicfoundation/hardhat-network-helpers");
            await time.increase(duration + 1); // Advance time past the end

            await expect(auctionManager.connect(buyer).bid(auctionId, {
                value: fixedPrice
            }))
                .to.be.revertedWith("Auction already ended.");
        });

        it("Should revert if seller attempts to purchase their own listing", async function() {
            await expect(auctionManager.connect(seller).bid(auctionId, {
                value: fixedPrice
            }))
                .to.be.revertedWith("Seller cannot bid on their own auction");
        });
    });


    describe("Withdrawal", function() {
        let auctionManager;
        let pokemonContract;
        let seller;
        let bidder1;
        let bidder2;
        let buyer;
        let auctionId_auction;
        let auctionId_fixedPrice;
        const duration = 60 * 60;
        const startingBid = ethers.parseEther("1");
        const fixedPrice = ethers.parseEther("5");

        beforeEach(async function() {
            const fixture = await loadFixture(deployAuctionManagerFixture);
            auctionManager = fixture.auctionManager;
            pokemonContract = fixture.pokemonContract;
            seller = fixture.seller;
            bidder1 = fixture.bidder1;
            bidder2 = fixture.bidder2;
            buyer = fixture.buyer;
            const tokenId_auction = fixture.tokenId1;
            const tokenId_fixedPrice = fixture.tokenId2;

            // --- Setup for Auction ---
            await pokemonContract.connect(seller).approve(await auctionManager.getAddress(), tokenId_auction);
            const createAuctionTx = await auctionManager.connect(seller).create(duration, startingBid, tokenId_auction, false);
            const receiptAuction = await createAuctionTx.wait();
            const eventAuction = receiptAuction.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
            auctionId_auction = eventAuction.args.auctionId;

            const bid1Amount = startingBid + ethers.parseEther("0.5");
            await auctionManager.connect(bidder1).bid(auctionId_auction, {
                value: bid1Amount
            }); // Bidder1 is outbid later

            const bid2Amount = bid1Amount + ethers.parseEther("0.5");
            await auctionManager.connect(bidder2).bid(auctionId_auction, {
                value: bid2Amount
            }); // Bidder2 is the winner

            const {
                time
            } = require("@nomicfoundation/hardhat-network-helpers");
            await time.increase(duration + 1); // End the auction
            await auctionManager.connect(seller).auctionEnd(auctionId_auction); // Seller ends auction

            // --- Setup for Fixed Price ---
            await pokemonContract.connect(seller).approve(await auctionManager.getAddress(), tokenId_fixedPrice);
            const createFixedPriceTx = await auctionManager.connect(seller).create(duration, fixedPrice, tokenId_fixedPrice, true);
            const receiptFixedPrice = await createFixedPriceTx.wait();
            const eventFixedPrice = receiptFixedPrice.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
            auctionId_fixedPrice = eventFixedPrice.args.auctionId;

            await auctionManager.connect(buyer).bid(auctionId_fixedPrice, {
                value: fixedPrice
            }); // Buyer purchases, listing ends automatically

        });

        it("Should allow a losing bidder to withdraw their pending return", async function() {
            // Bidder1 was outbid, their bid amount should be pending
            const pendingAmount = await auctionManager.getPendingReturn(auctionId_auction, bidder1.address);
            expect(pendingAmount).to.be.gt(0);
        
            // Execute the withdraw transaction and get the transaction promise
            const withdrawTxPromise = auctionManager.connect(bidder1).withdraw(auctionId_auction);
        
            // Use a separate expect to check for the emitted event on the promise
            await expect(withdrawTxPromise)
                .to.emit(auctionManager, "Withdrawal")
                .withArgs(bidder1.address, pendingAmount, auctionId_auction);
        
            // Use another separate expect to check for the balance change on the *same* promise
            await expect(withdrawTxPromise)
                .to.changeEtherBalance(bidder1, pendingAmount); // Note: changeEtherBalance accounts for gas
        
            // Check pending returns is zero after withdrawal
            expect(await auctionManager.getPendingReturn(auctionId_auction, bidder1.address)).to.equal(0);
        });

        it("Should allow the seller to withdraw funds after a successful auction", async function() {
             // Seller should have the highest bid amount pending after auctionEnd
            const pendingAmount = await auctionManager.getPendingReturn(auctionId_auction, seller.address);
            expect(pendingAmount).to.equal(await (await auctionManager.auctionData(auctionId_auction)).highestBid);
            expect(pendingAmount).to.be.gt(0);

            // Execute the withdraw transaction and get the transaction promise
        const withdrawTxPromise = auctionManager.connect(seller).withdraw(auctionId_auction);

        await expect(withdrawTxPromise)
            .to.emit(auctionManager, "Withdrawal")
            .withArgs(seller.address, pendingAmount, auctionId_auction); 

         await expect(withdrawTxPromise)
            .to.changeEtherBalance(seller, pendingAmount);


            // Check pending returns is zero after withdrawal
            expect(await auctionManager.getPendingReturn(auctionId_auction, seller.address)).to.equal(0);
        });

         it("Should allow the seller to withdraw funds after a fixed-price sale", async function() {
             // Seller should have the fixed price amount pending after the purchase
            const pendingAmount = await auctionManager.getPendingReturn(auctionId_fixedPrice, seller.address);
            expect(pendingAmount).to.equal(fixedPrice);

                const withdrawTxPromise = auctionManager.connect(seller).withdraw(auctionId_fixedPrice);

        await expect(withdrawTxPromise)
            .to.emit(auctionManager, "Withdrawal")
            .withArgs(seller.address, pendingAmount, auctionId_fixedPrice); 

         await expect(withdrawTxPromise)
            .to.changeEtherBalance(seller, pendingAmount);

            // Check pending returns is zero after withdrawal
            expect(await auctionManager.getPendingReturn(auctionId_fixedPrice, seller.address)).to.equal(0);
        });

        it("Should do nothing and return true if no funds are pending", async function() {
            // ... (Initial check for pending returns being 0) ...
            expect(await auctionManager.getPendingReturn(auctionId_auction, bidder2.address)).to.equal(0);
        
            // Execute the withdraw transaction and get the promise
            const withdrawTxPromise = auctionManager.connect(bidder2).withdraw(auctionId_auction);
        
            // Check that NO Withdrawal event is emitted (since amount == 0)
            await expect(withdrawTxPromise).to.not.emit(auctionManager, "Withdrawal");
        
            // Use changeEtherBalance to assert that the balance only changed by the gas cost (i.e., change is 0 ether)
            // changeEtherBalance correctly accounts for gas costs.
            await expect(withdrawTxPromise).to.changeEtherBalance(bidder2, 0);
        
            // Check pending returns is still zero after the transaction
            expect(await auctionManager.getPendingReturn(auctionId_auction, bidder2.address)).to.equal(0);
        });
    });

    describe("Auction Ending (Auction Type Only)", function() {
        let auctionManager;
        let pokemonContract;
        let seller;
        let bidder1;
        let auctionId_withBid;
        let auctionId_noBid;
        const duration = 60 * 60;
        const startingBid = ethers.parseEther("1");

        beforeEach(async function() {
            const fixture = await loadFixture(deployAuctionManagerFixture);
            auctionManager = fixture.auctionManager;
            pokemonContract = fixture.pokemonContract;
            seller = fixture.seller;
            bidder1 = fixture.bidder1;
            const tokenId_withBid = fixture.tokenId1;
            const tokenId_noBid = fixture.tokenId2;

            // --- Setup for Auction with Bid ---
            await pokemonContract.connect(seller).approve(await auctionManager.getAddress(), tokenId_withBid);
            const createBidAuctionTx = await auctionManager.connect(seller).create(duration, startingBid, tokenId_withBid, false);
            const receiptBidAuction = await createBidAuctionTx.wait();
            const eventBidAuction = receiptBidAuction.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
            auctionId_withBid = eventBidAuction.args.auctionId;

            const bidAmount = startingBid + ethers.parseEther("0.5");
            await auctionManager.connect(bidder1).bid(auctionId_withBid, {
                value: bidAmount
            });

            // --- Setup for Auction with No Bid ---
            await pokemonContract.connect(seller).approve(await auctionManager.getAddress(), tokenId_noBid);
            const createNoBidAuctionTx = await auctionManager.connect(seller).create(duration, startingBid, tokenId_noBid, false);
            const receiptNoBidAuction = await createNoBidAuctionTx.wait();
            const eventNoBidAuction = receiptNoBidAuction.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
            auctionId_noBid = eventNoBidAuction.args.auctionId;

            const {
                time
            } = require("@nomicfoundation/hardhat-network-helpers");
            await time.increase(duration + 1); // Advance time past the end for both
        });


        it("Should allow the seller to end an auction after the time limit (with bid)", async function() {
            const highestBid = await (await auctionManager.auctionData(auctionId_withBid)).highestBid;
            const highestBidder = await (await auctionManager.auctionData(auctionId_withBid)).highestBidder;

            await expect(auctionManager.connect(seller).auctionEnd(auctionId_withBid))
                .to.emit(auctionManager, "AuctionEnded")
                .withArgs(highestBidder, highestBid, auctionId_withBid);

            const auction = await auctionManager.auctionData(auctionId_withBid);
            expect(auction.ended).to.be.true;
            // expect(auction.pendingReturns[seller.address]).to.equal(highestBid); // Seller's cut is pending
            expect(await auctionManager.getPendingReturn(auctionId_withBid, seller.address)).to.equal(highestBid); // Use the contract getter

        });

        it("Should allow the seller to end an auction after the time limit (no bid)", async function() {
            await expect(auctionManager.connect(seller).auctionEnd(auctionId_noBid))
                .to.emit(auctionManager, "AuctionEnded")
                .withArgs(ethers.ZeroAddress, 0, auctionId_noBid); // No winner, no bid

            const auction = await auctionManager.auctionData(auctionId_noBid);
            expect(auction.ended).to.be.true;
            expect(await auctionManager.getPendingReturn(auctionId_withBid, seller.address)).to.equal(0); // Use the contract getter

            // expect(auction.pendingReturns[seller.address]).to.equal(0); // No funds for seller
        });

        it("Should revert if trying to end an auction before the time limit", async function() {
            // Load a fresh state just for this test
            const {
                auctionManager,
                pokemonContract,
                seller,
                tokenId4 // Use a fresh token from the fixture
            } = await loadFixture(deployAuctionManagerFixture);
        
            const duration = 60 * 60; // 1 hour - define duration locally or use a constant
            const startingBid = ethers.parseEther("1");
        
            // 1. Create a NEW auction within this test
            // This auction's end time will be `block.timestamp + duration`
            await pokemonContract.connect(seller).approve(await auctionManager.getAddress(), tokenId4);
            const createTx = await auctionManager.connect(seller).create(duration, startingBid, tokenId4, false);
            const receipt = await createTx.wait();
            const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
            const auctionId = event.args.auctionId; // Ensure correct ID extraction
        
            // 2. DO NOT advance time past the end.
            // You can call auctionEnd immediately after creation, as the end time is in the future.
            // Or, you can advance time partially, as your original test attempted:
            const { time } = require("@nomicfoundation/hardhat-network-helpers");
            await time.increase(duration - 10); // Advance time, but still be 10 seconds BEFORE the end
        
            // 3. Attempt to end the auction BEFORE its end time and expect it to revert
            // This should now correctly hit the require statement in the contract
            await expect(auctionManager.connect(seller).auctionEnd(auctionId))
                .to.be.revertedWith("Auction not yet ended."); // <-- This assertion should now pass
        });

        it("Should revert if a non-seller tries to end an auction", async function() {
            await expect(auctionManager.connect(bidder1).auctionEnd(auctionId_withBid))
                .to.be.revertedWith("Only the seller can end their auction");
        });

        it("Should revert if trying to end an auction that has already ended", async function() {
            await auctionManager.connect(seller).auctionEnd(auctionId_withBid); // End it once

            await expect(auctionManager.connect(seller).auctionEnd(auctionId_withBid))
                .to.be.revertedWith("The auction has already ended");
        });
    });

    describe("NFT Claiming (Winner)", function() {
        let auctionManager;
        let pokemonContract;
        let seller;
        let bidder1;
        let bidder2;
        let buyer;
        let auctionId_auction;
        let auctionId_fixedPrice;
        const duration = 60 * 60;
        const startingBid = ethers.parseEther("1");
        const fixedPrice = ethers.parseEther("5");

        beforeEach(async function() {
            const fixture = await loadFixture(deployAuctionManagerFixture);
            auctionManager = fixture.auctionManager;
            pokemonContract = fixture.pokemonContract;
            seller = fixture.seller;
            bidder1 = fixture.bidder1; // Outbid
            bidder2 = fixture.bidder2; // Winner of auction
            buyer = fixture.buyer; // Buyer of fixed price
            const tokenId_auction = fixture.tokenId1;
            const tokenId_fixedPrice = fixture.tokenId2;

            // --- Setup for Auction ---
            await pokemonContract.connect(seller).approve(await auctionManager.getAddress(), tokenId_auction);
            const createAuctionTx = await auctionManager.connect(seller).create(duration, startingBid, tokenId_auction, false);
            const receiptAuction = await createAuctionTx.wait();
            const eventAuction = receiptAuction.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
            auctionId_auction = eventAuction.args.auctionId;

            const bid1Amount = startingBid + ethers.parseEther("0.5");
            await auctionManager.connect(bidder1).bid(auctionId_auction, {
                value: bid1Amount
            });

            const bid2Amount = bid1Amount + ethers.parseEther("0.5");
            await auctionManager.connect(bidder2).bid(auctionId_auction, {
                value: bid2Amount
            }); // Bidder2 is the winner

            const {
                time
            } = require("@nomicfoundation/hardhat-network-helpers");
            await time.increase(duration + 1); // End the auction
            await auctionManager.connect(seller).auctionEnd(auctionId_auction); // Seller ends auction (required for claimed)


            // --- Setup for Fixed Price ---
            await pokemonContract.connect(seller).approve(await auctionManager.getAddress(), tokenId_fixedPrice);
            const createFixedPriceTx = await auctionManager.connect(seller).create(duration, fixedPrice, tokenId_fixedPrice, true);
            const receiptFixedPrice = await createFixedPriceTx.wait();
            const eventFixedPrice = receiptFixedPrice.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
            auctionId_fixedPrice = eventFixedPrice.args.auctionId;

            await auctionManager.connect(buyer).bid(auctionId_fixedPrice, {
                value: fixedPrice
            }); // Buyer purchases, listing ends automatically

        


        it("Should allow the auction winner to claim the NFT after the auction ends", async function() {
            expect(await pokemonContract.ownerOf(tokenId_auction)).to.equal(await auctionManager.getAddress()); // Manager owns it before claim

            await expect(auctionManager.connect(bidder2).claimWonNFT(auctionId_auction))
                .to.emit(auctionManager, "NFTClaimed")
                .withArgs(auctionId_auction, bidder2.address, tokenId_auction)
                .to.emit(auctionManager, "PokemonTransfered")
                .withArgs(auctionId_auction, tokenId_auction, await auctionManager.getAddress(), bidder2.address);

            // Check NFT ownership
            expect(await pokemonContract.ownerOf(tokenId_auction)).to.equal(bidder2.address);

            // Check claimed flag
            const auction = await auctionManager.auctionData(auctionId_auction);
            expect(auction.claimed).to.be.true;
        });
    

         it("Should allow the buyer to claim the NFT after the fixed-price listing ends", async function() {
            expect(await pokemonContract.ownerOf(tokenId_fixedPrice)).to.equal(await auctionManager.getAddress()); // Manager owns it before claim

            await expect(auctionManager.connect(buyer).claimWonNFT(auctionId_fixedPrice))
                .to.emit(auctionManager, "NFTClaimed")
                .withArgs(auctionId_fixedPrice, buyer.address, tokenId_fixedPrice)
                .to.emit(auctionManager, "PokemonTransfered")
                .withArgs(auctionId_fixedPrice, tokenId_fixedPrice, await auctionManager.getAddress(), buyer.address);

            // Check NFT ownership
            expect(await pokemonContract.ownerOf(tokenId_fixedPrice)).to.equal(buyer.address);

            // Check claimed flag
            const listing = await auctionManager.auctionData(auctionId_fixedPrice);
            expect(listing.claimed).to.be.true;
        });
    });


        it("Should revert if trying to claim before the auction ends", async function() {
             const fixture = await loadFixture(deployAuctionManagerFixture);
            const auctionManagerLive = fixture.auctionManager;
            const pokemonContractLive = fixture.pokemonContract;
            const sellerLive = fixture.seller;
            const bidder1Live = fixture.bidder1;
            const tokenIdLive = fixture.tokenId3;

            await pokemonContractLive.connect(sellerLive).approve(await auctionManagerLive.getAddress(), tokenIdLive);
            const createTx = await auctionManagerLive.connect(sellerLive).create(duration, startingBid, tokenIdLive, false);
            const receipt = await createTx.wait();
            const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
            const liveAuctionId = event.args.auctionId;

            const bidAmount = startingBid + ethers.parseEther("0.5");
            await auctionManagerLive.connect(bidder1Live).bid(liveAuctionId, {
                value: bidAmount
            }); // Make a bid

            // Time has *not* passed the end

            await expect(auctionManagerLive.connect(bidder1Live).claimWonNFT(liveAuctionId))
                .to.be.revertedWith("Auction has not ended yet.");
        });


        it("Should revert if a non-winner tries to claim the NFT", async function() {
            await expect(auctionManager.connect(bidder1).claimWonNFT(auctionId_auction)) // bidder1 was outbid
                .to.be.revertedWith("Only the highest bidder can claim.");

            await expect(auctionManager.connect(seller).claimWonNFT(auctionId_auction)) // seller is not winner
                 .to.be.revertedWith("Only the highest bidder can claim.");
        });

        it("Should revert if trying to claim an auction with no bids (no winner)", async function() {
            const fixture = await loadFixture(deployAuctionManagerFixture);
            const auctionManagerNoBid = fixture.auctionManager;
            const pokemonContractNoBid = fixture.pokemonContract;
            const sellerNoBid = fixture.seller;
            const tokenIdNoBid = fixture.tokenId3; // Use a fresh token

            await pokemonContractNoBid.connect(sellerNoBid).approve(await auctionManagerNoBid.getAddress(), tokenIdNoBid);
            const createTx = await auctionManagerNoBid.connect(sellerNoBid).create(duration, startingBid, tokenIdNoBid, false);
            const receipt = await createTx.wait();
            const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
            const auctionId_noBid = event.args.auctionId;

            const {
                time
            } = require("@nomicfoundation/hardhat-network-helpers");
            await time.increase(duration + 1); // End the auction

            await auctionManagerNoBid.connect(sellerNoBid).auctionEnd(auctionId_noBid); // End it

            await expect(auctionManagerNoBid.connect(bidder1).claimWonNFT(auctionId_noBid)) // Try to claim even with no bids
                 .to.be.revertedWith("Only the highest bidder can claim."); // Reverts because highestBidder is address(0)

             // Also check the explicit highestBidder == address(0) case if needed, although the above covers it.
             // The current code requires msg.sender == highestBidder, so claiming when highestBidder is address(0)
             // by any EOA will always revert.

        });


        it("Should revert if trying to claim the NFT twice", async function() {
            await auctionManager.connect(bidder2).claimWonNFT(auctionId_auction); // Claim once

            await expect(auctionManager.connect(bidder2).claimWonNFT(auctionId_auction))
                .to.be.revertedWith("NFT has already been claimed.");
        });
    });

    describe("NFT Reclaiming (Seller)", function() {
        let auctionManager;
        let pokemonContract;
        let seller;
        let bidder1;
        let auctionId_noBid;
        let tokenId; 
        const duration = 60 * 60;
        const startingBid = ethers.parseEther("1");

        beforeEach(async function() {
            const fixture = await loadFixture(deployAuctionManagerFixture);
            auctionManager = fixture.auctionManager;
            pokemonContract = fixture.pokemonContract;
            seller = fixture.seller;
            bidder1 = fixture.bidder1;
            const tokenId = fixture.tokenId3; // Use a fresh token

            // Seller approves and creates an auction with NO bids
            await pokemonContract.connect(seller).approve(await auctionManager.getAddress(), tokenId);
            const createTx = await auctionManager.connect(seller).create(duration, startingBid, tokenId, false);
            const receipt = await createTx.wait();
            const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
            auctionId_noBid = event.args.auctionId;

            const {
                time
            } = require("@nomicfoundation/hardhat-network-helpers");
            await time.increase(duration + 1); // Advance time past the end

            await auctionManager.connect(seller).auctionEnd(auctionId_noBid); // Seller ends auction
        });


        it("Should revert if trying to reclaim before the auction ends", async function() {
             const fixture = await loadFixture(deployAuctionManagerFixture);
            const auctionManagerLive = fixture.auctionManager;
            const pokemonContractLive = fixture.pokemonContract;
            const sellerLive = fixture.seller;
            const tokenIdLive = fixture.tokenId4;

            await pokemonContractLive.connect(sellerLive).approve(await auctionManagerLive.getAddress(), tokenIdLive);
             const createTx = await auctionManagerLive.connect(sellerLive).create(duration, startingBid, tokenIdLive, false);
            const receipt = await createTx.wait();
            const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
            const liveAuctionId = event.args.auctionId;

            // Time has *not* passed the end

            await expect(auctionManagerLive.connect(sellerLive).reclaimUnsoldNFT(liveAuctionId))
                .to.be.revertedWith("Auction has not ended yet.");
        });

        it("Should revert if a non-seller tries to reclaim the NFT", async function() {
            await expect(auctionManager.connect(bidder1).reclaimUnsoldNFT(auctionId_noBid))
                .to.be.revertedWith("Only the seller can reclaim.");
        });

        it("Should revert if trying to reclaim an auction that received bids", async function() {
             const fixture = await loadFixture(deployAuctionManagerFixture);
            const auctionManagerWithBid = fixture.auctionManager;
            const pokemonContractWithBid = fixture.pokemonContract;
            const sellerWithBid = fixture.seller;
            const bidder1WithBid = fixture.bidder1;
            const tokenIdWithBid = fixture.tokenId4; // Use a fresh token

            await pokemonContractWithBid.connect(sellerWithBid).approve(await auctionManagerWithBid.getAddress(), tokenIdWithBid);
             const createTx = await auctionManagerWithBid.connect(sellerWithBid).create(duration, startingBid, tokenIdWithBid, false);
            const receipt = await createTx.wait();
            const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
            const auctionId_withBid = event.args.auctionId;

            const bidAmount = startingBid + ethers.parseEther("0.5");
            await auctionManagerWithBid.connect(bidder1WithBid).bid(auctionId_withBid, {
                value: bidAmount
            }); // Place a bid

            const {
                time
            } = require("@nomicfoundation/hardhat-network-helpers");
            await time.increase(duration + 1); // Advance time past the end

            await auctionManagerWithBid.connect(sellerWithBid).auctionEnd(auctionId_withBid); // End it

            await expect(auctionManagerWithBid.connect(sellerWithBid).reclaimUnsoldNFT(auctionId_withBid))
                .to.be.revertedWith("Auction received bids. Use claimWonAuction instead if you are the highest bidder.");
        });

        it("Should revert if trying to reclaim the NFT twice", async function() {
            await auctionManager.connect(seller).reclaimUnsoldNFT(auctionId_noBid); // Reclaim once

            await expect(auctionManager.connect(seller).reclaimUnsoldNFT(auctionId_noBid))
                .to.be.revertedWith("NFT has already been claimed.");
        });
    });


     describe("Helper Functions", function() {
        let auctionManager;
        let pokemonContract;
        let seller;
        let bidder1;
        let auctionId;
        const duration = 60 * 60; // 1 hour
        const startingBid = ethers.parseEther("1");

         beforeEach(async function() {
            const fixture = await loadFixture(deployAuctionManagerFixture);
            auctionManager = fixture.auctionManager;
            pokemonContract = fixture.pokemonContract;
            seller = fixture.seller;
            bidder1 = fixture.bidder1;
            const tokenId = fixture.tokenId1; // Use a fresh token

            // Seller approves and creates an auction
            await pokemonContract.connect(seller).approve(await auctionManager.getAddress(), tokenId);
            const createTx = await auctionManager.connect(seller).create(duration, startingBid, tokenId, false);
            const receipt = await createTx.wait();
            const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
            auctionId = event.args.auctionId;

        });

        it("Should return 0 for pending returns before any bids or end", async function() {
            expect(await auctionManager.getPendingReturn(auctionId, bidder1.address)).to.equal(0);
            expect(await auctionManager.getPendingReturn(auctionId, seller.address)).to.equal(0);
        });

         it("Should return the correct pending return for the seller after auction ends with bids", async function() {
            const bid1Amount = startingBid + ethers.parseEther("0.5");
            await auctionManager.connect(bidder1).bid(auctionId, { value: bid1Amount });

            const { time } = require("@nomicfoundation/hardhat-network-helpers");
            await time.increase(duration + 1);
            await auctionManager.connect(seller).auctionEnd(auctionId);

            expect(await auctionManager.getPendingReturn(auctionId, seller.address)).to.equal(bid1Amount);
         });

         it("Should return the correct pending return for the seller after fixed price purchase", async function() {
             const fixture = await loadFixture(deployAuctionManagerFixture);
            const auctionManagerFixed = fixture.auctionManager;
            const pokemonContractFixed = fixture.pokemonContract;
            const sellerFixed = fixture.seller;
            const buyerFixed = fixture.buyer;
            const tokenIdFixed = fixture.tokenId2; // Use a fresh token

            const fixedPriceAmount = ethers.parseEther("5");

            await pokemonContractFixed.connect(sellerFixed).approve(await auctionManagerFixed.getAddress(), tokenIdFixed);
            const createTx = await auctionManagerFixed.connect(sellerFixed).create(duration, fixedPriceAmount, tokenIdFixed, true);
            const receipt = await createTx.wait();
            const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'AuctionCreated');
            const auctionIdFixed = event.args.auctionId;

            await auctionManagerFixed.connect(buyerFixed).bid(auctionIdFixed, { value: fixedPriceAmount });

            expect(await auctionManagerFixed.getPendingReturn(auctionIdFixed, sellerFixed.address)).to.equal(fixedPriceAmount);
         });


        it("Should return 0 for pending returns after withdrawal", async function() {
             const bid1Amount = startingBid + ethers.parseEther("0.5");
            await auctionManager.connect(bidder1).bid(auctionId, { value: bid1Amount });

            const bidder2Actual = (await ethers.getSigners())[3];
            const bid2Amount = bid1Amount + ethers.parseEther("0.5");
            await auctionManager.connect(bidder2Actual).bid(auctionId, { value: bid2Amount });

            // Bidder1 withdraws
            await auctionManager.connect(bidder1).withdraw(auctionId);

            expect(await auctionManager.getPendingReturn(auctionId, bidder1.address)).to.equal(0);
        });

        it("Should return 0 for pending returns on a non-existent auction", async function() {
            const nonExistentAuctionId = 999;
            expect(await auctionManager.getPendingReturn(nonExistentAuctionId, bidder1.address)).to.equal(0);
        });

        it("Should track the total number of auctions created", async function() {
            const { auctionManager, pokemonContract, seller, tokenId1, tokenId2 } = await loadFixture(deployAuctionManagerFixture);
             const duration = 60 * 60;
            const startingBid = ethers.parseEther("1");
            const fixedPrice = ethers.parseEther("5");

            expect(await auctionManager.totalAuctionsCreated()).to.equal(0);

            // Create auction 1
            await pokemonContract.connect(seller).approve(await auctionManager.getAddress(), tokenId1);
            await auctionManager.connect(seller).create(duration, startingBid, tokenId1, false);
            expect(await auctionManager.totalAuctionsCreated()).to.equal(1);

            // Create auction 2 (fixed price)
            await pokemonContract.connect(seller).approve(await auctionManager.getAddress(), tokenId2);
            await auctionManager.connect(seller).create(duration, fixedPrice, tokenId2, true);
            expect(await auctionManager.totalAuctionsCreated()).to.equal(2);
        });
    });

    // You might want to add reentrancy tests if you had specific payable fallback/receive
    // functions or external calls that could be exploited before the nonReentrant guard.
    // Given the current contract structure, nonReentrant on public/external payable
    // functions should prevent simple reentrancy loops.

});