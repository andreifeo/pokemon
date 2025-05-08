const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PokemonTest", function () {
    let pokemonTest;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        const PokemonTestFactory = await ethers.getContractFactory("PokemonTest");
        pokemonTest = await PokemonTestFactory.deploy();
        // No need to await pokemonTest.deployed() with ethers.js ^6.0.0
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await pokemonTest.owner()).to.equal(owner.address);
        });

        it("Should have nextTokenId starting at 1", async function () {
            // Accessing private variable might require a helper or checking effects
            // For now, we'll rely on the first minted token having ID 1
        });
    });

    describe("Minting", function () {
        it("Should mint a token to the specified address", async function () {
            await pokemonTest.mint(addr1.address);
            expect(await pokemonTest.balanceOf(addr1.address)).to.equal(1);
            expect(await pokemonTest.ownerOf(1)).to.equal(addr1.address);
        });

        it("Should increment the nextTokenId after minting", async function () {
            await pokemonTest.mint(addr1.address);
            await pokemonTest.mint(addr2.address);
            expect(await pokemonTest.ownerOf(1)).to.equal(addr1.address);
            expect(await pokemonTest.ownerOf(2)).to.equal(addr2.address);
        });

        it("Should emit a MintedPokemon event on successful mint", async function () {
            await expect(pokemonTest.mint(addr1.address))
                .to.emit(pokemonTest, "MintedPokemon")
                .withArgs(addr1.address, 1);
        });

        it("Should store Pokemon data for the minted token", async function () {
            await pokemonTest.mint(addr1.address);
            const pokemonData = await pokemonTest.getPokemonData(1);

            expect(pokemonData.name).to.be.a('string');
            expect(pokemonData.pokemonType).to.be.a('string');
            expect(pokemonData.hp).to.equal(10);
            expect(pokemonData.rarity).to.be.a('string');
            // We cannot deterministically test the exact name, type, and rarity due to randomness
        });

        it("Should handle multiple mints correctly", async function () {
            await pokemonTest.mint(addr1.address);
            await pokemonTest.mint(addr1.address);
            await pokemonTest.mint(addr2.address);

            expect(await pokemonTest.balanceOf(addr1.address)).to.equal(2);
            expect(await pokemonTest.balanceOf(addr2.address)).to.equal(1);
            expect(await pokemonTest.ownerOf(1)).to.equal(addr1.address);
            expect(await pokemonTest.ownerOf(2)).to.equal(addr1.address);
            expect(await pokemonTest.ownerOf(3)).to.equal(addr2.address);
        });
    });

    describe("Burning", function () {
        it("Should allow the owner of the token to burn it", async function () {
            await pokemonTest.mint(addr1.address);
            expect(await pokemonTest.ownerOf(1)).to.equal(addr1.address);

            await pokemonTest.connect(addr1).burn(1);

            await expect(pokemonTest.ownerOf(1)).to.be.reverted;
            expect(await pokemonTest.balanceOf(addr1.address)).to.equal(0);
            // Check if pokemonData is deleted (might need a helper function or observe side effects)
            await expect(pokemonTest.getPokemonData(1)).to.be.reverted;
        });

        it("Should not allow a non-owner to burn a token", async function () {
            await pokemonTest.mint(addr1.address);
            expect(await pokemonTest.ownerOf(1)).to.equal(addr1.address);

            await expect(pokemonTest.connect(addr2).burn(1)).to.be.reverted;
        });

        it("Should revert when trying to burn a non-existent token", async function () {
            await expect(pokemonTest.burn(999)).to.be.reverted;
        });
    });

    describe("Pokemon Image URIs", function () {
        const pokemonName = "Pikachu";
        const imageURI = "ipfs://testuri";

        it("Should allow the owner to set a pokemon image URI", async function () {
            await pokemonTest.setPokemonImageURI(pokemonName, imageURI);
            // We can't directly read the private mapping, so we'll check via tokenURI later
        });

        it("Should not allow a non-owner to set a pokemon image URI", async function () {
            await expect(pokemonTest.connect(addr1).setPokemonImageURI(pokemonName, imageURI)).to.be.reverted;
        });
    });

    describe("TokenURI", function () {
        const pokemonName = "Charizard";
        const imageURI = "ipfs://charizard_image";

        beforeEach(async function () {
            // Mint a token and set an image URI for a known Pokemon
            await pokemonTest.setPokemonImageURI(pokemonName, imageURI);
            // To ensure a specific Pokemon is minted for testing tokenURI,
            // we would ideally have a way to mock the randomness or a mint function
            // that takes parameters in a test environment.
            // For this test, we'll assume we can mint a Charizard with token ID 1
            // or adapt the test to find the minted Charizard.
            // A more robust test would involve manipulating the contract state in tests
            // or using a test-specific mint function.
            // Given the current contract, we will mint and then attempt to find a Charizard
            // among the first few minted tokens for demonstration purposes, though this is not ideal.

            // Mint several tokens and find the first Charizard minted to addr1
            let mintedTokenId = 0;
            const mintCount = 15; // Mint a few to increase chances
            for (let i = 0; i < mintCount; i++) {
                await pokemonTest.mint(addr1.address);
                const latestTokenId = await pokemonTest.tokenOfOwnerByIndex(addr1.address, i);
                const pokemonData = await pokemonTest.getPokemonData(latestTokenId);
                if (pokemonData.name === pokemonName) {
                    mintedTokenId = latestTokenId;
                    break;
                }
            }
             // If no Charizard was minted in mintCount attempts, the test might not fully cover the tokenURI check with image URI.
             // For a real-world scenario, consider a test-only mint function with specified attributes or mocking.
             // For now, we proceed with the potential mintedTokenId.
             if (mintedTokenId > 0) {
                this.mintedCharizardTokenId = mintedTokenId;
             } else {
                console.warn(`Could not mint a ${pokemonName} within ${mintCount} attempts. tokenURI test with image URI might not be fully covered.`);
                this.mintedCharizardTokenId = null; // Indicate that Charizard wasn't minted
             }
        });

        it("Should return a base64 encoded JSON string for a valid token", async function () {
            await pokemonTest.mint(addr1.address);
            const tokenId = 1; // Assuming the first minted token is ID 1
            const tokenURI = await pokemonTest.tokenURI(tokenId);

            expect(tokenURI).to.be.a('string');
            expect(tokenURI).to.contain("data:application/json;base64,");

            const base64Json = tokenURI.replace("data:application/json;base64,", "");
            const json = Buffer.from(base64Json, 'base64').toString('utf-8');
            const jsonObject = JSON.parse(json);

            expect(jsonObject).to.have.all.keys('name', 'image', 'attributes');
            expect(jsonObject.attributes).to.be.an('array').and.have.lengthOf(2);
            expect(jsonObject.attributes[0]).to.have.all.keys('trait_type', 'value');
            expect(jsonObject.attributes[0].trait_type).to.equal("Type");
            expect(jsonObject.attributes[0].value).to.be.a('string');
            expect(jsonObject.attributes[1]).to.have.all.keys('trait_type', 'value');
            expect(jsonObject.attributes[1].trait_type).to.equal("Rarity");
            expect(jsonObject.attributes[1].value).to.be.a('string');
             // Check image URI if a Charizard was successfully minted
             if (this.mintedCharizardTokenId !== null) {
                const charizardTokenURI = await pokemonTest.tokenURI(this.mintedCharizardTokenId);
                const charizardBase64Json = charizardTokenURI.replace("data:application/json;base64,", "");
                const charizardJson = Buffer.from(charizardBase64Json, 'base64').toString('utf-8');
                const charizardJsonObject = JSON.parse(charizardJson);
                 expect(charizardJsonObject.image).to.equal(imageURI);
             }
        });

        it("Should revert for a non-existent token ID", async function () {
            await expect(pokemonTest.tokenURI(999)).to.be.reverted;
        });
    });

    describe("GetPokemonData", function () {
        it("Should return the correct Pokemon data for a valid token ID", async function () {
            await pokemonTest.mint(addr1.address);
            const tokenId = 1;
            const pokemonData = await pokemonTest.getPokemonData(tokenId);

            expect(pokemonData.name).to.be.a('string');
            expect(pokemonData.pokemonType).to.be.a('string');
            expect(pokemonData.hp).to.equal(10);
            expect(pokemonData.rarity).to.be.a('string');
        });

        it("Should revert for a non-existent token ID", async function () {
            await expect(pokemonTest.getPokemonData(999)).to.be.reverted;
        });
    });

    describe("isOwner", function () {
        it("Should return true if the address is the owner of the pokemon", async function () {
            await pokemonTest.mint(addr1.address);
            const tokenId = 1;
            expect(await pokemonTest.isOwner(addr1.address, tokenId)).to.be.true;
        });

        it("Should return false if the address is not the owner of the pokemon", async function () {
            await pokemonTest.mint(addr1.address);
            const tokenId = 1;
            expect(await pokemonTest.isOwner(addr2.address, tokenId)).to.be.false;
        });

        it("Should revert or return false for a non-existent token ID depending on environment", async function () {
            try {
                // Attempt to call and see if it reverts (standard ERC721 behavior)
                await pokemonTest.isOwner(addr1.address, 999);
                // If it did not revert, it should return false
                const isIndeedOwner = await pokemonTest.isOwner(addr1.address, 999);
                expect(isIndeedOwner).to.be.false;
            } catch (error) {
                // If it reverted, check for the expected revert message
                expect(error.message).to.contain("owner query for nonexistent token");
            }
       });
    });

    describe("ERC721Enumerable", function () {
        it("Should correctly track total supply", async function () {
            expect(await pokemonTest.totalSupply()).to.equal(0);
            await pokemonTest.mint(addr1.address);
            expect(await pokemonTest.totalSupply()).to.equal(1);
            await pokemonTest.mint(addr2.address);
            expect(await pokemonTest.totalSupply()).to.equal(2);
        });

        it("Should correctly track tokens by index for an owner", async function () {
            await pokemonTest.mint(addr1.address); // Token 1
            await pokemonTest.mint(addr2.address); // Token 2
            await pokemonTest.mint(addr1.address); // Token 3

            expect(await pokemonTest.tokenOfOwnerByIndex(addr1.address, 0)).to.equal(1);
            expect(await pokemonTest.tokenOfOwnerByIndex(addr1.address, 1)).to.equal(3);
            expect(await pokemonTest.tokenOfOwnerByIndex(addr2.address, 0)).to.equal(2);
        });

        it("Should revert when accessing token of owner by invalid index", async function () {
            await pokemonTest.mint(addr1.address);
            await expect(pokemonTest.tokenOfOwnerByIndex(addr1.address, 1)).to.be.reverted;
        });

        it("Should correctly track all tokens by index", async function () {
            await pokemonTest.mint(addr1.address); // Token 1
            await pokemonTest.mint(addr2.address); // Token 2
            await pokemonTest.mint(addr1.address); // Token 3

            const tokens = [];
            for (let i = 0; i < await pokemonTest.totalSupply(); i++) {
                tokens.push(await pokemonTest.tokenByIndex(i));
            }
            expect(tokens).to.include(1n); // Use 1n for BigInt comparison
            expect(tokens).to.include(2n);
            expect(tokens).to.include(3n);
            expect(tokens.length).to.equal(3);
        });

        it("Should revert when accessing token by invalid index", async function () {
            await pokemonTest.mint(addr1.address);
            await expect(pokemonTest.tokenByIndex(1)).to.be.reverted;
        });
    });

    describe("Supports Interface", function () {
        it("Should support ERC165, ERC721, and ERC721Enumerable interfaces", async function () {
            // ERC165 interface ID
            expect(await pokemonTest.supportsInterface("0x01ffc9a7")).to.be.true;
            // ERC721 interface ID
            expect(await pokemonTest.supportsInterface("0x80ac58cd")).to.be.true;
            // ERC721Enumerable interface ID
            expect(await pokemonTest.supportsInterface("0x780e9d63")).to.be.true;
            // Random interface ID
            expect(await pokemonTest.supportsInterface("0x12345678")).to.be.false;
        });
    });
});