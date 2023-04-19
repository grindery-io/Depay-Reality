import { ethers, upgrades } from "hardhat";
import { expect, use } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, BigNumber } from "ethers";

const protocolVersion = "v-testnet-launch";
const nameToken = "GRTToken";
const symbolToken = "GRT";

describe("Grindery Liquidity Wallet", () => {
  let owner: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress,
    minter: SignerWithAddress,
    minter2: SignerWithAddress,
    grtToken: Contract;

  beforeEach(async () => {
    [owner, user1, user2, minter, minter2] = await ethers.getSigners();

    grtToken = await upgrades.deployProxy(
      await ethers.getContractFactory(
        `contracts/${protocolVersion}/GrtTestToken.sol:GrtTestToken`
      ),
      [nameToken, symbolToken, minter.address]
    );
  });

  describe("Deployment & initialization", async () => {
    it("Should set the proper owner", async function () {
      expect(await grtToken.owner()).to.equal(owner.address);
    });

    it("Should set the proper minter address", async function () {
      expect(await grtToken.getMinter()).to.equal(minter.address);
    });

    it("Should set the proper token name", async function () {
      expect(await grtToken.name()).to.equal(nameToken);
    });

    it("Should set the proper token symbol", async function () {
      expect(await grtToken.symbol()).to.equal(symbolToken);
    });
  });

  describe("Mint token", async () => {
    it("Should return an error if msg.sender is not the minter", async function () {
      await expect(
        grtToken.connect(user1).mint(user2.address, 100)
      ).to.be.revertedWith("Caller is not the minter");
    });

    it("Should increase the total supply", async function () {
      await grtToken.connect(minter).mint(user2.address, 100);
      expect(await grtToken.totalSupply()).to.equal(100);
    });

    it("Should increase the user balance", async function () {
      await grtToken.connect(minter).mint(user2.address, 100);
      expect(await grtToken.balanceOf(user2.address)).to.equal(100);
    });
  });

  describe("Burn token", async () => {
    beforeEach(async () => {
      await grtToken.connect(minter).mint(user2.address, 100);
    });

    it("Should return an error if msg.sender is not the minter", async function () {
      await expect(
        grtToken.connect(user1).burn(user2.address, 100)
      ).to.be.revertedWith("Caller is not the minter");
    });

    it("Should decrease the total supply", async function () {
      await grtToken.connect(minter).burn(user2.address, 10);
      expect(await grtToken.totalSupply()).to.equal(100 - 10);
    });

    it("Should decrease the user balance", async function () {
      await grtToken.connect(minter).burn(user2.address, 10);
      expect(await grtToken.balanceOf(user2.address)).to.equal(100 - 10);
    });
  });

  describe("Modify minter", async () => {
    it("Should return an error if msg.sender is not the owner", async function () {
      await expect(
        grtToken.connect(user1).setMinter(user2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should modify the minter", async function () {
      await grtToken.connect(owner).setMinter(user2.address);
      expect(await grtToken.getMinter()).to.equal(user2.address);
    });
  });
});
