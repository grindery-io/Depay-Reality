import { ethers, upgrades } from "hardhat";
import { expect, use } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from 'ethers';

describe("Grindery Liquidity Wallet", () => {

    let owner: SignerWithAddress,
        user1: SignerWithAddress,
        user2: SignerWithAddress,
        zapier: SignerWithAddress,
        grtToken: Contract,
        liquidityWallet: Contract

    beforeEach(async () => {
        [owner, user1, user2, zapier] = await ethers.getSigners();
        
        grtToken = await (await ethers.getContractFactory("ERC20Sample")).deploy();
        await grtToken.deployed();

        liquidityWallet = await (await ethers.getContractFactory("LiquidityWallet")).connect(user1).deploy();
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

    describe("Withdraw funds from Liquidity Wallet", async () => {
        it("Should fail if user balance is less than given amount", async () => {
            await grtToken.connect(user1).transfer(liquidityWallet.address, 100);

            await expect(
                liquidityWallet.connect(user1).withdraw(grtToken.address, 200)
            ).to.be.revertedWith("Insufficient balance")
        });

        it("Should pass if balance is equal given amount", async () => {
            await grtToken.connect(user1).transfer(liquidityWallet.address, 100);
            liquidityWallet.connect(user1).withdraw(grtToken.address, 100)

            expect(
                await grtToken.connect(user1).balanceOf(liquidityWallet.address)
            ).to.equal(100-100)
        });

        it("Should pass if balance is greater than given amount", async () => {
            await grtToken.connect(user1).transfer(liquidityWallet.address, 100);
            liquidityWallet.connect(user1).withdraw(grtToken.address, 50)

            expect(
                await grtToken.connect(user1).balanceOf(liquidityWallet.address)
            ).to.equal(100-50)
        });
    });

    describe("Pay an offer", async () => {
        it("Non owner should be able to pay an offer", async () => {
            await expect(
                liquidityWallet.connect(user2).payOffer(grtToken.address, user2.address, 100)
            ).to.be.revertedWith("Ownable: caller is not the owner")
        });

        it("Should pay offer", async () => {
            await grtToken.connect(user1).transfer(liquidityWallet.address, 100);
            await liquidityWallet.connect(user1).payOffer(grtToken.address, user2.address, 100)

            expect(
                await grtToken.connect(user2).balanceOf(user2.address)
            ).to.equal(100);
        });
    });

    describe("Pay an offer with Zapier automation", async () => {
        beforeEach(async () => {
            await grtToken.connect(zapier).mint(zapier.address, 1000);
        });

        xit("Should pay offer", async () => {
            await grtToken.connect(user1).transfer(liquidityWallet.address, 100);

            await grtToken.connect(zapier).approve(liquidityWallet.address, 10);
            const resp = await grtToken.connect(zapier).allowance(zapier.address, liquidityWallet.address);
    
            // console.log("resp " + resp)
            
            await liquidityWallet.connect(user1).payOfferWithZapier(grtToken.address, zapier.address, user2.address, 10);

            // expect(
            //     await grtToken.connect(user2).balanceOf(user2.address)
            // ).to.equal(100);
        });
    });
});
