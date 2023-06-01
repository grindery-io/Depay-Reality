import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';

describe('Grindery Offer testings', function () {
  const chainId = 31337;

  let owner: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress,
    user3: SignerWithAddress,
    user4: SignerWithAddress,
    grtPool: Contract,
    grtToken: Contract,
    token: Contract,
    offerId: string;

  beforeEach(async function () {
    [owner, user1, user2, user3, user4] = await ethers.getSigners();

    grtPool = await upgrades.deployProxy(
      await ethers.getContractFactory('contracts/v1/GrtPool.sol:GrtPool'),
      []
    );
    await grtPool.deployed();

    grtToken = await (await ethers.getContractFactory('ERC20Sample')).deploy();
    await grtToken.deployed();

    token = await (await ethers.getContractFactory('ERC20Sample')).deploy();
    await token.deployed();
  });

  describe('Initialization', function () {
    it('Should set the proper owner', async function () {
      expect(await grtPool.owner()).to.equal(owner.address);
    });
  });

  describe('Deposit ETH and accept an offer', function () {
    beforeEach(async function () {
      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
      await grtToken.connect(user2).mint(user2.address, 10000);
      await grtToken.connect(user2).approve(grtPool.address, 500);
      offerId = ethers.utils.keccak256(
        ethers.utils.solidityPack(['address', 'uint256'], [user1.address, 0])
      );
      await grtPool
        .connect(user1)
        .setOffer(
          token.address,
          chainId,
          ethers.utils.defaultAbiCoder.encode(
            ['string', 'string'],
            ['FIRA', '100']
          ),
          ethers.utils.defaultAbiCoder.encode(
            ['string', 'string'],
            ['FIRA', '1000']
          )
        );
    });

    it('Should fail if the deposit amount is 0', async function () {
      await grtPool.connect(user1).setIsActive(offerId, false);
      await expect(
        grtPool
          .connect(user3)
          .depositETHAndAcceptOffer(offerId, user3.address, 10, {
            value: 0,
          })
      ).to.be.revertedWith(
        'Grindery Pool: transfered amount must be positive.'
      );
    });

    it('Should fail if the offer is inactive', async function () {
      await grtPool.connect(user1).setIsActive(offerId, false);
      await expect(
        grtPool
          .connect(user3)
          .depositETHAndAcceptOffer(offerId, user3.address, 10, {
            value: 100,
          })
      ).to.be.revertedWith('Grindery Pool: the offer is inactive.');
    });

    it('Should fail if the destination address is the zero address', async function () {
      await grtPool.connect(user1).setIsActive(offerId, false);
      await expect(
        grtPool
          .connect(user3)
          .depositETHAndAcceptOffer(offerId, ethers.constants.AddressZero, 10, {
            value: 100,
          })
      ).to.be.revertedWith(
        'Grindery Pool: zero address as destination address is not allowed.'
      );
    });

    it('Should decrease the native token balance of the user', async function () {
      let expectedBalance = await ethers.provider.getBalance(user2.address);
      const tx = await (
        await grtPool
          .connect(user2)
          .depositETHAndAcceptOffer(offerId, user2.address, 10, {
            value: 250,
          })
      ).wait();
      expectedBalance = expectedBalance.sub(
        tx.gasUsed.mul(tx.effectiveGasPrice)
      );
      expectedBalance = expectedBalance.sub(ethers.BigNumber.from(250));
      expect(await ethers.provider.getBalance(user2.address)).to.equal(
        expectedBalance
      );
    });

    it('Should increase the native token balance of the pool contract', async function () {
      let expectedBalance = await ethers.provider.getBalance(grtPool.address);
      await (
        await grtPool
          .connect(user2)
          .depositETHAndAcceptOffer(offerId, user2.address, 10, {
            value: 250,
          })
      ).wait();
      expectedBalance = expectedBalance.add(ethers.BigNumber.from(250));
      expect(await ethers.provider.getBalance(grtPool.address)).to.equal(
        expectedBalance
      );
    });

    it('Should emit a new trade event', async function () {
      await expect(
        await grtPool
          .connect(user2)
          .depositETHAndAcceptOffer(offerId, user2.address, 10, {
            value: 100,
          })
      )
        .to.emit(grtPool, 'LogTrade')
        .withArgs(
          user1.address,
          ethers.utils.keccak256(
            ethers.utils.solidityPack(
              ['address', 'uint256'],
              [user2.address, 0]
            )
          ),
          ethers.constants.AddressZero,
          100,
          offerId
        );
    });

    it('Should emit new trade event with TradeId different for each call', async function () {
      await (
        await grtPool
          .connect(user2)
          .depositETHAndAcceptOffer(offerId, user2.address, 10, {
            value: 100,
          })
      ).wait();

      await (
        await grtPool
          .connect(user2)
          .depositETHAndAcceptOffer(offerId, user2.address, 10, {
            value: 100,
          })
      ).wait();
      await expect(
        await grtPool
          .connect(user2)
          .depositETHAndAcceptOffer(offerId, user2.address, 10, {
            value: 100,
          })
      )
        .to.emit(grtPool, 'LogTrade')
        .withArgs(
          user1.address,
          ethers.utils.keccak256(
            ethers.utils.solidityPack(
              ['address', 'uint256'],
              [user2.address, 2]
            )
          ),
          ethers.constants.AddressZero,
          100,
          offerId
        );
    });

    it('Should set the deposit user', async function () {
      await grtPool
        .connect(user2)
        .depositETHAndAcceptOffer(offerId, user2.address, 10, {
          value: 100,
        });
      expect(
        await grtPool.getRequester(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(
              ['address', 'uint256'],
              [user2.address, 0]
            )
          )
        )
      ).to.equal(user2.address);
    });

    it('Should set the destination address', async function () {
      await grtPool
        .connect(user2)
        .depositETHAndAcceptOffer(offerId, user4.address, 10, {
          value: 100,
        });
      expect(
        await grtPool.getRecipient(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(
              ['address', 'uint256'],
              [user2.address, 0]
            )
          )
        )
      ).to.equal(user4.address);
    });

    it('Should set the GRT token address for the deposit', async function () {
      await grtPool
        .connect(user2)
        .depositETHAndAcceptOffer(offerId, user4.address, 10, {
          value: 100,
        });
      expect(
        await grtPool.getDepositToken(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(
              ['address', 'uint256'],
              [user2.address, 0]
            )
          )
        )
      ).to.equal(ethers.constants.AddressZero);
    });

    it('Should set the GRT amount for the deposit', async function () {
      await grtPool
        .connect(user2)
        .depositETHAndAcceptOffer(offerId, user4.address, 10, {
          value: 100,
        });
      expect(
        await grtPool.getDepositAmount(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(
              ['address', 'uint256'],
              [user2.address, 0]
            )
          )
        )
      ).to.equal(100);
    });

    it('Should set the offer amount', async function () {
      await grtPool
        .connect(user2)
        .depositETHAndAcceptOffer(offerId, user4.address, 10, {
          value: 100,
        });
      expect(
        await grtPool.getAmountOffer(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(
              ['address', 'uint256'],
              [user2.address, 0]
            )
          )
        )
      ).to.equal(10);
    });

    it('Should set the chainId for the deposit', async function () {
      await grtPool
        .connect(user2)
        .depositETHAndAcceptOffer(offerId, user4.address, 10, {
          value: 100,
        });
      expect(
        await grtPool.getDepositChainId(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(
              ['address', 'uint256'],
              [user2.address, 0]
            )
          )
        )
      ).to.equal(chainId);
    });

    it('Should set the offerId', async function () {
      await grtPool
        .connect(user2)
        .depositETHAndAcceptOffer(offerId, user4.address, 10, {
          value: 100,
        });
      expect(
        await grtPool.getIdOffer(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(
              ['address', 'uint256'],
              [user2.address, 0]
            )
          )
        )
      ).to.equal(offerId);
    });

    it('Should increase the deposit nonce of the user by 1', async function () {
      await grtPool
        .connect(user2)
        .depositETHAndAcceptOffer(offerId, user4.address, 10, {
          value: 100,
        });
      await grtPool
        .connect(user2)
        .depositETHAndAcceptOffer(offerId, user4.address, 10, {
          value: 100,
        });
      expect(await grtPool.getNonceDeposit(user2.address)).to.equal(2);
    });
  });

  describe('Withdraw Native tokens from pool', function () {
    beforeEach(async function () {
      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
      await grtToken.connect(user2).mint(user2.address, 10000);
      await grtToken.connect(user2).approve(grtPool.address, 500);
      offerId = ethers.utils.keccak256(
        ethers.utils.solidityPack(['address', 'uint256'], [user1.address, 0])
      );
      await grtPool
        .connect(user1)
        .setOffer(
          token.address,
          chainId,
          ethers.utils.defaultAbiCoder.encode(
            ['string', 'string'],
            ['FIRA', '100']
          ),
          ethers.utils.defaultAbiCoder.encode(
            ['string', 'string'],
            ['FIRA', '1000']
          )
        );
      await grtPool
        .connect(user3)
        .depositETHAndAcceptOffer(offerId, user3.address, 10, {
          value: 2,
        });
    });

    it('Should fail if msg.sender is not the Owner', async function () {
      await expect(grtPool.connect(user3).withdraw(1)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );
    });

    it('Should fail if the required amount is higher than the contract balance', async function () {
      await expect(grtPool.connect(owner).withdraw(10)).to.be.revertedWith(
        'Grindery Pool: insufficient balance.'
      );
    });

    it('Should decrease the contract balance', async function () {
      await grtPool.connect(owner).withdraw(1);
      expect(await ethers.provider.getBalance(grtPool.address)).to.equal(2 - 1);
    });

    it('Should increase the balance of the owner', async function () {
      let expectedBalance = await ethers.provider.getBalance(owner.address);
      const tx = await (await grtPool.connect(owner).withdraw(1)).wait();
      expectedBalance = expectedBalance.sub(
        tx.gasUsed.mul(tx.effectiveGasPrice)
      );
      expectedBalance = expectedBalance.add(ethers.BigNumber.from(1));
      expect(await ethers.provider.getBalance(owner.address)).to.equal(
        expectedBalance
      );
    });
  });
});
