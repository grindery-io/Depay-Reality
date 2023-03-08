import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from 'ethers';

describe("Grindery Offer testings", function () {

    const chainId = 31337;

    let owner: SignerWithAddress,
        user1: SignerWithAddress,
        user2: SignerWithAddress,
        user3: SignerWithAddress,
        user4: SignerWithAddress,
        user5: SignerWithAddress,
        grtPool: Contract,
        priceTest: Contract,
        realityEth: Contract,
        chainlinkTest: Contract,
        grtToken: Contract,
        token: Contract,
        args: string,
        lowerLimitOffer: string,
        upperLimitOffer: string,
        idOffer: string,
        nonceOffer: number,
        fnPrice: string,
        grtSatellite: any;


    beforeEach(async function() {

        [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

        grtPool = await upgrades.deployProxy(await ethers.getContractFactory(
            "contracts/v0.2.0/GrtPool.sol:GrtPool"
        ));
        await grtPool.deployed();

        grtToken = await (await ethers.getContractFactory("ERC20Sample")).deploy();
        await grtToken.deployed();

        token = await (await ethers.getContractFactory("ERC20Sample")).deploy();
        await token.deployed();


        // initialize contract
        await grtPool.initializePool(grtToken.address);

        // const abi = ethers.utils.defaultAbiCoder;
        args = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "uint256"], // encode as address array
            [10, 30]
        );

        fnPrice = "setPrice(uint256,uint256)";

    });


    describe("Initialization", function () {

        it("Should set the proper owner", async function () {
            expect(
                await grtPool.owner()
            ).to.equal(owner.address);
        });

        it("Should set the proper GRT address", async function () {
            expect(
                await grtPool.getGrtAddress()
            ).to.equal(grtToken.address);
        });

        it("Non owner should not be able to modify the GRT address", async function () {
            await expect(
				grtPool.connect(user1).setGrtAddress(token.address)
			).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Owner can modify the GRT address", async function () {
            await grtPool.connect(owner).setGrtAddress(token.address);
            expect(
				await grtPool.getGrtAddress()
			).to.equal(token.address);
        });

    });


    describe("Deposit GRT and accept an offer", function () {

        beforeEach(async function() {
            await grtToken.connect(user1).mint(user1.address, 10000);
            await grtToken.connect(user1).approve(grtPool.address, 500);
            await grtToken.connect(user2).mint(user2.address, 10000);
            await grtToken.connect(user2).approve(grtPool.address, 500);
            upperLimitOffer = ethers.utils.defaultAbiCoder.encode(
                ["string", "uint256"],
                ["https://api.coingecko.com/api/v3/coins/FIRA", 1000]
            );
            lowerLimitOffer = ethers.utils.defaultAbiCoder.encode(
                ["string", "uint256"],
                ["https://api.coingecko.com/api/v3/coins/FIRA", 100]
            );
            idOffer = ethers.utils.keccak256(
                ethers.utils.solidityPack(
                    ["address", "uint256"],
                    [user1.address, 0]
                )
            );
            await grtPool.connect(user1).stakeGRT(10, chainId);
            await grtPool.connect(user1).setOffer(
                token.address,
                chainId,
                ethers.constants.AddressZero,
                upperLimitOffer,
                lowerLimitOffer
            );
        });

        it("Should fail if the allowance is not high enough", async function () {
            await expect(
                grtPool.connect(user3).depositGRTWithOffer(
                    100,
                    idOffer,
                    user3.address
                )
            ).to.be.revertedWith("ERC20: insufficient allowance");
        });

        it("Should fail if the offer is inactive", async function () {
            await grtPool.connect(user1).setIsActive(idOffer, false);
            await expect(
                grtPool.connect(user3).depositGRTWithOffer(
                    100,
                    idOffer,
                    user2.address
                )
            ).to.be.revertedWith("the offer is inactive");
        });

        it("Should fail if the destination address is the zero address", async function () {
            await grtPool.connect(user1).setIsActive(idOffer, false);
            await expect(
                grtPool.connect(user3).depositGRTWithOffer(
                    100,
                    idOffer,
                    ethers.constants.AddressZero
                )
            ).to.be.revertedWith("zero address as destination address");
        });

        it("Should emit a new trade event", async function () {
            await expect(
                await grtPool.connect(user2).depositGRTWithOffer(
                    100,
                    idOffer,
                    user2.address
                )
            ).to.emit(grtPool, "LogTrade").withArgs(
                ethers.utils.keccak256(
                    ethers.utils.solidityPack(
                        ["address", "uint256"],
                        [user2.address, 0]
                    ),
                ),
                grtToken.address,
                100,
                idOffer
            );
        });

        it("Should set the deposit user", async function () {
            await grtPool.connect(user2).depositGRTWithOffer(
                100,
                idOffer,
                user2.address
            );
            expect(
                await grtPool.getRequester(
                    ethers.utils.keccak256(
                        ethers.utils.solidityPack(
                            ["address", "uint256"],
                            [user2.address, 0]
                        )
                    )
                )
            ).to.equal(user2.address);
        });

        it("Should set the destination address", async function () {
            await grtPool.connect(user2).depositGRTWithOffer(
                100,
                idOffer,
                user4.address
            );
            expect(
                await grtPool.getRecipient(
                    ethers.utils.keccak256(
                        ethers.utils.solidityPack(
                            ["address", "uint256"],
                            [user2.address, 0]
                        )
                    )
                )
            ).to.equal(user4.address);
        });

        it("Should set the GRT token address for the deposit", async function () {
            await grtPool.connect(user2).depositGRTWithOffer(
                100,
                idOffer,
                user4.address
            );
            expect(
                await grtPool.getDepositToken(
                    ethers.utils.keccak256(
                        ethers.utils.solidityPack(
                            ["address", "uint256"],
                            [user2.address, 0]
                        )
                    )
                )
            ).to.equal(grtToken.address);
        });

        it("Should set the GRT amount for the deposit", async function () {
            await grtPool.connect(user2).depositGRTWithOffer(
                100,
                idOffer,
                user4.address
            );
            expect(
                await grtPool.getDepositAmount(
                    ethers.utils.keccak256(
                        ethers.utils.solidityPack(
                            ["address", "uint256"],
                            [user2.address, 0]
                        )
                    )
                )
            ).to.equal(100);
        });

        it("Should set the chainId for the deposit", async function () {
            await grtPool.connect(user2).depositGRTWithOffer(
                100,
                idOffer,
                user4.address
            );
            expect(
                await grtPool.getDepositChainId(
                    ethers.utils.keccak256(
                        ethers.utils.solidityPack(
                            ["address", "uint256"],
                            [user2.address, 0]
                        )
                    )
                )
            ).to.equal(chainId);
        });

        it("Should set the offerId", async function () {
            await grtPool.connect(user2).depositGRTWithOffer(
                100,
                idOffer,
                user4.address
            );
            expect(
                await grtPool.getIdOffer(
                    ethers.utils.keccak256(
                        ethers.utils.solidityPack(
                            ["address", "uint256"],
                            [user2.address, 0]
                        )
                    )
                )
            ).to.equal(idOffer);
        });

        it("Should increase the deposit nonce of the user by 1", async function () {
            await grtPool.connect(user2).depositGRTWithOffer(
                100,
                idOffer,
                user4.address
            );
            await grtPool.connect(user2).depositGRTWithOffer(
                100,
                idOffer,
                user4.address
            );
            expect(
                await grtPool.getNonceDeposit(user2.address)
            ).to.equal(2);
        });

    });

});