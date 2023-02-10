import { expect } from "chai";
import { ethers, network, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ERC20Sample, GrtPool, RealityETH_v3_0 } from "../typechain-types";

describe("Grindery Pool testings", function () {

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

    // initialize contract
    await grtPool.initializePool(grtToken.address, 5, realityEth.address);

  });

  describe("GRT pool initialisation", function () {

    it("Should set the correct Owner", async function () {
      expect(await grtPool.owner()).to.equal(owner.address);
    });

    it("Should set the correct GRT token address", async function () {

    });

    it("Should set the correct chain ID", async function () {

    });

    it("Should set the correct Reality smart contract address", async function () {

    });

  });

  describe("Staking GRT", function () {

    it("Staking GRT should update the stake mapping", async function () {

    });

    it("Staking GRT should emit an event", async function () {

    });

  });


  describe("Deposit GRT and request ERC20 tokens", function () {

    it("GRT deposit should fail if the allowance is not high enough", async function () {

    });

    it("A successful GRT deposit should emit an event", async function () {

    });

    it("An ERC20 request should emit an event", async function () {

    });

    it("An ERC20 request should increase by one the request counter", async function () {

    });

    it("An ERC20 request should add a new item in the requests mapping with the proper requester", async function () {

    });

    it("An ERC20 request should add a new item in the requests mapping with the proper recipient address", async function () {

    });

    it("An ERC20 request should add a new item in the requests mapping with the proper deposit information (token address, amount and chain Id)", async function () {

    });

    it("An ERC20 request should add a new item in the requests mapping with the proper request information (token address, amount and chain Id)", async function () {

    });

    it("An ERC20 request should add a new item in the requests mapping with the isRequest item set to true", async function () {

    });

    it("An ERC20 request should add a new item in the requests mapping with an empty offers array inside", async function () {

    });

    it("Should return true if the deposit is accepted", async function () {

    });

    it("Should return false if the deposit isn't accepted", async function () {

    });

  });


  describe("Deposit GRT and request native tokens", function () {

    it("GRT deposit should fail if the allowance is not high enough", async function () {

    });

    it("A successful GRT deposit should emit an event", async function () {

    });

    it("A native token request should emit an event", async function () {

    });

    it("A native token request should increase by one the request counter", async function () {

    });

    it("A native token request should add a new item in the requests mapping with the proper requester", async function () {

    });

    it("A native token request should add a new item in the requests mapping with the proper recipient address", async function () {

    });

    it("A native token request should add a new item in the requests mapping with the proper deposit information (token address, amount and chain Id)", async function () {

    });

    it("A native token request should add a new item in the requests mapping with the proper request information (zero address for the token address, amount and chain Id)", async function () {

    });

    it("A native token request should add a new item in the requests mapping with the isRequest item set to true", async function () {

    });

    it("A native token request should add a new item in the requests mapping with an empty offers array inside", async function () {

    });

    it("Should return true if the deposit is accepted", async function () {

    });

    it("Should return false if the deposit isn't accepted", async function () {

    });

  });


  describe("Create an offer", function () {

    it("Should fail if there is no request for the provided Id", async function () {

    });


    it("Should fail if the user has not enough staked GRT (1 for tests)", async function () {

    });


    it("Should emit an event", async function () {

    });

    it("Should push a new offer in the offers array for the concerning request Id with the correct creator", async function () {

    });

    it("Should push a new offer in the offers array for the concerning request Id with the correct amount proposed", async function () {

    });

    it("Should push a new offer in the offers array for the concerning request Id with isAccept and isPaid set both to false", async function () {

    });

  });


  describe("Accept an offer", function () {


    it("Should fail if idRequest doesn't exist", async function () {

    });

    it("Should fail if idOffer doesn't exist for the offer corresponding to idRequest", async function () {

    });

    it("Should fail if the offer has already been accepted", async function () {

    });

    it("Should fail if the offer has already been paid", async function () {

    });

    it("Should fail if the transaction signer is not the requester", async function () {

    });

    it("Should set isAccept to true for the corresponding request Id and offer Id", async function () {

    });

    it("Should emit an event for offer acceptance", async function () {

    });

    it("Should set isPaid as true for the corresponding request Id and offer Id", async function () {

    });

    it("Should return true for successHndOffer and true for successGRTReward", async function () {

    });

  });


  describe("Pay an offer on chain with an ERC20 token", function () {

    it("Should fail if the offer is not accepted yet", async function () {

    });

    it("Should fail if the offer has already been paid", async function () {

    });

    it("Should fail if the chain Id mentionned in the corresponding offer is not the actual chain Id", async function () {

    });

    it("Should fail if the amount doesn't correspond to the offer", async function () {

    });

    it("Should fail if the transaction signer is not the address which made the offer", async function () {

    });

    it("Should fail if the proposed ERC20 token is not the one requested", async function () {

    });

    it("Should fail if allowance for the correspoànding ERC20 token is not high enough for the transfer", async function () {

    });

    it("Should increase the token amount of the recipient with the correct amount", async function () {

    });

    it("A successful payment should generate a reward for the transaction signer corresponding to the initial deposit for this request", async function () {

    });

    it("A successful payment and reward transfer should emit and event", async function () {

    });


  });

  describe("Pay an offer on chain with a native token", function () {

    it("Should fail if the offer is not accepted yet", async function () {

    });

    it("Should fail if the offer has already been paid", async function () {

    });

    it("Should fail if the chain Id mentionned in the corresponding offer is not the actual chain Id", async function () {

    });

    it("Should fail if the amount doesn't correspond to the offer", async function () {

    });

    it("Should fail if the transaction signer is not the address which made the offer", async function () {

    });

    it("Should fail if the proposed ERC20 token is not the one requested", async function () {

    });

    it("Should fail if allowance for the correspoànding ERC20 token is not high enough for the transfer", async function () {

    });

    it("Should increase the token amount of the recipient with the correct amount", async function () {

    });

    it("A successful payment should generate a GRT reward for the transaction signer corresponding to the initial deposit for this request", async function () {

    });

    it("A successful payment and reward transfer should emit and event", async function () {

    });

  });


  describe("Claim GRT with dispute", function () {

  });


  describe("Claim GRT without dispute", function () {

    it("Should fail if the request doesn't exist", async function () {

    });

    it("Should fail if the offer doesn't exist", async function () {

    });

    it("Should fail if the offer has already been paid", async function () {

    });

    it("Should fail if the transaction signer is not the one who made the corresponding offer", async function () {

    });

    it("Should generate a GRT reward for the transaction signer corresponding to the initial deposit for this request", async function () {

    });

    it("A successful GRT reward for the transaction signer should emit an event", async function () {

    });

    it("A successful GRT reward for the transaction should set isPaid to true for the corresponding offer", async function () {

    });

    it("A successful GRT reward for the transaction signer should return true", async function () {

    });

  });


  describe("Get information about a deposit", function () {

    it("Should return the correct address for the requester", async function () {

    });

    it("Should return the correct token address", async function () {

    });

    it("Should return the correct token amount", async function () {

    });

    it("Should return the correct chain Id", async function () {

    });

  });


  describe("Get information about a request", function () {

    it("Should return the correct address for the requester", async function () {

    });

    it("Should return the correct token address", async function () {

    });

    it("Should return the correct token amount", async function () {

    });

    it("Should return the correct chain Id", async function () {

    });

  });


  describe("Get information about an offer", function () {

    it("Should return the correct address for the requester", async function () {

    });

    it("Should return isRequest as false if no offer exist for this request", async function () {

    });

    it("Should return isRequest as true if at least one offer exist for this request", async function () {

    });

    it("Should return the correct address for the offeror", async function () {

    });

    it("Should return isAccept as true if the offer is accepted", async function () {

    });

    it("Should return isAccept as false if the offer is not accepted", async function () {

    });

    it("Should return isPaid as true if the offer is paid", async function () {

    });

    it("Should return isPaid as false if the offer is not paid", async function () {

    })

  });


  describe("Set token information", function () {

    it("Should return the proper token address", async function () {

    })

    it("Should return the proper amount", async function () {

    })

    it("Should return the proper chain Id", async function () {

    })

  });


  describe("Set GRT address", function () {

    it("Should fail if the transaction signer is not the owner of the contract", async function () {

    })

    it("Should modify _addrGRT", async function () {

    })

  });

  describe("Set GRT chain Id", function () {

    it("Should fail if the transaction signer is not the owner of the contract", async function () {

    })

    it("Should modify _chainIdGRT", async function () {

    })

  });


  describe("Deposit GRT on the pool", function () {

    it("Should fail if the allowance is not high enough", async function () {

    });

    it("Should decrease the token amount for the transaction signer", async function () {

    });

    it("Should increase the token amount for the GRT pool contract", async function () {

    });

  });















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
  //   //answering the question posted by user3 by users 4 and 5
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