import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ERC20Sample, RealityETH_v3_0 } from "../typechain-types";

describe("Grindery Satellite testings", function () {

  let owner: SignerWithAddress,
      user1: SignerWithAddress,
      user2: SignerWithAddress,
      user3: SignerWithAddress,
      user4: SignerWithAddress,
      user5: SignerWithAddress,
      realityEth: RealityETH_v3_0,
      grtToken: ERC20Sample,
      token: ERC20Sample,
      grtSatellite: any,
      idRequest: string,
      idOffer: number,
      chainIdDeposit: number,
      paymentId: string;

  beforeEach(async function() {

    [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

    grtSatellite = await upgrades.deployProxy(await ethers.getContractFactory("GrtSatellite"));
    await grtSatellite.deployed();

    realityEth = await (await ethers.getContractFactory("RealityETH_v3_0")).deploy();
    await realityEth.deployed();

    grtToken = await (await ethers.getContractFactory("ERC20Sample")).deploy();
    await grtToken.deployed();

    token = await (await ethers.getContractFactory("ERC20Sample")).deploy();
    await token.deployed();

    // initialize contract
    await grtSatellite.initializeSatellite();

    idRequest = "0xd2b8dbec86dba5f9b5c34f84d0dc19bf715f984e3c78051e5ffa813a1d29dd73";
    idOffer = 0;
    chainIdDeposit = 5;

    const encodePacked =  ethers.utils.solidityPack(
      ["bytes32", "uint256", "uint256"],
      [idRequest, idOffer, chainIdDeposit]
    );

    paymentId = ethers.utils.keccak256(encodePacked);

  });

  describe("GRT satellite initialisation", function () {

    it("Should set the correct Owner", async function () {
      expect(await grtSatellite.owner()).to.equal(owner.address);
    });

  });

  describe("Pay an offer cross-chain with ERC20 token", function () {

    it("Should fail if the allowance is not high enough", async function () {
      await expect(
        grtSatellite.connect(user2).payOfferCrossChainERC20(
          idRequest,
          idOffer,
          chainIdDeposit,
          token.address,
          user1.address,
          100
        )
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should decrease the token balance of the transaction signer", async function () {
      await token.connect(user2).mint(user2.address, 1000);
      await token.connect(user2).approve(grtSatellite.address, 500);
      await grtSatellite.connect(user2).payOfferCrossChainERC20(
        idRequest,
        idOffer,
        chainIdDeposit,
        token.address,
        user1.address,
        100
      );
      expect(await token.balanceOf(user2.address)).to.equal(1000-100);
    });

    it("Should increase the token balance of the recipient", async function () {
      await token.connect(user2).mint(user2.address, 1000);
      await token.connect(user2).approve(grtSatellite.address, 500);
      await grtSatellite.connect(user2).payOfferCrossChainERC20(
        idRequest,
        idOffer,
        chainIdDeposit,
        token.address,
        user1.address,
        100
      );
      expect(await token.balanceOf(user1.address)).to.equal(100);
    });

    it("Should emit a paid offer event", async function () {
      await token.connect(user2).mint(user2.address, 1000);
      await token.connect(user2).approve(grtSatellite.address, 500);


      await expect(
        await grtSatellite.connect(user2).payOfferCrossChainERC20(
          idRequest,
          idOffer,
          chainIdDeposit,
          token.address,
          user1.address,
          100
        )
      )
			.to.emit(grtSatellite, "LogOfferPaidSatelliteCrossChain")
			.withArgs(idRequest, idOffer, paymentId);
    });

    it("Should add the token address in the payment mapping", async function () {
      await token.connect(user2).mint(user2.address, 1000);
      await token.connect(user2).approve(grtSatellite.address, 500);
      await grtSatellite.connect(user2).payOfferCrossChainERC20(
        idRequest,
        idOffer,
        chainIdDeposit,
        token.address,
        user1.address,
        100
      );
      expect(await grtSatellite.getTokenPayment(paymentId)).to.equal(token.address);
    });

    it("Should add the sender address in the payment mapping", async function () {
      await token.connect(user2).mint(user2.address, 1000);
      await token.connect(user2).approve(grtSatellite.address, 500);
      await grtSatellite.connect(user2).payOfferCrossChainERC20(
        idRequest,
        idOffer,
        chainIdDeposit,
        token.address,
        user1.address,
        100
      );
      expect(await grtSatellite.getSenderPayment(paymentId)).to.equal(user2.address);
    });

    it("Should add the receiver address in the payment mapping", async function () {
      await token.connect(user2).mint(user2.address, 1000);
      await token.connect(user2).approve(grtSatellite.address, 500);
      await grtSatellite.connect(user2).payOfferCrossChainERC20(
        idRequest,
        idOffer,
        chainIdDeposit,
        token.address,
        user1.address,
        100
      );
      expect(await grtSatellite.getReceiverPayment(paymentId)).to.equal(user1.address);
    });

    it("Should add the payment amount in the payment mapping", async function () {
      await token.connect(user2).mint(user2.address, 1000);
      await token.connect(user2).approve(grtSatellite.address, 500);
      await grtSatellite.connect(user2).payOfferCrossChainERC20(
        idRequest,
        idOffer,
        chainIdDeposit,
        token.address,
        user1.address,
        100
      );
      expect(await grtSatellite.getAmountPayment(paymentId)).to.equal(100);
    });

    it("Should add the chain ID (deposit chain) in the payment mapping", async function () {
      await token.connect(user2).mint(user2.address, 1000);
      await token.connect(user2).approve(grtSatellite.address, 500);
      await grtSatellite.connect(user2).payOfferCrossChainERC20(
        idRequest,
        idOffer,
        chainIdDeposit,
        token.address,
        user1.address,
        100
      );
      expect(await grtSatellite.getChainIdDeposit(paymentId)).to.equal(chainIdDeposit);
    });

    it("Should add the request ID in the payment mapping", async function () {
      await token.connect(user2).mint(user2.address, 1000);
      await token.connect(user2).approve(grtSatellite.address, 500);
      await grtSatellite.connect(user2).payOfferCrossChainERC20(
        idRequest,
        idOffer,
        chainIdDeposit,
        token.address,
        user1.address,
        100
      );
      expect(await grtSatellite.getRequestId(paymentId)).to.equal(idRequest);
    });

    it("Should add the offer ID in the payment mapping", async function () {
      await token.connect(user2).mint(user2.address, 1000);
      await token.connect(user2).approve(grtSatellite.address, 500);
      await grtSatellite.connect(user2).payOfferCrossChainERC20(
        idRequest,
        idOffer,
        chainIdDeposit,
        token.address,
        user1.address,
        100
      );
      expect(await grtSatellite.getOfferId(paymentId)).to.equal(idOffer);
    });

  });

  describe("Pay an offer cross-chain with native token", function () {

    it("Should decrease the native token balance of the transaction signer", async function () {
      let expectedUser2Balance = await ethers.provider.getBalance(user2.address);
      const tx = await grtSatellite.connect(user2).payOfferCrossChainNative(
        idRequest,
        idOffer,
        chainIdDeposit,
        user1.address,
        { value: ethers.utils.parseEther("2") }
      );
      const receipt = await tx.wait();
      const gasCostForTxn = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      expectedUser2Balance = expectedUser2Balance.sub(gasCostForTxn);
      expect(
        await ethers.provider.getBalance(user2.address)
      ).to.equal(expectedUser2Balance.sub(ethers.BigNumber.from(ethers.utils.parseEther("2"))));
    });

    it("Should increase the native token amount of the recipient if payment is a success", async function () {
      let expectedUser1Balance = await ethers.provider.getBalance(user1.address);
      await grtSatellite.connect(user2).payOfferCrossChainNative(
        idRequest,
        idOffer,
        chainIdDeposit,
        user1.address,
        { value: ethers.utils.parseEther("2") }
      );
      expect(
        await ethers.provider.getBalance(user1.address)
      ).to.equal(expectedUser1Balance.add(ethers.BigNumber.from(ethers.utils.parseEther("2"))));
    });

    it("Should emit an event if payment is a success", async function () {
      await expect(
        await grtSatellite.connect(user2).payOfferCrossChainNative(
          idRequest,
          idOffer,
          chainIdDeposit,
          user1.address,
          { value: ethers.utils.parseEther("2") }
        )
      )
			.to.emit(grtSatellite, "LogOfferPaidSatelliteCrossChain")
			.withArgs(idRequest, idOffer, paymentId);
    });

    it("Should add the zero token address in the payment mapping", async function () {
      await grtSatellite.connect(user2).payOfferCrossChainNative(
        idRequest,
        idOffer,
        chainIdDeposit,
        user1.address,
        { value: ethers.utils.parseEther("2") }
      );
      expect(await grtSatellite.getTokenPayment(paymentId)).to.equal(ethers.constants.AddressZero);
    });

    it("Should add the sender address in the payment mapping", async function () {
      await grtSatellite.connect(user2).payOfferCrossChainNative(
        idRequest,
        idOffer,
        chainIdDeposit,
        user1.address,
        { value: ethers.utils.parseEther("2") }
      );
      expect(await grtSatellite.getSenderPayment(paymentId)).to.equal(user2.address);
    });

    it("Should add the receiver address in the payment mapping", async function () {
      await grtSatellite.connect(user2).payOfferCrossChainNative(
        idRequest,
        idOffer,
        chainIdDeposit,
        user1.address,
        { value: ethers.utils.parseEther("2") }
      );
      expect(await grtSatellite.getReceiverPayment(paymentId)).to.equal(user1.address);
    });

    it("Should add the payment amount in the payment mapping", async function () {
      await grtSatellite.connect(user2).payOfferCrossChainNative(
        idRequest,
        idOffer,
        chainIdDeposit,
        user1.address,
        { value: ethers.utils.parseEther("2") }
      );
      expect(await grtSatellite.getAmountPayment(paymentId)).to.equal(ethers.utils.parseEther("2"));
    });

    it("Should add the chain ID (deposit chain) in the payment mapping", async function () {
      await grtSatellite.connect(user2).payOfferCrossChainNative(
        idRequest,
        idOffer,
        chainIdDeposit,
        user1.address,
        { value: ethers.utils.parseEther("2") }
      );
      expect(await grtSatellite.getChainIdDeposit(paymentId)).to.equal(chainIdDeposit);
    });

    it("Should add the request ID in the payment mapping", async function () {
      await grtSatellite.connect(user2).payOfferCrossChainNative(
        idRequest,
        idOffer,
        chainIdDeposit,
        user1.address,
        { value: ethers.utils.parseEther("2") }
      );
      expect(await grtSatellite.getRequestId(paymentId)).to.equal(idRequest);
    });

    it("Should add the offer ID in the payment mapping", async function () {
      await grtSatellite.connect(user2).payOfferCrossChainNative(
        idRequest,
        idOffer,
        chainIdDeposit,
        user1.address,
        { value: ethers.utils.parseEther("2") }
      );
      expect(await grtSatellite.getOfferId(paymentId)).to.equal(idOffer);
    });

  });

});