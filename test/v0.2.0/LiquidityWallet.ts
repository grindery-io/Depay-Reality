import { ethers, upgrades } from "hardhat";
import { expect, use } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from 'ethers';

describe("Grindery Liquidity Wallet", () => {

    let owner: SignerWithAddress,
        user1: SignerWithAddress,
        user2: SignerWithAddress,
        grtToken: Contract,
        grtPool: Contract,
        grtSatellite: Contract,
        liquidityWallet: Contract,
        lowerLimitOffer: string,
        upperLimitOffer: string,
        idOffer: string,
        chainId: number = 31337

    beforeEach(async () => {
        [owner, user1, user2] = await ethers.getSigners();
        
        grtToken = await (await ethers.getContractFactory("ERC20Sample")).deploy();
        await grtToken.deployed();

        grtSatellite = await upgrades.deployProxy(await ethers.getContractFactory(
            "contracts/v0.2.0/GrtSatellite.sol:GrtSatellite"
        ));
        await grtSatellite.deployed();
        await grtSatellite.initializeGrtOffer(grtToken.address);

        grtPool = await upgrades.deployProxy(await ethers.getContractFactory(
            "contracts/v0.2.0/GrtPool.sol:GrtPool"
        ));
        await grtPool.deployed();
        await grtPool.initializePool(grtToken.address);

        liquidityWallet = await (await ethers.getContractFactory("LiquidityWallet"))
            .connect(user1).deploy(grtPool.address, grtToken.address, grtSatellite.address);
        await liquidityWallet.deployed();

        await grtToken.connect(user1).mint(user1.address, 1000);
    });

    describe("Deposit GRT tokens", async () => {
        it("Should have funds after deposit ", async () => {
            await grtToken.connect(user1).approve(liquidityWallet.address, 100);
            await liquidityWallet.connect(user1).deposit(100);

            expect(
                await grtToken.connect(user1).balanceOf(liquidityWallet.address)
            ).to.equal(100);
        });

        it("Should increase user balance", async () => {
            await grtToken.connect(user1).approve(liquidityWallet.address, 100);
            await liquidityWallet.connect(user1).deposit(100);

            expect(
                await liquidityWallet.connect(user1).getBalance()
            ).to.equal(100)
        });
    });

    describe("Pay an offer", async () => {

        beforeEach(async function() {
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
                    [user2.address, 0]
                )
            )
       
            await grtToken.connect(user2).mint(user2.address, 1000);
            await grtToken.connect(user2).approve(grtPool.address, 100);
            await grtPool.connect(user2).stakeGRT(100);
            await grtPool.connect(user2).setOffer(
                grtToken.address,
                chainId,
                ethers.constants.AddressZero,
                upperLimitOffer,
                lowerLimitOffer
            )   
            
            await grtToken.connect(user1).transfer(grtSatellite.address, 100);
        })

        it("Non owner should be able to pay an offer", async () => {
            await expect(
                liquidityWallet.connect(user2).payOffer(idOffer, 10)
            ).to.be.revertedWith("Ownable: caller is not the owner")
        });

        it("Should fail if offer is not active", async () => {
            await grtPool.connect(user2).setIsActive(idOffer, false);

            await expect(
                liquidityWallet.connect(user1).payOffer(idOffer, 10)
            ).to.be.revertedWith("Offer is not active")
        });

        it("Should decrease user balance after offer payment", async () => {
            await grtToken.connect(user1).mint(user1.address, 1000);
            await grtToken.connect(user1).approve(liquidityWallet.address, 100);
            await liquidityWallet.connect(user1).deposit(100);

            await liquidityWallet.connect(user1).payOffer(idOffer, 10);

            expect(
                await liquidityWallet.connect(user1).getBalance()
            ).to.equal(100-10)
        });

        it("Should transfer value", async () => {
            await grtToken.connect(user1).mint(user1.address, 1000);
            await grtToken.connect(user1).approve(liquidityWallet.address, 100);
            await liquidityWallet.connect(user1).deposit(100);
            const balanceBefore = await grtToken.connect(user2).balanceOf(user2.address);

            await liquidityWallet.connect(user1).payOffer(idOffer, 10);
   
            expect(
                await grtToken.connect(user2).balanceOf(user2.address)
            ).to.equal(Number(balanceBefore) + 10)
        });

        it("Should reward user after payment", async () => {
            await grtToken.connect(user1).mint(user1.address, 1000);
            await grtToken.connect(user1).approve(liquidityWallet.address, 100);
            await liquidityWallet.connect(user1).deposit(100);
            await grtToken.connect(user1).transfer(grtSatellite.address, 100);
            const balanceBefore = await grtToken.connect(liquidityWallet.address).balanceOf(liquidityWallet.address);

            await liquidityWallet.connect(user1).payOffer(idOffer, 10);

            expect(
                await grtToken.connect(user1).balanceOf(liquidityWallet.address)
            ).to.equal(Number(balanceBefore) - 10 + 1)
        });
    });
})
