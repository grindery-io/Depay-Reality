import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";

describe("Grindery Pool testings", function () {
  // const chainId = 5;
  // const chainId = 6;
  const nbrRequest = 4;
  const nbrOffer = 4;
  const chainId = 31337;

  let owner: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress,
    user3: SignerWithAddress,
    user4: SignerWithAddress,
    user5: SignerWithAddress,
    grtPool: Contract,
    realityEth: Contract,
    grtToken: Contract,
    token: Contract,
    grtSatellite: Contract;

  beforeEach(async function () {
    [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

    grtPool = await upgrades.deployProxy(
      await ethers.getContractFactory("contracts/v0.1.0/GrtPool.sol:GrtPool")
    );
    await grtPool.deployed();

    grtSatellite = await upgrades.deployProxy(
      await ethers.getContractFactory(
        "contracts/v0.1.0/GrtSatellite.sol:GrtSatellite"
      )
    );
    await grtSatellite.deployed();

    realityEth = await (
      await ethers.getContractFactory("RealityETH_v3_0")
    ).deploy();
    await realityEth.deployed();

    grtToken = await (await ethers.getContractFactory("MockERC20")).deploy();
    await grtToken.deployed();

    token = await (await ethers.getContractFactory("MockERC20")).deploy();
    await token.deployed();

    // initialize contract
    await grtPool.initializePool(grtToken.address, chainId, realityEth.address);
  });

  describe("GRT pool initialisation", function () {
    it("Should set the correct Owner", async function () {
      expect(await grtPool.owner()).to.equal(owner.address);
    });

    it("Should set the correct GRT token address", async function () {
      expect(await grtPool.grtAddress()).to.equal(grtToken.address);
    });

    it("Should set the correct chain ID", async function () {
      expect(await grtPool.grtChainId()).to.equal(chainId);
    });

    it("Should set the correct Reality smart contract address", async function () {
      expect(await grtPool.realityAddress()).to.equal(realityEth.address);
    });
  });

  describe("Staking GRT", function () {
    beforeEach(async function () {
      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
    });

    it("Should fail if the allowance is not high enough", async function () {
      await expect(grtPool.connect(user1).stakeGRT(1000)).to.be.revertedWith(
        "ERC20: insufficient allowance"
      );
    });

    it("Should decrease the GRT token balance of the user", async function () {
      await grtPool.connect(user1).stakeGRT(10);
      expect(await grtToken.connect(user1).balanceOf(user1.address)).to.equal(
        10000 - 10
      );
    });

    it("Should increase the GRT token balance of the GRT pool", async function () {
      await grtPool.connect(user1).stakeGRT(10);
      expect(await grtToken.connect(user1).balanceOf(grtPool.address)).to.equal(
        10
      );
    });

    it("Should increase the GRT staked amount for the user", async function () {
      await grtPool.connect(user1).stakeGRT(10);
      expect(await grtPool.stakeOf(user1.address)).to.equal(10);
    });

    it("Staking GRT should emit an event", async function () {
      await expect(await grtPool.connect(user1).stakeGRT(10))
        .to.emit(grtPool, "LogStake")
        .withArgs(user1.address, 10);
    });
  });

  describe("Deposit GRT and request ERC20 tokens", function () {
    const nbrRequest = 4;

    beforeEach(async function () {
      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
    });

    it("Should fail if the allowance is not high enough", async function () {
      await expect(
        grtPool
          .connect(user1)
          .depositGRTRequestERC20(
            0,
            1000,
            token.address,
            1000,
            chainId,
            user1.address
          )
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should fail if the deposit has already been submitted", async function () {
      await grtPool
        .connect(user1)
        .depositGRTRequestERC20(
          0,
          10,
          token.address,
          1000,
          chainId,
          user1.address
        );
      await expect(
        grtPool
          .connect(user1)
          .depositGRTRequestERC20(
            0,
            10,
            token.address,
            1000,
            chainId,
            user1.address
          )
      ).to.be.revertedWith("GRT pool: this nonce has already been submitted!");
    });

    it("Should emit a new deposit event", async function () {
      const encodePacked = ethers.utils.solidityPack(
        [
          "uint256",
          "address",
          "address",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "address",
        ],
        [
          0,
          user1.address,
          grtToken.address,
          10,
          chainId,
          token.address,
          1000,
          chainId,
          user1.address,
        ]
      );
      await expect(
        await grtPool
          .connect(user1)
          .depositGRTRequestERC20(
            0,
            10,
            token.address,
            1000,
            chainId,
            user1.address
          )
      )
        .to.emit(grtPool, "LogDeposit")
        .withArgs(
          ethers.utils.keccak256(encodePacked),
          grtToken.address,
          10,
          chainId
        );
    });

    it("Should emit a new request event", async function () {
      const encodePacked = ethers.utils.solidityPack(
        [
          "uint256",
          "address",
          "address",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "address",
        ],
        [
          0,
          user1.address,
          grtToken.address,
          10,
          chainId,
          token.address,
          1000,
          chainId,
          user1.address,
        ]
      );
      await expect(
        await grtPool
          .connect(user1)
          .depositGRTRequestERC20(
            0,
            10,
            token.address,
            1000,
            chainId,
            user1.address
          )
      )
        .to.emit(grtPool, "LogRequest")
        .withArgs(
          ethers.utils.keccak256(encodePacked),
          token.address,
          1000,
          chainId
        );
    });

    describe("General information", function () {
      it("Should add a new item in the requests mapping with the proper requester", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              token.address,
              1000,
              chainId,
              user1.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestERC20(
              i,
              10,
              token.address,
              1000,
              chainId,
              user1.address
            );
          expect(
            await grtPool.getRequester(ethers.utils.keccak256(encodePacked))
          ).to.equal(user1.address);
        }
      });

      it("Should add a new item in the requests mapping with the proper recipient address", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              token.address,
              1000,
              chainId,
              user2.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestERC20(
              i,
              10,
              token.address,
              1000,
              chainId,
              user2.address
            );
          expect(
            await grtPool.getRecipient(ethers.utils.keccak256(encodePacked))
          ).to.equal(user2.address);
        }
      });

      it("Should set isRequest to true in the request mapping", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              token.address,
              1000,
              chainId,
              user2.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestERC20(
              i,
              10,
              token.address,
              1000,
              chainId,
              user2.address
            );
          expect(
            await grtPool.isrequest(ethers.utils.keccak256(encodePacked))
          ).to.equal(true);
        }
      });
    });

    describe("Deposit information", function () {
      it("Should provide the correct deposit token address (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              token.address,
              1000,
              chainId,
              user2.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestERC20(
              i,
              10,
              token.address,
              1000,
              chainId,
              user2.address
            );
          expect(
            await grtPool.getDepositToken(ethers.utils.keccak256(encodePacked))
          ).to.equal(grtToken.address);
        }
      });

      it("Should provide the correct deposit token amount (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              token.address,
              1000,
              chainId,
              user2.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestERC20(
              i,
              10,
              token.address,
              1000,
              chainId,
              user2.address
            );
          expect(
            await grtPool.getDepositAmount(ethers.utils.keccak256(encodePacked))
          ).to.equal(10);
        }
      });

      it("Should provide the correct deposit chain Id (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              token.address,
              1000,
              chainId,
              user2.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestERC20(
              i,
              10,
              token.address,
              1000,
              chainId,
              user2.address
            );
          expect(
            await grtPool.getDepositChainId(
              ethers.utils.keccak256(encodePacked)
            )
          ).to.equal(chainId);
        }
      });
    });

    describe("Request information", function () {
      it("Should provide the correct request token address (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              token.address,
              1000,
              chainId,
              user2.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestERC20(
              i,
              10,
              token.address,
              1000,
              chainId,
              user2.address
            );
          expect(
            await grtPool.getRequestToken(ethers.utils.keccak256(encodePacked))
          ).to.equal(token.address);
        }
      });

      it("Should provide the correct request token amount (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              token.address,
              1000,
              chainId,
              user2.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestERC20(
              i,
              10,
              token.address,
              1000,
              chainId,
              user2.address
            );
          expect(
            await grtPool.getRequestAmount(ethers.utils.keccak256(encodePacked))
          ).to.equal(1000);
        }
      });

      it("Should provide the correct request chain Id (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              token.address,
              1000,
              chainId,
              user2.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestERC20(
              i,
              10,
              token.address,
              1000,
              chainId,
              user2.address
            );
          expect(
            await grtPool.getRequestChainId(
              ethers.utils.keccak256(encodePacked)
            )
          ).to.equal(chainId);
        }
      });
    });
  });

  describe("Deposit GRT and request native tokens", function () {
    beforeEach(async function () {
      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
    });

    it("Should fail if the allowance is not high enough", async function () {
      await expect(
        grtPool
          .connect(user1)
          .depositGRTRequestNative(0, 1000, 1000, chainId, user1.address)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should fail if the deposit has already been submitted", async function () {
      await grtPool
        .connect(user1)
        .depositGRTRequestNative(0, 10, 1000, chainId, user1.address);
      await expect(
        grtPool
          .connect(user1)
          .depositGRTRequestNative(0, 10, 1000, chainId, user1.address)
      ).to.be.revertedWith("GRT pool: this nonce has already been submitted!");
    });

    it("Should emit a new deposit event", async function () {
      const encodePacked = ethers.utils.solidityPack(
        [
          "uint256",
          "address",
          "address",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "address",
        ],
        [
          0,
          user1.address,
          grtToken.address,
          10,
          chainId,
          ethers.constants.AddressZero,
          1000,
          chainId,
          user1.address,
        ]
      );
      await expect(
        await grtPool
          .connect(user1)
          .depositGRTRequestNative(0, 10, 1000, chainId, user1.address)
      )
        .to.emit(grtPool, "LogDeposit")
        .withArgs(
          ethers.utils.keccak256(encodePacked),
          grtToken.address,
          10,
          chainId
        );
    });

    it("Should emit a new request event", async function () {
      const encodePacked = ethers.utils.solidityPack(
        [
          "uint256",
          "address",
          "address",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "address",
        ],
        [
          0,
          user1.address,
          grtToken.address,
          10,
          chainId,
          ethers.constants.AddressZero,
          1000,
          chainId,
          user1.address,
        ]
      );
      await expect(
        await grtPool
          .connect(user1)
          .depositGRTRequestNative(0, 10, 1000, chainId, user1.address)
      )
        .to.emit(grtPool, "LogRequest")
        .withArgs(
          ethers.utils.keccak256(encodePacked),
          ethers.constants.AddressZero,
          1000,
          chainId
        );
    });

    describe("General information", function () {
      it("Should add a new item in the requests mapping with the proper requester", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              ethers.constants.AddressZero,
              1000,
              chainId,
              user1.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestNative(i, 10, 1000, chainId, user1.address);
          expect(
            await grtPool.getRequester(ethers.utils.keccak256(encodePacked))
          ).to.equal(user1.address);
        }
      });

      it("Should add a new item in the requests mapping with the proper recipient address", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              ethers.constants.AddressZero,
              1000,
              chainId,
              user2.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestNative(i, 10, 1000, chainId, user2.address);
          expect(
            await grtPool.getRecipient(ethers.utils.keccak256(encodePacked))
          ).to.equal(user2.address);
        }
      });

      it("Should set isRequest to true in the request mapping", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              ethers.constants.AddressZero,
              1000,
              chainId,
              user2.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestNative(i, 10, 1000, chainId, user2.address);
          expect(
            await grtPool.isrequest(ethers.utils.keccak256(encodePacked))
          ).to.equal(true);
        }
      });
    });

    describe("Deposit information", function () {
      it("Should provide the correct deposit token address (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              ethers.constants.AddressZero,
              1000,
              chainId,
              user2.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestNative(i, 10, 1000, chainId, user2.address);
          expect(
            await grtPool.getDepositToken(ethers.utils.keccak256(encodePacked))
          ).to.equal(grtToken.address);
        }
      });

      it("Should provide the correct deposit token amount (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              ethers.constants.AddressZero,
              1000,
              chainId,
              user2.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestNative(i, 10, 1000, chainId, user2.address);
          expect(
            await grtPool.getDepositAmount(ethers.utils.keccak256(encodePacked))
          ).to.equal(10);
        }
      });

      it("Should provide the correct deposit chain Id (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              ethers.constants.AddressZero,
              1000,
              chainId,
              user2.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestNative(i, 10, 1000, chainId, user2.address);
          expect(
            await grtPool.getDepositChainId(
              ethers.utils.keccak256(encodePacked)
            )
          ).to.equal(chainId);
        }
      });
    });

    describe("Request information", function () {
      it("Should provide the correct request token address (zero address in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              ethers.constants.AddressZero,
              1000,
              chainId,
              user2.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestNative(i, 10, 1000, chainId, user2.address);
          expect(
            await grtPool.getRequestToken(ethers.utils.keccak256(encodePacked))
          ).to.equal(ethers.constants.AddressZero);
        }
      });

      it("Should provide the correct request token amount (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              ethers.constants.AddressZero,
              1000,
              chainId,
              user2.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestNative(i, 10, 1000, chainId, user2.address);
          expect(
            await grtPool.getRequestAmount(ethers.utils.keccak256(encodePacked))
          ).to.equal(1000);
        }
      });

      it("Should provide the correct request chain Id (in the requests mapping)", async function () {
        for (let i = 0; i < nbrRequest; i++) {
          const encodePacked = ethers.utils.solidityPack(
            [
              "uint256",
              "address",
              "address",
              "uint256",
              "uint256",
              "address",
              "uint256",
              "uint256",
              "address",
            ],
            [
              i,
              user1.address,
              grtToken.address,
              10,
              chainId,
              ethers.constants.AddressZero,
              1000,
              chainId,
              user2.address,
            ]
          );
          await grtPool
            .connect(user1)
            .depositGRTRequestNative(i, 10, 1000, chainId, user2.address);
          expect(
            await grtPool.getRequestChainId(
              ethers.utils.keccak256(encodePacked)
            )
          ).to.equal(chainId);
        }
      });
    });
  });

  describe("Create an offer", function () {
    let requestId: string;

    beforeEach(async function () {
      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
      await grtPool
        .connect(user1)
        .depositGRTRequestNative(0, 10, 1000, chainId, user2.address);

      const encodePacked = ethers.utils.solidityPack(
        [
          "uint256",
          "address",
          "address",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "address",
        ],
        [
          0,
          user1.address,
          grtToken.address,
          10,
          chainId,
          ethers.constants.AddressZero,
          1000,
          chainId,
          user2.address,
        ]
      );

      requestId = ethers.utils.keccak256(encodePacked);

      await grtToken.connect(user2).mint(user2.address, 40000);
      await grtToken.connect(user2).approve(grtPool.address, 2000);
      await grtPool.connect(user2).stakeGRT(2);
    });

    it("Should fail if there is no request for the provided request Id", async function () {
      const encodePacked = ethers.utils.solidityPack(
        [
          "uint256",
          "address",
          "address",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "address",
        ],
        [
          3,
          user1.address,
          grtToken.address,
          10,
          chainId,
          ethers.constants.AddressZero,
          1000,
          chainId,
          user2.address,
        ]
      );

      await expect(
        grtPool
          .connect(user1)
          .createOffer(ethers.utils.keccak256(encodePacked), 1000)
      ).to.be.revertedWith("GRT pool: the request does not exist!");
    });

    it("Should fail if the user has not enough staked GRT (1 for tests)", async function () {
      await expect(
        grtPool.connect(user3).createOffer(requestId, 1000)
      ).to.be.revertedWith("GRT pool: your stake amount is not sufficient!");
    });

    it("Should emit a new offer event", async function () {
      await expect(await grtPool.connect(user2).createOffer(requestId, 1000))
        .to.emit(grtPool, "LogCreateOffer")
        .withArgs(requestId, 0);
    });

    it("Should increase the number of offers", async function () {
      for (let i = 0; i < nbrOffer; i++) {
        await grtPool.connect(user2).createOffer(requestId, 1000);
        expect(await grtPool.nbrOffersRequest(requestId)).to.equal(i + 1);
      }
    });

    describe("Mapping details", function () {
      it("Should create a new offer with the correct creator", async function () {
        for (let i = 0; i < nbrOffer; i++) {
          await grtPool.connect(user2).createOffer(requestId, 1000);
          expect(await grtPool.getOfferCreator(requestId, i)).to.equal(
            user2.address
          );
        }
      });

      it("Should create a new offer with the correct amount", async function () {
        for (let i = 0; i < nbrOffer; i++) {
          await grtPool.connect(user2).createOffer(requestId, 1000);
          expect(await grtPool.getOfferAmount(requestId, i)).to.equal(1000);
        }
      });

      it("Should create a new offer with isAccept set to false", async function () {
        for (let i = 0; i < nbrOffer; i++) {
          await grtPool.connect(user2).createOffer(requestId, 1000);
          expect(await grtPool.isOfferAccepted(requestId, i)).to.equal(false);
        }
      });

      it("Should create a new offer with isPaid set to false", async function () {
        for (let i = 0; i < nbrOffer; i++) {
          await grtPool.connect(user2).createOffer(requestId, 1000);
          expect(await grtPool.isOfferPaid(requestId, i)).to.equal(false);
        }
      });
    });
  });

  describe("Accept an offer", function () {
    let requestId: string;

    beforeEach(async function () {
      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
      await grtPool
        .connect(user1)
        .depositGRTRequestNative(0, 10, 1000, chainId, user2.address);

      const encodePacked = ethers.utils.solidityPack(
        [
          "uint256",
          "address",
          "address",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "address",
        ],
        [
          0,
          user1.address,
          grtToken.address,
          10,
          chainId,
          ethers.constants.AddressZero,
          1000,
          chainId,
          user2.address,
        ]
      );

      requestId = ethers.utils.keccak256(encodePacked);

      await grtToken.connect(user2).mint(user2.address, 40000);
      await grtToken.connect(user2).approve(grtPool.address, 2000);
      await grtPool.connect(user2).stakeGRT(2);
      await grtPool.connect(user2).createOffer(requestId, 1000);
    });

    it("Should fail if idRequest doesn't exist", async function () {
      const encodePacked = ethers.utils.solidityPack(
        [
          "uint256",
          "address",
          "address",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "address",
        ],
        [
          1,
          user1.address,
          grtToken.address,
          10,
          chainId,
          ethers.constants.AddressZero,
          1000,
          chainId,
          user2.address,
        ]
      );
      await expect(
        grtPool
          .connect(user1)
          .acceptOffer(ethers.utils.keccak256(encodePacked), 0)
      ).to.be.revertedWith("GRT pool: the request does not exist!");
    });

    it("Should fail if offerId doesn't exist for the offer corresponding to idRequest", async function () {
      await expect(
        grtPool.connect(user1).acceptOffer(requestId, 1)
      ).to.be.revertedWith("GRT pool: the offer does not exist!");
    });

    it("Should fail if the offer has already been accepted", async function () {
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await expect(
        grtPool.connect(user1).acceptOffer(requestId, 0)
      ).to.be.revertedWith("GRT pool: the offer has already been accepted!");
    });

    it("Should fail if the transaction signer is not the requester", async function () {
      await expect(
        grtPool.connect(user3).acceptOffer(requestId, 0)
      ).to.be.revertedWith("GRT pool: you are not the requester!");
    });

    it("Should fail if there is already an accepted offer for this request", async function () {
      for (let i = 0; i < nbrOffer; i++) {
        await grtPool.connect(user2).createOffer(requestId, 1000);
      }
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await expect(
        grtPool.connect(user1).acceptOffer(requestId, 2)
      ).to.be.revertedWith(
        "GRT pool: there is already an accepted offer for this request!"
      );
    });

    it("Should set isAccept to true for the corresponding request Id and offer Id", async function () {
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      expect(await grtPool.isOfferAccepted(requestId, 0)).to.equal(true);
    });

    it("Should emit an event for offer acceptance", async function () {
      await expect(await grtPool.connect(user1).acceptOffer(requestId, 0))
        .to.emit(grtPool, "LogAcceptOffer")
        .withArgs(requestId, 0);
    });

    it("Should set isAccept as true for the corresponding request Id and offer Id", async function () {
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      expect(await grtPool.isOfferAccepted(requestId, 0)).to.equal(true);
    });
  });

  describe("Reject an offer", function () {
    let requestId: string;

    beforeEach(async function () {
      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
      await grtPool
        .connect(user1)
        .depositGRTRequestNative(0, 10, 1000, chainId, user2.address);

      const encodePacked = ethers.utils.solidityPack(
        [
          "uint256",
          "address",
          "address",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "address",
        ],
        [
          0,
          user1.address,
          grtToken.address,
          10,
          chainId,
          ethers.constants.AddressZero,
          1000,
          chainId,
          user2.address,
        ]
      );

      requestId = ethers.utils.keccak256(encodePacked);

      await grtToken.connect(user2).mint(user2.address, 40000);
      await grtToken.connect(user2).approve(grtPool.address, 2000);
      await grtPool.connect(user2).stakeGRT(2);
      await grtPool.connect(user2).createOffer(requestId, 1000);
    });

    it("Should fail if the offer is not accepted yet", async function () {
      await expect(
        grtPool.connect(user1).rejectOffer(requestId, 0)
      ).to.be.revertedWith("GRT pool: the offer is not accepted yet!");
    });

    it("Should fail if the transaction signer is not the requester", async function () {
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await expect(
        grtPool.connect(user3).rejectOffer(requestId, 0)
      ).to.be.revertedWith("GRT pool: you are not the requester!");
    });

    it("Should set isAccept to false for the corresponding request Id and offer Id", async function () {
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await grtPool.connect(user1).rejectOffer(requestId, 0);
      expect(await grtPool.isOfferAccepted(requestId, 0)).to.equal(false);
    });
  });

  describe("Pay an offer on chain with an ERC20 token", function () {
    let requestId: string;

    beforeEach(async function () {
      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
      await grtPool
        .connect(user1)
        .depositGRTRequestERC20(
          0,
          10,
          token.address,
          1000,
          chainId,
          user1.address
        );

      const encodePacked = ethers.utils.solidityPack(
        [
          "uint256",
          "address",
          "address",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "address",
        ],
        [
          0,
          user1.address,
          grtToken.address,
          10,
          chainId,
          token.address,
          1000,
          chainId,
          user1.address,
        ]
      );

      requestId = ethers.utils.keccak256(encodePacked);

      await token.connect(user2).mint(user2.address, 10000);
      await token.connect(user2).approve(grtPool.address, 2000);

      await grtToken.connect(user2).mint(user2.address, 40000);
      await grtToken.connect(user2).approve(grtPool.address, 2000);
      await grtPool.connect(user2).stakeGRT(2);
      await grtPool.connect(user2).createOffer(requestId, 1000);
    });

    it("Should fail if the offer is not accepted yet", async function () {
      await expect(
        grtPool.connect(user1).payOfferOnChainERC20(requestId, 0)
      ).to.be.revertedWith("GRT pool: the offer has not been accepted yet!");
    });

    it("Should fail if the offer has already been paid", async function () {
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await grtPool.connect(user2).payOfferOnChainERC20(requestId, 0);
      await expect(
        grtPool.connect(user2).payOfferOnChainERC20(requestId, 0)
      ).to.be.revertedWith("GRT pool: the offer has already been paid!");
    });

    it("Should fail if the chain Id mentionned in the corresponding offer is not the actual chain Id", async function () {
      await grtPool
        .connect(user1)
        .depositGRTRequestERC20(1, 10, token.address, 1000, 155, user2.address);
      const encodePacked = ethers.utils.solidityPack(
        [
          "uint256",
          "address",
          "address",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "address",
        ],
        [
          1,
          user1.address,
          grtToken.address,
          10,
          chainId,
          token.address,
          1000,
          155,
          user2.address,
        ]
      );
      await grtPool
        .connect(user2)
        .createOffer(ethers.utils.keccak256(encodePacked), 1000);
      await grtPool
        .connect(user1)
        .acceptOffer(ethers.utils.keccak256(encodePacked), 0);
      await expect(
        grtPool
          .connect(user2)
          .payOfferOnChainERC20(ethers.utils.keccak256(encodePacked), 0)
      ).to.be.revertedWith(
        "GRT pool: the offer should not be paid on this chain!"
      );
    });

    it("Should fail if the transaction signer is not the one who made the offer", async function () {
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await expect(
        grtPool.connect(user3).payOfferOnChainERC20(requestId, 0)
      ).to.be.revertedWith("GRT pool: you are not allowed to pay this offer!");
    });

    it("Should increase the token amount of the recipient", async function () {
      const recipient = await grtPool.getRecipient(requestId);
      const expectedTokenBalanceRecipient = await token.balanceOf(recipient);
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await grtPool.connect(user2).payOfferOnChainERC20(requestId, 0);
      expect(await token.balanceOf(recipient)).to.equal(
        expectedTokenBalanceRecipient.add(ethers.BigNumber.from(1000))
      );
    });

    it("Should decrease the token amount of the seller", async function () {
      const expectedGRTBalanceSeller = await token.balanceOf(user2.address);
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await grtPool.connect(user2).payOfferOnChainERC20(requestId, 0);
      expect(await token.balanceOf(user2.address)).to.equal(
        expectedGRTBalanceSeller.sub(ethers.BigNumber.from(1000))
      );
    });

    it("Should generate a reward in GRT for the seller", async function () {
      const expectedGRTBalanceSeller = await grtToken.balanceOf(user2.address);
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await grtPool.connect(user2).payOfferOnChainERC20(requestId, 0);
      expect(await grtToken.balanceOf(user2.address)).to.equal(
        expectedGRTBalanceSeller.add(ethers.BigNumber.from(10))
      );
    });

    it("Should decrease the GRT balance of the GRT pool", async function () {
      const expectedGRTBalancePool = await grtToken.balanceOf(grtPool.address);
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await grtPool.connect(user2).payOfferOnChainERC20(requestId, 0);
      expect(await grtToken.balanceOf(grtPool.address)).to.equal(
        expectedGRTBalancePool.sub(ethers.BigNumber.from(10))
      );
    });

    it("Should emit an event to declare the paid offer", async function () {
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await expect(
        await grtPool.connect(user2).payOfferOnChainERC20(requestId, 0)
      )
        .to.emit(grtPool, "LogOfferPaidOnChain")
        .withArgs(requestId, 0);
    });

    it("Should set isPaid as true", async function () {
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await grtPool.connect(user2).payOfferOnChainERC20(requestId, 0);
      expect(await grtPool.isOfferPaid(requestId, 0)).to.equal(true);
    });
  });

  describe("Pay an offer on chain with native token", function () {
    let requestId: string;

    beforeEach(async function () {
      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
      await grtPool
        .connect(user1)
        .depositGRTRequestNative(
          0,
          10,
          ethers.utils.parseEther("2"),
          chainId,
          user1.address
        );

      const encodePacked = ethers.utils.solidityPack(
        [
          "uint256",
          "address",
          "address",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "address",
        ],
        [
          0,
          user1.address,
          grtToken.address,
          10,
          chainId,
          ethers.constants.AddressZero,
          ethers.utils.parseEther("2"),
          chainId,
          user1.address,
        ]
      );

      requestId = ethers.utils.keccak256(encodePacked);

      await grtToken.connect(user2).mint(user2.address, 40000);
      await grtToken.connect(user2).approve(grtPool.address, 2000);
      await grtPool.connect(user2).stakeGRT(2);
      await grtPool
        .connect(user2)
        .createOffer(requestId, ethers.utils.parseEther("2"));
    });

    it("Should fail if the offer is not accepted yet", async function () {
      await expect(
        grtPool.connect(user1).payOfferOnChainNative(requestId, 0)
      ).to.be.revertedWith("GRT pool: the offer has not been accepted yet!");
    });

    it("Should fail if the offer has already been paid", async function () {
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await grtPool.connect(user2).payOfferOnChainNative(requestId, 0, {
        value: ethers.utils.parseEther("2"),
      });
      await expect(
        grtPool.connect(user2).payOfferOnChainNative(requestId, 0, {
          value: ethers.utils.parseEther("2"),
        })
      ).to.be.revertedWith("GRT pool: the offer has already been paid!");
    });

    it("Should fail if the chain Id mentionned in the corresponding offer is not the actual chain Id", async function () {
      await grtPool
        .connect(user1)
        .depositGRTRequestNative(
          1,
          10,
          ethers.utils.parseEther("2"),
          155,
          user2.address
        );
      const encodePacked = ethers.utils.solidityPack(
        [
          "uint256",
          "address",
          "address",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "address",
        ],
        [
          1,
          user1.address,
          grtToken.address,
          10,
          chainId,
          ethers.constants.AddressZero,
          ethers.utils.parseEther("2"),
          155,
          user2.address,
        ]
      );

      await grtPool
        .connect(user2)
        .createOffer(
          ethers.utils.keccak256(encodePacked),
          ethers.utils.parseEther("2")
        );
      await grtPool
        .connect(user1)
        .acceptOffer(ethers.utils.keccak256(encodePacked), 0);
      await expect(
        grtPool
          .connect(user2)
          .payOfferOnChainNative(ethers.utils.keccak256(encodePacked), 0)
      ).to.be.revertedWith(
        "GRT pool: the offer should not be paid on this chain!"
      );
    });

    it("Should fail if msg.value is not the promised amount", async function () {
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await expect(
        grtPool.connect(user2).payOfferOnChainNative(requestId, 0, {
          value: ethers.utils.parseEther("1"),
        })
      ).to.be.revertedWith("GRT pool: the amount does not match the offer!");
    });

    it("Should fail if the transaction signer is not the one who made the offer", async function () {
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await expect(
        grtPool.connect(user3).payOfferOnChainNative(requestId, 0, {
          value: ethers.utils.parseEther("2"),
        })
      ).to.be.revertedWith("GRT pool: you are not allowed to pay this offer!");
    });

    it("Should increase the native token balance of the recipient", async function () {
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      const recipient = await grtPool.getRecipient(requestId);
      const expectedRecipientBalance = await ethers.provider.getBalance(
        recipient
      );
      await grtPool.connect(user2).payOfferOnChainNative(requestId, 0, {
        value: ethers.utils.parseEther("2"),
      });
      expect(await ethers.provider.getBalance(recipient)).to.equal(
        expectedRecipientBalance.add(
          ethers.BigNumber.from(ethers.utils.parseEther("2"))
        )
      );
    });

    it("Should decrease the native token balance of the seller", async function () {
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      let expectedUser2Balance = await ethers.provider.getBalance(
        user2.address
      );
      const tx = await grtPool
        .connect(user2)
        .payOfferOnChainNative(requestId, 0, {
          value: ethers.utils.parseEther("2"),
        });
      const receipt = await tx.wait();
      const gasCostForTxn = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      expectedUser2Balance = expectedUser2Balance.sub(gasCostForTxn);
      expect(await ethers.provider.getBalance(user2.address)).to.equal(
        expectedUser2Balance.sub(
          ethers.BigNumber.from(ethers.utils.parseEther("2"))
        )
      );
    });

    it("Should generate a reward in GRT for the seller", async function () {
      const expectedGRTBalanceSeller = await grtToken.balanceOf(user2.address);
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await grtPool.connect(user2).payOfferOnChainNative(requestId, 0, {
        value: ethers.utils.parseEther("2"),
      });
      expect(await grtToken.balanceOf(user2.address)).to.equal(
        expectedGRTBalanceSeller.add(ethers.BigNumber.from(10))
      );
    });

    it("Should decrease the GRT balance of the GRT pool", async function () {
      const expectedGRTBalancePool = await grtToken.balanceOf(grtPool.address);
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await grtPool.connect(user2).payOfferOnChainNative(requestId, 0, {
        value: ethers.utils.parseEther("2"),
      });
      expect(await grtToken.balanceOf(grtPool.address)).to.equal(
        expectedGRTBalancePool.sub(ethers.BigNumber.from(10))
      );
    });

    it("Should emit an event to declare the paid offer", async function () {
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await expect(
        await grtPool.connect(user2).payOfferOnChainNative(requestId, 0, {
          value: ethers.utils.parseEther("2"),
        })
      )
        .to.emit(grtPool, "LogOfferPaidOnChain")
        .withArgs(requestId, 0);
    });

    it("Should set isPaid as true", async function () {
      await grtPool.connect(user1).acceptOffer(requestId, 0);
      await grtPool.connect(user2).payOfferOnChainNative(requestId, 0, {
        value: ethers.utils.parseEther("2"),
      });
      expect(await grtPool.isOfferPaid(requestId, 0)).to.equal(true);
    });
  });

  describe("Claim GRT without dispute", function () {
    let requestId: string;
    let requestId1: string;

    beforeEach(async function () {
      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
      await grtPool
        .connect(user1)
        .depositGRTRequestNative(
          0,
          10,
          ethers.utils.parseEther("2"),
          chainId,
          user1.address
        );

      const encodePacked = ethers.utils.solidityPack(
        [
          "uint256",
          "address",
          "address",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "address",
        ],
        [
          0,
          user1.address,
          grtToken.address,
          10,
          chainId,
          ethers.constants.AddressZero,
          ethers.utils.parseEther("2"),
          chainId,
          user1.address,
        ]
      );

      requestId = ethers.utils.keccak256(encodePacked);

      await grtPool
        .connect(user1)
        .depositGRTRequestERC20(
          1,
          10,
          token.address,
          1000,
          chainId,
          user1.address
        );

      const encodePacked1 = ethers.utils.solidityPack(
        [
          "uint256",
          "address",
          "address",
          "uint256",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "address",
        ],
        [
          1,
          user1.address,
          grtToken.address,
          10,
          chainId,
          token.address,
          1000,
          chainId,
          user1.address,
        ]
      );

      requestId1 = ethers.utils.keccak256(encodePacked1);

      await grtToken.connect(user2).mint(user2.address, 40000);
      await grtToken.connect(user2).approve(grtPool.address, 2000);
      await grtPool.connect(user2).stakeGRT(2);
      await grtPool
        .connect(user2)
        .createOffer(requestId, ethers.utils.parseEther("2"));
      await grtPool.connect(user2).createOffer(requestId1, 1000);
    });

    describe("Native tokens", function () {
      it("Should fail if the request doesn't exist", async function () {
        await grtPool.connect(user1).acceptOffer(requestId, 0);
        grtSatellite.connect(user2).payOfferCrossChainNative(user1.address, {
          value: ethers.utils.parseEther("2"),
        });
        const encodePacked = ethers.utils.solidityPack(
          [
            "uint256",
            "address",
            "address",
            "uint256",
            "uint256",
            "address",
            "uint256",
            "uint256",
            "address",
          ],
          [
            10,
            user1.address,
            grtToken.address,
            10,
            chainId,
            ethers.constants.AddressZero,
            ethers.utils.parseEther("2"),
            chainId,
            user1.address,
          ]
        );
        await expect(
          grtPool
            .connect(user2)
            .claimGRTWithoutDispute(ethers.utils.keccak256(encodePacked), 0)
        ).to.be.revertedWith("GRT pool: the request does not exist!");
      });

      it("Should fail if the offer has not yet been accepted", async function () {
        await expect(
          grtPool.connect(user2).claimGRTWithoutDispute(requestId, 0)
        ).to.be.revertedWith("GRT pool: the offer has not been accepted yet!");
      });

      it("Should fail if the offer has already been paid", async function () {
        await grtPool.connect(user1).acceptOffer(requestId, 0);
        grtSatellite.connect(user2).payOfferCrossChainNative(user1.address, {
          value: ethers.utils.parseEther("2"),
        });
        grtPool.connect(user2).claimGRTWithoutDispute(requestId, 0);
        await expect(
          grtPool.connect(user2).claimGRTWithoutDispute(requestId, 0)
        ).to.be.revertedWith("GRT pool: the offer has already been paid!");
      });

      it("Should fail if the transaction signer is not the one who made the corresponding offer", async function () {
        await grtPool.connect(user1).acceptOffer(requestId, 0);
        grtSatellite.connect(user2).payOfferCrossChainNative(user1.address, {
          value: ethers.utils.parseEther("2"),
        });
        await expect(
          grtPool.connect(user3).claimGRTWithoutDispute(requestId, 0)
        ).to.be.revertedWith(
          "GRT pool: you are not allowed to make this claim!"
        );
      });

      it("Should generate a GRT reward for the transaction signer", async function () {
        await grtPool.connect(user1).acceptOffer(requestId, 0);
        const expectedGRTBalanceSeller = await grtToken.balanceOf(
          user2.address
        );
        grtSatellite.connect(user2).payOfferCrossChainNative(user1.address, {
          value: ethers.utils.parseEther("2"),
        });
        await grtPool.connect(user2).claimGRTWithoutDispute(requestId, 0);
        expect(await grtToken.balanceOf(user2.address)).to.equal(
          expectedGRTBalanceSeller.add(ethers.BigNumber.from(10))
        );
      });

      it("Should decrease the GRT balance for the GRT pool", async function () {
        await grtPool.connect(user1).acceptOffer(requestId, 0);
        const expectedGRTBalancePool = await grtToken.balanceOf(
          grtPool.address
        );
        grtSatellite.connect(user2).payOfferCrossChainNative(user1.address, {
          value: ethers.utils.parseEther("2"),
        });
        await grtPool.connect(user2).claimGRTWithoutDispute(requestId, 0);
        expect(await grtToken.balanceOf(grtPool.address)).to.equal(
          expectedGRTBalancePool.sub(ethers.BigNumber.from(10))
        );
      });

      it("A successful GRT reward for the transaction signer should emit an event", async function () {
        await grtPool.connect(user1).acceptOffer(requestId, 0);
        grtSatellite.connect(user2).payOfferCrossChainNative(user1.address, {
          value: ethers.utils.parseEther("2"),
        });
        await expect(
          await grtPool.connect(user2).claimGRTWithoutDispute(requestId, 0)
        )
          .to.emit(grtPool, "LogOfferPaidCrossChain")
          .withArgs(requestId, 0);
      });

      it("Should set isPaid as true", async function () {
        await grtPool.connect(user1).acceptOffer(requestId, 0);
        grtSatellite.connect(user2).payOfferCrossChainNative(user1.address, {
          value: ethers.utils.parseEther("2"),
        });
        await grtPool.connect(user2).claimGRTWithoutDispute(requestId, 0);
        expect(await grtPool.isOfferPaid(requestId, 0)).to.equal(true);
      });
    });

    describe("ERC20 tokens", function () {
      it("Should fail if the request doesn't exist", async function () {
        await grtPool.connect(user1).acceptOffer(requestId1, 0);
        grtSatellite
          .connect(user2)
          .payOfferCrossChainERC20(token.address, user1.address, 1000);

        const encodePacked = ethers.utils.solidityPack(
          [
            "uint256",
            "address",
            "address",
            "uint256",
            "uint256",
            "address",
            "uint256",
            "uint256",
            "address",
          ],
          [
            10,
            user1.address,
            grtToken.address,
            10,
            chainId,
            ethers.constants.AddressZero,
            ethers.utils.parseEther("2"),
            chainId,
            user1.address,
          ]
        );

        await expect(
          grtPool
            .connect(user2)
            .claimGRTWithoutDispute(ethers.utils.keccak256(encodePacked), 0)
        ).to.be.revertedWith("GRT pool: the request does not exist!");
      });

      it("Should fail if the offer has not yet been accepted", async function () {
        // grtSatellite.connect(user2).payOfferCrossChainERC20(token.address, user1.address, 1000);
        // grtPool.claimGRTWithoutDispute(requestId1, 0);
        await expect(
          grtPool.connect(user2).claimGRTWithoutDispute(requestId1, 0)
        ).to.be.revertedWith("GRT pool: the offer has not been accepted yet!");
      });

      it("Should fail if the offer has already been paid", async function () {
        await grtPool.connect(user1).acceptOffer(requestId1, 0);
        grtSatellite
          .connect(user2)
          .payOfferCrossChainERC20(token.address, user1.address, 1000);
        grtPool.connect(user2).claimGRTWithoutDispute(requestId1, 0);
        await expect(
          grtPool.connect(user2).claimGRTWithoutDispute(requestId1, 0)
        ).to.be.revertedWith("GRT pool: the offer has already been paid!");
      });

      it("Should fail if the transaction signer is not the one who made the corresponding offer", async function () {
        await grtPool.connect(user1).acceptOffer(requestId1, 0);
        grtSatellite
          .connect(user2)
          .payOfferCrossChainERC20(token.address, user1.address, 1000);
        await expect(
          grtPool.connect(user3).claimGRTWithoutDispute(requestId1, 0)
        ).to.be.revertedWith(
          "GRT pool: you are not allowed to make this claim!"
        );
      });

      it("Should generate a GRT reward for the transaction signer", async function () {
        await grtPool.connect(user1).acceptOffer(requestId1, 0);
        const expectedGRTBalanceSeller = await grtToken.balanceOf(
          user2.address
        );
        grtSatellite
          .connect(user2)
          .payOfferCrossChainERC20(token.address, user1.address, 1000);
        await grtPool.connect(user2).claimGRTWithoutDispute(requestId1, 0);
        expect(await grtToken.balanceOf(user2.address)).to.equal(
          expectedGRTBalanceSeller.add(ethers.BigNumber.from(10))
        );
      });

      it("Should decrease the GRT balance for the GRT pool", async function () {
        await grtPool.connect(user1).acceptOffer(requestId1, 0);
        const expectedGRTBalancePool = await grtToken.balanceOf(
          grtPool.address
        );
        grtSatellite
          .connect(user2)
          .payOfferCrossChainERC20(token.address, user1.address, 1000);
        await grtPool.connect(user2).claimGRTWithoutDispute(requestId1, 0);
        expect(await grtToken.balanceOf(grtPool.address)).to.equal(
          expectedGRTBalancePool.sub(ethers.BigNumber.from(10))
        );
      });

      it("A successful GRT reward for the transaction signer should emit an event", async function () {
        await grtPool.connect(user1).acceptOffer(requestId1, 0);
        grtSatellite
          .connect(user2)
          .payOfferCrossChainERC20(token.address, user1.address, 1000);
        await expect(
          await grtPool.connect(user2).claimGRTWithoutDispute(requestId1, 0)
        )
          .to.emit(grtPool, "LogOfferPaidCrossChain")
          .withArgs(requestId1, 0);
      });

      it("Should set isPaid as true", async function () {
        await grtPool.connect(user1).acceptOffer(requestId1, 0);
        grtSatellite
          .connect(user2)
          .payOfferCrossChainERC20(token.address, user1.address, 1000);
        await grtPool.connect(user2).claimGRTWithoutDispute(requestId1, 0);
        expect(await grtPool.isOfferPaid(requestId1, 0)).to.equal(true);
      });
    });
  });
});
