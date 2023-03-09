import { ethers, upgrades } from "hardhat";
import { expect, use } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, BigNumber } from 'ethers';

describe("Grindery Liquidity Wallet", () => {

    let owner: SignerWithAddress,
        user1: SignerWithAddress,
        user2: SignerWithAddress,
        bot: SignerWithAddress,
        bot2: SignerWithAddress,
        grtToken: Contract,
        liquidityWallet: Contract,
        grtSatellite: Contract,
        idOffer: String

    beforeEach(async () => {
        [owner, user1, user2, bot, bot2] = await ethers.getSigners();
        
        grtToken = await (await ethers.getContractFactory("ERC20Sample")).deploy();
        await grtToken.deployed();

        grtSatellite = await upgrades.deployProxy(await ethers.getContractFactory(
            "contracts/v0.2.0/GrtSatellite.sol:GrtSatellite"
        ));
        await grtSatellite.deployed();
        await grtSatellite.initializeGrtOffer(grtToken.address);

        liquidityWallet = await (await ethers.getContractFactory("LiquidityWallet"))
            .connect(user1)
            .deploy(
                grtSatellite.address,
                bot.address
            );
        await liquidityWallet.deployed();

        await grtToken.connect(user1).mint(user1.address, 1000);
    });

    describe("Transfer native tokens to Liquidity Wallet", async () => {
        it("Should receive native tokens", async () => {
            await (await user2.sendTransaction({
                to: liquidityWallet.address,
                value: 100
            })).wait();

            expect(
                await ethers.provider.getBalance(liquidityWallet.address)
            ).to.equal(100);
        });
    });

    describe("Set bot address", async () => {
        it("Non owner should be able to set bot address", async () => {
            await expect(
                liquidityWallet.connect(user2).setBot(bot.address)
            ).to.be.revertedWith("Ownable: caller is not the owner")
        });

        it("Should be able update bot address", async () => {
            await liquidityWallet.connect(user1).setBot(bot2.address)
            
            expect(
                await liquidityWallet.connect(user1).getBot()
            ).to.equal(bot2.address)
        });
    });

    describe("Set GRT Satellite address", async () => {
        it("Non owner should be able to set satellite address", async () => {
            await expect(
                liquidityWallet.connect(user2).setSatellite(grtSatellite.address)
            ).to.be.revertedWith("Ownable: caller is not the owner")
        });

        it("Should be able update satellite address", async () => {
            await liquidityWallet.connect(user1).setSatellite(bot2.address)
            
            expect(
                await liquidityWallet.connect(user1).getSatellite()
            ).to.equal(bot2.address)
        });
    });

    describe("Withdraw ERC20 funds from Liquidity Wallet", async () => {
        it("Should withdraw ERC20 funds", async () => {
            await grtToken.connect(user1).transfer(liquidityWallet.address, 100);
            
            const status = await liquidityWallet.connect(user1).withdrawERC20(grtToken.address, 100)

            expect(
                await grtToken.connect(user1).balanceOf(liquidityWallet.address)
            ).to.equal(100-100)
            expect(Boolean(status)).to.be.true
        });
    });

    describe("Withdraw Native funds from Liquidity Wallet", async () => {
        it("Should withdraw Native funds", async () => {
            await (await user2.sendTransaction({
                to: liquidityWallet.address,
                value: ethers.utils.parseEther("100")
            })).wait();

            const status = await liquidityWallet.connect(user1).withdrawNative(ethers.utils.parseEther("100"))

            expect(Boolean(status)).to.be.true
        });

        it("Should fail if balance is less than given amount", async () => {            
            await (await user2.sendTransaction({
                to: liquidityWallet.address,
                value: ethers.utils.parseEther("100")
            })).wait();

            await expect(
                liquidityWallet.connect(user1).withdrawNative(ethers.utils.parseEther("200"))
            ).to.be.revertedWith("Insufficient balance")
        });
    });

    describe("Pay ERC20 offer", async () => {
        before(async() => {
            idOffer = ethers.utils.keccak256(
                ethers.utils.solidityPack(
                    ["address", "uint256"],
                    [user1.address, 0]
                )
            );
        })

        it("Non owner should be able to pay ERC20 offer", async () => {
            await expect(
                liquidityWallet.connect(user2).payOfferERC20(idOffer, grtToken.address, user1.address, 100)
            ).to.be.revertedWith("Not allowed to pay the offer");
        });

        it("Should transfer ERC20 funds to user", async () => {
            await grtToken.connect(user1).transfer(liquidityWallet.address, 100);
            await grtToken.connect(user1).transfer(grtSatellite.address, 100);

            const status = await liquidityWallet.connect(user1).payOfferERC20(idOffer, grtToken.address, user2.address, 100);

            expect(
                (await grtToken.connect(user2).balanceOf(user2.address)).toString()
            ).to.equal("100");
            expect(Boolean(status)).to.be.true;
        });

        it("Should reward user", async () => {
            await grtToken.connect(user1).transfer(liquidityWallet.address, 100);
            await grtToken.connect(user1).transfer(grtSatellite.address, 100);

            const status = await liquidityWallet.connect(user1).payOfferERC20(idOffer, grtToken.address, user2.address, 100);
      
            expect(
                await grtToken.connect(user1).balanceOf(liquidityWallet.address)
            ).to.equal(1);
            expect(Boolean(status)).to.be.true;
        });
    });

    describe("Pay Native offer", async () => {
        before(async() => {
            idOffer = ethers.utils.keccak256(
                ethers.utils.solidityPack(
                    ["address", "uint256"],
                    [user1.address, 0]
                )
            );
        })

        it("Non owner should be able to pay Native offer", async () => {
            await expect(
                liquidityWallet.connect(user2).payOfferNative(idOffer, user1.address, 100)
            ).to.be.revertedWith("Not allowed to pay the offer");
        });

        it("Should transfer Native funds to user", async () => {
            const balanceBefore = await user2.getBalance();
            await grtToken.connect(user1).transfer(grtSatellite.address, 100);
            await (await user1.sendTransaction({
                to: liquidityWallet.address,
                value: 100
            })).wait();            
            const status = await liquidityWallet.connect(user1).payOfferNative(idOffer, user2.address, 100);
            const balanceAfter = await user2.getBalance(); 

            expect(balanceAfter).to.equal(balanceBefore.add(BigNumber.from("100")));
            expect(Boolean(status)).to.be.true;
        });

        it("Should reward user", async () => {
            await (await user1.sendTransaction({
                to: liquidityWallet.address,
                value: 100
            })).wait();     
            await grtToken.connect(user1).transfer(grtSatellite.address, 100);

            const status = await liquidityWallet.connect(user1).payOfferNative(idOffer, user2.address, 100);
      
            expect(
                await grtToken.connect(user1).balanceOf(liquidityWallet.address)
            ).to.equal(1);
            expect(Boolean(status)).to.be.true;
        });
    });
});
