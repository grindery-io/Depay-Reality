import { expect } from "chai";
import { ethers, network, upgrades } from "hardhat";
import hre from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ERC20Sample, GrtPool, RealityETH_v3_0 } from "../typechain-types";
import { hardhat } from "@wagmi/core/dist/declarations/src/constants/chains";

describe("Grindery Pool testings", function () {

  const grtChainId = 5;
  const destChainId = 6;
  const nbrRequest = 4;
  const nbrOffer = 4;
  let onChainId: number | undefined;

  let owner: SignerWithAddress,
      user1: SignerWithAddress,
      user2: SignerWithAddress,
      user3: SignerWithAddress,
      user4: SignerWithAddress,
      user5: SignerWithAddress,
      grtPool: GrtPool,
      realityEth: RealityETH_v3_0,
      grtToken: ERC20Sample,
      token: ERC20Sample;

  beforeEach(async function() {

    [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

    grtPool = await upgrades.deployProxy(
      await ethers.getContractFactory("GrtPool")
    );
    await grtPool.deployed();

    realityEth = await (
      await ethers.getContractFactory("RealityETH_v3_0")
    ).deploy();
    await realityEth.deployed();

    grtToken = await (
      await ethers.getContractFactory("ERC20Sample")
    ).deploy();
    await grtToken.deployed();

    token = await (
      await ethers.getContractFactory("ERC20Sample")
    ).deploy();
    await token.deployed();

    onChainId = hre.network.config.chainId;

    // initialize contract
    await grtPool.initializePool(grtToken.address, grtChainId, realityEth.address);

  });

  describe("GRT pool initialisation", function () {

    it("Should set the correct Owner", async function () {
      expect(await grtPool.owner()).to.equal(owner.address);
    });

    it("Should set the correct GRT token address", async function () {
      expect(await grtPool.grtAddress()).to.equal(grtToken.address);
    });

    it("Should set the correct chain ID", async function () {
      expect(await grtPool.grtChainId()).to.equal(grtChainId);
    });

    it("Should set the correct Reality smart contract address", async function () {
      expect(await grtPool.realityAddress()).to.equal(realityEth.address);
    });

  });

  describe("Staking GRT", function () {

    beforeEach(async function() {
      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
    });

    it("Should fail if the allowance is not high enough", async function () {
      await expect(
				grtPool.connect(user1).stakeGRT(1000)
			).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should decrease the GRT token balance of the user", async function () {
      await grtPool.connect(user1).stakeGRT(10);
      expect(
        await grtToken.connect(user1).balanceOf(user1.address)
      ).to.equal(10000-10);
    });

    it("Should increase the GRT token balance of the GRT pool", async function () {
      await grtPool.connect(user1).stakeGRT(10);
      expect(
        await grtToken.connect(user1).balanceOf(grtPool.address)
      ).to.equal(10);
    });

    it("Should increase the GRT staked amount for the user", async function () {
      await grtPool.connect(user1).stakeGRT(10);
      expect(
        await grtPool.stakeOf(user1.address)
      ).to.equal(10);
    });

    it("Staking GRT should emit an event", async function () {
      await expect(await grtPool.connect(user1).stakeGRT(10))
			.to.emit(grtPool, "LogStake")
			.withArgs(user1.address, 10);
    });

  });


  describe("Deposit GRT and request ERC20 tokens", function () {

    const nbrRequest = 4;

    beforeEach(async function() {
      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
    });

    it("GRT deposit should fail if the allowance is not high enough", async function () {
      await expect(
				grtPool.connect(user1).depositGRTRequestERC20(
          1000,
          token.address,
          1000,
          destChainId,
          user1.address
        )
			).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should emit a new deposit event", async function () {
      await expect(
        await grtPool.connect(user1).depositGRTRequestERC20(10, token.address, 1000, destChainId, user1.address)
      )
			.to.emit(grtPool, "LogDeposit")
			.withArgs(0, grtToken.address, 10, grtChainId);
    });

    it("Should emit a new request event", async function () {
      await expect(
        await grtPool.connect(user1).depositGRTRequestERC20(10, token.address, 1000, destChainId, user1.address)
      )
			.to.emit(grtPool, "LogRequest")
			.withArgs(0, token.address, 1000, destChainId);
    });

    it("Should increase the request counter by one", async function () {
      for (let i = 0; i < nbrRequest; i++) {
        await grtPool.connect(user1).depositGRTRequestERC20(10, token.address, 1000, destChainId, user1.address);
        expect(await grtPool.nbrRequest()).to.equal(i+1);
      }
    });

    describe("General information", function () {

      it("Should add a new item in the requests mapping with the proper requester", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestERC20(10, token.address, 1000, destChainId, user1.address);
          expect(await grtPool.getRequester(i)).to.equal(user1.address);
        }
      });

      it("Should add a new item in the requests mapping with the proper recipient address", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestERC20(10, token.address, 1000, destChainId, user2.address);
          expect(await grtPool.getRecipient(i)).to.equal(user2.address);
        }
      });

      it("Should set isRequest to true in the request mapping", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestERC20(10, token.address, 1000, destChainId, user2.address);
          expect(await grtPool.isrequest(i)).to.equal(true);
        }
      });

    });

    describe("Deposit information", function () {

      it("Should provide the correct deposit token address (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestERC20(10, token.address, 1000, destChainId, user2.address);
          expect(await grtPool.getDepositToken(i)).to.equal(grtToken.address);
        }
      });

      it("Should provide the correct deposit token amount (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestERC20(10, token.address, 1000, destChainId, user2.address);
          expect(await grtPool.getDepositAmount(i)).to.equal(10);
        }
      });

      it("Should provide the correct deposit chain Id (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestERC20(10, token.address, 1000, destChainId, user2.address);
         expect(await grtPool.getDepositChainId(i)).to.equal(grtChainId);
        }
      });

    });

    describe("Request information", function () {

      it("Should provide the correct request token address (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestERC20(10, token.address, 1000, destChainId, user2.address);
          expect(await grtPool.getRequestToken(i)).to.equal(token.address);
        }
      });

      it("Should provide the correct request token amount (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestERC20(10, token.address, 1000, destChainId, user2.address);
          expect(await grtPool.getRequestAmount(i)).to.equal(1000);
        }
      });

      it("Should provide the correct request chain Id (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestERC20(10, token.address, 1000, destChainId, user2.address);
          expect(await grtPool.getRequestChainId(i)).to.equal(destChainId);
        }
      });

    });

  });

  describe("Deposit GRT and request native tokens", function () {

    beforeEach(async function() {
      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
    });

    it("GRT deposit should fail if the allowance is not high enough", async function () {
      await expect(
				grtPool.connect(user1).depositGRTRequestNative(
          1000,
          1000,
          destChainId,
          user1.address
        )
			).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should emit a new deposit event", async function () {
      await expect(
        await grtPool.connect(user1).depositGRTRequestNative(10, 1000, destChainId, user1.address)
      )
			.to.emit(grtPool, "LogDeposit")
			.withArgs(0, grtToken.address, 10, grtChainId);
    });

    it("Should emit a new request event", async function () {
      await expect(
        await grtPool.connect(user1).depositGRTRequestNative(10, 1000, destChainId, user1.address)
      )
			.to.emit(grtPool, "LogRequest")
			.withArgs(0, ethers.constants.AddressZero, 1000, destChainId);
    });

    it("Should increase the request counter by one", async function () {
      for (let i = 0; i < nbrRequest; i++) {
        await grtPool.connect(user1).depositGRTRequestNative(10, 1000, destChainId, user1.address);
        expect(await grtPool.nbrRequest()).to.equal(i+1);
      }
    });

    describe("General information", function () {

      it("Should add a new item in the requests mapping with the proper requester", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestNative(10, 1000, destChainId, user1.address);
          expect(await grtPool.getRequester(i)).to.equal(user1.address);
        }
      });

      it("Should add a new item in the requests mapping with the proper recipient address", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestNative(10, 1000, destChainId, user2.address);
          expect(await grtPool.getRecipient(i)).to.equal(user2.address);
        }
      });

      it("Should set isRequest to true in the request mapping", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestNative(10, 1000, destChainId, user2.address);
          expect(await grtPool.isrequest(i)).to.equal(true);
        }
      });

    });

    describe("Deposit information", function () {

      it("Should provide the correct deposit token address (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestNative(10, 1000, destChainId, user2.address);
          expect(await grtPool.getDepositToken(i)).to.equal(grtToken.address);
        }
      });

      it("Should provide the correct deposit token amount (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestNative(10, 1000, destChainId, user2.address);
          expect(await grtPool.getDepositAmount(i)).to.equal(10);
        }
      });

      it("Should provide the correct deposit chain Id (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestNative(10, 1000, destChainId, user2.address);
         expect(await grtPool.getDepositChainId(i)).to.equal(grtChainId);
        }
      });

    });

    describe("Request information", function () {

      it("Should provide the correct request token address (zero address in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestNative(10, 1000, destChainId, user2.address);
          expect(await grtPool.getRequestToken(i)).to.equal(ethers.constants.AddressZero);
        }
      });

      it("Should provide the correct request token amount (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestNative(10, 1000, destChainId, user2.address);
          expect(await grtPool.getRequestAmount(i)).to.equal(1000);
        }
      });

      it("Should provide the correct request chain Id (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          await grtPool.connect(user1).depositGRTRequestNative(10, 1000, destChainId, user2.address);
          expect(await grtPool.getRequestChainId(i)).to.equal(destChainId);
        }
      });

    });

  });

  describe("Create an offer", function () {

    beforeEach(async function() {
      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
      await grtPool.connect(user1).depositGRTRequestNative(10, 1000, destChainId, user2.address);

      await grtToken.connect(user2).mint(user2.address, 40000);
      await grtToken.connect(user2).approve(grtPool.address, 2000);
      await grtPool.connect(user2).stakeGRT(2);
    });

    it("Should fail if there is no request for the provided request Id", async function () {
      await expect(
				grtPool.connect(user1).createOffer(2, 1000)
			).to.be.revertedWith("GRT pool: the request does not exist!");
    });

    it("Should fail if the user has not enough staked GRT (1 for tests)", async function () {
      await expect(
				grtPool.connect(user3).createOffer(0, 1000)
			).to.be.revertedWith("GRT pool: your stake amount is not sufficient!");
    });

    it("Should emit a new offer event", async function () {
      await expect(await grtPool.connect(user2).createOffer(0, 1000))
			.to.emit(grtPool, "LogCreateOffer")
			.withArgs(0, 0);
    });

    it("Should increase the number of offers", async function () {
      for (let i = 0; i < nbrOffer; i++) {
        await grtPool.connect(user2).createOffer(0, 1000);
        expect(await grtPool.nbrOffersRequest(0)).to.equal(i+1);
      }
    });

    describe("Mapping details", function () {

      it("Should create a new offer with the correct creator", async function () {
        for (let i = 0; i < nbrOffer; i++) {
          await grtPool.connect(user2).createOffer(0, 1000);
          expect(await grtPool.getOfferCreator(0, i)).to.equal(user2.address);
        }
      });

      it("Should create a new offer with the correct amount", async function () {
        for (let i = 0; i < nbrOffer; i++) {
          await grtPool.connect(user2).createOffer(0, 1000);
          expect(await grtPool.getOfferAmount(0, i)).to.equal(1000);
        }
      });

      it("Should create a new offer with isAccept set to false", async function () {
        for (let i = 0; i < nbrOffer; i++) {
          await grtPool.connect(user2).createOffer(0, 1000);
          expect(await grtPool.isOfferAccepted(0, i)).to.equal(false);
        }
      });

      it("Should create a new offer with isPaid set to false", async function () {
        for (let i = 0; i < nbrOffer; i++) {
          await grtPool.connect(user2).createOffer(0, 1000);
          expect(await grtPool.isOfferPaid(0, i)).to.equal(false);
        }
      });

    });

  });

  describe("Accept an offer", function () {

    beforeEach(async function() {

      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
      await grtPool.connect(user1).depositGRTRequestNative(10, 1000, destChainId, user2.address);

      await grtToken.connect(user2).mint(user2.address, 40000);
      await grtToken.connect(user2).approve(grtPool.address, 2000);
      await grtPool.connect(user2).stakeGRT(2);
      await grtPool.connect(user2).createOffer(0, 1000);

    });

    it("Should fail if idRequest doesn't exist", async function () {
      await expect(
				grtPool.connect(user1).acceptOffer(1, 0)
			).to.be.revertedWith("GRT pool: the request does not exist!");
    });

    it("Should fail if idOffer doesn't exist for the offer corresponding to idRequest", async function () {
      await expect(
				grtPool.connect(user1).acceptOffer(0, 1)
			).to.be.revertedWith("GRT pool: the offer does not exist!");
    });

    it("Should fail if the offer has already been accepted", async function () {
      await grtPool.connect(user1).acceptOffer(0, 0);
      await expect(
				grtPool.connect(user1).acceptOffer(0, 0)
			).to.be.revertedWith("GRT pool: the offer has already been accepted!");
    });

    it("Should fail if the transaction signer is not the requester", async function () {
      await expect(
				grtPool.connect(user3).acceptOffer(0, 0)
			).to.be.revertedWith("GRT pool: you are not the requester!");
    });

    it("Should fail if there is already an accepted offer for this request", async function () {
      for (let i = 0; i < nbrOffer; i++) {
        await grtPool.connect(user2).createOffer(0, 1000);
      }
      await grtPool.connect(user1).acceptOffer(0, 0);
      await expect(
				grtPool.connect(user1).acceptOffer(0, 2)
			).to.be.revertedWith("GRT pool: there is already an accepted offer for this request!");

    });

    it("Should set isAccept to true for the corresponding request Id and offer Id", async function () {
      await grtPool.connect(user1).acceptOffer(0, 0);
      expect(await grtPool.isOfferAccepted(0, 0)).to.equal(true);
    });

    it("Should emit an event for offer acceptance", async function () {
      await expect(await grtPool.connect(user1).acceptOffer(0, 0))
			.to.emit(grtPool, "LogAcceptOffer")
			.withArgs(0, 0);
    });

    it("Should set isAccept as true for the corresponding request Id and offer Id", async function () {
      await grtPool.connect(user1).acceptOffer(0, 0);
      expect(await grtPool.isOfferAccepted(0, 0)).to.equal(true);
    });

  });


  describe("Reject an offer", function () {

    beforeEach(async function() {

      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
      await grtPool.connect(user1).depositGRTRequestNative(10, 1000, destChainId, user2.address);

      await grtToken.connect(user2).mint(user2.address, 40000);
      await grtToken.connect(user2).approve(grtPool.address, 2000);
      await grtPool.connect(user2).stakeGRT(2);
      await grtPool.connect(user2).createOffer(0, 1000);

    });

    it("Should fail if the offer is not accepted yet", async function () {
      await expect(
        grtPool.connect(user1).rejectOffer(0, 0)
      ).to.be.revertedWith("GRT pool: the offer is not accepted yet!");
    });

    it("Should fail if the transaction signer is not the requester", async function () {
      await grtPool.connect(user1).acceptOffer(0, 0);
      await expect(
        grtPool.connect(user3).rejectOffer(0, 0)
      ).to.be.revertedWith("GRT pool: you are not the requester!");
    });

    it("Should set isAccept to false for the corresponding request Id and offer Id", async function () {
      await grtPool.connect(user1).acceptOffer(0, 0);
      await grtPool.connect(user1).rejectOffer(0, 0);
      expect(await grtPool.isOfferAccepted(0, 0)).to.equal(false);
    });

  });

  describe("Pay an offer on chain with an ERC20 token", function () {

    beforeEach(async function() {

      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
      await grtPool.connect(user1).depositGRTRequestERC20(10, token.address, 1000, onChainId?onChainId:0, user1.address);

      await token.connect(user2).mint(user2.address, 10000);
      await token.connect(user2).approve(grtPool.address, 2000);

      await grtToken.connect(user2).mint(user2.address, 40000);
      await grtToken.connect(user2).approve(grtPool.address, 2000);
      await grtPool.connect(user2).stakeGRT(2);
      await grtPool.connect(user2).createOffer(0, 1000);


    });

    it("Should fail if the offer is not accepted yet", async function () {
      await expect(
        grtPool.connect(user1).payOfferOnChainERC20(0, 0)
      ).to.be.revertedWith("GRT pool: the offer has not been accepted yet!");
    });

    it("Should fail if the offer has already been paid", async function () {
      await grtPool.connect(user1).acceptOffer(0, 0);
      await grtPool.connect(user2).payOfferOnChainERC20(0, 0);
      await expect(
        grtPool.connect(user2).payOfferOnChainERC20(0, 0)
      ).to.be.revertedWith("GRT pool: the offer has already been paid!");
    });

    it("Should fail if the chain Id mentionned in the corresponding offer is not the actual chain Id", async function () {
      await grtPool.connect(user1).depositGRTRequestERC20(10, token.address, 1000, 155, user2.address);
      await grtPool.connect(user2).createOffer(1, 1000);
      await grtPool.connect(user1).acceptOffer(1, 0);
      await expect(
        grtPool.connect(user2).payOfferOnChainERC20(1, 0)
      ).to.be.revertedWith("GRT pool: the offer should not be paid on this chain!");
    });

    it("Should fail if the transaction signer is not the one who made the offer", async function () {
      await grtPool.connect(user1).acceptOffer(0, 0);
      await expect(
        grtPool.connect(user3).payOfferOnChainERC20(0, 0)
      ).to.be.revertedWith("GRT pool: you are not allowed to pay this offer!");
    });

    it("Should increase the token amount of the recipient", async function () {
      const recipient = await grtPool.getRecipient(0);
      const expectedTokenBalanceRecipient = await token.balanceOf(recipient);
      await grtPool.connect(user1).acceptOffer(0, 0);
      await grtPool.connect(user2).payOfferOnChainERC20(0, 0);
      expect(
        await token.balanceOf(recipient)
      ).to.equal(expectedTokenBalanceRecipient.add(ethers.BigNumber.from(1000)));
    });

    it("Should decrease the token amount of the seller", async function () {
      const expectedGRTBalanceSeller = await token.balanceOf(user2.address);
      await grtPool.connect(user1).acceptOffer(0, 0);
      await grtPool.connect(user2).payOfferOnChainERC20(0, 0);
      expect(
        await token.balanceOf(user2.address)
      ).to.equal(expectedGRTBalanceSeller.sub(ethers.BigNumber.from(1000)));
    });

    it("Should generate a reward in GRT for the seller", async function () {
      const expectedGRTBalanceSeller = await grtToken.balanceOf(user2.address);
      await grtPool.connect(user1).acceptOffer(0, 0);
      await grtPool.connect(user2).payOfferOnChainERC20(0, 0);
      expect(
        await grtToken.balanceOf(user2.address)
      ).to.equal(expectedGRTBalanceSeller.add(ethers.BigNumber.from(10)));
    });

    it("Should decrease the GRT balance of the GRT pool", async function () {
      const expectedGRTBalancePool = await grtToken.balanceOf(grtPool.address);
      await grtPool.connect(user1).acceptOffer(0, 0);
      await grtPool.connect(user2).payOfferOnChainERC20(0, 0);
      expect(
        await grtToken.balanceOf(grtPool.address)
      ).to.equal(expectedGRTBalancePool.sub(ethers.BigNumber.from(10)));
    });

    it("Should emit an event to declare the paid offer", async function () {
      await grtPool.connect(user1).acceptOffer(0, 0);
      await expect(await grtPool.connect(user2).payOfferOnChainERC20(0, 0))
			.to.emit(grtPool, "LogOfferPaidOnChain")
			.withArgs(0, 0);
    });

    it("Should set isPaid as true", async function () {
      await grtPool.connect(user1).acceptOffer(0, 0);
      await grtPool.connect(user2).payOfferOnChainERC20(0, 0);
      expect(await grtPool.isOfferPaid(0, 0)).to.equal(true);
    });

  });

  describe("Pay an offer on chain with native token", function () {

    beforeEach(async function() {

      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
      await grtPool.connect(user1).depositGRTRequestNative(10, ethers.utils.parseEther("2"), onChainId?onChainId:0, user1.address);

      await grtToken.connect(user2).mint(user2.address, 40000);
      await grtToken.connect(user2).approve(grtPool.address, 2000);
      await grtPool.connect(user2).stakeGRT(2);
      await grtPool.connect(user2).createOffer(0, ethers.utils.parseEther("2"));

    });

    it("Should fail if the offer is not accepted yet", async function () {
      await expect(
        grtPool.connect(user1).payOfferOnChainNative(0, 0)
      ).to.be.revertedWith("GRT pool: the offer has not been accepted yet!");
    });

    it("Should fail if the offer has already been paid", async function () {
      await grtPool.connect(user1).acceptOffer(0, 0);
      await grtPool.connect(user2).payOfferOnChainNative(0, 0, { value: ethers.utils.parseEther("2") });
      await expect(
        grtPool.connect(user2).payOfferOnChainNative(0, 0, { value: ethers.utils.parseEther("2") })
      ).to.be.revertedWith("GRT pool: the offer has already been paid!");
    });

    it("Should fail if the chain Id mentionned in the corresponding offer is not the actual chain Id", async function () {
      await grtPool.connect(user1).depositGRTRequestNative(10, ethers.utils.parseEther("2"), 155, user2.address);
      await grtPool.connect(user2).createOffer(1, ethers.utils.parseEther("2"));
      await grtPool.connect(user1).acceptOffer(1, 0);
      await expect(
        grtPool.connect(user2).payOfferOnChainNative(1, 0)
      ).to.be.revertedWith("GRT pool: the offer should not be paid on this chain!");
    });


    it("Should fail if msg.value is not the promised amount", async function () {
      await grtPool.connect(user1).acceptOffer(0, 0);
      await expect(
        grtPool.connect(user2).payOfferOnChainNative(0, 0, { value: ethers.utils.parseEther("1") })
      ).to.be.revertedWith("GRT pool: the amount does not match the offer!");
    });

    it("Should fail if the transaction signer is not the one who made the offer", async function () {
      await grtPool.connect(user1).acceptOffer(0, 0);
      await expect(
        grtPool.connect(user3).payOfferOnChainNative(0, 0, { value: ethers.utils.parseEther("2") })
      ).to.be.revertedWith("GRT pool: you are not allowed to pay this offer!");
    });

    it("Should increase the native token balance of the recipient", async function () {
      await grtPool.connect(user1).acceptOffer(0, 0);
      const recipient = await grtPool.getRecipient(0);
      const expectedRecipientBalance = await ethers.provider.getBalance(recipient);
      await grtPool.connect(user2).payOfferOnChainNative(0, 0, { value: ethers.utils.parseEther("2") });
      expect(
        await ethers.provider.getBalance(recipient)
      ).to.equal(expectedRecipientBalance.add(ethers.BigNumber.from(ethers.utils.parseEther("2"))));
    });

    it("Should decrease the native token balance of the seller", async function () {
      await grtPool.connect(user1).acceptOffer(0, 0);
      let expectedUser2Balance = await ethers.provider.getBalance(user2.address);
      const tx = await grtPool.connect(user2).payOfferOnChainNative(0, 0, { value: ethers.utils.parseEther("2") });
      const receipt = await tx.wait();
      const gasCostForTxn = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      expectedUser2Balance = expectedUser2Balance.sub(gasCostForTxn);
      expect(
        await ethers.provider.getBalance(user2.address)
      ).to.equal(expectedUser2Balance.sub(ethers.BigNumber.from(ethers.utils.parseEther("2"))));
    });

    it("Should generate a reward in GRT for the seller", async function () {
      const expectedGRTBalanceSeller = await grtToken.balanceOf(user2.address);
      await grtPool.connect(user1).acceptOffer(0, 0);
      await grtPool.connect(user2).payOfferOnChainNative(0, 0, { value: ethers.utils.parseEther("2") });
      expect(
        await grtToken.balanceOf(user2.address)
      ).to.equal(expectedGRTBalanceSeller.add(ethers.BigNumber.from(10)));
    });

    it("Should decrease the GRT balance of the GRT pool", async function () {
      const expectedGRTBalancePool = await grtToken.balanceOf(grtPool.address);
      await grtPool.connect(user1).acceptOffer(0, 0);
      await grtPool.connect(user2).payOfferOnChainNative(0, 0, { value: ethers.utils.parseEther("2") });
      expect(
        await grtToken.balanceOf(grtPool.address)
      ).to.equal(expectedGRTBalancePool.sub(ethers.BigNumber.from(10)));
    });

    it("Should emit an event to declare the paid offer", async function () {
      await grtPool.connect(user1).acceptOffer(0, 0);
      await expect(
        await grtPool.connect(user2).payOfferOnChainNative(0, 0, { value: ethers.utils.parseEther("2") })
      )
			.to.emit(grtPool, "LogOfferPaidOnChain")
			.withArgs(0, 0);
    });

    it("Should set isPaid as true", async function () {
      await grtPool.connect(user1).acceptOffer(0, 0);
      await grtPool.connect(user2).payOfferOnChainNative(0, 0, { value: ethers.utils.parseEther("2") });
      expect(await grtPool.isOfferPaid(0, 0)).to.equal(true);
    });

  });


  // describe("Claim GRT with dispute", function () {

  // });


  // describe("Claim GRT without dispute", function () {

  //   it("Should fail if the request doesn't exist", async function () {

  //   });

  //   it("Should fail if the offer doesn't exist", async function () {

  //   });

  //   it("Should fail if the offer has already been paid", async function () {

  //   });

  //   it("Should fail if the transaction signer is not the one who made the corresponding offer", async function () {

  //   });

  //   it("Should generate a GRT reward for the transaction signer corresponding to the initial deposit for this request", async function () {

  //   });

  //   it("A successful GRT reward for the transaction signer should emit an event", async function () {

  //   });

  //   it("A successful GRT reward for the transaction should set isPaid to true for the corresponding offer", async function () {

  //   });

  //   it("A successful GRT reward for the transaction signer should return true", async function () {

  //   });

  // });


  // describe("Get information about a deposit", function () {

  //   it("Should return the correct address for the requester", async function () {

  //   });

  //   it("Should return the correct token address", async function () {

  //   });

  //   it("Should return the correct token amount", async function () {

  //   });

  //   it("Should return the correct chain Id", async function () {

  //   });

  // });


  // describe("Get information about a request", function () {

  //   it("Should return the correct address for the requester", async function () {

  //   });

  //   it("Should return the correct token address", async function () {

  //   });

  //   it("Should return the correct token amount", async function () {

  //   });

  //   it("Should return the correct chain Id", async function () {

  //   });

  // });


  // describe("Get information about an offer", function () {

  //   it("Should return the correct address for the requester", async function () {

  //   });

  //   it("Should return isRequest as false if no offer exist for this request", async function () {

  //   });

  //   it("Should return isRequest as true if at least one offer exist for this request", async function () {

  //   });

  //   it("Should return the correct address for the offeror", async function () {

  //   });

  //   it("Should return isAccept as true if the offer is accepted", async function () {

  //   });

  //   it("Should return isAccept as false if the offer is not accepted", async function () {

  //   });

  //   it("Should return isPaid as true if the offer is paid", async function () {

  //   });

  //   it("Should return isPaid as false if the offer is not paid", async function () {

  //   })

  // });


  // describe("Set token information", function () {

  //   it("Should return the proper token address", async function () {

  //   })

  //   it("Should return the proper amount", async function () {

  //   })

  //   it("Should return the proper chain Id", async function () {

  //   })

  // });


  // describe("Set GRT address", function () {

  //   it("Should fail if the transaction signer is not the owner of the contract", async function () {

  //   })

  //   it("Should modify _addrGRT", async function () {

  //   })

  // });

  // describe("Set GRT chain Id", function () {

  //   it("Should fail if the transaction signer is not the owner of the contract", async function () {

  //   })

  //   it("Should modify _chainIdGRT", async function () {

  //   })

  // });


  // describe("Deposit GRT on the pool", function () {

  //   it("Should fail if the allowance is not high enough", async function () {

  //   });

  //   it("Should decrease the token amount for the transaction signer", async function () {

  //   });

  //   it("Should increase the token amount for the GRT pool contract", async function () {

  //   });

  // });















  // it("Test should exchange GRT for another token without dispute on the same chain", async function () {
  //   // Mint withdrawal tokens for grtPool contract

  //   await grtToken.mint(user1.address, ethers.utils.parseEther("200"));

  //   expect(await grtToken.balanceOf(user1.address)).to.equal(
  //     "200000000000000000000"
  //   );
  //   await grtToken.connect(user1).approve(
  //     grtPool.address,
  //     ethers.utils.parseEther("2000000")
  //   );

  //   // minting GRT to the grt pool
  //   await grtToken.mint(grtPool.address, ethers.utils.parseEther("200"));

  //   expect(await grtToken.balanceOf(grtPool.address)).to.equal(
  //     "200000000000000000000"
  //   );

  //   // deposit ERC20 to pool by UserA
  //   await grtPool
  //     .connect(user1)
  //     .depositGRTRequestERC20(
  //       ethers.utils.parseEther("10"),
  //       token.address,
  //       ethers.utils.parseEther("5"),
  //       31337,
  //       user2.address
  //     )
  //     ;
  //   const res = await grtPool.getInfoDeposit(0);
  //   expect(res.userAddr).to.equal(user1.address);

  //   // make offer
  //   // User3 staking deposit
  //   await grtToken.mint(user3.address, ethers.utils.parseEther("0.2"));

  //   expect(await grtToken.balanceOf(user3.address)).to.equal(
  //     "200000000000000000"
  //   );
  //   await grtToken.connect(user3).approve(
  //     grtPool.address,
  //     ethers.utils.parseEther("20")
  //   );
  //   await grtPool.connect(user3).stakeGRT(ethers.utils.parseEther("0.2"));

  //   // make right offer by user3
  //   await grtPool
  //     .connect(user3)
  //     .createOffer( 0, ethers.utils.parseEther("5"));

  //   // accpet offer by user1
  //   await grtPool.connect(user1).acceptOffer(0, 1);

  //   // Honor offer on same chain by user3

  //   await token.mint(user3.address, ethers.utils.parseEther("20"));

  //   expect(await token.balanceOf(user3.address)).to.equal(
  //     "20000000000000000000"
  //   );
  //   await token
  //     .connect(user3)
  //     .approve(grtPool.address, ethers.utils.parseEther("2000000"));

  //   await grtPool
  //     .connect(user3)
  //     .payOfferOnChainERC20(0, 1, token.address, ethers.utils.parseEther("5"));

  //   expect(await grtToken.balanceOf(user3.address)).to.equal(
  //     "10000000000000000000"
  //   );
  //    expect(await token.balanceOf(user2.address)).to.equal(
  //     "5000000000000000000"
  //   );
  // });

  // it("Test should exchange GRT for native token without dispute on the same chain", async function () {
  //   // Mint withdrawal tokens for grtPool contract

  //   await grtToken.mint(user1.address, ethers.utils.parseEther("200"));

  //   expect(await grtToken.balanceOf(user1.address)).to.equal(
  //     "200000000000000000000"
  //   );
  //   await grtToken.connect(user1).approve(
  //     grtPool.address,
  //     ethers.utils.parseEther("2000000")
  //   );


  //   // deposit ERC20 to pool by UserA
  //   await grtPool
  //     .connect(user1)
  //     .depositGRTRequestNative(
  //       ethers.utils.parseEther("10"),
  //       ethers.utils.parseEther("5"),
  //       31337,
  //       user2.address
  //     );
  //   const res = await grtPool.getInfoDeposit(0);
  //   expect(res.userAddr).to.equal(user1.address);

  //   // make offer
  //   // User3 staking deposit
  // await grtToken.mint(user3.address, ethers.utils.parseEther("0.2"));

  //   expect(await grtToken.balanceOf(user3.address)).to.equal(
  //     "200000000000000000"
  //   );
  //   await grtToken.connect(user3).approve(
  //     grtPool.address,
  //     ethers.utils.parseEther("20")
  //   );
  //   await grtPool.connect(user3).stakeGRT(ethers.utils.parseEther("0.2"));

  //   // make right offer by user3
  //   await grtPool
  //     .connect(user3)
  //     .createOffer( 0, ethers.utils.parseEther("5"));

  //   // accpet offer by user1
  //   await grtPool.connect(user1).acceptOffer(0, 1);

  //      const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  //   // check user2 ether balance before payment
  //   const balance = await provider.getBalance(user2.address);
  //   const balanceInEth = ethers.utils.formatEther(balance);
  //   // Honor offer on same chain by user3

  //   await grtPool
  //     .connect(user3)
  //     .payOfferOnChainNative(0, 1, {value: ethers.utils.parseEther("5")});

  //   expect(await grtToken.balanceOf(user3.address)).to.equal(
  //     "10000000000000000000"
  //   );
  //   // check user2 ether balance after payment
  //   const balanceAfter = await provider.getBalance(user2.address);
  //   const balanceInEthAfter = ethers.utils.formatEther(balanceAfter);

  //   expect(Number(balanceInEthAfter)).to.equal(Number(balanceInEth) + 5)
  // });

  // it("Test should excahnge GRT for another token without dispute on the another chain", async function () {
  //   // Mint withdrawal tokens for grtPool contract

  //   await grtToken.mint(user1.address, ethers.utils.parseEther("20"));

  //   expect(await grtToken.balanceOf(user1.address)).to.equal(
  //     "20000000000000000000"
  //   );
  //   await grtToken.connect(user1).approve(
  //     grtPool.address,
  //     ethers.utils.parseEther("20")
  //   );

  //   // minting GRT to the grt pool
  //   await grtToken.mint(grtPool.address, ethers.utils.parseEther("200"));

  //   expect(await grtToken.balanceOf(grtPool.address)).to.equal(
  //     "200000000000000000000"
  //   );

  //   // deposit ERC20 to pool by UserA
  //   await grtPool
  //     .connect(user1)
  //     .depositGRTRequestERC20(
  //       ethers.utils.parseEther("10"),
  //       token.address,
  //       ethers.utils.parseEther("5"),
  //       80001,
  //       user2.address
  //     );
  //   const res = await grtPool.getInfoDeposit(0);
  //   expect(res.userAddr).to.equal(user1.address);

  //   // make offer
  //   // User3 staking deposit
  //   await grtToken.mint(user3.address, ethers.utils.parseEther("0.2"));

  //   expect(await grtToken.balanceOf(user3.address)).to.equal(
  //     "200000000000000000"
  //   );
  //   await grtToken.connect(user3).approve(
  //     grtPool.address,
  //     ethers.utils.parseEther("2")
  //   );
  //   await grtPool.connect(user3).stakeGRT(ethers.utils.parseEther("0.2"));

  //   // make right offer by user3
  //   await grtPool
  //     .connect(user3)
  //     .createOffer(0, ethers.utils.parseEther("5"));

  //   // accpet offer by user1
  //   await grtPool.connect(user1).acceptOffer(0, 1);

  //   // User3 honors transaction and has sent the amount of token the user1 requested for

  //   // Claim  rewards on different chain by user3
  //   await grtPool.connect(user3).claimGRTWithoutDispute(0, 1);
  //   expect(await grtToken.balanceOf(user3.address)).to.equal(
  //     "10000000000000000000"
  //   );
  // });

  // it("Test should excahnge GRT for another token with dispute on the another chain", async function () {
  //   // Mint withdrawal tokens for grtPool contract

  //   await grtToken.mint(user1.address, ethers.utils.parseEther("20"));

  //   expect(await grtToken.balanceOf(user1.address)).to.equal(
  //     "20000000000000000000"
  //   );
  //   await grtToken.connect(user1).approve(
  //     grtPool.address,
  //     ethers.utils.parseEther("2000000")
  //   );

  //   // minting GRT to the grt pool
  //   await grtToken.mint(grtPool.address, ethers.utils.parseEther("200"));

  //   expect(await grtToken.balanceOf(grtPool.address)).to.equal(
  //     "200000000000000000000"
  //   );

  //   // deposit ERC20 to pool by UserA
  //   await grtPool
  //     .connect(user1)
  //     .depositGRTRequestERC20(
  //       ethers.utils.parseEther("10"),
  //       token.address,
  //       ethers.utils.parseEther("5"),
  //       80001,
  //       user2.address
  //     );
  //   const res = await grtPool.getInfoDeposit(0);
  //   expect(res.userAddr).to.equal(user1.address);

  //   // make offer
  //   // User3 staking deposit

  //      await grtToken.mint(user3.address, ethers.utils.parseEther("0.2"));

  //   expect(await grtToken.balanceOf(user3.address)).to.equal(
  //     "200000000000000000"
  //   );
  //   await grtToken.connect(user3).approve(
  //     grtPool.address,
  //     ethers.utils.parseEther("2")
  //   );
  //   await grtPool.connect(user3).stakeGRT(ethers.utils.parseEther("0.2"));

  //   // make right offer by user3
  // const offer =  await grtPool
  //     .connect(user3)
  //     .createOffer(0, ethers.utils.parseEther("5"));
  // const txHash = offer.hash;
  //   // accpet offer by user1
  //   await grtPool.connect(user1).acceptOffer(0, 1);

  //   // User3 honors transaction and has sent the amount of token the user1 requested for

  //   // Claim  rewards on different chain by user3

  //   // create question template

  //   // creating the question
  //   const questionStr = "Did I make a transaction deposit of 1000GRT?␟␟en";
  //   const __question = await grtPool.createQuestion(
  //     questionStr,
  //     0,
  //     txHash,
  //     user3.address,
  //     user2.address,
  //     token.address,
  //     ethers.utils.parseEther("5"),
  //     80001,
  //     { value: ethers.utils.parseEther("0.1") }
  //   );
  //   const _questionId = await __question.wait();
  //   const questionId = _questionId?.events[2]?.args[1];

  //   const getHistoryHash = await grtPool.getHistoryHash(questionId);
  //   //answering the question posted by user3 by users nbrRequest and 5
  //   await grtPool
  //     .connect(user4)
  //     .answerQuestion('true', questionId, 0, {
  //       value: ethers.utils.parseEther("1"),
  //     });

  //   const getHistoryHash1 = await grtPool.getHistoryHash(questionId);

  //   await grtPool
  //     .connect(user5)
  //     .answerQuestion('true', questionId, 0, {
  //       value: ethers.utils.parseEther("2"),
  //     });


  //   const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  //   const network = { provider: provider };

  //   await network.provider.send("evm_increaseTime", [97200]);
  //   await network.provider.send("evm_mine");

  //   // checking if question is finalized
  //   const isFinalized = await grtPool.isFinalized(questionId);
  //   expect(isFinalized).to.equal(true);

  //   const answer = await grtPool.getBytes('true');
  //   expect (await grtPool.getFinalAnswer(questionId)).to.equal(answer)
  //   // resolving dispute and claiming GRT exchanged
  //   await grtPool
  //     .connect(user3)
  //     .claimGRTWithDispute(
  //       0,
  //       1,
  //       questionId,
  //       [getHistoryHash1, getHistoryHash],
  //       [user5.address, user4.address],
  //       [ethers.utils.parseEther("2"), ethers.utils.parseEther("1")],
  //       [answer, answer]
  //     );
  //  expect(await grtToken.balanceOf(user3.address)).to.equal(
  //     "10000000000000000000"
  //   );
  // })
});