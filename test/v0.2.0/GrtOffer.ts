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
        grtOffer: Contract,
        grtToken: Contract,
        token: Contract,
        lowerLimitOffer: string,
        upperLimitOffer: string,
        idOffer: string;

    beforeEach(async function() {

        [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

        grtOffer = await upgrades.deployProxy(await ethers.getContractFactory(
            "contracts/v0.2.0/GrtPool.sol:GrtPool"
        ));
        await grtOffer.deployed();

        grtToken = await (await ethers.getContractFactory("ERC20Sample")).deploy();
        await grtToken.deployed();

        token = await (await ethers.getContractFactory("ERC20Sample")).deploy();
        await token.deployed();

        // initialize contract
        await grtOffer.initializePool(grtToken.address);

    });


    describe("Initialization", function () {

        it("Should set the proper owner", async function () {
            expect(
                await grtOffer.owner()
            ).to.equal(owner.address);
        });

        it("Should set the proper GRT address", async function () {
            expect(
                await grtOffer.getGrtAddress()
            ).to.equal(grtToken.address);
        });

        it("Non owner should not be able to modify the GRT address", async function () {
            await expect(
				grtOffer.connect(user1).setGrtAddress(token.address)
			).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Owner can modify the GRT address", async function () {
            await grtOffer.connect(owner).setGrtAddress(token.address);
            expect(
				await grtOffer.getGrtAddress()
			).to.equal(token.address);
        });

    });

    describe("GRT staking", function () {

        beforeEach(async function() {
            await grtToken.connect(user1).mint(user1.address, 10000);
            await grtToken.connect(user1).approve(grtOffer.address, 500);
        });

        it("Should fail if the allowance is not high enough", async function () {
            await expect(
                grtOffer.connect(user1).stakeGRT(1000)
            ).to.be.revertedWith("ERC20: insufficient allowance");
        });

        it("Should decrease the GRT token balance of the user", async function () {
            await grtOffer.connect(user1).stakeGRT(10);
            expect(
              await grtToken.connect(user1).balanceOf(user1.address)
            ).to.equal(10000-10);
        });

        it("Should increase the GRT token balance of the GRT pool", async function () {
            await grtOffer.connect(user1).stakeGRT(10);
            expect(
              await grtToken.connect(user1).balanceOf(grtOffer.address)
            ).to.equal(10);
        });

        it("Should increase the GRT staked amount for the user", async function () {
            await grtOffer.connect(user1).stakeGRT(10);
            expect(
              await grtOffer.stakeOf(user1.address)
            ).to.equal(10);
        });

        it("Staking GRT should emit an event", async function () {
            await expect(await grtOffer.connect(user1).stakeGRT(10))
                .to.emit(grtOffer, "LogStake")
                .withArgs(user1.address, 10);
        });

    });


    describe("Set up an offer", function () {

        beforeEach(async function() {
            await grtToken.connect(user1).mint(user1.address, 10000);
            await grtToken.connect(user1).approve(grtOffer.address, 500);
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
            )
        });

        describe("Set up an offer with Grindery", function () {

            it("Should revert if the staking amount is not high enough", async function () {
                await expect(
                    grtOffer.connect(user1).setOffer(
                        token.address,
                        chainId,
                        ethers.constants.AddressZero,
                        upperLimitOffer,
                        lowerLimitOffer
                    )
                ).to.be.revertedWith("Not enough staked GRT to set up an offer");
            });

            it("Should set the user address for the offerer", async function () {
                await grtOffer.connect(user1).stakeGRT(10);
                await grtOffer.connect(user1).setOffer(
                    token.address,
                    chainId,
                    ethers.constants.AddressZero,
                    upperLimitOffer,
                    lowerLimitOffer
                )
                expect(
                    await grtOffer.getOfferer(idOffer)
                ).to.equal(user1.address)
            });

            it("Should set the chainId for the offer", async function () {
                await grtOffer.connect(user1).stakeGRT(10);
                await grtOffer.connect(user1).setOffer(
                    token.address,
                    chainId,
                    ethers.constants.AddressZero,
                    upperLimitOffer,
                    lowerLimitOffer
                )
                expect(
                    await grtOffer.getChainIdOffer(idOffer)
                ).to.equal(chainId)
            });

            it("Should set the token address for the offer", async function () {
                await grtOffer.connect(user1).stakeGRT(10);
                await grtOffer.connect(user1).setOffer(
                    token.address,
                    chainId,
                    ethers.constants.AddressZero,
                    upperLimitOffer,
                    lowerLimitOffer
                )
                expect(
                    await grtOffer.getTokenOffer(idOffer)
                ).to.equal(token.address)
            });

            it("Should set the zero address for the external contract used to update the price", async function () {
                await grtOffer.connect(user1).stakeGRT(10);
                await grtOffer.connect(user1).setOffer(
                    token.address,
                    chainId,
                    ethers.constants.AddressZero,
                    upperLimitOffer,
                    lowerLimitOffer
                )
                expect(
                    await grtOffer.getAddressPriceContractOffer(idOffer)
                ).to.equal(ethers.constants.AddressZero)
            });

            it("Should set the hash for the lower price limit", async function () {
                await grtOffer.connect(user1).stakeGRT(10);
                await grtOffer.connect(user1).setOffer(
                    token.address,
                    chainId,
                    ethers.constants.AddressZero,
                    upperLimitOffer,
                    lowerLimitOffer
                )
                expect(
                    await grtOffer.getLowerLimitFnHashOffer(idOffer)
                ).to.equal(ethers.utils.keccak256(
                    ethers.utils.solidityPack(
                        ["bytes"],
                        [lowerLimitOffer]
                    )
                ))
            });

            it("Should set the hash for the upper price limit", async function () {
                await grtOffer.connect(user1).stakeGRT(10);
                await grtOffer.connect(user1).setOffer(
                    token.address,
                    chainId,
                    ethers.constants.AddressZero,
                    upperLimitOffer,
                    lowerLimitOffer
                )
                expect(
                    await grtOffer.getUpperLimitFnHashOffer(idOffer)
                ).to.equal(ethers.utils.keccak256(
                    ethers.utils.solidityPack(
                        ["bytes"],
                        [upperLimitOffer]
                    )
                ))
            });

            it("Should emit an event", async function () {
                await grtOffer.connect(user1).stakeGRT(10);
                await expect(
                    await grtOffer.connect(user1).setOffer(
                        token.address,
                        chainId,
                        ethers.constants.AddressZero,
                        upperLimitOffer,
                        lowerLimitOffer
                    )
                )
                .to.emit(grtOffer, "LogNewOffer")
                .withArgs(
                    idOffer,
                    ethers.constants.AddressZero,
                    token.address,
                    chainId
                );
            });

            it("Should increase the user nonce by one", async function () {
                await grtOffer.connect(user1).stakeGRT(10);
                await grtOffer.connect(user1).setOffer(
                    token.address,
                    chainId,
                    ethers.constants.AddressZero,
                    upperLimitOffer,
                    lowerLimitOffer
                );
                expect(
                    await grtOffer.getNonceOffer(user1.address)
                ).to.equal(1);
            });

            it("Should set isActive as true", async function () {
                await grtOffer.connect(user1).stakeGRT(10);
                await grtOffer.connect(user1).setOffer(
                    token.address,
                    chainId,
                    ethers.constants.AddressZero,
                    upperLimitOffer,
                    lowerLimitOffer
                )
                expect(
                    await grtOffer.getStatusOffer(idOffer)
                ).to.equal(true)
            });

            describe("Lower limit verification", function () {

                it("Lower limit verification should return false if contract address is not correct", async function () {
                    await grtOffer.connect(user1).stakeGRT(10);
                    await grtOffer.connect(user1).setOffer(
                        token.address,
                        chainId,
                        ethers.constants.AddressZero,
                        upperLimitOffer,
                        lowerLimitOffer
                    );
                    expect(
                        await grtOffer.checkParametersLowerLimitOffer(
                            idOffer,
                            token.address,
                            ethers.utils.defaultAbiCoder.encode(
                                ["string", "uint256"],
                                ["https://api.coingecko.com/api/v3/coins/FIRA", 100]
                            )
                        )
                    ).to.equal(false);
                });

                it("Lower limit verification should return false if parameters are not correct", async function () {
                    await grtOffer.connect(user1).stakeGRT(10);
                    await grtOffer.connect(user1).setOffer(
                        token.address,
                        chainId,
                        ethers.constants.AddressZero,
                        upperLimitOffer,
                        lowerLimitOffer
                    );
                    expect(
                        await grtOffer.checkParametersLowerLimitOffer(
                            idOffer,
                            ethers.constants.AddressZero,
                            ethers.utils.defaultAbiCoder.encode(
                                ["string", "uint256"],
                                ["https://api.coingecko.com/api/v3/coins/bitcoin", 100]
                            )
                        )
                    ).to.equal(false);
                });

                it("Lower limit verification should return true if parameters are correct", async function () {
                    await grtOffer.connect(user1).stakeGRT(10);
                    await grtOffer.connect(user1).setOffer(
                        token.address,
                        chainId,
                        ethers.constants.AddressZero,
                        upperLimitOffer,
                        lowerLimitOffer
                    );
                    expect(
                        await grtOffer.checkParametersLowerLimitOffer(
                            idOffer,
                            ethers.constants.AddressZero,
                            ethers.utils.defaultAbiCoder.encode(
                                ["string", "uint256"],
                                ["https://api.coingecko.com/api/v3/coins/FIRA", 100]
                            )
                        )
                    ).to.equal(true);
                });

            });

            describe("Upper limit verification", function () {

                it("Upper limit verification should return false if contract address is not correct", async function () {
                    await grtOffer.connect(user1).stakeGRT(10);
                    await grtOffer.connect(user1).setOffer(
                        token.address,
                        chainId,
                        ethers.constants.AddressZero,
                        upperLimitOffer,
                        lowerLimitOffer
                    );
                    expect(
                        await grtOffer.checkParametersUpperLimitOffer(
                            idOffer,
                            token.address,
                            ethers.utils.defaultAbiCoder.encode(
                                ["string", "uint256"],
                                ["https://api.coingecko.com/api/v3/coins/FIRA", 1000]
                            )
                        )
                    ).to.equal(false);
                });

                it("Upper limit verification should return false if parameters are not correct", async function () {
                    await grtOffer.connect(user1).stakeGRT(10);
                    await grtOffer.connect(user1).setOffer(
                        token.address,
                        chainId,
                        ethers.constants.AddressZero,
                        upperLimitOffer,
                        lowerLimitOffer
                    );
                    expect(
                        await grtOffer.checkParametersUpperLimitOffer(
                            idOffer,
                            ethers.constants.AddressZero,
                            ethers.utils.defaultAbiCoder.encode(
                                ["string", "uint256"],
                                ["https://api.coingecko.com/api/v3/coins/bitcoin", 1000]
                            )
                        )
                    ).to.equal(false);
                });

                it("Upper limit verification should return true if parameters are correct", async function () {
                    await grtOffer.connect(user1).stakeGRT(10);
                    await grtOffer.connect(user1).setOffer(
                        token.address,
                        chainId,
                        ethers.constants.AddressZero,
                        upperLimitOffer,
                        lowerLimitOffer
                    );
                    expect(
                        await grtOffer.checkParametersUpperLimitOffer(
                            idOffer,
                            ethers.constants.AddressZero,
                            ethers.utils.defaultAbiCoder.encode(
                                ["string", "uint256"],
                                ["https://api.coingecko.com/api/v3/coins/FIRA", 1000]
                            )
                        )
                    ).to.equal(true);
                });

            });

        });

        describe("Modify an offer", function () {

            beforeEach(async function() {
                await grtToken.connect(user1).mint(user1.address, 10000);
                await grtToken.connect(user1).approve(grtOffer.address, 500);
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
                )

                await grtOffer.connect(user1).stakeGRT(10);
                await grtOffer.connect(user1).setOffer(
                    token.address,
                    chainId,
                    ethers.constants.AddressZero,
                    upperLimitOffer,
                    lowerLimitOffer
                )
            });



        });
    });

});